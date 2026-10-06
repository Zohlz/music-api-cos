require('dotenv').config();

module.exports = {
  // 服务配置
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MySQL 配置
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'music_db',
  },

  // 腾讯云 COS 配置
  cos: {
    secretId: process.env.COS_SECRET_ID,
    secretKey: process.env.COS_SECRET_KEY,
    bucket: process.env.COS_BUCKET,
    region: process.env.COS_REGION,
    baseUrl: process.env.COS_BASE_URL,
  },

  // 酷我 API 配置
  kuwo: {
    apiKey: process.env.KUWO_API_KEY,
    searchUrl: 'http://search.kuwo.cn/r.s',
    parseApiUrl: 'https://www.52api.cn/api/kuwo',
    lyricUrl: 'https://api.xiaodaokg.com/kw/kwlyric.php',
  },

  // ESP32 设备鉴权配置（设备密钥 + HMAC 签名，不走账号体系）
  esp: {
    accessKey: process.env.ESP_ACCESS_KEY || '',
    accessSecret: process.env.ESP_ACCESS_SECRET || '',
    signatureTtl: parseInt(process.env.ESP_SIGNATURE_TTL, 10) || 300, // 签名有效期（秒）
    staticToken: process.env.ESP_STATIC_TOKEN || '', // 简易模式，生产环境留空
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // 临时文件目录
  tempDir: process.env.TEMP_DIR || './temp',
};
