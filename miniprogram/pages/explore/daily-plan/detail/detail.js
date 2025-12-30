// pages/explore/daily-plan/detail/detail.js
Page({
  data: {
    date: "",
    dateDisplay: "",
    record: null,
    hasData: false,
    todoList: [],
    importantList: [],
    allTimeSlots: [],
  },

  onLoad(options) {
    const { date } = options;
    if (date) {
      this.setData({ date });
      this.loadRecord(date);
    }
  },

  // 加载指定日期的记录
  loadRecord(date) {
    const records = wx.getStorageSync("dailyPlanRecords") || {};
    const record = records[date];

    if (record) {
      // 格式化日期显示（与编辑页面一致）
      const [year, month, day] = date.split("-");
      const dateDisplay = `${year}年${parseInt(month)}月${parseInt(day)}日`;

      // 处理 todoList（兼容新旧格式）
      let todoList = [];
      if (record.todoList && record.todoList.length) {
        todoList = record.todoList
          .map((item) =>
            typeof item === "string" ? { text: item, completed: false } : item
          )
          .filter((item) => item.text);
      }

      // 处理 importantList（兼容新旧格式）
      let importantList = [];
      if (record.importantList && record.importantList.length) {
        importantList = record.importantList
          .map((item) =>
            typeof item === "string" ? { text: item, completed: false } : item
          )
          .filter((item) => item.text);
      }

      // 构建完整的时间布局（与编辑页面一致）
      const defaultTimeSlots = [
        "6:00-7:00",
        "7:00-8:00",
        "8:00-9:00",
        "9:00-10:00",
        "10:00-11:00",
        "11:00-12:00",
        "12:00-13:00",
        "13:00-14:00",
        "14:00-15:00",
        "15:00-16:00",
        "16:00-17:00",
        "17:00-18:00",
        "18:00-19:00",
        "19:00-20:00",
        "20:00-21:00",
        "21:00-22:00",
        "22:00-23:00",
        "23:00-24:00",
      ];
      const allTimeSlots = defaultTimeSlots.map((time) => {
        const saved = record.timeSlots?.find((s) => s.time === time);
        return { time, plan: saved?.plan || "" };
      });

      // 确保 health 对象存在
      const recordWithHealth = {
        ...record,
        health: record.health || { exercise: "", water: "", sleep: "" },
      };

      this.setData({
        dateDisplay,
        record: recordWithHealth,
        todoList,
        importantList,
        allTimeSlots,
        hasData: true,
      });
    } else {
      this.setData({ hasData: false });
    }
  },

  // 生成图片
  generateImage() {
    wx.navigateTo({
      url: `/pages/explore/daily-plan/share/share?date=${this.data.date}`,
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },
});
