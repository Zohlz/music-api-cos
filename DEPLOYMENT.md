# 🚀 部署教程

本文档提供了音乐管理平台的完整部署指南，包括本地开发环境部署和宝塔面板生产环境部署两种方式。

## 📋 目录

- [本地开发环境部署](#本地开发环境部署)
- [宝塔面板生产环境部署](#宝塔面板生产环境部署)
- [常见问题](#常见问题)

---

## 本地开发环境部署

适用于 Windows、macOS、Linux 本地开发环境。

### 1. 环境准备

#### 1.1 安装 Node.js

**Windows:**
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本（推荐 18.x 或更高）
3. 运行安装程序，按默认选项安装
4. 验证安装：
```bash
node -v
npm -v
```

**macOS:**
```bash
# 使用 Homebrew 安装
brew install node@18

# 验证安装
node -v
npm -v
```

**Linux (Ubuntu/Debian):**
```bash
# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v
npm -v
```

#### 1.2 安装 MySQL

**Windows:**
1. 访问 [MySQL 官网](https://dev.mysql.com/downloads/mysql/)
2. 下载 MySQL Installer
3. 运行安装程序，选择 "Developer Default"
4. 设置 root 密码
5. 完成安装

**macOS:**
```bash
# 使用 Homebrew 安装
brew install mysql@8.0

# 启动 MySQL
brew services start mysql@8.0

# 安全配置
mysql_secure_installation
```

**Linux (Ubuntu/Debian):**
```bash
# 安装 MySQL
sudo apt update
sudo apt install -y mysql-server

# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

#### 1.3 安装 FFmpeg

**Windows:**
1. 访问 [FFmpeg 官网](https://ffmpeg.org/download.html)
2. 下载 Windows 版本
3. 解压到 `C:\ffmpeg`
4. 添加到系统环境变量 PATH：`C:\ffmpeg\bin`
5. 验证安装：
```bash
ffmpeg -version
```

**macOS:**
```bash
# 使用 Homebrew 安装
brew install ffmpeg

# 验证安装
ffmpeg -version
```

**Linux (Ubuntu/Debian):**
```bash
# 安装 FFmpeg
sudo apt install -y ffmpeg

# 验证安装
ffmpeg -version
```

### 2. 项目配置

#### 2.1 克隆项目

```bash
# 克隆项目到本地
git clone <your-repository-url>
cd music-api-cos

# 或者直接解压项目压缩包
```

#### 2.2 安装后端依赖

```bash
# 在项目根目录
npm install
```

#### 2.3 配置数据库

**创建数据库：**

```bash
# 登录 MySQL（Windows 使用 MySQL Command Line Client）
mysql -u root -p

# 输入密码后执行以下 SQL
CREATE DATABASE music_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（可选，也可以直接使用 root）
CREATE USER 'music_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON music_db.* TO 'music_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**导入数据库结构：**

```bash
# Windows (CMD)
mysql -u root -p music_db < sql\init.sql

# macOS/Linux
mysql -u root -p music_db < sql/init.sql
```

#### 2.4 配置环境变量

```bash
# 复制环境变量模板
# Windows (CMD)
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务配置
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000

# MySQL 配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=music_db

# 腾讯云 COS 配置
COS_SECRET_ID=your_secret_id
COS_SECRET_KEY=your_secret_key
COS_BUCKET=your-bucket-1234567890
COS_REGION=ap-guangzhou
COS_BASE_URL=https://your-bucket-1234567890.cos.ap-guangzhou.myqcloud.com

# JWT 配置
JWT_SECRET=your-secret-key-for-development
JWT_EXPIRES_IN=24h

# 酷我 API 配置
KUWO_API_KEY=your_api_key
```

#### 2.5 创建管理员账号

```bash
# 运行创建管理员脚本
node scripts/createAdmin.js
```

按提示输入：
- 用户名：admin
- 密码：设置一个强密码
- 邮箱：可选

#### 2.6 启动后端服务

```bash
# 开发模式（支持热重载）
npm run dev

# 或者普通模式
npm start
```

看到以下信息表示启动成功：
```
服务器运行在 http://localhost:3000
数据库连接成功
```

### 3. 前端配置

#### 3.1 安装前端依赖

```bash
# 进入前端目录
cd admin-ui

# 安装依赖
npm install
```

#### 3.2 配置前端环境变量

编辑 `admin-ui/.env.development` 文件：

```env
VITE_APP_BASE_API=/api
VITE_APP_TITLE=音乐管理平台(开发)
```

#### 3.3 启动前端开发服务器

```bash
# 在 admin-ui 目录下
npm run dev
```

看到以下信息表示启动成功：
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 4. 访问应用

1. 打开浏览器访问：`http://localhost:5173`
2. 使用创建的管理员账号登录
3. 开始使用音乐管理平台

### 5. 开发调试

**查看后端日志：**
- 后端控制台会实时输出请求日志和错误信息

**查看前端日志：**
- 打开浏览器开发者工具（F12）
- 查看 Console 标签页

**热重载：**
- 后端：使用 `npm run dev` 启动，修改代码自动重启
- 前端：使用 `npm run dev` 启动，修改代码自动刷新

---

## 宝塔面板生产环境部署

适用于使用宝塔面板的 Linux 服务器。

### 1. 安装宝塔面板

如果还未安装宝塔面板，请先安装：

**Ubuntu/Debian:**
```bash
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh ed8484bec
```

**CentOS:**
```bash
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh ed8484bec
```

安装完成后，记录面板地址、用户名和密码。

### 2. 宝塔面板环境配置

#### 2.1 登录宝塔面板

1. 访问宝塔面板地址（如：`http://your-server-ip:8888`）
2. 使用用户名和密码登录

#### 2.2 安装软件环境

在宝塔面板 **软件商店** 中安装以下软件：

1. **Nginx** - 版本 1.20 或更高
2. **MySQL** - 版本 8.0
3. **PM2 管理器** - 最新版本
4. **Node 版本管理器** - 安装后选择 Node.js 18.x

#### 2.3 安装 FFmpeg

点击宝塔面板左侧 **终端**，执行：

```bash
# Ubuntu/Debian
apt update
apt install -y ffmpeg

# CentOS
yum install -y epel-release
yum install -y ffmpeg

# 验证安装
ffmpeg -version
```

### 3. 上传项目文件

#### 3.1 创建网站目录

在宝塔面板 **文件** 中：
1. 进入 `/www/wwwroot/` 目录
2. 新建文件夹 `music-api`

#### 3.2 上传项目文件

**方式一：使用宝塔面板上传**
1. 在本地将项目打包为 `music-api-cos.zip`
2. 在宝塔面板文件管理中，进入 `/www/wwwroot/music-api`
3. 点击 **上传**，选择压缩包上传
4. 上传完成后，点击压缩包，选择 **解压**

**方式二：使用 Git**
1. 在宝塔面板 **终端** 中执行：
```bash
cd /www/wwwroot/music-api
git clone https://github.com/Zohlz/music-api-cos.git .
```

### 4. 配置数据库

#### 4.1 创建数据库

在宝塔面板 **数据库** 中：
1. 点击 **添加数据库**
2. 数据库名：`music_db`
3. 用户名：`music_user`
4. 密码：设置一个强密码
5. 访问权限：本地服务器
6. 点击 **提交**

#### 4.2 导入数据库结构

1. 在数据库列表中，找到 `music_db`
2. 点击 **管理** 进入 phpMyAdmin
3. 点击 **导入**
4. 选择项目中的 `sql/init.sql` 文件
5. 点击 **执行**

### 5. 配置后端项目

#### 5.1 安装依赖

在宝塔面板 **终端** 中：
```bash
cd /www/wwwroot/music-api
npm install --production
```

#### 5.2 配置环境变量

在宝塔面板 **文件** 中：
1. 进入 `/www/wwwroot/music-api` 目录
2. 复制 `.env.example` 为 `.env`
3. 编辑 `.env` 文件：

```env
# 服务配置
PORT=3000
NODE_ENV=production
API_BASE_URL=

# MySQL 配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=music_user
DB_PASSWORD=your_database_password
DB_NAME=music_db

# 腾讯云 COS 配置
COS_SECRET_ID=your_secret_id
COS_SECRET_KEY=your_secret_key
COS_BUCKET=your-bucket-1234567890
COS_REGION=ap-guangzhou
COS_BASE_URL=https://your-bucket-1234567890.cos.ap-guangzhou.myqcloud.com

# JWT 配置
JWT_SECRET=your-very-secure-random-string-change-in-production
JWT_EXPIRES_IN=24h

# 酷我 API 配置
KUWO_API_KEY=your_api_key
```

#### 5.3 创建管理员账号

在宝塔面板 **终端** 中：
```bash
cd /www/wwwroot/music-api
node scripts/createAdmin.js
```

### 6. 使用 PM2 启动后端

#### 6.1 在宝塔面板配置 PM2

1. 点击左侧 **软件商店**
2. 找到 **PM2 管理器**，点击 **设置**
3. 点击 **添加项目**
4. 配置如下：
   - **项目名称**：music-api
   - **启动文件**：`/www/wwwroot/music-api/src/app.js`
   - **项目路径**：`/www/wwwroot/music-api`
   - **运行目录**：`/www/wwwroot/music-api`
5. 点击 **提交**

#### 6.2 启动项目

在 PM2 管理器中，找到 `music-api` 项目，点击 **启动**。

查看日志确认启动成功。

### 7. 构建和部署前端

#### 7.1 本地构建前端

在本地开发环境中：

```bash
# 进入前端目录
cd admin-ui

# 配置生产环境变量
# 编辑 .env 文件
VITE_APP_BASE_API=/api
VITE_APP_TITLE=音乐管理平台

# 构建生产版本
npm run build
```

构建完成后，会在 `admin-ui/dist` 目录生成静态文件。

#### 7.2 上传前端文件到服务器

**方式一：使用宝塔面板上传**
1. 将 `admin-ui/dist` 目录打包为 `dist.zip`
2. 在宝塔面板创建网站目录 `/www/wwwroot/music-admin`
3. 上传并解压 `dist.zip` 到该目录

**方式二：使用 SCP**
```bash
# 在本地执行
scp -r admin-ui/dist/* root@your-server-ip:/www/wwwroot/music-admin/
```

### 8. 配置 Nginx

#### 8.1 添加网站

在宝塔面板 **网站** 中：
1. 点击 **添加站点**
2. 域名：填写你的域名（如：`music.example.com`）
3. 根目录：`/www/wwwroot/music-admin`
4. PHP 版本：纯静态
5. 点击 **提交**

#### 8.2 配置反向代理

1. 在网站列表中，找到刚创建的网站
2. 点击 **设置**
3. 点击 **反向代理**
4. 点击 **添加反向代理**
5. 配置如下：
   - **代理名称**：music-api
   - **目标 URL**：`http://127.0.0.1:3000`
   - **发送域名**：`$host`
   - **内容替换**：留空
6. 点击 **提交**

#### 8.3 配置 Nginx 规则

点击网站的 **配置文件**，修改为以下内容：

```nginx
server
{
    listen 80;
    listen [::]:80;
    #更换自己的服务器
    server_name xxx.xxx; 
    index index.php index.html index.htm default.php default.htm default.html;
    root /www/music-api/ui;
    #CERT-APPLY-CHECK--START
    # 用于SSL证书申请时的文件验证相关配置 -- 请勿删除
    include /www/server/panel/vhost/nginx/well-known/huixing.cloud.conf;
    #CERT-APPLY-CHECK--END
    include /www/server/panel/vhost/nginx/extension/huixing.cloud/*.conf;
    
    #SSL-START SSL相关配置，请勿删除或修改下一行带注释的404规则
    #error_page 404/404.html;
    #SSL-END

    #ERROR-PAGE-START  错误页配置，可以注释、删除或修改
    error_page 404 /404.html;
    #error_page 502 /502.html;
    #ERROR-PAGE-END

    #PHP-INFO-START  PHP引用配置，可以注释或修改
    include enable-php-00.conf;
    #PHP-INFO-END

    #REWRITE-START URL重写规则引用,修改后将导致面板设置的伪静态规则失效
    include /www/server/panel/vhost/rewrite/xxx.xxx.conf;
    #REWRITE-END
        
    #从这里复制    
	#####################
        
    #禁止访问的文件或目录
    location ~ ^/(\.user.ini|\.htaccess|\.git|\.env|\.svn|\.project|LICENSE|README.md)
    {
        return 404;
    }

    #一键申请SSL证书验证目录相关设置
    location ~ \.well-known{
        allow all;
    }

    #禁止在证书验证目录放入敏感文件
    if ( $uri ~ "^/\.well-known/.*\.(php|jsp|py|js|css|lua|ts|go|zip|tar\.gz|rar|7z|sql|bak)$" ) {
        return 403;
    }

    # ========== 静态资源缓存配置 ==========
    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$
    {
        expires      30d;
        error_log /dev/null;
        access_log /dev/null;
    }

    location ~ .*\.(js|css)?$
    {
        expires      12h;
        error_log /dev/null;
        access_log /dev/null;
    }

    # ========== API反向代理到本地3000端口 ==========
    location /api/ {
        # 转发到本地3000端口
        proxy_pass http://127.0.0.1:3000;
        # 传递真实的客户端IP
        proxy_set_header X-Real-IP $remote_addr;
        # 传递客户端IP列表
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # 传递原始主机名
        proxy_set_header Host $host;
        # 保持连接超时时间
        proxy_connect_timeout 60;
        proxy_read_timeout 600;
        proxy_send_timeout 600;
    }

    # ========== SPA 路由支持（Vue Router History 模式） ==========
    location / {
        try_files $uri $uri/ /index.html;
    }
    
	#####################
        
    #地址要改
    access_log  /www/wwwlogs/xxx.xxx.log;
    error_log  /www/wwwlogs/xxx.xxx.error.log;
}
```

点击 **保存**，然后重载 Nginx 配置。

### 9. 配置 SSL 证书（可选）

#### 9.1 申请 SSL 证书

在宝塔面板网站设置中：
1. 点击 **SSL**
2. 选择 **Let's Encrypt**
3. 勾选你的域名
4. 点击 **申请**

#### 9.2 强制 HTTPS

证书申请成功后：
1. 勾选 **强制 HTTPS**
2. 保存配置

### 10. 配置防火墙

在宝塔面板 **安全** 中：
1. 确保开放 **80** 端口（HTTP）
2. 确保开放 **443** 端口（HTTPS）
3. **3000** 端口不要对外开放（仅内部使用）

### 11. 测试访问

1. 访问你的域名：`http://your-domain.com` 或 `https://your-domain.com`
2. 使用管理员账号登录
3. 测试搜索和解析音乐功能

---

## 常见问题

### 1. 本地开发环境问题

#### Q: 端口被占用

**Windows:**
```bash
# 查看端口占用
netstat -ano | findstr :3000

# 杀死进程
taskkill /PID <进程ID> /F
```

**macOS/Linux:**
```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

#### Q: MySQL 连接失败

- 检查 MySQL 服务是否启动
- 检查 `.env` 中的数据库配置
- 检查数据库用户权限
- 尝试使用 MySQL 客户端连接测试

#### Q: FFmpeg 未找到

- 确认 FFmpeg 已安装：`ffmpeg -version`
- Windows 用户检查环境变量 PATH 是否配置正确
- 重启终端或 IDE

#### Q: npm install 失败

```bash
# 清除缓存
npm cache clean --force

# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

### 2. 宝塔面板部署问题

#### Q: PM2 启动失败

1. 检查 Node.js 版本是否正确（需要 16.0+）
2. 检查项目路径是否正确
3. 查看 PM2 日志中的错误信息
4. 检查 `.env` 文件配置是否正确

#### Q: Nginx 502 错误

1. 检查后端服务是否运行：在 PM2 管理器中查看状态
2. 检查端口是否正确：后端默认 3000 端口
3. 查看 Nginx 错误日志：`/www/wwwlogs/music-admin_error.log`
4. 检查防火墙是否阻止了内部通信

#### Q: 前端页面空白

1. 检查前端文件是否正确上传
2. 检查 Nginx 配置中的 root 路径
3. 查看浏览器控制台错误信息
4. 检查 Nginx 配置中的 `try_files` 规则

#### Q: API 请求失败

1. 检查 Nginx 反向代理配置
2. 检查后端服务是否正常运行
3. 查看浏览器控制台网络请求
4. 查看后端日志（PM2 管理器）

#### Q: 音乐解析失败

1. 检查 `KUWO_API_KEY` 是否配置
2. 检查 FFmpeg 是否安装：`ffmpeg -version`
3. 检查临时目录权限：`chmod 755 /www/wwwroot/music-api/temp`
4. 检查 COS 配置是否正确
5. 查看详细错误日志

#### Q: COS 上传失败

1. 检查 COS 配置：SecretId、SecretKey、Bucket、Region
2. 检查 COS 存储桶权限：确保有写入权限
3. 检查服务器网络：能否访问腾讯云 COS
4. 查看后端日志中的详细错误信息

### 3. 性能优化建议

#### 本地开发环境

- 使用 SSD 硬盘提升读写速度
- 关闭不必要的后台程序
- 使用 `npm run dev` 启用热重载

#### 生产环境（宝塔）

1. **启用 PM2 集群模式**
   - 在 PM2 管理器中，设置实例数为 CPU 核心数

2. **配置 Nginx 缓存**
   - 在网站设置中启用静态文件缓存

3. **数据库优化**
   - 在宝塔面板数据库管理中，定期优化表
   - 添加索引（参考 `sql/init.sql`）

4. **启用 CDN**
   - 将静态资源托管到 CDN
   - 配置 COS CDN 加速

### 4. 安全建议

#### 本地开发环境

- 不要使用弱密码
- 不要将 `.env` 文件提交到 Git
- 定期更新依赖包

#### 生产环境（宝塔）

1. **修改宝塔面板默认端口**
   - 在宝塔面板设置中修改面板端口

2. **配置防火墙**
   - 只开放必要的端口（80、443）
   - 不要对外开放 3000、3306、8888 等端口

3. **使用强密码**
   - 数据库密码：至少 16 位
   - JWT_SECRET：使用随机生成的长字符串
   - 管理员密码：使用强密码策略

4. **启用 SSL 证书**
   - 使用 Let's Encrypt 免费证书
   - 强制 HTTPS 访问

5. **定期备份**
   - 设置数据库自动备份
   - 设置文件自动备份
   - 备份文件下载到本地保存

6. **定期更新**
   - 更新宝塔面板
   - 更新系统软件
   - 更新项目依赖

### 5. 更新项目

#### 本地开发环境

```bash
# 拉取最新代码
git pull origin main

# 更新后端依赖
npm install

# 更新前端依赖
cd admin-ui
npm install

# 重启服务
```

#### 生产环境（宝塔）

1. **备份数据**
   - 备份数据库
   - 备份项目文件

2. **更新代码**
   - 在宝塔终端中执行：
   ```bash
   cd /www/wwwroot/music-api
   git pull origin main
   npm install --production
   ```

3. **更新数据库**（如有变更）
   ```bash
   mysql -u music_user -p music_db < sql/migration_xxx.sql
   ```

4. **重启服务**
   - 在 PM2 管理器中重启 `music-api`

5. **更新前端**
   - 本地构建新版本
   - 上传到服务器覆盖旧文件

---

## 技术支持

如果在部署过程中遇到问题：

1. 查看本文档的常见问题章节
2. 查看应用日志和错误信息
3. 查看项目 README.md 文档
4. 提交 GitHub Issue 描述问题

---

**部署完成后，即可开始使用音乐管理平台！** 🎉
