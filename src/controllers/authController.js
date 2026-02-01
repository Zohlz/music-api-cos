const AuthService = require('../services/authService');
const response = require('../utils/response');

/**
 * 用户认证控制器
 */
const AuthController = {
  /**
   * 用户登录
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return response.badRequest(res, '用户名和密码不能为空');
      }

      // 获取客户端IP
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

      const result = await AuthService.login(username, password, ip);
      response.success(res, result, '登录成功');
    } catch (error) {
      if (error.message === '用户名或密码错误') {
        return response.badRequest(res, error.message);
      }
      next(error);
    }
  },

  /**
   * 获取当前用户信息
   * GET /api/auth/info
   */
  async getUserInfo(req, res, next) {
    try {
      const { userId } = req.user;

      const userInfo = await AuthService.getUserInfo(userId);
      if (!userInfo) {
        return response.notFound(res, '用户不存在');
      }

      response.success(res, userInfo);
    } catch (error) {
      next(error);
    }
  },

  /**
   * 修改密码
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { userId } = req.user;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return response.badRequest(res, '旧密码和新密码不能为空');
      }

      if (newPassword.length < 6) {
        return response.badRequest(res, '新密码长度不能少于6位');
      }

      await AuthService.changePassword(userId, oldPassword, newPassword);
      response.success(res, null, '密码修改成功');
    } catch (error) {
      if (error.message === '旧密码错误' || error.message === '用户不存在') {
        return response.badRequest(res, error.message);
      }
      next(error);
    }
  },

  /**
   * 登出（前端清除token即可，这里只是提供一个接口）
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      response.success(res, null, '登出成功');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AuthController;
