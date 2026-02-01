const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

/**
 * 音频转换工具
 */
const AudioConverter = {
  /**
   * 检测音频文件格式
   * @param {string} url - 音频URL
   * @returns {string} 文件扩展名
   */
  detectFormat(url) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('.mflac') || urlLower.includes('mflac')) {
      return '.mflac';
    } else if (urlLower.includes('.flac')) {
      return '.flac';
    } else if (urlLower.includes('.aac')) {
      return '.aac';
    } else if (urlLower.includes('.m4a')) {
      return '.m4a';
    } else if (urlLower.includes('.wav')) {
      return '.wav';
    }
    return '.mp3';
  },

  /**
   * 判断是否需要转换格式
   * @param {string} format - 文件格式
   * @returns {boolean}
   */
  needsConversion(format) {
    return format !== '.mp3';
  },

  /**
   * 转换音频为 MP3 格式
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {Object} [options] - 转换选项
   * @param {number} [options.audioBitrate=96] - 音频比特率 (kbps)，默认96以控制文件大小在3MB左右
   * @returns {Promise<string>} 输出文件路径
   */
  convertToMp3(inputPath, outputPath, options = {}) {
    const { audioBitrate = 96 } = options;

    return new Promise((resolve, reject) => {
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      ffmpeg(inputPath)
        .toFormat('mp3')
        .audioBitrate(audioBitrate)
        .audioChannels(2)
        .audioFrequency(44100)
        .on('start', (cmd) => {
          console.log('[FFmpeg] 开始转换:', cmd);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`[FFmpeg] 转换进度: ${Math.round(progress.percent)}%`);
          }
        })
        .on('error', (err) => {
          console.error('[FFmpeg] 转换失败:', err.message);
          reject(err);
        })
        .on('end', () => {
          console.log('[FFmpeg] 转换完成:', outputPath);
          resolve(outputPath);
        })
        .save(outputPath);
    });
  },

  /**
   * 清理临时文件
   * @param {string[]} filePaths - 文件路径数组
   */
  cleanupFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('[Cleanup] 已删除临时文件:', filePath);
        }
      } catch (error) {
        console.error('[Cleanup] 删除文件失败:', filePath, error.message);
      }
    }
  },

  /**
   * 确保目录存在
   * @param {string} dirPath - 目录路径
   */
  ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },
};

module.exports = AudioConverter;
