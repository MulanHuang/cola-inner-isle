// cloudfunctions/common/index.js
// ============================================================
// 小程序云函数统一调用阿里云代理（HTTPS）
// 地址：https://api.cola.center/api/openai
// 所有 AI 功能共用
// ============================================================

const https = require("https");

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

  // ======== OpenAI 接口必需参数 ========
  //gpt-5.1 是推理模型，需要更多 token（推理 + 输出）
  // 默认给 16000 tokens，确保有足够空间输出
  const config = {
    model: options.model || "gpt-5-mini",
    temperature: options.temperature ?? 1,
    max_completion_tokens: options.max_completion_tokens || 16000,
    timeout: Math.min(options.timeout || 30000, 55000),
  };

  console.log("📝 最终模型配置:", config);

  const postData = JSON.stringify({
    model: config.model,
    temperature: config.temperature,
    max_completion_tokens: config.max_completion_tokens,
    messages: finalMessages,
  });

  const requestOptions = {
    hostname: "api.cola.center",
    port: 443,
    path: "/api/openai",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
    timeout: config.timeout,
  };

  console.log("🌐 请求地址：https://api.cola.center/api/openai");
  console.log("📦 请求大小:", Buffer.byteLength(postData));

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let raw = "";

      console.log("HTTP 状态码:", res.statusCode); // ⭐ 可选：更方便调试

      res.on("data", (chunk) => {
        raw += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(raw);

          // ============ 格式 A: 代理封装格式 =============
          if (json.success === true && json.content) {
            console.log("✅ 解析成功 (格式 A - 代理封装)");
            return resolve(json.content);
          }

          // ============ 格式 B: OpenAI 原始格式 =============
          if (json.choices?.[0]?.message?.content) {
            const content = json.choices[0].message.content;
            // 检查是否为空内容（推理模型 token 不足时会返回空）
            if (!content || content.trim() === "") {
              const finishReason = json.choices[0].finish_reason;
              const reasoningTokens =
                json.usage?.completion_tokens_details?.reasoning_tokens || 0;
              console.error(
                "❌ AI 返回空内容, finish_reason:",
                finishReason,
                ", reasoning_tokens:",
                reasoningTokens
              );
              if (finishReason === "length") {
                return reject(
                  new Error("AI 推理 token 不足，请增加 max_completion_tokens")
                );
              }
              return reject(new Error("AI 返回了空内容"));
            }
            console.log("✅ 解析成功 (格式 B - OpenAI 原始)");
            return resolve(content);
          }

          // ============ 格式 C: OpenAI 错误格式 =============
          if (json.error) {
            const errorMsg =
              typeof json.error === "string"
                ? json.error
                : json.error.message || json.error.code || "未知 API 错误";
            console.error("❌ OpenAI API 错误:", errorMsg);
            console.error("❌ 完整错误信息:", JSON.stringify(json.error));
            return reject(new Error(`AI 服务错误: ${errorMsg}`));
          }

          // ============ 格式 D: choices 存在但 content 为空 =============
          if (json.choices?.[0]?.message) {
            const finishReason = json.choices[0].finish_reason;
            const reasoningTokens =
              json.usage?.completion_tokens_details?.reasoning_tokens || 0;
            console.error(
              "❌ AI 返回空内容, finish_reason:",
              finishReason,
              ", reasoning_tokens:",
              reasoningTokens
            );
            if (finishReason === "length") {
              return reject(
                new Error("AI 推理 token 不足，请增加 max_completion_tokens")
              );
            }
            return reject(new Error("AI 返回了空内容"));
          }

          // ============ 未知格式 =============
          console.error("❌ 代理返回格式无法解析");
          console.error("❌ 原始响应 (前500字符):", raw.substring(0, 500));
          console.error("❌ JSON 结构键:", Object.keys(json));
          return reject(new Error("AI 返回格式异常，请检查日志"));
        } catch (err) {
          console.error("❌ JSON 解析失败:", err.message);
          console.error("原始响应 (前500字符):", raw.substring(0, 500));
          reject(new Error("AI 服务解析失败"));
        }
      });
    });

    req.on("error", (err) => {
      console.error("❌ 请求失败:", err.message);
      reject(err);
    });

    req.on("timeout", () => {
      console.error("❌ 请求超时");
      req.destroy();
      reject(new Error("AI 请求超时"));
    });

    req.write(postData);
    req.end();
  });
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
