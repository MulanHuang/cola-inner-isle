// cloudfunctions/aiChat/index.js
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const { callOpenAI } = require("./openai.js");
const { safeAIResponse } = require("../common/index.js");

/**
 * 心灵陪伴聊天接口
 */
exports.main = async (event, context) => {
  const {
    message = "",
    history = [],
    systemPrompt: customSystemPrompt,
  } = event || {};

  console.log("[aiChat] ==== 云函数执行开始 ====");
  console.log("[aiChat] 用户输入:", message.slice(0, 100));
  console.log("[aiChat] 历史消息数:", history.length);

  try {
    // ========== 默认系统提示词 ==========
    const defaultSystemPrompt = `
你是一位真实、温柔、细腻、专业且富有洞察力的心灵陪伴者。
你遵循“情绪 → 需求 → 心理机制 → 新视角”的陪伴结构，
帮助用户理解情绪、整理思绪、获得力量，而不是简单安慰。
保持：真诚、自然、人性化、稳重、不评判。
    `.trim();

    const systemPrompt = customSystemPrompt || defaultSystemPrompt;

    // ========== 构建消息结构 ==========
    const clean = (txt) => String(txt || "").slice(0, 800); // 避免过长导致超时

    const messages = [
      { role: "system", content: systemPrompt },

      // 读取最近 10 条对话，并且控制长度
      ...history.slice(-10).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: clean(m.content),
      })),

      // 当前用户输入
      { role: "user", content: clean(message) },
    ];

    console.log("[aiChat] 发送消息数量:", messages.length);

    // ========== 调用统一 AI 代理 ==========
    const rawReply = await callOpenAI({
      messages, // 直接发送消息数组
      options: {
        model: "gpt-5-mini", // 使用 OpenAI 的 gpt-5-mini 模型
        temperature: 0.9, // 稍微降低，提高情绪陪伴质量
        timeout: 55000, // 55 秒（微信云函数最大 60 秒）
      },
    });

    console.log("[aiChat] AI 原始回复长度:", rawReply?.length || 0);

    // ========== 内容安全审核 ==========
    const { WXCONTEXT } = cloud.getWXContext();
    const openid = WXCONTEXT?.OPENID || "";
    const safeResult = await safeAIResponse(rawReply, "chat", openid);

    if (!safeResult.passed) {
      console.warn("[aiChat] ⚠️ AI 回复未通过内容安全审核");
    }

    return {
      success: true,
      reply: safeResult.content,
    };
  } catch (err) {
    console.error("[aiChat] ❌ 错误:", err.message);

    return {
      success: false,
      error: err.message,
      reply:
        "抱歉，我刚刚没能成功接收到你的内容，但我一直在这里。你愿意再告诉我刚刚的想法吗？",
    };
  }
};
