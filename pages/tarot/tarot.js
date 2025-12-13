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
  // 经典扇形布局: 牌从底部中心点向上展开
  spread: {
    totalCards: 22, // 视觉展示牌数 (22张大阿卡纳)
    angleRange: [-55, 55], // 扇形角度范围 (度) - 110度的扇形
    pivotDistance: 350, // 旋转中心点距离牌底部的距离 (rpx)
    cardWidth: 60, // 牌宽度 (rpx)
    cardHeight: 96, // 牌高度 (rpx)
    duration: 800, // 铺开动画时长 (ms)
    staggerDelay: 25, // 每张牌延迟 (ms)
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
 */
function buildPromptBySpread(spread, cardsInfo, question) {
  const spreadName = spread.name;

  // 通用输出格式说明
  const outputFormat = `
请严格按照以下格式输出，使用【】包裹标题，每个部分独立成段：

【整体主题】
2-3句话概括解读核心

【牌面解析】
分析抽到的塔罗牌的象征意义，每一张塔罗牌用2-3句话阐述

【深层洞察】
揭示牌面之间的关联与深层含义（3-4句）

【行动建议】
提供1-2条具体可执行的建议`;

  switch (spreadName) {
    case "Yes or No":
      return `请以塔罗象征学与心理分析方式解读此单张牌。
${outputFormat}

抽取的牌:
${cardsInfo}

用户问题: ${question}`;

    case "得与失":
      return `请从塔罗象征与心理动力角度分析 "得到 vs 付出"。
${outputFormat}

抽取的牌:
${cardsInfo}

用户问题: ${question}`;

    case "时间之流":
    case "圣三角牌阵":
      return `请以 "过去 -> 现在 -> 趋势" 的方式进行心理分析。
${outputFormat}

抽取的牌:
${cardsInfo}

用户问题: ${question}`;

    case "自我探索":
      return `请从塔罗象征与心理结构角度解析此四位置牌阵。
${outputFormat}

抽取的牌:
${cardsInfo}

用户问题: ${question}`;

    case "身心灵牌阵":
      return `请从能量平衡与整体结构分析此五位置牌阵。
${outputFormat}

抽取的牌:
${cardsInfo}

用户问题: ${question}`;

    case "荣格原型":
      return `请以荣格心理结构 (自我, 阴影, 面具) 进行象征分析。
${outputFormat}

抽取的牌:
${cardsInfo}

用户问题: ${question}`;

    case "二选一牌阵":
      return `请以塔罗象征学与决策心理学分析此选择议题。
${outputFormat}

抽取的牌:
${cardsInfo}

用户问题: ${question}`;

    case "内在天赋":
      return `请从成长心理学与能力结构角度分析此六位置牌阵。
${outputFormat}

抽取的牌:
${cardsInfo}

用户问题: ${question}`;

    default:
      return `请根据塔罗象征与心理分析方式解读以下内容:
${outputFormat}

${cardsInfo}

用户问题: ${question}`;
  }
}

Page({
  data: {
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

    // ========== 原有业务数据 ==========
    cards: [1, 2, 3, 4, 5], // 牌阵中的位置编号(兼容旧逻辑)
    selectedIndex: -1,
    drawnCard: null, // 兼容单卡逻辑，保留第一张牌
    drawnCardIds: [], // 所有已抽取牌的数据库记录ID
    currentDrawId: null, // 兼容旧逻辑
    question: "",
    actionText: "",
    actionPlan: "",
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
          drawnCard: cardRes.data,
          currentDrawId: draw._id, // 保存当前抽牌记录的ID
          question: draw.question || "",
          actionPlan: draw.actionPlan || "",
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
   * 点击扇形中的牌 - 支持多卡选择 + 高亮 + 飞出动画
   */
  onFanCardTap(e) {
    if (this.data.phase !== "selecting") return;

    // 确保 index 是数字类型（WeChat Mini Program 的 dataset 可能返回字符串）
    const index = Number(e.currentTarget.dataset.index);
    if (!Number.isFinite(index)) {
      console.warn(
        "[Tarot] Invalid card index:",
        e.currentTarget.dataset.index
      );
      return;
    }

    const {
      selectedCardIndices,
      requiredCardCount,
      remainingCardCount,
      deckCards,
    } = this.data;

    // 如果这张牌已经被选中，忽略
    if (selectedCardIndices.includes(index)) {
      wx.showToast({
        title: "这张牌已选过了",
        icon: "none",
        duration: 1000,
      });
      return;
    }

    // 触觉反馈 - 选牌时轻触振动
    wx.vibrateShort({ type: "light" });

    const newSelectedIndices = [...selectedCardIndices, index];
    const newRemainingCount = remainingCardCount - 1;

    // 更新每张牌的 isChosen 状态和选择顺序，用于高亮和显示顺序数字
    // 确保比较时使用相同的数字类型
    const updatedDeckCards = deckCards.map((card, idx) => {
      const selectionIndex = newSelectedIndices.indexOf(idx);
      return {
        ...card,
        isChosen: selectionIndex !== -1,
        // 存储选择顺序（1-based），未选中的为0
        selectionOrder: selectionIndex !== -1 ? selectionIndex + 1 : 0,
      };
    });

    console.log(
      `[Tarot] Card tapped: ${index}, remaining: ${newRemainingCount}/${requiredCardCount}`
    );

    this.setData({
      deckCards: updatedDeckCards,
      selectedCardIndices: newSelectedIndices,
      selectedCardIndex: index, // 记录最后选中的牌，用于飞出动画
      remainingCardCount: newRemainingCount,
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
      }, 300);
    });

    // 备用定时器：如果音效加载失败，确保流程继续
    const fallbackDuration = ANIMATION_CONFIG.shuffle.soundDuration + 500;
    this._shuffleFallbackTimer = setTimeout(() => {
      if (this.data.phase === "shuffling" && !this.data.shuffleFadeOut) {
        console.warn("[Tarot] 洗牌音效超时，使用备用定时器继续流程");
        this.setData({ shuffleFadeOut: true });
        setTimeout(() => {
          this.startSpreadAnimation();
        }, 300);
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

        // 为每张牌保存抽牌记录
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          const position =
            this.data.selectedSpread?.positions?.[i] || `位置${i + 1}`;

          let drawId = null;
          try {
            const addRes = await db.collection(collection).add({
              data: {
                cardId: card._id,
                cardName: card.name,
                position: position,
                positionIndex: i,
                date: today,
                createTime: db.serverDate(),
                question: this.data.question || "",
                actionPlan: this.data.actionPlan || "",
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
                    date: today,
                    createTime: db.serverDate(),
                    question: this.data.question || "",
                    actionPlan: this.data.actionPlan || "",
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

        // 为每张牌添加位置信息
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
        .map(
          (card) =>
            `位置: ${card.position}\n牌名: ${card.name}\n关键词: ${
              card.keywords
            }\n含义: ${card.meaning || "待解读"}`
        )
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

      const cardsInfo = `牌名: ${singleCard.name}\n关键词: ${singleCard.keywords}\n含义: ${singleCard.meaning}`;

      prompt = `
请从塔罗象征学与心理动力角度分析此单张牌。

${cardsInfo}

用户问题: ${question}

重点内容:
1. 核心象征主题
2. 用户当下的心理动力
3. 与问题的关键关联
4. 可采取的行动建议
`;
    }

    // 获取用户个人信息上下文
    const profileContext = buildProfileContext({ type: "tarot" });

    const systemPrompt = `
你是一位专业塔罗解读师。
风格稳重、有力量、深刻，专注心理象征与自我觉察。
禁止预测未来, 禁止具体时间, 禁止金钱或医疗内容。
${profileContext}

输出格式要求（必须严格遵循）:
使用【标题】格式分块输出，每个部分独立成段，标题与内容之间换行。

输出结构:
【整体主题】
2-3句话概括此次解读的核心主题

【牌面解析】
分析抽到的塔罗牌的象征意义，每一张塔罗牌用2-3句话阐述

【深层洞察】
揭示潜意识需求或核心议题（3-4句）

【行动建议】
提供1-2条具体可执行的建议

内容要求:
1. 提供洞察, 不作未来预测
2. 内容清晰、有力量、理性
3. 避免恐吓、宿命论或夸大表达
4. 总长度控制在200-280字
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

        // 更新抽牌记录到数据库
        if (this.data.currentDrawId) {
          const collection = this.data.tarotCollection;
          try {
            await db
              .collection(collection)
              .doc(this.data.currentDrawId)
              .update({
                data: {
                  question: this.data.question,
                  interpretation: fullText,
                },
              });
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

  // 输入行动计划
  onActionInput(e) {
    this.setData({
      actionText: e.detail.value,
      actionPlan: e.detail.value,
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
      // 原有状态重置
      drawnCard: null,
      currentDrawId: null,
      question: "",
      actionText: "",
      actionPlan: "",
      interpretation: "",
      interpretationBlocks: [], // 重置解读块
      hasShuffled: false,
      isShuffling: false,
      showFlyingCard: false,
      shuffleFadeOut: false,
      // 重置牌阵为默认
      selectedSpread: defaultSpread,
    });

    // 重置后刷新今日已抽次数
    this.fetchTodayCount();
  },

  /**
   * 开始新的抽牌流程
   */
  startNewDraw() {
    this.resetDraw();
  },

  // 保存行动计划
  async saveActionPlan() {
    if (!this.data.drawnCard || !this.data.currentDrawId) return;

    wx.showLoading({ title: "保存中..." });

    try {
      const collection = this.data.tarotCollection;
      await db
        .collection(collection)
        .doc(this.data.currentDrawId)
        .update({
          data: {
            actionPlan: this.data.actionPlan || "",
          },
        });

      wx.hideLoading();
      wx.showToast({
        title: "已保存",
        icon: "success",
      });
    } catch (err) {
      console.error("保存行动计划失败", err);
      wx.hideLoading();

      // 检查是否是权限错误
      if (err && (err.errCode === -502003 || err.errCode === -502005)) {
        wx.showModal({
          title: "权限配置提示",
          content:
            "数据库权限未配置，请在云开发控制台设置 tarotDraws 集合权限为【仅创建者可读写】。详见《数据库权限配置指南.md》",
          showCancel: false,
          confirmText: "我知道了",
        });
      } else {
        wx.showToast({
          title: "保存失败，请稍后再试",
          icon: "none",
        });
      }
    }
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
});
