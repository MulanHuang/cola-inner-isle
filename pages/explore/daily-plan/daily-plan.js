// pages/explore/daily-plan/daily-plan.js
const { formatLocalDate } = require("../../../subpackages/common/dateUtils.js");

Page({
  data: {
    // 是否首次访问（显示引导文案）
    isFirstVisit: true,
    // 今日日期
    todayDate: "",
    todayDateDisplay: "",
    // 数据字段
    health: {
      exercise: "",
      water: "",
      sleep: "",
    },
    todoList: [{ text: "", completed: false }],
    importantList: [{ text: "", completed: false }],
    insight: "",
    summary: "",
    // 是否已有今日记录
    hasExistingRecord: false,
    // 时间布局（6:00-24:00）
    timeSlots: [
      { time: "6:00-7:00", plan: "" },
      { time: "7:00-8:00", plan: "" },
      { time: "8:00-9:00", plan: "" },
      { time: "9:00-10:00", plan: "" },
      { time: "10:00-11:00", plan: "" },
      { time: "11:00-12:00", plan: "" },
      { time: "12:00-13:00", plan: "" },
      { time: "13:00-14:00", plan: "" },
      { time: "14:00-15:00", plan: "" },
      { time: "15:00-16:00", plan: "" },
      { time: "16:00-17:00", plan: "" },
      { time: "17:00-18:00", plan: "" },
      { time: "18:00-19:00", plan: "" },
      { time: "19:00-20:00", plan: "" },
      { time: "20:00-21:00", plan: "" },
      { time: "21:00-22:00", plan: "" },
      { time: "22:00-23:00", plan: "" },
      { time: "23:00-24:00", plan: "" },
    ],
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    this.loadTodayRecord();
  },

  // 初始化页面
  initPage() {
    const now = new Date();
    const todayDate = formatLocalDate(now);
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    const weekDay = weekDays[now.getDay()];
    const todayDateDisplay = `${year}年${month}月${day}日 · 星期${weekDay}`;

    // 检查是否首次访问
    const visitedDaily = wx.getStorageSync("dailyPlanVisited");
    const isFirstVisit = !visitedDaily;

    this.setData({
      todayDate,
      todayDateDisplay,
      isFirstVisit,
    });
  },

  // 加载今日记录
  loadTodayRecord() {
    const { todayDate, timeSlots } = this.data;
    const records = wx.getStorageSync("dailyPlanRecords") || {};
    const todayRecord = records[todayDate];

    if (todayRecord) {
      // 合并已保存的时间计划
      let loadedTimeSlots = timeSlots.map((slot) => ({
        time: slot.time,
        plan: "",
      }));
      if (todayRecord.timeSlots && todayRecord.timeSlots.length) {
        loadedTimeSlots = loadedTimeSlots.map((slot) => {
          const saved = todayRecord.timeSlots.find((s) => s.time === slot.time);
          return saved ? { ...slot, plan: saved.plan } : slot;
        });
      }

      // 兼容旧数据格式（字符串数组）转为新格式（对象数组）
      let loadedTodoList = [{ text: "", completed: false }];
      if (todayRecord.todoList?.length) {
        loadedTodoList = todayRecord.todoList.map((item) =>
          typeof item === "string" ? { text: item, completed: false } : item
        );
      }
      let loadedImportantList = [{ text: "", completed: false }];
      if (todayRecord.importantList?.length) {
        loadedImportantList = todayRecord.importantList.map((item) =>
          typeof item === "string" ? { text: item, completed: false } : item
        );
      }

      this.setData({
        health: todayRecord.health || { exercise: "", water: "", sleep: "" },
        todoList: loadedTodoList,
        importantList: loadedImportantList,
        insight: todayRecord.insight || "",
        summary: todayRecord.summary || "",
        timeSlots: loadedTimeSlots,
        hasExistingRecord: true,
      });
    }
  },

  // 关闭引导文案
  dismissGuide() {
    wx.setStorageSync("dailyPlanVisited", true);
    this.setData({ isFirstVisit: false });
  },

  // 健康输入
  onHealthInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`health.${field}`]: value,
    });
  },

  // 待办事项输入
  onTodoInput(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const todoList = [...this.data.todoList];
    todoList[index].text = value;
    this.setData({ todoList });
  },

  // 切换待办事项完成状态
  toggleTodoComplete(e) {
    const index = e.currentTarget.dataset.index;
    const todoList = [...this.data.todoList];
    todoList[index].completed = !todoList[index].completed;
    this.setData({ todoList });
  },

  // 添加待办事项
  addTodo() {
    const todoList = [...this.data.todoList, { text: "", completed: false }];
    this.setData({ todoList });
  },

  // 删除待办事项
  removeTodo(e) {
    const index = e.currentTarget.dataset.index;
    const todoList = [...this.data.todoList];
    if (todoList.length > 1) {
      todoList.splice(index, 1);
      this.setData({ todoList });
    }
  },

  // 重要事项输入
  onImportantInput(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const importantList = [...this.data.importantList];
    importantList[index].text = value;
    this.setData({ importantList });
  },

  // 切换重要事项完成状态
  toggleImportantComplete(e) {
    const index = e.currentTarget.dataset.index;
    const importantList = [...this.data.importantList];
    importantList[index].completed = !importantList[index].completed;
    this.setData({ importantList });
  },

  // 添加重要事项
  addImportant() {
    const importantList = [
      ...this.data.importantList,
      { text: "", completed: false },
    ];
    this.setData({ importantList });
  },

  // 删除重要事项
  removeImportant(e) {
    const index = e.currentTarget.dataset.index;
    const importantList = [...this.data.importantList];
    if (importantList.length > 1) {
      importantList.splice(index, 1);
      this.setData({ importantList });
    }
  },

  // 感受输入
  onInsightInput(e) {
    this.setData({ insight: e.detail.value });
  },

  // 总结输入
  onSummaryInput(e) {
    this.setData({ summary: e.detail.value });
  },

  // 时间计划输入
  onTimeSlotInput(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const timeSlots = [...this.data.timeSlots];
    timeSlots[index].plan = value;
    this.setData({ timeSlots });
  },

  // 保存记录
  saveRecord() {
    const {
      todayDate,
      health,
      todoList,
      importantList,
      insight,
      summary,
      timeSlots,
    } = this.data;

    // 过滤空值
    const filteredTodo = todoList.filter((item) => item.text.trim());
    const filteredImportant = importantList.filter((item) => item.text.trim());
    // 保存有内容的时间计划
    const filteredTimeSlots = timeSlots.map((slot) => ({
      time: slot.time,
      plan: slot.plan,
    }));

    const record = {
      date: todayDate,
      health,
      todoList: filteredTodo,
      importantList: filteredImportant,
      insight,
      summary,
      timeSlots: filteredTimeSlots,
      createdAt: new Date().toISOString(),
    };

    // 保存到本地存储
    const records = wx.getStorageSync("dailyPlanRecords") || {};
    records[todayDate] = record;
    wx.setStorageSync("dailyPlanRecords", records);

    this.setData({
      hasExistingRecord: true,
    });

    wx.showToast({
      title: "已经帮你把今天收好了",
      icon: "none",
      duration: 2000,
    });
  },

  // 查看历史记录
  viewHistory() {
    wx.navigateTo({
      url: "/pages/explore/daily-plan/history/history",
    });
  },

  // 跳转历史记录
  goToHistory() {
    wx.navigateTo({
      url: "/pages/explore/daily-plan/history/history",
    });
  },

  // 跳转到周计划（联动功能）
  goToWeekPlan() {
    wx.navigateTo({
      url: "/pages/explore/week-plan/week-plan",
    });
  },

  // 跳转到月计划（联动功能）
  goToMonthPlan() {
    wx.navigateTo({
      url: "/pages/explore/monthly-plan/monthly-plan",
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },
});
