/**
 * 创建默认管理员账号
 * 运行: node scripts/createAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../src/config/database');

async function createAdmin() {
  let connection;
  try {
    const username = 'admin';
    const password = 'admin123';
    const nickname = '系统管理员';

    // 生成密码哈希
    console.log('正在生成密码哈希...');
    const passwordHash = await bcrypt.hash(password, 10);

    // 获取数据库连接
    connection = await pool.getConnection();
    console.log('数据库连接成功');

    // 检查是否已存在
    const [existing] = await connection.query(
      'SELECT user_id FROM admin_user WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      console.log('❌ 管理员账号已存在');
      console.log(`用户名: ${username}`);
      console.log('如需重置密码，请手动更新数据库');
      connection.release();
      process.exit(0);
    }

    // 插入管理员账号
    await connection.query(
      'INSERT INTO admin_user (username, password, nickname, status) VALUES (?, ?, ?, 1)',
      [username, passwordHash, nickname]
    );

    console.log('✅ 管理员账号创建成功！');
    console.log('');
    console.log('登录信息：');
    console.log(`用户名: ${username}`);
    console.log(`密码: ${password}`);
    console.log('');
    console.log('⚠️  请在首次登录后立即修改密码！');

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error.message);
    if (connection) {
      connection.release();
    }
    process.exit(1);
  }
}

createAdmin();
