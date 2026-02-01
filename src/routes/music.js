const express = require('express');
const router = express.Router();
const MusicController = require('../controllers/musicController');

/**
 * 音乐相关路由
 */

// POST /api/music/parse - 解析并保存音乐
router.post('/parse', MusicController.parseAndSave);

// GET /api/music/list - 获取音乐列表
router.get('/list', MusicController.list);

// DELETE /api/music/batch - 批量删除音乐（注意：此路由需要在 /:musicId 之前定义）
router.delete('/batch', MusicController.batchRemove);

// GET /api/music/:musicId - 获取音乐详情
router.get('/:musicId', MusicController.detail);

// GET /api/music/:musicId/play - 获取播放信息
router.get('/:musicId/play', MusicController.play);

// GET /api/music/:musicId/stream - 音频流代理
router.get('/:musicId/stream', MusicController.stream);

// DELETE /api/music/:musicId - 删除音乐
router.delete('/:musicId', MusicController.remove);

module.exports = router;
