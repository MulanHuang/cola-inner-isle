// pages/explore/monthly-plan/history/history.js
Page({
  data: {
    currentYear: 0,
    months: [],
    hasAnyRecord: false,
  },

  onLoad() {
    const now = new Date();
    this.setData({ currentYear: now.getFullYear() });
    this.loadMonthList();
  },

  onShow() {
    this.loadMonthList();
  },

  // 加载月份列表
  loadMonthList() {
    const { currentYear } = this.data;
    const records = wx.getStorageSync("monthlyPlanRecords") || {};
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYearNow = now.getFullYear();

    const months = [];
    let hasAnyRecord = false;

    for (let m = 1; m <= 12; m++) {
      const monthKey = `${currentYear}-${String(m).padStart(2, "0")}`;
      const monthRecord = records[monthKey];
      const hasRecord = !!(monthRecord && monthRecord.contents && Object.keys(monthRecord.contents).length > 0);
      const isCurrentMonth = currentYear === currentYearNow && m === currentMonth;

      let preview = "";
      let recordCount = 0;

      if (hasRecord) {
        hasAnyRecord = true;
        const contents = monthRecord.contents;
        recordCount = Object.keys(contents).length;
        // 获取第一条记录作为预览
        const firstKey = Object.keys(contents).sort()[0];
        const firstContent = contents[firstKey];
        preview = firstContent.length > 30 ? firstContent.substring(0, 30) + "…" : firstContent;
      }

      months.push({
        month: m,
        monthKey,
        hasRecord,
        isCurrentMonth,
        preview,
        recordCount,
      });
    }

    this.setData({ months, hasAnyRecord });
  },

  // 上一年
  prevYear() {
    let { currentYear } = this.data;
    currentYear--;
    this.setData({ currentYear });
    this.loadMonthList();
  },

  // 下一年
  nextYear() {
    let { currentYear } = this.data;
    currentYear++;
    this.setData({ currentYear });
    this.loadMonthList();
  },

  // 点击月份
  onMonthTap(e) {
    const { month, hasRecord } = e.currentTarget.dataset;
    const { currentYear } = this.data;

    // 跳转到月度记录页面并定位到该月
    wx.redirectTo({
      url: `/pages/explore/monthly-plan/monthly-plan?year=${currentYear}&month=${month}`,
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },
});

