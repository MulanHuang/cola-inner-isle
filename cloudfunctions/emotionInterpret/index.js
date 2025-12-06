// cloudfunctions/emotionInterpret/index.js
// 情绪解读云函数 - 通过阿里云代理调用 OpenAI

const cloud = require("wx-server-sdk");
// ✅ 统一通过公用 OpenAI 客户端，经由阿里云代理调用
const { callOpenAI, safeAIResponse } = require("./openai.js");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

/**
 * 情绪解读云函数
 * @param {Object} event - 包含 emotionName, tags, description
 * @returns {Object} { success, reply, error }
 */
exports.main = async (event, context) => {
  const { emotionName, tags, description } = event;

  console.log("📥 emotionInterpret 收到请求:", {
    emotionName,
    tags,
    descriptionLength: description ? description.length : 0,
  });

  try {
    // 系统提示词：温柔、共情、不指责
    const systemPrompt = `你是一位温柔、善解人意的情绪陪伴者。
你的任务是：
1. 先共情、理解用户当前的情绪状态
2. 用温暖、不评判的语言回应
3. 给出一点温柔的建议或新视角
4. 不要指责，不要简单地说"加油"
5. 不要诊断、不要贴标签
6. 用中文回答，语言自然、有温度

回应风格：
- 像一个真正关心你的朋友
- 先接住情绪，再给建议
- 用"我感受到..."、"或许..."这样的表达
- 适当使用温暖的emoji，但不要过多`;

    // 构建用户提示词
    const tagsText = tags && tags.length > 0 ? tags.join("、") : "无";
    const descText =
      description && description.trim()
        ? description
        : "（用户没有填写详细描述）";

    const userPrompt = `当前情绪：${emotionName || "未选择"}
相关标签：${tagsText}
具体描述：${descText}

请给我一段温柔的回应。`;

    console.log("📡 开始调用 OpenAI 代理...");

    // 调用统一的 OpenAI 客户端
    // 注意：gpt-5-mini 不支持自定义 temperature，只能使用默认值 1
    const rawReply = await callOpenAI({
      systemPrompt,
      userPrompt,
      options: {
        model: "gpt-5-mini",
        maxTokens: 600,
        timeout: 2500,
      },
    });

    console.log("✅ OpenAI 返回成功，内容长度:", rawReply.length);

    // ========== 内容安全审核 ==========
    const { OPENID } = cloud.getWXContext();
    const safeResult = await safeAIResponse(rawReply, "emotion", OPENID || "");

    if (!safeResult.passed) {
      console.warn("⚠️ AI 回复未通过内容安全审核");
    }

    return {
      success: true,
      reply: safeResult.content,
    };
  } catch (err) {
    console.error("❌ emotionInterpret 失败:", err.message);
    console.error("错误详情:", err.stack);

    // 温柔的兜底回复
    const fallbackReply = `我感受到你现在的情绪，这种感受是真实的，也是被允许的。

有时候，我们只是需要一个安静的角落，让自己慢慢消化这些感受。

如果你愿意，可以试着深呼吸几次，给自己一点温柔的时间。你已经很努力了 💝`;

    return {
      success: false,
      error: err.message,
      reply: fallbackReply,
    };
  }
};
