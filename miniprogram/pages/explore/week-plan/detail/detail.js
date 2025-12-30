// pages/explore/week-plan/detail/detail.js
Page({
  data: {
    weekKey: "",
    record: null,
    hasData: false,
    displayWeekDays: [],
  },

  onLoad(options) {
    const { weekKey } = options;
    if (weekKey) {
      this.setData({ weekKey });
      this.loadRecord(weekKey);
    }
  },

  // 加载指定周的记录
  loadRecord(weekKey) {
    const records = wx.getStorageSync("weekPlanRecords") || {};
    const record = records[weekKey];

    if (record) {
      // 构建显示用的周任务数据
      const dayColors = [
        { label: "星期一", color: "#f5c87a", dotColor: "#f5c87a" },
        { label: "星期二", color: "#e8a07a", dotColor: "#e8a07a" },
        { label: "星期三", color: "#a8c87a", dotColor: "#a8c87a" },
        { label: "星期四", color: "#7ac8c8", dotColor: "#7ac8c8" },
        { label: "星期五", color: "#c87a7a", dotColor: "#c87a7a" },
        { label: "星期六", color: "#c8a07a", dotColor: "#c8a07a" },
        { label: "星期日", color: "#7a9ac8", dotColor: "#7a9ac8" },
      ];

      const displayWeekDays = dayColors.map((day, index) => {
        const savedDay = record.weekDays && record.weekDays[index];
        return {
          ...day,
          tasks: savedDay && savedDay.tasks ? savedDay.tasks : [],
        };
      });

      this.setData({
        record,
        hasData: true,
        displayWeekDays,
      });
    } else {
      this.setData({ hasData: false });
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },
});

