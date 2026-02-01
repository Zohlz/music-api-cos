const fs = require('fs');
const path = require('path');
const config = require('../config');
const { get, downloadFile } = require('../utils/httpClient');
const AudioConverter = require('../utils/audioConverter');
const CosService = require('./cosService');

/**
 * 音乐解析服务
 */
const ParseService = {
  /**
   * 搜索酷我音乐
   * @param {string} keyword - 搜索关键词
   * @param {number} [pageNum=1] - 页码（从1开始）
   * @param {number} [pageSize=20] - 每页数量
   * @returns {Promise<{total: number, rows: Array}>}
   */
  async searchKuwoMusic(keyword, pageNum = 1, pageSize = 20) {
    // 酷我 API 页码从 0 开始
    const apiPageNum = pageNum - 1;

    const url = config.kuwo.searchUrl;
    const params = {
      all: keyword,
      ft: 'music',
      newsearch: 1,
      alflac: 1,
      itemset: 'web_2013',
      client: 'kt',
      cluster: 0,
      pn: apiPageNum,
      rn: pageSize,
      vermerge: 1,
      rformat: 'json',
      encoding: 'utf8',
      show_copyright_off: 1,
      pcmp4: 1,
      ver: 'mbox',
      vipver: 'MUSIC_8.7.6.0.BCS31',
      plat: 'pc',
      devid: 0,
    };

    console.log(`[Parse] 搜索酷我音乐: keyword=${keyword}, pageNum=${pageNum}, pageSize=${pageSize}`);

    const result = await get(url, params, {
      headers: {
        'Referer': 'http://www.kuwo.cn/',
        'Cookie': 'kw_token=PLACEHOLDER',
      },
    });

    // 调试：打印返回数据类型
    console.log(`[Parse] API 响应类型: ${typeof result}, 是否有 abslist: ${result && !!result.abslist}`);
    if (result && !result.abslist) {
      console.log(`[Parse] API 响应内容前200字符:`, JSON.stringify(result).substring(0, 200));
    }

    if (!result || !result.abslist) {
      return { total: 0, rows: [] };
    }

    // 解析搜索结果
    const rows = result.abslist.map((item) => {
      // 提取歌曲 ID
      const songId = this.extractSongIdFromMusicRid(item.MUSICRID);

      // 处理封面 URL
      let coverUrl = item.web_albumpic_short;
      if (coverUrl && !coverUrl.startsWith('http')) {
        coverUrl = `https://img1.kuwo.cn/star/albumcover/${coverUrl}`;
      }

      return {
        songId,
        songName: item.NAME,
        artist: item.ARTIST,
        album: item.ALBUM,
        duration: item.DURATION ? parseInt(item.DURATION) : null,
        coverUrl,
        playCount: item.PLAYCNT ? parseInt(item.PLAYCNT) : 0,
      };
    });

    const total = result.TOTAL ? parseInt(result.TOTAL) : rows.length;

    console.log(`[Parse] 搜索结果: total=${total}, 本页数量=${rows.length}`);

    return { total, rows };
  },

  /**
   * 从 MUSICRID 提取歌曲 ID
   * @param {string} musicRid - 格式: MUSIC_12345
   * @returns {string|null}
   */
  extractSongIdFromMusicRid(musicRid) {
    if (!musicRid) return null;
    const lastUnderscoreIndex = musicRid.lastIndexOf('_');
    if (lastUnderscoreIndex !== -1 && lastUnderscoreIndex + 1 < musicRid.length) {
      return musicRid.substring(lastUnderscoreIndex + 1);
    }
    return null;
  },

  /**
   * 获取音频下载链接
   * @param {string} songId - 歌曲 ID
   * @returns {Promise<{mp3Url: string, flacUrl: string}|null>}
   */
  async getAudioUrl(songId) {
    if (!config.kuwo.apiKey) {
      throw new Error('酷我 API Key 未配置，请在环境变量中设置 KUWO_API_KEY');
    }

    // 构建酷我音乐详情页 URL
    const kuwoDetailUrl = `http://www.kuwo.cn/play_detail/${songId}`;
    const apiUrl = `${config.kuwo.parseApiUrl}?key=${config.kuwo.apiKey}&url=${encodeURIComponent(kuwoDetailUrl)}`;

    console.log(`[Parse] 获取音频链接: songId=${songId}`);

    const result = await get(apiUrl);

    if (!result || result.code !== 200 || !result.data) {
      console.error(`[Parse] 获取音频链接失败: songId=${songId}`, result);
      return null;
    }

    return {
      mp3Url: result.data.music_mp3Url || null,
      flacUrl: result.data.music_flacUrl || null,
    };
  },

  /**
   * 构建歌词 URL
   * @param {string} songId - 歌曲 ID
   * @returns {string}
   */
  buildLyricUrl(songId) {
    return `${config.kuwo.lyricUrl}?id=${songId}`;
  },

  /**
   * 下载音频文件
   * @param {string} audioUrl - 音频下载链接
   * @param {string} savePath - 保存路径
   * @returns {Promise<string>} 保存的文件路径
   */
  async downloadAudio(audioUrl, savePath) {
    console.log(`[Parse] 开始下载音频: ${audioUrl}`);

    // 确保目录存在
    const dir = path.dirname(savePath);
    AudioConverter.ensureDir(dir);

    // 下载文件
    const buffer = await downloadFile(audioUrl);

    // 保存文件
    fs.writeFileSync(savePath, buffer);

    const fileSizeKB = Math.round(buffer.length / 1024);
    console.log(`[Parse] 音频下载完成: ${savePath}, 大小: ${fileSizeKB}KB`);

    return savePath;
  },

  /**
   * 解析并上传音乐到 COS
   * @param {Object} params - 解析参数
   * @param {string} params.songId - 歌曲 ID
   * @param {string} params.songName - 歌曲名称
   * @param {string} [params.artist] - 歌手
   * @returns {Promise<{audioUrl: string, lyricUrl: string}>}
   */
  async parseAndUpload({ songId, songName, artist }) {
    const tempFiles = []; // 用于记录需要清理的临时文件

    try {
      // 1. 获取音频下载链接
      const audioInfo = await this.getAudioUrl(songId);
      if (!audioInfo) {
        throw new Error('获取音频链接失败，该音乐可能无法解析');
      }

      // 优先使用 mp3，没有则使用 flac
      const originalAudioUrl = audioInfo.mp3Url || audioInfo.flacUrl;
      if (!originalAudioUrl) {
        throw new Error('未找到可用的音频链接');
      }

      // 2. 检测音频格式
      const originalFormat = AudioConverter.detectFormat(originalAudioUrl);
      const needsConversion = AudioConverter.needsConversion(originalFormat);

      console.log(`[Parse] 音频格式: ${originalFormat}, 需要转换/压缩: true`);

      // 3. 生成临时文件路径
      const tempDir = path.resolve(config.tempDir);
      AudioConverter.ensureDir(tempDir);

      const timestamp = Date.now();
      const originalFilePath = path.join(tempDir, `${songId}_${timestamp}_original${originalFormat}`);
      const mp3FilePath = path.join(tempDir, `${songId}_${timestamp}_compressed.mp3`);

      tempFiles.push(originalFilePath);
      tempFiles.push(mp3FilePath);

      // 4. 下载音频文件
      await this.downloadAudio(originalAudioUrl, originalFilePath);

      // 5. 转换/压缩音频（所有格式都进行处理以控制文件大小）
      console.log(`[Parse] 开始转换/压缩音频: ${originalFormat} -> .mp3 (96kbps)`);
      await AudioConverter.convertToMp3(originalFilePath, mp3FilePath, { audioBitrate: 96 });
      const finalFilePath = mp3FilePath;

      // 6. 上传到 COS
      const cosKey = CosService.generateCosKey(songId);
      const audioUrl = await CosService.uploadFile(finalFilePath, cosKey);

      // 7. 构建歌词 URL
      const lyricUrl = this.buildLyricUrl(songId);

      console.log(`[Parse] 解析完成: songId=${songId}, audioUrl=${audioUrl}`);

      return { audioUrl, lyricUrl };
    } finally {
      // 8. 清理临时文件
      AudioConverter.cleanupFiles(tempFiles);
    }
  },
};

module.exports = ParseService;
