// pages/behavior-strength/behavior-strength-history.js

Page({
  data: {
    historyList: [],
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    let history = [];
    try {
      const cached = wx.getStorageSync("behavior-strength-history");
      if (Array.isArray(cached)) history = cached;
    } catch (err) {
      console.warn("behavior-strength history load failed:", err);
    }

    const historyList = history.map((item) => {
      const resultList = (item.resultList || []).map((dim) => {
        const score = Number(dim.score) || 0;
        const level = dim.level || this.getLevel(score);
        return {
          ...dim,
          score,
          level,
          levelKey: this.getLevelKey(level),
          percent: Math.round((score / 5) * 100),
        };
      });

      return {
        ...item,
        resultList,
        displayTime: item.displayTime || this.formatTime(item.meta?.completedAt),
      };
    });

    this.setData({ historyList });
  },

  formatTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  getLevel(score) {
    if (score >= 4.2) return "高";
    if (score >= 3.2) return "中";
    return "低";
  },

  getLevelKey(level) {
    if (level === "高") return "high";
    if (level === "中") return "mid";
    return "low";
  },

  openReport(e) {
    const key = e.currentTarget.dataset.key;
    if (!key) return;
    wx.navigateTo({
      url: `/pages/behavior-strength/behavior-strength-report?key=${key}`,
    });
  },

  deleteHistoryItem(e) {
    const key = e.currentTarget.dataset.key;
    const historyList = this.data.historyList.filter(
      (item, index) => String(item.meta?.completedAt || index) !== String(key)
    );

    this.setData({ historyList });

    try {
      wx.setStorageSync("behavior-strength-history", historyList);
    } catch (err) {
      console.warn("behavior-strength history save failed:", err);
    }
  },
});
