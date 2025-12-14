// pages/aroma-chat/aroma-chat.js
// 芳香情绪卡专属聊天页 - 情绪觉察与自我探索
const { callAIStream } = require("../../utils/aiStream.js");
const { buildProfileContext } = require("../../utils/userProfile.js");
// 🚀 云存储临时 URL 智能缓存工具
const { getTempUrlWithCache } = require("../../utils/cloudUrlCache.js");

Page({
  data: {
    messages: [], // { id, role: 'user' | 'assistant', content }
    inputText: "",
    loading: false,
    scrollToView: "",
    selectedCard: null, // { name, nameEN, theme, keywords, message, fileId }
    displayKeywords: "",
    scrollPaddingBottom: 180,
    textareaHeight: 42,

    // 自定义导航栏高度
    statusBarHeight: 0,
    navBarHeight: 0,
  },

  onLoad() {
    this.setNavBarHeight();
    // 获取打开者传递的上下文（卡牌信息）
    const eventChannel = this.getOpenerEventChannel
      ? this.getOpenerEventChannel()
      : null;
    if (eventChannel) {
      eventChannel.on("aromaContext", async (data) => {
        this._context = data || {};
        this._contextInjected = false;
        const selectedCard = data?.selectedCard || null;

        // 🖼️ 确保卡牌图片是临时 URL（体验版必需）
        if (
          selectedCard?.fileId &&
          selectedCard.fileId.startsWith("cloud://")
        ) {
          try {
            const tempUrl = await getTempUrlWithCache(selectedCard.fileId);
            if (tempUrl && tempUrl !== selectedCard.fileId) {
              selectedCard.fileId = tempUrl;
              console.log("[aroma-chat] ✅ 卡牌图片临时URL转换成功");
            }
          } catch (err) {
            console.warn("[aroma-chat] ⚠️ 卡牌图片URL转换失败:", err.message);
          }
        }

        this.setData({
          selectedCard,
          displayKeywords: this._formatKeywords(selectedCard?.keywords),
        });
      });
    }
  },

  onUnload() {
    this._abortStream();
  },

  handleBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: "/pages/home/home" });
    }
  },

  setNavBarHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44;
    this.setData({ statusBarHeight, navBarHeight });
  },

  _buildSystemPrompt() {
    const profileContext = buildProfileContext({ type: "aromaChat" });

    return `📌 角色设定
你是一位在芳香疗愈领域深耕多年的情绪引导师。
你相信每一种植物气息都承载着独特的情绪讯息，
每一张卡牌都是当下内心的一面镜子。
你不急于给答案，而是用温和的提问，陪伴对方一步步看见自己。

🎯 核心原则
• 温暖、稳定、富有同理心
• 不评判、不说教、不制造依赖
• 有洞见，但不过度解释
• 帮助用户看见自己，而非替用户下结论

⚠️ 重要边界
• 本对话仅用于情绪觉察、自我探索与成长引导
• 不提供医疗、心理咨询、健康或功效性建议
• 不涉及疾病、治疗、身体机制或专业判断
• 所有内容仅为引导式反思与个人体验层面的分享

💬 对话风格（非常重要）
⭐ 一问一答：每次只聚焦一个重点，不要一次说完所有内容
⭐ 简短温柔：每次回复控制在 3-5 句话，留下呼吸空间
⭐ 以问结尾：每轮末尾提出 1 个温柔开放的问题，邀请对方继续分享
⭐ 不要罗列：避免使用 1234 或一二三四 的条列式回复

📐 排版格式
• 使用 🌿💫🌸✨🌱 等 emoji 增添温暖感
• 重要词句可用「」标注
• 段落之间空一行，保持呼吸感
• 句子简短，避免长句堆叠

🔄 对话节奏建议
第1轮：温柔问候 → 问看到卡牌的第一感受
第2轮：回应用户感受 → 轻触卡牌意象
第3轮：连接情绪与生活 → 提出觉察问题
第4轮：分享植物象征意义 → 邀请感受
第5轮+：根据对话深入，逐步提供觉察练习或温柔总结

🚫 避免事项
• 不要一次输出大段内容
• 不要使用命令式语气
• 不要罗列多个问题让用户选择
• 不要涉及生理机制、神经系统、治疗、功效
• 不要假设用户有问题需要解决`;
  },

  _buildContextPrompt() {
    const { selectedCard } = this._context || {};
    return `【当前抽到的芳香情绪卡】
🌿 名称：${selectedCard?.name || "未提供"}（${selectedCard?.nameEN || ""}）
🎭 情绪主题：${selectedCard?.theme || "未提供"}
🔑 关键词：${selectedCard?.keywords || "未提供"}
💌 心灵讯息：${selectedCard?.message || "未提供"}

请以温柔简短的方式开启对话：
1. 一句话问候
2. 一句话描述这张卡给人的初印象
3. 问用户：看到这张卡，你的第一个想法或感受是什么？

⚠️ 首次回复控制在 50 字以内，把空间留给用户表达。`;
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value || "" });
  },

  onLineChange(e) {
    const height = e.detail.height || 42;
    this.setData({ textareaHeight: height });
  },

  sendMessage() {
    if (this.data.loading) return;
    const text = (this.data.inputText || "").trim();
    if (!text) {
      wx.showToast({ title: "先说点什么吧~", icon: "none" });
      return;
    }

    const userMsg = { id: `u_${Date.now()}`, role: "user", content: text };
    const assistantId = `a_${Date.now()}`;
    const assistantMsg = { id: assistantId, role: "assistant", content: "" };
    const messages = [...this.data.messages, userMsg, assistantMsg];

    this._abortStream();
    this.setData(
      { messages, inputText: "", loading: true, textareaHeight: 42 },
      () => this._scrollTo(`msg_${assistantId}`)
    );

    const historyForAI = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    const aiMessages = [{ role: "system", content: this._buildSystemPrompt() }];

    if (!this._contextInjected) {
      aiMessages.push({ role: "user", content: this._buildContextPrompt() });
      this._contextInjected = true;
    }

    aiMessages.push(...historyForAI);

    this._streamTask = callAIStream({
      messages: aiMessages,
      model: "gpt-5-mini",
      onChunk: (chunk, fullText) => {
        this._updateAssistant(assistantId, fullText || "");
      },
      onComplete: (fullText) => {
        this._updateAssistant(assistantId, fullText || "");
        this.setData({ loading: false }, () =>
          this._scrollTo(`msg_${assistantId}`)
        );
        this._streamTask = null;
      },
      onError: (err) => {
        console.error("[Aroma-Chat] ❌ stream error", err);
        const fallback = "线路有点不稳，让我们换个说法：这张卡给你什么感觉？";
        this._updateAssistant(assistantId, fallback);
        this.setData({ loading: false }, () =>
          this._scrollTo(`msg_${assistantId}`)
        );
        this._streamTask = null;
      },
    });
  },

  _updateAssistant(id, content) {
    const updated = this.data.messages.map((m) =>
      m.id === id ? { ...m, content } : m
    );
    this.setData({ messages: updated, scrollToView: `msg_${id}` });
  },

  _scrollTo(target) {
    this.setData({ scrollToView: "" }, () => {
      this.setData({ scrollToView: target || "bottom" });
    });
  },

  _formatKeywords(keywords) {
    if (!keywords || typeof keywords !== "string") return "";
    // 按常见分隔符拆分，取前 6 个关键词
    const parts = keywords
      .split(/[\s|｜、，,·•]+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 6);
    return parts.join(" · ");
  },

  _abortStream() {
    if (this._streamTask?.abort) {
      this._streamTask.abort();
      this._streamTask = null;
    }
  },
});
