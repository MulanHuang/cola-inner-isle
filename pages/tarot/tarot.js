// pages/tarot/tarot.js
// ============================================================
// 塔罗牌抽取页面 - 专业级交互与动画系统
// 流程阶段: idle → shuffling → spreading → selecting → selected → result
// 🔥 已升级为流式输出，用户可在 0.2 秒内看到字符开始出现
// ============================================================

const db = wx.cloud.database();
// ✅ 塔罗解读改为前端直连 Vercel 代理（流式输出）

const { callAIStream } = require("../../utils/aiStream.js");
const { buildProfileContext } = require("../../utils/userProfile.js");
// 🚀 云存储临时 URL 智能缓存工具
const { getTempUrlWithCache } = require("../../utils/cloudUrlCache.js");

// 逆位出现概率（0-1）
const REVERSED_RATE = 0.3;

// ============================================================
// 手势交互配置 - Card Flow on Fixed Ring (优化版 - 流畅滑动)
// ============================================================
const GESTURE_CONFIG = {
  // 缩放配置
  zoom: {
    minScale: 0.6, // 最小缩放比例
    maxScale: 2.0, // 最大缩放比例
    defaultScale: 1.0, // 默认缩放比例
    resetDuration: 300, // 缩放重置动画时长 (ms)
    holdDuration: 2000, // 🆕 放大后保持时间 (ms)，让用户有时间选牌
    autoResetEnabled: true, // 🆕 是否自动重置缩放（放大后自动恢复）
  },
  // 卡牌流动配置 - 🔥 优化滑动流畅度
  cardFlow: {
    sensitivity: 0.8, // 🔥 提高滑动灵敏度：1px 移动 = 0.8 度旋转（原0.5，更灵敏）
    snapEnabled: true, // 是否启用松手吸附
    snapDuration: 200, // 🔥 缩短吸附动画时长 (ms)，更快响应（原250）
    // 惯性滑动配置 - 🔥 优化惯性体验
    inertia: {
      enabled: true, // 是否启用惯性滑动
      friction: 0.96, // 🔥 提高摩擦系数（原0.92），惯性更持久丝滑
      minVelocity: 0.3, // 🔥 降低最小速度阈值（原0.5），更容易触发惯性
      maxVelocity: 50, // 🔥 提高最大速度限制（原30），允许更快滑动
    },
  },
  // 触摸判定配置（🆕 增强防误触）
  touch: {
    tapThreshold: 12, // 🔥 适当降低点击阈值 (px)，更精准区分点击和滑动（原15）
    tapTimeThreshold: 200, // 🔥 适当缩短点击时间阈值 (ms)，响应更快（原250）
    doubleTapInterval: 300, // 双击间隔 (ms)，用于区分单击和双击
  },
  // 触感反馈配置 - 🔥 优化触感体验
  haptic: {
    enabled: true, // 是否启用触感反馈
    slideInterval: 100, // 🔥 增加滑动振动间隔 (ms)，减少过度振动（原80）
    slideThreshold: 20, // 🔥 增加触发振动的滑动距离阈值 (px)，减少干扰（原15）
  },
  // 音效配置
  sound: {
    enabled: true, // 是否启用滑动音效
    slideInterval: 150, // 🔥 增加音效间隔 (ms)，避免过于频繁（原120）
  },
};

// ============================================================
// 动画配置常量 - 易于调整的参数
// ============================================================
const ANIMATION_CONFIG = {
  // 洗牌动画
  shuffle: {
    duration: 3500, // 洗牌持续时间 (ms) - 与音效时长同步 (~3.5秒)
    soundDuration: 3500, // 音效时长 (ms)
    cardCount: 8, // 洗牌显示的牌数量
  },
  // 扇形铺开 (视觉展示用，实际抽牌从数据库78张牌随机)
  // 完整圆环布局: 牌围绕中心点形成 360 度圆环
  spread: {
    totalCards: 78, // 完整塔罗牌组 (78张)
    angleRange: [-175, 175], // 扇形角度范围 (度) - 350度圆环，留小缝隙避免首尾重叠
    pivotDistance: 260, // 旋转中心点距离牌底部的距离 (rpx) - 稍微缩小形成更紧凑的圆
    cardWidth: 32, // 牌宽度 (rpx) - 再缩小以适应完整圆环
    cardHeight: 52, // 牌高度 (rpx) - 保持比例
    duration: 1500, // 铺开动画时长 (ms) - 完整圆环需要更长时间
    staggerDelay: 10, // 每张牌延迟 (ms) - 缩短以保持总时长合理
  },
  // 选中牌飞出
  flyOut: {
    scale: 1.8, // 放大倍数
    duration: 500, // 飞出动画时长 (ms)
  },
  // 其他牌淡出
  fadeOut: {
    duration: 400, // 淡出时长 (ms)
    delay: 100, // 延迟开始 (ms)
  },
};

// ============================================================
// 工具函数
// ============================================================

/**
 * 计算扇形布局中每张牌的位置和角度
 * 经典扇形: 所有牌共享底部旋转中心点，仅通过旋转角度展开
 * @param {number} index - 牌的索引 (0-based)
 * @param {number} total - 总牌数
 * @param {Object} config - 扇形配置
 * @returns {Object} { angle, x, y, zIndex }
 */
function calculateFanPosition(index, total, config) {
  // ✅ 安全提取角度范围，防止 undefined 或非数组情况
  const angleRange = Array.isArray(config.angleRange)
    ? config.angleRange
    : [-55, 55];
  const minAngle = Number.isFinite(angleRange[0]) ? angleRange[0] : -55;
  const maxAngle = Number.isFinite(angleRange[1]) ? angleRange[1] : 55;

  // ✅ 兜底：保证 total 合法，至少为 2
  let safeTotal = Number(total);
  if (!Number.isFinite(safeTotal) || safeTotal < 2) {
    safeTotal = 2; // 避免除以 0 或 NaN
  }

  // ✅ 确保 index 是有效数字
  const safeIndex = Number.isFinite(Number(index)) ? Number(index) : 0;

  const angleStep = (maxAngle - minAngle) / (safeTotal - 1);
  const rawAngle = minAngle + angleStep * safeIndex;
  // ✅ 再兜底：如果仍然算出 NaN，就用 0 度
  const angle = Number.isFinite(rawAngle) ? rawAngle : 0;

  // 经典扇形布局: 不需要x/y偏移，所有牌通过共享的旋转中心点展开
  // x和y设为0，旋转效果完全由CSS transform-origin控制
  const x = 0;
  const y = 0;

  // z-index: 中间牌最高，两边递减（保证中间牌在最前面）
  const centerIndex = Math.floor(safeTotal / 2);
  const distanceFromCenter = Math.abs(safeIndex - centerIndex);
  const rawZIndex = safeTotal - distanceFromCenter;
  const zIndex = Number.isFinite(rawZIndex) ? rawZIndex : 1;

  return { angle, x, y, zIndex };
}

/**
 * 安全数值转换 - 确保返回有效数字，否则返回默认值
 * @param {*} value - 要转换的值
 * @param {number} defaultValue - 默认值
 * @param {number} decimals - 小数位数（可选，用于固定精度）
 * @returns {number} 有效数字
 */
function safeNumber(value, defaultValue = 0, decimals = null) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return defaultValue;
  }
  if (decimals !== null) {
    return parseFloat(num.toFixed(decimals));
  }
  return num;
}

/**
 * 生成扇形展示牌的初始数据
 */
function generateDeckCards(config) {
  const cards = [];
  const totalCards = config.spread.totalCards || 22;
  const staggerDelay = config.spread.staggerDelay || 25;

  for (let i = 0; i < totalCards; i++) {
    const pos = calculateFanPosition(i, totalCards, config.spread);

    // 使用 safeNumber 确保所有数值都是有效数字，避免 NaN
    // 角度保留2位小数，其他为整数
    cards.push({
      id: i,
      angle: safeNumber(pos.angle, 0, 2),
      x: safeNumber(pos.x, 0),
      y: safeNumber(pos.y, 0),
      zIndex: safeNumber(pos.zIndex, 1),
      isSpread: false, // 是否已铺开
      animationDelay: safeNumber(i * staggerDelay, 0),
      isChosen: false, // 是否被用户选中（用于高亮 + 动画）
      selectionOrder: 0, // 选择顺序（1-based），0表示未选中
    });
  }
  return cards;
}

/**
 * 解析结构化的AI解读文本，提取【标题】和内容
 * @param {string} text - AI返回的结构化文本
 * @returns {Array} 解析后的块数组 [{title, content}, ...]
 */
function parseInterpretation(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const blocks = [];
  // 匹配 【标题】 格式，支持多行内容
  const regex = /【([^】]+)】\s*([\s\S]*?)(?=【|$)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    if (title && content) {
      blocks.push({ title, content });
    }
  }

  // 如果没有解析到任何块，说明AI没有按格式输出，返回整体文本作为单块
  if (blocks.length === 0 && text.trim()) {
    blocks.push({ title: "解读", content: text.trim() });
  }

  return blocks;
}

/**
 * 根据不同牌阵生成专属专业框架（结构化输出）
 * 🔥 已优化：强调对用户问题的深度回应
 */
function buildPromptBySpread(spread, cardsInfo, question) {
  const spreadName = spread.name;

  // 🔥 优化后的通用输出格式 - 强调问题关联
  const outputFormat = `
【重要】你必须首先深入理解用户问题背后的真正关切和情绪需求，然后在每个解读部分都直接回应这个核心诉求。

请严格按照以下格式输出，使用【】包裹标题，每个部分独立成段：

【问题核心】
用3-5句话点明用户问题背后真正的关切是什么（情感需求、内心恐惧、渴望等）

【牌面解析】
分析每张牌的象征意义，【必须】将每张牌的含义与用户的问题直接关联，说明这张牌如何回应用户的困惑

【针对你的问题】
直接、具体地回应用户提出的问题，给出塔罗视角下的洞察（6-8句，这是最重要的部分）

【深层洞察】
揭示用户可能未意识到的内在模式或潜意识需求（5-7句）

【行动建议】
提供1-2条与用户问题直接相关的、具体可执行的行动建议`;

  // 🔥 问题分析引导 - 帮助 AI 更好理解问题
  const questionAnalysis = `
用户问题: "${question}"

请先在心中分析：
1. 用户真正想知道什么？（表面问题 vs 深层需求）
2. 这个问题反映了用户怎样的情绪状态？（焦虑、迷茫、期待、恐惧等）
3. 用户需要什么样的回应？（确认、方向、安慰、推动等）`;

  switch (spreadName) {
    case "Yes or No":
      return `请以塔罗象征学与心理分析方式解读此单张牌，重点回应用户的是非选择困惑。
${outputFormat}

抽取的牌:
${cardsInfo}
${questionAnalysis}`;

    case "得与失":
      return `请从塔罗象征与心理动力角度分析 "得到 vs 付出"，帮助用户看清选择的代价与收获。
${outputFormat}

抽取的牌:
${cardsInfo}
${questionAnalysis}`;

    case "时间之流":
    case "圣三角牌阵":
      return `请以 "过去 -> 现在 -> 趋势" 的时间线分析，帮助用户理解当前处境的来龙去脉，以及如何应对。
${outputFormat}

抽取的牌:
${cardsInfo}
${questionAnalysis}`;

    case "自我探索":
      return `请从塔罗象征与心理结构角度解析此四位置牌阵，帮助用户深入了解自己的内在状态。
${outputFormat}

抽取的牌:
${cardsInfo}
${questionAnalysis}`;

    case "身心灵牌阵":
      return `请从身体、情绪、精神三个层面分析用户的整体状态，找出失衡之处并给出平衡建议。
${outputFormat}

抽取的牌:
${cardsInfo}
${questionAnalysis}`;

    case "荣格原型":
      return `请以荣格心理结构 (自我、阴影、面具) 进行象征分析，帮助用户看见被压抑或忽视的部分。
${outputFormat}

抽取的牌:
${cardsInfo}
${questionAnalysis}`;

    case "二选一牌阵":
      return `请以塔罗象征学与决策心理学分析此选择议题，帮助用户看清两条路径的本质差异，而非简单给出答案。
${outputFormat}

抽取的牌:
${cardsInfo}
${questionAnalysis}`;

    case "内在天赋":
      return `请从成长心理学与能力结构角度分析，帮助用户发现自己的潜能与成长方向。
${outputFormat}

抽取的牌:
${cardsInfo}
${questionAnalysis}`;

    default:
      return `请根据塔罗象征与心理分析方式解读以下内容，务必紧扣用户问题进行回应:
${outputFormat}

${cardsInfo}
${questionAnalysis}`;
  }
}

Page({
  data: {
    navBarHeight: 0,
    // ========== 阶段控制 ==========
    // idle: 初始/问题输入
    // shuffling: 洗牌中
    // spreading: 扇形铺开中
    // selecting: 可选牌状态
    // selected: 已选中单牌(飞出放大)
    // result: 显示抽牌结果
    phase: "idle",

    // ========== 档案提示 ==========
    showProfileTip: false, // 是否显示档案完善提示

    // ========== 牌组数据 ==========
    deckCards: [], // 扇形展示牌的位置数据
    selectedCardIndex: -1, // 选中的牌索引（最后一张被选中的）

    // ========== 多卡抽取状态 ==========
    selectedCardIndices: [], // 已选中的所有牌索引
    drawnCards: [], // 已抽取的所有牌数据
    requiredCardCount: 4, // 当前牌阵需要抽取的牌数（默认自我探索=4张）
    remainingCardCount: 4, // 剩余需要抽取的牌数

    // ========== 选牌确认状态（原位放大确认机制）==========
    pendingConfirmIndex: -1, // 待确认的牌索引，-1表示无待确认
    pendingPositionName: "", // 待确认牌的位置名称（如"现状"、"外在"等）

    // ========== 原有业务数据 ==========
    cards: [1, 2, 3, 4, 5], // 牌阵中的位置编号(兼容旧逻辑)
    selectedIndex: -1,
    drawnCard: null, // 兼容单卡逻辑，保留第一张牌
    drawnCardIds: [], // 所有已抽取牌的数据库记录ID
    currentDrawId: null, // 兼容旧逻辑
    question: "",
    interpretation: "",
    interpretationBlocks: [], // 结构化解读块 [{title, content}, ...]
    todayCount: 0,
    loading: false,

    // ========== 动画状态 ==========
    isShuffling: false,
    hasShuffled: false,
    showFlyingCard: false, // 是否显示飞出的牌
    shuffleFadeOut: false, // 洗牌区域淡出过渡状态

    // ========== 聊天输入栏状态 ==========
    chatInputText: "", // 聊天输入框内容

    // ========== 手势交互状态 (Card Flow on Fixed Ring) ==========
    fanScale: 1.0, // 圆环缩放比例（仅缩放，不旋转）
    cardOffsetAngle: 0, // 卡牌偏移角度 (deg) - 控制卡牌沿圆环流动，支持360度无限旋转
    isDragging: false, // 是否正在拖动（用于禁用CSS过渡以获得实时响应）

    // ========== 配置数据 ==========
    animConfig: ANIMATION_CONFIG,
    questionTemplates: [
      "我和 TA 的关系接下来会怎样？",
      "我应该如何推进当前的工作/项目？",
      "在这个选择上，我需要注意什么风险？",
      "今天我最需要留意的内在声音是什么？",
    ],
    spreads: [
      {
        name: "Yes or No",
        count: 1,
        desc: "单张直觉给出方向，引导你理解当下能量，而不是绝对的结果。",
        keywords: [
          "吗",
          "能否",
          "是否",
          "是不是",
          "会不会",
          "要不要",
          "好不好",
          "行不行",
          "可不可以",
          "应不应该",
          "有没有必要",
          "要不要继续",
          "要不要开始",
          "能不能成功",
          "是不是合适",
        ],
        positions: ["答案"],
      },
      {
        name: "得与失",
        count: 2,
        desc: "帮助你看清在这个情境中，你可能得到什么、需要付出什么，是评估利弊的好工具。",
        keywords: [
          "值得",
          "利弊",
          "好处",
          "坏处",
          "得失",
          "风险",
          "收益",
          "代价",
          "成本",
          "回报",
          "是否划算",
          "究竟值不值得",
          "是否有价值",
        ],
        positions: ["得到", "付出"],
      },
      {
        name: "时间之流",
        count: 3,
        desc: "看见一个事情从过去、现在到未来的流动趋势，让你更理解整体的发展方向。",
        keywords: [
          "过去",
          "现在",
          "未来",
          "趋势",
          "发展",
          "走向",
          "接下来",
          "之后",
          "以前",
          "目前",
          "未来会怎样",
          "之后会发生什么",
          "会如何演变",
        ],
        positions: ["过去", "现在", "未来"],
      },
      {
        name: "圣三角牌阵",
        count: 3,
        desc: "经典的三点牌阵，从过去、现在、未来三个角度提供启发式建议。",
        keywords: [
          "过去",
          "现在",
          "未来",
          "趋势",
          "发展",
          "走向",
          "之后",
          "接下来",
          "未来会怎样",
          "事情会如何变化",
          "演变",
          "三角",
          "三角形",
          "三点牌阵",
        ],
        positions: ["过去", "现在", "未来"],
      },
      {
        name: "自我探索",
        count: 4,
        desc: "从现状、外在、内在到潜力，帮助你理解自己的当下状态与成长方向。",
        keywords: [
          "成长",
          "自我",
          "内在",
          "灵性",
          "使命",
          "方向",
          "潜能",
          "潜力",
          "觉察",
          "状态",
          "人生方向",
          "我现在的状态",
          "我是谁",
          "我应该成为什么样的人",
        ],
        positions: ["现状", "外在", "内在", "潜力"],
      },
      {
        name: "身心灵牌阵",
        count: 5,
        desc: "从身体、心、灵到建议与结果，提供全方位的疗愈与平衡视角。",
        keywords: [
          "身心",
          "身体",
          "健康",
          "心灵",
          "情绪",
          "疗愈",
          "放松",
          "压力",
          "疲惫",
          "不安",
          "能量",
          "如何调整自己",
          "我哪里不平衡",
          "如何恢复状态",
        ],
        positions: ["身", "心", "灵", "建议", "结果"],
      },
      {
        name: "荣格原型",
        count: 3,
        desc: "自我、阴影与面具三个层次，让你理解内在动力及心理能量结构。",
        keywords: [
          "原型",
          "阴影",
          "面具",
          "潜意识",
          "内在小孩",
          "心理",
          "真实的我",
          "隐藏的部分",
          "人格",
          "我的内在动力是什么",
        ],
        positions: ["自我", "阴影", "面具"],
      },
      {
        name: "二选一牌阵",
        count: 6,
        desc: "对比方案 A 与 B 的优劣，并从风险与建议中帮助你做出更清晰的选择。",
        keywords: [
          "选择",
          "两个选项",
          "A和B",
          "方案A",
          "方案B",
          "对比",
          "选择哪个",
          "取舍",
          "哪个更好",
          "哪个更适合",
          "我应该选哪一个",
        ],
        positions: ["选项A", "选项B", "A风险", "B风险", "建议", "结果"],
      },
      {
        name: "内在天赋",
        count: 6,
        desc: "从天赋、资源、阻碍、行动与潜力角度洞察你的职业与能力方向。",
        keywords: [
          "职业",
          "事业",
          "天赋",
          "擅长",
          "优势",
          "能力",
          "方向",
          "才能",
          "潜力",
          "专业",
          "我适合做什么",
          "换工作",
          "跳槽",
          "职业选择",
          "发展方向",
          "我适合的职业",
          "技能",
        ],
        positions: ["天赋", "资源", "阻碍", "行动", "潜力", "未来趋势"],
      },
    ],

    selectedSpread: {
      name: "自我探索",
      count: 4,
      desc: "现状 / 外在 / 内在 / 潜力。",
      positions: ["现状", "外在", "内在", "潜力"],
    },

    tarotCollection: "tarotDraws",
    cardBackUrl:
      "cloud://cloud1-5gc5jltwbcbef586.636c-cloud1-5gc5jltwbcbef586-1386967363/tarotCardsImages/tarotCardsBack/Back 1.webp",
  },

  // ============================================================
  // 生命周期方法
  // ============================================================

  onLoad(options) {
    // 初始化牌组数据
    this.initDeckCards();

    // 初始化默认牌阵的卡牌数量
    const defaultCardCount = this.data.selectedSpread?.count || 4;
    this.setData({
      requiredCardCount: defaultCardCount,
      remainingCardCount: defaultCardCount,
    });

    const shouldReset = options && options.reset === "1";
    if (shouldReset) {
      this.startNewDraw();
      this.fetchTodayCount();
    } else {
      this.checkTodayDraw();
      this.fetchTodayCount();
    }
    this.updateSpreadByQuestion();
    this.checkProfileTip();

    // 🖼️ 将卡背图片 cloud:// 转换为临时 URL（解决体验版图片不显示问题）
    this.convertCardBackUrl();
  },

  onNavReady(e) {
    this.setData({
      navBarHeight: e.detail.navBarHeight || 0,
    });
  },

  // 🖼️ 将卡背图片的 cloud:// 路径转换为临时 URL（使用智能缓存）
  async convertCardBackUrl() {
    const cloudUrl = this.data.cardBackUrl;
    if (!cloudUrl || !cloudUrl.startsWith("cloud://")) return;

    // 先尝试从 App 预加载缓存获取
    const app = getApp();
    const preloaded = app.globalData.preloadedImages?.[cloudUrl];
    if (preloaded) {
      console.log("[tarot] ✅ 使用App预加载的卡背URL");
      this.setData({ cardBackUrl: preloaded });
      return;
    }

    try {
      console.log("[tarot] 🖼️ 转换卡背临时URL...");
      // 使用智能缓存工具（自动缓存1.5小时）
      const tempUrl = await getTempUrlWithCache(cloudUrl);
      if (tempUrl && tempUrl !== cloudUrl) {
        this.setData({ cardBackUrl: tempUrl });
        console.log("[tarot] ✅ 卡背临时URL转换成功");
      }
    } catch (err) {
      console.warn("[tarot] ⚠️ 卡背URL转换失败:", err.message);
    }
  },

  // 检查是否需要显示档案完善提示
  checkProfileTip() {
    const profile = wx.getStorageSync("userProfile");
    // 如果没有出生日期，显示提示
    if (!profile || !profile.birthDate) {
      this.setData({ showProfileTip: true });
    }
  },

  // 跳转到个人档案页面
  goToProfileInfo() {
    wx.navigateTo({
      url: "/pages/profile/profile-info/profile-info",
    });
  },

  // 关闭档案提示
  closeProfileTip() {
    this.setData({ showProfileTip: false });
  },

  /**
   * 初始化牌组数据 - 生成扇形牌位信息
   */
  initDeckCards() {
    const cards = generateDeckCards(ANIMATION_CONFIG);
    this.setData({ deckCards: cards });
  },

  // ============================================================
  // 阶段控制方法 (Phase Control)
  // ============================================================

  /**
   * 切换到指定阶段
   * @param {string} newPhase - 目标阶段
   */
  setPhase(newPhase) {
    console.log(`[Tarot] Phase: ${this.data.phase} → ${newPhase}`);
    this.setData({ phase: newPhase });
  },

  // 检查今日是否已抽牌
  async checkTodayDraw() {
    const collection = this.data.tarotCollection;
    try {
      const today = new Date().toDateString();
      const res = await db
        .collection(collection)
        .where({
          _openid: "{openid}",
          date: today,
        })
        .orderBy("createTime", "desc")
        .limit(1)
        .get();

      if (res.data && res.data.length > 0) {
        const draw = res.data[0];
        // 获取塔罗牌详情
        const cardRes = await db
          .collection("tarotCards")
          .doc(draw.cardId)
          .get();

        const interpretationText = draw.interpretation || "";
        const blocks = parseInterpretation(interpretationText);
        this.setData({
          drawnCard: {
            ...cardRes.data,
            isReversed: !!draw.isReversed, // 恢复逆位状态
            image: draw.cardImage || cardRes.data?.image,
          },
          currentDrawId: draw._id, // 保存当前抽牌记录的ID
          question: draw.question || "",
          interpretation: interpretationText,
          interpretationBlocks: blocks,
        });
      }
    } catch (err) {
      if (err && err.errCode === -502005 && collection !== "tarotDraw") {
        this.setData({ tarotCollection: "tarotDraw" });
        return this.checkTodayDraw();
      }
      console.error("检查今日抽牌失败", err);
    }
  },

  // 获取今日抽牌次数
  async fetchTodayCount() {
    const collection = this.data.tarotCollection;
    try {
      const today = new Date().toDateString();
      const res = await db
        .collection(collection)
        .where({
          _openid: "{openid}",
          date: today,
        })
        .count();
      this.setData({
        todayCount: res.total || 0,
      });
    } catch (err) {
      if (err && err.errCode === -502005 && collection !== "tarotDraw") {
        this.setData({ tarotCollection: "tarotDraw" });
        return this.fetchTodayCount();
      }
      console.error("获取今日抽牌次数失败", err);
    }
  },

  // ============================================================
  // 扇形牌选择方法 (Fan Card Selection)
  // ============================================================

  /**
   * 点击扇形中的牌 - 原位放大显示确认UI，用户确认后才选牌
   * 🆕 增强防误触机制：需要满足严格的点击条件 + 原位确认
   */
  onFanCardTap(e) {
    if (this.data.phase !== "selecting") return;

    // 🆕 防误触检查 1：如果刚刚结束滑动/惯性动画，忽略此次点击
    const now = Date.now();
    if (this._lastGestureEndTime && now - this._lastGestureEndTime < 150) {
      console.log("[Tarot] Tap ignored: too close to gesture end");
      return;
    }

    // 🆕 防误触检查 2：如果正在惯性滑动中，忽略点击
    if (this._inertiaTimer) {
      console.log("[Tarot] Tap ignored: inertia scrolling");
      return;
    }

    // 🆕 防误触检查 3：如果正在拖动中，忽略点击
    if (this.data.isDragging) {
      console.log("[Tarot] Tap ignored: dragging");
      return;
    }

    // 🆕 防误触检查 4：检查是否是有效的点击（未移动太多距离）
    if (this._isTap === false) {
      console.log("[Tarot] Tap ignored: was a drag gesture");
      return;
    }

    // 确保 index 是数字类型（WeChat Mini Program 的 dataset 可能返回字符串）
    const index = Number(e.currentTarget.dataset.index);
    if (!Number.isFinite(index)) {
      console.warn(
        "[Tarot] Invalid card index:",
        e.currentTarget.dataset.index
      );
      return;
    }

    const { selectedCardIndices, pendingConfirmIndex } = this.data;

    // 如果点击的是当前待确认的牌，视为确认选择
    if (pendingConfirmIndex === index) {
      this._confirmCardSelection(index);
      return;
    }

    // 如果这张牌已经被选中，忽略
    if (selectedCardIndices.includes(index)) {
      wx.showToast({
        title: "这张牌已选过了",
        icon: "none",
        duration: 1000,
      });
      return;
    }

    // 触觉反馈 - 轻触反馈提示用户点击到了牌
    wx.vibrateShort({ type: "light" });

    // 🆕 设置待确认状态，在原位显示放大效果和位置名称
    const positionIndex = selectedCardIndices.length;
    const positionName =
      this.data.selectedSpread?.positions?.[positionIndex] ||
      `第${positionIndex + 1}张牌`;

    // 更新 deckCards 中对应牌的待确认状态
    const updatedDeckCards = this.data.deckCards.map((card, idx) => ({
      ...card,
      isPendingConfirm: idx === index,
    }));

    this.setData({
      pendingConfirmIndex: index,
      pendingPositionName: positionName,
      deckCards: updatedDeckCards,
    });

    console.log(
      `[Tarot] Card pending confirm: ${index}, position: ${positionName}`
    );
  },

  /**
   * 取消选牌确认 - 点击遮罩或取消按钮时调用
   */
  cancelCardConfirm() {
    // 清除待确认状态
    const updatedDeckCards = this.data.deckCards.map((card) => ({
      ...card,
      isPendingConfirm: false,
    }));

    this.setData({
      pendingConfirmIndex: -1,
      pendingPositionName: "",
      deckCards: updatedDeckCards,
    });

    // 轻触反馈
    wx.vibrateShort({ type: "light" });
    console.log("[Tarot] Card confirm cancelled");
  },

  /**
   * 确认选牌 - 点击确认按钮时调用
   */
  confirmCardSelection() {
    const { pendingConfirmIndex } = this.data;
    if (pendingConfirmIndex >= 0) {
      this._confirmCardSelection(pendingConfirmIndex);
    }
  },

  /**
   * 确认选牌 - 用户确认后真正执行选牌逻辑
   * @param {number} index - 选中的牌索引
   */
  _confirmCardSelection(index) {
    const {
      selectedCardIndices,
      requiredCardCount,
      remainingCardCount,
      deckCards,
    } = this.data;

    // 再次检查是否已被选中（防止重复确认）
    if (selectedCardIndices.includes(index)) {
      return;
    }

    // 触觉反馈 - 选牌确认时中等强度振动
    wx.vibrateShort({ type: "medium" });

    // 🆕 用户选牌后，取消放大保持计时器，立即重置缩放
    if (this._zoomHoldTimer) {
      clearTimeout(this._zoomHoldTimer);
      this._zoomHoldTimer = null;
      // 稍后重置缩放（给选牌动画一点时间）
      setTimeout(() => {
        this._resetScaleAndPosition();
      }, 300);
    }

    const newSelectedIndices = [...selectedCardIndices, index];
    const newRemainingCount = remainingCardCount - 1;

    // 更新每张牌的 isChosen 状态和选择顺序，用于高亮和显示顺序数字
    // 同时清除待确认状态（isPendingConfirm）
    const updatedDeckCards = deckCards.map((card, idx) => {
      const selectionIndex = newSelectedIndices.indexOf(idx);
      return {
        ...card,
        isChosen: selectionIndex !== -1,
        // 存储选择顺序（1-based），未选中的为0
        selectionOrder: selectionIndex !== -1 ? selectionIndex + 1 : 0,
        // 清除待确认状态
        isPendingConfirm: false,
      };
    });

    console.log(
      `[Tarot] Card confirmed: ${index}, remaining: ${newRemainingCount}/${requiredCardCount}`
    );

    this.setData({
      deckCards: updatedDeckCards,
      selectedCardIndices: newSelectedIndices,
      selectedCardIndex: index, // 记录最后选中的牌，用于飞出动画
      remainingCardCount: newRemainingCount,
      // 清除待确认状态
      pendingConfirmIndex: -1,
      pendingPositionName: "",
    });

    // 已选够所有牌 → 进入 selected 阶段，触发飞出动画
    if (newRemainingCount === 0) {
      this.setData({
        phase: "selected",
        showFlyingCard: true,
      });

      // 给飞出动画留时间，然后真正执行抽牌逻辑
      setTimeout(() => {
        this.performCardDraw();
      }, ANIMATION_CONFIG.flyOut.duration + 200);
    } else {
      wx.showToast({
        title: `还需选择 ${newRemainingCount} 张牌`,
        icon: "none",
        duration: 1500,
      });
    }
  },

  /**
   * 选择卡牌 (兼容旧的牌阵选择逻辑)
   */
  selectCard(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedIndex: index,
    });
  },

  // ============================================================
  // 洗牌动画方法 (Shuffle Animation)
  // ============================================================

  /**
   * 开始洗牌 - 入口方法
   * 流程: idle → shuffling → (音效播放完成后) → spreading → selecting
   * 音效时长约3.5秒，卡牌在音效播放完成后展示
   */
  startShuffle() {
    if (this.data.phase !== "idle") return;
    if (this.data.isShuffling || this.data.hasShuffled) return;

    // 触觉反馈 - 开始洗牌时振动
    wx.vibrateShort({ type: "medium" });

    // 进入洗牌阶段
    this.setPhase("shuffling");
    this.setData({ isShuffling: true, shuffleFadeOut: false });

    // 播放洗牌音效，音效完成后展示卡牌
    this.playShuffleSound(() => {
      // 音效播放完成，开始淡出过渡并展示卡牌
      this.setData({ shuffleFadeOut: true });

      // 短暂延迟后进入扇形铺开（让淡出动画有时间执行）
      setTimeout(() => {
        this.startSpreadAnimation();
      }, 650);
    });

    // 备用定时器：如果音效加载失败，确保流程继续
    const fallbackDuration = ANIMATION_CONFIG.shuffle.soundDuration + 500;
    this._shuffleFallbackTimer = setTimeout(() => {
      if (this.data.phase === "shuffling" && !this.data.shuffleFadeOut) {
        console.warn("[Tarot] 洗牌音效超时，使用备用定时器继续流程");
        this.setData({ shuffleFadeOut: true });
        setTimeout(() => {
          this.startSpreadAnimation();
        }, 650);
      }
    }, fallbackDuration);
  },

  /**
   * 开始扇形铺开动画
   * 从洗牌区域平滑过渡到扇形牌阵
   */
  startSpreadAnimation() {
    // 清除备用定时器（如果存在）
    if (this._shuffleFallbackTimer) {
      clearTimeout(this._shuffleFallbackTimer);
      this._shuffleFallbackTimer = null;
    }

    this.setPhase("spreading");
    this.setData({
      isShuffling: false,
      shuffleFadeOut: false,
    });

    // 标记所有牌开始铺开
    const deckCards = this.data.deckCards.map((card) => ({
      ...card,
      isSpread: true,
    }));
    this.setData({ deckCards });

    // 铺开动画完成后进入可选择状态
    const totalAnimTime =
      ANIMATION_CONFIG.spread.duration +
      ANIMATION_CONFIG.spread.totalCards * ANIMATION_CONFIG.spread.staggerDelay;
    setTimeout(() => {
      this.setPhase("selecting");
      this.setData({ hasShuffled: true });
    }, Math.min(totalAnimTime, 1500)); // 最多等待1.5秒
  },

  /**
   * 播放洗牌音效
   * @param {Function} onComplete - 音效播放完成后的回调函数
   * 音效约3.5秒，提前1.5秒触发回调以配合动画过渡
   */
  async playShuffleSound(onComplete) {
    const SHUFFLE_SOUND_FILE_ID =
      "cloud://cloud1-5gc5jltwbcbef586.636c-cloud1-5gc5jltwbcbef586-1386967363/tarot/Card shuffle sound effect.mp3";

    let hasTriggeredCallback = false;
    let earlyTriggerTimer = null;

    // 辅助函数：触发回调（确保只触发一次）
    const triggerCallback = (source) => {
      if (!hasTriggeredCallback) {
        hasTriggeredCallback = true;
        console.log(`[Tarot] 洗牌音效回调触发 (${source})`);
        if (typeof onComplete === "function") {
          onComplete();
        }
      }
    };

    try {
      // 🔄 获取临时 URL（InnerAudioContext 不支持 cloud:// 协议）
      console.log("[Tarot] 🔄 获取洗牌音效临时URL...");
      const res = await wx.cloud.getTempFileURL({
        fileList: [SHUFFLE_SOUND_FILE_ID],
      });
      const fileInfo = res?.fileList?.[0];

      if (fileInfo?.status !== 0 || !fileInfo?.tempFileURL) {
        console.warn("[Tarot] ⚠️ 获取音效URL失败:", fileInfo?.errMsg);
        triggerCallback("URL获取失败");
        return;
      }

      const audioUrl = encodeURI(fileInfo.tempFileURL);
      console.log("[Tarot] ✅ 音效临时URL获取成功");

      // 创建音频上下文并设置 HTTPS URL
      const innerAudioContext = wx.createInnerAudioContext();
      innerAudioContext.src = audioUrl;

      // 提前1.5秒触发回调，让音效与动画过渡更流畅
      const earlyTriggerDelay = ANIMATION_CONFIG.shuffle.soundDuration - 1500; // 约2秒后触发
      earlyTriggerTimer = setTimeout(() => {
        triggerCallback("提前触发");
      }, Math.max(earlyTriggerDelay, 1500)); // 至少等待1.5秒

      innerAudioContext.onEnded(() => {
        console.log("[Tarot] 洗牌音效播放完成");
        if (earlyTriggerTimer) clearTimeout(earlyTriggerTimer);
        innerAudioContext.destroy();
        triggerCallback("播放结束");
      });

      innerAudioContext.onError((err) => {
        console.warn("[Tarot] 洗牌音效播放失败", err);
        if (earlyTriggerTimer) clearTimeout(earlyTriggerTimer);
        innerAudioContext.destroy();
        triggerCallback("播放出错");
      });

      innerAudioContext.play();
    } catch (err) {
      console.error("[Tarot] ❌ 洗牌音效加载异常:", err);
      if (earlyTriggerTimer) clearTimeout(earlyTriggerTimer);
      triggerCallback("异常捕获");
    }
  },

  // ============================================================
  // 抽牌方法 (Card Drawing)
  // ============================================================

  /**
   * 执行抽牌 - 从扇形选中牌后调用
   * 用于新的扇形交互
   */
  async performCardDraw() {
    await this._executeCardDraw();
  },

  /**
   * 抽取塔罗牌 (兼容旧按钮触发)
   */
  async drawCard() {
    if (this.data.selectedIndex === -1) {
      wx.showToast({
        title: "请先选择一张牌",
        icon: "none",
      });
      return;
    }
    await this._executeCardDraw();
  },

  /**
   * 核心抽牌逻辑 - 支持动态多卡抽取
   * 根据当前牌阵的 count 属性决定抽取多少张牌
   */
  async _executeCardDraw() {
    // 限制每日最多抽取 999 次
    const today = new Date().toDateString();
    const collection = this.data.tarotCollection;
    const cardCount = this.data.requiredCardCount || 1;

    try {
      const countRes = await db
        .collection(collection)
        .where({
          _openid: "{openid}",
          date: today,
        })
        .count();

      if (countRes.total >= 999) {
        wx.showToast({
          title: "今日已达 999 次上限",
          icon: "none",
        });
        return;
      }
    } catch (err) {
      console.error("获取抽牌次数失败", err);
      wx.showToast({
        title: "请稍后再试～",
        icon: "none",
      });
      return;
    }

    wx.showLoading({ title: `正在打开 ${cardCount} 张牌...` });

    try {
      // 随机获取指定数量的塔罗牌（不重复）
      const res = await db
        .collection("tarotCards")
        .aggregate()
        .sample({ size: cardCount })
        .end();

      if (res.list && res.list.length > 0) {
        const cards = res.list;
        const drawIds = [];

        // 🚀 立即预加载即将显示的卡牌正面图片
        // 趁数据库保存期间预加载，让揭牌时图片已在缓存中
        cards.forEach((card) => {
          if (card.image) {
            wx.getImageInfo({
              src: card.image,
              success: () =>
                console.log("[Tarot] ✅ 预加载卡牌图片:", card.name),
              fail: () => console.warn("[Tarot] ⚠️ 预加载失败:", card.name),
            });
          }
        });

        // 为每张牌判定逆位并保存抽牌记录
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          const position =
            this.data.selectedSpread?.positions?.[i] || `位置${i + 1}`;

          // 🎲 逆位判定：30% 概率出现逆位
          const isReversed = Math.random() < REVERSED_RATE;
          // 保存逆位状态到卡牌对象
          card.isReversed = isReversed;

          let drawId = null;
          try {
            const addRes = await db.collection(collection).add({
              data: {
                cardId: card._id,
                cardName: card.name,
                position: position,
                positionIndex: i,
                isReversed: isReversed, // 保存逆位状态
                cardImage: card.image || "",
                date: today,
                createTime: db.serverDate(),
                question: this.data.question || "",
                interpretation: "",
                spread: this.data.selectedSpread?.name || "",
                spreadCount: cardCount,
                isMultiCard: cardCount > 1,
              },
            });
            drawId = addRes._id;
          } catch (err) {
            // 尝试备用集合
            if (err && err.errCode === -502005 && collection !== "tarotDraw") {
              try {
                this.setData({ tarotCollection: "tarotDraw" });
                const addRes = await db.collection("tarotDraw").add({
                  data: {
                    cardId: card._id,
                    cardName: card.name,
                    position: position,
                    positionIndex: i,
                    isReversed: isReversed, // 保存逆位状态
                    cardImage: card.image || "",
                    date: today,
                    createTime: db.serverDate(),
                    question: this.data.question || "",
                    interpretation: "",
                    spread: this.data.selectedSpread?.name || "",
                    spreadCount: cardCount,
                    isMultiCard: cardCount > 1,
                  },
                });
                drawId = addRes._id;
              } catch (err2) {
                if (
                  err2 &&
                  (err2.errCode === -502003 || err2.errCode === -502005)
                ) {
                  console.error("数据库权限未配置", err2);
                  throw new Error("DATABASE_PERMISSION_DENIED");
                }
                throw err2;
              }
            } else if (
              err &&
              (err.errCode === -502003 || err.errCode === -502005)
            ) {
              console.error("数据库权限未配置", err);
              throw new Error("DATABASE_PERMISSION_DENIED");
            } else {
              throw err;
            }
          }
          drawIds.push(drawId);
        }

        // 为每张牌添加位置信息（逆位状态已在上面循环中添加）
        const cardsWithPosition = cards.map((card, index) => ({
          ...card,
          position:
            this.data.selectedSpread?.positions?.[index] || `位置${index + 1}`,
          positionIndex: index,
        }));

        // 进入结果阶段
        this.setPhase("result");
        this.setData({
          drawnCards: cardsWithPosition,
          drawnCard: cards[0], // 兼容旧逻辑，保留第一张牌
          drawnCardIds: drawIds,
          currentDrawId: drawIds[0], // 兼容旧逻辑
          todayCount: this.data.todayCount + 1,
          showFlyingCard: false,
        });

        wx.hideLoading();
        wx.showToast({
          title: `成功抽取 ${cardCount} 张牌`,
          icon: "success",
        });
      }
    } catch (err) {
      console.error("抽取塔罗牌失败", err);
      wx.hideLoading();

      if (err && err.message === "DATABASE_PERMISSION_DENIED") {
        wx.showModal({
          title: "数据库权限未配置",
          content:
            "请在云开发控制台设置数据库权限。\n\n1. 打开云开发控制台\n2. 进入数据库\n3. 设置 tarotDraws 集合权限为【仅创建者可读写】\n\n详见《数据库权限配置指南.md》",
          showCancel: false,
          confirmText: "我知道了",
        });
      } else {
        wx.showToast({
          title: "抽取失败，请稍后再试",
          icon: "none",
        });
      }
    }
  },

  // 选择预设问题
  selectTemplate(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({ question: text }, () => {
      this.updateSpreadByQuestion();
    });
  },

  // 输入问题
  onQuestionInput(e) {
    this.setData(
      {
        question: e.detail.value,
      },
      () => {
        this.updateSpreadByQuestion();
      }
    );
  },

  // 根据问题推荐牌阵并刷新卡位
  updateSpreadByQuestion() {
    const q = (this.data.question || "").toLowerCase();
    // 默认自我探索
    let matched = this.data.spreads[4];

    if (q) {
      // 按关键词匹配九个牌阵，命中第一条即用
      for (const sp of this.data.spreads) {
        if (
          sp.keywords &&
          sp.keywords.some((k) => q.includes(k.toLowerCase()))
        ) {
          matched = sp;
          break;
        }
      }
    }

    const cards = Array.from({ length: matched.count }, (_, i) => i + 1);

    // 如果牌阵数量发生变化，需要重置洗牌状态
    const needResetShuffle =
      this.data.hasShuffled && this.data.cards.length !== cards.length;

    // 设置牌阵所需的卡牌数量
    const cardCount = matched.count || 1;

    this.setData({
      selectedSpread: matched,
      cards,
      selectedIndex: -1,
      // 设置动态卡牌数量
      requiredCardCount: cardCount,
      remainingCardCount: cardCount,
      // 重置已选卡牌
      selectedCardIndices: [],
      drawnCards: [],
      // 如果牌阵变化了，需要重新洗牌
      ...(needResetShuffle ? { hasShuffled: false } : {}),
    });
  },

  // ============================================================
  // AI 解读（流式输出）
  // ============================================================

  // 获取AI解读
  getInterpretation() {
    if (!this.data.question) {
      wx.showToast({ title: "请输入你的问题", icon: "none" });
      return;
    }

    if (
      !this.data.drawnCard &&
      (!this.data.drawnCards || this.data.drawnCards.length === 0)
    ) {
      wx.showToast({ title: "请先完成抽牌", icon: "none" });
      return;
    }

    // 触觉反馈 - 获取解读时振动
    wx.vibrateShort({ type: "medium" });

    this.setData({
      loading: true,
      interpretation: "",
      interpretationBlocks: [],
    });

    let prompt;
    const { drawnCards, drawnCard, selectedSpread, question } = this.data;

    // 多卡牌阵
    if (drawnCards && drawnCards.length > 1) {
      const cardsInfo = drawnCards
        .map((card) => {
          // 根据正逆位选择关键词和含义
          const keywords = card.isReversed
            ? card.reversedKeywords || card.keywords
            : card.keywords;
          const meaning = card.isReversed
            ? card.reversedMeaning || card.meaning
            : card.meaning;
          const positionText = card.isReversed ? "（逆位）" : "（正位）";

          return `位置: ${card.position}\n牌名: ${
            card.name
          }${positionText}\n关键词: ${keywords}\n含义: ${meaning || "待解读"}`;
        })
        .join("\n\n");

      prompt = buildPromptBySpread(selectedSpread, cardsInfo, question);
    } else {
      // 单卡
      const singleCard = drawnCards?.[0] || drawnCard;

      if (!singleCard) {
        wx.showToast({ title: "请先完成抽牌", icon: "none" });
        this.setData({ loading: false });
        return;
      }

      // 根据正逆位选择关键词和含义
      const keywords = singleCard.isReversed
        ? singleCard.reversedKeywords || singleCard.keywords
        : singleCard.keywords;
      const meaning = singleCard.isReversed
        ? singleCard.reversedMeaning || singleCard.meaning
        : singleCard.meaning;
      const positionText = singleCard.isReversed ? "（逆位）" : "（正位）";

      const cardsInfo = `牌名: ${singleCard.name}${positionText}\n关键词: ${keywords}\n含义: ${meaning}`;

      // 🔥 优化单卡 prompt - 强调回应用户问题
      prompt = `
【重要】请先深入理解用户问题背后的真正关切，然后用这张牌作为镜子，直接回应用户的困惑。

${cardsInfo}

用户问题: "${question}"

请先在心中分析：
1. 用户真正想知道什么？
2. 这个问题反映了用户怎样的情绪状态？
3. 这张牌如何直接回应用户的核心关切？

然后按格式输出，【针对你的问题】部分是最重要的，必须直接、温暖、有力地回应用户。
`;
    }

    // 获取用户个人信息上下文
    const profileContext = buildProfileContext({ type: "tarot" });

    // 🔥 优化后的 System Prompt - 强调深度回应用户问题
    const systemPrompt = `
你是一位资深塔罗心理咨询师，擅长通过塔罗象征深入理解来访者的内心世界。

【核心原则】
你的首要任务是【深刻回应用户的问题】，而不仅仅是解释牌面含义。
用户带着困惑来到你面前，你需要：
1. 真正听懂他们问题背后的情感需求
2. 用牌面象征作为桥梁，触及他们内心的真实关切
3. 让用户感到"被理解"和"被看见"

【解读风格】
- 温暖而有力量，像一位智慧的朋友在对话
- 直接回应问题，不绕弯子
- 用"你"来称呼用户，建立连接感
- 语言简洁有力，避免空泛的套话

【禁止内容】
- 禁止预测具体未来事件或时间
- 禁止涉及金钱数字、医疗诊断
- 禁止宿命论、恐吓性表达
${profileContext}

【输出格式】严格使用【标题】格式分块：

【问题核心】
直接具体回应用户问题（1-2句），然后点明用户问题背后真正的关切（1-2句）

【牌面解析】
每张牌的象征如何回应用户的困惑（每张牌3-5句，必须关联问题）

【针对你的问题】
直接、温暖、有力地回应用户提出的问题（5-7句，这是最重要的部分）

【深层洞察】
揭示用户可能未意识到的内在模式（2-3句）

【行动建议】
1-2条与问题直接相关的具体建议

【字数要求】总长度控制在350-600字
`;
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ];

    console.log("[tarot] 🔥 开始流式请求");

    // 🔥 使用流式调用
    this._currentStreamTask = callAIStream({
      messages,
      model: "gpt-5-mini",
      temperature: 1,
      onChunk: (_chunk, fullText) => {
        // 实时更新解读内容和解析后的块
        const blocks = parseInterpretation(fullText);
        this.setData({
          interpretation: fullText,
          interpretationBlocks: blocks,
        });
      },
      onComplete: async (fullText) => {
        console.log("[tarot] ✅ 流式输出完成");
        const blocks = parseInterpretation(fullText);
        this.setData({
          interpretation: fullText,
          interpretationBlocks: blocks,
          loading: false,
        });

        // 通过云函数更新抽牌记录（解决前端权限问题）
        if (this.data.currentDrawId) {
          const collection = this.data.tarotCollection;
          console.log("[tarot] 准备更新记录:", {
            collection,
            docId: this.data.currentDrawId,
          });
          try {
            const res = await wx.cloud.callFunction({
              name: "updateTarotDraw",
              data: {
                drawId: this.data.currentDrawId,
                collection,
                data: {
                  question: this.data.question,
                  interpretation: fullText,
                },
              },
            });
            if (res.result && res.result.success) {
              console.log("[tarot] ✅ 更新解读成功:", res.result);
            } else {
              console.warn("[tarot] ⚠️ 更新解读返回失败:", res.result);
            }
          } catch (updateErr) {
            console.error("更新解读失败", updateErr);
          }
        }
        this._currentStreamTask = null;
      },
      onError: (err) => {
        console.error("[tarot] ❌ 获取解读失败:", err.message);
        // 使用兜底文案
        const cardName =
          drawnCards?.[0]?.name || this.data.drawnCard?.name || "这张牌";
        const cardKeywords =
          drawnCards?.[0]?.keywords ||
          this.data.drawnCard?.keywords ||
          "你最近关注的主题";

        const fallback = `【温柔提醒】
${cardName} 在此刻出现，更像是一个温柔的提醒，而不是对未来的预言。

【当下觉察】
它邀请你回到当下，留意自己最近在 ${cardKeywords} 相关领域的感受和选择。

【行动建议】
给自己一点时间，写下此刻最在意的三件事，或者用冥想的方式，和这张牌待在一起几分钟。慢慢来，你有足够的时间去理解这些讯息。`;

        const blocks = parseInterpretation(fallback);
        this.setData({
          interpretation: fallback,
          interpretationBlocks: blocks,
          loading: false,
        });
        this._currentStreamTask = null;
      },
    });
  },

  // ============================================================
  // 重置方法 (Reset)
  // ============================================================

  /**
   * 重新抽取 - 完全重置到初始状态
   */
  resetDraw() {
    // 重新初始化牌组
    this.initDeckCards();

    // 获取默认牌阵的卡牌数量
    const defaultSpread = this.data.spreads[4]; // 默认自我探索
    const defaultCardCount = defaultSpread?.count || 4;

    // 重置所有状态（包括多卡状态）
    this.setData({
      phase: "idle",
      selectedIndex: -1,
      selectedCardIndex: -1,
      // 多卡状态重置
      selectedCardIndices: [],
      drawnCards: [],
      drawnCardIds: [],
      requiredCardCount: defaultCardCount,
      remainingCardCount: defaultCardCount,
      // 选牌确认状态重置
      pendingConfirmIndex: -1,
      pendingPositionName: "",
      // 原有状态重置
      drawnCard: null,
      currentDrawId: null,
      question: "",
      interpretation: "",
      interpretationBlocks: [], // 重置解读块
      hasShuffled: false,
      isShuffling: false,
      showFlyingCard: false,
      shuffleFadeOut: false,
      // 重置牌阵为默认
      selectedSpread: defaultSpread,
      // 重置手势状态
      fanScale: 1.0,
      cardOffsetAngle: 0,
    });

    // 停止吸附动画
    if (this._snapTimer) {
      clearTimeout(this._snapTimer);
      this._snapTimer = null;
    }

    // 重置后刷新今日已抽次数
    this.fetchTodayCount();
  },

  /**
   * 开始新的抽牌流程
   */
  startNewDraw() {
    this.resetDraw();
  },

  // ============================================================
  // 聊天输入栏方法 (Chat Input Bar)
  // ============================================================

  /**
   * 聊天输入框内容变化
   */
  onChatInput(e) {
    this.setData({
      chatInputText: e.detail.value,
    });
  },

  /**
   * 点击发送按钮 - 发送问题并获取解读
   */
  async onChatSend() {
    const text = this.data.chatInputText.trim();
    if (!text) {
      wx.showToast({
        title: "请输入你的问题",
        icon: "none",
      });
      return;
    }

    // 将输入内容设置为问题
    this.setData({
      question: text,
      chatInputText: "", // 清空输入框
    });

    // 自动获取解读
    await this.getInterpretation();
  },

  /**
   * 点击麦克风按钮 - 语音输入 (预留功能)
   */
  onMicTap() {
    wx.showToast({
      title: "语音输入功能即将上线",
      icon: "none",
      duration: 1500,
    });
  },

  /**
   * 点击 + 按钮 - 显示更多选项 (预留功能)
   */
  onPlusButtonTap() {
    wx.showActionSheet({
      itemList: ["拍照", "从相册选择", "更换牌阵"],
      success: (res) => {
        if (res.tapIndex === 2) {
          // 更换牌阵 - 重新开始
          this.resetDraw();
        }
      },
    });
  },

  // ============================================================
  // 手势交互方法 - Card Flow on Fixed Ring (优化版 - 惯性滑动 + 触感 + 音效)
  // ============================================================

  /**
   * 触摸开始 - 记录初始触摸点
   * 🔥 精修版：分层交互模型
   */
  onFanTouchStart(e) {
    if (this.data.phase !== "selecting" && this.data.phase !== "spreading")
      return;

    const touches = e.touches;
    const now = Date.now();
    this._touchStartTime = now;
    this._isTap = true;
    this._touchStartX = touches[0].clientX;
    this._touchStartY = touches[0].clientY;
    this._lastTouchX = touches[0].clientX;
    this._lastTouchTime = now;

    // 惯性滑动相关
    this._velocityX = 0;
    this._velocityHistory = [];

    // 触感反馈相关
    this._lastHapticTime = 0;
    this._accumulatedSlide = 0;

    // 音效相关
    this._lastSoundTime = 0;

    // 🔥 初始化内部角度变量
    this._rawAngle = this.data.cardOffsetAngle;

    // 🔥 标记是否需要渲染更新
    this._needsRender = false;
    this._renderScheduled = false;

    if (touches.length === 1) {
      this._gestureMode = "cardFlow";

      // 设置拖动状态 - 禁用 CSS 过渡
      this.setData({ isDragging: true });

      // 停止惯性动画
      if (this._inertiaTimer) {
        clearTimeout(this._inertiaTimer);
        this._inertiaTimer = null;
      }

      // 停止吸附动画
      if (this._snapTimer) {
        clearTimeout(this._snapTimer);
        this._snapTimer = null;
      }

      // 🔥 启动渲染循环
      this._startRenderLoop();
    } else if (touches.length === 2) {
      this._gestureMode = "pinch";
      this._isTap = false;
      const distance = this._getDistance(touches[0], touches[1]);
      this._initialPinchDistance = distance;
      this._initialScale = this.data.fanScale;
      this._scaleStartOffset = this.data.cardOffsetAngle;
    }
  },

  /**
   * 🔥 启动渲染循环 - 固定 60fps 更新视图
   */
  _startRenderLoop() {
    if (this._renderLoopTimer) return;

    const renderLoop = () => {
      if (this._needsRender) {
        this._needsRender = false;
        this.setData({ cardOffsetAngle: this._rawAngle });
      }

      // 只有在拖动状态下继续循环
      if (this.data.isDragging) {
        this._renderLoopTimer = setTimeout(renderLoop, 16);
      } else {
        this._renderLoopTimer = null;
      }
    };

    this._renderLoopTimer = setTimeout(renderLoop, 16);
  },

  /**
   * 触摸移动 - 处理缩放或卡牌流动
   * 🔥 精修版：onFanTouchMove 中不直接调用 setData
   * 只更新内部变量，由渲染循环统一更新视图
   */
  onFanTouchMove(e) {
    if (this.data.phase !== "selecting" && this.data.phase !== "spreading")
      return;

    const touches = e.touches;
    const now = Date.now();

    // 双指缩放处理（低频操作，保留 setData）
    if (this._gestureMode === "pinch" && touches.length === 2) {
      const currentDistance = this._getDistance(touches[0], touches[1]);
      const scaleDelta = currentDistance / this._initialPinchDistance;
      let newScale = this._initialScale * scaleDelta;

      newScale = Math.max(
        GESTURE_CONFIG.zoom.minScale,
        Math.min(GESTURE_CONFIG.zoom.maxScale, newScale)
      );

      this.setData({ fanScale: newScale });
      return;
    }

    // 卡牌流动处理 - 🔥 只更新内部变量，不调用 setData
    if (this._gestureMode === "cardFlow" && touches.length === 1) {
      const currentX = touches[0].clientX;
      const currentY = touches[0].clientY;
      const deltaX = currentX - this._lastTouchX;
      const deltaTime = now - this._lastTouchTime;

      // 判定是否超过点击阈值
      const totalDeltaX = currentX - this._touchStartX;
      const totalDeltaY = currentY - this._touchStartY;
      if (
        Math.abs(totalDeltaX) > GESTURE_CONFIG.touch.tapThreshold ||
        Math.abs(totalDeltaY) > GESTURE_CONFIG.touch.tapThreshold
      ) {
        this._isTap = false;
      }

      // 🔥 只更新内部角度变量（不调用 setData）
      const sensitivity = GESTURE_CONFIG.cardFlow.sensitivity;
      const deltaAngle = deltaX * sensitivity;
      this._rawAngle += deltaAngle;

      // 🔥 标记需要渲染（由渲染循环统一处理）
      this._needsRender = true;

      // 计算速度（用于惯性滑动）- 单位: px/ms
      if (deltaTime > 0) {
        const instantVelocity = deltaX / deltaTime;
        const clampedVelocity = Math.max(
          -GESTURE_CONFIG.cardFlow.inertia.maxVelocity,
          Math.min(GESTURE_CONFIG.cardFlow.inertia.maxVelocity, instantVelocity)
        );

        this._velocityHistory.push({
          velocity: clampedVelocity,
          time: now,
        });
        if (this._velocityHistory.length > 5) {
          this._velocityHistory.shift();
        }
      }

      // 累积滑动距离（用于触感反馈）
      this._accumulatedSlide += Math.abs(deltaX);

      // 触感反馈
      if (GESTURE_CONFIG.haptic.enabled) {
        if (
          this._accumulatedSlide >= GESTURE_CONFIG.haptic.slideThreshold &&
          now - this._lastHapticTime >= GESTURE_CONFIG.haptic.slideInterval
        ) {
          wx.vibrateShort({ type: "light" });
          this._lastHapticTime = now;
          this._accumulatedSlide = 0;
        }
      }

      // 滑动音效
      if (GESTURE_CONFIG.sound.enabled) {
        if (
          Math.abs(deltaX) > 2 &&
          now - this._lastSoundTime >= GESTURE_CONFIG.sound.slideInterval
        ) {
          this._playSlideSound();
          this._lastSoundTime = now;
        }
      }

      // 更新上一次触摸位置
      this._lastTouchX = currentX;
      this._lastTouchTime = now;
    }
  },

  /**
   * 触摸结束 - 处理点击判定、惯性滑动和缩放重置
   * 🔥 精修版：停止渲染循环，启动惯性或吸附
   */
  onFanTouchEnd() {
    if (this.data.phase !== "selecting" && this.data.phase !== "spreading")
      return;

    // 🔥 停止渲染循环
    if (this._renderLoopTimer) {
      clearTimeout(this._renderLoopTimer);
      this._renderLoopTimer = null;
    }

    const touchDuration = Date.now() - this._touchStartTime;

    // 判断是否是点击（用于选牌）
    if (this._isTap && touchDuration < GESTURE_CONFIG.touch.tapTimeThreshold) {
      this.setData({ isDragging: false });
      this._gestureMode = null;
      return;
    }

    // 双指缩放结束
    if (this._gestureMode === "pinch") {
      this.setData({ isDragging: false });
      if (this.data.fanScale > 1.1 && GESTURE_CONFIG.zoom.autoResetEnabled) {
        if (this._zoomHoldTimer) {
          clearTimeout(this._zoomHoldTimer);
        }
        this._zoomHoldTimer = setTimeout(() => {
          this._resetScaleAndPosition();
          this._zoomHoldTimer = null;
        }, GESTURE_CONFIG.zoom.holdDuration);
      } else {
        this._resetScaleAndPosition();
      }
      this._gestureMode = null;
      return;
    }

    // 卡牌流动结束 - 🔥 启动惯性滑动或吸附
    if (this._gestureMode === "cardFlow") {
      const avgVelocity = this._calculateAverageVelocity();

      if (
        GESTURE_CONFIG.cardFlow.inertia.enabled &&
        Math.abs(avgVelocity) > GESTURE_CONFIG.cardFlow.inertia.minVelocity
      ) {
        this._startInertiaScroll(avgVelocity);
      } else if (GESTURE_CONFIG.cardFlow.snapEnabled) {
        this._snapAndFinalize();
      } else {
        this._finalizeAngle(this._rawAngle);
      }

      this._lastGestureEndTime = Date.now();
    }

    this._gestureMode = null;
  },

  /**
   * 计算两个触摸点之间的距离
   */
  _getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * 计算平均速度（用于惯性滑动）
   */
  _calculateAverageVelocity() {
    if (!this._velocityHistory || this._velocityHistory.length === 0) {
      return 0;
    }
    const sum = this._velocityHistory.reduce((acc, v) => acc + v.velocity, 0);
    return sum / this._velocityHistory.length;
  },

  /**
   * 🔥 更新内部角度变量 - 禁止 setData
   * 拖动与惯性阶段只更新内部变量，视觉更新在 _finalizeAngle 中统一处理
   * @param {number} angle - 当前角度
   */
  _applyAngleToView(angle) {
    // 仅更新内部变量，不做任何 setData
    this._rawAngle = angle;
  },

  /**
   * 🔥 最终同步角度到 Page data - 唯一允许 setData 的地方
   * @param {number} angle - 最终角度
   */
  _finalizeAngle(angle) {
    this._rawAngle = angle;
    this.setData({
      cardOffsetAngle: angle,
      isDragging: false,
    });
  },

  /**
   * 🔥 吸附并最终同步 - 统一的吸附逻辑（无限圆环模型）
   * 使用 easeOutQuart 缓动实现平滑吸附，避免"回拽感"
   */
  _snapAndFinalize() {
    const totalCards = ANIMATION_CONFIG.spread.totalCards;
    const angleRange = ANIMATION_CONFIG.spread.angleRange;
    const totalAngle = angleRange[1] - angleRange[0];
    const angleStep = totalAngle / (totalCards - 1);

    // 使用内部变量计算目标角度（无限圆环，不取模）
    const currentOffset = this._rawAngle;
    const nearestStep = Math.round(currentOffset / angleStep);
    const snapOffset = nearestStep * angleStep;
    const deltaOffset = snapOffset - currentOffset;

    // 如果偏移量极小，直接同步
    if (Math.abs(deltaOffset) < 0.3) {
      this._finalizeAngle(snapOffset);
      return;
    }

    // 平滑吸附动画 - 使用时间驱动的缓动
    const startOffset = currentOffset;
    const duration = GESTURE_CONFIG.cardFlow.snapDuration;
    const startTime = Date.now();

    const animateSnap = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutQuart 缓动 - 快速启动，平滑停止
      const eased = 1 - Math.pow(1 - progress, 4);
      this._rawAngle = startOffset + deltaOffset * eased;

      if (progress < 1) {
        // 吸附过程中实时更新视图
        this.setData({ cardOffsetAngle: this._rawAngle });
        this._snapTimer = setTimeout(animateSnap, 16);
      } else {
        this._snapTimer = null;
        this._finalizeAngle(snapOffset);
      }
    };

    this._snapTimer = setTimeout(animateSnap, 16);
  },

  /**
   * 启动惯性滑动（支持360度无限旋转）
   * 🔥 精修版：统一物理模型 - velocity 单位为 deg/frame (16ms)
   * @param {number} initialVelocityPx - 初始速度 (px/ms)
   */
  _startInertiaScroll(initialVelocityPx) {
    const friction = GESTURE_CONFIG.cardFlow.inertia.friction;
    const sensitivity = GESTURE_CONFIG.cardFlow.sensitivity;

    // 🔥 将 px/ms 速度转换为 deg/frame 速度（统一单位）
    // 每帧 16ms，所以 velocity_deg_per_frame = velocity_px_per_ms * sensitivity * 16
    let velocityDegPerFrame = initialVelocityPx * sensitivity * 16;

    // 最小速度阈值（deg/frame）
    const minVelocityDegPerFrame = 0.1;

    const animateInertia = () => {
      // 应用摩擦力（每帧固定衰减）
      velocityDegPerFrame *= friction;

      // 速度低于阈值时停止
      if (Math.abs(velocityDegPerFrame) < minVelocityDegPerFrame) {
        this._inertiaTimer = null;
        this._lastGestureEndTime = Date.now();

        // 惯性结束后吸附
        if (GESTURE_CONFIG.cardFlow.snapEnabled) {
          this._snapAndFinalize();
        } else {
          this._finalizeAngle(this._rawAngle);
        }
        return;
      }

      // 更新角度（直接加 deg/frame，无需乘 deltaTime）
      this._rawAngle += velocityDegPerFrame;

      // 惯性过程中实时更新视图
      this.setData({ cardOffsetAngle: this._rawAngle });

      // 继续动画
      this._inertiaTimer = setTimeout(animateInertia, 16);
    };

    this._inertiaTimer = setTimeout(animateInertia, 16);
  },

  /**
   * 重置缩放和位置 - 缩放结束后平滑回到默认状态
   */
  _resetScaleAndPosition() {
    const startScale = this.data.fanScale;
    const targetScale = GESTURE_CONFIG.zoom.defaultScale;
    const duration = GESTURE_CONFIG.zoom.resetDuration;
    const startTime = Date.now();

    // 轻微振动反馈
    wx.vibrateShort({ type: "light" });

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutBack 缓动函数 - 带轻微回弹效果
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const eased =
        1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);

      const newScale = startScale + (targetScale - startScale) * eased;
      this.setData({ fanScale: newScale });

      if (progress < 1) {
        this._scaleResetTimer = setTimeout(animate, 16);
      } else {
        this._scaleResetTimer = null;
        // 确保最终值精确
        this.setData({ fanScale: targetScale });
      }
    };

    animate();
  },

  /**
   * 播放滑动音效 - 轻微的卡牌滑动声
   */
  _playSlideSound() {
    // 使用简单的系统音效，避免加载外部音频文件
    // 微信小程序没有内置的滑动音效，这里使用轻触反馈代替
    // 如果需要真实音效，可以预加载一个短音频文件
    if (!this._slideAudioContext) {
      // 创建音频上下文（可选：预加载一个短音效文件）
      // 这里暂时不播放音效，只依赖触感反馈
      // 如果需要音效，可以在 onLoad 中预加载音频
      return;
    }

    try {
      this._slideAudioContext.seek(0);
      this._slideAudioContext.play();
    } catch (err) {
      // 忽略音效播放错误
    }
  },

  /**
   * 预加载滑动音效（可选）
   */
  _preloadSlideSound() {
    // 如果有滑动音效文件，可以在这里预加载
    // const SLIDE_SOUND_URL = "cloud://...";
    // this._slideAudioContext = wx.createInnerAudioContext();
    // this._slideAudioContext.src = SLIDE_SOUND_URL;
    // this._slideAudioContext.volume = 0.3;
  },

  /**
   * 重置手势状态（在重新抽牌时调用）
   * 🔥 精修版：清除所有内部变量和计时器
   */
  _resetGestureState() {
    this.setData({
      fanScale: GESTURE_CONFIG.zoom.defaultScale,
      cardOffsetAngle: 0,
      isDragging: false,
    });

    // 重置内部角度变量
    this._rawAngle = 0;
    this._needsRender = false;

    // 清除所有计时器
    if (this._snapTimer) {
      clearTimeout(this._snapTimer);
      this._snapTimer = null;
    }

    if (this._inertiaTimer) {
      clearTimeout(this._inertiaTimer);
      this._inertiaTimer = null;
    }

    if (this._scaleResetTimer) {
      clearTimeout(this._scaleResetTimer);
      this._scaleResetTimer = null;
    }

    if (this._zoomHoldTimer) {
      clearTimeout(this._zoomHoldTimer);
      this._zoomHoldTimer = null;
    }

    // 🔥 清除渲染循环计时器
    if (this._renderLoopTimer) {
      clearTimeout(this._renderLoopTimer);
      this._renderLoopTimer = null;
    }

    this._lastGestureEndTime = null;
  },
});
