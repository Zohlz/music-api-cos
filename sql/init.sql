-- 创建数据库
CREATE DATABASE IF NOT EXISTS `music_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `music_db`;

-- 创建音乐表
CREATE TABLE IF NOT EXISTS `music` (
  `music_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '音乐ID',
  `song_id` VARCHAR(64) NOT NULL COMMENT '歌曲ID（来源平台的唯一标识）',
  `song_name` VARCHAR(255) NOT NULL COMMENT '歌曲名称',
  `artist` VARCHAR(255) DEFAULT NULL COMMENT '歌手/艺术家',
  `album` VARCHAR(255) DEFAULT NULL COMMENT '专辑名称',
  `duration` INT DEFAULT NULL COMMENT '时长（秒）',
  `cover_url` VARCHAR(512) DEFAULT NULL COMMENT '封面图片URL',
  `audio_url` VARCHAR(512) DEFAULT NULL COMMENT '音频播放URL（COS链接）',
  `lyric_url` VARCHAR(512) DEFAULT NULL COMMENT '歌词URL',
  `source` VARCHAR(32) DEFAULT 'kuwo' COMMENT '来源平台',
  `play_count` BIGINT DEFAULT 0 COMMENT '播放次数',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_song_id` (`song_id`),
  INDEX `idx_song_name` (`song_name`),
  INDEX `idx_artist` (`artist`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='音乐表';

-- 创建管理员用户表
CREATE TABLE IF NOT EXISTS `admin_user` (
  `user_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(64) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  `nickname` VARCHAR(64) DEFAULT NULL COMMENT '昵称',
  `email` VARCHAR(128) DEFAULT NULL COMMENT '邮箱',
  `avatar` VARCHAR(512) DEFAULT NULL COMMENT '头像URL',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(64) DEFAULT NULL COMMENT '最后登录IP',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_username` (`username`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员用户表';

