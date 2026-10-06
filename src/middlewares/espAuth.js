const crypto = require('crypto');
const config = require('../config');

/**
 * ESP32 设备鉴权中间件
 *
 * 说明：ESP 设备没有账号体系，不能走 JWT。这里采用「设备密钥 + HMAC-SHA256 签名」的方式，
 * 密钥只保存在设备固件和服务端，不在网络中传输，即使抓包也无法伪造请求。
 *
 * 请求头：
 *   X-ESP-Key        设备标识（明文，对应 ESP_ACCESS_KEY）
 *   X-ESP-Timestamp  毫秒级 Unix 时间戳（用于防重放）
 *   X-ESP-Signature  HMAC-SHA256 签名，十六进制小写
 *
 * 签名串（\n 分隔）：
 *   METHOD\n{path}\n{query}\n{timestamp}\n{accessKey}
 * 例：
 *   GET\n/api/search/esp\nmsg=%E6%99%B4%E5%A4%A9\n1730000000000\nesp32_device_01
 *（query 为 URL 编码后的原始查询串，顺序与请求 URL 保持一致）
 *
 * 兼容简易模式：若配置了 ESP_STATIC_TOKEN，设备可直接携带 X-ESP-Token 访问
 *（密钥会随每个请求明文传输，仅建议本地调试使用，生产环境请留空）。
 */

const HEADER_KEY = 'x-esp-key';
const HEADER_TIMESTAMP = 'x-esp-timestamp';
const HEADER_SIGNATURE = 'x-esp-signature';
const HEADER_TOKEN = 'x-esp-token';

// 已使用过的签名（防重放），signature -> 过期时间戳(ms)
const usedSignatures = new Map();
const MAX_CACHE_SIZE = 5000;

/**
 * 常量时间字符串比较，避免时序攻击
 */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * 规范化路径：去掉结尾多余的斜杠，保证 /api/search/esp 与 /api/search/esp/ 签名一致
 */
function normalizePath(pathname) {
  if (!pathname || pathname === '/') {
    return '/';
  }
  return pathname.replace(/\/+$/, '');
}

/**
 * 清理过期的签名缓存
 */
function clearExpiredSignatures(now) {
  if (usedSignatures.size < MAX_CACHE_SIZE) {
    return;
  }
  for (const [signature, expireAt] of usedSignatures) {
    if (expireAt <= now) {
      usedSignatures.delete(signature);
    }
  }
  // 仍然爆满（例如短时间内大量请求）时，丢掉最早写入的一批
  if (usedSignatures.size >= MAX_CACHE_SIZE) {
    const overflow = usedSignatures.size - Math.floor(MAX_CACHE_SIZE / 2);
    let removed = 0;
    for (const signature of usedSignatures.keys()) {
      usedSignatures.delete(signature);
      if (++removed >= overflow) break;
    }
  }
}

/**
 * 统一返回 401，并附带服务器时间，方便设备校正时钟
 */
function reject(res, msg) {
  console.warn(`[EspAuth] 拒绝访问: ${msg} (ip=${res.req ? res.req.ip : '-'})`);
  return res.status(401).json({
    code: 401,
    msg,
    data: { serverTime: Date.now() },
  });
}

/**
 * ESP32 设备鉴权中间件
 */
function espAuthMiddleware(req, res, next) {
  const { accessKey, accessSecret, signatureTtl, staticToken } = config.esp;

  if (!accessKey || !accessSecret) {
    console.error('[EspAuth] 未配置 ESP_ACCESS_KEY / ESP_ACCESS_SECRET，拒绝所有 ESP 请求');
    return res.status(500).json({
      code: 500,
      msg: '服务端未配置 ESP 设备密钥',
      data: null,
    });
  }

  // 简易模式：静态令牌（仅在显式配置 ESP_STATIC_TOKEN 时启用）
  const token = req.get(HEADER_TOKEN);
  if (staticToken && token) {
    if (!safeEqual(token, staticToken)) {
      return reject(res, '设备令牌无效');
    }
    req.esp = { key: 'static-token', mode: 'static' };
    return next();
  }

  // 标准模式：设备密钥 + 签名
  const key = req.get(HEADER_KEY);
  const timestamp = req.get(HEADER_TIMESTAMP);
  const signature = req.get(HEADER_SIGNATURE);

  if (!key || !timestamp || !signature) {
    return reject(res, '缺少设备鉴权请求头');
  }

  if (!safeEqual(key, accessKey)) {
    return reject(res, '设备标识无效');
  }

  // 时间戳支持秒 / 毫秒两种精度
  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum)) {
    return reject(res, '设备时间戳格式错误');
  }
  const tsMs = tsNum < 1e12 ? tsNum * 1000 : tsNum;

  const now = Date.now();
  const ttlMs = signatureTtl * 1000;
  if (Math.abs(now - tsMs) > ttlMs) {
    return reject(res, '设备时间戳已过期，请同步设备时钟');
  }

  // 构造待签名字符串（使用原始查询串，顺序与设备端保持一致）
  const originalUrl = req.originalUrl || '';
  const queryIndex = originalUrl.indexOf('?');
  const rawQuery = queryIndex >= 0 ? originalUrl.slice(queryIndex + 1).split('#')[0] : '';
  const canonical = [
    req.method.toUpperCase(),
    normalizePath((req.baseUrl || '') + (req.path || '')),
    rawQuery,
    String(tsMs),
    accessKey,
  ].join('\n');

  const expected = crypto
    .createHmac('sha256', accessSecret)
    .update(canonical)
    .digest('hex');

  if (!safeEqual(signature.toLowerCase(), expected)) {
    return reject(res, '签名校验失败');
  }

  // 防重放：同一个签名只能使用一次
  clearExpiredSignatures(now);
  if (usedSignatures.has(expected)) {
    return reject(res, '签名已被使用');
  }
  usedSignatures.set(expected, tsMs + ttlMs * 2);

  req.esp = { key, mode: 'hmac', timestamp: tsMs };
  next();
}

module.exports = {
  espAuthMiddleware,
};
