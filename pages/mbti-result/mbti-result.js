// pages/mbti-result/mbti-result.js
const { getMbtiTypeInfo } = require("../../subpackages/common/mbti.js");
// ✅ AI 解读改为前端直连 Vercel 代理（流式输出）
// 🔥 已升级为流式输出，用户可在 0.2 秒内看到字符开始出现

const db = wx.cloud.database();
const { callAIStream } = require("../../utils/aiStream.js");

Page({
  data: {
    navBarHeight: 0, // 导航栏高度
    type: "", // MBTI 类型
    typeInfo: {}, // 类型信息
    scores: {}, // 分数对象
    dimensions: [], // 四个维度的对比数据
    analysis: "", // AI 解读内容
    analysisSections: [], // AI 解读分段内容
    aiState: "idle", // idle | loading | success | error
    analysisError: "", // AI 解读错误信息
    analysisStyleLabel: "清晰洞见",
  },

  // 导航栏准备完成
  onNavReady(e) {
    this.setData({
      navBarHeight: e.detail.navBarHeight || 0,
    });
  },

  onLoad(options) {
    const { type, scores } = options;

    if (type && scores) {
      const scoresObj = JSON.parse(scores);
      const typeInfo = getMbtiTypeInfo(type);

      // 计算四个维度的对比
      const dimensions = this.calculateDimensions(scoresObj);

      this.setData({
        type,
        typeInfo,
        scores: scoresObj,
        dimensions,
      });

      // 保存测试历史到云数据库
      this.saveTestHistory(type, scoresObj, typeInfo, dimensions);
    }
  },

  /**
   * 保存测试历史到云数据库
   */
  async saveTestHistory(type, scores, typeInfo, dimensions) {
    try {
      console.log("📝 保存 MBTI 测试历史...");

      const historyData = {
        type,
        typeName: typeInfo.name,
        typeDesc: typeInfo.desc,
        scores,
        dimensions,
        testDate: db.serverDate(),
        timestamp: Date.now(),
      };

      const result = await db.collection("mbti_history").add({
        data: historyData,
      });

      console.log("✅ MBTI 测试历史保存成功，记录ID：", result._id);
    } catch (err) {
      console.warn("⚠️ MBTI 测试历史保存到云数据库失败：", err);

      // 保存到本地存储作为备份
      try {
        const localHistory = wx.getStorageSync("mbti_history_local") || [];
        localHistory.unshift({
          type,
          typeName: typeInfo.name,
          typeDesc: typeInfo.desc,
          scores,
          dimensions,
          testDate: new Date().toISOString(),
          timestamp: Date.now(),
        });
        // 只保留最近 50 条本地记录
        wx.setStorageSync("mbti_history_local", localHistory.slice(0, 50));
        console.log("📦 已保存到本地存储作为备份");
      } catch (storageErr) {
        console.warn("❌ 本地存储也失败：", storageErr);
      }
    }
  },

  /**
   * 计算四个维度的对比数据
   */
  calculateDimensions(scores) {
    const dimensions = [
      {
        name: "外向 vs 内向",
        left: "E",
        right: "I",
        leftScore: scores.E,
        rightScore: scores.I,
        leftPercent: this.calcPercent(scores.E, scores.I),
        rightPercent: this.calcPercent(scores.I, scores.E),
        leftDesc: "外向型",
        rightDesc: "内向型",
        leftLabel: "外向",
        rightLabel: "内向",
        colorType: "blue",
        hint: "衡量你获取能量的方式：从外部社交互动还是内部独处思考",
      },
      {
        name: "实感 vs 直觉",
        left: "S",
        right: "N",
        leftScore: scores.S,
        rightScore: scores.N,
        leftPercent: this.calcPercent(scores.S, scores.N),
        rightPercent: this.calcPercent(scores.N, scores.S),
        leftDesc: "直觉型",
        rightDesc: "实感型",
        leftLabel: "直觉",
        rightLabel: "实感",
        colorType: "yellow",
        hint: "衡量你获取信息的方式：关注具体事实还是整体模式与可能性",
      },
      {
        name: "思考 vs 情感",
        left: "T",
        right: "F",
        leftScore: scores.T,
        rightScore: scores.F,
        leftPercent: this.calcPercent(scores.T, scores.F),
        rightPercent: this.calcPercent(scores.F, scores.T),
        leftDesc: "思考型",
        rightDesc: "情感型",
        leftLabel: "思考",
        rightLabel: "情感",
        colorType: "green",
        hint: "衡量你做决策的方式：基于逻辑分析还是个人价值与情感",
      },
      {
        name: "判断 vs 感知",
        left: "J",
        right: "P",
        leftScore: scores.J,
        rightScore: scores.P,
        leftPercent: this.calcPercent(scores.J, scores.P),
        rightPercent: this.calcPercent(scores.P, scores.J),
        leftDesc: "判断型",
        rightDesc: "感知型",
        leftLabel: "判断",
        rightLabel: "感知",
        colorType: "purple",
        hint: "衡量你面对外部世界的方式：喜欢计划与秩序还是灵活与开放",
      },
    ];

    return dimensions;
  },

  /**
   * 计算百分比
   */
  calcPercent(score1, score2) {
    const total = score1 + score2;
    if (total === 0) return 50;
    return Math.round((score1 / total) * 100);
  },

  /**
   * 获取 AI 深度解读
   */
  getAiAnalysis() {
    if (this.data.aiState === "loading") return;
    console.log("🔍 点击了 AI 解读按钮");
    console.log("📊 当前数据：", this.data.type, this.data.scores);

    this.setData({
      aiState: "loading",
      analysis: "",
      analysisSections: [],
      analysisError: "",
    });

    const { type, scores } = this.data;

    // 调用自建后端 API
    console.log("📡 准备调用后端 API...");
    this.callBackendAPI(type, scores);
  },

  /**
   * ✅ 前端直连代理调用 OpenAI 进行 AI 解读（流式输出）
   */
  callBackendAPI(type, scores) {
    console.log("[MBTI] 🔥 开始流式请求:", { type, scores });

    // 根据风格选择不同的系统提示词
    const systemPrompt = this.getSystemPrompt();

    // 构建用户提示词
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

    // 根据风格生成用户提示词
    const userPrompt = this.getUserPrompt(type, scores, dimensionAnalysis);

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // 🔥 使用流式调用
    this._currentStreamTask = callAIStream({
      messages,
      model: "gpt-5-mini",
      temperature: 1,
      onChunk: (chunk, fullText) => {
        // 实时更新解读内容，让用户看到流式输出
        this.setData({ analysis: fullText });
      },
      onComplete: (fullText) => {
        console.log("[MBTI] ✅ 流式输出完成");
        let sections = [];
        try {
          sections = JSON.parse(fullText);
        } catch (parseErr) {
          console.error("[MBTI] ❌ JSON 解析失败:", parseErr.message);
          this.setData({
            aiState: "error",
            analysisError: "解读格式异常，请稍后重试。",
          });
          this._currentStreamTask = null;
          return;
        }

        wx.showToast({
          title: "解读生成成功",
          icon: "success",
          duration: 1500,
        });
        this.setData({
          analysis: "",
          analysisSections: sections,
          aiState: "success",
        });
        this._currentStreamTask = null;
      },
      onError: (err) => {
        console.error("[MBTI] ❌ AI 调用失败:", err.message);
        wx.showToast({
          title: "解读生成失败",
          icon: "none",
          duration: 2000,
        });
        this.setData({
          aiState: "error",
          analysisError: err.message || "暂时无法连接，请稍后再试。",
        });
        this._currentStreamTask = null;
      },
    });
  },

  /**
   * 获取系统提示词（清晰洞见）
   */
  getSystemPrompt() {
    return `你是一位对 MBTI 有深入理解的认知结构分析者。

你所提供的内容不是心理诊断，也不是性格评判，
而是用于帮助使用者理解：
自己在思考、反应、决策与消耗能量时的内在运作方式。

请将 MBTI 视为一种「认知能量的使用偏好」
以及「个体与世界互动时形成的稳定习惯结构」，而非性格标签。

你的分析目标不是描述类型特征，
而是揭示：
这些认知偏好在现实生活中如何带来优势，
又如何同时制造张力、盲点与代价。

请保持语言冷静、不评判、以洞见为导向，
避免励志、安慰或总结式表达。
`;
  },

  /**
   * 获取用户提示词（清晰洞见 JSON）
   */
  getUserPrompt(type, scores, dimensionAnalysis) {
    const baseInfo = `【基本信息】
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
P（感知）：${scores.P}`;

    return `请根据以下 MBTI 测试结果，
为用户生成一份具有洞见、深度与自我觉察价值的 MBTI 解读。

${baseInfo}

【输出格式要求】
请只输出严格的 JSON 数组，不要添加任何解释性文字，不要使用 Markdown。
JSON 结构必须完全符合以下规范：

[
  {
    "key": "core",
    "title": "核心特质",
    "insight": "一句高度概括的洞见句（不超过20字）",
    "body": [
      "正文说明一句",
      "正文说明一句"
    ],
    "bullets": [
      "要点一",
      "要点二"
    ]
  },
  {
    "key": "emotion",
    "title": "情绪模式",
    "insight": "...",
    "body": [...],
    "bullets": [...]
  },
  {
    "key": "relationship",
    "title": "人际风格",
    "insight": "...",
    "body": [...],
    "bullets": [...]
  },
  {
    "key": "work",
    "title": "工作与学习方式",
    "insight": "...",
    "body": [...],
    "bullets": [...]
  },
  {
    "key": "growth",
    "title": "成长建议",
    "insight": "...",
    "body": [],
    "bullets": [
      "觉察方向一",
      "觉察方向二",
      "觉察方向三"
    ]
  }
]

【内容要求】
- 总共 5 个模块，必须包含以上 key
- insight 不超过 20 字
- body 为 5-6 句具体说明
- bullets 为 2-4 条要点
- 成长建议模块可不写 body
- 使用冷静、克制、不评判的表达
- 目标是"让用户对自己的运作方式产生新的理解"`;
  },
  resetAnalysis() {
    this.setData({
      aiState: "idle",
      analysis: "",
      analysisSections: [],
      analysisError: "",
    });
  },

  retryAiAnalysis() {
    this.getAiAnalysis();
  },

  /**
   * 重新测试
   */
  retakeTest() {
    wx.redirectTo({
      url: "/pages/mbti-test/mbti-test",
    });
  },

  /**
   * 返回首页
   */
  goHome() {
    wx.switchTab({
      url: "/pages/home/home",
    });
  },
});
