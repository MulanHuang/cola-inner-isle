// pages/mbti-result/mbti-result.js
const { getMbtiTypeInfo } = require("../../utils/mbti.js");
// ✅ AI 解读改为前端直连 Vercel 代理（绕过云函数 3 秒超时限制）

const db = wx.cloud.database();

// 🚀 可复用的 AI 请求函数（前端直连 Vercel 代理）
// 注意：gpt-5-mini 是推理模型，需要更多 token（推理 + 输出）
function requestAI({
  messages,
  model = "gpt-5-mini",
  temperature = 0.7,
  max_completion_tokens = 16000,
}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: "https://vercel-openai-proxy-lemon.vercel.app/api/openai",
      method: "POST",
      header: { "Content-Type": "application/json" },
      data: { model, temperature, messages, max_completion_tokens },
      timeout: 60000,
      success(res) {
        console.log("🔍 AI 响应状态码:", res.statusCode);
        if (res.statusCode !== 200) {
          console.error("❌ HTTP 错误:", res.statusCode, res.data);
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const data = res.data;
        // 格式 A: 代理封装格式
        if (data?.success && data?.content) {
          console.log("✅ 解析成功 (格式 A)");
          resolve(data.content);
          // 格式 B: OpenAI 原始格式
        } else if (data?.choices?.[0]?.message?.content) {
          const content = data.choices[0].message.content;
          if (!content || content.trim() === "") {
            const finishReason = data.choices[0].finish_reason;
            console.error("❌ AI 返回空内容, finish_reason:", finishReason);
            reject(
              new Error(
                finishReason === "length"
                  ? "AI 推理 token 不足"
                  : "AI 返回了空内容"
              )
            );
            return;
          }
          console.log("✅ 解析成功 (格式 B)");
          resolve(content);
          // 格式 C: OpenAI 错误格式
        } else if (data?.error) {
          const errorMsg =
            typeof data.error === "string"
              ? data.error
              : data.error.message || data.error.code || "未知 API 错误";
          console.error("❌ OpenAI API 错误:", errorMsg);
          reject(new Error(`AI 服务错误: ${errorMsg}`));
        } else if (data?.choices?.[0]?.message) {
          // choices 存在但 content 为空
          const finishReason = data.choices[0].finish_reason;
          console.error("❌ AI 返回空内容, finish_reason:", finishReason);
          reject(
            new Error(
              finishReason === "length"
                ? "AI 推理 token 不足"
                : "AI 返回了空内容"
            )
          );
        } else {
          console.error(
            "❌ 无法解析的响应格式:",
            JSON.stringify(data).substring(0, 500)
          );
          reject(new Error("AI 返回格式异常"));
        }
      },
      fail(err) {
        console.error("❌ 网络请求失败:", err);
        reject(new Error(err.errMsg || "网络请求失败"));
      },
    });
  });
}

Page({
  data: {
    type: "", // MBTI 类型
    typeInfo: {}, // 类型信息
    scores: {}, // 分数对象
    dimensions: [], // 四个维度的对比数据
    analysis: "", // AI 解读内容
    showAnalysis: false, // 是否显示 AI 解读
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
    console.log("🔍 点击了 AI 解读按钮");
    console.log("📊 当前数据：", this.data.type, this.data.scores);

    wx.showLoading({ title: "生成中...", mask: true });

    const { type, scores } = this.data;

    // 调用自建后端 API
    console.log("📡 准备调用后端 API...");
    this.callBackendAPI(type, scores);
  },

  /**
   * ✅ 前端直连代理调用 OpenAI 进行 AI 解读（绕过云函数 3 秒超时限制）
   */
  async callBackendAPI(type, scores) {
    console.log("📤 调用 AI 代理:", { type, scores });

    try {
      // 系统提示词
      const systemPrompt = `你是一位温柔、真实、有边界感的心灵陪伴者。
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
          const dominant =
            dim.leftScore > dim.rightScore ? dim.left : dim.right;
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

      const userPrompt = `请根据以下 MBTI 测试结果，为用户生成一份温柔、细腻、贴心的深度性格解读：

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

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const analysis = await requestAI({
        messages,
        model: "gpt-5-mini",
        temperature: 0.7,
      });

      console.log("📥 AI 返回成功");
      wx.hideLoading();

      wx.showToast({
        title: "解读生成成功",
        icon: "success",
        duration: 1500,
      });

      this.setData({
        analysis: analysis,
        showAnalysis: true,
      });
    } catch (err) {
      wx.hideLoading();
      console.error("❌ AI 调用失败:", err);

      wx.showToast({
        title: "正在使用默认解读",
        icon: "none",
        duration: 2000,
      });

      this.showDefaultAnalysis();
    }
  },

  /**
   * 显示默认解读（当 API 未实现时）
   */
  showDefaultAnalysis() {
    const { type, typeInfo } = this.data;

    const defaultAnalysis = `你的 MBTI 类型是 ${type} - ${typeInfo.name}。

${typeInfo.desc}

作为 ${type} 类型的人，你具有独特的性格特质和优势。这个类型的人通常在特定领域表现出色，同时也有自己需要注意的成长方向。

建议：
1. 发挥你的优势，在适合的领域深耕
2. 了解并接纳自己的特点
3. 与不同类型的人交流，拓展视野
4. 持续学习和成长

注：AI 深度解读功能需要配置后端接口才能使用。当前显示的是默认解读内容。`;

    this.setData({
      analysis: defaultAnalysis,
      showAnalysis: true,
    });
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
