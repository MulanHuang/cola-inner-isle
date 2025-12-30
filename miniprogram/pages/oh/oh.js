// pages/oh/oh.js
// ============================================================
// OH卡自我探索页面 - 逻辑与状态管理（终极冥想疗愈版）
// 模式: imageOnly（自由图卡）| imageAndWord（图卡+字卡）
// 🔥 已升级为流式输出，用户可在 0.2 秒内看到字符开始出现
// ============================================================

const db = wx.cloud.database();

// 引入公共工具模块
const { callAIStream } = require("../../utils/aiStream.js");
const { buildProfileContext } = require("../../utils/userProfile.js");
const { getTempUrlWithCache } = require("../../utils/cloudUrlCache.js");
const { setNavBarHeight } = require("../../utils/common.js");

// 解析 AI 返回的六段式内容
function parseAIResponse(content) {
  const stripLeadingLabel = (text = "") => {
    const labels = [
      "我看见你的状态",
      "心理学洞察",
      "潜意识线索",
      "行动建议",
      "给自己的提问",
      "温柔收尾",
    ];
    let cleaned = text.trim();
    labels.forEach((label) => {
      const pattern = new RegExp(
        `^\\s*(【?${label}】?|${label}[：:])\\s*`,
        "i"
      );
      cleaned = cleaned.replace(pattern, "");
    });
    return cleaned.trim();
  };

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
    insight:
      stripLeadingLabel(sections[0]) +
      (sections[1] ? "\n\n" + stripLeadingLabel(sections[1]) : ""),
    subconscious: stripLeadingLabel(sections[2]) || "",
    actions: stripLeadingLabel(sections[3]) || "",
    reflectionQuestions: stripLeadingLabel(sections[4]) || "",
    closing: stripLeadingLabel(sections[5]) || "",
  };
}

// 将文本拆分为段落数组，便于前端规整排版
function toParagraphs(text = "") {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function formatResultForDisplay(result) {
  return {
    insight: toParagraphs(result.insight),
    subconscious: toParagraphs(result.subconscious),
    actions: toParagraphs(result.actions),
    reflectionQuestions: toParagraphs(result.reflectionQuestions),
    closing: toParagraphs(result.closing),
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
    formattedResult: {
      insight: [],
      subconscious: [],
      actions: [],
      reflectionQuestions: [],
      closing: [],
    },

    // OH卡背面图片（牌堆展示用）
    backImage: OH_CARD_BACK_IMAGE,

    // 字数接近上限提示
    charNearLimit: false,

    // 抽到卡之后，输入框高亮一次（配合 WXSS 的 just-drawn 动画）
    inputJustShown: false,

    // 卡牌翻转动画开关
    cardFlipActive: false,

    // OH 聊天
    chatMessages: [], // { id, role: "user" | "assistant", content }
    chatInput: "",
    chatLoading: false,
    chatScrollTo: "",
    chatInputFocus: false,
    showInlineChat: false, // 新方案：跳转外部 OH 聊天页面

    // 自定义导航栏高度
    statusBarHeight: 0,
    navBarHeight: 0,
  },

  // ============================================================
  // 生命周期
  // ============================================================

  onLoad() {
    this.initNavBarHeight();
    // 初始化时重置状态（不保留输入内容）
    this.resetState(false);
    // 🖼️ 将卡背图片 cloud:// 转换为临时 URL（解决体验版图片不显示问题）
    this.convertBackImageUrl();
  },

  // 🖼️ 将 OH 卡背面图片的 cloud:// 路径转换为临时 URL（使用智能缓存）
  async convertBackImageUrl() {
    const cloudUrl = this.data.backImage;
    if (!cloudUrl || !cloudUrl.startsWith("cloud://")) return;

    // 先尝试从 App 预加载缓存获取
    const app = getApp();
    const preloaded = app.globalData.preloadedImages?.[cloudUrl];
    if (preloaded) {
      console.log("[oh] ✅ 使用App预加载的卡背URL");
      this.setData({ backImage: preloaded });
      return;
    }

    try {
      console.log("[oh] 🖼️ 转换卡背临时URL...");
      // 使用智能缓存工具（自动缓存1.5小时）
      const tempUrl = await getTempUrlWithCache(cloudUrl);
      if (tempUrl && tempUrl !== cloudUrl) {
        this.setData({ backImage: tempUrl });
        console.log("[oh] ✅ 卡背临时URL转换成功");
      }
    } catch (err) {
      console.warn("[oh] ⚠️ 卡背URL转换失败:", err.message);
    }
  },

  onUnload() {
    if (this._cardFlipTimer) {
      clearTimeout(this._cardFlipTimer);
    }
    if (this._currentStreamTask?.abort) {
      this._currentStreamTask.abort();
    }
    this.stopChatStream();
  },

  handleBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: "/pages/home/home" });
    }
  },

  // 设置导航栏高度（使用公共模块）
  initNavBarHeight() {
    setNavBarHeight(this);
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
      formattedResult: {
        insight: [],
        subconscious: [],
        actions: [],
        reflectionQuestions: [],
        closing: [],
      },
      userInput: keptText,
      charNearLimit: keptText.length > 450,
      inputJustShown: false,
      drawing: false,
      loading: false,
      cardFlipActive: false,
      chatMessages: [],
      chatInput: "",
      chatLoading: false,
      chatScrollTo: "",
      chatInputFocus: false,
    });
    this.stopChatStream();
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

    // 轻微振动反馈
    wx.vibrateShort({ type: "light" });

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

    // 🎴 长振动，营造抽卡仪式感
    wx.vibrateLong();

    this.setData({ drawing: true, cardFlipActive: false });

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

      // 🚀 立即预加载图卡图片，让显示时图片已在缓存中
      if (imageCard.fileId) {
        wx.getImageInfo({
          src: imageCard.fileId,
          success: () => console.log("[OH] ✅ 预加载图卡:", imageCard.name),
          fail: () => console.warn("[OH] ⚠️ 图卡预加载失败:", imageCard.name),
        });
      }

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
        cardFlipActive: false,
      });

      this.triggerCardFlip();

      // ✨ 抽卡成功后再次振动，给用户"抽到了！"的惊喜感
      wx.vibrateShort({ type: "heavy" });

      // 抽卡成功后，直接滚动到卡片展示+输入区
      wx.pageScrollTo({
        selector: "#ohResultSection",
        duration: 400,
        fail: () => {
          // 兼容低版本，回退为固定距离滚动
          wx.pageScrollTo({ scrollTop: 320, duration: 400 });
        },
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

  /**
   * 触发卡牌翻转动画
   */
  triggerCardFlip() {
    if (this._cardFlipTimer) {
      clearTimeout(this._cardFlipTimer);
    }
    this._cardFlipTimer = setTimeout(() => {
      this.setData({ cardFlipActive: true });
    }, 40);
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

    // 中等振动反馈
    wx.vibrateShort({ type: "medium" });

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
   * ✅ 前端直连代理调用 OpenAI 进行解读（流式输出）
   */
  _callOhInterpret() {
    this.setData({
      loading: true,
      aiResult: {
        insight: "",
        subconscious: "",
        actions: "",
        reflectionQuestions: "",
        closing: "",
      },
      formattedResult: {
        insight: [],
        subconscious: [],
        actions: [],
        reflectionQuestions: [],
        closing: [],
      },
      streamingText: "",
    });

    const { mode, userInput, selectedImageCard, selectedWordCard } = this.data;

    // 获取用户个人信息上下文
    const profileContext = buildProfileContext({ type: "ohCard" });

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
${profileContext}

绝对禁止：
- 使用医学诊断词汇（如抑郁症、焦虑症、障碍等）
- 预测未来、占卜运势
- 下定论或贴标签
- 使用恐吓性或负面评判的表达
- 段落正文不要重复小标题的词汇（如“行动建议”“潜意识线索”等），直接进入内容，避免以这些词开头`;

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

    console.log("[OH] 🔥 开始流式请求");

    // 🔥 使用流式调用
    this._currentStreamTask = callAIStream({
      messages,
      model: "gpt-5-mini",
      onChunk: (chunk, fullText) => {
        // 🔥 实时解析并更新 aiResult，让用户边接收边看到内容
        const parsedResult = parseAIResponse(fullText);
        this.setData({
          aiResult: parsedResult,
          formattedResult: formatResultForDisplay(parsedResult),
          streamingText: fullText,
        });
      },
      onComplete: (fullText) => {
        console.log("[OH] ✅ 流式输出完成");
        // 最终解析返回内容
        const parsedResult = parseAIResponse(fullText);
        this.setData({
          aiResult: parsedResult,
          formattedResult: formatResultForDisplay(parsedResult),
          loading: false,
          streamingText: "",
        });
        this._currentStreamTask = null;
      },
      onError: (err) => {
        console.error("[OH] ❌ OH卡解读失败:", err.message);
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
          formattedResult: formatResultForDisplay(fallbackResult),
          loading: false,
          streamingText: "",
        });
        this._currentStreamTask = null;
      },
    });
  },

  // ============================================================
  // OH 聊天（借鉴心语 AI chat）
  // ============================================================

  onChatInputChange(e) {
    const value = e.detail.value || "";
    this.setData({ chatInput: value });
  },

  scrollChatToBottom(targetId = "chat_bottom") {
    // 先清空再设置，确保 scroll-into-view 被触发
    this.setData({ chatScrollTo: "" }, () => {
      this.setData({ chatScrollTo: targetId });
    });
  },

  focusChatArea() {
    // 兼容旧函数命名，实际跳转到独立聊天页面
    this.goToOhChatPage();
  },

  goToOhChatPage() {
    // 轻微振动反馈
    wx.vibrateShort({ type: "light" });

    const { selectedImageCard, selectedWordCard, userInput, mode } = this.data;
    wx.navigateTo({
      url: "/pages/oh-chat/oh-chat",
      success: (res) => {
        try {
          res.eventChannel?.emit("ohContext", {
            selectedImageCard,
            selectedWordCard,
            userInput,
            mode,
          });
        } catch (e) {
          console.warn("传递 OH 聊天上下文失败", e);
        }
      },
    });
  },

  stopChatStream() {
    if (this._currentChatStreamTask?.abort) {
      this._currentChatStreamTask.abort();
    }
    this._currentChatStreamTask = null;
    this._currentChatAssistantId = null;
  },

  _buildChatSystemPrompt() {
    return `你是「可乐心岛 OH 卡导师」，一位温柔且有洞察力的陪伴者。你和用户会围绕当前抽到的卡牌进行对话，先承接情绪，再给出温柔的联想与行动启发。

对话风格：
- 口语化、自然，像在和朋友聊天
- 先共情、再联想象征意义，保持不确定性（使用“可能/也许/有时候”）
- 适度给出可执行的小行动或反思问题，但不命令

边界与安全：
- 不做诊断、不贴标签、不预测未来
- 不使用恐吓性语言，不讨论医疗或临床建议
- 字数保持 150-220 字，分成 1-2 段自然口语，不要编号标题。`;
  },

  _buildChatContextMessage() {
    const { mode, selectedImageCard, selectedWordCard, userInput } = this.data;
    let context = `【卡牌背景】
- 图卡：${selectedImageCard?.name || "未提供名称"}${
      selectedImageCard?.fileId ? "（用户正在看这张图卡）" : ""
    }`;

    if (mode === "imageAndWord" && selectedWordCard) {
      context += `\n- 字卡：${selectedWordCard.name}（图+字的化学反应值得被提及）`;
    }

    context += `\n\n【用户写下的线索】\n${
      userInput?.trim()
        ? userInput.trim()
        : "用户暂未写下具体感受，请先以卡牌象征和情绪承接开启对话。"
    }`;
    return context;
  },

  async sendOhChat() {
    if (this.data.chatLoading) return;

    if (!this.data.selectedImageCard) {
      wx.showToast({ title: "请先抽一张卡牌", icon: "none" });
      return;
    }

    const text = (this.data.chatInput || "").trim();
    if (!text) {
      wx.showToast({ title: "先说点什么吧~", icon: "none" });
      return;
    }

    // 准备消息列表
    const userMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
    };
    const existingMessages = this.data.chatMessages || [];
    const updatedMessages = [...existingMessages, userMessage];
    const assistantId = `a_${Date.now()}`;
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    // 停掉可能存在的旧流
    this.stopChatStream();

    this.setData(
      {
        chatMessages: [...updatedMessages, assistantMessage],
        chatInput: "",
        chatLoading: true,
        chatInputFocus: false,
      },
      () => this.scrollChatToBottom(`chat_${assistantId}`)
    );

    const historyForAI = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const messages = [
      { role: "system", content: this._buildChatSystemPrompt() },
    ];

    // 仅在首次聊天时附带卡牌背景，避免重复赘述
    if (existingMessages.length === 0) {
      messages.push({ role: "user", content: this._buildChatContextMessage() });
    }

    messages.push(...historyForAI);

    this._currentChatAssistantId = assistantId;

    this._currentChatStreamTask = callAIStream({
      messages,
      model: "gpt-5-mini",
      onChunk: (chunk, fullText) => {
        this._updateAssistantMessage(assistantId, fullText || "");
      },
      onComplete: (fullText) => {
        this._updateAssistantMessage(assistantId, fullText || "");
        this.setData({ chatLoading: false }, () =>
          this.scrollChatToBottom(`chat_${assistantId}`)
        );
        this._currentChatStreamTask = null;
      },
      onError: (err) => {
        console.error("[OH] ❌ OH chat 失败:", err.message);
        const fallback =
          "线路有点不稳，我先把卡牌带给我的第一感写给你：这张卡像是在提醒你留意此刻的感受。我们可以再聊聊细节。";
        this._updateAssistantMessage(assistantId, fallback);
        this.setData({ chatLoading: false }, () =>
          this.scrollChatToBottom(`chat_${assistantId}`)
        );
        this._currentChatStreamTask = null;
      },
    });
  },

  _updateAssistantMessage(assistantId, content) {
    const updated = (this.data.chatMessages || []).map((msg) =>
      msg.id === assistantId ? { ...msg, content } : msg
    );
    this.setData({
      chatMessages: updated,
      chatScrollTo: `chat_${assistantId}`,
    });
  },

  // ============================================================
  // 重置
  // ============================================================

  /**
   * 重置抽卡
   */
  resetDraw() {
    // 轻微振动反馈
    wx.vibrateShort({ type: "light" });

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
