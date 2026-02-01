const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user');
const config = require('../config');

/**
 * 认证服务
 */
const AuthService = {
  /**
   * 生成密码哈希
   * @param {string} password - 明文密码
   * @returns {Promise<string>} 密码哈希
   */
  async hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  },

  /**
   * 验证密码
   * @param {string} password - 明文密码
   * @param {string} hash - 密码哈希
   * @returns {Promise<boolean>}
   */
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  },

  /**
   * 生成JWT令牌
   * @param {Object} payload - 载荷数据
   * @param {string} expiresIn - 过期时间（如 '24h', '7d'）
   * @returns {string} JWT令牌
   */
  generateToken(payload, expiresIn = '24h') {
    const secret = config.jwt.secret;
    return jwt.sign(payload, secret, { expiresIn });
  },

  /**
   * 验证JWT令牌
   * @param {string} token - JWT令牌
   * @returns {Object|null} 解码后的载荷，验证失败返回null
   */
  verifyToken(token) {
    try {
      const secret = config.jwt.secret;
      return jwt.verify(token, secret);
    } catch (error) {
      console.error('[AuthService] Token验证失败:', error.message);
      return null;
    }
  },

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {string} ip - 登录IP
   * @returns {Promise<Object>} 包含token和用户信息
   */
  async login(username, password, ip) {
    // 查询用户
    const user = await UserModel.findByUsername(username);
    if (!user) {
      throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('用户名或密码错误');
    }

    // 更新最后登录信息
    await UserModel.updateLastLogin(user.user_id, ip);

    // 生成token
    const token = this.generateToken({
      userId: user.user_id,
      username: user.username,
    });

    // 返回用户信息（不包含密码）
    return {
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
      },
    };
  },

  /**
   * 获取用户信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>}
   */
  async getUserInfo(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      return null;
    }

    return {
      userId: user.user_id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      lastLoginTime: user.last_login_time,
      lastLoginIp: user.last_login_ip,
    };
  },

  /**
   * 修改密码
   * @param {number} userId - 用户ID
   * @param {string} oldPassword - 旧密码
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>}
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    const isValid = await this.verifyPassword(oldPassword, user.password);
    if (!isValid) {
      throw new Error('旧密码错误');
    }

    // 生成新密码哈希
    const newHash = await this.hashPassword(newPassword);

    // 更新密码
    return UserModel.update(userId, { password: newHash });
  },
};

module.exports = AuthService;
