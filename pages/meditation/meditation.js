// pages/meditation/meditation.js
const db = wx.cloud.database();

// 🚀 云存储临时 URL 智能缓存工具
const { getTempUrlsWithCache } = require("../../utils/cloudUrlCache.js");

// ============ 智能播放量系统配置 ============
const PLAY_CONFIG = {
  // 内容热门度分类配置
  popularity: {
    hot: { min: 1500, max: 8000, dailyMin: 5, dailyMax: 25 }, // 热门内容
    medium: { min: 500, max: 3000, dailyMin: 2, dailyMax: 12 }, // 中等内容
    niche: { min: 150, max: 1200, dailyMin: 1, dailyMax: 5 }, // 小众内容
  },
  // 星期权重模型（周一=1，周日=0）
  weekWeights: [1.4, 0.8, 1.0, 1.2, 1.1, 1.3, 1.5], // 周日、周一、周二...周六
  // 用户行为热度持续天数
  behaviorDuration: 3,
  // 基准日期（用于计算内容成熟度）
  baseDate: "2024-01-01",
};

// 热门内容ID列表（根据实际数据调整）
const HOT_CONTENT_IDS = ["sleep", "emotion", "relax"];
const MEDIUM_CONTENT_IDS = ["spiritual", "awareness", "innerchild"];
const NICHE_CONTENT_IDS = ["affirmation", "manifestation", "chakra"];

Page({
  data: {
    categories: [
      { id: "emotion", name: "情绪疗愈", icon: "💖" },
      { id: "spiritual", name: "灵性提升", icon: "✨" },
      { id: "sleep", name: "睡眠", icon: "🌙" },
      { id: "awareness", name: "自我觉察", icon: "🔍" },
      { id: "innerchild", name: "内在小孩", icon: "👶" },
      { id: "relax", name: "身体放松", icon: "🌊" },
      { id: "affirmation", name: "肯定语", icon: "💫" },
      { id: "manifestation", name: "显化", icon: "🌟" },
    ],
    currentCategory: "emotion",
    audioList: [],
    chakras: [
      { id: "root", name: "海底轮", icon: "🔴" },
      { id: "sacral", name: "脐轮", icon: "🟠" },
      { id: "solar", name: "太阳轮", icon: "🟡" },
      { id: "heart", name: "心轮", icon: "💚" },
      { id: "throat", name: "喉轮", icon: "🔵" },
      { id: "third-eye", name: "眉心轮", icon: "💜" },
      { id: "crown", name: "顶轮", icon: "⚪" },
    ],
    statusBarHeight: 0,
    navBarHeight: 0,
  },

  // 页面加载
  onLoad() {
    this.setNavBarHeight();
    this.loadAudioList();
  },

  // 页面显示
  onShow() {
    // 设置 tabBar 高亮为冥想（索引 2）
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }

    // 刷新音频列表
    this.loadAudioList();
  },

  // 设置导航栏高度
  setNavBarHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44;
    this.setData({
      statusBarHeight,
      navBarHeight,
    });
  },

  // 切换分类
  switchCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({
      currentCategory: categoryId,
    });
    this.loadAudioList();
  },

  // 加载音频列表
  async loadAudioList() {
    wx.showLoading({ title: "加载中..." });

    try {
      let query = db.collection("meditations").where({
        category: this.data.currentCategory,
      });

      // spiritual 包含 chakra
      if (this.data.currentCategory === "spiritual") {
        query = db.collection("meditations").where({
          category: db.command.in(["spiritual", "chakra"]),
        });
      }

      const res = await query.orderBy("order", "asc").get();

      // 应用智能播放量系统
      let processedList = this.applySmartPlaySystem(res.data || []);

      // 🖼️ 将封面图片 cloud:// 转换为临时 URL（解决体验版图片不显示问题）
      processedList = await this.convertCoverUrls(processedList);

      this.setData({
        audioList: processedList,
      });

      wx.hideLoading();

      // 🚀 预加载前3个音频的临时URL，提升播放体验
      this.preloadAudioUrls(processedList.slice(0, 3));
    } catch (err) {
      console.error("加载音频列表失败", err);
      wx.hideLoading();
      wx.showToast({
        title: "加载失败",
        icon: "none",
      });
    }
  },

  // 🖼️ 批量将封面图片的 cloud:// 路径转换为临时 URL（使用智能缓存）
  async convertCoverUrls(audioList) {
    if (!audioList || audioList.length === 0) return audioList;

    // 提取需要转换的 cloud:// 路径
    const cloudUrls = audioList
      .map((a) => a.cover)
      .filter((url) => url && url.startsWith("cloud://"));

    if (cloudUrls.length === 0) return audioList;

    console.log("[meditation] 🖼️ 转换封面临时URL，数量:", cloudUrls.length);

    try {
      // 使用智能缓存工具（自动缓存1.5小时，再次访问秒开）
      const urlMap = await getTempUrlsWithCache(cloudUrls);

      // 替换 audioList 中的 cover
      return audioList.map((audio) => ({
        ...audio,
        cover: urlMap[audio.cover] || audio.cover,
      }));
    } catch (err) {
      console.warn("[meditation] ⚠️ 封面URL转换失败:", err.message);
      return audioList;
    }
  },

  // 🚀 预加载音频临时链接（后台静默执行，用户无感知）
  async preloadAudioUrls(audioList) {
    if (!audioList || audioList.length === 0) return;

    // 提取有效的 fileId 列表
    const fileIds = audioList
      .map((a) => a.audioUrl || a.audioURL)
      .filter(Boolean);

    if (fileIds.length === 0) return;

    console.log("[meditation] 🚀 开始预加载音频临时URL，数量:", fileIds.length);

    try {
      const res = await wx.cloud.getTempFileURL({ fileList: fileIds });

      // 读取现有缓存
      const existingCache = wx.getStorageSync("audioUrlCache") || {};

      // 合并新的临时URL到缓存
      res.fileList.forEach((fileInfo) => {
        if (fileInfo.status === 0 && fileInfo.tempFileURL) {
          existingCache[fileInfo.fileID] = fileInfo.tempFileURL;
        }
      });

      // 保存到本地缓存
      wx.setStorageSync("audioUrlCache", existingCache);

      console.log(
        "[meditation] ✅ 预加载完成，缓存条目数:",
        Object.keys(existingCache).length
      );
    } catch (err) {
      // 预加载失败不影响正常使用，静默处理
      console.warn("[meditation] ⚠️ 预加载临时URL失败:", err.message);
    }
  },

  // ============ 智能播放量系统核心方法 ============

  // 基于日期的种子随机数生成器（同一天内结果固定）
  seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  },

  // 获取今日日期种子
  getTodaySeed() {
    const today = new Date();
    return (
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate()
    );
  },

  // 获取内容热门度配置
  getPopularityConfig(category) {
    if (HOT_CONTENT_IDS.includes(category)) {
      return PLAY_CONFIG.popularity.hot;
    } else if (MEDIUM_CONTENT_IDS.includes(category)) {
      return PLAY_CONFIG.popularity.medium;
    } else {
      return PLAY_CONFIG.popularity.niche;
    }
  },

  // 计算内容成熟度（S型曲线）
  calculateMaturity(itemId) {
    const today = new Date();
    const baseDate = new Date(PLAY_CONFIG.baseDate);
    const daysSinceBase = Math.floor(
      (today - baseDate) / (1000 * 60 * 60 * 24)
    );

    // 使用itemId生成一个固定的"上线天数"偏移
    const idHash = this.hashString(itemId);
    const contentAge = (daysSinceBase + (idHash % 180)) % 365; // 0-365天的"年龄"

    // S型曲线: 1 / (1 + e^(-0.02*(x-100)))
    // 使内容在100天左右达到50%成熟度
    const maturity = 1 / (1 + Math.exp(-0.02 * (contentAge - 100)));
    return maturity;
  },

  // 字符串哈希函数
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  },

  // 获取星期权重
  getWeekWeight() {
    const dayOfWeek = new Date().getDay(); // 0=周日, 1=周一...
    return PLAY_CONFIG.weekWeights[dayOfWeek];
  },

  // 计算自基准日期以来的天数
  getDaysSinceBase() {
    const today = new Date();
    const baseDate = new Date(PLAY_CONFIG.baseDate);
    return Math.floor((today - baseDate) / (1000 * 60 * 60 * 24));
  },

  // 获取用户行为数据
  getUserBehavior() {
    try {
      const behaviorData = wx.getStorageSync("meditation_user_behavior") || {};
      return behaviorData;
    } catch (e) {
      return {};
    }
  },

  // 保存用户行为数据
  saveUserBehavior(behaviorData) {
    try {
      wx.setStorageSync("meditation_user_behavior", behaviorData);
    } catch (e) {
      console.error("保存用户行为数据失败", e);
    }
  },

  // 清理过期的用户行为数据
  cleanExpiredBehavior(behaviorData) {
    const today = this.getTodaySeed();
    const cleaned = {};

    Object.keys(behaviorData).forEach((itemId) => {
      const item = behaviorData[itemId];
      if (
        item.lastDate &&
        today - item.lastDate <= PLAY_CONFIG.behaviorDuration
      ) {
        cleaned[itemId] = item;
      }
    });

    return cleaned;
  },

  // 计算用户行为权重
  calculateBehaviorWeight(itemId, behaviorData) {
    const today = this.getTodaySeed();
    const item = behaviorData[itemId];

    if (!item) return 0;

    const daysSince = today - item.lastDate;
    if (daysSince > PLAY_CONFIG.behaviorDuration) return 0;

    // 衰减权重：最近播放的权重更高
    const decayFactor = 1 - daysSince / (PLAY_CONFIG.behaviorDuration + 1);
    return item.playCount * decayFactor * 10; // 每次播放增加10的权重基数
  },

  // 生成智能播放量
  generateSmartPlayCount(item, behaviorData) {
    const todaySeed = this.getTodaySeed();
    const itemHash = this.hashString(item._id);
    const config = this.getPopularityConfig(item.category);

    // 1. 基础播放量（使用日期+内容ID作为种子，每天固定）
    const baseSeed = todaySeed + itemHash;
    const baseRandom = this.seededRandom(baseSeed);
    const basePlayCount = Math.floor(
      config.min + baseRandom * (config.max - config.min)
    );

    // 2. 累计每日增长（从基准日期到今天的累计增长）
    const daysSinceBase = this.getDaysSinceBase();
    let cumulativeGrowth = 0;

    for (let day = 0; day < daysSinceBase; day++) {
      const daySeed = todaySeed - daysSinceBase + day + itemHash;
      const dayRandom = this.seededRandom(daySeed * 1.5);
      const dayOfWeekForDay =
        (new Date(PLAY_CONFIG.baseDate).getDay() + day) % 7;
      const weekWeight = PLAY_CONFIG.weekWeights[dayOfWeekForDay];

      // 内容成熟度影响增长速度
      const maturityAtDay = 1 / (1 + Math.exp(-0.02 * (day - 100)));
      const growthMultiplier = 0.5 + maturityAtDay; // 0.5-1.5的增长倍率

      const dailyGrowth = Math.floor(
        (config.dailyMin + dayRandom * (config.dailyMax - config.dailyMin)) *
          weekWeight *
          growthMultiplier
      );
      cumulativeGrowth += dailyGrowth;
    }

    // 3. 用户行为增量
    const behaviorIncrement = behaviorData[item._id]?.playCount || 0;

    // 4. 合成最终播放量
    const totalPlays = basePlayCount + cumulativeGrowth + behaviorIncrement;

    return totalPlays;
  },

  // 计算排序分数
  calculateSortScore(item, smartPlays, behaviorData) {
    const config = this.getPopularityConfig(item.category);

    // 基础热门度分数 (归一化到0-100)
    const popularityScore =
      ((smartPlays - config.min) / (config.max - config.min)) * 50;

    // 用户行为权重分数
    const behaviorScore = this.calculateBehaviorWeight(item._id, behaviorData);

    // 内容成熟度分数（成熟内容略微优先）
    const maturityScore = this.calculateMaturity(item._id) * 10;

    // 原始排序权重（保持一定的原始顺序）
    const orderScore = item.order ? 100 - item.order : 50;

    // 综合得分
    return popularityScore + behaviorScore + maturityScore + orderScore * 0.3;
  },

  // 应用智能播放量系统
  applySmartPlaySystem(audioList) {
    if (!audioList || audioList.length === 0) return [];

    // 获取并清理用户行为数据
    let behaviorData = this.getUserBehavior();
    behaviorData = this.cleanExpiredBehavior(behaviorData);
    this.saveUserBehavior(behaviorData);

    // 为每个音频计算智能播放量和排序分数
    const processedList = audioList.map((item) => {
      const smartPlays = this.generateSmartPlayCount(item, behaviorData);
      const sortScore = this.calculateSortScore(item, smartPlays, behaviorData);

      return {
        ...item,
        smartPlays: smartPlays,
        sortScore: sortScore,
      };
    });

    // 按排序分数排序（降序）
    processedList.sort((a, b) => b.sortScore - a.sortScore);

    return processedList;
  },

  // 播放音频（包含用户行为记录）
  playAudio(e) {
    const audio = e.currentTarget.dataset.audio;

    // 记录用户行为
    this.recordUserBehavior(audio._id);

    // 即时更新播放次数显示
    this.updatePlayCountUI(audio._id);

    // 🚀 优化：传递完整音频数据，让播放页跳过数据库查询
    // 只传递播放页需要的核心字段，避免URL过长
    const audioData = {
      _id: audio._id,
      title: audio.title,
      description: audio.description,
      cover: audio.cover,
      audioUrl: audio.audioUrl || audio.audioURL,
      duration: audio.duration,
      category: audio.category,
    };
    const audioDataStr = encodeURIComponent(JSON.stringify(audioData));

    wx.navigateTo({
      url: `/pages/meditation/player/player?id=${audio._id}&audioData=${audioDataStr}`,
    });
  },

  // 记录用户播放行为
  recordUserBehavior(itemId) {
    const behaviorData = this.getUserBehavior();
    const todaySeed = this.getTodaySeed();

    if (!behaviorData[itemId]) {
      behaviorData[itemId] = {
        playCount: 0,
        lastDate: todaySeed,
      };
    }

    behaviorData[itemId].playCount += 1;
    behaviorData[itemId].lastDate = todaySeed;

    this.saveUserBehavior(behaviorData);
  },

  // 即时更新播放次数UI
  updatePlayCountUI(itemId) {
    const audioList = this.data.audioList;
    const index = audioList.findIndex((item) => item._id === itemId);

    if (index !== -1) {
      const newList = [...audioList];
      newList[index].smartPlays += 1;

      this.setData({
        audioList: newList,
      });
    }
  },
});
