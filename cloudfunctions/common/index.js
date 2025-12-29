// cloudfunctions/common/index.js
// ============================================================
// 小程序云函数统一 AI 调用模块
// 通过腾讯云服务器转发到 DeepSeek API
// ============================================================

const fetch = require("node-fetch");

// 腾讯云服务器地址（请替换为实际 IP）
const SERVER_URL = "http://114.132.210.92:3001/v1/chat/completions";

/**
 * 调用 AI 接口（通过腾讯云服务器转发到 DeepSeek）
 * @param {Object} params 参数对象
 * @param {string} params.systemPrompt 系统提示词
 * @param {string} params.userPrompt 用户提示词
 * @param {Array} params.messages 消息数组（优先使用）
 * @param {Object} params.options 配置选项
 * @returns {Promise<string>} AI 回复内容
 */
async function callOpenAI({
  systemPrompt,
  userPrompt,
  messages,
  options = {},
}) {
  console.log("=== callOpenAI 开始执行 ===");

  // ======== 构建 messages ========
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: finalMessages }),
      timeout: 55000, // 55秒超时
    });

    if (!response.ok) {
      console.error("❌ 服务器响应错误:", response.status);
      throw new Error(`服务器错误: ${response.status}`);
    }

    const json = await response.json();
    console.log("✅ 收到服务器响应");

    // 处理错误响应
    if (json.error) {
      const errorMsg =
        typeof json.error === "string"
          ? json.error
          : json.error.message || "AI 服务错误";
      console.error("❌ AI 服务错误:", errorMsg);
      throw new Error(errorMsg);
    }

    // 解析 OpenAI 兼容格式响应
    const content = json?.choices?.[0]?.message?.content;
    if (content && content.trim() !== "") {
      console.log("✅ 解析成功，内容长度:", content.length);
      return content;
    }

    // 内容为空
    console.error("❌ AI 返回空内容");
    throw new Error("AI 返回了空内容");
  } catch (err) {
    console.error("❌ 请求失败:", err.message);
    throw err;
  }
}

// 导入内容安全检查模块
const {
  checkContentSafety,
  safeAIResponse,
  getFallbackMessage,
  SAFE_FALLBACK_MESSAGES,
} = require("./msgSecCheck.js");

module.exports = {
  callOpenAI,
  // 内容安全审核相关
  checkContentSafety,
  safeAIResponse,
  getFallbackMessage,
  SAFE_FALLBACK_MESSAGES,
};
