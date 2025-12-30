// pages/explore/monthly-plan/monthly-plan.js
const { formatLocalDate } = require("../../../utils/dateUtils.js");
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

const MONTH_NAMES_EN = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

Page({
  data: {
    // 当前月份信息
    currentYear: 0,
    currentMonth: 0,
    monthKey: "",
    monthNameEn: "",
    // 星期表头（带图标）
    weekDaysWithIcon: [
      { name: "MON" },
      { name: "TUE" },
      { name: "WED" },
      { name: "THU" },
      { name: "FRI" },
      { name: "SAT" },
      { name: "SUN" },
    ],
    // 日历数据
    calendarDays: [],
    // 月度内容数据
    monthContents: {},
    // 每日计划记录（用于日历标记）
    dailyRecordDates: {},
    // 本月每日记录数量（联动功能）
    monthDailyCount: 0,
    // 本月周记录列表（联动功能）
    monthWeekRecords: [],
    showMonthWeekSheet: false,
    // 本月任务列表
    tasks: [],
    // 编辑弹层状态
    showEditSheet: false,
    editingDateStr: "",
    editingDateDisplay: "",
    editingContent: "",
    editingIndex: -1,
    editingTodos: [],
    editingDateHasDailyRecord: false, // 当前编辑的日期是否有每日记录
    // 任务编辑弹层状态
    showTaskSheet: false,
    editingTaskIndex: -1,
    editingTask: {
      title: "",
      priority: "",
      priorityLabel: "",
      deadline: "",
    },
    // AI 成长教练相关
    aiCoachLoading: false,
    aiCoachResponse: "",
    aiCoachResultExpanded: true,
  },

  onLoad(options) {
    // 检查是否有传入的年份和月份参数（从历史页面跳转过来）
    if (options.year && options.month) {
      const year = parseInt(options.year);
      const month = parseInt(options.month);
      const date = new Date(year, month - 1, 1);
      this.setMonthByDate(date);
    } else {
      this.initCurrentMonth();
    }
  },

  onShow() {
    this.loadDailyRecords();
    this.loadWeekRecords();
    this.loadMonthRecord();
  },

  // 加载每日计划记录（用于日历标记和联动提示）
  loadDailyRecords() {
    const { currentYear, currentMonth } = this.data;
    const records = wx.getStorageSync("dailyPlanRecords") || {};
    const dailyRecordDates = {};
    Object.keys(records).forEach((date) => {
      dailyRecordDates[date] = true;
    });

    // 计算本月的每日记录数量（联动功能）
    let monthDailyCount = 0;
    if (currentYear && currentMonth) {
      const monthPrefix = `${currentYear}-${String(currentMonth).padStart(
        2,
        "0"
      )}`;
      Object.keys(dailyRecordDates).forEach((date) => {
        if (date.startsWith(monthPrefix)) {
          monthDailyCount++;
        }
      });
    }

    this.setData({ dailyRecordDates, monthDailyCount });
  },

  // 加载本月的周记录（联动功能）
  loadWeekRecords() {
    const { currentYear, currentMonth } = this.data;
    const records = wx.getStorageSync("weekPlanRecords") || {};
    const monthWeekRecords = [];

    if (currentYear && currentMonth) {
      Object.keys(records).forEach((weekKey) => {
        const record = records[weekKey];
        // 检查周记录是否属于当前月份
        if (record.year === currentYear && record.month === currentMonth) {
          let preview = "";
          // 从关键事件中提取预览
          if (record.keyEvents && record.keyEvents.length > 0) {
            const firstEvent = record.keyEvents.find(
              (e) => e.text && e.text.trim()
            );
            if (firstEvent) {
              preview =
                firstEvent.text.substring(0, 15) +
                (firstEvent.text.length > 15 ? "..." : "");
            }
          }
          monthWeekRecords.push({
            weekKey,
            year: record.year,
            weekOfYear: record.weekOfMonth,
            displayTitle: `第 ${record.weekOfMonth} 周`,
            preview,
          });
        }
      });
      // 按周序号排序
      monthWeekRecords.sort((a, b) => a.weekOfYear - b.weekOfYear);
    }

    this.setData({ monthWeekRecords });
  },

  // 初始化当前月
  initCurrentMonth() {
    const now = new Date();
    this.setMonthByDate(now);
  },

  // 根据日期设置月份信息
  setMonthByDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const monthNameEn = MONTH_NAMES_EN[month - 1];

    this.setData({
      currentYear: year,
      currentMonth: month,
      monthKey,
      monthNameEn,
    });

    this.generateCalendar();
    this.loadMonthRecord();
  },

  // 上个月
  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    this.setMonthByDate(newDate);
  },

  // 下个月
  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    this.setMonthByDate(newDate);
  },

  // 生成日历
  generateCalendar() {
    const { currentYear, currentMonth, monthContents, dailyRecordDates } =
      this.data;
    const today = formatLocalDate(new Date());

    // 获取该月第一天和最后一天
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);
    const daysInMonth = monthEnd.getDate();

    // 该月第一天是周几（转为周一=1 ... 周日=7）
    let firstDayOfWeek = monthStart.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7;

    const days = [];

    // 前置空白（上月末尾日期）
    if (firstDayOfWeek > 1) {
      const prevMonthEnd = new Date(currentYear, currentMonth - 1, 0);
      const prevMonthDays = prevMonthEnd.getDate();
      for (let i = firstDayOfWeek - 2; i >= 0; i--) {
        const d = prevMonthDays - i;
        const dateStr = formatLocalDate(
          new Date(currentYear, currentMonth - 2, d)
        );
        const cellContent = monthContents[dateStr];
        const hasDailyRecord = !!dailyRecordDates[dateStr];
        days.push({
          day: d,
          dateStr,
          isCurrentMonth: false,
          isToday: dateStr === today,
          content: cellContent || "",
          hasContent: this.hasContent(cellContent),
          contentPreview: this.getContentPreview(cellContent || ""),
          hasDailyRecord,
        });
      }
    }

    // 当月每一天
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatLocalDate(
        new Date(currentYear, currentMonth - 1, d)
      );
      const cellContent = monthContents[dateStr];
      const hasDailyRecord = !!dailyRecordDates[dateStr];
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === today,
        content: cellContent || "",
        hasContent: this.hasContent(cellContent),
        contentPreview: this.getContentPreview(cellContent || ""),
        hasDailyRecord,
      });
    }

    // 后置空白（下月开头日期）
    const remainder = days.length % 7;
    if (remainder > 0) {
      for (let i = 1; i <= 7 - remainder; i++) {
        const dateStr = formatLocalDate(new Date(currentYear, currentMonth, i));
        const cellContent = monthContents[dateStr];
        const hasDailyRecord = !!dailyRecordDates[dateStr];
        days.push({
          day: i,
          dateStr,
          isCurrentMonth: false,
          isToday: dateStr === today,
          content: cellContent || "",
          hasContent: this.hasContent(cellContent),
          contentPreview: this.getContentPreview(cellContent || ""),
          hasDailyRecord,
        });
      }
    }

    this.setData({ calendarDays: days });
  },

  // 判断是否有内容
  hasContent(content) {
    if (!content) return false;
    if (Array.isArray(content)) {
      return content.some((c) => (c.text || "").trim());
    }
    return !!String(content).trim();
  },

  // 转换为待办列表结构
  normalizeToTodoList(content) {
    if (!content) return [{ text: "", completed: false }];
    if (Array.isArray(content)) {
      return content.map((item) => ({
        text: item.text || "",
        completed: !!item.completed,
      }));
    }
    const text = String(content || "");
    return text.trim()
      ? [{ text, completed: false }]
      : [{ text: "", completed: false }];
  },

  // 获取内容预览
  getContentPreview(content) {
    if (!content) return [];
    // 待办列表：取前 3 条，每条截取前 4 个字，超出用占位
    if (Array.isArray(content)) {
      const texts = content.map((c) => (c.text || "").trim()).filter(Boolean);
      const lines = texts
        .slice(0, 3)
        .map((t) => (t.length > 4 ? t.substring(0, 4) : t));
      if (texts.length > 3) {
        lines.push("…");
      }
      return lines;
    }
    // 字符串：拆为单行
    const text = String(content).trim();
    if (!text) return [];
    return [text.length > 4 ? text.substring(0, 4) : text];
  },

  // 加载当月记录
  loadMonthRecord() {
    const { monthKey } = this.data;
    const records = wx.getStorageSync("monthlyPlanRecords") || {};
    const monthRecord = records[monthKey];

    if (monthRecord) {
      const loadedTasks = (monthRecord.tasks || []).map((t) => ({
        completed: false,
        ...t,
      }));
      this.setData({
        monthContents: monthRecord.contents || {},
        tasks: loadedTasks,
      });
    } else {
      this.setData({
        monthContents: {},
        tasks: [],
      });
    }
    this.generateCalendar();
  },

  // 点击日期格 - 打开编辑弹层
  onCellContentTap(e) {
    const { dateStr, index } = e.currentTarget.dataset;
    if (!dateStr) return;

    const { monthContents, dailyRecordDates } = this.data;
    const content = monthContents[dateStr];
    const hasDailyRecord = !!dailyRecordDates[dateStr];

    // 格式化日期显示
    const date = new Date(dateStr);
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    const dateDisplay = `${date.getMonth() + 1}月${date.getDate()}日 · 星期${
      weekDays[date.getDay()]
    }`;

    this.setData({
      showEditSheet: true,
      editingDateStr: dateStr,
      editingDateDisplay: dateDisplay,
      editingContent: content || "",
      editingTodos: this.normalizeToTodoList(content),
      editingIndex: index,
      editingDateHasDailyRecord: hasDailyRecord,
    });
  },

  // 跳转到每日记录详情（只读模式）
  goToDailyPlan() {
    const { editingDateStr } = this.data;
    if (!editingDateStr) return;
    wx.navigateTo({
      url: `/pages/explore/daily-plan/detail/detail?date=${editingDateStr}`,
    });
  },

  // 显示本月周记录列表弹层（联动功能）
  showMonthWeekSheet() {
    this.setData({ showMonthWeekSheet: true });
  },

  // 隐藏本月周记录列表弹层
  hideMonthWeekSheet() {
    this.setData({ showMonthWeekSheet: false });
  },

  // 跳转到周记录详情（联动功能）
  goToWeekDetail(e) {
    const { year, week } = e.currentTarget.dataset;
    if (!year || !week) return;
    this.setData({ showMonthWeekSheet: false });
    wx.navigateTo({
      url: `/pages/explore/week-plan/week-plan?year=${year}&week=${week}`,
    });
  },

  // 关闭编辑弹层
  closeEditSheet() {
    this.setData({
      showEditSheet: false,
      editingDateStr: "",
      editingDateDisplay: "",
      editingContent: "",
      editingIndex: -1,
      editingTodos: [],
      editingDateHasDailyRecord: false,
    });
  },

  // 编辑内容输入
  onEditInput(e) {
    this.setData({ editingContent: e.detail.value });
  },

  // 确认编辑
  confirmEdit() {
    const {
      editingDateStr,
      editingTodos,
      monthContents,
      editingIndex,
      calendarDays,
    } = this.data;

    const cleanedTodos = (editingTodos || []).filter(
      (t) => (t.text || "").trim() !== ""
    );

    // 更新月度内容
    const newMonthContents = { ...monthContents };
    if (cleanedTodos.length) {
      newMonthContents[editingDateStr] = cleanedTodos;
    } else {
      delete newMonthContents[editingDateStr];
    }

    // 更新日历数据中的对应项
    const newCalendarDays = [...calendarDays];
    if (editingIndex >= 0 && editingIndex < newCalendarDays.length) {
      newCalendarDays[editingIndex].content = cleanedTodos;
      newCalendarDays[editingIndex].hasContent = cleanedTodos.length > 0;
      newCalendarDays[editingIndex].contentPreview =
        this.getContentPreview(cleanedTodos);
    }

    this.setData({
      monthContents: newMonthContents,
      calendarDays: newCalendarDays,
    });

    this.closeEditSheet();
    this.autoSave();
  },

  // 日期待办输入
  onTodoItemInput(e) {
    const { index } = e.currentTarget.dataset;
    const value = e.detail.value;
    const list = [...this.data.editingTodos];
    if (list[index] !== undefined) {
      list[index].text = value;
      this.setData({ editingTodos: list });
    }
  },

  // 日期待办完成状态
  toggleTodoItem(e) {
    const { index } = e.currentTarget.dataset;
    const list = [...this.data.editingTodos];
    if (list[index] !== undefined) {
      list[index].completed = !list[index].completed;
      this.setData({ editingTodos: list });
    }
  },

  // 日期待办新增
  addTodoItem() {
    const list = [...this.data.editingTodos, { text: "", completed: false }];
    this.setData({ editingTodos: list });
  },

  // 日期待办删除
  removeTodoItem(e) {
    const { index } = e.currentTarget.dataset;
    const list = [...this.data.editingTodos];
    if (list.length > 1) {
      list.splice(index, 1);
      this.setData({ editingTodos: list });
    }
  },

  // ========== 任务管理相关 ==========

  // 点击任务行
  onTaskTap(e) {
    const { index } = e.currentTarget.dataset;
    const { tasks } = this.data;
    const task = tasks[index];

    this.setData({
      showTaskSheet: true,
      editingTaskIndex: index,
      editingTask: { ...task },
    });
  },

  // 点击添加任务
  onAddTask() {
    this.setData({
      showTaskSheet: true,
      editingTaskIndex: -1,
      editingTask: {
        title: "",
        priority: "",
        priorityLabel: "",
        deadline: "",
        completed: false,
      },
    });
  },

  // 关闭任务弹层
  closeTaskSheet() {
    this.setData({
      showTaskSheet: false,
      editingTaskIndex: -1,
      editingTask: {
        title: "",
        priority: "",
        priorityLabel: "",
        deadline: "",
        completed: false,
      },
    });
  },

  // 任务标题输入
  onTaskTitleInput(e) {
    this.setData({ "editingTask.title": e.detail.value });
  },

  // 优先级选择
  onPrioritySelect(e) {
    const priority = e.currentTarget.dataset.priority;
    const priorityLabels = { high: "高", medium: "中", low: "低" };
    this.setData({
      "editingTask.priority": priority,
      "editingTask.priorityLabel": priorityLabels[priority],
    });
  },

  // 截止日期选择
  onDeadlineChange(e) {
    const deadline = e.detail.value;
    // 格式化为 MM/DD
    const date = new Date(deadline);
    const formatted = `${date.getMonth() + 1}/${date.getDate()}`;
    this.setData({ "editingTask.deadline": formatted });
  },

  // 保存任务
  confirmTask() {
    const { editingTask, editingTaskIndex, tasks } = this.data;

    if (!editingTask.title.trim()) {
      wx.showToast({ title: "请输入任务内容", icon: "none" });
      return;
    }

    const newTasks = [...tasks];

    if (editingTaskIndex >= 0) {
      // 编辑已有任务
      newTasks[editingTaskIndex] = {
        ...newTasks[editingTaskIndex],
        ...editingTask,
      };
    } else {
      // 添加新任务
      newTasks.push({
        id: Date.now(),
        completed: false,
        ...editingTask,
      });
    }

    this.setData({ tasks: newTasks });
    this.closeTaskSheet();
    this.autoSave();
  },

  // 删除任务
  deleteTask() {
    const { editingTaskIndex, tasks } = this.data;

    wx.showModal({
      title: "",
      content: "确定删除这个任务吗？",
      confirmText: "删除",
      confirmColor: "#e07050",
      success: (res) => {
        if (res.confirm) {
          const newTasks = tasks.filter((_, i) => i !== editingTaskIndex);
          this.setData({ tasks: newTasks });
          this.closeTaskSheet();
          this.autoSave();
        }
      },
    });
  },

  // 快速删除任务（列表右侧 x）
  removeTask(e) {
    const { index } = e.currentTarget.dataset;
    const { tasks } = this.data;
    if (tasks.length <= 0) return;
    const newTasks = tasks.filter((_, i) => i !== index);
    this.setData({ tasks: newTasks });
    this.autoSave();
  },

  // 切换任务完成状态
  toggleTaskComplete(e) {
    const { index } = e.currentTarget.dataset;
    const { tasks } = this.data;
    const newTasks = [...tasks];
    newTasks[index].completed = !newTasks[index].completed;
    this.setData({ tasks: newTasks });
    this.autoSave();
  },

  // 自动保存
  autoSave() {
    const { monthKey, currentYear, currentMonth, monthContents, tasks } =
      this.data;

    const record = {
      monthKey,
      year: currentYear,
      month: currentMonth,
      contents: monthContents,
      tasks: tasks,
      updatedAt: new Date().toISOString(),
    };

    const records = wx.getStorageSync("monthlyPlanRecords") || {};
    records[monthKey] = record;
    wx.setStorageSync("monthlyPlanRecords", records);
  },

  // 前往复盘页面
  goToReview() {
    // 预留：后续复盘页面上线后开启跳转
  },

  // 阻止弹层滑动穿透
  preventTouchMove() {
    return false;
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 查看历史记录
  viewHistory() {
    wx.navigateTo({
      url: "/pages/explore/monthly-plan/history/history",
    });
  },

  // ========== AI 成长教练相关方法 ==========

  // 触发 AI 月度觉察
  triggerMonthlyAICoach() {
    if (this.data.aiCoachLoading) return;

    // 收集本月数据
    const monthlyData = this.collectMonthlyDataForAI();

    if (!monthlyData.hasContent) {
      wx.showToast({
        title: "这个月的记录还比较少，先写一些再来看看",
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
    const userPrompt = this.buildMonthlyUserPrompt(monthlyData);

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

  // 收集本月数据用于 AI 分析
  collectMonthlyDataForAI() {
    const {
      currentYear,
      currentMonth,
      monthNameEn,
      tasks,
      monthContents,
      monthWeekRecords,
      monthDailyCount,
    } = this.data;

    let hasContent = false;

    // 本月任务概要
    const tasksSummary = tasks
      .filter((t) => t.title && t.title.trim())
      .map((t) => {
        const status = t.completed ? "✓" : "○";
        const priority = t.priorityLabel ? `[${t.priorityLabel}]` : "";
        const deadline = t.deadline ? `(截止: ${t.deadline})` : "";
        return `  ${status} ${priority} ${t.title} ${deadline}`;
      })
      .join("\n");
    if (tasksSummary) hasContent = true;

    // 日历内容概要（截止时间标注）
    const calendarSummary = Object.entries(monthContents)
      .filter(([, content]) => {
        if (Array.isArray(content)) {
          return content.some((c) => c.text && c.text.trim());
        }
        return content && String(content).trim();
      })
      .map(([dateStr, content]) => {
        const date = new Date(dateStr);
        const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;
        let text = "";
        if (Array.isArray(content)) {
          text = content
            .filter((c) => c.text && c.text.trim())
            .map((c) => c.text)
            .join("; ");
        } else {
          text = String(content);
        }
        return `  ${dateLabel}: ${text.substring(0, 30)}${
          text.length > 30 ? "..." : ""
        }`;
      })
      .slice(0, 10)
      .join("\n");
    if (calendarSummary) hasContent = true;

    // 周记录概要
    const weekRecordsSummary = monthWeekRecords
      .map((w) => `  ${w.displayTitle}: ${w.preview || "无摘要"}`)
      .join("\n");
    if (weekRecordsSummary) hasContent = true;

    return {
      hasContent,
      monthLabel: `${currentYear}年${currentMonth}月 (${monthNameEn})`,
      tasksSummary,
      calendarSummary,
      weekRecordsSummary,
      monthDailyCount,
    };
  },

  // 构建月度 AI 用户提示词
  buildMonthlyUserPrompt(data) {
    let prompt = `这是我这个月（${data.monthLabel}）的记录：\n\n`;

    if (data.tasksSummary) {
      prompt += `【本月任务】\n${data.tasksSummary}\n\n`;
    }

    if (data.calendarSummary) {
      prompt += `【日历标注】\n${data.calendarSummary}\n\n`;
    }

    if (data.weekRecordsSummary) {
      prompt += `【本月周记录概要】\n${data.weekRecordsSummary}\n\n`;
    }

    if (data.monthDailyCount > 0) {
      prompt += `【每日记录统计】\n  这个月我写了 ${data.monthDailyCount} 天的每日记录。\n\n`;
    }

    prompt += "请基于以上内容，帮我换一个角度看看这个月。";

    return prompt;
  },

  // 切换 AI 结果展开/收起
  toggleAICoachResult() {
    this.setData({
      aiCoachResultExpanded: !this.data.aiCoachResultExpanded,
    });
  },
});
