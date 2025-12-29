// 云函数：aiProxy
// 仅负责转发请求到腾讯云服务器，不包含任何业务逻辑
const fetch = require("node-fetch");

// 腾讯云服务器地址（请替换为实际 IP）
const SERVER_URL = "http://114.132.210.92:3001/v1/chat/completions";

exports.main = async (event, context) => {
  const { messages } = event;

  // 参数校验
  if (!messages || !Array.isArray(messages)) {
    return {
      error: "参数错误：messages 必须是数组",
    };
  }

  console.log("[aiProxy] 收到请求，消息数:", messages.length);

  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
      timeout: 55000, // 55秒超时（云函数最大60秒）
    });

    if (!response.ok) {
      console.error("[aiProxy] 服务器响应错误:", response.status);
      return {
        error: `服务器错误: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log("[aiProxy] 成功获取响应");
    return data;
  } catch (err) {
    console.error("[aiProxy] 请求失败:", err.message);
    return {
      error: err.message || "aiProxy error",
    };
  }
};
