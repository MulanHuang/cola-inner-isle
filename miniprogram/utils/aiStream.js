// utils/aiStream.js
// ============================================================
// 微信小程序 AI 调用通用模块
// 通过云函数 aiProxy 转发请求到腾讯云服务器，再到 DeepSeek API
// ============================================================

/**
 * 调用 AI 接口（通过云函数 aiProxy）
 * @param {Object} options 配置选项
 * @param {Array} options.messages 消息数组 [{role, content}]
 * @param {Function} options.onChunk 每次收到数据时的回调 (textChunk, fullText) => void
 * @param {Function} options.onComplete 完成时的回调 (fullText) => void
 * @param {Function} options.onError 错误时的回调 (error) => void
 * @returns {Object} 返回 { abort: Function } 可用于中断请求（但云函数不支持真正中断）
 */
function callAIStream(options) {
  const { messages, onChunk, onComplete, onError } = options;

  let isAborted = false;
  let isCompleted = false;
  const latestInput = getLatestInput(messages);

  if (isInFlight && latestInput && latestInput === lastInput) {
    return {
      abort: () => {
        isAborted = true;
        isInFlight = false;
      },
    };
  }

  if (latestInput) {
    lastInput = latestInput;
  }
  isInFlight = true;

  console.log("[aiStream] 开始请求，消息数:", messages.length);

  // 通过云函数 aiProxy 调用
  wx.cloud
    .callFunction({
      name: "aiProxy",
      data: { messages },
    })
    .then((res) => {
      if (isAborted) {
        isInFlight = false;
        return;
      }
      if (isCompleted) return;
      isCompleted = true;
      isInFlight = false;

      console.log("[aiStream] 云函数返回");

      const result = res.result;

      // 处理错误
      if (result.error) {
        console.error("[aiStream] 服务返回错误:", result.error);
        onError && onError(new Error(result.error));
        return;
      }

      // 解析 OpenAI 兼容格式响应
      const content = result?.choices?.[0]?.message?.content;
      if (content) {
        console.log("[aiStream] 成功获取回复，长度:", content.length);
        onChunk && onChunk(content, content);
        onComplete && onComplete(content);
      } else {
        console.error("[aiStream] 响应格式异常:", JSON.stringify(result));
        onError && onError(new Error("AI 返回格式异常"));
      }
    })
    .catch((err) => {
      if (isAborted) {
        isInFlight = false;
        return;
      }
      if (isCompleted) return;
      isCompleted = true;
      isInFlight = false;

      console.error("[aiStream] 云函数调用失败:", err);
      onError && onError(new Error(err.errMsg || "网络请求失败"));
    });

  return {
    abort: () => {
      isAborted = true;
      isInFlight = false;
      console.log("[aiStream] 请求已标记中断");
    },
  };
}

/**
 * 非流式调用 AI 接口（通过云函数 aiProxy）
 * @param {Object} options 配置选项
 * @param {Array} options.messages 消息数组 [{role, content}]
 * @returns {Promise<string>} AI 回复内容
 */
function requestAI(options) {
  const { messages } = options;
  const latestInput = getLatestInput(messages);

  if (isInFlight && latestInput && latestInput === lastInput) {
    return Promise.resolve(null);
  }

  if (latestInput) {
    lastInput = latestInput;
  }
  isInFlight = true;

  return new Promise((resolve, reject) => {
    wx.cloud
      .callFunction({
        name: "aiProxy",
        data: { messages },
      })
      .then((res) => {
        const result = res.result;

        // 处理错误
        if (result.error) {
          reject(new Error(result.error));
          return;
        }

        // 解析 OpenAI 兼容格式响应
        const content = result?.choices?.[0]?.message?.content;
        if (content) {
          isInFlight = false;
          resolve(content);
        } else {
          isInFlight = false;
          reject(new Error("AI 返回格式异常"));
        }
      })
      .catch((err) => {
        isInFlight = false;
        reject(new Error(err.errMsg || "网络请求失败"));
      });
  });
}

let lastInput = "";
let isInFlight = false;

function getLatestInput(messages) {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg && msg.role === "user" && typeof msg.content === "string") {
      return msg.content;
    }
  }
  const last = messages[messages.length - 1];
  return last && typeof last.content === "string" ? last.content : "";
}

module.exports = {
  callAIStream,
  requestAI,
};
