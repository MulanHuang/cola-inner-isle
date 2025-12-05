// cloudfunctions/aiChat/openai.js
// 统一调用 Vercel 代理（HTTPS）
// 地址：https://vercel-openai-proxy-lemon.vercel.app/api/openai

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
  const config = {
    model: options.model || "gpt-5-mini",
    temperature: options.temperature ?? 0.9,
    // 增加超时时间到 55 秒（微信云函数最大 60 秒）
    timeout: options.timeout || 55000,
  };

  console.log("📝 最终模型配置:", JSON.stringify(config));
  console.log("📝 消息数量:", finalMessages.length);

  // 注意：不传 max_completion_tokens，让代理服务器使用默认值
  const postData = JSON.stringify({
    model: config.model,
    temperature: config.temperature,
    messages: finalMessages,
  });

  const requestOptions = {
    hostname: "vercel-openai-proxy-lemon.vercel.app",
    port: 443,
    path: "/api/openai",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
    timeout: config.timeout,
  };

  console.log(
    "🌐 请求地址：https://vercel-openai-proxy-lemon.vercel.app/api/openai"
  );
  console.log("📦 请求大小:", Buffer.byteLength(postData), "bytes");

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let raw = "";

      console.log("✅ HTTP 状态码:", res.statusCode);
      console.log("✅ Content-Type:", res.headers["content-type"]);

      res.on("data", (chunk) => {
        raw += chunk;
      });

      res.on("end", () => {
        console.log("📥 响应长度:", raw.length, "bytes");
        console.log("📥 响应前 500 字符:", raw.substring(0, 500));

        // 检查是否是空响应
        if (!raw || raw.trim() === "") {
          console.error("❌ 服务器返回空响应");
          return reject(new Error("AI 服务返回空响应"));
        }

        try {
          const json = JSON.parse(raw);

          // ============ 格式 A: 代理封装格式 =============
          if (json.success === true && json.content) {
            console.log("✅ 解析成功 (格式 A)");
            return resolve(json.content);
          }

          // ============ 格式 B: OpenAI 原始格式 =============
          if (json.choices?.[0]?.message?.content) {
            console.log("✅ 解析成功 (格式 B)");
            return resolve(json.choices[0].message.content);
          }

          // ============ 错误格式 =============
          console.error("❌ 代理返回格式无法解析");
          console.error(
            "❌ JSON 结构:",
            JSON.stringify(json).substring(0, 500)
          );
          return reject(
            new Error(json.error || json.message || "AI 返回格式异常")
          );
        } catch (err) {
          console.error("❌ JSON 解析失败:", err.message);
          console.error("❌ 原始响应:", raw.substring(0, 500));
          // 检查是否是 HTML 错误页面
          if (raw.includes("<html") || raw.includes("<!DOCTYPE")) {
            reject(new Error("AI 代理服务返回 HTML 错误页面，请检查服务状态"));
          } else {
            reject(new Error("AI 服务解析失败: " + raw.substring(0, 100)));
          }
        }
      });
    });

    req.on("error", (err) => {
      console.error("❌ 网络请求失败:", err.message);
      reject(new Error("AI 网络请求失败: " + err.message));
    });

    req.on("timeout", () => {
      console.error("❌ 请求超时 (" + config.timeout + "ms)");
      req.destroy();
      reject(new Error("AI 请求超时"));
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  callOpenAI,
};
