// pages/explore/week-plan/week-plan.js
const {
  formatLocalDate,
  getLocalWeekRange,
  getWeekNumber,
} = require("../../../subpackages/common/dateUtils.js");
const { callAIStream } = require("../../../utils/aiStream.js");

// AI 成长教练 System Prompt（严格按照需求文档，不可删改）
const AI_COACH_SYSTEM_PROMPT = `你是一位「支持型生命成长复盘教练
（Supportive Life Review Coach）」。

你站在用户这一边，
通过复盘每日 / 每周 / 每月的计划与记录，
帮助他们看见自己的力量与可能的盲点，
并理解：现在的生活方式，是否在支持他们想实现的目标。

你相信：
- 用户大多是努力的
- 卡住往往不是态度问题，而是结构性盲点
- 成长来自看见，而不是被要求

【必须遵守的原则】
1. 不评价好坏、对错、合理性
2. 不否定用户的目标或努力
3. 不使用“你应该 / 建议你”等指令性语言
4. 不给具体行动方案
5. 不扮演心理咨询、诊断或成功学导师
6. 不用羞辱、比较或施压促成改变

你可以指出“可能的盲点”，
但必须温和、具体，并尊重用户的主体性。

【你的核心任务】
帮助用户同时看见三件事：
1️⃣ 已经在努力的地方（力量）
2️⃣ 正在如何为目标付出（方向）
3️⃣ 是否存在结构性的张力或失衡（可调整之处）

你的目标不是制造焦虑，
而是带来一种清醒而温柔的力量感：
“原来我可以这样微调。”

【输出结构（必须遵守）】
【第一部分｜你已经在努力的地方】
- 指出记录中真实存在的投入或坚持
- 使用具体事实，而非泛泛夸奖

【第二部分｜与你目标之间的关系】
- 回到用户自己写下的目标
- 描述当前节奏如何在服务（或挤压）这个目标
- 不评价好坏

【第三部分｜可能被忽略的地方】
- 这是唯一允许指出问题的部分
- 不使用“问题 / 缺陷”等词
- 使用中性词：张力、集中、倾斜、挤压、忽略
- 必须基于记录中的分布或重复模式

【第四部分｜留给你的成长性问题】
- 提出 1–3 个贴合记录的问题
- 目的是引发觉察，而不是要求改变
- 选择权必须完全交还给用户


【语气与风格】
- 温暖、具体、有力量
- 使用第一人称「我」
- 像并肩看一张时间地图
- 避免专业术语与管理话术
- 单次回应不超过 500 字（中文）

【你希望用户最终感受到】
- 我被看见了
- 问题不在我不够努力
- 我知道哪里可以微调
- 我更有力量继续往前走

记住：
改变不是来自被纠正，
而是来自被理解后的清醒。`;

Page({
  data: {
    // 当前周信息
    currentYear: 0,
    currentMonth: 0,
    weekOfMonth: 0,
    weekKey: "", // 年份-周序号，作为存储唯一索引
    weekRangeDisplay: "",
    // 周一到周日的日期
    currentMonday: null,
    currentSunday: null,
    // 日历相关
    calWeekDays: ["一", "二", "三", "四", "五", "六", "日"],
    calendarDays: [],
    // 每日任务记录（用于标记日历）
    dailyRecordDates: {},
    // 周任务分解（按天）
    weekDays: [
      {
        label: "星期一",
        color: "#f5c87a",
        dotColor: "#f5c87a",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期二",
        color: "#e8a07a",
        dotColor: "#e8a07a",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期三",
        color: "#a8c87a",
        dotColor: "#a8c87a",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期四",
        color: "#7ac8c8",
        dotColor: "#7ac8c8",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期五",
        color: "#c87a7a",
        dotColor: "#c87a7a",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期六",
        color: "#c8a07a",
        dotColor: "#c8a07a",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期日",
        color: "#7a9ac8",
        dotColor: "#7a9ac8",
        tasks: [{ text: "", completed: false }],
      },
    ],
    // 关键事件
    keyEvents: [{ text: "", completed: false }],
    // 上周复盘
    lastWeekReview: "",
    // 本周待提升
    weekImprovement: "",
    // 是否已有记录
    hasExistingRecord: false,
    // 上周每日记录数量（联动功能）
    lastWeekDailyCount: 0,
    // 本周每日记录列表（联动功能）
    thisWeekDailyRecords: [],
    showWeekDailySheet: false,
    // AI 成长教练相关
    aiCoachLoading: false,
    aiCoachResponse: "",
    aiCoachResultExpanded: true,
  },

  onLoad() {
    this.initCurrentWeek();
  },

  onShow() {
    this.loadDailyRecords();
    this.loadWeekRecord();
  },

  // 初始化当前周
  initCurrentWeek() {
    const now = new Date();
    this.setWeekByDate(now);
  },

  // 根据日期设置周信息
  setWeekByDate(date) {
    const { monday, sunday } = getLocalWeekRange(date);
    const year = monday.getFullYear();
    const weekNum = getWeekNumber(monday);
    const weekKey = `${year}-W${String(weekNum).padStart(2, "0")}`;

    // 计算是当月第几周
    const monthStart = new Date(monday.getFullYear(), monday.getMonth(), 1);
    const firstWeekNum = getWeekNumber(monthStart);
    const weekOfMonth = weekNum - firstWeekNum + 1;

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

    this.setData({
      currentYear: year,
      currentMonth: mondayMonth,
      weekOfMonth: weekOfMonth > 0 ? weekOfMonth : 1,
      weekKey,
      weekRangeDisplay,
      currentMonday: monday,
      currentSunday: sunday,
    });

    this.generateCalendar();
    this.loadWeekRecord();
  },

  // 上一周
  prevWeek() {
    const { currentMonday } = this.data;
    const prevMonday = new Date(currentMonday);
    prevMonday.setDate(prevMonday.getDate() - 7);
    this.setWeekByDate(prevMonday);
  },

  // 下一周
  nextWeek() {
    const { currentMonday } = this.data;
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    this.setWeekByDate(nextMonday);
  },

  // 生成日历
  generateCalendar() {
    const { currentMonday, currentSunday, dailyRecordDates } = this.data;
    const today = formatLocalDate(new Date());

    // 获取该周所在月的日历数据
    const monthStart = new Date(
      currentMonday.getFullYear(),
      currentMonday.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentMonday.getFullYear(),
      currentMonday.getMonth() + 1,
      0
    );
    const daysInMonth = monthEnd.getDate();

    // 该月第一天是周几
    let firstDayOfWeek = monthStart.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7;

    const days = [];
    // 前置空白
    for (let i = 1; i < firstDayOfWeek; i++) {
      days.push({ day: "", isCurrentWeek: false });
    }

    // 当月每一天
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(
        currentMonday.getFullYear(),
        currentMonday.getMonth(),
        d
      );
      const dateStr = formatLocalDate(dateObj);
      const isCurrentWeek =
        dateObj >= currentMonday && dateObj <= currentSunday;
      const hasDailyRecord = !!dailyRecordDates[dateStr];
      const isToday = dateStr === today;
      days.push({ day: d, dateStr, isCurrentWeek, hasDailyRecord, isToday });
    }

    // 填充末尾空白
    const remainder = days.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        days.push({ day: "", isCurrentWeek: false });
      }
    }

    this.setData({ calendarDays: days });
  },

  // 加载每日计划记录（用于日历标记和联动提示）
  loadDailyRecords() {
    const { currentMonday, currentSunday } = this.data;
    const records = wx.getStorageSync("dailyPlanRecords") || {};
    const dailyRecordDates = {};
    Object.keys(records).forEach((date) => {
      dailyRecordDates[date] = true;
    });

    // 计算上周的每日记录数量（联动功能）
    let lastWeekDailyCount = 0;
    if (currentMonday) {
      const lastMonday = new Date(currentMonday);
      lastMonday.setDate(lastMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastSunday.getDate() + 6);

      for (
        let d = new Date(lastMonday);
        d <= lastSunday;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = formatLocalDate(new Date(d));
        if (dailyRecordDates[dateStr]) {
          lastWeekDailyCount++;
        }
      }
    }

    // 收集本周的每日记录列表（联动功能）
    const thisWeekDailyRecords = [];
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    if (currentMonday && currentSunday) {
      for (
        let d = new Date(currentMonday);
        d <= new Date(currentSunday);
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = formatLocalDate(new Date(d));
        if (records[dateStr]) {
          const dateObj = new Date(d);
          const displayDate = `${
            dateObj.getMonth() + 1
          }月${dateObj.getDate()}日 周${weekDays[dateObj.getDay()]}`;
          const record = records[dateStr];
          let preview = "";
          if (record.content) {
            preview =
              record.content.substring(0, 20) +
              (record.content.length > 20 ? "..." : "");
          }
          thisWeekDailyRecords.push({ date: dateStr, displayDate, preview });
        }
      }
    }

    this.setData({
      dailyRecordDates,
      lastWeekDailyCount,
      thisWeekDailyRecords,
    });
    this.generateCalendar();
  },

  // 加载当前周记录
  loadWeekRecord() {
    const { weekKey } = this.data;
    const records = wx.getStorageSync("weekPlanRecords") || {};
    const weekRecord = records[weekKey];

    if (weekRecord) {
      // 合并已保存的周任务
      const defaultWeekDays = this.getDefaultWeekDays();
      const loadedWeekDays = defaultWeekDays.map((day, index) => {
        const savedDay = weekRecord.weekDays && weekRecord.weekDays[index];
        const savedTasks =
          savedDay && Array.isArray(savedDay.tasks) ? savedDay.tasks : [];
        return {
          ...day,
          tasks: this.normalizeTaskList(savedTasks),
        };
      });

      // 加载关键事件
      const loadedKeyEvents = this.normalizeTaskList(
        weekRecord.keyEvents && weekRecord.keyEvents.length > 0
          ? weekRecord.keyEvents
          : this.getDefaultKeyEvents()
      );

      this.setData({
        weekDays: loadedWeekDays,
        keyEvents: loadedKeyEvents,
        lastWeekReview: weekRecord.lastWeekReview || "",
        weekImprovement: weekRecord.weekImprovement || "",
        hasExistingRecord: true,
      });
    } else {
      // 重置为默认状态
      this.setData({
        weekDays: this.getDefaultWeekDays(),
        keyEvents: this.getDefaultKeyEvents(),
        lastWeekReview: "",
        weekImprovement: "",
        hasExistingRecord: false,
      });
    }
  },

  // 获取默认的周任务结构
  getDefaultWeekDays() {
    return [
      {
        label: "星期一",
        color: "#f5c87a",
        dotColor: "#f5c87a",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期二",
        color: "#e8a07a",
        dotColor: "#e8a07a",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期三",
        color: "#a8c87a",
        dotColor: "#a8c87a",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期四",
        color: "#7ac8c8",
        dotColor: "#7ac8c8",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期五",
        color: "#c87a7a",
        dotColor: "#c87a7a",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期六",
        color: "#c8a07a",
        dotColor: "#c8a07a",
        tasks: [{ text: "", completed: false }],
      },
      {
        label: "星期日",
        color: "#7a9ac8",
        dotColor: "#7a9ac8",
        tasks: [{ text: "", completed: false }],
      },
    ];
  },

  // 默认关键事件
  getDefaultKeyEvents() {
    return [{ text: "", completed: false }];
  },

  // 统一兼容旧数据结构
  normalizeTaskList(list = []) {
    const normalized =
      list && list.length
        ? list.map((item) => {
            if (typeof item === "string") {
              return { text: item, completed: false };
            }
            return {
              text: item.text || "",
              completed: !!item.completed,
            };
          })
        : [];
    return normalized.length ? normalized : [{ text: "", completed: false }];
  },

  // 日任务输入
  onDayTaskInput(e) {
    const { dayIndex, taskIndex } = e.currentTarget.dataset;
    const value = e.detail.value;
    const weekDays = [...this.data.weekDays];
    weekDays[dayIndex].tasks[taskIndex].text = value;
    this.setData({ weekDays });
  },

  // 切换周任务完成状态
  toggleDayTaskComplete(e) {
    const { dayIndex, taskIndex } = e.currentTarget.dataset;
    const weekDays = [...this.data.weekDays];
    const task = weekDays[dayIndex].tasks[taskIndex];
    task.completed = !task.completed;
    this.setData({ weekDays });
  },

  // 添加日任务
  addDayTask(e) {
    const { dayIndex } = e.currentTarget.dataset;
    const weekDays = [...this.data.weekDays];
    weekDays[dayIndex].tasks.push({ text: "", completed: false });
    this.setData({ weekDays });
  },

  // 删除日任务
  removeDayTask(e) {
    const { dayIndex, taskIndex } = e.currentTarget.dataset;
    const weekDays = [...this.data.weekDays];
    const tasks = weekDays[dayIndex].tasks;
    if (tasks.length > 1) {
      tasks.splice(taskIndex, 1);
    } else {
      tasks[0] = { text: "", completed: false };
    }
    this.setData({ weekDays });
  },

  // 关键事件输入
  onKeyEventInput(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const keyEvents = [...this.data.keyEvents];
    keyEvents[index].text = value;
    this.setData({ keyEvents });
  },

  // 关键事件完成状态
  toggleKeyEventComplete(e) {
    const index = e.currentTarget.dataset.index;
    const keyEvents = [...this.data.keyEvents];
    keyEvents[index].completed = !keyEvents[index].completed;
    this.setData({ keyEvents });
  },

  // 添加关键事件
  addKeyEvent() {
    const keyEvents = [...this.data.keyEvents, { text: "", completed: false }];
    this.setData({ keyEvents });
  },

  // 删除关键事件
  removeKeyEvent(e) {
    const index = e.currentTarget.dataset.index;
    const keyEvents = [...this.data.keyEvents];
    if (keyEvents.length > 1) {
      keyEvents.splice(index, 1);
    } else {
      keyEvents[0] = { text: "", completed: false };
    }
    this.setData({ keyEvents });
  },

  // 上周复盘输入
  onLastWeekReviewInput(e) {
    this.setData({ lastWeekReview: e.detail.value });
  },

  // 本周待提升输入
  onWeekImprovementInput(e) {
    this.setData({ weekImprovement: e.detail.value });
  },

  // 保存记录
  saveRecord() {
    const {
      weekKey,
      currentYear,
      currentMonth,
      weekOfMonth,
      weekDays,
      keyEvents,
      lastWeekReview,
      weekImprovement,
    } = this.data;

    // 过滤空值
    const filteredWeekDays = weekDays.map((day) => ({
      label: day.label,
      tasks: day.tasks
        .filter((t) => t.text.trim())
        .map((t) => ({ text: t.text, completed: t.completed })),
    }));

    const filteredKeyEvents = keyEvents
      .filter((e) => e.text.trim())
      .map((e) => ({ text: e.text, completed: e.completed }));

    const record = {
      weekKey,
      year: currentYear,
      month: currentMonth,
      weekOfMonth,
      weekDays: filteredWeekDays,
      keyEvents: filteredKeyEvents,
      lastWeekReview,
      weekImprovement,
      createdAt: new Date().toISOString(),
    };

    // 保存到本地存储
    const records = wx.getStorageSync("weekPlanRecords") || {};
    records[weekKey] = record;
    wx.setStorageSync("weekPlanRecords", records);

    this.setData({ hasExistingRecord: true });

    wx.showToast({
      title: "已经帮你把这一周收好了",
      icon: "none",
      duration: 2000,
    });
  },

  // 点击日历日期 - 跳转到每日记录详情（联动功能）
  onCalDayTap(e) {
    const { dateStr, hasRecord } = e.currentTarget.dataset;
    if (!dateStr || !hasRecord) return;
    wx.navigateTo({
      url: `/pages/explore/daily-plan/detail/detail?date=${dateStr}`,
    });
  },

  // 显示本周每日记录列表弹层（联动功能）
  showWeekDailySheet() {
    this.setData({ showWeekDailySheet: true });
  },

  // 隐藏本周每日记录列表弹层
  hideWeekDailySheet() {
    this.setData({ showWeekDailySheet: false });
  },

  // 跳转到每日记录详情（联动功能）
  goToDailyDetail(e) {
    const { date } = e.currentTarget.dataset;
    if (!date) return;
    this.setData({ showWeekDailySheet: false });
    wx.navigateTo({
      url: `/pages/explore/daily-plan/detail/detail?date=${date}`,
    });
  },

  // 阻止弹层滚动穿透
  preventTouchMove() {},

  // 查看历史记录
  viewHistory() {
    wx.navigateTo({
      url: "/pages/explore/week-plan/history/history",
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // ========== AI 成长教练相关方法 ==========

  // 触发 AI 周度觉察
  triggerWeeklyAICoach() {
    if (this.data.aiCoachLoading) return;

    // 收集本周数据
    const weeklyData = this.collectWeeklyDataForAI();

    if (!weeklyData.hasContent) {
      wx.showToast({
        title: "这周的记录还比较少，先写一些再来看看",
        icon: "none",
        duration: 2500,
      });
      return;
    }

    this.setData({
      aiCoachLoading: true,
      aiCoachResponse: "",
      aiCoachResultExpanded: true,
    });

    // 构建用户消息
    const userPrompt = this.buildWeeklyUserPrompt(weeklyData);

    // 调用 AI 流式接口
    this._aiStreamTask = callAIStream({
      messages: [
        { role: "system", content: AI_COACH_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      model: "gpt-5-mini",
      temperature: 0.8,
      max_completion_tokens: 1000,
      onChunk: (chunk, fullText) => {
        this.setData({ aiCoachResponse: fullText });
      },
      onComplete: (fullText) => {
        this.setData({
          aiCoachLoading: false,
          aiCoachResponse: fullText,
        });
        this._aiStreamTask = null;
      },
      onError: (err) => {
        console.error("[AI Coach] 调用失败:", err);
        this.setData({
          aiCoachLoading: false,
          aiCoachResponse: "暂时无法连接，请稍后再试。",
        });
        this._aiStreamTask = null;
      },
    });
  },

  // 收集本周数据用于 AI 分析
  collectWeeklyDataForAI() {
    const {
      weekRangeDisplay,
      weekDays,
      keyEvents,
      lastWeekReview,
      weekImprovement,
      thisWeekDailyRecords,
    } = this.data;

    // 检查是否有足够内容
    let hasContent = false;

    // 检查周任务
    const weekTasksSummary = weekDays
      .map((day) => {
        const tasks = day.tasks
          .filter((t) => t.text && t.text.trim())
          .map((t) => `${t.completed ? "✓" : "○"} ${t.text}`)
          .join("\n    ");
        if (tasks) {
          hasContent = true;
          return `  ${day.label}:\n    ${tasks}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n");

    // 检查关键事件
    const keyEventsSummary = keyEvents
      .filter((e) => e.text && e.text.trim())
      .map((e) => `${e.completed ? "✓" : "○"} ${e.text}`)
      .join("\n  ");
    if (keyEventsSummary) hasContent = true;

    // 检查复盘内容
    if (lastWeekReview && lastWeekReview.trim()) hasContent = true;
    if (weekImprovement && weekImprovement.trim()) hasContent = true;

    // 每日记录摘要
    const dailySummary = thisWeekDailyRecords
      .map((r) => `  ${r.displayDate}: ${r.preview}`)
      .join("\n");
    if (dailySummary) hasContent = true;

    return {
      hasContent,
      weekRangeDisplay,
      weekTasksSummary,
      keyEventsSummary,
      lastWeekReview: lastWeekReview || "",
      weekImprovement: weekImprovement || "",
      dailySummary,
    };
  },

  // 构建周度 AI 用户提示词
  buildWeeklyUserPrompt(data) {
    let prompt = `这是我这一周（${data.weekRangeDisplay}）的记录：\n\n`;

    if (data.weekTasksSummary) {
      prompt += `【周任务分解】\n${data.weekTasksSummary}\n\n`;
    }

    if (data.keyEventsSummary) {
      prompt += `【关键事件】\n  ${data.keyEventsSummary}\n\n`;
    }

    if (data.lastWeekReview) {
      prompt += `【上周复盘】\n  ${data.lastWeekReview}\n\n`;
    }

    if (data.weekImprovement) {
      prompt += `【本周待提升】\n  ${data.weekImprovement}\n\n`;
    }

    if (data.dailySummary) {
      prompt += `【本周每日记录摘要】\n${data.dailySummary}\n\n`;
    }

    prompt += "请基于以上内容，帮我换一个视角看看这一周。";

    return prompt;
  },

  // 切换 AI 结果展开/收起
  toggleAICoachResult() {
    this.setData({
      aiCoachResultExpanded: !this.data.aiCoachResultExpanded,
    });
  },
});
