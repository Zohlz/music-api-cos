const response = require('../utils/response');

/**
 * 参数校验中间件生成器
 * @param {Object} rules - 校验规则
 * @param {string} [source='body'] - 参数来源: 'body', 'query', 'params'
 * @returns {Function} Express 中间件
 */
function validate(rules, source = 'body') {
  return (req, res, next) => {
    const data = req[source] || {};
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      // 必填校验
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.label || field} 不能为空`);
        continue;
      }

      // 如果非必填且值为空，跳过后续校验
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // 类型校验
      if (rule.type) {
        const actualType = typeof value;
        if (rule.type === 'number' && actualType !== 'number') {
          // 尝试转换为数字
          const num = Number(value);
          if (isNaN(num)) {
            errors.push(`${rule.label || field} 必须是数字`);
            continue;
          }
        } else if (rule.type === 'string' && actualType !== 'string') {
          errors.push(`${rule.label || field} 必须是字符串`);
          continue;
        } else if (rule.type === 'array' && !Array.isArray(value)) {
          errors.push(`${rule.label || field} 必须是数组`);
          continue;
        }
      }

      // 最小值校验
      if (rule.min !== undefined) {
        const numValue = Number(value);
        if (numValue < rule.min) {
          errors.push(`${rule.label || field} 不能小于 ${rule.min}`);
        }
      }

      // 最大值校验
      if (rule.max !== undefined) {
        const numValue = Number(value);
        if (numValue > rule.max) {
          errors.push(`${rule.label || field} 不能大于 ${rule.max}`);
        }
      }

      // 最小长度校验
      if (rule.minLength !== undefined && typeof value === 'string') {
        if (value.length < rule.minLength) {
          errors.push(`${rule.label || field} 长度不能小于 ${rule.minLength}`);
        }
      }

      // 最大长度校验
      if (rule.maxLength !== undefined && typeof value === 'string') {
        if (value.length > rule.maxLength) {
          errors.push(`${rule.label || field} 长度不能大于 ${rule.maxLength}`);
        }
      }

      // 正则校验
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push(rule.message || `${rule.label || field} 格式不正确`);
        }
      }

      // 枚举校验
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${rule.label || field} 必须是以下值之一: ${rule.enum.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return response.badRequest(res, errors.join('; '));
    }

    next();
  };
}

/**
 * 常用校验规则
 */
const rules = {
  // 搜索参数校验
  search: {
    keyword: { required: true, type: 'string', label: '搜索关键词' },
    pageNum: { type: 'number', min: 1, label: '页码' },
    pageSize: { type: 'number', min: 1, max: 100, label: '每页数量' },
  },

  // 解析参数校验
  parse: {
    songId: { required: true, type: 'string', label: '歌曲ID' },
    songName: { required: true, type: 'string', label: '歌曲名称' },
  },

  // 列表查询参数校验
  list: {
    pageNum: { type: 'number', min: 1, label: '页码' },
    pageSize: { type: 'number', min: 1, max: 100, label: '每页数量' },
  },

  // 批量删除参数校验
  batchDelete: {
    musicIds: { required: true, type: 'array', label: '音乐ID列表' },
  },
};

module.exports = {
  validate,
  rules,
};
