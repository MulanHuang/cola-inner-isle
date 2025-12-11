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
    // 个人档案引导弹窗
    showProfilePrompt: false, // 是否展示个人档案引导弹窗
  },

  triggerTapFeedback(type = "light") {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type });
    }
  },

  onLoad() {
    this.setNavBarHeight();
    this.loadDailyQuote();
    this.checkTodayTarot();
    this.loadWeekHabitData();
    this.checkProfileCompletion();
  },

  onNavReady(e) {
    const { navBarHeight, statusBarHeight } = e.detail || {};
    if (navBarHeight) {
      this.setData({
        navBarHeight,
        statusBarHeight: statusBarHeight || this.data.statusBarHeight,
      });
    }
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
    this.triggerTapFeedback();
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
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/tarot/tarot",
    });
  },

  // 重新抽取塔罗（直接进入重置模式）
  redoTarot() {
    this.triggerTapFeedback("medium");
    wx.navigateTo({
      url: "/pages/tarot/tarot?reset=1",
    });
  },

  // 跳转到情绪记录
  goToEmotion() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/emotion/emotion",
    });
  },

  // 跳转到AI对话
  goToChat() {
    this.triggerTapFeedback();
    wx.switchTab({
      url: "/pages/chat/chat",
    });
  },

  // 跳转到冥想
  goToMeditation() {
    this.triggerTapFeedback();
    wx.switchTab({
      url: "/pages/meditation/meditation",
    });
  },

  // 跳转到自我探索
  goToExplore() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/explore/explore",
    });
  },

  // 跳转到OH卡
  goToOhCard() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/oh/oh",
    });
  },

  // 跳转到MBTI
  goToMBTI() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/explore/mbti/mbti",
    });
  },

  // 跳转到星座
  goToZodiac() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/explore/zodiac/zodiac",
    });
  },

  // 跳转到内在小孩
  goToInnerChild() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/explore/innerchild/innerchild",
    });
  },

  // 跳转到脉轮测试
  goToChakraTest() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/chakraTest/index",
    });
  },

  // 跳转到人生梦想九宫格
  goToDreamGrid() {
    this.triggerTapFeedback();
    wx.navigateTo({
      url: "/pages/dreamGrid/dreamGrid",
    });
  },

  // 跳转到完整打卡日历页面
  goToHabitCalendar() {
    this.triggerTapFeedback();
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

  /**
   * 检查是否需要显示个人档案引导弹窗
   * 智能渐进式提示策略：
   * 1. 档案已完善 → 不提示
   * 2. 已跳过2次以上 → 不再主动弹窗
   * 3. 7天内跳过过 → 不提示
   */
  checkProfileCompletion() {
    // 1. 检查档案是否已完善
    const profile = wx.getStorageSync("userProfile");
    if (profile && profile.gender && profile.birthDate && profile.birthTime) {
      // 档案已完善，不提示
      return;
    }

    // 2. 检查提示记录
    const promptRecord = wx.getStorageSync("profilePromptRecord") || {};
    const { dismissCount = 0, lastDismissTime = 0 } = promptRecord;

    // 3. 如果已经跳过2次以上，不再主动弹窗
    if (dismissCount >= 2) {
      console.log("[home] 用户已跳过档案提示2次，不再主动弹窗");
      return;
    }

    // 4. 如果7天内跳过过，不提示
    if (lastDismissTime > 0) {
      const daysSinceLastDismiss =
        (Date.now() - lastDismissTime) / (1000 * 60 * 60 * 24);
      if (daysSinceLastDismiss < 7) {
        console.log(
          "[home] 距离上次跳过不足7天，不提示",
          Math.floor(daysSinceLastDismiss),
          "天前跳过"
        );
        return;
      }
    }

    // 延迟显示弹窗，让页面先加载完成
    setTimeout(() => {
      this.setData({ showProfilePrompt: true });
    }, 800);
  },

  // 关闭个人档案引导弹窗（稍后再说）
  closeProfilePrompt() {
    this.setData({ showProfilePrompt: false });

    // 记录跳过次数和时间
    const promptRecord = wx.getStorageSync("profilePromptRecord") || {};
    const newRecord = {
      dismissCount: (promptRecord.dismissCount || 0) + 1,
      lastDismissTime: Date.now(),
    };
    wx.setStorageSync("profilePromptRecord", newRecord);
    console.log(
      "[home] 用户跳过档案提示，累计跳过次数:",
      newRecord.dismissCount
    );
  },

  // 跳转到个人档案页面
  goToProfileInfo() {
    this.setData({ showProfilePrompt: false });
    wx.navigateTo({
      url: "/pages/profile/profile-info/profile-info",
    });
  },
});
