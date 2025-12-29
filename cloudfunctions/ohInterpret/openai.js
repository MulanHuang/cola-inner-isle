// cloudfunctions/ohInterpret/openai.js
// ============================================================
// OH 卡解读云函数 AI 调用模块
// 通过腾讯云服务器转发到 DeepSeek API
// ============================================================

const fetch = require("node-fetch");

// 腾讯云服务器地址（请替换为实际 IP）
const SERVER_URL = "http://114.132.210.92:3001/v1/chat/completions";

/**
 * 调用 AI 接口（通过腾讯云服务器转发到 DeepSeek）
 */
async function callOpenAI({
  systemPrompt,
  userPrompt,
  messages,
  options = {},
}) {
  console.log("=== callOpenAI 开始执行 ===");

  // 构建 messages
  let finalMessages = [];
  if (Array.isArray(messages) && messages.length > 0) {
    finalMessages = messages;
  } else {
    finalMessages = [
      { role: "system", content: systemPrompt || "" },
      { role: "user", content: userPrompt || "" },
    ];
  }

  console.log("📝 消息数量:", finalMessages.length);

  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: finalMessages }),
      timeout: 55000,
    });

    if (!response.ok) {
      throw new Error(`服务器错误: ${response.status}`);
    }

    const json = await response.json();

    if (json.error) {
      throw new Error(json.error.message || json.error || "AI 服务错误");
    }

    const content = json?.choices?.[0]?.message?.content;
    if (content && content.trim() !== "") {
      console.log("✅ 解析成功，内容长度:", content.length);
      return content;
    }

    throw new Error("AI 返回了空内容");
  } catch (err) {
    console.error("❌ 请求失败:", err.message);
    throw err;
  }
}

module.exports = {
  callOpenAI,
};
