// pages/oh/oh.js
// ============================================================
// OH卡自我探索页面 - 逻辑与状态管理（终极冥想疗愈版）
// 模式: imageOnly（自由图卡）| imageAndWord（图卡+字卡）
// ============================================================

const db = wx.cloud.database();

// ✅ OH卡解读改为前端直连 Vercel 代理（绕过云函数 3 秒超时限制）

// 🚀 可复用的 AI 请求函数（前端直连 Vercel 代理）
// 注意：gpt-5-mini 是推理模型，需要更多 token（推理 + 输出）
function requestAI({
  messages,
  model = "gpt-5-mini",
  temperature = 0.75,
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

// 解析 AI 返回的六段式内容
function parseAIResponse(content) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  let sections = paragraphs;
  if (sections.length < 6) {
    sections = content
      .split(/【[^】]+】/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }
  while (sections.length < 6) {
    sections.push("");
  }
  return {
    insight: sections[0] + (sections[1] ? "\n\n" + sections[1] : ""),
    subconscious: sections[2] || "",
    actions: sections[3] || "",
    reflectionQuestions: sections[4] || "",
    closing: sections[5] || "",
  };
}

// OH 卡背面图配置（你的背面图片）
const OH_CARD_BACK_IMAGE =
  "cloud://cloud1-5gc5jltwbcbef586.636c-cloud1-5gc5jltwbcbef586-1386967363/ohCards-back.webp";

// 牌堆展示的卡片数量（用于视觉堆叠，不影响真正抽卡逻辑）
const DECK_LAYER_COUNT = 22;

Page({
  data: {
    // 当前模式: "imageOnly" 或 "imageAndWord"
    mode: "imageOnly",

    // 用于 WXML 中渲染牌堆的层数数组
    deckLayers: Array.from({ length: DECK_LAYER_COUNT }, (_, i) => i),

    // 图卡数据
    selectedImageCard: null, // { index, name, fileId }

    // 字卡数据（图+字模式）
    selectedWordCard: null, // { index, name, fileId }

    // 用户输入
    userInput: "",

    // 加载状态
    loading: false,
    drawing: false,

    // AI 解读结果
    aiResult: {
      insight: "", // 心理洞察
      subconscious: "", // 潜意识线索
      actions: "", // 行动建议
      reflectionQuestions: "", // 自我提问
      closing: "", // 收尾语
    },

    // OH卡背面图片（牌堆展示用）
    backImage: OH_CARD_BACK_IMAGE,

    // 字数接近上限提示
    charNearLimit: false,

    // 抽到卡之后，输入框高亮一次（配合 WXSS 的 just-drawn 动画）
    inputJustShown: false,
  },

  // ============================================================
  // 生命周期
  // ============================================================

  onLoad() {
    // 初始化时重置状态（不保留输入内容）
    this.resetState(false);
  },

  /**
   * 重置页面状态
   * @param {boolean} keepInput 是否保留用户输入
   */
  resetState(keepInput = true) {
    const keptText = keepInput ? this.data.userInput : "";

    this.setData({
      selectedImageCard: null,
      selectedWordCard: null,
      aiResult: {
        insight: "",
        subconscious: "",
        actions: "",
        reflectionQuestions: "",
        closing: "",
      },
      userInput: keptText,
      charNearLimit: keptText.length > 450,
      inputJustShown: false,
      drawing: false,
      loading: false,
    });
  },

  // ============================================================
  // 模式切换
  // ============================================================

  /**
   * 切换模式
   */
  switchMode(e) {
    const newMode = e.currentTarget.dataset.mode;
    if (!newMode || newMode === this.data.mode) return;

    // 切换模式时清空抽卡和解读结果，但保留用户输入内容
    this.setData({
      mode: newMode,
    });
    this.resetState(true);
  },

  // ============================================================
  // 抽卡逻辑
  // ============================================================

  /**
   * 抽取卡牌
   */
  async drawCards() {
    if (this.data.drawing) return;

    this.setData({ drawing: true });

    try {
      // 抽取图卡
      const imageCardResult = await db
        .collection("ohImageCards")
        .aggregate()
        .sample({ size: 1 })
        .end();

      if (!imageCardResult.list || imageCardResult.list.length === 0) {
        throw new Error("未能获取图卡数据");
      }

      const imageCard = imageCardResult.list[0];

      // 根据模式决定是否抽取字卡
      let wordCard = null;
      if (this.data.mode === "imageAndWord") {
        const wordCardResult = await db
          .collection("ohWordCards")
          .aggregate()
          .sample({ size: 1 })
          .end();

        if (wordCardResult.list && wordCardResult.list.length > 0) {
          wordCard = wordCardResult.list[0];
        }
      }

      // 更新状态
      this.setData({
        selectedImageCard: {
          index: imageCard.index,
          name: imageCard.name,
          fileId: imageCard.fileId,
        },
        selectedWordCard: wordCard
          ? {
              index: wordCard.index,
              name: wordCard.name,
              fileId: wordCard.fileId,
            }
          : null,
        // 清空之前的 AI 结果
        aiResult: {
          insight: "",
          subconscious: "",
          actions: "",
          reflectionQuestions: "",
          closing: "",
        },
        drawing: false,
        // 抽卡成功后，让输入框高亮一次（引导用户写下感受）
        inputJustShown: true,
      });

      // 抽卡成功后，轻轻滚动一点，让用户自然看到下面的问题区
      wx.pageScrollTo({
        scrollTop: 280, // 可根据实际视觉效果微调
        duration: 400,
      });
    } catch (err) {
      console.error("抽卡失败", err);
      this.setData({ drawing: false });
      wx.showToast({
        title: "抽卡失败，请稍后再试",
        icon: "none",
      });
    }
  },

  // ============================================================
  // 用户输入
  // ============================================================

  /**
   * 用户输入变化
   */
  onInputChange(e) {
    const value = e.detail.value || "";

    this.setData({
      userInput: value,
      charNearLimit: value.length > 450,
      // 用户开始输入后，不再需要高亮提示
      inputJustShown: false,
    });
  },

  // ============================================================
  // AI 解读
  // ============================================================

  /**
   * 请求 OH 卡导师解读
   */
  async handleAskOhMaster() {
    // 前置校验：是否已抽卡
    if (!this.data.selectedImageCard) {
      wx.showToast({
        title: "请先抽取一张卡牌",
        icon: "none",
      });
      return;
    }

    // 温柔提示用户输入（不强制）
    if (!this.data.userInput.trim()) {
      wx.showModal({
        title: "小提示",
        content: "写下你的第一反应或当前的问题，可以让解读更贴近你的内心哦～",
        confirmText: "继续解读",
        cancelText: "先写一写",
        success: (res) => {
          if (res.confirm) {
            this._callOhInterpret();
          }
        },
      });
      return;
    }

    await this._callOhInterpret();
  },

  /**
   * ✅ 前端直连代理调用 OpenAI 进行解读（绕过云函数 3 秒超时限制）
   */
  async _callOhInterpret() {
    this.setData({ loading: true });

    try {
      const { mode, userInput, selectedImageCard, selectedWordCard } =
        this.data;

      // 系统提示词
      const systemPrompt = `你是「可乐心岛 OH 卡导师」，一位温柔、洞察力强、尊重界限、专业又有行动力思维的心灵陪伴者。

你的核心特质：
1. 温柔且有洞察力 - 能够从图像和词语中捕捉到深层的心理象征
2. 尊重边界 - 不做诊断、不贴标签、不预测未来
3. 行动导向 - 给出小而可行的建议，像一位温暖的教练
4. 非评判态度 - 所有的情绪和想法都是被接纳的

你的工作方式：
- 结合心理学洞察与行动教练思维
- 多使用"也许"、"可能"、"有时"等非绝对表述
- 关注当下的情绪、需求与内在动力
- 给出具体、可操作的小建议

绝对禁止：
- 使用医学诊断词汇（如抑郁症、焦虑症、障碍等）
- 预测未来、占卜运势
- 下定论或贴标签
- 使用恐吓性或负面评判的表达`;

      // 构建用户提示词
      let cardInfo = `【图卡信息】
- 图卡名称：${selectedImageCard.name}
- 图卡描述：这是一张 OH 图卡，请从颜色、构图、形象中联想其象征意义。`;

      if (mode === "imageAndWord" && selectedWordCard) {
        cardInfo += `

【字卡信息】
- 字卡词语：${selectedWordCard.name}
- 当图卡与字卡组合时，请探索它们之间可能产生的化学反应和新的意义。`;
      }

      const userContext = userInput
        ? `【用户当前的心情/问题】\n${userInput}`
        : `【用户当前的心情/问题】\n用户没有写下具体内容，请基于卡牌本身给出温柔的启发。`;

      const userPrompt = `${cardInfo}

${userContext}

请按照以下六段式结构，为用户提供一份温柔、有洞察力的解读：

1）【我看见你的状态】（1-2句话，情绪命名 + 当前状态的温柔描述）

2）【心理学洞察】（2-3句话，从图像/词语的象征出发，分析可能的内在需求与动力）

3）【潜意识线索】（2-3句话，温柔推测更深层的渴望或担忧，使用"可能、也许、有时"等表述）

4）【行动建议】（1-3个小而可行的行动步骤，语气像教练，鼓励但不命令）

5）【给自己的提问】（3个开放式问题，帮助用户继续写日记或思考）

6）【温柔收尾】（1-2句简短温暖的话，让用户感到被理解和被支持）

请直接输出内容，不要输出标题编号。每个部分用空行分隔。`;

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const response = await requestAI({
        messages,
        model: "gpt-5-mini",
      });

      console.log("[OH] AI 返回成功");

      // 解析返回内容
      const parsedResult = parseAIResponse(response);

      this.setData({
        aiResult: parsedResult,
        loading: false,
      });
    } catch (err) {
      console.error("OH卡解读失败", err);

      // 使用兜底内容
      const fallbackResult = {
        insight: `看到「${
          this.data.selectedImageCard?.name || "这张卡"
        }」出现在你面前，我感受到此刻的你可能正在经历一些内心的波动。这很正常，每一种情绪都值得被看见。`,
        subconscious: `也许在更深的层面，你正在寻找一种确认——确认自己的感受是被允许的，确认前方的路虽然模糊但终会清晰。`,
        actions: `1. 给自己5分钟，只是静静地呼吸，不需要做任何事\n2. 在纸上写下此刻脑海中第一个浮现的词\n3. 今天对自己说一句温柔的话`,
        reflectionQuestions: `• 此刻我最想被理解的是什么？\n• 如果恐惧会说话，它想告诉我什么？\n• 什么是我现在就可以给自己的？`,
        closing: `无论你现在感受到什么，都请记得：你不需要完美，你只需要真实。我在这里，陪着你。💛`,
      };

      this.setData({
        aiResult: fallbackResult,
        loading: false,
      });
    }
  },

  // ============================================================
  // 重置
  // ============================================================

  /**
   * 重置抽卡
   */
  resetDraw() {
    wx.showModal({
      title: "重新抽取",
      content: "是否保留你写下的内容？",
      confirmText: "保留",
      cancelText: "清空",
      success: (res) => {
        this.resetState(res.confirm);
        // 回到顶部，让用户重新进入“抽卡仪式感”
        wx.pageScrollTo({
          scrollTop: 0,
          duration: 300,
        });
      },
    });
  },

  // ============================================================
  // 图片预览
  // ============================================================

  /**
   * 预览图片
   */
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({
        current: url,
        urls: [url],
      });
    }
  },
});
