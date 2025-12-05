/**
 * MBTI 分析服务器
 * 提供 MBTI 深度解读 API
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析 JSON 请求体

// 导入 API 处理函数
const { expressHandler: analyzeMBTI } = require('./api/mbti-analyze');

// ============================================
// 路由
// ============================================

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MBTI Analysis Server is running' });
});

// MBTI 分析接口
app.post('/api/mbti/analyze', analyzeMBTI);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false,
    error: '服务器内部错误' 
  });
});

// ============================================
// 启动服务器
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 MBTI Analysis Server is running on port ${PORT}`);
  console.log(`📍 API Endpoint: http://localhost:${PORT}/api/mbti/analyze`);
});

module.exports = app;

