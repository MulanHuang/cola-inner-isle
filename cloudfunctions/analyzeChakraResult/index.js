// cloudfunctions/analyzeChakraResult/index.js
const cloud = require("wx-server-sdk");
const { callOpenAI, safeAIResponse } = require("../common/index.js");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

/**
 * 脉轮测试结果分析云函数
 * 接收用户的脉轮测试分数，调用 OpenAI 生成详细的分析和建议
 *
 * 输入参数：
 * - chakraScores: { root, sacral, solarPlexus, heart, throat, thirdEye, crown }
 * - level: 整体平衡等级（可选）
 * - strongChakras: 强项脉轮数组（可选）
 * - weakChakras: 较弱脉轮数组（可选）
 * - gender: 性别（可选）
 * - age: 年龄（可选）
 * - language: 语言，默认 'zh'
 *
 * 输出格式：
 * {
 *   overall_summary: string,
 *   chakra_details: [{ name, score, status, possible_feelings, suggestions }],
 *   strengths: [string],
 *   growth_focus: [string],
 *   simple_practices: [string]
 * }
 */

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

exports.main = async (event, context) => {
  const {
    chakraScores,
    level = "平衡",
    strongChakras = [],
    weakChakras = [],
    gender = "",
    age = 0,
    language = "zh",
  } = event;

  try {
    // 验证输入
    if (!chakraScores || typeof chakraScores !== "object") {
      throw new Error("缺少必要参数：chakraScores");
    }

    // 构建 System Prompt
    const systemPrompt = `你是一位温柔、专业的身心健康陪伴者，专注于脉轮能量分析。

你的角色定位：
1. 温柔、中立、不带评判地陪伴用户探索自己的能量状态
2. 使用日常生活化的语言，避免过于玄学或神秘的表达
3. 绝对禁止使用任何医学或心理诊断词汇（如：治疗、治愈、抑郁症、焦虑症、障碍、疾病等）
4. 不提供医疗建议或心理治疗建议，只提供日常自我照顾的温柔提醒
5. 多用"也许"、"可能"、"可以试试"等非绝对语气
6. 关注用户的感受和体验，而非问题和缺陷
输出要求：
1. 必须返回严格的 JSON 格式，不要有任何额外文本、注释或 Markdown 标记
2. 不要增加或减少字段，严格按照指定的 JSON 结构输出
3. 所有文本内容使用中文
4. 语气温柔、鼓励、充满希望
5. 每个建议都要具体、可操作、生活化`;

    // 构建 User Prompt
    const userPrompt = `请根据以下脉轮测试结果，生成一份温柔、详细的分析报告：

用户信息：
${gender ? `性别：${gender}` : ""}
${age ? `年龄：${age}` : ""}

脉轮分数（满分100）：
- 海底轮：${chakraScores.root || 0}
- 脐轮：${chakraScores.sacral || 0}
- 太阳轮：${chakraScores.solarPlexus || 0}
- 心轮：${chakraScores.heart || 0}
- 喉轮：${chakraScores.throat || 0}
- 眉心轮：${chakraScores.thirdEye || 0}
- 顶轮：${chakraScores.crown || 0}

整体状态：${level}
${
  strongChakras.length > 0
    ? `相对强项：${strongChakras.map((c) => CHAKRA_NAMES[c] || c).join("、")}`
    : ""
}
${
  weakChakras.length > 0
    ? `可以关注：${weakChakras.map((c) => CHAKRA_NAMES[c] || c).join("、")}`
    : ""
}

请严格按照以下 JSON 格式输出（不要有任何额外文本）：

{
  "overall_summary": "整体总结，80-120字，温柔地描述用户当前的能量状态，多用鼓励性语言",
  "chakra_details": [
    {
      "name": "海底轮",
      "score": ${chakraScores.root || 0},
      "status": "根据分数判断：80+为'能量充沛'，50-79为'基本平衡'，50以下为'可以关注'",
      "possible_feelings": "列出2-4个日常可能的感受，用逗号分隔，如：安全感强，脚踏实地，充满活力",
      "suggestions": ["建议1：具体可操作的日常练习", "建议2：生活化的小提醒", "建议3：温柔的自我照顾方式"]
    },
    {
      "name": "脐轮",
      "score": ${chakraScores.sacral || 0},
      "status": "根据分数判断状态",
      "possible_feelings": "2-4个感受，逗号分隔",
      "suggestions": ["建议1", "建议2", "建议3"]
    },
    {
      "name": "太阳轮",
      "score": ${chakraScores.solarPlexus || 0},
      "status": "根据分数判断状态",
      "possible_feelings": "2-4个感受，逗号分隔",
      "suggestions": ["建议1", "建议2", "建议3"]
    },
    {
      "name": "心轮",
      "score": ${chakraScores.heart || 0},
      "status": "根据分数判断状态",
      "possible_feelings": "2-4个感受，逗号分隔",
      "suggestions": ["建议1", "建议2", "建议3"]
    },
    {
      "name": "喉轮",
      "score": ${chakraScores.throat || 0},
      "status": "根据分数判断状态",
      "possible_feelings": "2-4个感受，逗号分隔",
      "suggestions": ["建议1", "建议2", "建议3"]
    },
    {
      "name": "眉心轮",
      "score": ${chakraScores.thirdEye || 0},
      "status": "根据分数判断状态",
      "possible_feelings": "2-4个感受，逗号分隔",
      "suggestions": ["建议1", "建议2", "建议3"]
    },
    {
      "name": "顶轮",
      "score": ${chakraScores.crown || 0},
      "status": "根据分数判断状态",
      "possible_feelings": "2-4个感受，逗号分隔",
      "suggestions": ["建议1", "建议2", "建议3"]
    }
  ],
  "strengths": ["优势1：基于高分脉轮的具体优势", "优势2", "优势3"],
  "growth_focus": ["关注点1：基于较低分脉轮的温柔提醒", "关注点2"],
  "simple_practices": ["练习1：简单易行的日常小练习", "练习2", "练习3"]
}

重要提醒：
1. 必须返回有效的 JSON，不要有任何 Markdown 标记（如 \`\`\`json）
2. 不要使用医学诊断词汇
3. 语气温柔、鼓励、非评判
4. 建议要具体、可操作、生活化`;

    // 调用 OpenAI
    console.log("开始调用 OpenAI 分析脉轮结果...");
    const rawResponse = await callOpenAI({
      systemPrompt,
      userPrompt,
      options: {
        model: "gpt-5-mini",
        temperature: 1,
        maxTokens: 2000,
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
      console.warn("⚠️ 脉轮结果分析 AI 回复未通过内容安全审核，使用兜底内容");
      // 返回安全的兜底结果
      return {
        success: true,
        data: {
          overall_summary:
            "你的能量正在流动，每个部分都在为你工作。给自己一些时间和空间，温柔地照顾好自己。",
          chakra_details: [],
          strengths: ["你拥有内在的智慧", "你正在成长的路上"],
          growth_focus: ["自我关爱", "保持觉察"],
          simple_practices: [
            "每天给自己5分钟安静的时间",
            "尝试简单的呼吸练习",
            "对自己说一句温柔的话",
          ],
        },
      };
    }

    // 解析 JSON
    let analysisResult;
    try {
      // 尝试清理可能的 Markdown 标记
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

    console.log("分析完成，返回结果");
    return {
      success: true,
      data: analysisResult,
    };
  } catch (err) {
    console.error("脉轮分析失败:", err);

    // 返回兜底数据
    return {
      success: false,
      error: err.message,
      fallback: true,
    };
  }
};
