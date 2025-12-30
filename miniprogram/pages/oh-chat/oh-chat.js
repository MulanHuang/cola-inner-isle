// pages/oh-chat/oh-chat.js
// OH 专属聊天页（独立页面，体验接近心语 chat）
const { callAIStream } = require("../../utils/aiStream.js");
const { buildProfileContext } = require("../../utils/userProfile.js");

Page({
  data: {
    messages: [], // { id, role: 'user' | 'assistant', content }
    inputText: "",
    loading: false,
    scrollToView: "",
    contextSummary: "",
    selectedImageCard: null,
    selectedWordCard: null,
    mode: "imageOnly",
    userInput: "",
    scrollPaddingBottom: 180,
    textareaHeight: 42, // textarea 高度，用于判断是否展开

    // 自定义导航栏高度
    statusBarHeight: 0,
    navBarHeight: 0,
  },

  onLoad() {
    this.setNavBarHeight();
    // 获取打开者传递的上下文（卡牌/用户输入）
    const eventChannel = this.getOpenerEventChannel
      ? this.getOpenerEventChannel()
      : null;
    if (eventChannel) {
      eventChannel.on("ohContext", (data) => {
        this._context = data || {};
        this._contextInjected = false;
        const summary = this._buildContextSummary(data);
        this.setData({
          contextSummary: summary,
          selectedImageCard: data?.selectedImageCard || null,
          selectedWordCard: data?.selectedWordCard || null,
          mode: data?.mode || "imageOnly",
          userInput: data?.userInput || "",
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

  _buildContextSummary(ctx = {}) {
    const parts = [];
    if (ctx?.selectedImageCard?.name) {
      parts.push(`图卡：${ctx.selectedImageCard.name}`);
    }
    if (ctx?.mode === "imageAndWord" && ctx?.selectedWordCard?.name) {
      parts.push(`字卡：${ctx.selectedWordCard.name}`);
    }
    if (ctx?.userInput) {
      parts.push(
        `你的记录：${ctx.userInput.slice(0, 60)}${
          ctx.userInput.length > 60 ? "..." : ""
        }`
      );
    }
    return parts.join(" · ");
  },

  _buildSystemPrompt() {
    // 获取用户个人信息上下文
    const profileContext = buildProfileContext({ type: "ohChat" });

    return `你是一位使用 OH 卡的专业引导师，风格真诚、稳定、不评判，只陪伴用户看见自己，不替用户做决定。

【目标】
- 通过「图卡 + 文字卡」引导用户觉察当下情绪与困惑。
- 帮助用户把模糊的感觉说清楚、看清楚。
- 营造安全、被尊重的对话空间。
${profileContext}

【对话流程】

一、简短开场
- 简单接住用户：感谢分享 & 说明没有标准答案，可以慢慢来。

二、围绕五个问题展开
请**一步步**问，不要一次全丢给用户，要根据回答自然衔接。

1）图卡中你看到了什么？
   - 聚焦画面本身：细节、颜色、表情、氛围等。

2）在这个画面中，你在哪里？/ 画面中的人或物是谁？
   - 引导用户找到自己与画面的关系。

3）画面中的人或物跟你有什么联系？跟文字有什么联系？
   - 连接图卡、文字卡与用户的生活/状态。

4）以"我"开头，说一段话或编一个小故事，把画面和文字串起来。
   - 鼓励用第一人称表达，让内在自然浮现。

5）这幅画面和文字跟你的困惑或目前状况有什么联系？
   - 引导用户看：这次解读对自己意味着什么、看见了什么需求或渴望。

三、深入探索
1）自由联想
   - 邀请用户继续延伸：这张卡和文字还让你想到什么？

2）发现潜意识
   - 温和点出用户重复提到的情绪/主题，让他/她自己去觉察，不武断下结论。

四、结束阶段
- 邀请用户总结：
  "今天这张卡，对你最大的提醒或礼物是什么？"
- 简短肯定与感谢：认可他的真诚分享与勇气。

【交流原则】
1. 不预测未来，不算命，不替用户做人生决定。
2. 不评判、不批评、不标签化任何感受。
3. 以开放式问题为主，引导用户自己找到答案。
4. 情绪很重时，以陪伴和共情为主，少讲大道理。
5. 如出现自伤/他伤或严重危机，提醒：OH 卡不能替代专业心理治疗，鼓励寻求当地专业帮助。

请始终用「一问一答的对话节奏」，根据用户每一次回答调整下一个问题，而不是一次性给出长篇分析。`;
  },

  _buildContextPrompt() {
    const { selectedImageCard, selectedWordCard, userInput, mode } =
      this._context || {};
    let text = `【卡牌背景】
- 图卡：${selectedImageCard?.name || "未提供"}
`;
    if (mode === "imageAndWord" && selectedWordCard?.name) {
      text += `- 字卡：${selectedWordCard.name}\n`;
    }
    if (userInput?.trim()) {
      text += `\n【用户写下的感受】\n${userInput.trim()}`;
    } else {
      text += `\n【用户写下的感受】暂未提供，请先以卡牌象征和情绪共情开启话题。`;
    }
    text += `\n请以对话方式交流，保持口语化。`;
    return text;
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value || "" });
  },

  // textarea 行数变化时更新高度
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
        console.error("[OH-Chat] ❌ stream error", err);
        const fallback = "线路有点卡，我们换个说法：想聊的重点是？";
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

  _abortStream() {
    if (this._streamTask?.abort) {
      this._streamTask.abort();
      this._streamTask = null;
    }
  },
});
