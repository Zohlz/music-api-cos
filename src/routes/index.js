const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const searchRoutes = require('./search');
const musicRoutes = require('./music');
const { authMiddleware } = require('../middlewares/auth');

// 测试路由
router.get('/test', (req, res) => {
  res.json({
    code: 200,
    msg: 'API 服务运行正常',
    data: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

// 认证路由（无需认证）
router.use('/auth', authRoutes);

// 以下路由需要认证
// 搜索路由（ESP接口除外）
router.use('/search', (req, res, next) => {
  // ESP接口不需要认证
  if (req.path === '/esp') {
    return next();
  }
  // 其他接口需要认证
  authMiddleware(req, res, next);
}, searchRoutes);

// 音乐路由（stream接口除外，因为audio标签不会发送Authorization头）
router.use('/music', (req, res, next) => {
  // stream接口不需要认证
  if (req.path.includes('/stream')) {
    return next();
  }
  // 其他接口需要认证
  authMiddleware(req, res, next);
}, musicRoutes);

module.exports = router;
