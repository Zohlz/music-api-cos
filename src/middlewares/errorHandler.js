const response = require('../utils/response');

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  // 如果响应已发送，交给默认错误处理
  if (res.headersSent) {
    return next(err);
  }

  // 处理不同类型的错误
  if (err.name === 'ValidationError') {
    return response.badRequest(res, err.message);
  }

  if (err.name === 'UnauthorizedError') {
    return response.error(res, '未授权访问', 401);
  }

  if (err.code === 'ECONNREFUSED') {
    return response.serverError(res, '服务连接失败');
  }

  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    return response.serverError(res, '请求超时');
  }

  // MySQL 错误处理
  if (err.code === 'ER_DUP_ENTRY') {
    return response.badRequest(res, '数据已存在');
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    return response.serverError(res, '数据表不存在');
  }

  // 默认错误处理
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || '服务器内部错误';

  response.error(res, message, statusCode);
}

/**
 * 404 处理中间件
 */
function notFoundHandler(req, res) {
  response.notFound(res, `接口不存在: ${req.method} ${req.path}`);
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
