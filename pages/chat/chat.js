// pages/chat/chat.js
// 聊天页，心语 AI 通过云函数 aiProxy 调用腾讯云服务器转发到 DeepSeek API
// 🔥 已升级为流式输出，用户可在 0.2 秒内看到字符开始出现
const recorderManager = wx.getRecorderManager();
const db = wx.cloud.database();

// 微信同声传译插件（语音识别）
const plugin = requirePlugin("WechatSI");
const voiceRecognitionManager = plugin.getRecordRecognitionManager();

// 引入依赖模块
const { callAIStream } = require("../../utils/aiStream.js");
const { buildProfileContext } = require("../../utils/userProfile.js");
const { setNavBarHeight } = require("../../utils/common.js");
const {
  corePersona,
  safetyRules,
  languageRule,
  topicPrompts,
  replyLengthGuides,
  topics,
  welcomeTexts,
} = require("./chatConfig.js");

Page({
  data: {
    welcomeTexts,
    topics,
    currentTopicId: "general",

    messages: [],
    scrollToView: "", // 用于控制滚动到哪条消息，格式为 msg_0, msg_1, ... 或 scroll_bottom

    inputText: "",
    inputMode: "text", // text | voice
    recording: false,
    recordSeconds: 0,
    recordTimeDisplay: "00:00",
    recognizing: false,
    voiceTip: "",
    micTapped: false,
    loading: false,

    // 自定义导航栏高度
    statusBarHeight: 0,
    navBarHeight: 0,

    // 回到底部按钮显示状态
    showScrollToBottom: false,
    // textarea 高度追踪
    textareaHeight: 0,
    // 聊天列表底部 padding（动态调整）
    scrollPaddingBottom: 150,
    // 标签面板展开状态
    tagPanelExpanded: false,
    // 长文编辑状态
    isLongInput: false,
    fullEditVisible: false,
    fullEditText: "",

    // 触摸起始位置（用于手势检测）
    touchStartX: 0,
    touchStartY: 0,
    // 滑动偏移量（用于视觉反馈）
    swipeOffsetX: 0,
    isSwipingHorizontal: false,
    // 输入聚焦时关闭横向手势，避免晃动
    disableSwipe: false,

    // 梦境模式：记录初次梦境，等待补充细节后再统一解梦
    dreamPendingContext: null,
  },

  onLoad() {
    this.setNavBarHeight();
    this.initRecorder();
    // 默认不处理录音回调，真正开始录音时再打开
    this._shouldHandleVoiceFile = false;

    // 检查本地是否已经进入过聊天页
    const hasEntered = wx.getStorageSync("hasEnteredChat");

    if (hasEntered) {
      // 用户不是第一次进入 → 加载历史记录
      this.loadChatHistory();
    } else {
      // 用户第一次进入 → 不加载聊天记录，显示欢迎页
      this.setData({ messages: [] });
    }

    // 标记用户已经进入过聊天页
    wx.setStorageSync("hasEnteredChat", true);
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
    this.stopRecordTimer();
  },

  // 触感反馈（失败时不阻塞流程）
  triggerHaptic(type = "light") {
    try {
      wx.vibrateShort({ type });
    } catch (e) {
      // ignore
    }
  },

  // 录音计时显示 mm:ss
  formatRecordTime(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  },

  startRecordTimer() {
    this.stopRecordTimer();
    this.recordTimer = setInterval(() => {
      const next = this.data.recordSeconds + 1;
      this.setData({
        recordSeconds: next,
        recordTimeDisplay: this.formatRecordTime(next),
      });
    }, 1000);
  },

  stopRecordTimer() {
    if (this.recordTimer) {
      clearInterval(this.recordTimer);
      this.recordTimer = null;
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

    // 🔥 优化：使用 nextTick 替代 setTimeout，减少延迟
    this.setData({ scrollToView: "" }, () => {
      wx.nextTick(() => {
        this.setData({ scrollToView: targetId, showScrollToBottom: false });
      });
    });
  },

  // 统一设置 messages，并在 DOM 更新后滚到底部
  setMessagesAndScroll(messages) {
    const messagesWithDateLabel = this.addDateLabelsToMessages(messages);
    this.setData({ messages: messagesWithDateLabel }, () => {
      // 🔥 优化：使用 nextTick 替代 setTimeout，减少延迟
      wx.nextTick(() => {
        this.scrollToBottom();
      });
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
    console.log("[chat] handleBack triggered");
    // 使用 reLaunch 跳转到首页（适用于自定义 tabBar）
    wx.reLaunch({
      url: "/pages/home/home",
      success: () => {
        console.log("[chat] reLaunch success");
      },
      fail: (err) => {
        console.error("[chat] reLaunch failed:", err);
      },
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
    if (this.data.disableSwipe) return;
    if (e.touches && e.touches.length > 0) {
      this.setData({
        touchStartX: e.touches[0].clientX,
        touchStartY: e.touches[0].clientY,
        swipeOffsetX: 0,
        isSwipingHorizontal: false,
      });
    }
  },

  // 滑动过程中的视觉反馈
  onTouchMove(e) {
    if (this.data.disableSwipe) return;
    if (e.touches && e.touches.length > 0) {
      const touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      const deltaX = touchCurrentX - this.data.touchStartX;
      const deltaY = touchCurrentY - this.data.touchStartY;

      // 首次移动时判断是否为水平滑动
      if (!this.data.isSwipingHorizontal && Math.abs(deltaX) > 10) {
        // 水平位移大于垂直位移的 1.5 倍，判定为水平滑动
        if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          this.setData({ isSwipingHorizontal: true });
        }
      }

      // 只有水平滑动时才更新偏移量
      if (this.data.isSwipingHorizontal) {
        // 右滑时显示位移效果（最大 100px）
        if (deltaX > 0) {
          const offset = Math.min(deltaX * 0.4, 100);
          this.setData({ swipeOffsetX: offset });
        }
        // 左滑时显示位移效果（最大 -60px）
        else if (deltaX < 0) {
          const offset = Math.max(deltaX * 0.3, -60);
          this.setData({ swipeOffsetX: offset });
        }
      }
    }
  },

  // 检测滑动方向，右滑返回首页，左滑打开话题面板
  onTouchEnd(e) {
    if (this.data.disableSwipe) return;
    const { isSwipingHorizontal, touchStartX } = this.data;

    // 重置滑动状态
    this.setData({ swipeOffsetX: 0, isSwipingHorizontal: false });

    if (!isSwipingHorizontal) return;

    if (e.changedTouches && e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - this.data.touchStartY;

      // 判断为右滑：水平滑动距离 > 60px，且水平位移 > 垂直位移的 1.5 倍
      if (deltaX > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        // 🔥 触感反馈：中等强度震动
        wx.vibrateShort({ type: "medium" });
        this.handleBack();
        return;
      }

      // 判断为左滑：水平滑动距离 < -60px，且水平位移 > 垂直位移的 1.5 倍
      if (deltaX < -60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        // 🔥 触感反馈：轻微震动
        wx.vibrateShort({ type: "light" });
        // 打开/关闭话题面板
        this.setData({ tagPanelExpanded: !this.data.tagPanelExpanded });
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

  /* ================ 录音相关（使用微信同声传译插件） ================ */

  initRecorder() {
    // 初始化微信同声传译插件的语音识别
    this._recognizedText = "";

    // 识别结果事件（实时返回识别结果）
    voiceRecognitionManager.onRecognize = (res) => {
      console.log("[voice] 实时识别:", res);
      // 实时显示识别中的文字，并累积结果
      if (res.result) {
        this._recognizedText = res.result; // 保存最新识别结果
        this.setData({ voiceTip: res.result });
      }
    };

    // 录音结束，返回最终识别结果
    voiceRecognitionManager.onStop = (res) => {
      console.log("[voice] 识别完成 res:", res);
      // 如果 onStop 没有返回结果，使用 onRecognize 累积的结果
      const finalResult = res.result || this._recognizedText || "";
      console.log("[voice] 最终文本:", finalResult);
      this.stopRecordTimer();
      this._recognizedText = ""; // 清空累积文本
      this.setData({
        recording: false,
        recognizing: false,
        recordSeconds: 0,
        recordTimeDisplay: "00:00",
      });

      const text = finalResult.trim();
      if (text) {
        this.setData({
          inputText: text,
          voiceTip: "转写完成，可编辑后发送",
        });
        wx.showToast({ title: "转写完成", icon: "none" });
        this.triggerHaptic("light");
      } else {
        this.setData({ voiceTip: "" });
        wx.showToast({ title: "未识别到语音内容", icon: "none" });
      }
    };

    // 识别错误
    voiceRecognitionManager.onError = (err) => {
      console.error("[voice] 识别出错:", err);
      this.stopRecordTimer();
      this.setData({
        recording: false,
        recognizing: false,
        recordSeconds: 0,
        recordTimeDisplay: "00:00",
        voiceTip: "",
      });
      wx.showToast({
        title: err.msg || "语音识别失败",
        icon: "none",
      });
    };

    // 开始识别
    voiceRecognitionManager.onStart = () => {
      console.log("[voice] 开始识别");
      this.setData({ voiceTip: "正在聆听..." });
    };
  },

  onInput(e) {
    const value = e.detail.value || "";
    const isLong = value.length > 120;
    this.setData({
      inputText: value,
      isLongInput: isLong,
    });
  },

  // 输入框行数变化时更新高度
  onLineChange(e) {
    const { height } = e.detail;
    // 基础底部 padding
    const basePadding = 150;
    // 单行时的基准高度约 40rpx，超出部分需要额外 padding
    const extraPadding = Math.max(0, height - 40);
    // 根据面板是否展开调整基础 padding
    const panelExtra = this.data.tagPanelExpanded ? 180 : 0;

    this.setData({
      textareaHeight: height,
      scrollPaddingBottom: basePadding + extraPadding + panelExtra,
    });
  },

  onInputFocus() {
    // 关闭横滑手势，避免长文编辑时左右晃动
    this.setData({ disableSwipe: true });
  },

  onInputBlur() {
    // 短暂延迟，防止切换焦点时抖动
    setTimeout(() => {
      this.setData({ disableSwipe: false });
    }, 120);
  },

  clearInput() {
    this.setData({
      inputText: "",
      voiceTip: "",
      isLongInput: false,
    });
  },

  openFullEditor() {
    this.setData({
      fullEditVisible: true,
      fullEditText: this.data.inputText,
      disableSwipe: true,
    });
  },

  onFullEditInput(e) {
    const value = e.detail.value || "";
    this.setData({
      fullEditText: value,
    });
  },

  closeFullEditor() {
    this.setData({
      fullEditVisible: false,
      disableSwipe: false,
    });
  },

  saveFullEditor() {
    const text = (this.data.fullEditText || "").trimStart();
    this.setData({
      inputText: text,
      isLongInput: text.length > 120,
      fullEditVisible: false,
      disableSwipe: false,
    });
  },

  onPlusTap() {
    const newExpanded = !this.data.tagPanelExpanded;
    // 面板展开/收起时更新底部 padding
    const basePadding = 150;
    const extraPadding = Math.max(0, this.data.textareaHeight - 40);
    const panelExtra = newExpanded ? 180 : 0;

    this.setData({
      tagPanelExpanded: newExpanded,
      scrollPaddingBottom: basePadding + extraPadding + panelExtra,
    });
  },

  async onVoiceTap() {
    // 如果正在录音，点击即停止
    if (this.data.recording) {
      this.triggerHaptic("light");
      this.stopRecord();
      return;
    }

    // 如果正在转写（非录音状态），提示等待
    if (this.data.recognizing) {
      wx.showToast({
        title: "正在转写，请稍等",
        icon: "none",
      });
      return;
    }

    this.setData({ micTapped: true });
    if (this._micTapTimer) clearTimeout(this._micTapTimer);
    this._micTapTimer = setTimeout(() => {
      this.setData({ micTapped: false });
    }, 180);
    this.triggerHaptic("light");

    try {
      await this.ensureRecordPermission();
      this.startRecord();
    } catch (err) {
      console.error("录音授权失败", err);
      this.setData({ voiceTip: "未授权录音，请在设置中开启" });
      wx.showToast({
        title: err.message || "需要录音权限",
        icon: "none",
      });
    }
  },

  async ensureRecordPermission() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (res) => {
          const granted = res.authSetting && res.authSetting["scope.record"];
          if (granted) {
            resolve();
            return;
          }

          wx.authorize({
            scope: "scope.record",
            success: () => resolve(),
            fail: () => {
              wx.showModal({
                title: "需要录音权限",
                content: "请在设置中开启录音权限后再试",
                confirmText: "去设置",
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting({});
                  }
                },
              });
              reject(new Error("未授权录音"));
            },
          });
        },
        fail: (err) => reject(err),
      });
    });
  },

  startRecord() {
    this.setData({
      recording: true,
      recognizing: false, // 录音时不是 recognizing 状态
      recordSeconds: 0,
      recordTimeDisplay: "00:00",
      voiceTip: "正在聆听...",
    });
    this.startRecordTimer();

    // 使用微信同声传译插件开始语音识别
    voiceRecognitionManager.start({
      duration: 60000, // 最长60秒
      lang: "zh_CN", // 中文
    });
  },

  stopRecord() {
    this.stopRecordTimer();
    this.triggerHaptic("medium");
    // 停止录音，进入识别状态
    this.setData({
      recording: false,
      recognizing: true,
      voiceTip: "",
    });
    // 停止语音识别
    voiceRecognitionManager.stop();
  },

  cancelRecord() {
    this.stopRecordTimer();
    this.setData({
      recording: false,
      recognizing: false,
      recordSeconds: 0,
      recordTimeDisplay: "00:00",
      voiceTip: "",
    });
    voiceRecognitionManager.stop();
  },

  // 通过 HTTP 调用自建/代理的语音识别服务（不走云函数）
  transcribeSpeechByHttp(fileUrl) {
    return new Promise((resolve, reject) => {
      if (!fileUrl) {
        reject(new Error("缺少音频链接"));
        return;
      }

      const tryNext = (index) => {
        if (index >= SPEECH_API_ENDPOINTS.length) {
          reject(new Error("语音识别接口请求失败"));
          return;
        }

        const url = SPEECH_API_ENDPOINTS[index];
        wx.request({
          url,
          method: "POST",
          header: { "Content-Type": "application/json" },
          data: {
            fileUrl,
            model: "whisper-1",
            language: "zh",
          },
          timeout: 25000,
          success: (res) => {
            const ok = res.statusCode >= 200 && res.statusCode < 300;
            const text = (res.data && res.data.text) || res.data?.result;
            if (ok && text) {
              resolve(String(text));
            } else {
              console.warn(
                "[speech] 接口返回异常，尝试下一个",
                url,
                res.statusCode,
                res.data
              );
              tryNext(index + 1);
            }
          },
          fail: (err) => {
            console.error("[speech] 请求失败，尝试下一个", url, err);
            tryNext(index + 1);
          },
        });
      };

      tryNext(0);
    });
  },

  async handleVoiceFile(filePath) {
    // 此方法暂时不使用（因云函数超时限制）
    // 改用微信内置语音识别，见 startVoiceRecognition
    console.log("[voice] handleVoiceFile 已弃用，使用内置识别");
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

  sendMessage() {
    const content = this.data.inputText.trim();
    if (!content) {
      wx.showToast({ title: "请输入内容", icon: "none" });
      return;
    }

    // 清除语音提示，避免残留
    if (this.data.voiceTip) {
      this.setData({ voiceTip: "" });
    }

    // ⭐ 防止重复点击发送
    if (this.data.loading) {
      wx.showToast({ title: "正在回复中，请稍候…", icon: "none" });
      return;
    }

    // 🔥 触感反馈：发送消息时轻微震动
    wx.vibrateShort({ type: "light" });

    const { currentTopicId, messages: currentMessages } = this.data;

    // 1️⃣ 添加用户消息到列表
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: content,
      time: this.formatTime(new Date()),
      topicId: currentTopicId,
      isNew: true, // 🔥 标记为新消息，用于触发动画
    };

    const newMessages = [...currentMessages, userMessage];

    // 2️⃣ 预先添加一个 AI 消息占位（用于流式更新）
    const aiMessageId = Date.now() + 1;
    const aiMessage = {
      id: aiMessageId,
      role: "assistant",
      content: "", // 🔥 初始为空，流式填充
      time: this.formatTime(new Date()),
      topicId: currentTopicId,
      isStreaming: true, // 标记正在流式输出
      isThinking: true, // 🔥 标记正在思考状态
      isNew: true, // 🔥 标记为新消息，用于触发动画
    };

    const messagesWithAI = [...newMessages, aiMessage];

    this.setMessagesAndScroll(messagesWithAI);
    this.setData({ inputText: "", loading: true, isLongInput: false });
    this.saveMessagesToStorage(currentTopicId, newMessages);

    const isDreamTopic = currentTopicId === "dream";
    const pendingDream = this.data.dreamPendingContext;
    let messagesForAI = [];
    let setPendingForDream = false;

    // 获取用户个人信息上下文
    const profileContext = buildProfileContext({ type: "chat" });

    if (isDreamTopic && !pendingDream) {
      // 第一轮：只问一个关键细节，不做解释
      const systemPrompt =
        `${corePersona}\n${safetyRules}\n${topicPrompts.dream}\n${languageRule}\n` +
        `${profileContext}\n\n` +
        "【当前模式】只提出一个简短的关键细节问题，等待用户回答后再解析梦境。" +
        "不要现在解释或总结梦，不要给结论，不要超过30字，保持中文口语。";

      messagesForAI = [
        { role: "system", content: systemPrompt },
        { role: "user", content: String(content).slice(0, 200) },
      ];

      // 记录初次梦境，等待补充细节
      this.setData({
        dreamPendingContext: { initialDream: content },
      });
      setPendingForDream = true;
    } else if (isDreamTopic && pendingDream) {
      // 第二轮：结合初次梦境和补充细节，一次性解梦，不再提问
      const basePrompt = topicPrompts.dream;
      const lengthGuide = replyLengthGuides.dream || replyLengthGuides.general;
      const systemPrompt =
        `${corePersona}\n${safetyRules}\n${basePrompt}\n${languageRule}\n` +
        `${profileContext}\n\n` +
        `【解析指令】结合初次梦境与补充细节一次性完成解析，不要再提问或追问。${lengthGuide}`;

      messagesForAI = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            `初次梦境：${String(pendingDream.initialDream || "").slice(
              0,
              300
            )}\n` + `补充细节：${String(content).slice(0, 200)}`,
        },
      ];
    } else {
      // 其他话题：带少量历史
      const historyCount = 6;
      const historyMessages = currentMessages
        .slice(-historyCount)
        .filter((m) => m.content && m.content.length < 500)
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "").slice(0, 300),
        }));

      const basePrompt = topicPrompts[currentTopicId] || topicPrompts.general;
      const lengthGuide =
        replyLengthGuides[currentTopicId] || replyLengthGuides.general;
      const systemPrompt =
        `${corePersona}\n${safetyRules}\n${basePrompt}\n${languageRule}\n` +
        `${profileContext}\n\n` +
        `【回复要求】用自然、口语化的方式回应用户，温暖真诚，不说教。${lengthGuide}`;

      messagesForAI = [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: String(content).slice(0, 200) },
      ];
    }

    console.log("[chat] 🔥 开始流式请求");

    // 🔥 用于节流滚动的变量
    let lastScrollTime = 0;
    const SCROLL_THROTTLE = 300; // 每 300ms 最多滚动一次

    // 5️⃣ 使用流式调用
    this._currentStreamTask = callAIStream({
      messages: messagesForAI,
      model: "gpt-5-mini",
      onChunk: (_, fullText) => {
        // 🔥 实时更新 AI 消息内容（移除 isThinking 标记，保留 isStreaming 用于光标显示）
        const messages = this.data.messages.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: fullText,
                isThinking: false,
                isStreaming: true,
              }
            : msg
        );

        // 🔥 直接 setData 更新 UI，不每次都滚动
        this.setData({ messages });

        // 🔥 节流滚动：每 300ms 最多滚动一次
        const now = Date.now();
        if (now - lastScrollTime > SCROLL_THROTTLE) {
          lastScrollTime = now;
          this.scrollToBottom();
        }
      },
      onComplete: (fullText) => {
        console.log("[chat] ✅ 流式输出完成，总长度:", fullText.length);

        // 🔥 移除 isStreaming 和 isThinking 标记
        const finalMessages = this.data.messages.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: fullText,
                isStreaming: false,
                isThinking: false,
              }
            : msg
        );

        this.setMessagesAndScroll(finalMessages);
        this.setData({ loading: false });

        // 本地存储
        this.saveMessagesToStorage(currentTopicId, finalMessages);

        // 云端写入 chatHistory（用于练习打卡）
        const completedAiMessage = { ...aiMessage, content: fullText };
        this.saveChatHistoryToCloud(userMessage, completedAiMessage);

        // 梦境解析完成后，清理挂起的补充上下文
        if (isDreamTopic && pendingDream) {
          this.setData({ dreamPendingContext: null });
        }

        this._currentStreamTask = null;
      },
      onError: (err) => {
        console.error("[chat] ❌ 流式请求失败:", err.message);
        this.setData({ loading: false });

        // 移除空的 AI 消息
        const messagesWithoutEmpty = this.data.messages.filter(
          (msg) => msg.id !== aiMessageId
        );
        this.setMessagesAndScroll(messagesWithoutEmpty);

        wx.showToast({
          title: err.message || "网络请求失败",
          icon: "none",
        });

        // 如果是梦境模式且刚刚设置了等待补充，失败时清理状态，避免卡住
        if (setPendingForDream) {
          this.setData({ dreamPendingContext: null });
        }

        this._currentStreamTask = null;
      },
    });
  },

  /* ================ 话题切换/重发/清空 ================ */

  switchTopic(e) {
    const topicId = e.currentTarget.dataset.id;
    if (topicId === this.data.currentTopicId) return;

    this.setData({ currentTopicId: topicId, dreamPendingContext: null });

    const storageKey = `chat_history_${topicId}`;
    const stored = wx.getStorageSync(storageKey) || [];

    if (stored.length === 0) {
      // 没有历史聊天 → 显示欢迎界面（动态文案自动生效）
      this.setData({ messages: [] });
    } else {
      this.loadChatHistory(topicId);
    }
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
            this.setData({ messages: [], dreamPendingContext: null }, () => {
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

  /* ================ 🔥 快捷回复 ================ */

  // 快捷发送预设问题
  quickSend(e) {
    const text = e.currentTarget.dataset.text;
    if (!text) return;

    // 触感反馈
    wx.vibrateShort({ type: "light" });

    this.setData({ inputText: text }, () => {
      this.sendMessage();
    });
  },

  /* ================ 🔥 消息长按菜单 ================ */

  // 消息长按处理
  onMsgLongPress(e) {
    const msgId = e.currentTarget.dataset.id;
    const msgRole = e.currentTarget.dataset.role;
    const msg = this.data.messages.find((m) => m.id === msgId);

    if (!msg || !msg.content) return;

    // 触感反馈
    wx.vibrateShort({ type: "medium" });

    // 根据消息类型显示不同选项
    const itemList =
      msgRole === "assistant"
        ? ["复制文本", "重新生成", "删除消息"]
        : ["复制文本", "删除消息"];

    wx.showActionSheet({
      itemList,
      success: (res) => {
        if (msgRole === "assistant") {
          if (res.tapIndex === 0) this.copyMessage(msg);
          if (res.tapIndex === 1) this.regenerateMessage(msgId);
          if (res.tapIndex === 2) this.deleteMessage(msgId);
        } else {
          if (res.tapIndex === 0) this.copyMessage(msg);
          if (res.tapIndex === 1) this.deleteMessage(msgId);
        }
      },
    });
  },

  // 复制消息内容
  copyMessage(msg) {
    wx.setClipboardData({
      data: msg.content,
      success: () => {
        wx.showToast({ title: "已复制", icon: "success" });
      },
    });
  },

  // 删除消息
  deleteMessage(msgId) {
    wx.showModal({
      title: "删除消息",
      content: "确定要删除这条消息吗？",
      confirmText: "删除",
      confirmColor: "#ff4d4f",
      success: (res) => {
        if (res.confirm) {
          const newMessages = this.data.messages.filter((m) => m.id !== msgId);
          this.setData({ messages: newMessages });
          // 保存到本地存储
          this.saveMessagesToStorage(this.data.currentTopicId, newMessages);
          wx.showToast({ title: "已删除", icon: "success" });
        }
      },
    });
  },

  // 重新生成 AI 回复
  regenerateMessage(msgId) {
    // 找到这条 AI 消息对应的用户消息
    const messages = this.data.messages;
    const aiMsgIndex = messages.findIndex((m) => m.id === msgId);

    if (aiMsgIndex <= 0) {
      wx.showToast({ title: "无法重新生成", icon: "none" });
      return;
    }

    // 找到之前最近的用户消息
    let userMsg = null;
    for (let i = aiMsgIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userMsg = messages[i];
        break;
      }
    }

    if (!userMsg) {
      wx.showToast({ title: "未找到对应的问题", icon: "none" });
      return;
    }

    // 删除这条 AI 消息，然后重新发送用户消息
    const newMessages = messages.filter((m) => m.id !== msgId);
    this.setData({ messages: newMessages, inputText: userMsg.content }, () => {
      // 删除用户消息以便重新发送
      const messagesWithoutUser = newMessages.filter(
        (m) => m.id !== userMsg.id
      );
      this.setData({ messages: messagesWithoutUser }, () => {
        this.sendMessage();
      });
    });
  },
});
