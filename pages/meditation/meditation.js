// pages/meditation/meditation.js
const db = wx.cloud.database();

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

      this.setData({
        audioList: res.data || [],
      });

      wx.hideLoading();
    } catch (err) {
      console.error("加载音频列表失败", err);
      wx.hideLoading();
      wx.showToast({
        title: "加载失败",
        icon: "none",
      });
    }
  },

  // 播放音频
  playAudio(e) {
    const audio = e.currentTarget.dataset.audio;
    wx.navigateTo({
      url: `/pages/meditation/player/player?id=${audio._id}`,
    });
  },
});
