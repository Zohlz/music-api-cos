/**
 * 统一响应格式
 */

/**
 * 成功响应
 * @param {Object} res - Express response 对象
 * @param {any} data - 响应数据
 * @param {string} [msg='success'] - 响应消息
 */
function success(res, data = null, msg = 'success') {
  res.json({
    code: 200,
    msg,
    data,
  });
}

/**
 * 分页数据响应
 * @param {Object} res - Express response 对象
 * @param {Array} rows - 数据列表
 * @param {number} total - 总数
 * @param {string} [msg='success'] - 响应消息
 */
function successPage(res, rows, total, msg = 'success') {
  res.json({
    code: 200,
    msg,
    data: {
      rows,
      total,
    },
  });
}

/**
 * 错误响应
 * @param {Object} res - Express response 对象
 * @param {string} [msg='操作失败'] - 错误消息
 * @param {number} [code=500] - 错误码
 */
function error(res, msg = '操作失败', code = 500) {
  res.status(code >= 400 && code < 600 ? code : 500).json({
    code,
    msg,
    data: null,
  });
}

/**
 * 参数错误响应
 * @param {Object} res - Express response 对象
 * @param {string} [msg='参数错误'] - 错误消息
 */
function badRequest(res, msg = '参数错误') {
  error(res, msg, 400);
}

/**
 * 未找到资源响应
 * @param {Object} res - Express response 对象
 * @param {string} [msg='资源不存在'] - 错误消息
 */
function notFound(res, msg = '资源不存在') {
  error(res, msg, 404);
}

/**
 * 未授权响应
 * @param {Object} res - Express response 对象
 * @param {string} [msg='未授权'] - 错误消息
 */
function unauthorized(res, msg = '未授权') {
  error(res, msg, 401);
}

/**
 * 服务器内部错误响应
 * @param {Object} res - Express response 对象
 * @param {string} [msg='服务器内部错误'] - 错误消息
 */
function serverError(res, msg = '服务器内部错误') {
  error(res, msg, 500);
}

module.exports = {
  success,
  successPage,
  error,
  badRequest,
  unauthorized,
  notFound,
  serverError,
};
