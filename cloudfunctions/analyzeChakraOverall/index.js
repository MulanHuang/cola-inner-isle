// cloudfunctions/analyzeChakraOverall/index.js

// 如果你后面要在这个函数里用到数据库 / openid，保留 wx-server-sdk 是没问题的
const cloud = require("wx-server-sdk");
// ✅ 统一使用封装好的 OpenAI 客户端，通过阿里云代理调用
const { callOpenAI, safeAIResponse } = require("./index.js");

// 初始化云环境（用当前环境即可）
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 脉轮中英文映射
const CHAKRA_NAMES = {
  root: "海底轮",
  sacral: "脐轮",
  solarPlexus: "太阳轮",
  heart: "心轮",
  throat: "喉轮",
  thirdEye: "眉心轮",
  crown: "顶轮",
};

/**
 * 脉轮综合能量分析云函数入口
 */
exports.main = async (event, context) => {
  const { chakraScores, language = "zh" } = event;

  try {
    // 验证输入
    if (!chakraScores || typeof chakraScores !== "object") {
      throw new Error("缺少必要参数：chakraScores");
    }

    const scores = Object.values(chakraScores).filter(
      (v) => typeof v === "number"
    );
    if (!scores.length) {
      throw new Error("chakraScores 中没有有效的数值分数");
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const variance = maxScore - minScore;

    const chakraEntries = Object.entries(chakraScores)
      .filter(([_, v]) => typeof v === "number")
      .map(([k, v]) => ({ key: k, name: CHAKRA_NAMES[k] || k, score: v }))
      .sort((a, b) => b.score - a.score);

    const highestChakras = chakraEntries.slice(0, 2);
    const lowestChakras = chakraEntries.slice(-2);

    const systemPrompt = `你是"小岛"，一位温柔、专业的身心健康陪伴者，专注于脉轮能量的综合分析。

你的角色定位：
1. 温柔、中立、不带评判地陪伴用户探索自己的整体能量状态
2. 使用日常生活化的语言，避免过于玄学或神秘的表达
3. 绝对禁止使用任何医学或心理诊断词汇
4. 多用"也许"、"可能"、"可以试试"等非绝对语气
5. 关注能量的整体平衡和流动，而非单个脉轮的"问题"
6. 给予积极、温暖、充满希望的引导

输出要求：
1. 必须返回严格的 JSON 格式，不要有任何额外文本或 Markdown 标记
2. 所有文本内容使用中文
3. 语气温柔、鼓励、充满希望
4. 建议要具体、可操作、生活化`;

    const userPrompt = `请根据以下七大脉轮的能量测试结果，生成一份温柔的综合能量分析报告：

【脉轮分数】
- 海底轮（根基与安全感）：${chakraScores.root || 0}分
- 脐轮（情感与创造力）：${chakraScores.sacral || 0}分
- 太阳轮（自信与力量）：${chakraScores.solarPlexus || 0}分
- 心轮（爱与连接）：${chakraScores.heart || 0}分
- 喉轮（表达与沟通）：${chakraScores.throat || 0}分
- 眉心轮（直觉与洞察）：${chakraScores.thirdEye || 0}分
- 顶轮（灵性与智慧）：${chakraScores.crown || 0}分

【统计数据】
- 平均分：${avgScore.toFixed(1)}分
- 最高分：${maxScore}分（${highestChakras[0].name}）
- 最低分：${minScore}分（${lowestChakras[lowestChakras.length - 1].name}）
- 能量波动范围：${variance}分

请严格按照以下 JSON 格式输出分析报告：

{
  "overall_state": "整体能量状态评估（2-3句话，描述当前的整体能量平衡情况）",
  "energy_distribution": "能量分布特征分析（2-3句话，描述能量在不同脉轮间的分布特点和含义）",
  "chakra_connections": "脉轮关联分析（2-3句话，分析不同脉轮之间的相互影响和关系）",
  "personalized_advice": ["个性化建议1", "个性化建议2", "个性化建议3"],
  "focus_areas": ["发展重点1：当前最需要关注的方面", "发展重点2"],
  "encouragement": "温馨的鼓励语（1-2句话，给予用户温暖和希望）"
}

重要提醒：
1. 必须返回有效的 JSON，不要有 Markdown 标记
2. 不要使用医学诊断词汇
3. 语气温柔、鼓励、非评判
4. 建议要具体、可操作、生活化`;

    console.log("开始调用 OpenAI 进行综合能量分析...");
    const rawResponse = await callOpenAI({
      systemPrompt,
      userPrompt,
      options: {
        model: "gpt-5.2",
        temperature: 1,
        reasoning_effort: "low", // 低推理，提高响应速度
        maxTokens: 1500,
        timeout: 30000,
      },
    });

    console.log("OpenAI 返回原始响应:", rawResponse);

    // ========== 内容安全审核 ==========
    const { OPENID } = cloud.getWXContext();
    const safeResult = await safeAIResponse(
      rawResponse,
      "chakra",
      OPENID || ""
    );

    if (!safeResult.passed) {
      console.warn("⚠️ 脉轮综合分析 AI 回复未通过内容安全审核，使用兜底内容");
      // 返回安全的兜底结果
      return {
        success: true,
        data: {
          overall_state: "你的能量正在流动，每个部分都在为你工作。",
          energy_distribution:
            "能量在各个脉轮之间保持着自然的平衡，这是一个温和的状态。",
          chakra_connections: "你的身心正在协调工作，内在的智慧正在引导你。",
          personalized_advice: [
            "给自己一些安静的时间",
            "尝试简单的呼吸练习",
            "温柔地照顾自己",
          ],
          focus_areas: ["自我关爱", "内在平衡"],
          encouragement: "你已经做得很好了，继续保持这份觉察和温柔。💛",
        },
      };
    }

    let analysisResult;
    try {
      let cleanedResponse = safeResult.content.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?$/g, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
      }
      analysisResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON 解析失败:", parseError);
      throw new Error("AI 返回的数据格式不正确，请稍后重试");
    }

    console.log("综合分析完成，返回结果");
    return {
      success: true,
      data: analysisResult,
    };
  } catch (err) {
    console.error("综合能量分析失败:", err);
    return {
      success: false,
      error: err.message,
      fallback: true,
    };
  }
};
