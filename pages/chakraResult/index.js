// pages/chakraResult/index.js
const {
  CHAKRA_INFO,
  getChakraInterpretation,
} = require("../chakraTest/data/chakraInfo.js");

// 🚀 脉轮分析改为前端直连 Vercel 代理（绕过云函数 3 秒超时限制）

// 脉轮英文映射
const CHAKRA_NAMES = {
  root: "海底轮",
  sacral: "腹轮",
  solarPlexus: "太阳轮",
  heart: "心轮",
  throat: "喉轮",
  thirdEye: "眉心轮",
  crown: "顶轮",
};

// 🚀 可复用的 AI 请求函数（前端直连 Vercel 代理）
// 注意：gpt-5-mini 是推理模型，需要更多 token（推理 + 输出）
function requestAI({
  messages,
  model = "gpt-5-mini",
  temperature = 1,
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
          // 检查是否为空内容（推理模型 token 不足时会返回空）
          if (!content || content.trim() === "") {
            const finishReason = data.choices[0].finish_reason;
            const reasoningTokens =
              data.usage?.completion_tokens_details?.reasoning_tokens || 0;
            console.error(
              "❌ AI 返回空内容, finish_reason:",
              finishReason,
              ", reasoning_tokens:",
              reasoningTokens
            );
            if (finishReason === "length") {
              reject(
                new Error("AI 推理 token 不足，请增加 max_completion_tokens")
              );
            } else {
              reject(new Error("AI 返回了空内容"));
            }
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
          console.error("❌ 完整错误:", JSON.stringify(data.error));
          reject(new Error(`AI 服务错误: ${errorMsg}`));
        } else {
          // 检查是否有 choices 但 content 为空
          if (data?.choices?.[0]?.message) {
            const finishReason = data.choices[0].finish_reason;
            const reasoningTokens =
              data.usage?.completion_tokens_details?.reasoning_tokens || 0;
            console.error(
              "❌ AI 返回空内容, finish_reason:",
              finishReason,
              ", reasoning_tokens:",
              reasoningTokens
            );
            if (finishReason === "length") {
              reject(
                new Error("AI 推理 token 不足，请增加 max_completion_tokens")
              );
            } else {
              reject(new Error("AI 返回了空内容"));
            }
            return;
          }
          console.error(
            "❌ 无法解析的响应格式:",
            JSON.stringify(data).substring(0, 500)
          );
          reject(new Error("AI 返回格式异常，请检查控制台日志"));
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
    results: {},
    chakraList: [],
    radarData: [], // 雷达图数据
    selectedChakra: "", // 当前选中的脉轮类型
    selectedChakraInfo: {}, // 当前选中脉轮的详细信息

    // AI 分析相关（单个脉轮详细分析，使用代理函数 analyzeChakraResult）
    aiAnalysis: null, // AI 生成的分析结果
    isAnalyzing: false, // 是否正在分析中
    analysisError: false, // 分析是否失败
    showAiSection: false, // 是否显示 AI 分析区域

    // AI 综合分析相关（综合分析，已改为高稳定性代理接口 /chakra/analyze）
    overallAnalysis: null, // AI 综合分析结果
    isOverallAnalyzing: false, // 是否正在进行综合分析
    overallAnalysisError: false, // 综合分析是否失败
    showOverallSection: false, // 是否显示综合分析区域
  },

  onLoad(options) {
    // 从URL参数中获取结果
    if (options.results) {
      try {
        // 先解码 URL 编码，再解析 JSON
        const decodedResults = decodeURIComponent(options.results);
        const results = JSON.parse(decodedResults);

        // 验证数据完整性
        const requiredChakras = [
          "root",
          "sacral",
          "solar",
          "heart",
          "throat",
          "third_eye",
          "crown",
        ];
        const hasAllChakras = requiredChakras.every(
          (type) =>
            results[type] && typeof results[type].percentage === "number"
        );

        if (!hasAllChakras) {
          console.error("脉轮数据不完整：", results);
          wx.showToast({
            title: "数据不完整，正在加载最新记录",
            icon: "none",
          });
          this.loadLatestResult();
          return;
        }

        console.log("从 URL 解析成功，处理测试结果");
        this.processResults(results);
      } catch (err) {
        console.error("解析测试结果失败：", err);
        wx.showToast({
          title: "数据解析失败，正在加载最新记录",
          icon: "none",
        });
        this.loadLatestResult();
      }
    } else {
      // 如果没有结果参数，从数据库加载最新的测试结果
      this.loadLatestResult();
    }
  },

  // 处理测试结果
  processResults(results) {
    console.log("开始处理测试数据：", results);

    const chakraTypes = [
      "root",
      "sacral",
      "solar",
      "heart",
      "throat",
      "third_eye",
      "crown",
    ];

    const chakraList = chakraTypes.map((type) => {
      const result = results[type];
      const info = CHAKRA_INFO[type];
      const interpretation = getChakraInterpretation(result.percentage, type);

      return {
        type: type,
        result: result,
        info: info,
        interpretation: interpretation,
      };
    });

    // 生成雷达图数据
    const radarData = chakraList.map((item) => ({
      type: item.type,
      name: item.info.name,
      value: item.result.percentage,
      color: item.info.color,
    }));

    console.log("生成的雷达图数据：", radarData);

    // 找到得分最低的脉轮作为默认选中
    const lowestChakra = chakraList.reduce((min, item) =>
      item.result.percentage < min.result.percentage ? item : min
    );

    console.log("默认选中的脉轮：", lowestChakra.type);

    this.setData(
      {
        results: results,
        chakraList: chakraList,
        radarData: radarData,
        selectedChakra: lowestChakra.type,
      },
      () => {
        console.log("数据设置完成，radarData:", this.data.radarData);

        // 延迟触发雷达图组件重绘，确保组件已接收到数据
        setTimeout(() => {
          this.triggerRadarRefresh();
        }, 500);
      }
    );

    // 更新选中脉轮的详细信息
    this.updateSelectedChakraInfo(lowestChakra.type);

    // 调用 AI 分析接口（单个脉轮详细分析，代理函数）
    this.analyzeChakraResults(results);

    // 调用 AI 综合分析接口（综合分析，高稳定性代理接口）
    this.analyzeChakraOverall(results);
  },

  // 加载最新的测试结果
  async loadLatestResult() {
    wx.showLoading({
      title: "加载中...",
    });

    try {
      const db = wx.cloud.database();
      const res = await db
        .collection("chakra_history")
        .orderBy("testDate", "desc")
        .limit(1)
        .get();

      wx.hideLoading();

      if (res.data && res.data.length > 0) {
        this.processResults(res.data[0].results);
      } else {
        wx.showModal({
          title: "提示",
          content: "没有找到测试结果，请先完成测试",
          showCancel: false,
          success: () => {
            wx.redirectTo({
              url: "/pages/chakraTest/index",
            });
          },
        });
      }
    } catch (err) {
      console.error("加载结果失败", err);
      wx.hideLoading();
      wx.showToast({
        title: "加载失败",
        icon: "none",
      });
    }
  },

  // 更新选中脉轮的详细信息
  updateSelectedChakraInfo(chakraType) {
    const chakra = this.data.chakraList.find(
      (item) => item.type === chakraType
    );
    if (!chakra) return;

    const percentage = chakra.result.percentage;
    const info = chakra.info;
    const interpretation = chakra.interpretation;

    // 根据得分确定状态图标
    let statusIcon = "⚠️";
    if (percentage >= 80) {
      statusIcon = "✨";
    } else if (percentage >= 50) {
      statusIcon = "🌱";
    }

    this.setData({
      selectedChakraInfo: {
        type: chakraType,
        name: info.name,
        emoji: info.emoji,
        color: info.color,
        percentage: percentage,
        statusIcon: statusIcon,
        statusTitle: interpretation.title,
        description: interpretation.description,
        traits: interpretation.traits,
        practices: info.suggestions.practice,
        affirmation: info.suggestions.affirmation,
      },
    });
  },

  // 雷达图脉轮切换事件
  onChakraChange(e) {
    const chakraType = e.detail.type;
    this.setData({
      selectedChakra: chakraType,
    });
    this.updateSelectedChakraInfo(chakraType);
  },

  // 强制触发雷达图组件刷新
  triggerRadarRefresh() {
    console.log("🔄 触发雷达图刷新");

    // 获取雷达图组件实例（使用 id 选择器）
    const radarComponent = this.selectComponent("#chakraRadar");
    if (radarComponent) {
      console.log("🚀 找到雷达图组件");
      // 优先调用 initCanvas2D 确保 Canvas 初始化
      if (typeof radarComponent.initCanvas2D === "function") {
        console.log("🖌️ 调用 initCanvas2D");
        radarComponent.initCanvas2D();
      } else if (typeof radarComponent.drawRadar === "function") {
        console.log("🖌️ 调用 drawRadar");
        radarComponent.drawRadar();
      }
    } else {
      console.warn("⚠️ 未找到雷达图组件，尝试通过数据变化触发");
      // 通过轻微修改数据触发组件更新
      const currentRadarData = this.data.radarData;
      if (currentRadarData && currentRadarData.length > 0) {
        this.setData({
          radarData: [...currentRadarData],
        });
      }
    }
  },

  // 重新测试
  retakeTest() {
    wx.showModal({
      title: "重新测试",
      content: "确定要重新开始测试吗？",
      success: (res) => {
        if (res.confirm) {
          wx.redirectTo({
            url: "/pages/chakraTest/index",
          });
        }
      },
    });
  },

  // 查看历史记录
  viewHistory() {
    wx.navigateTo({
      url: "/pages/chakraHistory/index",
    });
  },

  // 返回主页
  backToHome() {
    wx.switchTab({
      url: "/pages/home/home",
    });
  },

  /**
   * 🚀 前端直连代理调用 OpenAI（单个脉轮详细分析，绕过云函数 3 秒超时限制）
   */
  async analyzeChakraResults(results) {
    this.setData({
      isAnalyzing: true,
      analysisError: false,
      showAiSection: true,
    });

    try {
      const chakraScores = {
        root: results.root?.percentage || 0,
        sacral: results.sacral?.percentage || 0,
        solarPlexus: results.solar?.percentage || 0,
        heart: results.heart?.percentage || 0,
        throat: results.throat?.percentage || 0,
        thirdEye: results.third_eye?.percentage || 0,
        crown: results.crown?.percentage || 0,
      };

      const scores = Object.values(chakraScores);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      let level =
        avgScore >= 80
          ? "高度平衡"
          : avgScore >= 60
          ? "良好平衡"
          : avgScore < 50
          ? "需要关注"
          : "中等平衡";

      const chakraEntries = Object.entries(chakraScores).map(
        ([key, score]) => ({ key, score })
      );
      const sortedChakras = chakraEntries.sort((a, b) => b.score - a.score);
      const strongChakras = sortedChakras
        .slice(0, 2)
        .filter((c) => c.score >= 60)
        .map((c) => CHAKRA_NAMES[c.key] || c.key);
      const weakChakras = sortedChakras
        .slice(-2)
        .filter((c) => c.score < 60)
        .map((c) => CHAKRA_NAMES[c.key] || c.key);

      const systemPrompt = `你是一位温柔、专业的心灵疗愈师，专注于脉轮能量分析。
你的角色定位：
1. 温柔、包容地引导用户探索自己的能量状态
2. 使用日常易懂的语言，避免过于玄学或复杂的表达
3. 严格禁止使用任何医学诊断或诊断词汇
4. 多用"也许"、"可能"、"有时候"等非绝对用语
5. 关注用户的感受和体验，不做评判或批评
输出要求：
1. 必须返回合格的 JSON 格式，不要带任何额外的文本或 Markdown 标记
2. 所有文本必须使用中文
3. 内容温柔、积极、充满希望`;

      const userPrompt = `根据以下脉轮测试结果，请给出一份温柔、详细的分析报告：

脉轮分数（满分100）：
- 海底轮：${chakraScores.root}
- 腹轮：${chakraScores.sacral}
- 太阳轮：${chakraScores.solarPlexus}
- 心轮：${chakraScores.heart}
- 喉轮：${chakraScores.throat}
- 眉心轮：${chakraScores.thirdEye}
- 顶轮：${chakraScores.crown}

整体状态：${level}
${strongChakras.length > 0 ? `较强的：${strongChakras.join("、")}` : ""}
${weakChakras.length > 0 ? `可以关注：${weakChakras.join("、")}` : ""}

请详细返回以下 JSON 格式，不需要任何额外的文本：
{
  "overall_summary": "整体总结，80-120字",
  "strengths": ["优势1", "优势2", "优势3"],
  "growth_focus": ["关注点1", "关注点2"],
  "simple_practices": ["练习1", "练习2", "练习3"]
}`;

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const response = await requestAI({
        messages,
        model: "gpt-5-mini",
        temperature: 1,
      });

      // 解析 JSON
      let analysisResult;
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?$/g, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
      }
      analysisResult = JSON.parse(cleanedResponse);

      console.log("🚀 AI 分析成功");
      this.setData({
        aiAnalysis: analysisResult,
        isAnalyzing: false,
        analysisError: false,
      });
    } catch (err) {
      console.error("❌ AI 分析失败：", err);
      this.setData({
        isAnalyzing: false,
        analysisError: true,
      });
    }
  },

  /**
   * 🚀 前端直连代理调用 OpenAI（综合分析，绕过云函数 3 秒超时限制）
   */
  async analyzeChakraOverall(results) {
    this.setData({
      isOverallAnalyzing: true,
      overallAnalysisError: false,
      showOverallSection: true,
    });

    try {
      const chakraScores = {
        root: results.root?.percentage || 0,
        sacral: results.sacral?.percentage || 0,
        solarPlexus: results.solar?.percentage || 0,
        heart: results.heart?.percentage || 0,
        throat: results.throat?.percentage || 0,
        thirdEye: results.third_eye?.percentage || 0,
        crown: results.crown?.percentage || 0,
      };

      const scores = Object.values(chakraScores);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      const variance = maxScore - minScore;

      const chakraEntries = Object.entries(chakraScores).map(
        ([key, score]) => ({ key, name: CHAKRA_NAMES[key] || key, score })
      );
      const sortedChakras = chakraEntries.sort((a, b) => b.score - a.score);
      const highestChakra = sortedChakras[0];
      const lowestChakra = sortedChakras[sortedChakras.length - 1];

      const systemPrompt = `你是"小可"，一位温柔、专业的心灵疗愈师，专注于脉轮能量综合分析。
你的角色定位：
1. 温柔、包容地引导用户探索自己的整体能量状态
2. 使用日常易懂的语言，避免过于玄学或复杂的表达
3. 严格禁止使用任何医学诊断或诊断词汇
4. 多用"也许"、"可能"、"有时候"等非绝对用语
5. 关注能量流动的平衡性，避免强调单一脉轮的"好坏"
输出要求：
1. 必须返回合格的 JSON 格式，不要带任何额外的文本或 Markdown 标记
2. 所有文本必须使用中文
3. 内容温柔、积极、充满希望`;

      const userPrompt = `根据这位来访者的七大脉轮测试结果，请给出一份整体综合分析的建议报告：

【七大脉轮分数】
- 海底轮（根基与安全感）：${chakraScores.root}分
- 腹轮（情感与创造力）：${chakraScores.sacral}分
- 太阳轮（自信与意志力）：${chakraScores.solarPlexus}分
- 心轮（爱与连接）：${chakraScores.heart}分
- 喉轮（表达与沟通）：${chakraScores.throat}分
- 眉心轮（直觉与洞察）：${chakraScores.thirdEye}分
- 顶轮（灵性与智慧）：${chakraScores.crown}分

【统计数据】
- 平均分：${avgScore.toFixed(1)}分
- 最高分：${maxScore}分（${highestChakra.name}）
- 最低分：${minScore}分（${lowestChakra.name}）
- 分数浮动范围：${variance}分

请详细返回以下 JSON 格式的建议报告：
{
  "overall_state": "整体能量状态描述（2-3句话）",
  "energy_distribution": "能量分布特点描述（2-3句话）",
  "chakra_connections": "脉轮关联分析（2-3句话）",
  "personalized_advice": ["个性化建议1", "个性化建议2", "个性化建议3"],
  "focus_areas": ["发展重点1", "发展重点2"],
  "encouragement": "温馨的鼓励（1-2句话）"
}`;

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const response = await requestAI({
        messages,
        model: "gpt-5-mini",
        temperature: 1,
      });

      // 解析 JSON
      let analysisResult;
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?$/g, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
      }
      analysisResult = JSON.parse(cleanedResponse);

      console.log("🚀 AI 综合分析成功");
      this.setData({
        overallAnalysis: analysisResult,
        isOverallAnalyzing: false,
        overallAnalysisError: false,
      });
    } catch (err) {
      console.error("❌ AI 综合分析失败：", err);
      this.setData({
        isOverallAnalyzing: false,
        overallAnalysisError: true,
      });
    }
  },

  // 重试综合分析
  retryOverallAnalysis() {
    if (this.data.results) {
      this.analyzeChakraOverall(this.data.results);
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: "来做个脉轮测试，了解你的能量状态吧！",
      path: "/pages/chakraTest/index",
      imageUrl: "/images/share-chakra.png",
    };
  },
});
