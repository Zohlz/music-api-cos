const COS = require('cos-nodejs-sdk-v5');
const config = require('./index');

// 创建 COS 实例
const cos = new COS({
  SecretId: config.cos.secretId,
  SecretKey: config.cos.secretKey,
});

// COS 配置
const cosConfig = {
  bucket: config.cos.bucket,
  region: config.cos.region,
  baseUrl: config.cos.baseUrl,
};

module.exports = {
  cos,
  cosConfig,
};
