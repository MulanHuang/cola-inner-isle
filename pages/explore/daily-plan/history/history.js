// pages/explore/daily-plan/history/history.js
const {
  formatLocalDate,
} = require("../../../../subpackages/common/dateUtils.js");

Page({
  data: {
    // 当前显示的年月
    currentYear: 0,
    currentMonth: 0,
    currentMonthDisplay: "",
    // 星期标签
    weekDays: ["一", "二", "三", "四", "五", "六", "日"],
    // 日历天数数组
    days: [],
    // 有记录的日期集合
    recordDates: {},
    // 选中的日期
    selectedDate: "",
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
    });
    this.loadRecords();
    this.generateCalendar();
  },

  onShow() {
    this.loadRecords();
    this.generateCalendar();
  },

  // 加载所有记录
  loadRecords() {
    const records = wx.getStorageSync("dailyPlanRecords") || {};
    const recordDates = {};
    Object.keys(records).forEach((date) => {
      recordDates[date] = true;
    });
    this.setData({ recordDates });
  },

  // 生成日历
  generateCalendar() {
    const { currentYear, currentMonth, recordDates } = this.data;
    const monthDisplay = `${currentYear}年${currentMonth}月`;

    // 该月第一天
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    // 该月最后一天
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();

    // 第一天是周几（周一=1，周日=7）
    let firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7;

    const days = [];

    // 前置空白
    for (let i = 1; i < firstDayOfWeek; i++) {
      days.push({ day: "", dateStr: "", hasRecord: false });
    }

    // 当月每一天
    const today = formatLocalDate(new Date());
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(
        2,
        "0"
      )}-${String(d).padStart(2, "0")}`;
      const hasRecord = !!recordDates[dateStr];
      const isToday = dateStr === today;
      days.push({
        day: d,
        dateStr,
        hasRecord,
        isToday,
      });
    }

    // 填充月末空白
    const remainder = days.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        days.push({ day: "", dateStr: "", hasRecord: false });
      }
    }

    this.setData({
      currentMonthDisplay: monthDisplay,
      days,
    });
  },

  // 上个月
  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    this.setData({ currentYear, currentMonth });
    this.generateCalendar();
  },

  // 下个月
  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    this.setData({ currentYear, currentMonth });
    this.generateCalendar();
  },

  // 点击日期
  onDayTap(e) {
    const { dateStr, hasRecord } = e.currentTarget.dataset;
    if (!dateStr) return;

    if (hasRecord) {
      // 有记录，跳转到详情页
      wx.navigateTo({
        url: `/pages/explore/daily-plan/detail/detail?date=${dateStr}`,
      });
    } else {
      this.setData({ selectedDate: dateStr });
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },
});
