/**
 * AI 代理服务器
 * 统一转发 AI 请求到 DeepSeek API
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// DeepSeek API 配置
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat"; // DeepSeek V3.2 Non-thinking

// 中间件
app.use(cors()); // 允许跨域
app.use(express.json({ limit: "10mb" })); // 解析 JSON 请求体

// 导入 API 处理函数（保留原有 MBTI 接口）
const { expressHandler: analyzeMBTI } = require("./api/mbti-analyze");

// ============================================
// 路由
// ============================================

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "AI Proxy Server is running" });
});

// ============================================
// OpenAI 兼容接口 - 转发到 DeepSeek
// ============================================
app.post("/v1/chat/completions", async (req, res) => {
  const startTime = Date.now();
  console.log("[DeepSeek] 收到请求");

  try {
    const { messages } = req.body;

    // 参数校验
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: {
          message: "参数错误：messages 必须是数组",
          type: "invalid_request_error",
        },
      });
    }

    // 检查 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error("[DeepSeek] 错误: DEEPSEEK_API_KEY 环境变量未设置");
      return res.status(500).json({
        error: {
          message: "服务器配置错误",
          type: "server_error",
        },
      });
    }

    console.log("[DeepSeek] 消息数:", messages.length);

    // 调用 DeepSeek API
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: DEEPSEEK_MODEL,
        messages: messages,
        temperature: 1,
        max_tokens: 4096,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 55000, // 55秒超时
      }
    );

    const elapsed = Date.now() - startTime;
    console.log(`[DeepSeek] 请求成功，耗时: ${elapsed}ms`);

    // 返回 OpenAI 兼容格式
    res.json(response.data);
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`[DeepSeek] 请求失败，耗时: ${elapsed}ms`);
    console.error("[DeepSeek] 错误:", err.message);

    if (err.response) {
      // DeepSeek API 返回的错误
      console.error("[DeepSeek] API 错误:", err.response.data);
      return res.status(err.response.status).json(err.response.data);
    }

    // 网络或其他错误
    res.status(500).json({
      error: {
        message: err.message || "AI 服务请求失败",
        type: "server_error",
      },
    });
  }
});

// MBTI 分析接口（保留原有功能）
app.post("/api/mbti/analyze", analyzeMBTI);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    error: "服务器内部错误",
  });
});

// ============================================
// 启动服务器
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 AI Proxy Server is running on port ${PORT}`);
  console.log(
    `📍 DeepSeek Endpoint: http://localhost:${PORT}/v1/chat/completions`
  );
  console.log(`📍 MBTI Endpoint: http://localhost:${PORT}/api/mbti/analyze`);
});

module.exports = app;
