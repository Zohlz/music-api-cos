# 🎵 音乐管理平台 API

基于 Node.js + Express + MySQL + 腾讯云 COS 的音乐搜索解析简易管理平台。

## 功能特性

- **音乐搜索**：通过关键词搜索酷我音乐平台的歌曲
- **音乐解析**：获取歌曲的音频流链接，下载并转换为 MP3 格式
- **COS 存储**：将音频文件上传到腾讯云 COS，生成永久播放链接
- **音乐管理**：对已保存的音乐进行增删改查管理

## 技术栈

- **后端框架**：Express.js
- **数据库**：MySQL 8.0+
- **云存储**：腾讯云 COS
- **音频处理**：FFmpeg
- **HTTP 客户端**：Axios

## 快速开始

### 1. 环境要求

- Node.js >= 16.0
- MySQL >= 8.0
- FFmpeg（需添加到系统 PATH）

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

```env
# 服务配置
PORT=3000
NODE_ENV=development

# MySQL 配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=music_db

# 腾讯云 COS 配置
COS_SECRET_ID=your_secret_id
COS_SECRET_KEY=your_secret_key
COS_BUCKET=your-bucket-1234567890
COS_REGION=ap-guangzhou
COS_BASE_URL=https://your-bucket-1234567890.cos.ap-guangzhou.myqcloud.com

# 酷我 API 配置
KUWO_API_KEY=your_api_key
```

### 4. 初始化数据库

```bash
mysql -u root -p < sql/init.sql
```

### 5. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

服务启动后访问：http://localhost:3000

## API 接口

### 搜索接口

#### 搜索音乐

```
GET /api/search?keyword=关键词&pageNum=1&pageSize=20
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total": 100,
    "rows": [
      {
        "songId": "12345",
        "songName": "歌曲名",
        "artist": "歌手",
        "album": "专辑",
        "duration": 240,
        "coverUrl": "https://...",
        "playCount": 10000
      }
    ]
  }
}
```

#### ESP端音乐解析接口（ZZPET小狗专用）

```
GET /api/search/esp?msg=歌曲名称
```

**说明**：此接口专为 ZZPET 小狗设备提供，无需认证即可访问。接口会自动搜索、解析并返回第一首匹配歌曲的完整信息（包含音频播放链接）。

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| msg | string | 是 | 歌曲名称或关键词 |

**请求示例**：

```
GET /api/search/esp?msg=晴天
```

**成功响应示例**：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "success": true,
    "songId": "12345",
    "songName": "晴天",
    "artist": "周杰伦",
    "album": "叶惠美",
    "duration": 269,
    "coverUrl": "https://your-bucket.cos.ap-guangzhou.myqcloud.com/covers/12345.jpg",
    "audioUrl": "https://your-bucket.cos.ap-guangzhou.myqcloud.com/music/12345.mp3",
    "lyricUrl": "https://api.xiaodaokg.com/kw/kwlyric.php?songId=12345"
  }
}
```

**失败响应示例**：

```json
{
  "code": 400,
  "msg": "歌曲名称不能为空",
  "data": null
}
```

```json
{
  "code": 500,
  "msg": "未找到相关歌曲",
  "data": null
}
```

```json
{
  "code": 500,
  "msg": "解析失败: 获取音频链接失败",
  "data": null
}
```

**接口特点**：

- 🔓 **无需认证**：ESP 设备可直接调用，无需登录或 Token
- 🎯 **自动解析**：自动搜索并解析第一首匹配的歌曲
- 💾 **智能缓存**：已解析过的歌曲直接返回，避免重复解析
- 🎵 **完整信息**：返回包含音频 URL、封面、歌词等完整播放信息
- ⚡ **快速响应**：缓存命中时秒级响应

### 音乐接口

#### 解析并保存音乐

```
POST /api/music/parse
Content-Type: application/json

{
  "songId": "12345",
  "songName": "歌曲名",
  "artist": "歌手",
  "album": "专辑",
  "duration": 240,
  "coverUrl": "https://..."
}
```

#### 获取音乐列表

```
GET /api/music/list?pageNum=1&pageSize=20&songName=关键词&artist=歌手
```

#### 获取音乐详情

```
GET /api/music/:musicId
```

#### 获取播放信息

```
GET /api/music/:musicId/play
```

#### 删除音乐

```
DELETE /api/music/:musicId
```

#### 批量删除音乐

```
DELETE /api/music/batch
Content-Type: application/json

{
  "musicIds": [1, 2, 3]
}
```

## 项目结构

```
music-api-cos/
├── src/
│   ├── app.js                 # 应用入口
│   ├── config/
│   │   ├── index.js           # 配置汇总
│   │   ├── database.js        # 数据库配置
│   │   └── cos.js             # COS 配置
│   ├── routes/
│   │   ├── index.js           # 路由汇总
│   │   ├── music.js           # 音乐路由
│   │   └── search.js          # 搜索路由
│   ├── controllers/
│   │   ├── musicController.js # 音乐控制器
│   │   └── searchController.js# 搜索控制器
│   ├── services/
│   │   ├── musicService.js    # 音乐业务服务
│   │   ├── parseService.js    # 音乐解析服务
│   │   └── cosService.js      # COS 上传服务
│   ├── models/
│   │   └── music.js           # 音乐数据模型
│   ├── utils/
│   │   ├── response.js        # 响应格式化
│   │   ├── httpClient.js      # HTTP 请求封装
│   │   └── audioConverter.js  # 音频转换工具
│   └── middlewares/
│       ├── errorHandler.js    # 错误处理中间件
│       └── validator.js       # 参数校验中间件
├── sql/
│   └── init.sql               # 数据库初始化脚本
├── docs/
│   ├── 需求文档.md
│   └── 任务列表.md
├── temp/                      # 临时文件目录
├── .env.example               # 环境变量示例
├── .gitignore
├── package.json
└── README.md
```

## 业务流程

### 音乐解析流程

```
1. 用户搜索音乐 → 调用酷我音乐搜索 API
2. 用户选择歌曲 → 调用解析接口
3. 获取音频下载链接 → 调用第三方解析 API
4. 下载音频文件 → 保存到临时目录
5. 格式转换 → 使用 FFmpeg 转换为 MP3
6. 上传到 COS → 获取永久访问链接
7. 保存到数据库 → 返回音乐信息
8. 清理临时文件
```

## 更换 API 地址和解析方法

本项目使用了多个第三方 API 来实现音乐搜索和解析功能。如果需要更换 API 地址或解析方法，请按照以下步骤操作：

### 1. API 配置文件位置

所有 API 相关配置都在 [`src/config/index.js`](src/config/index.js:1) 文件中：

```javascript
// 酷我 API 配置
kuwo: {
  apiKey: process.env.KUWO_API_KEY,           // 解析 API 的密钥
  searchUrl: 'http://search.kuwo.cn/r.s',     // 搜索 API 地址
  parseApiUrl: 'https://www.52api.cn/api/kuwo', // 解析 API 地址
  lyricUrl: 'https://api.xiaodaokg.com/kw/kwlyric.php', // 歌词 API 地址
}
```

### 2. 更换搜索 API

如果需要更换音乐搜索 API（默认使用酷我音乐官方搜索接口）：

**步骤 1：修改配置文件**

编辑 [`src/config/index.js`](src/config/index.js:29)，修改 `searchUrl`：

```javascript
searchUrl: 'https://your-new-search-api.com/search',
```

**步骤 2：修改搜索逻辑**

编辑 [`src/services/parseService.js`](src/services/parseService.js:19) 中的 [`searchKuwoMusic()`](src/services/parseService.js:19) 方法：

```javascript
async searchKuwoMusic(keyword, pageNum = 1, pageSize = 20) {
  const url = config.kuwo.searchUrl;
  
  // 根据新 API 的要求修改请求参数
  const params = {
    keyword: keyword,  // 修改为新 API 的参数名
    page: pageNum,
    size: pageSize,
    // ... 其他参数
  };
  
  const result = await get(url, params);
  
  // 根据新 API 的响应格式修改数据解析逻辑
  const rows = result.data.map((item) => ({
    songId: item.id,           // 映射到新 API 的字段
    songName: item.name,
    artist: item.singer,
    // ... 其他字段映射
  }));
  
  return { total: result.total, rows };
}
```

### 3. 更换解析 API

如果需要更换音乐解析 API（默认使用 52api.cn）：

**步骤 1：修改配置文件**

编辑 [`src/config/index.js`](src/config/index.js:30)，修改 `parseApiUrl`：

```javascript
parseApiUrl: 'https://your-new-parse-api.com/parse',
```

**步骤 2：修改环境变量**

编辑 [`.env`](.env:1) 文件，更新 API Key（如果新 API 需要）：

```env
KUWO_API_KEY=your_new_api_key
```

**步骤 3：修改解析逻辑**

编辑 [`src/services/parseService.js`](src/services/parseService.js:112) 中的 [`getAudioUrl()`](src/services/parseService.js:112) 方法：

```javascript
async getAudioUrl(songId) {
  // 根据新 API 的要求构建请求 URL
  const apiUrl = `${config.kuwo.parseApiUrl}?id=${songId}&key=${config.kuwo.apiKey}`;
  
  const result = await get(apiUrl);
  
  // 根据新 API 的响应格式修改数据提取逻辑
  if (!result || result.code !== 200) {
    return null;
  }
  
  return {
    mp3Url: result.data.mp3_url,    // 映射到新 API 的字段
    flacUrl: result.data.flac_url,
  };
}
```

### 4. 更换歌词 API

如果需要更换歌词 API：

**步骤 1：修改配置文件**

编辑 [`src/config/index.js`](src/config/index.js:31)，修改 `lyricUrl`：

```javascript
lyricUrl: 'https://your-new-lyric-api.com/lyric',
```

**步骤 2：修改歌词 URL 构建逻辑**

编辑 [`src/services/parseService.js`](src/services/parseService.js:141) 中的 [`buildLyricUrl()`](src/services/parseService.js:141) 方法：

```javascript
buildLyricUrl(songId) {
  // 根据新 API 的要求构建歌词 URL
  return `${config.kuwo.lyricUrl}?songId=${songId}&format=lrc`;
}
```

### 5. 切换到其他音乐平台

如果需要从酷我音乐切换到其他平台（如网易云、QQ音乐等）：

**步骤 1：添加新平台配置**

在 [`src/config/index.js`](src/config/index.js:26) 中添加新平台配置：

```javascript
// 网易云音乐配置示例
netease: {
  apiKey: process.env.NETEASE_API_KEY,
  searchUrl: 'https://netease-api.com/search',
  parseApiUrl: 'https://netease-api.com/song/url',
  lyricUrl: 'https://netease-api.com/lyric',
},
```

**步骤 2：创建新的解析服务**

创建 `src/services/neteaseParseService.js`，实现与 [`parseService.js`](src/services/parseService.js:1) 相同的接口方法。

**步骤 3：修改控制器**

在 [`src/controllers/searchController.js`](src/controllers/searchController.js:1) 和 [`src/controllers/musicController.js`](src/controllers/musicController.js:1) 中，将 `ParseService` 替换为新的服务。

### 6. 常见问题

**Q: 更换 API 后搜索失败？**

A: 检查以下几点：
- API 地址是否正确
- 请求参数是否符合新 API 的要求
- 响应数据解析逻辑是否正确
- 查看控制台日志中的详细错误信息

**Q: 解析失败或下载链接无效？**

A: 可能原因：
- API Key 未配置或已过期
- 解析 API 返回的链接格式不正确
- 音频链接有时效性限制
- 检查 [`parseService.js`](src/services/parseService.js:112) 中的日志输出

**Q: 如何调试 API 请求？**

A: 在 [`src/services/parseService.js`](src/services/parseService.js:1) 中已有详细的日志输出，可以查看：
```javascript
console.log(`[Parse] API 响应:`, result);
```

### 7. 推荐的第三方 API

- **52api.cn**：支持多平台音乐解析（当前使用，但需付费）
- **api.yaohud.cn**：有免费的解析
- **yunzhiapi.cn**：有免费的解析

## 注意事项

1. **FFmpeg 安装**：确保系统已安装 FFmpeg 并添加到 PATH
   - Windows: 下载并配置环境变量
   - Linux: `apt install ffmpeg` 或 `yum install ffmpeg`
   - macOS: `brew install ffmpeg`

2. **COS 配置**：确保 COS 存储桶设置为公有读权限，或配置 CDN 加速

3. **API Key**：酷我音乐解析需要第三方 API Key（项目使用www.52api.cn），请自行获取

4. **API 稳定性**：第三方 API 可能存在不稳定或失效的情况，建议准备备用方案

## License

ISC
