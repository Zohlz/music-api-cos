# 🎵 音乐管理平台 API

基于 Node.js + Express + MySQL + 腾讯云 COS 的音乐搜索解析简易管理平台。

> ⚠️ **仅供学习与个人技术研究使用，请勿用于商业用途。** 本项目不存储、不提供、不分发任何音乐文件，仅提供搜索/解析接口的封装与存储适配，所有音乐内容的版权均归原权利人所有。使用前请阅读文末的 [免责声明](#免责声明)。

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

# ESP32 设备鉴权配置（固件内置）
ESP_ACCESS_KEY=esp32_device_01
ESP_ACCESS_SECRET=your_random_secret
ESP_SIGNATURE_TTL=300
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

### ESP端接口（嵌入式设备专用）

ESP 设备没有账号体系，以下接口均**不走账号登录**，而是通过**设备签名鉴权**访问，校验固件内置密钥的签名，无需登录即可调用。

提供以下几种用法：

| 用法 | 接口 | 说明 |
|------|------|------|
| 一步（兼容旧固件） | `GET /api/search/esp?msg=歌曲名称` | 自动搜索并解析**第一首**匹配歌曲，一步返回完整播放信息 |
| 两步（推荐，可自由选歌） | `GET /api/search/esp/search` → `GET /api/music/esp/:songId` | 先返回候选歌曲列表（含 `songId`），设备选定后再获取该歌曲的完整播放信息 |
| 主页/歌单展示 | `GET /api/search/esp/list` | 分页返回服务器**已入库**的音乐列表，支持按歌名/歌手过滤 |

#### 鉴权请求头（三项必填）

| 请求头 | 说明 |
|--------|------|
| X-ESP-Key | 设备标识，对应服务端的 `ESP_ACCESS_KEY` |
| X-ESP-Timestamp | Unix 时间戳，支持秒或毫秒 |
| X-ESP-Signature | HMAC-SHA256 签名（十六进制小写） |

#### 签名算法

```
待签名字符串（\n 分隔）：
METHOD\n{path}\n{query}\n{timestamp}\n{accessKey}

signature = HMAC_SHA256(ESP_ACCESS_SECRET, 待签名字符串)
```

示例（`GET /api/search/esp?msg=晴天`，时间戳 1730000000000）：

```
GET\n/api/search/esp\nmsg=%E6%99%B4%E5%A4%A9\n1730000000000\nesp32_device_01
```

> 注意：`{path}` 为完整接口路径（如 `/api/search/esp`、`/api/music/esp/12345`）；`{query}` 使用 URL 编码后的原始查询串，且参数顺序需与请求 URL 保持一致。

**鉴权失败响应示例**：

```json
{
  "code": 401,
  "msg": "签名校验失败",
  "data": {
    "serverTime": 1730000000123
  }
}
```

> 失败时会返回 `serverTime`，设备可用它校正本地时钟后重试。

#### 一步接口（兼容旧固件）：搜索并解析第一首

```
GET /api/search/esp?msg=歌曲名称
```

**说明**：自动搜索并解析第一首匹配歌曲，已解析过的歌曲直接返回缓存，一步即可拿到音频链接。适合设备端无法展示候选列表的场景。

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| msg | string | 是 | 歌曲名称或关键词 |

**请求示例**：

```
GET /api/search/esp?msg=晴天
X-ESP-Key: esp32_device_01
X-ESP-Timestamp: 1730000000000
X-ESP-Signature: 3f2a...（签名值）
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

#### 第一步：ESP搜索音乐（返回候选列表）

```
GET /api/search/esp/search?msg=晴天&pageNum=1&pageSize=10
```

**说明**：只返回搜索结果候选列表，不做解析。设备展示候选歌曲（含 `songId`），由用户选定后再调用「第二步」接口获取音乐。

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| msg | string | 是 | 歌曲名称或关键词（也兼容 `keyword`） |
| pageNum | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

**请求示例**：

```
GET /api/search/esp/search?msg=晴天&pageSize=10
X-ESP-Key: esp32_device_01
X-ESP-Timestamp: 1730000000000
X-ESP-Signature: 3f2a...（签名值）
```

**成功响应示例**：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total": 100,
    "rows": [
      {
        "songId": "12345",
        "songName": "晴天",
        "artist": "周杰伦",
        "album": "叶惠美",
        "duration": 269,
        "coverUrl": "https://img1.kuwo.cn/star/albumcover/xxx.jpg",
        "playCount": 10000
      }
    ]
  }
}
```

#### 第二步：ESP选中音乐并获取播放信息

```
GET /api/music/esp/:songId?songName=晴天&artist=周杰伦
```

**说明**：`songId` 为第一步搜索结果中的歌曲 ID。

- 该歌曲**已解析过**：直接返回缓存的完整播放信息，无需携带歌曲信息；
- 该歌曲**未解析过**：需携带 `songName` 等歌曲信息触发服务端解析入库后返回。

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| songId | string | 是 | 歌曲 ID（路径参数，来自搜索结果） |
| songName | string | 首次必填 | 歌曲名称（已缓存歌曲可不传） |
| artist | string | 否 | 歌手（首次解析建议携带） |
| album | string | 否 | 专辑（可选） |
| duration | number | 否 | 时长，秒（可选） |
| coverUrl | string | 否 | 封面 URL（可选） |

**请求示例**：

```
GET /api/music/esp/12345?songName=%E6%99%B4%E5%A4%A9&artist=%E5%91%A8%E6%9D%B0%E4%BC%A6
X-ESP-Key: esp32_device_01
X-ESP-Timestamp: 1730000000000
X-ESP-Signature: 3f2a...（签名值）
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

#### 主页列表：ESP获取服务器已有音乐

```
GET /api/search/esp/list?pageNum=1&pageSize=10&songName=关键词&artist=歌手
```

**说明**：返回服务器上**已解析入库**的音乐列表（仅正常状态歌曲，按入库时间倒序），适合设备主页/歌单展示，播放时可直接使用返回的 `audioUrl` 或 `musicId`。

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| songName | string | 否 | 歌名模糊过滤（可选） |
| artist | string | 否 | 歌手模糊过滤（可选） |

**请求示例**：

```
GET /api/search/esp/list?pageNum=1&pageSize=10
X-ESP-Key: esp32_device_01
X-ESP-Timestamp: 1730000000000
X-ESP-Signature: 3f2a...（签名值）
```

**成功响应示例**：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total": 25,
    "rows": [
      {
        "musicId": 1,
        "songId": "12345",
        "songName": "晴天",
        "artist": "周杰伦",
        "album": "叶惠美",
        "duration": 269,
        "coverUrl": "https://your-bucket.cos.ap-guangzhou.myqcloud.com/covers/12345.jpg",
        "audioUrl": "https://your-bucket.cos.ap-guangzhou.myqcloud.com/music/12345.mp3",
        "lyricUrl": "https://api.xiaodaokg.com/kw/kwlyric.php?songId=12345",
        "source": "kuwo",
        "playCount": 10000,
        "status": 1,
        "createTime": "2026-01-01 12:00:00",
        "updateTime": "2026-01-01 12:00:00"
      }
    ]
  }
}
```

#### 接口特点

- 🔐 **设备签名鉴权**：只有内置密钥的固件可调用，密钥不随请求传输，抓包也无法伪造
- ⏱ **防重放**：签名受时间窗口（`ESP_SIGNATURE_TTL`，默认 300 秒）限制且一次性有效
- 🎯 **两步选歌**：先搜索候选列表，再按 `songId` 精确获取所选歌曲，避免一步接口只能命中第一首的问题
- 💾 **智能缓存**：已解析过的歌曲直接返回，避免重复解析
- 🎵 **完整信息**：返回包含音频 URL、封面、歌词等完整播放信息
- ⚡ **快速响应**：缓存命中时秒级响应

#### ESP32 固件接入示例（Arduino）

> 以下示例调用「一步接口」`/api/search/esp`（兼容旧固件）。若改用两步流程，仅需把请求路径分别换成 `/api/search/esp/search`（搜索）和 `/api/music/esp/:songId`（获取音乐），签名方式完全相同——`{path}` 换成实际请求的完整路径即可。

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <mbedtls/md.h>
#include <time.h>

const char* API_HOST = "http://your-server";
const char* ESP_ACCESS_KEY = "esp32_device_01";
const char* ESP_ACCESS_SECRET = "your_random_secret";

// URL 编码（中文歌名必须编码，且要与最终请求 URL 中的顺序一致）
String urlEncode(const String& src) {
  String out;
  char buf[4];
  for (size_t i = 0; i < src.length(); i++) {
    char c = src[i];
    if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
      out += c;
    } else {
      sprintf(buf, "%%%02X", (uint8_t)c);
      out += buf;
    }
  }
  return out;
}

// HMAC-SHA256，输出 64 位十六进制小写字符串
String hmacSha256(const String& key, const String& msg) {
  uint8_t mac[32];
  mbedtls_md_context_t ctx;
  const mbedtls_md_info_t* info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, info, 1);
  mbedtls_md_hmac_starts(&ctx, (const uint8_t*)key.c_str(), key.length());
  mbedtls_md_hmac_update(&ctx, (const uint8_t*)msg.c_str(), msg.length());
  mbedtls_md_hmac_finish(&ctx, mac);
  mbedtls_md_free(&ctx);

  String out;
  char hex[3];
  for (int i = 0; i < 32; i++) {
    sprintf(hex, "%02x", mac[i]);
    out += hex;
  }
  return out;
}

void requestMusic(const String& songName) {
  String path = "/api/search/esp";
  String query = "msg=" + urlEncode(songName);
  String ts = String((uint64_t)time(nullptr) * 1000ULL);

  String canonical = "GET\n" + path + "\n" + query + "\n" + ts + "\n" + ESP_ACCESS_KEY;
  String signature = hmacSha256(ESP_ACCESS_SECRET, canonical);

  HTTPClient http;
  http.begin(String(API_HOST) + path + "?" + query);
  http.addHeader("X-ESP-Key", ESP_ACCESS_KEY);
  http.addHeader("X-ESP-Timestamp", ts);
  http.addHeader("X-ESP-Signature", signature);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    Serial.println(payload);
  } else {
    Serial.printf("请求失败: %d\n", httpCode);
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  WiFi.begin("SSID", "PASSWORD");
  while (WiFi.status() != WL_CONNECTED) delay(500);

  // 时间同步（签名依赖时间戳，必须先同步）
  configTime(8 * 3600, 0, "ntp.aliyun.com");
  while (time(nullptr) < 1700000000) delay(500);

  requestMusic("晴天");
}

void loop() {}
```

> 若设备确实无法同步时间，可在服务端配置 `ESP_STATIC_TOKEN` 作为简易模式（设备只发送 `X-ESP-Token`），但密钥会随每个请求明文传输，仅建议调试使用。

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
│       ├── auth.js            # JWT 认证中间件
│       ├── espAuth.js         # ESP32 设备签名鉴权中间件
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

## 免责声明

1. **使用范围**：本项目为开源的技术学习项目，仅供**学习、研究与个人技术交流**使用，**严禁用于任何商业用途**，也不得用于任何违反所在地法律法规的场景。
2. **不提供音乐内容**：本项目自身**不存储、不托管、不提供、不分发**任何音乐、歌词、封面等受版权保护的内容。项目输出的音频、歌词等链接均来自**第三方公开接口或第三方解析服务**，本项目仅做请求转发与地址封装。
3. **版权归属**：所有音乐作品、歌词、专辑封面及相关元数据的著作权、商标权等一切权利，均归其原始权利人（唱片公司、词曲作者、歌手、平台等）所有。请通过官方渠道获取授权后欣赏或使用相关作品。
4. **无关联、无授权**：本项目与酷我音乐、腾讯云，以及其他任何音乐平台、API 服务商均**没有任何隶属、合作、代理或背书关系**，文中出现的平台名称、商标、Logo 仅为技术说明与兼容性描述，其权利归各自所有者所有。
5. **第三方服务风险**：项目依赖的第三方接口（搜索、解析、歌词等）可能存在变更、失效、收费或合规风险。本项目对其可用性、准确性、合法性及持续性**不作任何明示或暗示的保证**，也不对此承担任何责任。
6. **责任限制**：使用者须自行判断并承担使用本项目（或修改后的版本）所带来的一切风险与后果。因使用、修改、分发本项目而导致的任何直接或间接损失、数据损坏、账号封禁、法律纠纷等，作者及贡献者**不承担任何责任**。
7. **合规义务**：使用者应自行确保其使用行为符合所在国家/地区的法律法规以及相关平台的服务条款，不得用于规避付费、批量抓取、二次分发等侵权或违规用途。请勿将本项目部署为面向公众的公开音乐服务。
8. **侵权处理**：如权利人认为本项目存在侵犯其合法权益的内容，请通过仓库 Issue 联系，我们将在核实后**及时删除或调整**相关代码与文档。
9. **密钥安全**：仓库中的 `.env`、示例密钥等仅用于本地开发演示，请勿提交真实的生产密钥；若密钥已泄露，请立即轮换。

> 若您不同意上述任何条款，请停止使用本项目。

## License

ISC