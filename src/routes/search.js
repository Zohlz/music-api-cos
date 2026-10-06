const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/searchController');
const { espAuthMiddleware } = require('../middlewares/espAuth');

/**
 * 搜索相关路由
 */

// GET /api/search - 搜索音乐
router.get('/', SearchController.search);

// GET /api/search/esp - ESP端音乐解析接口（设备签名鉴权，无需登录账号）
// 说明：兼容旧固件，一步完成搜索+解析第一首
router.get('/esp', espAuthMiddleware, SearchController.espParse);

// GET /api/search/esp/search - ESP端搜索音乐（设备签名鉴权，无需登录账号）
// 说明：只返回搜索结果列表，由设备选择后再调用 /api/music/esp/:songId
router.get('/esp/search', espAuthMiddleware, SearchController.espSearch);

// GET /api/search/esp/list - ESP端获取服务器已有音乐列表（设备签名鉴权，主页展示）
// 说明：分页返回已入库音乐，支持按歌名/歌手过滤
router.get('/esp/list', espAuthMiddleware, SearchController.espMusicList);

module.exports = router;
