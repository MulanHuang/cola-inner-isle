const app = getApp();
const db = wx.cloud.database();

// 获取本地日期工具函数
function formatLocalDate(ts) {
  const d = ts instanceof Date ? ts : new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getTimezoneOffsetMinutes() {
  return -new Date().getTimezoneOffset();
}

function getLocalWeekRange(date) {
  const day = date.getDay() === 0 ? 7 : date.getDay();
  const monday = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - (day - 1)
  );
  const sunday = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 6
  );
  return { monday, sunday };
}

// 习惯配置
const HABIT_KEYS = ["tarot", "meditation", "emotion"];

// 习惯中文名称映射
const HABIT_NAMES = {
  tarot: "塔罗",
  meditation: "冥想",
  emotion: "情绪",
};

Page({
  data: {
    dailyQuote: {
      content: "每一次呼吸，都是与自己和解的机会",
      author: "",
    },
    todayTarot: null,
    tarotStatus: "未抽取",
    statusBarHeight: 0,
    navBarHeight: 0,
    // 本周习惯数据：每个习惯7天的状态数组
    weekHabitData: {
      tarot: [false, false, false, false, false, false, false],
      meditation: [false, false, false, false, false, false, false],
      emotion: [false, false, false, false, false, false, false],
    },
    // 本周日期数组（用于日历点击）
    weekDates: [],
    // 今天是本周的第几天（0=周一，6=周日）
    todayWeekIndex: 0,
    // 日历弹窗相关数据
    calendarDailyData: {}, // 保存云函数返回的 dailyData
    calendarHabitRecords: {}, // 保存云函数返回的 habitRecords
    selectedDate: "", // 当前选中的日期字符串 (YYYY-MM-DD)
    selectedDateDisplay: "", // 当前选中日期的显示格式 (MM月DD日)
    selectedDayDetail: null, // 当前日期的明细对象
    showDayDetailPopup: false, // 是否展示当日完成情况弹窗
  },

  onLoad() {
    this.setNavBarHeight();
    this.loadDailyQuote();
    this.checkTodayTarot();
    this.loadWeekHabitData();
  },

  // 设置导航栏高度
  setNavBarHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44; // 44px 是导航栏内容高度
    this.setData({
      statusBarHeight,
      navBarHeight,
    });
  },

  onShow() {
    this.checkTodayTarot();
    this.loadWeekHabitData();

    // ✅ 这里新增：同步 tabBar 选中首页
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  // 加载本周习惯数据
  async loadWeekHabitData() {
    try {
      const now = new Date();
      const { monday, sunday } = getLocalWeekRange(now);
      const startDate = formatLocalDate(monday);
      const endDate = formatLocalDate(sunday);
      const timezoneOffsetMinutes = getTimezoneOffsetMinutes();

      const res = await wx.cloud.callFunction({
        name: "getHabitCalendarData",
        data: { startDate, endDate, timezoneOffsetMinutes },
      });

      if (res.result && res.result.success) {
        const dailyData = res.result.data.dailyData || {};
        const habitRecords = res.result.data.habitRecords || {};

        // 构建本周7天的日期数组（周一到周日）
        const weekDates = [];
        const current = new Date(monday);
        for (let i = 0; i < 7; i++) {
          weekDates.push(formatLocalDate(current));
          current.setDate(current.getDate() + 1);
        }

        // 为每个习惯构建7天状态
        const weekHabitData = {};
        HABIT_KEYS.forEach((habitKey) => {
          weekHabitData[habitKey] = weekDates.map((dateStr) => {
            const dayRecord = dailyData[dateStr] || {};
            return !!dayRecord[habitKey];
          });
        });

        // 计算今天是本周的第几天（0=周一，6=周日）
        const todayStr = formatLocalDate(now);
        const todayWeekIndex = weekDates.indexOf(todayStr);

        this.setData({
          weekHabitData,
          weekDates,
          todayWeekIndex: todayWeekIndex >= 0 ? todayWeekIndex : 0,
          calendarDailyData: dailyData,
          calendarHabitRecords: habitRecords,
        });
        console.log("[home] 本周习惯数据已加载", weekHabitData, weekDates);
      }
    } catch (err) {
      console.warn("[home] 加载本周习惯数据失败", err);
    }
  },

  // 加载每日一句
  async loadDailyQuote() {
    try {
      const res = await db
        .collection("quotes")
        .aggregate()
        .sample({ size: 1 })
        .end();

      if (res.list && res.list.length > 0) {
        this.setData({
          dailyQuote: res.list[0],
        });
      }
    } catch (err) {
      console.error("加载每日一句失败", err);
    }
  },

  // 刷新每日一句
  refreshQuote() {
    this.loadDailyQuote();
  },

  // 检查今日塔罗
  async checkTodayTarot() {
    try {
      const today = new Date().toDateString();
      const res = await db
        .collection("tarotDraws")
        .where({
          _openid: "{openid}",
          date: today,
        })
        .orderBy("createTime", "desc")
        .limit(1)
        .get();

      if (res.data && res.data.length > 0) {
        const draw = res.data[0];
        // 获取塔罗牌详情
        const cardRes = await db
          .collection("tarotCards")
          .doc(draw.cardId)
          .get();

        this.setData({
          todayTarot: cardRes.data,
          tarotStatus: "已抽取",
        });
      } else {
        this.setData({
          todayTarot: null,
          tarotStatus: "未抽取",
        });
      }
    } catch (err) {
      console.error("检查今日塔罗失败", err);
    }
  },

  // 跳转到塔罗页面
  goToTarot() {
    wx.navigateTo({
      url: "/pages/tarot/tarot",
    });
  },

  // 重新抽取塔罗（直接进入重置模式）
  redoTarot() {
    wx.navigateTo({
      url: "/pages/tarot/tarot?reset=1",
    });
  },

  // 跳转到情绪记录
  goToEmotion() {
    wx.navigateTo({
      url: "/pages/emotion/emotion",
    });
  },

  // 跳转到AI对话
  goToChat() {
    wx.switchTab({
      url: "/pages/chat/chat",
    });
  },

  // 跳转到冥想
  goToMeditation() {
    wx.switchTab({
      url: "/pages/meditation/meditation",
    });
  },

  // 跳转到自我探索
  goToExplore() {
    wx.navigateTo({
      url: "/pages/explore/explore",
    });
  },

  // 跳转到OH卡
  goToOhCard() {
    wx.navigateTo({
      url: "/pages/oh/oh",
    });
  },

  // 跳转到完整打卡日历页面
  goToHabitCalendar() {
    wx.navigateTo({
      url: "/pages/habitCalendar/habitCalendar",
    });
  },

  // 处理日历日期点击
  handleCalendarDayTap(e) {
    const dateKey = e.currentTarget.dataset.date;
    if (!dateKey) return;

    const { calendarHabitRecords, calendarDailyData } = this.data;

    // 从 habitRecords 中筛选对应日期的记录
    const emotionList = (calendarHabitRecords.emotion || []).filter(
      (r) => r.localDate === dateKey
    );
    const meditationList = (calendarHabitRecords.meditation || []).filter(
      (r) => r.localDate === dateKey
    );
    const tarotList = (calendarHabitRecords.tarot || []).filter(
      (r) => r.localDate === dateKey
    );

    // 获取当天的完成状态
    const dayStatus = calendarDailyData[dateKey] || {};

    // 构建 selectedDayDetail 对象
    const selectedDayDetail = {
      hasEmotion: !!dayStatus.emotion,
      hasMeditation: !!dayStatus.meditation,
      hasTarot: !!dayStatus.tarot,
      emotionList,
      meditationList,
      tarotList,
      emotionCount: emotionList.length,
      meditationCount: meditationList.length,
      tarotCount: tarotList.length,
      hasAnyRecord:
        emotionList.length > 0 ||
        meditationList.length > 0 ||
        tarotList.length > 0,
    };

    // 格式化日期显示（将 YYYY-MM-DD 转为 MM月DD日）
    const [, month, day] = dateKey.split("-");
    const displayDate = `${parseInt(month)}月${parseInt(day)}日`;

    this.setData({
      selectedDate: dateKey,
      selectedDateDisplay: displayDate,
      selectedDayDetail,
      showDayDetailPopup: true,
    });
  },

  // 关闭当日完成情况弹窗
  closeDayDetailPopup() {
    this.setData({
      showDayDetailPopup: false,
    });
  },
});
