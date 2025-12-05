// pages/meditation/history/history.js
const db = wx.cloud.database();

Page({
  data: {
    history: [],
    totalCount: 0,
    recentDays: 0,
    loading: false,
    categoryMap: {
      chakra: "脉轮",
      spiritual: "灵性提升",
      emotion: "情绪疗愈",
      sleep: "睡眠",
      awareness: "自我觉察",
      innerchild: "内在小孩",
      relax: "身体放松",
      affirmation: "肯定语",
      manifestation: "显化",
      other: "其他",
    },
  },

  onLoad() {
    this.loadHistory();
    this.calculateStats();
  },

  // 每次页面显示时刷新数据，确保显示最新的播放记录
  onShow() {
    this.loadHistory();
    this.calculateStats();
  },

  // 加载冥想历史，云端优先，失败则走本地暂存
  async loadHistory() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    wx.showLoading({ title: "加载中..." });

    try {
      let records = [];

      try {
        // 添加 _openid 过滤，只查询当前用户的记录
        const res = await db
          .collection("meditationHistory")
          .where({ _openid: "{openid}" })
          .orderBy("createTime", "desc")
          .limit(200)
          .get();

        records = res.data.map((item) => ({
          ...item,
          timeStr: this.formatTime(item.createTime),
          categoryText: this.categoryText(item.category),
        }));

        console.log(
          "[meditation-history] 云端加载当前用户记录:",
          records.length
        );
      } catch (cloudErr) {
        console.warn(
          "[meditation-history] 云端加载失败，使用本地暂存",
          cloudErr
        );
        const local = wx.getStorageSync("meditationHistoryLocal") || [];
        records = local.map((item) => ({
          ...item,
          timeStr: this.formatTime(item.createTime),
          categoryText: this.categoryText(item.category),
        }));
      }

      this.setData({
        history: records,
        totalCount: records.length,
      });
    } catch (err) {
      console.error("[meditation-history] 加载失败", err);
      wx.showToast({ title: "加载失败", icon: "none" });
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  },

  // 计算连续天数（云端优先）
  async calculateStats() {
    try {
      let records = [];
      try {
        // 添加 _openid 过滤，只统计当前用户的记录
        const res = await db
          .collection("meditationHistory")
          .where({ _openid: "{openid}" })
          .orderBy("createTime", "desc")
          .limit(200)
          .get();
        records = res.data;
      } catch (err) {
        records = wx.getStorageSync("meditationHistoryLocal") || [];
      }

      let recentDays = 0;
      if (records.length > 0) {
        const dates = records.map((item) =>
          new Date(item.createTime).toDateString()
        );
        const uniqueDates = [...new Set(dates)].sort(
          (a, b) => new Date(b) - new Date(a)
        );

        const today = new Date().toDateString();
        if (uniqueDates[0] === today) {
          recentDays = 1;
          for (let i = 1; i < uniqueDates.length; i++) {
            const prev = new Date(uniqueDates[i - 1]);
            const curr = new Date(uniqueDates[i]);
            const diffDays = Math.floor((prev - curr) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              recentDays++;
            } else {
              break;
            }
          }
        }
      }

      this.setData({ recentDays });
    } catch (err) {
      console.error("[meditation-history] 统计失败", err);
    }
  },

  categoryText(category) {
    if (!category) return "冥想";
    return this.data.categoryMap[category] || category;
  },

  formatTime(value) {
    const d = new Date(value);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hour = d.getHours().toString().padStart(2, "0");
    const minute = d.getMinutes().toString().padStart(2, "0");

    if (d >= today) return `今天 ${hour}:${minute}`;
    if (d >= yesterday) return `昨天 ${hour}:${minute}`;
    return `${month}-${day} ${hour}:${minute}`;
  },
});
