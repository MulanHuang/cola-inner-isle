// pages/habitCalendar/habitCalendar.js
const {
  getLocalNow,
  formatLocalDate,
  formatLocalDateCN,
  getWeekdayCN,
  getLocalWeekRange,
  getLocalMonthRange,
  getWeekNumber,
  getDateRange,
  getTimezoneOffsetMinutes,
} = require("../../utils/dateUtils.js");

// 习惯配置 - 仅显示塔罗、冥想、情绪记录三项
const HABIT_CONFIG = [
  {
    key: "tarot",
    name: "塔罗",
    icon: "/assets/icons/habit-tarot.svg",
    emoji: "🔮",
    url: "/pages/tarot/tarot",
  },
  {
    key: "meditation",
    name: "冥想",
    icon: "/assets/icons/habit-meditation.svg",
    emoji: "🧘",
    url: "/pages/meditation/meditation",
    isTab: true,
  },
  {
    key: "emotion",
    name: "情绪记录",
    icon: "/assets/icons/habit-emotion.svg",
    emoji: "💛",
    url: "/pages/emotion/emotion",
  },
];

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    currentTab: "day", // day | week | month
    loading: false,

    // 当前选中的日期（本地时间）
    currentDate: null,

    // 从云函数拿到的每日习惯数据：
    // { '2025-11-29': { tarot: true, chat: false, meditation: true, emotion: false }, ... }
    habitData: {},

    // 日视图数据
    dayData: {
      date: "",
      dateDisplay: "", // 格式：2025年11月29日 · 星期六
      weekday: "",
      habits: [],
      summary: "",
      doneCount: 0,
      totalCount: 4, // 仅4项：塔罗、心语、冥想、情绪记录
      statusLabel: "今日未开始", // 今日未开始 / 练习进行中 / 今日已打满 ⭐️
      statusType: "not_started", // not_started / in_progress / completed / future
    },

    // 周视图数据
    weekData: {
      title: "",
      subtitle: "这一周，你给自己多少陪伴？",
      weekDays: ["一", "二", "三", "四", "五", "六", "日"],
      habits: [],
      dailyCompletedCounts: [0, 0, 0, 0, 0, 0, 0], // 每天完成的项目数
      stats: {
        completionRate: "0%",
        completionPercent: 0,
        streak: 0,
        bestStreak: 0,
        bestDayText: "", // 周二最用心，完成了2项练习 💪
      },
    },

    // 月视图数据
    monthData: {
      title: "",
      subtitle: "这一整个月，你对自己的陪伴轨迹",
      weekDays: ["一", "二", "三", "四", "五", "六", "日"],
      days: [],
      selectedDay: null, // 选中的日期（数字）
      selectedDaySummary: "", // 选中日期的摘要
      selectedDateStr: "", // 选中的日期字符串 YYYY-MM-DD
      stats: {
        totalCompleted: 0,
        avgPerDay: 0,
        bestStreak: 0,
        summaryText: "这是一个有起伏但持续前进的月份，感谢你对自己的不放弃 🌱",
      },
    },
  },

  onLoad(options) {
    this.setNavBarHeight();

    // 如果从首页跳转带参数，优先使用该参数
    if (options && options.type) {
      const validTabs = ["day", "week", "month"];
      if (validTabs.includes(options.type)) {
        this.setData({ currentTab: options.type });
      }
    }

    const now = getLocalNow();
    this.setData({ currentDate: now });
    this.loadAllViewData(now);
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.data.currentDate) {
      this.loadAllViewData(this.data.currentDate);
    }
  },

  setNavBarHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44;
    this.setData({ statusBarHeight, navBarHeight });
  },

  // 切换视图（顶部 tab）
  switchView(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 加载日 / 周 / 月视图所需的全部数据
  async loadAllViewData(date) {
    this.setData({ loading: true });

    try {
      // 以“当前月份”为范围向云函数请求数据
      const { first: monthFirst, last: monthLast } = getLocalMonthRange(date);
      const startDate = formatLocalDate(monthFirst); // YYYY-MM-DD
      const endDate = formatLocalDate(monthLast);

      // 获取用户设备当前时区偏移（分钟）
      // 例如：北京时间 UTC+8 返回 480，纽约 UTC-5 返回 -300
      const timezoneOffsetMinutes = getTimezoneOffsetMinutes();

      // 调用云函数获取真实数据，传入用户时区偏移
      let habitData = {};
      try {
        const res = await wx.cloud.callFunction({
          name: "getHabitCalendarData",
          data: { startDate, endDate, timezoneOffsetMinutes },
        });

        if (res.result && res.result.success) {
          habitData = res.result.data.dailyData || {};
        } else {
          console.warn("getHabitCalendarData 返回失败或无数据", res.result);
        }
      } catch (cloudErr) {
        console.warn(
          "getHabitCalendarData 云函数调用失败，使用空数据",
          cloudErr
        );
      }

      this.setData({ habitData });

      // 更新三种视图
      this.updateDayView(date, habitData);
      this.updateWeekView(date, habitData);
      this.updateMonthView(date, habitData);
    } catch (err) {
      console.error("加载习惯数据失败", err);
    } finally {
      this.setData({ loading: false });
    }
  },

  // ========== 日视图 ==========
  updateDayView(date, habitData) {
    const dateStr = formatLocalDate(date);
    const dayRecord = habitData[dateStr] || {};

    const now = getLocalNow();
    const todayStr = formatLocalDate(now);
    const isToday = todayStr === dateStr;
    const isFuture = date > now && !isToday;

    const habits = HABIT_CONFIG.map((h) => {
      let status = "na";
      if (!isFuture) {
        status = dayRecord[h.key] ? "done" : "undone";
      }
      return { ...h, status };
    });

    const doneCount = habits.filter((h) => h.status === "done").length;
    const totalCount = HABIT_CONFIG.length;

    // 状态标签
    let statusLabel = "今日未开始";
    let statusType = "not_started";
    if (isFuture) {
      statusLabel = "未来日期";
      statusType = "future";
    } else if (doneCount === 0) {
      statusLabel = "今日未开始";
      statusType = "not_started";
    } else if (doneCount < totalCount) {
      statusLabel = "练习进行中";
      statusType = "in_progress";
    } else {
      statusLabel = "今日已打满 ⭐️";
      statusType = "completed";
    }

    // 底部提示语
    let summary = "";
    if (isFuture) {
      summary = "未来的日子，期待你的练习 ✨";
    } else if (doneCount === 0) {
      summary = "今天还没有练习记录，给自己一点启动的勇气吧 ✨";
    } else if (doneCount < totalCount) {
      summary = `你已经为自己做了 ${doneCount} 件小事，很温柔了。`;
    } else {
      summary = "今天你的内在小宇宙在发光 ⭐️";
    }

    const dateDisplay = `${formatLocalDateCN(date)} · ${getWeekdayCN(date)}`;

    this.setData({
      dayData: {
        date: formatLocalDateCN(date),
        dateDisplay,
        weekday: getWeekdayCN(date),
        habits,
        summary,
        doneCount,
        totalCount,
        statusLabel,
        statusType,
      },
    });
  },

  // 点击日视图中的习惯项
  onHabitTap(e) {
    const { key, status, url, isTab, name } = e.currentTarget.dataset;

    if (status === "done") {
      wx.showToast({
        title: `今日已练习过${name}`,
        icon: "none",
        duration: 2000,
      });
    } else if (status === "undone") {
      if (!url) return;
      if (isTab) {
        wx.switchTab({ url });
      } else {
        wx.navigateTo({ url });
      }
    }
  },

  // ========== 周视图 ==========
  updateWeekView(date, habitData) {
    const { monday, sunday } = getLocalWeekRange(date);
    const weekNum = getWeekNumber(date);
    const year = date.getFullYear();

    const now = getLocalNow();
    const todayStr = formatLocalDate(now);

    // 本周七天日期
    const weekDates = getDateRange(monday, sunday);

    // 每天完成总数
    const dailyCompletedCounts = weekDates.map((d) => {
      const dateStr = formatLocalDate(d);
      const isFuture = d > now && dateStr !== todayStr;
      if (isFuture) return 0;

      const dayRecord = habitData[dateStr] || {};
      return HABIT_CONFIG.filter((h) => dayRecord[h.key]).length;
    });

    // 每个习惯的 7 天状态
    const habits = HABIT_CONFIG.map((h) => {
      const days = weekDates.map((d) => {
        const dateStr = formatLocalDate(d);
        const isFuture = d > now && dateStr !== todayStr;
        if (isFuture) return "na";

        const dayRecord = habitData[dateStr] || {};
        return dayRecord[h.key] ? "done" : "undone";
      });
      const weekCount = days.filter((d) => d === "done").length;
      return {
        name: h.name,
        icon: h.icon,
        emoji: h.emoji,
        days,
        weekCount,
      };
    });

    // 完成率
    let totalDone = 0;
    let totalPossible = 0;
    habits.forEach((h) => {
      h.days.forEach((status) => {
        if (status !== "na") {
          totalPossible++;
          if (status === "done") totalDone++;
        }
      });
    });
    const completionPercent =
      totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
    const completionRate = completionPercent + "%";

    // 连续天数（简化版）
    const { streak, bestStreak } = this.calculateStreak(habitData);

    // 本周最佳日
    const weekDayNames = [
      "周一",
      "周二",
      "周三",
      "周四",
      "周五",
      "周六",
      "周日",
    ];
    let bestDayIdx = 0;
    let maxDayCount = 0;
    dailyCompletedCounts.forEach((count, idx) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        bestDayIdx = idx;
      }
    });
    const bestDayText =
      maxDayCount > 0
        ? `${weekDayNames[bestDayIdx]}最用心，完成了${maxDayCount}项练习 💪`
        : "本周还没有完成记录，加油！";

    this.setData({
      weekData: {
        title: `${year} · 第 ${weekNum} 周`,
        subtitle: "这一周，你给自己多少陪伴？",
        weekDays: ["一", "二", "三", "四", "五", "六", "日"],
        habits,
        dailyCompletedCounts,
        stats: {
          completionRate,
          completionPercent,
          streak,
          bestStreak,
          bestDayText,
        },
      },
    });
  },

  // ========== 月视图 ==========
  updateMonthView(date, habitData) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const { first, last } = getLocalMonthRange(date);
    const now = getLocalNow();
    const todayStr = formatLocalDate(now);

    // 第一日是周几（周一=1，周日=7）
    let firstDayOfWeek = first.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7;

    const days = [];

    // 前置空格（上月占位）
    for (let i = 1; i < firstDayOfWeek; i++) {
      days.push({
        day: "",
        status: "",
        dateStr: "",
        completedCount: 0,
        heatLevel: 0,
        completedHabits: [],
      });
    }

    // 当月每一天
    const daysInMonth = last.getDate();
    let totalCompleted = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(year, month, d);
      const dateStr = formatLocalDate(currentDate);
      const isFuture = currentDate > now && dateStr !== todayStr;
      const dayRecord = habitData[dateStr] || {};

      let status = "";
      let completedCount = 0;
      let heatLevel = 0;
      let completedHabits = [];

      if (!isFuture) {
        const doneHabits = HABIT_CONFIG.filter((h) => dayRecord[h.key]);
        completedCount = doneHabits.length;
        completedHabits = doneHabits.map((h) => h.name);

        if (completedCount > 0) {
          status = "done";
          totalCompleted += completedCount;

          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;

          // 3项习惯的热度等级：3项=3级，2项=2级，1项=1级
          if (completedCount >= 3) heatLevel = 3;
          else if (completedCount >= 2) heatLevel = 2;
          else heatLevel = 1;
        } else {
          status = "undone";
          currentStreak = 0;
        }
      }

      days.push({
        day: d,
        status,
        dateStr,
        completedCount,
        heatLevel,
        completedHabits,
      });
    }

    // 填充月末空白
    const remainder = days.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        days.push({
          day: "",
          status: "",
          dateStr: "",
          completedCount: 0,
          heatLevel: 0,
          completedHabits: [],
        });
      }
    }

    // 统计信息
    const isCurrentMonth =
      now.getFullYear() === year && now.getMonth() === month;
    const pastDays = isCurrentMonth ? now.getDate() : daysInMonth;
    const avgPerDay = pastDays > 0 ? (totalCompleted / pastDays).toFixed(1) : 0;

    let summaryText = "";
    if (totalCompleted === 0) {
      summaryText = "这个月还没有练习记录，现在开始也不晚 🌱";
    } else if (avgPerDay < 1) {
      summaryText = "这是一个有起伏但持续前进的月份，感谢你对自己的不放弃 🌱";
    } else if (avgPerDay < 3) {
      summaryText = "你正在培养一个温柔的习惯，继续加油 💛";
    } else {
      summaryText = "这个月你对自己很好，内在的花园正在绽放 🌸";
    }

    this.setData({
      monthData: {
        title: `${year} 年 ${String(month + 1).padStart(2, "0")} 月`,
        subtitle: "这一整个月，你对自己的陪伴轨迹",
        weekDays: ["一", "二", "三", "四", "五", "六", "日"],
        days,
        selectedDay: null,
        selectedDaySummary: "",
        selectedDateStr: "",
        stats: {
          totalCompleted,
          avgPerDay,
          bestStreak: maxStreak,
          summaryText,
        },
      },
    });
  },

  // 点击月视图中的某一天
  onMonthDayTap(e) {
    const { day, dateStr, completedCount, completedHabits, status } =
      e.currentTarget.dataset;

    if (!day || status === "") return; // 空白格子不响应

    let selectedDaySummary = "";
    if (completedCount > 0) {
      const month = parseInt(dateStr.split("-")[1], 10);
      const habitList = completedHabits.join("、");
      selectedDaySummary = `${month}月${day}日：完成了 ${habitList} ${completedCount} 项练习。`;
    } else {
      const month = parseInt(dateStr.split("-")[1], 10);
      selectedDaySummary = `${month}月${day}日：当天没有练习记录。`;
    }

    this.setData({
      "monthData.selectedDay": day,
      "monthData.selectedDaySummary": selectedDaySummary,
      "monthData.selectedDateStr": dateStr,
    });
  },

  // 查看选中日期的详情（从月视图跳到日视图）
  viewSelectedDayDetail() {
    const { selectedDateStr } = this.data.monthData;
    if (!selectedDateStr) return;

    const [y, m, d] = selectedDateStr.split("-").map(Number);
    const targetDate = new Date(y, m - 1, d);

    this.setData(
      {
        currentTab: "day",
        currentDate: targetDate,
      },
      () => {
        this.updateDayView(targetDate, this.data.habitData);
      }
    );
  },

  // 计算连续天数（从今天往前看最多 90 天）
  calculateStreak(habitData) {
    const now = getLocalNow();
    let streak = 0;
    let bestStreak = 0;
    let currentStreak = 0;

    const checkDate = new Date(now);
    for (let i = 0; i < 90; i++) {
      const dateStr = formatLocalDate(checkDate);
      const dayRecord = habitData[dateStr] || {};
      const hasDone = HABIT_CONFIG.some((h) => dayRecord[h.key]);

      if (hasDone) {
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        if (i === 0) {
          // 今天开始的连续天数
          streak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    return { streak, bestStreak };
  },
});
