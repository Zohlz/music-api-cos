const ParseService = require('../services/parseService');
const MusicService = require('../services/musicService');
const response = require('../utils/response');

/**
 * 搜索控制器
 */
const SearchController = {
  /**
   * 搜索音乐
   * GET /api/search
   */
  async search(req, res, next) {
    try {
      const { keyword, pageNum = 1, pageSize = 20 } = req.query;

      if (!keyword || !keyword.trim()) {
        return response.badRequest(res, '搜索关键词不能为空');
      }

      const result = await ParseService.searchKuwoMusic(
        keyword.trim(),
        parseInt(pageNum),
        parseInt(pageSize)
      );

      response.successPage(res, result.rows, result.total);
    } catch (error) {
      next(error);
    }
  },

  /**
   * ESP端音乐解析接口
   * GET /api/search/esp
   * 参数：msg - 歌曲名称
   * 返回：第一首搜索结果的完整信息（包含音频URL）
   */
  async espParse(req, res, next) {
    try {
      const { msg } = req.query;

      if (!msg || !msg.trim()) {
        return response.badRequest(res, '歌曲名称不能为空');
      }

      console.log(`[ESP] 收到解析请求: msg=${msg}`);

      // 1. 搜索音乐
      const searchResult = await ParseService.searchKuwoMusic(msg.trim(), 1, 1);
      
      if (!searchResult.rows || searchResult.rows.length === 0) {
        return response.error(res, '未找到相关歌曲');
      }

      const firstSong = searchResult.rows[0];
      console.log(`[ESP] 找到歌曲: ${firstSong.songName} - ${firstSong.artist}`);

      // 2. 检查是否已存在
      let music = await MusicService.findBySongId(firstSong.songId);
      
      if (music && music.audio_url) {
        // 已存在且已解析，直接返回
        console.log(`[ESP] 歌曲已存在: musicId=${music.music_id}`);
        return response.success(res, {
          success: true,
          songId: music.song_id,
          songName: music.song_name,
          artist: music.artist,
          album: music.album,
          duration: music.duration,
          coverUrl: music.cover_url,
          audioUrl: music.audio_url,
          lyricUrl: music.lyric_url,
        });
      }

      // 3. 解析并保存
      console.log(`[ESP] 开始解析歌曲: songId=${firstSong.songId}`);
      
      try {
        const { audioUrl, lyricUrl } = await ParseService.parseAndUpload({
          songId: firstSong.songId,
          songName: firstSong.songName,
          artist: firstSong.artist,
        });

        // 4. 保存到数据库
        music = await MusicService.saveMusic({
          songId: firstSong.songId,
          songName: firstSong.songName,
          artist: firstSong.artist,
          album: firstSong.album,
          duration: firstSong.duration,
          coverUrl: firstSong.coverUrl,
          audioUrl,
          lyricUrl,
        });

        console.log(`[ESP] 解析成功: musicId=${music.music_id}`);

        return response.success(res, {
          success: true,
          songId: music.song_id,
          songName: music.song_name,
          artist: music.artist,
          album: music.album,
          duration: music.duration,
          coverUrl: music.cover_url,
          audioUrl: music.audio_url,
          lyricUrl: music.lyric_url,
        });
      } catch (parseError) {
        console.error(`[ESP] 解析失败:`, parseError.message);
        return response.error(res, `解析失败: ${parseError.message}`);
      }
    } catch (error) {
      console.error(`[ESP] 处理失败:`, error);
      next(error);
    }
  },
};

module.exports = SearchController;
