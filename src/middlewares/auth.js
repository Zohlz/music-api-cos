const AuthService = require('../services/authService');
const response = require('../utils/response');

/**
 * 认证中间件 - 验证JWT令牌
 */
const authMiddleware = (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.unauthorized(res, '未提供认证令牌');
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证token
    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return response.unauthorized(res, '认证令牌无效或已过期');
    }

    // 将用户信息附加到请求对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    console.error('[AuthMiddleware] 认证失败:', error.message);
    return response.unauthorized(res, '认证失败');
  }
};

/**
 * 可选认证中间件 - 如果有token则验证，没有则跳过
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = AuthService.verifyToken(token);
      if (decoded) {
        req.user = {
          userId: decoded.userId,
          username: decoded.username,
        };
      }
    }
    next();
  } catch (error) {
    // 可选认证失败不影响请求继续
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};
