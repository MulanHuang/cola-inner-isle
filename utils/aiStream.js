// utils/aiStream.js
// ============================================================
// 微信小程序流式 AI 调用通用模块
// 直连 Vercel 代理：https://api.cola.center/api/openai
// 支持 SSE 流式输出，让用户 0.2 秒内看到字符开始出现
// ============================================================

const API_URL = "https://innerseed-openai-proxy.vercel.app/api/openai";

/**
 * 流式调用 AI 接口
 * @param {Object} options 配置选项
 * @param {Array} options.messages 消息数组 [{role, content}]
 * @param {Function} options.onChunk 每次收到流数据时的回调 (textChunk, fullText) => void
 * @param {Function} options.onComplete 完成时的回调 (fullText) => void
 * @param {Function} options.onError 错误时的回调 (error) => void
 * @param {string} options.model 模型名称，默认 "gpt-5-mini"
 * @param {number} options.temperature 温度参数，默认 1
 * @param {number} options.max_completion_tokens 最大输出 token，默认 16000
 * @returns {Object} 返回 { abort: Function } 可用于中断请求
 */
function callAIStream(options) {
  const {
    messages,
    onChunk,
    onComplete,
    onError,
    model = "gpt-5-mini",
    temperature = 1,
    max_completion_tokens = 16000,
  } = options;

  let fullText = "";
  let buffer = ""; // 用于缓存不完整的 SSE 数据
  let hasReceivedChunk = false; // 标记是否收到过分块数据
  let isCompleted = false; // 防止重复调用 onComplete

  console.log("[aiStream] 开始流式请求，消息数:", messages.length);

  const requestTask = wx.request({
    url: API_URL,
    method: "POST",
    enableChunked: true, // 🔥 开启分块传输，实现流式输出
    header: {
      "Content-Type": "application/json",
    },
    data: {
      model,
      messages,
      stream: true, // 🔥 开启流式输出
      temperature,
      max_completion_tokens,
    },
    timeout: 120000, // 2 分钟超时（流式输出可能较长）
    success(res) {
      console.log(
        "[aiStream] 请求完成，状态码:",
        res.statusCode,
        "已收到分块:",
        hasReceivedChunk
      );

      // 如果没有收到过分块数据，尝试从完整响应中提取内容
      if (!hasReceivedChunk && res.data) {
        console.log("[aiStream] 未收到分块数据，尝试解析完整响应");
        parseResponseData(res.data);
      }

      // 处理 buffer 中剩余的数据
      if (buffer.trim() && !fullText) {
        console.log("[aiStream] 处理剩余 buffer:", buffer.substring(0, 100));
        parseResponseData(buffer);
      }

      // 调用完成回调
      if (!isCompleted) {
        isCompleted = true;
        console.log(
          "[aiStream] 调用 onComplete，fullText 长度:",
          fullText.length
        );
        onComplete && onComplete(fullText);
      }
    },
    fail(err) {
      console.error("[aiStream] 请求失败:", err);
      if (!isCompleted) {
        isCompleted = true;
        onError && onError(new Error(err.errMsg || "网络请求失败"));
      }
    },
  });

  /**
   * 解析响应数据（支持多种格式）
   */
  function parseResponseData(data) {
    // 如果是对象
    if (typeof data === "object" && data !== null) {
      // 🔥 格式 A: 代理封装格式 {"success":true,"content":"..."}
      if (data.success === true && data.content) {
        console.log(
          "[aiStream] 解析成功 (代理封装格式)，长度:",
          data.content.length
        );
        fullText = data.content;
        onChunk && onChunk(data.content, fullText);
        return true;
      }
      // 格式 B: OpenAI 原始格式 {"choices":[{"message":{"content":"..."}}]}
      if (data.choices?.[0]?.message?.content) {
        const content = data.choices[0].message.content;
        console.log("[aiStream] 解析成功 (OpenAI格式)，长度:", content.length);
        fullText = content;
        onChunk && onChunk(content, fullText);
        return true;
      }
    }

    // 如果是字符串，尝试解析
    if (typeof data === "string") {
      const str = data.trim();

      // 🔥 尝试解析为 JSON（代理封装格式或 OpenAI 格式）
      try {
        const json = JSON.parse(str);
        // 递归调用处理解析后的 JSON
        if (parseResponseData(json)) {
          return true;
        }
      } catch (e) {
        // 不是 JSON，继续尝试 SSE 格式
      }

      // 尝试 SSE 格式解析
      return parseSSEString(str);
    }

    return false;
  }

  /**
   * 解析 SSE 格式字符串
   */
  function parseSSEString(str) {
    let found = false;
    const lines = str.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.startsWith("data:")) {
        const jsonStr = trimmedLine.slice(5).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const data = JSON.parse(jsonStr);
          const delta = data.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            console.log(
              "[aiStream] 解析到SSE内容片段:",
              delta.substring(0, 20)
            );
            onChunk && onChunk(delta, fullText);
            found = true;
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
    return found;
  }

  // 监听分块数据
  requestTask.onChunkReceived((res) => {
    hasReceivedChunk = true;

    try {
      // 将 ArrayBuffer 转为字符串
      const chunk = arrayBufferToString(res.data);
      console.log("[aiStream] 收到分块数据，长度:", chunk.length);

      buffer += chunk;

      // 🔥 首先尝试解析完整的 JSON（代理封装格式）
      // 代理可能一次性返回完整的 {"success":true,"content":"..."} 格式
      try {
        const json = JSON.parse(buffer);
        if (json.success === true && json.content) {
          console.log(
            "[aiStream] 分块数据解析为代理封装格式，长度:",
            json.content.length
          );
          fullText = json.content;
          onChunk && onChunk(json.content, fullText);
          buffer = ""; // 清空 buffer
          return;
        }
      } catch (e) {
        // 不是完整 JSON，继续尝试 SSE 格式
      }

      // 解析 SSE 数据（以 "data: " 开头的行）
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // 保留最后一行（可能不完整）

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // 处理 SSE 格式: data: {...}
        if (trimmedLine.startsWith("data:")) {
          const jsonStr = trimmedLine.slice(5).trim();

          // 检查是否是结束标记
          if (jsonStr === "[DONE]") {
            console.log("[aiStream] 收到 [DONE] 标记");
            continue;
          }

          try {
            const data = JSON.parse(jsonStr);
            const delta = data.choices?.[0]?.delta?.content;

            if (delta) {
              fullText += delta;
              console.log(
                "[aiStream] onChunk 回调，delta:",
                delta.substring(0, 30),
                "fullText长度:",
                fullText.length
              );
              // 🔥 关键：每次收到 chunk 都必须调用 onChunk
              onChunk && onChunk(delta, fullText);
            }
          } catch (parseErr) {
            // JSON 解析失败，可能是不完整的数据，放回 buffer
            if (jsonStr && jsonStr !== "[DONE]") {
              buffer = trimmedLine + "\n" + buffer;
            }
          }
        }
      }
    } catch (err) {
      console.error("[aiStream] 解析分块数据失败:", err);
    }
  });

  return {
    abort: () => {
      requestTask.abort();
      console.log("[aiStream] 请求已中断");
    },
  };
}

/**
 * ArrayBuffer 转字符串（支持 UTF-8）
 */
function arrayBufferToString(buffer) {
  // 微信小程序环境
  if (typeof wx !== "undefined" && wx.arrayBufferToBase64) {
    try {
      // 方法1: 使用 TextDecoder（部分新版本支持）
      if (typeof TextDecoder !== "undefined") {
        return new TextDecoder("utf-8").decode(buffer);
      }
      // 方法2: 手动解码 UTF-8
      const uint8Array = new Uint8Array(buffer);
      let result = "";
      for (let i = 0; i < uint8Array.length; i++) {
        result += String.fromCharCode(uint8Array[i]);
      }
      // 解码 UTF-8
      return decodeURIComponent(escape(result));
    } catch (e) {
      // 方法3: 降级为简单 ASCII
      const uint8Array = new Uint8Array(buffer);
      return String.fromCharCode.apply(null, uint8Array);
    }
  }
  return "";
}

/**
 * 非流式调用 AI 接口（兼容旧代码）
 * @param {Object} options 配置选项
 * @returns {Promise<string>} AI 回复内容
 */
function requestAI(options) {
  const {
    messages,
    model = "gpt-5-mini",
    temperature = 1,
    max_completion_tokens = 16000,
  } = options;

  return new Promise((resolve, reject) => {
    wx.request({
      url: API_URL,
      method: "POST",
      header: { "Content-Type": "application/json" },
      data: { model, temperature, messages, max_completion_tokens },
      timeout: 60000,
      success(res) {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const data = res.data;
        if (data?.choices?.[0]?.message?.content) {
          resolve(data.choices[0].message.content);
        } else if (data?.error) {
          reject(new Error(data.error.message || "AI 服务错误"));
        } else {
          reject(new Error("AI 返回格式异常"));
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || "网络请求失败"));
      },
    });
  });
}

module.exports = {
  callAIStream,
  requestAI,
  API_URL,
};
