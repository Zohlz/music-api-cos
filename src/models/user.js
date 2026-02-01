const { pool } = require('../config/database');

/**
 * 管理员用户模型
 */
const UserModel = {
  /**
   * 根据用户名查询用户
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>}
   */
  async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT * FROM admin_user WHERE username = ? AND status = 1',
      [username]
    );
    return rows[0] || null;
  },

  /**
   * 根据用户ID查询用户
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>}
   */
  async findById(userId) {
    const [rows] = await pool.query(
      'SELECT user_id, username, nickname, email, avatar, status, last_login_time, last_login_ip, create_time FROM admin_user WHERE user_id = ? AND status = 1',
      [userId]
    );
    return rows[0] || null;
  },

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<number>} 用户ID
   */
  async create(userData) {
    const { username, password, nickname, email } = userData;
    const [result] = await pool.query(
      'INSERT INTO admin_user (username, password, nickname, email) VALUES (?, ?, ?, ?)',
      [username, password, nickname, email]
    );
    return result.insertId;
  },

  /**
   * 更新最后登录信息
   * @param {number} userId - 用户ID
   * @param {string} ip - 登录IP
   * @returns {Promise<boolean>}
   */
  async updateLastLogin(userId, ip) {
    const [result] = await pool.query(
      'UPDATE admin_user SET last_login_time = NOW(), last_login_ip = ? WHERE user_id = ?',
      [ip, userId]
    );
    return result.affectedRows > 0;
  },

  /**
   * 更新用户信息
   * @param {number} userId - 用户ID
   * @param {Object} userData - 用户数据
   * @returns {Promise<boolean>}
   */
  async update(userId, userData) {
    const fields = [];
    const values = [];

    if (userData.nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(userData.nickname);
    }
    if (userData.email !== undefined) {
      fields.push('email = ?');
      values.push(userData.email);
    }
    if (userData.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(userData.avatar);
    }
    if (userData.password !== undefined) {
      fields.push('password = ?');
      values.push(userData.password);
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(userId);
    const [result] = await pool.query(
      `UPDATE admin_user SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * 删除用户（软删除）
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  async delete(userId) {
    const [result] = await pool.query(
      'UPDATE admin_user SET status = 0 WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = UserModel;
