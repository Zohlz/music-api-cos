/**
 * 初始化数据库（执行 sql/init.sql，创建数据库与数据表）
 * 运行: node scripts/initDb.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../src/config');

async function initDatabase() {
  let connection;
  try {
    const sqlFile = path.resolve(__dirname, '../sql/init.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log(`正在连接 MySQL: ${config.db.host}:${config.db.port} (user=${config.db.user})`);

    connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      multipleStatements: true,
      charset: 'utf8mb4',
    });

    console.log('数据库连接成功，开始执行 sql/init.sql ...');
    await connection.query(sql);
    console.log('✅ 数据库初始化完成');

    // 打印已创建的数据表
    const [tables] = await connection.query(
      `SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [config.db.database]
    );
    console.log(`当前数据库 ${config.db.database} 中的数据表: ${tables.map((t) => t.name).join(', ') || '(无)'}`);

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    if (connection) {
      await connection.end().catch(() => {});
    }
    process.exit(1);
  }
}

initDatabase();
