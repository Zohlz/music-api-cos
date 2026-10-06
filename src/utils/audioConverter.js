const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

/**
 * OGG/Opus 编码器候选列表（按优先级尝试）
 * libopus 为官方推荐编码器，opus 为 ffmpeg 内置编码器（构建未启用 libopus 时兜底）
 */
const OGG_OPUS_PROFILES = [
  {
    codec: 'libopus',
    codecOptions: ['-vbr', 'on', '-compression_level', '10', '-application', 'audio'],
  },
  {
    codec: 'opus',
    codecOptions: [],
  },
];

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
    } else if (urlLower.includes('.ogg') || urlLower.includes('.opus')) {
      return '.ogg';
    }
    return '.mp3';
  },

  /**
   * 判断是否需要转换格式（目标格式为 OGG/Opus）
   * @param {string} format - 文件格式
   * @returns {boolean}
   */
  needsConversion(format) {
    return format !== '.ogg';
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
   * 转换音频为 OGG/Opus 格式
   * 输出特性：
   * - 容器：OGG（文件起始 4 字节为 "OggS"）
   * - 编码：Opus
   * - 声道：单声道（mono）
   * - 无 ID3 等前缀（转换后二次校验，若存在前缀自动剥离）
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径（建议以 .ogg 结尾）
   * @param {Object} [options] - 转换选项
   * @param {number} [options.audioBitrate=64] - 音频比特率 (kbps)，默认64以控制文件大小
   * @param {number} [options.channels=1] - 声道数，默认单声道
   * @param {number} [options.sampleRate=48000] - 采样率（Opus 内部固定 48kHz）
   * @returns {Promise<string>} 输出文件路径
   */
  async convertToOggOpus(inputPath, outputPath, options = {}) {
    const { audioBitrate = 64, channels = 1, sampleRate = 48000 } = options;

    this.ensureDir(path.dirname(outputPath));

    let lastError;
    for (const profile of OGG_OPUS_PROFILES) {
      try {
        await this.transcode(inputPath, outputPath, {
          codec: profile.codec,
          codecOptions: profile.codecOptions,
          audioBitrate,
          channels,
          sampleRate,
        });

        // 校验容器/编码并剥离可能存在的 ID3 等前缀
        this.ensureOggOpus(outputPath);

        return outputPath;
      } catch (error) {
        lastError = error;
        console.warn(`[FFmpeg] 使用编码器 ${profile.codec} 转换失败: ${error.message}`);
      }
    }

    throw new Error(`转换为 OGG/Opus 失败: ${lastError ? lastError.message : '未知错误'}`);
  },

  /**
   * 执行 ffmpeg 转码（内部方法）
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {Object} params - 转码参数
   * @returns {Promise<string>} 输出文件路径
   */
  transcode(inputPath, outputPath, { codec, codecOptions = [], audioBitrate, channels, sampleRate }) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec(codec)
        .audioChannels(channels)
        .audioFrequency(sampleRate)
        .outputOptions([
          '-b:a',
          `${audioBitrate}k`,
          ...codecOptions,
          // 不写入来源元数据，避免产生 ID3 等额外头部
          '-map_metadata',
          '-1',
          '-f',
          'ogg',
        ])
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
   * 校验文件为 OGG/Opus：
   * 1. 首个数据块前 4 字节必须为 "OggS"，若存在 ID3 等前缀则剥离
   * 2. 首个 OGG 页内必须包含 "OpusHead"（排除 OGG-Vorbis / 裸 Opus）
   * @param {string} filePath - 待校验文件路径
   */
  ensureOggOpus(filePath) {
    // 1. 定位首个 OGG 页，剥离可能存在的 ID3 等前缀
    const scanSize = Math.min(fs.statSync(filePath).size, 64 * 1024);
    const buffer = Buffer.alloc(scanSize);
    const fd = fs.openSync(filePath, 'r');

    try {
      fs.readSync(fd, buffer, 0, scanSize, 0);
    } finally {
      fs.closeSync(fd);
    }

    const oggOffset = buffer.indexOf('OggS');

    if (oggOffset === -1) {
      throw new Error('输出文件不是 OGG 容器（未找到 OggS 标记）');
    }

    if (oggOffset > 0) {
      console.warn(`[FFmpeg] 检测到 ${oggOffset} 字节前缀（如 ID3），已剥离`);
      const data = fs.readFileSync(filePath);
      fs.writeFileSync(filePath, data.subarray(oggOffset));
    }

    // 2. 校验编码为 Opus
    const headSize = Math.min(fs.statSync(filePath).size, 1024);
    const head = Buffer.alloc(headSize);
    const headFd = fs.openSync(filePath, 'r');

    try {
      fs.readSync(headFd, head, 0, headSize, 0);
    } finally {
      fs.closeSync(headFd);
    }

    if (head.indexOf('OpusHead') === -1) {
      throw new Error('输出文件不是 Opus 编码（未找到 OpusHead 标识）');
    }

    console.log(`[FFmpeg] 输出校验通过: OGG/Opus, 文件魔数=${head.subarray(0, 4).toString('latin1')}`);
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
