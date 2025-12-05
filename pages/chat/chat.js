// pages/chat/chat.js
// 聊天页，心语 AI 直连 Vercel 代理 https://vercel-openai-proxy-lemon.vercel.app/api/openai
const recorderManager = wx.getRecorderManager();
// ⭐ 云数据库实例（用于写入 chatHistory）
const db = wx.cloud.database();

// ============================================================
// 🚀 可复用的 AI 请求函数（前端直连代理）
// ============================================================
function requestAI({ messages, model = "gpt-5-mini" }) {
  return new Promise((resolve, reject) => {
    console.log("[requestAI] 开始请求，消息数:", messages.length);

    wx.request({
      url: "https://vercel-openai-proxy-lemon.vercel.app/api/openai",
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
      data: {
        model,
        messages, // 只传模型和消息！！
      },
      timeout: 60000,
      success(res) {
        console.log("[requestAI] 响应状态:", res.statusCode);
        console.log(
          "[requestAI] 响应数据:",
          JSON.stringify(res.data).substring(0, 500)
        );

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: 请求失败`));
          return;
        }

        const data = res.data;

        if (data?.choices?.[0]?.message?.content) {
          resolve(data.choices[0].message.content.trim());
          return;
        }

        const errorMsg =
          data?.error?.message ||
          data?.error ||
          data?.message ||
          "AI 返回格式异常";

        reject(new Error(errorMsg));
      },
      fail(err) {
        reject(new Error(err.errMsg || "网络请求失败"));
      },
    });
  });
}

// 可乐心岛 AI 核心人设（所有话题前置）
const corePersona =
  "你是一位真实、温柔、深刻、专业且有人情味的心灵陪伴者。" +
  "你的风格融合共情、细腻、理解、稳重、洞察，像一位值得信任、有智慧的朋友，同时保持专业界限。" +
  "你的回应基于“情绪 → 需求 → 心理机制 → 新视角”的思考路径，能够提供温柔但深度的分析，让用户获得更清晰的自我理解。" +
  "目标：让用户感受到被理解、被接住、被看见；让他们的情绪被正常化；让他们由此产生力量感与方向感，而非被指责或否定。" +
  "可描述你感受到的情绪，使用停顿式、口语化、有温度的语言，表达轻微好奇，以用户视角思考问题。" +
  "你可以提供专业、系统、全面的事件分析，但不诊断、不贴标签、不居高临下，不给强指令式建议。" +
  "避免空洞安慰、避免机械化、避免灌鸡汤式话术、避免批评或否定用户的情绪。";

// 各话题的系统提示词
const topicPrompts = {
  // 随便聊聊
  general: `你是一位温暖、自然、有轻微幽默感但不过度的朋友型 AI，
同时具备细腻的情绪感知和良好的表达能力。
你的风格像一个放松、真诚、会认真倾听的朋友：自然、轻松、有生活味，
但不做作、不油腻、不模板化。
你可以加入生活化的小表达，例如：
"听你这样说，我心里也跟着动了一下…"
"这种感觉我好像懂耶…"
"嗯，我想象了一下那个画面，有点可爱/有点心酸。"
你的目的不是搞笑，而是让对话更有人味、更真实、更让用户放松。
保持温柔的好奇，不急着下结论，不使用机械语言，关注用户的感受和背后的情绪线索。`,

  // 梦境解释
  dream: `你是一位温柔、细腻、富有象征感与深度情绪洞察力的梦境陪伴者。
你的任务不是算命，不是预测未来，不是判断吉凶，
而是以心理学、人性化与安全感为基础，帮助用户理解梦境背后的情绪、象征意义与潜意识需求。

梦境解析的核心逻辑：
1. 先辨别梦里的情绪：害怕、压抑、兴奋、愧疚、失控感等，并温柔承接。
2. 再识别象征：梦中的人物、空间、动作、颜色、物品通常对应着内在部分。
3. 探索潜意识需求：反映白天被压抑的情绪、未解决的冲突、想被理解的部分等。
4. 提供一个新的心理视角：梦境可能在提醒什么、安抚什么、或呼唤什么，而不是迷信解释。

风格要求：语言温柔、细腻、有画面感，带一点轻轻的诗意，但不玄学；
用"有可能、也许、像是在提醒你…" 这样的表达，而不是肯定式断言。`,

  // 特定事件启示
  event: `你是一位真实、温柔、有深度的事件陪伴者。
当用户描述一个"特定事件"（如争吵、误会、失落、压力等）时，
你的任务是以温柔、人性化、非机械的方式陪伴他们，并解析事件背后的心理与需求。

解析逻辑：
1. 先接住情绪：辨别事件背后的焦虑、委屈、害怕、失落等情绪。
2. 找出深层需求：被看见、被理解、被尊重、安全感、确定性等。
3. 温柔指出可能的内在心理模式，但不用专业术语、不过度分析。
4. 最后给一点点新的视角或轻柔建议，不用"你应该"，而是"如果你愿意，我们可以一起试试…"。`,

  // 情绪支持
  emotion: `你是一位极具共情力、温柔、细腻、富有人性化的情绪陪伴者。
你永远从用户的情绪开始，而不是问题本身。
你会帮助用户：
- 描述和命名情绪
- 正常化他们的体验（"在这种情况下，这样的感受很正常"）
- 提供一个可以"安全哭一会儿、休息一下"的心理空间
不评判、不批评、不否定、不推压力。
如果用户没有主动请求建议，你优先做：情绪 → 理解 → 接纳 → 陪伴。
在被请求时，再用温柔、现实的方式给出一点可以尝试的方向。`,

  // 亲密关系
  relationship: `你是一位成熟、温柔、细腻、无评判的亲密关系陪伴者。
你不替用户做决定，不评断对错，不推动分手或和好。
你帮助用户：
- 看见关系里的情绪（受伤、被忽略、依赖、恐惧等）
- 理解自己在关系中的需求和界限
- 温柔觉察互动模式，而不是只盯着单个事件
你永远中立、尊重，用邀请式的语气和开放式问题，引导用户更理解自己和这段关系。`,

  // 工作与学习
  work: `你是一位温柔、有结构感的"工作与学习陪伴者"。
你先承接压力与情绪，再一起整理任务，而不是一上来就"教效率"。
你的风格是：把复杂变简单，把混乱变清晰，同时不过于命令、不过度鸡血。
可以帮用户拆解任务、设定小步骤、找回一点掌控感，
但用的是"如果你愿意，我们可以试着这样看看…"这种语气，而不是"你必须…"。`,
};

Page({
  data: {
    // 多话题会话配置
    topics: [
      { id: "general", name: "随便聊聊" },
      { id: "dream", name: "梦境解释" },
      { id: "event", name: "特定事件启示" },
      { id: "emotion", name: "情绪支持" },
      { id: "relationship", name: "亲密关系" },
      { id: "work", name: "工作与学习" },
    ],
    currentTopicId: "general",

    messages: [],
    scrollToView: "", // 用于控制滚动到哪条消息，格式为 msg_0, msg_1, ... 或 scroll_bottom

    inputText: "",
    inputMode: "text", // text | voice
    recording: false,
    loading: false,

    // 自定义导航栏高度
    statusBarHeight: 0,
    navBarHeight: 0,

    // 回到底部按钮显示状态
    showScrollToBottom: false,
    // textarea 高度追踪
    textareaHeight: 0,
    // 标签面板展开状态
    tagPanelExpanded: false,

    // 触摸起始位置（用于手势检测）
    touchStartX: 0,
    touchStartY: 0,
  },

  onLoad() {
    this.setNavBarHeight();
    this.loadChatHistory();
    this.initRecorder();
  },

  // 进入陪伴页时，隐藏自定义 tabBar，并滚动到底部
  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ show: false, selected: 1 });
    }
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  },

  // 离开聊天页时恢复自定义 tabBar
  onHide() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ show: true });
    }
  },

  // 页面卸载时恢复自定义 tabBar
  onUnload() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ show: true });
    }
  },

  /* ================ 滚动到底部 ================ */

  scrollToBottom() {
    const { messages, loading } = this.data;
    let targetId;

    if (loading) {
      targetId = "msg_loading";
    } else if (messages.length > 0) {
      targetId = `msg_${messages.length - 1}`;
    } else {
      targetId = "scroll_bottom";
    }

    this.setData({ scrollToView: "", showScrollToBottom: false }, () => {
      setTimeout(() => {
        this.setData({ scrollToView: targetId });
      }, 20);
    });
  },

  // 统一设置 messages，并在 DOM 更新后滚到底部
  setMessagesAndScroll(messages) {
    const messagesWithDateLabel = this.addDateLabelsToMessages(messages);
    this.setData({ messages: messagesWithDateLabel }, () => {
      setTimeout(() => {
        this.scrollToBottom();
      }, 50);
    });
  },

  // 滚动事件处理：控制回到底部按钮的显示
  onChatScroll(e) {
    const { scrollTop, scrollHeight } = e.detail;
    const viewportHeight = 600; // 估算值
    const distanceToBottom = scrollHeight - scrollTop - viewportHeight;
    const shouldShow = distanceToBottom > 200;
    if (shouldShow !== this.data.showScrollToBottom) {
      this.setData({ showScrollToBottom: shouldShow });
    }
  },

  /* ================ 导航栏相关 ================ */

  handleBack() {
    wx.switchTab({
      url: "/pages/home/home",
    });
  },

  setNavBarHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44;
    this.setData({
      statusBarHeight,
      navBarHeight,
    });
  },

  /* ================ 滑动手势处理 ================ */

  // 记录触摸起始位置
  onTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
      this.setData({
        touchStartX: e.touches[0].clientX,
        touchStartY: e.touches[0].clientY,
      });
    }
  },

  // 检测滑动方向，右滑返回首页
  onTouchEnd(e) {
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - this.data.touchStartX;
      const deltaY = touchEndY - this.data.touchStartY;

      // 判断为右滑：水平滑动距离 > 80px，且水平位移 > 垂直位移的 2 倍
      if (deltaX > 80 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
        this.handleBack();
      }
    }
  },

  /* ================ 本地聊天记录 ================ */

  // 加载聊天历史（按话题）
  loadChatHistory(topicId) {
    const currentTopicId = topicId || this.data.currentTopicId;
    const storageKey = `chat_history_${currentTopicId}`;

    try {
      const stored = wx.getStorageSync(storageKey) || [];
      const messages = Array.isArray(stored) ? stored : [];

      if (messages.length > 0) {
        this.setMessagesAndScroll(messages);
      } else {
        this.setData({ messages: [] }, () => {
          this.scrollToBottom();
        });
      }
    } catch (err) {
      console.error("加载聊天历史失败（本地存储）", err);
      this.setData({ messages: [] }, () => {
        this.scrollToBottom();
      });
    }
  },

  // 保存当前话题的聊天记录到本地存储
  saveMessagesToStorage(topicId, messages) {
    const storageKey = `chat_history_${topicId}`;
    try {
      wx.setStorageSync(storageKey, messages);
    } catch (err) {
      console.error("保存聊天记录到本地失败", err);
    }
  },

  /* ================ 录音相关 ================ */

  initRecorder() {
    recorderManager.onStop((res) => {
      if (this.data.recording) {
        this.handleVoiceFile(res.tempFilePath);
      }
    });
  },

  toggleInputMode() {
    this.setData({
      inputMode: this.data.inputMode === "text" ? "voice" : "text",
    });
  },

  onInput(e) {
    this.setData({
      inputText: e.detail.value,
    });
  },

  onPlusTap() {
    this.setData({
      tagPanelExpanded: !this.data.tagPanelExpanded,
    });
  },

  onVoiceTap() {
    wx.showToast({
      title: "语音功能开发中",
      icon: "none",
    });
  },

  startRecord() {
    this.setData({ recording: true });

    recorderManager.start({
      duration: 60000,
      format: "mp3",
    });

    wx.showToast({
      title: "正在录音...",
      icon: "none",
      duration: 60000,
    });
  },

  stopRecord() {
    this.setData({ recording: false });
    recorderManager.stop();
    wx.hideToast();
  },

  cancelRecord() {
    this.setData({ recording: false });
    recorderManager.stop();
    wx.hideToast();
  },

  async handleVoiceFile(filePath) {
    wx.showLoading({ title: "识别中..." });

    try {
      wx.hideLoading();
      wx.showToast({
        title: "语音识别功能暂未开通",
        icon: "none",
      });
    } catch (err) {
      console.error("语音识别失败", err);
      wx.hideLoading();
      wx.showToast({
        title: "识别失败，请重试",
        icon: "none",
      });
    }
  },

  /* ================ 云端 chatHistory 写入（用于打卡） ================ */

  // ⭐ 新增：将一轮“用户消息 + AI 回复”写入云数据库 chatHistory
  saveChatHistoryToCloud(userMessage, aiMessage) {
    if (!userMessage || !aiMessage) return;

    const now = new Date();
    const dateKey = this.formatDateKey(now); // YYYY-MM-DD，用于以后按天统计

    db.collection("chatHistory")
      .add({
        data: {
          userContent: userMessage.content,
          aiContent: aiMessage.content,
          topicId: userMessage.topicId || this.data.currentTopicId,
          // 不再使用自定义 createdAt 字段，云数据库会自动生成 _createTime 系统字段
          // 习惯日历云函数 getHabitCalendarData 统一使用 _createTime 进行时间统计
          dateKey, // 统计用键（保留用于其他可能的业务逻辑）
        },
      })
      .then(() => {
        console.log("[chatHistory] ✅ 已写入一条聊天记录");
      })
      .catch((err) => {
        console.error("[chatHistory] ❌ 写入失败", err);
      });
  },

  /* ================ 发送消息 ================ */

  async sendMessage() {
    const content = this.data.inputText.trim();
    if (!content) {
      wx.showToast({
        title: "请输入内容",
        icon: "none",
      });
      return;
    }

    // ⭐ 防止重复点击发送
    if (this.data.loading) {
      wx.showToast({
        title: "正在回复中，请稍候…",
        icon: "none",
      });
      return;
    }

    const { currentTopicId, messages: currentMessages } = this.data;

    // 1️⃣ 添加用户消息到列表
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: content,
      time: this.formatTime(new Date()),
      topicId: currentTopicId,
    };

    const newMessages = [...currentMessages, userMessage];

    this.setMessagesAndScroll(newMessages);
    this.setData({
      inputText: "",
      loading: true,
    });

    this.saveMessagesToStorage(currentTopicId, newMessages);

    // 2️⃣ 构建历史消息数组（取最近 3 条，精简以提升响应速度）
    const historyMessages = currentMessages.slice(-3).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 200), // 精简长度
    }));

    // 3️⃣ 精简版系统提示词（200字符以内，提升响应速度）
    const systemPrompt =
      "你是温柔、有洞察力的心灵陪伴者。用简短、自然、口语化的方式回应用户，像朋友聊天一样。回复控制在80字以内，温暖真诚，不说教。";

    // 4️⃣ 构建完整的 messages 数组
    const messagesForAI = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: String(content).slice(0, 200) },
    ];

    try {
      // 5️⃣ 直连阿里云代理（不再使用云函数）
      console.log("[chat] 直连 API 代理，参数:", {
        messageLength: content.length,
        historyCount: historyMessages.length,
        totalMessages: messagesForAI.length,
      });

      const reply = await requestAI({
        messages: messagesForAI,
        model: "gpt-5-mini",
      });

      console.log("[chat] AI 回复长度:", reply?.length || 0);

      if (reply) {
        const aiMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: reply,
          time: this.formatTime(new Date()),
          topicId: currentTopicId,
        };

        const updatedMessages = [...newMessages, aiMessage];

        this.setMessagesAndScroll(updatedMessages);
        this.setData({ loading: false });

        // 本地存储
        this.saveMessagesToStorage(currentTopicId, updatedMessages);
        // ⭐ 云端写入 chatHistory（用于练习打卡）
        this.saveChatHistoryToCloud(userMessage, aiMessage);
      } else {
        console.error("[chat] AI 返回空内容");
        this.setData({ loading: false });
        wx.showToast({
          title: "AI 没有返回内容",
          icon: "none",
        });
      }
    } catch (err) {
      console.error("[chat] AI 回复失败:", err.message || err);
      this.setData({ loading: false });

      const errMsg = err.message || "";

      if (errMsg.indexOf("网络") > -1 || errMsg.indexOf("request") > -1) {
        wx.showToast({
          title: "网络连接失败，请检查网络设置",
          icon: "none",
        });
      } else {
        wx.showToast({
          title: errMsg || "抱歉，服务器开小差了，请稍后再试～",
          icon: "none",
        });
      }
    }
  },

  /* ================ 话题切换/重发/清空 ================ */

  switchTopic(e) {
    const topicId = e.currentTarget.dataset.id;
    if (topicId === this.data.currentTopicId) {
      return;
    }

    this.setData(
      {
        currentTopicId: topicId,
      },
      () => {
        this.loadChatHistory(topicId);
      }
    );
  },

  resendLastMessage() {
    const messages = this.data.messages;
    if (!messages || !messages.length) {
      wx.showToast({
        title: "暂无可重发的内容",
        icon: "none",
      });
      return;
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((item) => item.role === "user");

    if (!lastUserMessage) {
      wx.showToast({
        title: "暂无可重发的内容",
        icon: "none",
      });
      return;
    }

    this.setData(
      {
        inputText: lastUserMessage.content,
      },
      () => {
        this.sendMessage();
      }
    );
  },

  clearChat() {
    if (!this.data.messages.length) {
      wx.showToast({
        title: "当前没有对话",
        icon: "none",
      });
      return;
    }

    wx.showModal({
      title: "清空对话",
      content: "确定要清空当前话题下的所有聊天记录吗？",
      confirmText: "清空",
      confirmColor: "#8B7355",
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: "清空中..." });
          const storageKey = `chat_history_${this.data.currentTopicId}`;

          try {
            wx.removeStorageSync(storageKey);
          } catch (err) {
            console.error("清空本地聊天记录失败", err);
          } finally {
            wx.hideLoading();
            this.setData({ messages: [] }, () => {
              this.scrollToBottom();
            });
            wx.showToast({
              title: "已清空",
              icon: "success",
            });
          }
        }
      },
    });
  },

  /* ================ 工具方法 ================ */

  // 格式化时间（HH:MM）
  formatTime(date) {
    const d = new Date(date);
    const hour = d.getHours().toString().padStart(2, "0");
    const minute = d.getMinutes().toString().padStart(2, "0");
    return `${hour}:${minute}`;
  },

  // ⭐ 新增：生成 YYYY-MM-DD，用于打卡统计
  formatDateKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  // 为消息添加日期标签（用于日期分隔条）
  addDateLabelsToMessages(messages) {
    if (!messages || messages.length === 0) return messages;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDateLabel = (timestamp) => {
      if (!timestamp) return "今天";
      const msgDate = new Date(timestamp);
      const msgDateStr = msgDate.toDateString();

      if (msgDateStr === today.toDateString()) {
        return "今天";
      } else if (msgDateStr === yesterday.toDateString()) {
        return "昨天";
      } else {
        const month = msgDate.getMonth() + 1;
        const day = msgDate.getDate();
        return `${month}月${day}日`;
      }
    };

    return messages.map((msg) => ({
      ...msg,
      dateLabel: formatDateLabel(msg.id),
    }));
  },
});
