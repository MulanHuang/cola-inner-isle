// cloudfunctions/tarotInterpret/index.js
const cloud = require("wx-server-sdk");
// ✅ 统一通过公用 OpenAI 客户端，经由阿里云代理调用
const { callOpenAI, safeAIResponse } = require("./openai.js");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

/**
 * 塔罗牌解读云函数
 * 根据用户问题和抽到的牌面生成温柔的解读
 *
 * 支持两种调用方式：
 * 1）直接传入 prompt 字符串（推荐，前端已拼好多卡牌阵信息）
 * 2）传入 cardName / cardKeywords / cardMeaning / question（旧接口，仍然兼容）
 */
exports.main = async (event, context) => {
  const { cardName, cardKeywords, cardMeaning, question, prompt } = event;

  try {
    const systemPrompt = `你是一位温柔的塔罗解读师。你的解读风格是：
	1. 温柔、鼓励、充满希望
	2. 不做绝对预测，而是提供启发和建议
	3. 关注用户的内在成长和自我觉察
	4. 避免负面或恐吓性的表达
	5. 解读长度控制在 150-200 字
	6. 禁止涉及金钱预测、医疗诊断、具体时间点的预言`;

    let finalPrompt;

    // 前端已构建好的完整 prompt（支持多卡牌阵）
    if (prompt && typeof prompt === "string" && prompt.trim()) {
      finalPrompt = prompt;
    } else {
      // 兼容旧接口：根据单张牌信息在云函数内组装 prompt
      const safeCardName = cardName || "这张牌";
      const safeKeywords = cardKeywords || "你最近关注的主题";
      const safeMeaning = cardMeaning || "请结合当下的情境进行温柔的启发式解读";
      const safeQuestion =
        question || "用户没有写下具体问题，请基于牌面给出适度的启发式解读。";

      finalPrompt = `用户抽到了塔罗牌：${safeCardName}
	牌面关键词：${safeKeywords}
	基本含义：${safeMeaning}
	
	用户的问题：${safeQuestion}
	
	请用温柔、启发性的方式进行解读：
	- 多用"也许"、"可以"、"可能"等非绝对语气
	- 不预测具体结果，而是给出对当下的提醒
	- 关注用户的内在感受和成长
	- 给出 2~3 个可以尝试的小方向或练习`;
    }

    const rawInterpretation = await callOpenAI({
      systemPrompt,
      userPrompt: finalPrompt,
      options: {
        model: "gpt-5-mini",
        temperature: 1,
        maxTokens: 400,
      },
    });

    // ========== 内容安全审核 ==========
    const { OPENID } = cloud.getWXContext();
    const safeResult = await safeAIResponse(
      rawInterpretation,
      "tarot",
      OPENID || ""
    );

    if (!safeResult.passed) {
      console.warn("⚠️ 塔罗解读 AI 回复未通过内容安全审核");
    }

    return {
      success: true,
      interpretation: safeResult.content,
    };
  } catch (err) {
    console.error("塔罗解读失败", err);

    const safeCardName = cardName || "这张牌";
    const safeKeywords = cardKeywords || "你最近关注的主题";

    const fallback = `${safeCardName} 在此刻出现，更像是一个温柔的提醒，而不是对未来的预言。它邀请你回到当下，留意自己最近在 ${safeKeywords} 相关领域的感受和选择。
	
	也许你可以给自己一点时间，写下此刻最在意的三件事，或者用冥想的方式，和这张牌待在一起几分钟。慢慢来，你有足够的时间去理解这些讯息。`;

    return {
      success: false,
      error: err.message,
      interpretation: fallback,
    };
  }
};
