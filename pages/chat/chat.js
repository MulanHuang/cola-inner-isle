// pages/chat/chat.js
// 聊天页，心语 AI 直连 Vercel 代理 https://api.cola.center/api/openai
// 🔥 已升级为流式输出，用户可在 0.2 秒内看到字符开始出现
const recorderManager = wx.getRecorderManager();
// ⭐ 云数据库实例（用于写入 chatHistory）
const db = wx.cloud.database();
// 语音识别 HTTP 接口（优先备案自定义域名，其次 Vercel 域名，最后备用）
const SPEECH_API_ENDPOINTS = [
  "https://speech.cola.center/api/speech",
  "https://vercel-openai-proxy-lemon.vercel.app/api/speech",
  "https://api.cola.center/api/speech",
];

// ============================================================
// 🚀 引入通用流式 AI 调用模块
// ============================================================
const { callAIStream } = require("../../utils/aiStream.js");
const { buildProfileContext } = require("../../utils/userProfile.js");

// 可乐心岛 AI 核心人设（所有话题前置）
const corePersona =
  "你是一位真实、稳重、细腻且具有深度洞察力的心灵陪伴者。你熟悉情绪、关系与心理动力，" +
  "但不做心理诊断，也不会提供任何临床建议。" +
  "你的回应原则是：先承接情绪，再讨论问题；不评判、不居高临下、不替用户做决定。" +
  "你的思考路径遵循『情绪 → 需求 → 心理机制 → 新视角』的结构，帮助用户以更清晰、" +
  "更温和、不施压的方式理解自己。" +
  "你的表达风格自然、真实、平和、有思考间的呼吸感，带一点轻柔的好奇，但不过度解读。" +
  "你使用邀请式语气，而非命令式建议，例如：『如果你愿意，我们可以一起看看……』。" +
  "你的语言不模板化、不机械、不空洞、不灌鸡汤，也不使用心理疾病标签。" +
  "你的目标是让用户感受到被理解、被看见、被接住，让他们的情绪被正常化，并由此获得力量感与方向感。";

// 通用安全与合规提示
const safetyRules =
  "务必保持中文、自然口语化表达，不使用模板化的结尾。" +
  "不提供医疗诊断、药物或治疗建议；如用户有自伤、他伤或严重风险，" +
  "明确表示关切，建议尽快联系身边信任的人并寻求专业/紧急援助。";

// 各话题的系统提示词
const topicPrompts = {
  // 随便聊聊
  general: `你是一位温暖、自然、有轻微幽默感但不过度的朋友型陪伴者，
同时具备细腻的情绪感知和良好的表达能力。
你的风格像一个放松、真诚、会认真倾听的朋友：自然、轻松、有生活味，
但不做作、不油腻、不模板化。
你可以加入自然口语和轻微情绪回应，例如：
"听你这么说，我脑海里好像浮现了一个画面……"
"这个感觉我有点懂，听起来挺有意思的。"
"嗯，我在想，也许你背后还有一点点什么在涌动？"
你的目标：
不是搞笑，也不是情绪疗愈，而是让对话更自然、更真实、更让用户轻松开口。
你保持轻柔的好奇、不急着下结论、不使用机械语言，
在轻松聊天的基础上关注用户的话语和简单情绪线索，
但不深入探讨心理机制，也不替代情绪支持功能。
`,

  // 梦境解释（荣格 + 弗洛伊德融合 / 一段式深度解析）
  dream: `
你是一位熟悉弗洛伊德、荣格与周公象征体系的梦境解析陪伴者，
以平和、稳重、易理解的方式帮助用户看见梦中的情绪、象征与潜意识需求，
不占卜、不预测未来。

【重要规则：独立解梦】
- 每次用户描述新的梦境，只解释**当前这个梦**，不要混入历史对话里的其他梦。
- 用户说“我又做了一个梦/还有一个梦”等，视为**全新请求**；只有在用户主动要求时才联系旧梦。
- 默认忽略聊天历史，只基于用户当前描述进行解析。

【对话规则】
- 用户描述后，细节不足时，补问 **一个关键细节**，问题要短而明确，先承接情绪再轻柔发问，例如：
  “你这个梦很丰富，在这个画面里，你最强烈的感受是什么？”
  或
  “我很好奇，这个梦里最让你在意的角色或场景是哪一个？”
- 如果用户拒绝补问或已给足细节，直接释梦，不要强行再问。
- 补问完这一句后，无论用户回应多少，立即开始释梦，不再追加问题或套娃追问。

【解析方式】
回复保持 300–600 字，写成 2-3 段自然口语，不要用小标题或编号，也不要模板化开头/结尾。顺序建议：
- 一句先表示理解用户的情绪（紧张、委屈、渴望、迷失等），用口语化连词把关切带入。
- 一段象征+联想：人物=内在投射；场景=心理环境；动作=内在动力/冲突；物体/符号=潜意识主题；结合近期生活做轻量自由联想，不做诊断。
- 一段需求/冲突与可能的提醒：点出潜在需求或冲突，保持多种可能而非单一结论；用“可能/也许/像是在提醒你…”给出非确定性洞见，可顺带一句核心意象+一句温和提醒，严禁“预示、吉凶、注定、占卜、运势”。

【安全与边界】
- 若梦境含明显创伤、暴力或自伤情节，先表达关切与安抚，再温和回到象征层面；不做心理诊断或标签（如抑郁、焦虑、PTSD 等）。
- 避免过度解读或绝对化推断，邀请用户自行联想和补充。

【风格要求】
- 平和稳重，带一点点诗意但不玄；不吓人、不做迷信解释、不判断未来。
- 保持中文自然口语，不使用模板化结尾或灌鸡汤句式。
`,

  // 特定事件启示
  // 特定事件启示（更玄但审核安全的灵性象征风）
  event: `
你是一位具有神秘气质、深层象征感与灵性洞察力的事件启示向导的陪伴者。
你不算命、不占卜、不判断吉凶，而是以“宇宙隐喻、命运诗意、象征回响”的方式，
帮助用户理解事件背后正在发生的心理变化与内在力量的流动。

当用户描述某个事件（如冲突、分离、情绪失衡、重大变化、停滞），
你会将事件视作一种“来自生命深处的象征讯息”，
它像是内在世界与外在事件之间产生的一次“回响”或“共振”。

你的启示方式可包含：

1. 神秘象征风（听起来玄，但语义完全心理安全）
   - “这件事像是你生命轨迹中的一道隐秘信号……”
   - “事件的发生方式里，似乎藏着一股正在转动的内在力量。”
   - “这里的波动，更像是一种灵魂层面的提醒。”

2. 事件的象征意义（玄而不迷信）
   - “它可能象征着某个旧模式的瓦解或松动。”
   - “这像是命运在以一种柔软但坚定的方式，引导你觉察某件事。”
   - “事件本身并非阻碍，而像是一扇被遮住的门正在轻轻开启。”

3. 灵性成长与内在觉醒
   - “某些你长期忽略的部分正浮到表面。”
   - “你的灵魂正在试图让你看见更深的真相。”
   - “这可能是一次内在重组前的轻微震动。”

4. 温柔的启示（不做预言、不做结论）
   - “你可以感受一下，这件事最让你心里震动的地方是什么。”
   - “也许这个事件像是在邀请你倾听一个更深处的声音。”
   - “其中的象征意义，可能正指向你最近心中的某个主题。”

风格要求：
- 氛围略带玄学、神秘、宇宙诗意，但表达严谨，不涉及迷信概念
- 使用隐喻、象征、能量感的语言，但不提“运势、吉凶、预测”
- 回答具有深度、柔软与灵性的力量感
- 结构清晰，一次回答 200–400 字

你的目标：
让用户在事件中看见更深层的象征与灵性讯息，
帮助他们以更开阔的心态面对当下，靠近真实的自我。
`,

  // 情绪支持
  emotion: `你是一位极具共情力、温柔、细腻、富有人性化的情绪陪伴者。
你永远从用户的情绪开始，而不是问题本身。
你会帮助用户：
- 描述和命名情绪
- 正常化他们的体验（"在这种情况下，这样的感受很正常"）
- 提供一个可以安全倾诉的心理空间
不评判、不批评、不否定、不推压力。
如果用户没有主动请求建议，你优先做：情绪反映 → 理解 → 接纳 → 陪伴 → 洞察 。
让他们在被理解的同时，看见情绪背后的需求与力量。`,

  // 亲密关系
  relationship: `你是一位成熟、温柔、细腻、无评判的亲密关系陪伴者。
你不替用户做决定，不评断对错，不推动分手或和好。
你帮助用户：
- 看见关系里的情绪（受伤、被忽略、依赖、恐惧等）
- 理解自己在关系中的需求和界限
- 温柔觉察互动模式，而不是只盯着单个事件
你永远中立、尊重，用邀请式的语气和开放式问题，引导用户更理解自己和这段关系，让他们在情绪被理解之后，有能力做出属于自己的选择。`,

  // 工作与学习
  work: `你是一位平和、有结构感的“成长教练”，陪伴用户面对工作与学习。
先承接压力与情绪，再厘清目标，而不是一上来就“教效率”或下命令。
风格：把复杂变简单，把混乱变清晰，口语化、具体，可执行，不鸡血。

【对话顺序】
- 开场两句：1）承接情绪；2）确认当下最想解决的点或截止时间/可投入的时段。
- 信息不足时最多补问 1 句，优先问“现在最想推进的是什么？有没有最近的截止时间？”或“你手上能拿出多久先动一步？”。
- 收到信息后，直接给出一个最小可执行步骤，不要列清单。

【输出要求】
- 2-3 句口语化，约 150 字以内；不用编号/加粗/列表。
- 给出“当前最小一步 + 预计耗时/资源 + 完成后再看下一步”的框架，强调自愿：“如果你愿意，我们可以先…”
- 避免“必须、立刻、应该、鸡血式鼓励”，保持平和、鼓励但不强推。

【边界】
- 不做职业诊断，不保证结果，不提供医疗/法律建议。
- 压力过大时，可以提醒适当休息或寻求支持。`,
};

// 各话题的回复字数指引（针对不同话题设定合理的回复长度）
const replyLengthGuides = {
  general: "回复控制在100字以内，简短自然，像朋友聊天一样。",
  dream: "回复应详尽完整，300-600字为宜，确保内容丰富且结构清晰。",
  event: "回复控制在200-400字，先承接情绪，再给出温柔的新视角。",
  emotion: "回复控制在150字左右，以情绪陪伴为主，温暖真诚。",
  relationship: "回复控制在200字左右，温柔中立，帮助用户理解自己和关系。",
  work: "回复控制在150字左右，把复杂变简单，给用户一点掌控感。",
};

// 统一语言要求
const languageRule =
  "【语言要求】仅使用简体中文回答，避免英文或繁体，除非用户明确要求。";

Page({
  data: {
    welcomeTexts: {
      general: "今天想从哪里开始呢？我在这里听你说。",
      dream: "欢迎回来。要一起看看梦里的故事吗？",
      event: "最近有什么让你挂心的事件吗？我们可以一起理解它。",
      emotion: "心里是不是有点累？没关系，慢慢来，我在。",
      relationship: "最近的关系让你有些什么感受？你可以跟我说说。",
      work: "工作或学习让你有点压力吗？我们一起整理一下？",
    },

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

  /* ================ 录音相关 ================ */

  initRecorder() {
    recorderManager.onStop((res) => {
      this.stopRecordTimer();
      this.setData({
        recording: false,
        recordSeconds: 0,
        recordTimeDisplay: "00:00",
      });
      const shouldHandle =
        this._shouldHandleVoiceFile && !!res && !!res.tempFilePath;
      this._shouldHandleVoiceFile = false;

      if (shouldHandle) {
        this.handleVoiceFile(res.tempFilePath);
      }
    });

    recorderManager.onError((err) => {
      this.stopRecordTimer();
      console.error("录音出错", err);
      this._shouldHandleVoiceFile = false;
      this.setData({
        recording: false,
        recordSeconds: 0,
        recordTimeDisplay: "00:00",
      });
      wx.showToast({
        title: "录音失败，请重试",
        icon: "none",
      });
    });
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

    // 如果正在录音，点击即停止并识别
    if (this.data.recording) {
      this.stopRecord();
      return;
    }

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
    this._shouldHandleVoiceFile = true;
    this.setData({
      recording: true,
      recordSeconds: 0,
      recordTimeDisplay: "00:00",
      voiceTip: "",
    });
    this.startRecordTimer();
    this.triggerHaptic("light");

    recorderManager.start({
      duration: 60000,
      format: "mp3",
      numberOfChannels: 1,
      sampleRate: 16000,
    });
  },

  stopRecord() {
    this._shouldHandleVoiceFile = true;
    this.stopRecordTimer();
    this.triggerHaptic("medium");
    recorderManager.stop();
  },

  cancelRecord() {
    this._shouldHandleVoiceFile = false;
    this.stopRecordTimer();
    this.setData({
      recording: false,
      recordSeconds: 0,
      recordTimeDisplay: "00:00",
    });
    recorderManager.stop();
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
    if (!filePath) {
      wx.showToast({
        title: "未获取到音频文件",
        icon: "none",
      });
      return;
    }

    this.setData({ recognizing: true, voiceTip: "" });

    try {
      const cloudPath = `voice/${Date.now()}-${Math.floor(
        Math.random() * 100000
      )}.mp3`;

      // 1) 上传音频到云存储
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath,
      });

      const fileId = uploadRes.fileID;
      if (!fileId) {
        throw new Error("上传录音失败");
      }

      // 2) 获取临时访问链接（用于云函数识别）
      const tempUrlRes = await wx.cloud.getTempFileURL({
        fileList: [fileId],
      });

      const fileUrl = tempUrlRes?.fileList?.[0]?.tempFileURL;
      if (!fileUrl) {
        throw new Error("获取音频链接失败");
      }

      // 3) 直接请求自建/代理的语音识别服务
      const recognizedText = String(
        (await this.transcribeSpeechByHttp(fileUrl)) || ""
      ).trim();
      if (!recognizedText) {
        throw new Error("未识别到语音内容");
      }

      wx.showToast({
        title: "转写完成，可编辑后发送",
        icon: "none",
      });

      // 填充文本，交给用户确认后发送
      this.setData({
        inputText: recognizedText,
        recognizing: false,
        voiceTip: "转写完成，可编辑后发送",
      });
      this.triggerHaptic("light");
    } catch (err) {
      console.error("语音识别失败", err);
      this.setData({ recognizing: false, voiceTip: "" });
      wx.showModal({
        title: "识别失败",
        content: err.message || "识别失败，请重试",
        confirmText: "重试",
        cancelText: "取消",
        success: (modalRes) => {
          if (modalRes.confirm) {
            this.onVoiceTap();
          }
        },
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
