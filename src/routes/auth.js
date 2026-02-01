const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

/**
 * 认证相关路由
 */

// POST /api/auth/login - 用户登录（无需认证）
router.post('/login', AuthController.login);

// POST /api/auth/logout - 用户登出（需要认证）
router.post('/logout', authMiddleware, AuthController.logout);

// GET /api/auth/info - 获取当前用户信息（需要认证）
router.get('/info', authMiddleware, AuthController.getUserInfo);

// POST /api/auth/change-password - 修改密码（需要认证）
router.post('/change-password', authMiddleware, AuthController.changePassword);

module.exports = router;
