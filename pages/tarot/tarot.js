// pages/tarot/tarot.js
// ============================================================
// 塔罗牌抽取页面 - 专业级交互与动画系统
// 流程阶段: idle → shuffling → spreading → selecting → selected → result
// 🔥 已升级为流式输出，用户可在 0.2 秒内看到字符开始出现
// ============================================================

const db = wx.cloud.database();
// ✅ 塔罗解读改为前端直连 Vercel 代理（流式输出）

const { callAIStream } = require("../../utils/aiStream.js");

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
        desc: "单张直觉给出方向，适合简单抉择。",
        keywords: ["吗", "能否", "是否", "要不要", "可不可"],
        positions: ["答案"],
      },
      {
        name: "得与失",
        count: 2,
        desc: "得到 / 付出，适合衡量利弊。",
        keywords: ["值得", "利弊", "得", "失", "付出", "收益"],
        positions: ["得到", "付出"],
      },
      {
        name: "时间之流",
        count: 3,
        desc: "过去 / 现在 / 未来，适合趋势或阶段性问题。",
        keywords: ["过去", "现在", "未来", "发展", "趋势"],
        positions: ["过去", "现在", "未来"],
      },
      {
        name: "圣三角牌阵",
        count: 3,
        desc: "过去 / 现在 / 未来，简短版三角布局。",
        keywords: ["过去", "现在", "未来", "三角"],
        positions: ["过去", "现在", "未来"],
      },
      {
        name: "自我探索",
        count: 4,
        desc: "现状 / 外在 / 内在 / 潜力，适合成长与使命。",
        keywords: ["使命", "成长", "灵性", "内在", "方向"],
        positions: ["现状", "外在", "内在", "潜力"],
      },
      {
        name: "身心灵牌阵",
        count: 4,
        desc: "身 / 心 / 灵 / 建议。",
        keywords: ["身心", "身体", "心灵", "疗愈", "建议"],
        positions: ["身", "心", "灵", "建议", "结果"],
      },
      {
        name: "荣格原型",
        count: 3,
        desc: "自我 / 阴影 / 面具。",
        keywords: ["原型", "阴影", "面具", "内在小孩"],
        positions: ["自我", "阴影", "面具"],
      },
      {
        name: "二选一牌阵",
        count: 5,
        desc: "对比 A / B 两个方案，含风险与总评。",
        keywords: ["选择", "方案", "A", "B", "对比", "选项"],
        positions: ["选项A", "选项B", "A风险", "B风险", "建议", "结果"],
      },
      {
        name: "内在天赋",
        count: 6,
        desc: "发掘天赋 / 资源 / 阻碍 / 行动，适合天赋与职业方向。",
        keywords: ["天赋", "擅长", "职业", "才能", "优势"],
        positions: ["天赋", "资源", "阻碍", "行动", "潜力"],
      },
    ],
    selectedSpread: {
      name: "自我探索",
      count: 4,
      desc: "现状 / 内在 / 外在 / 潜力。",
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

        this.setData({
          drawnCard: cardRes.data,
          currentDrawId: draw._id, // 保存当前抽牌记录的ID
          question: draw.question || "",
          actionPlan: draw.actionPlan || "",
          interpretation: draw.interpretation || "",
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
  playShuffleSound(onComplete) {
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src =
      "cloud://cloud1-5gc5jltwbcbef586.636c-cloud1-5gc5jltwbcbef586-1386967363/tarot/Card shuffle sound effect.mp3";

    let hasTriggeredCallback = false;

    // 提前1.5秒触发回调，让音效与动画过渡更流畅
    const earlyTriggerDelay = ANIMATION_CONFIG.shuffle.soundDuration - 1500; // 约2秒后触发
    const earlyTriggerTimer = setTimeout(() => {
      if (!hasTriggeredCallback) {
        hasTriggeredCallback = true;
        console.log("[Tarot] 洗牌音效提前触发回调（音效仍在播放）");
        if (typeof onComplete === "function") {
          onComplete();
        }
      }
    }, Math.max(earlyTriggerDelay, 1500)); // 至少等待1.5秒

    innerAudioContext.onEnded(() => {
      console.log("[Tarot] 洗牌音效播放完成");
      clearTimeout(earlyTriggerTimer);
      innerAudioContext.destroy();
      // 如果回调尚未触发，则在音效结束时触发
      if (!hasTriggeredCallback) {
        hasTriggeredCallback = true;
        if (typeof onComplete === "function") {
          onComplete();
        }
      }
    });

    innerAudioContext.onError((err) => {
      console.warn("[Tarot] 洗牌音效播放失败", err);
      clearTimeout(earlyTriggerTimer);
      innerAudioContext.destroy();
      if (!hasTriggeredCallback) {
        hasTriggeredCallback = true;
        if (typeof onComplete === "function") {
          onComplete();
        }
      }
    });

    innerAudioContext.play();
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

  // 获取AI解读（流式输出）
  getInterpretation() {
    if (!this.data.question) {
      wx.showToast({ title: "请输入你的问题", icon: "none" });
      return;
    }

    // 防止用户还没真正抽牌就点解读
    if (
      !this.data.drawnCard &&
      (!this.data.drawnCards || this.data.drawnCards.length === 0)
    ) {
      wx.showToast({ title: "请先完成抽牌", icon: "none" });
      return;
    }

    this.setData({ loading: true, interpretation: "" });

    // 构建提示词，支持多卡解读
    let prompt;
    const { drawnCards, drawnCard, selectedSpread, question } = this.data;

    if (drawnCards && drawnCards.length > 1) {
      // 多卡牌阵解读
      const cardsInfo = drawnCards
        .map(
          (card) =>
            `【${card.position}】${card.name}\n  关键词：${
              card.keywords
            }\n  含义：${card.meaning || "待解读"}`
        )
        .join("\n\n");

      prompt = `你是一位温柔的心灵塔罗陪伴者。用户使用「${selectedSpread.name}」牌阵抽取了 ${drawnCards.length} 张牌。请根据以下塔罗牌信息和牌阵位置，用温柔、不过度预测未来的方式，给出一段详细的心理启发式解读，并用中文回答。
牌阵：${selectedSpread.name}
牌阵说明：${selectedSpread.desc}
抽取的牌：
${cardsInfo}
用户问题：${question}
请综合分析每张牌在其位置上的含义，以及牌与牌之间的关系，给出整体性的解读建议。`;
    } else {
      // 单卡解读（兼容旧逻辑）
      const singleCard =
        drawnCards && drawnCards.length === 1 ? drawnCards[0] : drawnCard;
      if (!singleCard) {
        wx.showToast({ title: "请先完成抽牌", icon: "none" });
        this.setData({ loading: false });
        return;
      }
      prompt = `你是一位温柔的心灵塔罗陪伴者。请根据以下塔罗牌信息，用温柔、不过度预测未来的方式，给出一段详细的心理启发式解读，并用中文回答。
卡牌：${singleCard.name}
关键词：${singleCard.keywords}
含义：${singleCard.meaning}
用户问题：${question}`;
    }

    const systemPrompt = `你是一位温柔的塔罗解读师。你的解读风格是：
1. 温柔、鼓励、充满希望
2. 不做绝对预测，而是提供启发和建议
3. 关注用户的内在成长和自我觉察
4. 避免负面或恐吓性的表达
5. 解读长度控制在 150-200 字
6. 禁止涉及金钱预测、医疗诊断、具体时间点的预言`;

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
      onChunk: (chunk, fullText) => {
        // 实时更新解读内容
        this.setData({ interpretation: fullText });
      },
      onComplete: async (fullText) => {
        console.log("[tarot] ✅ 流式输出完成");
        this.setData({ interpretation: fullText, loading: false });

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

        const fallback = `${cardName} 在此刻出现，更像是一个温柔的提醒，而不是对未来的预言。它邀请你回到当下，留意自己最近在 ${cardKeywords} 相关领域的感受和选择。

也许你可以给自己一点时间，写下此刻最在意的三件事，或者用冥想的方式，和这张牌待在一起几分钟。慢慢来，你有足够的时间去理解这些讯息。`;

        this.setData({ interpretation: fallback, loading: false });
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
