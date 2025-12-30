// pages/aroma-card/aroma-card.js
// ============================================================
// 芳香情绪卡页面 - 情绪觉察与自我探索工具
// 抽卡逻辑参考 OH 卡，从云数据库随机抽取芳香卡牌
// ============================================================

const db = wx.cloud.database();

// 🚀 云存储临时 URL 智能缓存工具
const {
  getTempUrlWithCache,
  invalidateCache,
} = require("../../utils/cloudUrlCache.js");

// 牌堆展示的卡片数量（环形建议 12-14）
const DECK_LAYER_COUNT = 15;
// 预取的卡牌数量
const PREFETCH_COUNT = 6;

// 固定的觉察引导问题
const REFLECTION_QUESTIONS = [
  "当你看到这张卡时，第一感觉是什么？",
  "如果这种香气有一个形象，它像什么？",
  "它让你联想到什么样的情绪或状态？",
  "这张卡与你此刻的心情有什么连接？",
];

Page({
  data: {
    // 用于 WXML 中渲染牌堆的层数数组
    deckLayers: Array.from({ length: DECK_LAYER_COUNT }, (_, i) => i),

    // 当前抽到的卡牌
    selectedCard: null, // { id, name, nameEN, theme, keywords, message, fileId }
    cardMessageLines: [],

    // 加载状态
    drawing: false,

    // 芳香卡背面图片（从数据库 back 卡获取）
    backImage: "",

    // 卡牌翻转动画开关
    cardFlipActive: false,

    // 固定的觉察引导问题
    reflectionQuestions: REFLECTION_QUESTIONS,

    // 卡牌图片加载状态
    cardImageStatus: "idle", // idle | loading | loaded | error
    cardImageSrc: "",
    cardImageThumbSrc: "",

    // 自定义导航栏高度
    statusBarHeight: 0,
    navBarHeight: 0,
  },

  // ============================================================
  // 生命周期
  // ============================================================

  onLoad() {
    this.setNavBarHeight();
    this.resetState();
    this.loadBackCardImage();
    this.prefetchCards();
  },

  onUnload() {
    if (this._cardFlipTimer) {
      clearTimeout(this._cardFlipTimer);
    }
  },

  // 🖼️ 从数据库获取芳香卡背面图片（back 卡的 fileId）
  async loadBackCardImage() {
    try {
      console.log("[aroma-card] 🖼️ 加载芳香卡背面图片...");

      // 从云数据库获取 back 卡
      const backCardResult = await db
        .collection("aromatherapyCards")
        .where({ name: "back" })
        .limit(1)
        .get();

      if (!backCardResult.data || backCardResult.data.length === 0) {
        console.warn("[aroma-card] ⚠️ 未找到 back 卡数据");
        return;
      }

      const backCard = backCardResult.data[0];
      let cloudUrl = backCard.fileId;

      if (!cloudUrl) {
        console.warn("[aroma-card] ⚠️ back 卡缺少 fileId");
        return;
      }

      // 先尝试从 App 预加载缓存获取
      const app = getApp();
      const preloaded = app.globalData.preloadedImages?.[cloudUrl];
      if (preloaded) {
        console.log("[aroma-card] ✅ 使用App预加载的卡背URL");
        this.setData({ backImage: preloaded });
        return;
      }

      // 转换 cloud:// 为临时 URL（强制刷新，确保获取最新图片）
      if (cloudUrl.startsWith("cloud://")) {
        // 先清除旧缓存，确保获取最新的临时 URL
        invalidateCache(cloudUrl);
        const tempUrl = await getTempUrlWithCache(cloudUrl);
        if (tempUrl && tempUrl !== cloudUrl) {
          cloudUrl = tempUrl;
          console.log("[aroma-card] ✅ 卡背临时URL转换成功（已强制刷新）");
        }
      }

      this.setData({ backImage: cloudUrl });
      console.log("[aroma-card] ✅ 芳香卡背面图片加载成功");
    } catch (err) {
      console.error("[aroma-card] ❌ 加载卡背图片失败:", err.message);
    }
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
    this.setData({
      statusBarHeight,
      navBarHeight,
    });
  },

  /**
   * 重置页面状态
   */
  resetState() {
    this.setData({
      selectedCard: null,
      drawing: false,
      cardFlipActive: false,
      cardMessageLines: [],
      cardImageStatus: "idle",
      cardImageSrc: "",
      cardImageThumbSrc: "",
    });
  },

  isRemoteUrl(url) {
    return typeof url === "string" && url.startsWith("http");
  },

  buildThumbUrl(url) {
    if (!url) return "";
    if (!this.isRemoteUrl(url)) return url;
    const param = "imageView2/2/w/480/q/80";
    return url.includes("?") ? `${url}&${param}` : `${url}?${param}`;
  },

  getLocalImagePath(url) {
    return new Promise((resolve) => {
      if (!url) return resolve("");
      wx.getImageInfo({
        src: url,
        success: (res) => resolve(res.path || ""),
        fail: () => resolve(""),
      });
    });
  },

  async prefetchCards() {
    if (this._prefetching) return;
    this._prefetching = true;
    if (!this._prefetchPool) {
      this._prefetchPool = new Map();
    }

    try {
      const result = await db
        .collection("aromatherapyCards")
        .aggregate()
        .match({ name: db.command.neq("back") })
        .sample({ size: PREFETCH_COUNT })
        .end();

      const cards = result.list || [];
      await Promise.all(cards.map((card) => this.prefetchCard(card)));
    } catch (err) {
      console.warn("[aroma-card] ⚠️ 预取卡牌失败:", err.message);
    } finally {
      this._prefetching = false;
    }
  },

  async prefetchCard(card) {
    if (!card || !card.fileId || card.name === "back") return;
    try {
      let fullUrl = card.fileId;

      if (fullUrl.startsWith("cloud://")) {
        const tempUrl = await getTempUrlWithCache(fullUrl);
        if (tempUrl) {
          fullUrl = tempUrl;
        }
      }

      const thumbUrl = this.buildThumbUrl(fullUrl);
      const [thumbLocal, fullLocal] = await Promise.all([
        this.getLocalImagePath(thumbUrl),
        this.getLocalImagePath(fullUrl),
      ]);

      this._prefetchPool.set(card.id, {
        fullUrl,
        thumbUrl,
        thumbLocal,
        fullLocal,
      });
    } catch (err) {
      console.warn("[aroma-card] ⚠️ 预取单张失败:", err.message);
    }
  },

  // ============================================================
  // 抽卡逻辑
  // ============================================================

  /**
   * 抽取卡牌 - 从云数据库 aromatherapyCards 集合随机抽取
   */
  async drawCard() {
    if (this.data.drawing) return;

    // 🎴 长振动，营造抽卡仪式感
    wx.vibrateLong();

    this.setData({ drawing: true, cardFlipActive: false });

    try {
      // 从云数据库随机抽取一张卡（排除 back 卡）
      const cardResult = await db
        .collection("aromatherapyCards")
        .aggregate()
        .match({
          name: db.command.neq("back"), // 排除背面卡
        })
        .sample({ size: 1 })
        .end();

      if (!cardResult.list || cardResult.list.length === 0) {
        throw new Error("未能获取芳香卡数据");
      }

      const card = cardResult.list[0];

      // �️ 将卡牌图片 cloud:// 转换为临时 URL（体验版必需）
      let cardFileId = card.fileId;
      if (cardFileId && cardFileId.startsWith("cloud://")) {
        try {
          const tempUrl = await getTempUrlWithCache(cardFileId);
          if (tempUrl && tempUrl !== cardFileId) {
            cardFileId = tempUrl;
            console.log("[aroma-card] ✅ 卡牌图片临时URL转换成功:", card.name);
          }
        } catch (err) {
          console.warn("[aroma-card] ⚠️ 卡牌图片URL转换失败:", err.message);
        }
      }

      const prefetched = this._prefetchPool?.get(card.id);
      const resolvedImageSrc =
        prefetched?.fullLocal || prefetched?.fullUrl || cardFileId;
      const resolvedThumbSrc =
        prefetched?.thumbLocal ||
        prefetched?.thumbUrl ||
        this.buildThumbUrl(cardFileId);

      // �🚀 预热卡牌图片（让微信客户端提前下载）
      if (cardFileId && this.isRemoteUrl(cardFileId) && !prefetched?.fullLocal) {
        wx.getImageInfo({
          src: cardFileId,
          success: (res) => {
            console.log("[aroma-card] ✅ 卡牌图片预热成功:", card.name);
            if (res.path) {
              this.setData({ cardImageSrc: res.path });
            }
          },
          fail: () =>
            console.warn("[aroma-card] ⚠️ 卡牌图片预热失败:", card.name),
        });
      }

      // 更新状态
      this.setData({
        selectedCard: {
          id: card.id,
          name: card.name,
          nameEN: card.nameEN,
          theme: card.theme,
          keywords: card.keywords,
          message: card.message,
          fileId: cardFileId, // 使用转换后的临时 URL
        },
        drawing: false,
        cardFlipActive: false,
        cardMessageLines: this.splitMessageLines(card.message),
        cardImageStatus: "loading",
        cardImageSrc: resolvedImageSrc,
        cardImageThumbSrc: resolvedThumbSrc,
      });

      this.triggerCardFlip();

      // ✨ 抽卡成功后再次振动
      wx.vibrateShort({ type: "heavy" });

      // 滚动到卡片展示区
      wx.pageScrollTo({
        selector: "#aromaResultSection",
        duration: 400,
        fail: () => {
          wx.pageScrollTo({ scrollTop: 320, duration: 400 });
        },
      });
    } catch (err) {
      console.error("[aroma-card] 抽卡失败", err);
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

  /**
   * 重新抽取
   */
  resetDraw() {
    wx.vibrateShort({ type: "light" });
    this.resetState();
    // 滚动回顶部
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url,
      });
    }
  },

  handleCardImageLoad() {
    if (this.data.cardImageStatus !== "loaded") {
      this.setData({ cardImageStatus: "loaded" });
    }
  },

  handleCardImageError() {
    this.setData({ cardImageStatus: "error" });
  },

  /**
   * 将卡牌心灵讯息拆成最多两行
   */
  splitMessageLines(message) {
    if (!message || typeof message !== "string") return [];
    return message
      .split(/[。！？!?\n]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 2);
  },

  /**
   * 跳转到芳香情绪卡聊天页面
   */
  goToAromaChatPage() {
    // 轻微振动反馈
    wx.vibrateShort({ type: "light" });

    const { selectedCard } = this.data;
    if (!selectedCard) {
      wx.showToast({ title: "请先抽一张卡牌", icon: "none" });
      return;
    }

    wx.navigateTo({
      url: "/pages/aroma-chat/aroma-chat",
      success: (res) => {
        try {
          res.eventChannel?.emit("aromaContext", {
            selectedCard,
          });
        } catch (e) {
          console.warn("传递芳香卡聊天上下文失败", e);
        }
      },
    });
  },
});
