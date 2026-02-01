const fs = require('fs');
const path = require('path');
const { cos, cosConfig } = require('../config/cos');

/**
 * COS 上传服务
 */
const CosService = {
  /**
   * 上传文件到 COS
   * @param {string} localFilePath - 本地文件路径
   * @param {string} cosKey - COS 存储路径（不含 bucket）
   * @param {number} [retries=3] - 重试次数
   * @returns {Promise<string>} COS 访问 URL
   */
  async uploadFile(localFilePath, cosKey, retries = 3) {
    // 检查文件是否存在
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`文件不存在: ${localFilePath}`);
    }

    // 检查 COS 配置
    if (!cosConfig.bucket || !cosConfig.region) {
      throw new Error('COS 配置不完整，请检查环境变量');
    }

    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[COS] 开始上传文件 (尝试 ${attempt}/${retries}): ${cosKey}`);

        const result = await new Promise((resolve, reject) => {
          cos.putObject(
            {
              Bucket: cosConfig.bucket,
              Region: cosConfig.region,
              Key: cosKey,
              Body: fs.createReadStream(localFilePath),
              ContentLength: fs.statSync(localFilePath).size,
            },
            (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            }
          );
        });

        console.log(`[COS] 上传成功: ${cosKey}`);

        // 返回访问 URL
        return this.getFileUrl(cosKey);
      } catch (error) {
        lastError = error;
        console.error(`[COS] 上传失败 (尝试 ${attempt}/${retries}):`, error.message);

        if (attempt < retries) {
          // 等待一段时间后重试
          await this.sleep(1000 * attempt);
        }
      }
    }

    throw new Error(`COS 上传失败: ${lastError?.message || '未知错误'}`);
  },

  /**
   * 上传 Buffer 到 COS
   * @param {Buffer} buffer - 文件内容
   * @param {string} cosKey - COS 存储路径
   * @param {number} [retries=3] - 重试次数
   * @returns {Promise<string>} COS 访问 URL
   */
  async uploadBuffer(buffer, cosKey, retries = 3) {
    if (!cosConfig.bucket || !cosConfig.region) {
      throw new Error('COS 配置不完整，请检查环境变量');
    }

    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[COS] 开始上传 Buffer (尝试 ${attempt}/${retries}): ${cosKey}`);

        const result = await new Promise((resolve, reject) => {
          cos.putObject(
            {
              Bucket: cosConfig.bucket,
              Region: cosConfig.region,
              Key: cosKey,
              Body: buffer,
            },
            (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            }
          );
        });

        console.log(`[COS] 上传成功: ${cosKey}`);
        return this.getFileUrl(cosKey);
      } catch (error) {
        lastError = error;
        console.error(`[COS] 上传失败 (尝试 ${attempt}/${retries}):`, error.message);

        if (attempt < retries) {
          await this.sleep(1000 * attempt);
        }
      }
    }

    throw new Error(`COS 上传失败: ${lastError?.message || '未知错误'}`);
  },

  /**
   * 获取文件访问 URL
   * @param {string} cosKey - COS 存储路径
   * @returns {string} 访问 URL
   */
  getFileUrl(cosKey) {
    if (cosConfig.baseUrl) {
      // 使用配置的域名
      const baseUrl = cosConfig.baseUrl.replace(/\/$/, '');
      return `${baseUrl}/${cosKey}`;
    }
    // 使用默认 COS 域名
    return `https://${cosConfig.bucket}.cos.${cosConfig.region}.myqcloud.com/${cosKey}`;
  },

  /**
   * 生成 COS 存储路径
   * @param {string} songId - 歌曲 ID
   * @param {string} [ext='.mp3'] - 文件扩展名
   * @returns {string} COS 路径
   */
  generateCosKey(songId, ext = '.mp3') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const uuid = require('uuid').v4();

    return `audio/${year}/${month}/${day}/${songId}_${uuid}${ext}`;
  },

  /**
   * 删除 COS 文件
   * @param {string} cosKey - COS 存储路径
   * @returns {Promise<boolean>}
   */
  async deleteFile(cosKey) {
    try {
      await new Promise((resolve, reject) => {
        cos.deleteObject(
          {
            Bucket: cosConfig.bucket,
            Region: cosConfig.region,
            Key: cosKey,
          },
          (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          }
        );
      });

      console.log(`[COS] 删除成功: ${cosKey}`);
      return true;
    } catch (error) {
      console.error(`[COS] 删除失败: ${cosKey}`, error.message);
      return false;
    }
  },

  /**
   * 休眠函数
   * @param {number} ms - 毫秒数
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};

module.exports = CosService;
