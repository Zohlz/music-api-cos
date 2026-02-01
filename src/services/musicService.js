const MusicModel = require('../models/music');
const ParseService = require('./parseService');

/**
 * 音乐业务服务
 */
const MusicService = {
  /**
   * 根据 songId 查询音乐
   * @param {string} songId - 歌曲 ID
   * @returns {Promise<Object|null>}
   */
  async findBySongId(songId) {
    return MusicModel.findBySongId(songId);
  },

  /**
   * 根据 musicId 查询音乐
   * @param {number} musicId - 音乐 ID
   * @returns {Promise<Object|null>}
   */
  async findById(musicId) {
    return MusicModel.findById(musicId);
  },

  /**
   * 查询音乐列表
   * @param {Object} params - 查询参数
   * @returns {Promise<{list: Array, total: number}>}
   */
  async findList(params) {
    const { songName, artist, pageNum = 1, pageSize = 20 } = params;
    return MusicModel.findList({
      songName,
      artist,
      pageNum: parseInt(pageNum),
      pageSize: parseInt(pageSize),
    });
  },

  /**
   * 保存音乐（如果已存在则返回已有记录）
   * @param {Object} musicInfo - 音乐信息
   * @returns {Promise<Object>} 音乐记录
   */
  async saveMusic(musicInfo) {
    const { songId, songName, artist, album, duration, coverUrl, audioUrl, lyricUrl, source = 'kuwo' } = musicInfo;

    // 检查是否已存在
    const existingMusic = await MusicModel.findBySongId(songId);
    if (existingMusic) {
      console.log(`[MusicService] 音乐已存在: songId=${songId}, musicId=${existingMusic.music_id}`);

      // 如果已有记录缺少某些字段，可以更新
      const needUpdate = {};
      if (!existingMusic.cover_url && coverUrl) {
        needUpdate.coverUrl = coverUrl;
      }
      if (!existingMusic.audio_url && audioUrl) {
        needUpdate.audioUrl = audioUrl;
      }
      if (!existingMusic.lyric_url && lyricUrl) {
        needUpdate.lyricUrl = lyricUrl;
      }

      if (Object.keys(needUpdate).length > 0) {
        await MusicModel.update(existingMusic.music_id, needUpdate);
        console.log(`[MusicService] 更新音乐信息: musicId=${existingMusic.music_id}`, needUpdate);
      }

      // 重新查询返回最新数据
      return MusicModel.findById(existingMusic.music_id);
    }

    // 插入新记录
    const musicId = await MusicModel.insert({
      songId,
      songName,
      artist,
      album,
      duration,
      coverUrl,
      audioUrl,
      lyricUrl,
      source,
    });

    console.log(`[MusicService] 保存音乐成功: songId=${songId}, musicId=${musicId}`);

    return MusicModel.findById(musicId);
  },

  /**
   * 解析并保存音乐
   * @param {Object} params - 解析参数
   * @returns {Promise<Object>} 音乐记录
   */
  async parseAndSave(params) {
    const { songId, songName, artist, album, duration, coverUrl } = params;

    // 1. 检查是否已存在
    const existingMusic = await MusicModel.findBySongId(songId);
    if (existingMusic && existingMusic.audio_url) {
      console.log(`[MusicService] 音乐已解析过: songId=${songId}`);
      return this.formatMusicResponse(existingMusic);
    }

    // 2. 解析音乐（下载并上传到 COS）
    const { audioUrl, lyricUrl } = await ParseService.parseAndUpload({
      songId,
      songName,
      artist,
    });

    // 3. 保存到数据库
    const music = await this.saveMusic({
      songId,
      songName,
      artist,
      album,
      duration,
      coverUrl,
      audioUrl,
      lyricUrl,
    });

    return this.formatMusicResponse(music);
  },

  /**
   * 获取播放信息
   * @param {number} musicId - 音乐 ID
   * @param {Object} req - Express 请求对象（可选，用于获取域名）
   * @returns {Promise<Object|null>}
   */
  async getPlayInfo(musicId, req = null) {
    const music = await MusicModel.findById(musicId);
    if (!music) {
      return null;
    }

    // 增加播放次数
    await MusicModel.incrementPlayCount(musicId);

    // 使用代理URL而不是直接的COS URL，避免防盗链问题
    let apiBaseUrl;
    if (req) {
      // 从请求中获取协议和主机名
      const protocol = req.protocol || 'http';
      const host = req.get('host') || req.get('x-forwarded-host');
      apiBaseUrl = `${protocol}://${host}`;
    } else {
      // 回退到环境变量或默认值
      const config = require('../config');
      apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${config.port}`;
    }
    
    const proxyAudioUrl = `${apiBaseUrl}/api/music/${musicId}/stream`;

    return {
      musicId: music.music_id,
      songId: music.song_id,
      songName: music.song_name,
      artist: music.artist,
      album: music.album,
      duration: music.duration,
      coverUrl: music.cover_url,
      audioUrl: proxyAudioUrl, // 使用代理URL
      lyricUrl: music.lyric_url,
    };
  },

  /**
   * 删除音乐
   * @param {number} musicId - 音乐 ID
   * @returns {Promise<boolean>}
   */
  async deleteById(musicId) {
    return MusicModel.deleteById(musicId);
  },

  /**
   * 批量删除音乐
   * @param {number[]} musicIds - 音乐 ID 数组
   * @returns {Promise<number>} 删除的记录数
   */
  async deleteByIds(musicIds) {
    return MusicModel.deleteByIds(musicIds);
  },

  /**
   * 格式化音乐响应数据（数据库字段转驼峰）
   * @param {Object} music - 数据库记录
   * @returns {Object}
   */
  formatMusicResponse(music) {
    if (!music) return null;

    return {
      musicId: music.music_id,
      songId: music.song_id,
      songName: music.song_name,
      artist: music.artist,
      album: music.album,
      duration: music.duration,
      coverUrl: music.cover_url,
      audioUrl: music.audio_url,
      lyricUrl: music.lyric_url,
      source: music.source,
      playCount: music.play_count,
      status: music.status,
      createTime: music.create_time,
      updateTime: music.update_time,
    };
  },

  /**
   * 格式化音乐列表响应数据
   * @param {Array} list - 数据库记录列表
   * @returns {Array}
   */
  formatMusicListResponse(list) {
    return list.map((item) => this.formatMusicResponse(item));
  },
};

module.exports = MusicService;
