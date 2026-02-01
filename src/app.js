const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const { testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 挂载路由
app.use('/api', routes);

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务
async function startServer() {
  // 测试数据库连接
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ 数据库连接失败，请检查配置');
    // 仍然启动服务，但打印警告
  }

  app.listen(config.port, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║   🎵 音乐管理平台 API 服务已启动               ║
║                                                ║
║   地址: http://localhost:${config.port}                  ║
║   环境: ${config.nodeEnv}                          ║
║                                                ║
╚════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch((err) => {
  console.error('服务启动失败:', err);
  process.exit(1);
});

module.exports = app;
