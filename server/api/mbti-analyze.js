/**
 * MBTI 深度解读 API
 * 调用 AI 模型生成个性化的 MBTI 性格分析
 */

const {
  SYSTEM_PROMPT,
  generateUserPrompt,
} = require("../prompts/mbti-analysis-prompt");

/**
 * MBTI 分析接口
 * POST /api/mbti/analyze
 *
 * 请求体：
 * {
 *   type: string,        // MBTI 类型，如 "INFJ"
 *   scores: object,      // 维度分数 {E, I, S, N, T, F, J, P}
 *   answers: array       // 答题记录（可选）
 * }
 *
 * 响应：
 * {
 *   success: boolean,
 *   analysis: string,    // AI 生成的分析文本
 *   error: string        // 错误信息（如果有）
 * }
 */

// ============================================
// 方案 1：使用 OpenAI API
// ============================================
async function analyzeMBTIWithOpenAI(type, scores, answers = null) {
  const OpenAI = require("openai");

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // 从环境变量读取
  });

  try {
    const userPrompt = generateUserPrompt(type, scores, answers);

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // 或 "gpt-3.5-turbo"
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 1,
      max_tokens: 1500,
    });

    return {
      success: true,
      analysis: completion.choices[0].message.content,
    };
  } catch (error) {
    console.error("OpenAI API 调用失败:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 方案 2：使用微信云开发 AI 能力
// ============================================
async function analyzeMBTIWithWeixinAI(type, scores, answers = null) {
  // 如果使用微信云开发的 AI 能力
  const cloud = require("wx-server-sdk");
  cloud.init();

  try {
    const userPrompt = generateUserPrompt(type, scores, answers);

    // 调用微信云开发 AI 接口（需要根据实际 API 调整）
    const result = await cloud.openapi.ai.chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 1,
      maxTokens: 1500,
    });

    return {
      success: true,
      analysis: result.content,
    };
  } catch (error) {
    console.error("微信 AI 调用失败:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 方案 3：使用其他 AI 服务（如通义千问、文心一言等）
// ============================================
async function analyzeMBTIWithCustomAI(type, scores, answers = null) {
  const axios = require("axios");

  try {
    const userPrompt = generateUserPrompt(type, scores, answers);

    // 示例：调用自定义 AI 服务
    const response = await axios.post(
      "YOUR_AI_SERVICE_URL",
      {
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: 1,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      analysis: response.data.content || response.data.text,
    };
  } catch (error) {
    console.error("AI 服务调用失败:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 云函数入口（微信云开发）
// ============================================
exports.main = async (event, context) => {
  const { type, scores, answers } = event;

  // 参数校验
  if (!type || !scores) {
    return {
      success: false,
      error: "缺少必要参数：type 和 scores",
    };
  }

  // 调用 AI 分析（选择一个方案）
  const result = await analyzeMBTIWithOpenAI(type, scores, answers);
  // const result = await analyzeMBTIWithWeixinAI(type, scores, answers);
  // const result = await analyzeMBTIWithCustomAI(type, scores, answers);

  return result;
};

// ============================================
// Express 路由（如果使用 Node.js 服务器）
// ============================================
module.exports.expressHandler = async (req, res) => {
  const { type, scores, answers } = req.body;

  // 参数校验
  if (!type || !scores) {
    return res.status(400).json({
      success: false,
      error: "缺少必要参数：type 和 scores",
    });
  }

  // 调用 AI 分析
  const result = await analyzeMBTIWithOpenAI(type, scores, answers);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
};
