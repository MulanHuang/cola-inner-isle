// pages/planning/planning.js
Page({
  data: {},

  onLoad() {},

  // 触发点击反馈
  triggerTapFeedback(type = "light") {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type });
    }
  },

  // 跳转到人生梦想九宫格
  goToDreamGrid() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/dreamGrid/dreamGrid",
    });
  },

  // 跳转到每日计划
  goToDailyPlan() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/explore/daily-plan/daily-plan",
    });
  },

  // 跳转到周计划表
  goToWeekPlan() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/explore/week-plan/week-plan",
    });
  },

  // 跳转到月度记录
  goToMonthlyPlan() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/explore/monthly-plan/monthly-plan",
    });
  },
});

