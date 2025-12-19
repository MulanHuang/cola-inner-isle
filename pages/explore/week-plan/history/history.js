// pages/explore/week-plan/history/history.js
const {
  getWeekNumber,
  getLocalWeekRange,
} = require("../../../../utils/dateUtils.js");

Page({
  data: {
    currentYear: 0,
    weekList: [],
  },

  onLoad() {
    const now = new Date();
    this.setData({ currentYear: now.getFullYear() });
    this.loadWeekList();
  },

  onShow() {
    this.loadWeekList();
  },

  // 加载周列表
  loadWeekList() {
    const { currentYear } = this.data;
    const records = wx.getStorageSync("weekPlanRecords") || {};

    // 筛选当前年份的记录
    const yearRecords = Object.values(records).filter(
      (r) => r.year === currentYear
    );

    // 按周序号排序（降序，最新的在前）
    yearRecords.sort((a, b) => {
      const weekA = parseInt(a.weekKey.split("-W")[1]);
      const weekB = parseInt(b.weekKey.split("-W")[1]);
      return weekB - weekA;
    });

    // 计算每周的日期范围显示
    const weekList = yearRecords.map((record) => {
      const weekNum = parseInt(record.weekKey.split("-W")[1]);
      // 根据周序号计算该周的周一日期
      const jan1 = new Date(record.year, 0, 1);
      const daysOffset = (weekNum - 1) * 7;
      const jan1Day = jan1.getDay() || 7;
      const monday = new Date(record.year, 0, 1 + daysOffset + (1 - jan1Day));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const mondayMonth = monday.getMonth() + 1;
      const mondayDay = monday.getDate();
      const sundayMonth = sunday.getMonth() + 1;
      const sundayDay = sunday.getDate();

      let weekRangeDisplay;
      if (mondayMonth === sundayMonth) {
        weekRangeDisplay = `${mondayMonth}月${mondayDay}日 - ${sundayDay}日`;
      } else {
        weekRangeDisplay = `${mondayMonth}月${mondayDay}日 - ${sundayMonth}月${sundayDay}日`;
      }

      return {
        ...record,
        weekRangeDisplay,
      };
    });

    this.setData({ weekList });
  },

  // 上一年
  prevYear() {
    this.setData({ currentYear: this.data.currentYear - 1 });
    this.loadWeekList();
  },

  // 下一年
  nextYear() {
    this.setData({ currentYear: this.data.currentYear + 1 });
    this.loadWeekList();
  },

  // 点击周记录
  onWeekTap(e) {
    const { weekKey } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/explore/week-plan/detail/detail?weekKey=${weekKey}`,
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },
});
