// pages/holland-career-interest/holland-career-interest-history.js

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
      const cached = wx.getStorageSync("holland-career-interest-history");
      if (Array.isArray(cached)) history = cached;
    } catch (err) {
      console.warn("holland-career-interest history load failed:", err);
    }

    const historyList = history.map((item) => {
      const topDimensions = item.topDimensions || [];
      const topNames = topDimensions.map((dim) => dim.name).filter(Boolean);
      return {
        ...item,
        topNames,
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

  openReport(e) {
    const key = e.currentTarget.dataset.key;
    if (!key) return;
    wx.navigateTo({
      url: `/pages/holland-career-interest/holland-career-interest-report?key=${key}`,
    });
  },

  deleteHistoryItem(e) {
    const key = e.currentTarget.dataset.key;
    const historyList = this.data.historyList.filter(
      (item, index) => String(item.meta?.completedAt || index) !== String(key)
    );

    this.setData({ historyList });

    try {
      wx.setStorageSync("holland-career-interest-history", historyList);
    } catch (err) {
      console.warn("holland-career-interest history save failed:", err);
    }
  },
});
