/**
 * 腾讯云 CloudBase 云函数：MBTI 深度解读
 *
 * 调用方式：
 * wx.cloud.callFunction({
 *   name: 'mbti-analyze',
 *   data: {
 *     type: 'INFJ',
 *     scores: { E: 5, I: 13, S: 8, N: 10, T: 7, F: 10, J: 11, P: 6 },
 *     answers: [...]  // 可选
 *   }
 * })
 */

const cloud = require("wx-server-sdk");
const { callOpenAI, safeAIResponse } = require("./index.js");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

/**
 * MBTI 解读 System Prompt
 */
const SYSTEM_PROMPT = `你是一位温柔、真实、有边界感的心灵陪伴者。
你的任务是根据用户的 MBTI 测试结果，为他们提供深度的性格解读。

请做到以下几点：
1. 语言温柔、人性化、带共情，不使用生硬的心理学术语
2. 不要下定论，不贴标签，只描述倾向并给出理解与支持
3. 使用第二人称 "你"，像一个温暖但专业的朋友在对话
4. 结合维度得分差异，给出更精准的描述
5. 避免过度美化或批判，保持客观但温暖的态度

输出结构要求：
- 核心特质总结（1 段，80-120 字）
- 能量与情绪模式（1 段，100-150 字）
- 人际与关系风格（1 段，100-150 字）
- 工作与学习风格（1 段，100-150 字）
- 温柔的成长建议（3-5 条，每条 30-50 字）`;

/**
 * 生成 User Prompt
 */
function generateUserPrompt(type, scores) {
  const dimensions = [
    {
      name: "能量来源",
      left: "E",
      right: "I",
      leftScore: scores.E,
      rightScore: scores.I,
    },
    {
      name: "信息获取",
      left: "S",
      right: "N",
      leftScore: scores.S,
      rightScore: scores.N,
    },
    {
      name: "决策方式",
      left: "T",
      right: "F",
      leftScore: scores.T,
      rightScore: scores.F,
    },
    {
      name: "生活态度",
      left: "J",
      right: "P",
      leftScore: scores.J,
      rightScore: scores.P,
    },
  ];

  const dimensionAnalysis = dimensions
    .map((dim) => {
      const total = dim.leftScore + dim.rightScore;
      const dominant = dim.leftScore > dim.rightScore ? dim.left : dim.right;
      const dominantScore = Math.max(dim.leftScore, dim.rightScore);
      const percent = Math.round((dominantScore / total) * 100);
      const diff = Math.abs(dim.leftScore - dim.rightScore);

      let tendency =
        diff <= 2
          ? "非常平衡"
          : diff <= 5
          ? "略有倾向"
          : diff <= 10
          ? "明显倾向"
          : "强烈倾向";

      return `${dim.name}：${dim.left} ${dim.leftScore} : ${dim.rightScore} ${dim.right}（${tendency}于 ${dominant}，占比 ${percent}%）`;
    })
    .join("\n");

  return `请根据以下 MBTI 测试结果，为用户生成一份温柔、细腻、贴心的深度性格解读：

【基本信息】
MBTI 类型：${type}

【维度得分】
${dimensionAnalysis}

【总体得分】
E（外向）：${scores.E}
I（内向）：${scores.I}
S（实感）：${scores.S}
N（直觉）：${scores.N}
T（思考）：${scores.T}
F（情感）：${scores.F}
J（判断）：${scores.J}
P（感知）：${scores.P}

请输出一份符合以下结构的中文分析：

1. **核心特质总结**（1 段）
2. **能量与情绪模式**（1 段）
3. **人际与关系风格**（1 段）
4. **工作与学习风格**（1 段）
5. **温柔的成长建议**（3-5 条）

请确保语言温柔、真实、有共情，像一个懂他的朋友在说话。`;
}

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
  console.log("=== MBTI 分析云函数开始执行 ===");
  console.log("接收到的参数:", JSON.stringify(event));

  const { type, scores, answers } = event;

  // 参数校验
  if (!type || !scores) {
    console.error("❌ 参数校验失败：缺少必要参数");
    return {
      success: false,
      error: "缺少必要参数：type 和 scores",
    };
  }

  console.log("✅ 参数校验通过");
  console.log("MBTI 类型:", type);
  console.log("分数:", JSON.stringify(scores));

  // 检查环境变量
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ 环境变量 OPENAI_API_KEY 未配置");
    return {
      success: false,
      error: "OPENAI_API_KEY 未配置，请在云函数环境变量中设置",
    };
  }
  console.log(
    "✅ 环境变量已配置，API Key 前缀:",
    apiKey.substring(0, 10) + "..."
  );

  try {
    const userPrompt = generateUserPrompt(type, scores);
    console.log("✅ 生成用户提示词成功");

    // 调用 OpenAI 进行分析
    console.log("📡 开始调用 OpenAI API...");
    console.log("模型:gpt-5.1");
    console.log("温度: 0.7");
    console.log("最大 tokens: 1500");

    const rawAnalysis = await callOpenAI({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: userPrompt,
      options: {
        model: "gpt-5-mini", // 可以改为 gpt-4o 获得更好效果
        temperature: 1,
        maxTokens: 1500,
        timeout: 30000,
      },
    });

    console.log("✅ OpenAI 返回分析结果");
    console.log("分析内容长度:", rawAnalysis.length, "字符");

    // ========== 内容安全审核 ==========
    const { OPENID } = cloud.getWXContext();
    const safeResult = await safeAIResponse(rawAnalysis, "mbti", OPENID || "");

    if (!safeResult.passed) {
      console.warn("⚠️ MBTI 分析 AI 回复未通过内容安全审核");
    }

    return {
      success: true,
      analysis: safeResult.content,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ AI 分析失败");
    console.error("错误类型:", error.name);
    console.error("错误信息:", error.message);
    console.error("错误详情:", error.stack);

    // 返回兜底内容
    console.log("💡 使用兜底内容");
    const fallbackAnalysis = `【核心特质总结】
你是一个 ${type} 类型的人。你的内心世界丰富而细腻，既有独特的洞察力，也保持着对世界的温柔关注。

【能量与情绪模式】
你的能量更多来自内在世界。独处时，你能够充分恢复精力，思考和感受会变得更加清晰。你对情绪的感知很敏锐，既能理解自己的感受，也能共情他人的情绪。

【人际与关系风格】
在人际关系中，你倾向于建立深度而真实的连接。你不追求广泛的社交，而是珍惜那些能够真正理解你的人。你善于倾听，也愿意给予支持。

【工作与学习风格】
你喜欢有意义、有深度的工作内容。你会为自己认同的目标全力以赴，但也需要足够的自主空间。你善于从整体视角思考问题，同时也能关注细节。

【温柔的成长建议】
1. 允许自己有独处的时间，这是你恢复能量的重要方式
2. 在表达自己时，可以更加直接一些，你的想法值得被听见
3. 学会在理想与现实之间找到平衡，不必过于苛责自己
4. 记得照顾好自己的身体和情绪，你的感受同样重要
5. 相信自己的直觉，它往往能带你找到正确的方向

注：AI 服务暂时不可用，这是默认解读内容。`;

    return {
      success: true,
      analysis: fallbackAnalysis,
      fallback: true,
      error: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString(),
    };
  }
};
