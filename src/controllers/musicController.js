const ParseService = require('../services/parseService');
const MusicService = require('../services/musicService');
const response = require('../utils/response');

/**
 * 格式化 ESP 端音乐响应（与 /api/search/esp 返回结构一致）
 */
function formatEspMusic(music) {
  return {
    success: true,
    songId: music.song_id,
    songName: music.song_name,
    artist: music.artist,
    album: music.album,
    duration: music.duration,
    coverUrl: music.cover_url,
    audioUrl: music.audio_url,
    lyricUrl: music.lyric_url,
  };
}

/**
 * 音乐控制器
 */
const MusicController = {
  /**
   * 解析并保存音乐
   * POST /api/music/parse
   */
  async parseAndSave(req, res, next) {
    try {
      const { songId, songName, artist, album, duration, coverUrl } = req.body;

      if (!songId || !songName) {
        return response.badRequest(res, '歌曲ID和歌曲名称不能为空');
      }

      const result = await MusicService.parseAndSave({
        songId,
        songName,
        artist,
        album,
        duration: duration ? parseInt(duration) : null,
        coverUrl,
      });

      response.success(res, result, '解析成功');
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取音乐列表
   * GET /api/music/list
   */
  async list(req, res, next) {
    try {
      const { songName, artist, pageNum = 1, pageSize = 20 } = req.query;

      const { list, total } = await MusicService.findList({
        songName,
        artist,
        pageNum,
        pageSize,
      });

      const rows = MusicService.formatMusicListResponse(list);
      response.successPage(res, rows, total);
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取音乐详情
   * GET /api/music/:musicId
   */
  async detail(req, res, next) {
    try {
      const { musicId } = req.params;

      if (!musicId) {
        return response.badRequest(res, '音乐ID不能为空');
      }

      const music = await MusicService.findById(parseInt(musicId));
      if (!music) {
        return response.notFound(res, '音乐不存在');
      }

      const result = MusicService.formatMusicResponse(music);
      response.success(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * ESP端获取音乐（按歌曲ID）
   * GET /api/music/esp/:songId
   * 说明：songId 来自 GET /api/search/esp/search 返回的搜索结果。
   * 若歌曲已解析入库则直接返回；否则需携带歌曲信息（songName 等）触发解析入库。
   */
  async espGetMusicBySongId(req, res, next) {
    try {
      const { songId } = req.params;
      const { songName, artist, album, duration, coverUrl } = req.query;

      if (!songId) {
        return response.badRequest(res, '歌曲ID不能为空');
      }

      console.log(`[ESP] 收到获取歌曲请求: songId=${songId}`);

      // 1. 查库，已解析则直接返回
      const existing = await MusicService.findBySongId(songId);
      if (existing && existing.audio_url) {
        console.log(`[ESP] 歌曲已缓存: musicId=${existing.music_id}`);
        return response.success(res, formatEspMusic(existing));
      }

      // 2. 未缓存则需要歌曲信息用于解析入库
      const songNameStr = (songName || '').trim();
      if (!songNameStr) {
        console.error(`[ESP] 歌曲未缓存且缺少歌曲信息: songId=${songId}`);
        return response.error(res, '歌曲未缓存，请携带歌曲信息（songName 等，可从搜索接口结果获取）');
      }

      console.log(`[ESP] 开始解析歌曲: songId=${songId}`);

      try {
        const { audioUrl, lyricUrl } = await ParseService.parseAndUpload({
          songId,
          songName: songNameStr,
          artist: (artist || '').trim(),
        });

        // 3. 保存到数据库
        const music = await MusicService.saveMusic({
          songId,
          songName: songNameStr,
          artist: (artist || '').trim(),
          album: (album || '').trim(),
          duration: duration ? parseInt(duration) : null,
          coverUrl: (coverUrl || '').trim(),
          audioUrl,
          lyricUrl,
        });

        console.log(`[ESP] 解析成功: musicId=${music.music_id}`);
        return response.success(res, formatEspMusic(music));
      } catch (parseError) {
        console.error(`[ESP] 解析失败:`, parseError.message);
        return response.error(res, `解析失败: ${parseError.message}`);
      }
    } catch (error) {
      console.error(`[ESP] 处理失败:`, error.message);
      next(error);
    }
  },

  /**
   * 获取播放信息
   * GET /api/music/:musicId/play
   */
  async play(req, res, next) {
    try {
      const { musicId } = req.params;

      if (!musicId) {
        return response.badRequest(res, '音乐ID不能为空');
      }

      const playInfo = await MusicService.getPlayInfo(parseInt(musicId), req);
      if (!playInfo) {
        return response.notFound(res, '音乐不存在');
      }

      response.success(res, playInfo);
    } catch (error) {
      next(error);
    }
  },

  /**
   * 音频流代理
   * GET /api/music/:musicId/stream
   */
  async stream(req, res, next) {
    try {
      const { musicId } = req.params;

      if (!musicId) {
        return response.badRequest(res, '音乐ID不能为空');
      }

      const music = await MusicService.findById(parseInt(musicId));
      if (!music || !music.audio_url) {
        return response.notFound(res, '音乐不存在或音频文件不可用');
      }

      // 使用 axios 获取音频流并转发
      const axios = require('axios');
      
      try {
        const audioResponse = await axios({
          method: 'GET',
          url: music.audio_url,
          responseType: 'stream',
          headers: {
            'Range': req.headers.range || 'bytes=0-',
          },
        });

        // 设置响应头
        res.setHeader('Content-Type', audioResponse.headers['content-type'] || 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        
        if (audioResponse.headers['content-length']) {
          res.setHeader('Content-Length', audioResponse.headers['content-length']);
        }
        
        if (audioResponse.headers['content-range']) {
          res.setHeader('Content-Range', audioResponse.headers['content-range']);
          res.status(206); // Partial Content
        }

        // 流式传输音频数据
        audioResponse.data.pipe(res);
      } catch (error) {
        console.error('[MusicController] 音频流代理失败:', error.message);
        return response.error(res, '音频加载失败');
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * 删除音乐
   * DELETE /api/music/:musicId
   */
  async remove(req, res, next) {
    try {
      const { musicId } = req.params;

      if (!musicId) {
        return response.badRequest(res, '音乐ID不能为空');
      }

      const success = await MusicService.deleteById(parseInt(musicId));
      if (!success) {
        return response.notFound(res, '音乐不存在或已被删除');
      }

      response.success(res, null, '删除成功');
    } catch (error) {
      next(error);
    }
  },

  /**
   * 批量删除音乐
   * DELETE /api/music/batch
   */
  async batchRemove(req, res, next) {
    try {
      const { musicIds } = req.body;

      if (!musicIds || !Array.isArray(musicIds) || musicIds.length === 0) {
        return response.badRequest(res, '音乐ID列表不能为空');
      }

      // 转换为整数数组
      const ids = musicIds.map((id) => parseInt(id)).filter((id) => !isNaN(id));
      if (ids.length === 0) {
        return response.badRequest(res, '音乐ID列表格式不正确');
      }

      const deletedCount = await MusicService.deleteByIds(ids);
      response.success(res, { deletedCount }, `成功删除 ${deletedCount} 条记录`);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = MusicController;
