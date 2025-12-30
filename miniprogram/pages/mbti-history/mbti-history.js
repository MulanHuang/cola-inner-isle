// pages/mbti-history/mbti-history.js
const db = wx.cloud.database();

Page({
  data: {
    list: [],
    loading: false,
    hasMore: true,
    page: 0,
    pageSize: 20,
  },

  onLoad() {
    this.fetchHistory(true);
  },

  onShow() {
    // 返回页面时刷新数据
    if (this.data.list.length > 0) {
      this.fetchHistory(true);
    }
  },

  onPullDownRefresh() {
    this.fetchHistory(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.fetchHistory(false);
    }
  },

  /**
   * 获取历史记录
   */
  async fetchHistory(refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const page = refresh ? 0 : this.data.page;
    const { pageSize } = this.data;

    try {
      let records = [];

      // 优先从云数据库加载
      try {
        const res = await db
          .collection("mbti_history")
          .where({ _openid: "{openid}" })
          .orderBy("timestamp", "desc")
          .skip(page * pageSize)
          .limit(pageSize)
          .get();

        records = res.data.map((item) => ({
          ...item,
          dateStr: this.formatDate(item.testDate || item.timestamp),
        }));

        console.log("[mbti-history] 云端加载记录:", records.length);
      } catch (cloudErr) {
        console.warn("[mbti-history] 云端加载失败，使用本地存储", cloudErr);
        
        // 从本地存储加载
        const localHistory = wx.getStorageSync("mbti_history_local") || [];
        const start = page * pageSize;
        const end = start + pageSize;
        records = localHistory.slice(start, end).map((item) => ({
          ...item,
          _id: item.timestamp,
          dateStr: this.formatDate(item.testDate || item.timestamp),
        }));
      }

      const newList = refresh ? records : this.data.list.concat(records);

      this.setData({
        list: newList,
        page: page + 1,
        hasMore: records.length === pageSize,
      });
    } catch (err) {
      console.error("[mbti-history] 加载历史失败", err);
      wx.showToast({ title: "加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    if (!date) return "";
    
    let d;
    if (typeof date === "number") {
      d = new Date(date);
    } else if (typeof date === "string") {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      return "";
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * 查看详情（跳转到结果页）
   */
  viewDetail(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/mbti-result/mbti-result?type=${item.type}&scores=${JSON.stringify(item.scores)}`,
    });
  },

  /**
   * 去测试
   */
  goToTest() {
    wx.navigateTo({
      url: "/pages/mbti-test/mbti-test",
    });
  },
});

