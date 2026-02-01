const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/searchController');

/**
 * 搜索相关路由
 */

// GET /api/search - 搜索音乐
router.get('/', SearchController.search);

// GET /api/search/esp - ESP端音乐解析接口（无需认证）
router.get('/esp', SearchController.espParse);

module.exports = router;
