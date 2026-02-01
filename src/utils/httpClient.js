const axios = require('axios');

/**
 * HTTP 请求客户端封装
 */
const httpClient = axios.create({
  timeout: 30000, // 30秒超时
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

// 请求拦截器
httpClient.interceptors.request.use(
  (config) => {
    console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[HTTP] 请求错误:', error.message);
    return Promise.reject(error);
  }
);

// 响应拦截器
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[HTTP] 响应错误: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('[HTTP] 无响应:', error.message);
    } else {
      console.error('[HTTP] 请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * GET 请求
 * @param {string} url - 请求地址
 * @param {Object} [params] - 查询参数
 * @param {Object} [config] - axios 配置
 * @returns {Promise<any>}
 */
async function get(url, params = {}, config = {}) {
  const response = await httpClient.get(url, { params, ...config });
  let data = response.data;

  // 如果返回的是字符串，尝试解析为 JSON
  if (typeof data === 'string') {
    try {
      // 移除可能的 BOM 和空白字符
      data = data.trim().replace(/^\uFEFF/, '');
      // 尝试解析 JSON
      data = JSON.parse(data);
    } catch (e) {
      // 酷我 API 返回的是单引号的类 JSON 格式，需要转换为标准 JSON
      try {
        // 将单引号替换为双引号（需要处理嵌套引号的情况）
        const fixedJson = data
          .replace(/'/g, '"')  // 将所有单引号替换为双引号
          .replace(/""(\w+)"":/g, '"$1":');  // 修复可能的重复引号
        data = JSON.parse(fixedJson);
        console.log('[HTTP] 使用单引号转换成功解析 JSON');
      } catch (e2) {
        console.warn('[HTTP] 响应数据不是有效的 JSON:', e.message);
      }
    }
  }

  return data;
}

/**
 * POST 请求
 * @param {string} url - 请求地址
 * @param {Object} [data] - 请求体数据
 * @param {Object} [config] - axios 配置
 * @returns {Promise<any>}
 */
async function post(url, data = {}, config = {}) {
  const response = await httpClient.post(url, data, config);
  return response.data;
}

/**
 * 下载文件
 * @param {string} url - 文件地址
 * @param {Object} [config] - axios 配置
 * @returns {Promise<Buffer>}
 */
async function downloadFile(url, config = {}) {
  const response = await httpClient.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000, // 下载文件超时时间设为 2 分钟
    headers: {
      'Accept': 'audio/*,*/*;q=0.8',
      'Referer': 'http://www.kuwo.cn/',
    },
    ...config,
  });
  return Buffer.from(response.data);
}

module.exports = {
  httpClient,
  get,
  post,
  downloadFile,
};
