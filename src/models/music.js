const { pool } = require('../config/database');

/**
 * 音乐数据模型
 */
const MusicModel = {
  /**
   * 根据 songId 查询音乐
   * @param {string} songId - 歌曲ID
   * @returns {Promise<Object|null>}
   */
  async findBySongId(songId) {
    const [rows] = await pool.execute(
      'SELECT * FROM music WHERE song_id = ?',
      [songId]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 根据 musicId 查询音乐
   * @param {number} musicId - 音乐ID
   * @returns {Promise<Object|null>}
   */
  async findById(musicId) {
    const [rows] = await pool.execute(
      'SELECT * FROM music WHERE music_id = ?',
      [musicId]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 查询音乐列表
   * @param {Object} params - 查询参数
   * @param {string} [params.songName] - 歌曲名（模糊搜索）
   * @param {string} [params.artist] - 歌手名（模糊搜索）
   * @param {number} [params.pageNum=1] - 页码
   * @param {number} [params.pageSize=20] - 每页数量
   * @returns {Promise<{list: Array, total: number}>}
   */
  async findList({ songName, artist, pageNum = 1, pageSize = 20 }) {
    let whereClauses = ['status = 1'];
    let params = [];

    if (songName) {
      whereClauses.push('song_name LIKE ?');
      params.push(`%${songName}%`);
    }

    if (artist) {
      whereClauses.push('artist LIKE ?');
      params.push(`%${artist}%`);
    }

    const whereStr = whereClauses.join(' AND ');
    const offset = (pageNum - 1) * pageSize;

    // 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM music WHERE ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    // 查询列表
    const [rows] = await pool.execute(
      `SELECT * FROM music WHERE ${whereStr} ORDER BY create_time DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return { list: rows, total };
  },

  /**
   * 插入音乐记录
   * @param {Object} music - 音乐信息
   * @returns {Promise<number>} 插入的记录ID
   */
  async insert(music) {
    const { songId, songName, artist, album, duration, coverUrl, audioUrl, lyricUrl, source = 'kuwo' } = music;
    
    const [result] = await pool.execute(
      `INSERT INTO music (song_id, song_name, artist, album, duration, cover_url, audio_url, lyric_url, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [songId, songName, artist, album, duration, coverUrl, audioUrl, lyricUrl, source]
    );
    
    return result.insertId;
  },

  /**
   * 更新音乐记录
   * @param {number} musicId - 音乐ID
   * @param {Object} updates - 更新字段
   * @returns {Promise<boolean>}
   */
  async update(musicId, updates) {
    const allowedFields = ['song_name', 'artist', 'album', 'duration', 'cover_url', 'audio_url', 'lyric_url', 'status', 'play_count'];
    const setClauses = [];
    const params = [];

    // 字段名映射（驼峰转下划线）
    const fieldMap = {
      songName: 'song_name',
      coverUrl: 'cover_url',
      audioUrl: 'audio_url',
      lyricUrl: 'lyric_url',
      playCount: 'play_count',
    };

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key;
      if (allowedFields.includes(dbField) && value !== undefined) {
        setClauses.push(`${dbField} = ?`);
        params.push(value);
      }
    }

    if (setClauses.length === 0) {
      return false;
    }

    params.push(musicId);
    const [result] = await pool.execute(
      `UPDATE music SET ${setClauses.join(', ')} WHERE music_id = ?`,
      params
    );

    return result.affectedRows > 0;
  },

  /**
   * 删除音乐记录
   * @param {number} musicId - 音乐ID
   * @returns {Promise<boolean>}
   */
  async deleteById(musicId) {
    const [result] = await pool.execute(
      'DELETE FROM music WHERE music_id = ?',
      [musicId]
    );
    return result.affectedRows > 0;
  },

  /**
   * 批量删除音乐记录
   * @param {number[]} musicIds - 音乐ID数组
   * @returns {Promise<number>} 删除的记录数
   */
  async deleteByIds(musicIds) {
    if (!musicIds || musicIds.length === 0) {
      return 0;
    }
    
    const placeholders = musicIds.map(() => '?').join(',');
    const [result] = await pool.execute(
      `DELETE FROM music WHERE music_id IN (${placeholders})`,
      musicIds
    );
    return result.affectedRows;
  },

  /**
   * 增加播放次数
   * @param {number} musicId - 音乐ID
   * @returns {Promise<boolean>}
   */
  async incrementPlayCount(musicId) {
    const [result] = await pool.execute(
      'UPDATE music SET play_count = play_count + 1 WHERE music_id = ?',
      [musicId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = MusicModel;
