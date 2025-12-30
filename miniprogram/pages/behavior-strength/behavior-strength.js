// pages/behavior-strength/behavior-strength.js

// 题目数据
const questionsData = require("./behavior-strength-questions.js");
const dimensionOrder = questionsData.dimensions.map((dim) => dim.key);

Page({
  data: {
    questions: [],
    currentIndex: 0,
    answers: {},
    finished: false,
    result: null,
    resultList: [],
    topStrengths: [],
    scaleOptions: [],
    scaleLabels: [],
    scaleMinLabel: "",
    scaleMaxLabel: "",
    currentAnswer: null,
    progressPercent: 0,
    dimensions: [],
    showIntro: true,
    historyList: [],
  },

  onLoad() {
    const { min, max, labels } = questionsData.scale;
    const scaleOptions = [];
    const scaleLabels = [];
    for (let i = min; i <= max; i += 1) {
      scaleOptions.push(i);
      scaleLabels.push({
        value: i,
        label: labels[String(i)] || "",
        shortLabel: this.getShortScaleLabel(i),
      });
    }

    this.setData({
      scaleOptions,
      scaleLabels,
      scaleMinLabel: labels[String(min)],
      scaleMaxLabel: labels[String(max)],
      dimensions: questionsData.dimensions,
    });

    this.loadHistory();
  },

  getShortScaleLabel(value) {
    const map = {
      1: "不像",
      2: "不太像",
      3: "中立",
      4: "较像",
      5: "非常像",
    };
    return map[value] || "";
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  loadHistory() {
    let history = [];
    try {
      const cached = wx.getStorageSync("behavior-strength-history");
      if (Array.isArray(cached)) history = cached;
    } catch (err) {
      console.warn("behavior-strength history load failed:", err);
    }

    const historyList = history.map((item) => ({
      ...item,
      displayTime: item.displayTime || this.formatTime(item.meta?.completedAt),
    }));

    this.setData({ historyList });
  },

  // 开始测试
  handleStart() {
    this.setData({ showIntro: false }, () => {
      this.initQuestions();
    });
  },

  // 将题库展平成一维数组
  initQuestions() {
    const list = [];
    questionsData.dimensions.forEach((dim) => {
      dim.questions.forEach((q) => {
        list.push({
          id: q.id,
          text: q.text,
          dimension: dim.key,
          dimensionName: dim.name,
        });
      });
    });
    const progressPercent = this.getProgressPercent(0, list.length);
    this.setData({
      questions: list,
      currentIndex: 0,
      answers: {},
      finished: false,
      result: null,
      resultList: [],
      topStrengths: [],
      currentAnswer: null,
      progressPercent,
    });
  },

  // 选择答案
  handleSelect(e) {
    const value = Number(e.currentTarget.dataset.value);
    const { currentIndex, questions, answers } = this.data;
    const currentQuestion = questions[currentIndex];

    wx.vibrateShort({ type: "light" });

    const nextAnswers = { ...answers };
    nextAnswers[currentQuestion.id] = {
      score: value,
      dimension: currentQuestion.dimension,
    };

    const isLast = currentIndex >= questions.length - 1;
    if (isLast) {
      this.setData({ answers: nextAnswers, currentAnswer: value }, () => {
        this.calculateResult();
      });
      return;
    }

    const nextIndex = currentIndex + 1;
    const progressPercent = this.getProgressPercent(nextIndex, questions.length);
    this.setData(
      {
        answers: nextAnswers,
        currentIndex: nextIndex,
        currentAnswer: null,
        progressPercent,
      },
      () => {
        this.updateCurrentAnswer();
      }
    );
  },

  // 上一题
  handlePrev() {
    const { currentIndex, questions } = this.data;
    if (currentIndex <= 0) return;
    const nextIndex = currentIndex - 1;
    const progressPercent = this.getProgressPercent(nextIndex, questions.length);
    this.setData({ currentIndex: nextIndex, progressPercent }, () => {
      this.updateCurrentAnswer();
    });
  },

  // 重置测试
  handleRestart() {
    this.initQuestions();
  },

  updateCurrentAnswer() {
    const { currentIndex, questions, answers } = this.data;
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;
    const record = answers[currentQuestion.id];
    this.setData({ currentAnswer: record ? record.score : null });
  },

  getProgressPercent(currentIndex, total) {
    if (!total) return 0;
    return Math.round(((currentIndex + 1) / total) * 100);
  },

  // 计算结果
  calculateResult() {
    const { answers, questions } = this.data;
    const dimensionScores = {};
    dimensionOrder.forEach((key) => {
      dimensionScores[key] = [];
    });

    Object.values(answers).forEach((item) => {
      if (!dimensionScores[item.dimension]) return;
      dimensionScores[item.dimension].push(item.score);
    });

    const result = {};
    const resultList = questionsData.dimensions.map((dim) => {
      const arr = dimensionScores[dim.key] || [];
      const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const score = Number(avg.toFixed(1));
      const level = this.getLevel(avg);
      const levelKey = this.getLevelKey(level);
      const detail = this.getDetailAnalysis(dim.key, level);
      result[dim.key] = { score, level };
      return {
        key: dim.key,
        name: dim.name,
        description: dim.description,
        score,
        level,
        levelKey,
        percent: Math.round((score / 5) * 100),
        detail,
      };
    });

    const topStrengths = [...resultList]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.name);

    const payload = {
      type: questionsData.id,
      name: questionsData.name,
      result,
      resultList,
      topStrengths,
      meta: {
        version: "1.0",
        completedAt: Date.now(),
        totalQuestions: questions.length,
      },
    };
    payload.displayTime = this.formatTime(payload.meta.completedAt);

    this.setData(
      {
        finished: true,
        result: payload,
        resultList,
        topStrengths,
      },
      () => {
        this.drawRadar(result);
      }
    );

    try {
      wx.setStorageSync("behavior-strength-result", payload);
      const historyKey = "behavior-strength-history";
      const history = wx.getStorageSync(historyKey);
      const list = Array.isArray(history) ? history : [];
      list.unshift(payload);
      const nextList = list.slice(0, 10);
      wx.setStorageSync(historyKey, nextList);
      this.setData({ historyList: nextList });
    } catch (err) {
      console.warn("behavior-strength result storage failed:", err);
    }
  },

  handleHistoryNav() {
    wx.navigateTo({
      url: "/pages/behavior-strength/behavior-strength-history",
    });
  },

  getLevel(score) {
    if (score >= 4.2) return "高";
    if (score >= 3.2) return "中";
    return "低";
  },

  getLevelKey(level) {
    if (level === "高") return "high";
    if (level === "中") return "mid";
    return "low";
  },

  getDetailAnalysis(key, level) {
    const base = {
      execution: {
        typical: "习惯把事情拆成步骤，先推进再优化。",
        value: "能带动进度，让目标更快落地。",
        blindspot: {
          high: "可能过快推进，忽略共识与节奏。",
          mid: "容易随情境波动，执行力不稳定。",
          low: "更重思考与准备，推进速度偏慢。",
        },
        action: {
          high: "给团队留出对齐时间，减少急促感。",
          mid: "为当日任务设一个清晰完成节点。",
          low: "先做最小行动，把计划变成第一步。",
        },
      },
      influence: {
        typical: "愿意表达观点，推动沟通向前。",
        value: "能澄清问题，提升团队理解一致性。",
        blindspot: {
          high: "可能表达过多，忽略他人空间。",
          mid: "表达意愿受场景影响，输出不连续。",
          low: "更倾向内化思考，影响力被低估。",
        },
        action: {
          high: "给自己留出倾听与提问的空间。",
          mid: "每次讨论先说一句核心观点。",
          low: "先用一句话表达立场，再补充细节。",
        },
      },
      collaboration: {
        typical: "关注关系氛围，愿意协同推进。",
        value: "更容易建立信任，促进协作效率。",
        blindspot: {
          high: "可能过度顾及关系，牺牲效率。",
          mid: "在关系与任务之间摇摆。",
          low: "更专注任务，关系维护投入较少。",
        },
        action: {
          high: "关键决策时明确任务优先级。",
          mid: "每周主动确认一次目标对齐。",
          low: "给关键协作者一个正向反馈。",
        },
      },
      innovation: {
        typical: "喜欢尝试新方法，关注新可能。",
        value: "能带来突破与新思路，提升适应力。",
        blindspot: {
          high: "可能过多探索，导致分散与反复。",
          mid: "创新动力受外部节奏影响。",
          low: "倾向稳妥，容易错过新机会。",
        },
        action: {
          high: "为新想法设一个验证小实验。",
          mid: "每周尝试一个小工具或新方法。",
          low: "从现有流程中挑一处做小改动。",
        },
      },
      resilience: {
        typical: "在压力下能较快恢复到稳定状态。",
        value: "有助于在变化中保持持续输出。",
        blindspot: {
          high: "可能压抑情绪，忽略自我照顾。",
          mid: "稳定性受当下压力强度影响。",
          low: "情绪起伏会影响行动连贯性。",
        },
        action: {
          high: "记录情绪变化，给自己补能时间。",
          mid: "每天 5 分钟情绪复盘。",
          low: "用一次深呼吸+写下感受来缓冲。",
        },
      },
    };

    const entry = base[key];
    if (!entry) return null;
    return {
      typical: entry.typical,
      value: entry.value,
      blindspot: entry.blindspot[this.getLevelKey(level)],
      action: entry.action[this.getLevelKey(level)],
    };
  },

  // ======================
  // 雷达图绘制（核心）
  // ======================
  drawRadar(result) {
    const ctx = wx.createCanvasContext("radarCanvas", this);

    const size = 320;
    const center = size / 2;
    const maxRadius = 120;
    const maxScore = 5;

    const dimensions = dimensionOrder;
    const dimensionMeta = questionsData.dimensions.reduce((acc, dim) => {
      acc[dim.key] = dim.name;
      return acc;
    }, {});

    const angleStep = (Math.PI * 2) / dimensions.length;

    ctx.clearRect(0, 0, size, size);

    // 背景网格
    for (let level = 1; level <= 5; level++) {
      ctx.beginPath();
      dimensions.forEach((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const r = (maxRadius / 5) * level;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.setStrokeStyle("#e0e0e0");
      ctx.stroke();
    }

    // 轴线
    dimensions.forEach((_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = center + maxRadius * Math.cos(angle);
      const y = center + maxRadius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.setStrokeStyle("#d0d0d0");
      ctx.stroke();
    });

    // 维度标签
    dimensions.forEach((key, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const labelRadius = maxRadius + 22;
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle);
      const name = dimensionMeta[key] || key;
      ctx.setFillStyle("#8d7a62");
      ctx.setFontSize(12);
      if (x < center - 6) ctx.setTextAlign("right");
      else if (x > center + 6) ctx.setTextAlign("left");
      else ctx.setTextAlign("center");
      if (y > center + 6) ctx.setTextBaseline("top");
      else if (y < center - 6) ctx.setTextBaseline("bottom");
      else ctx.setTextBaseline("middle");
      ctx.fillText(name, x, y);
    });

    // 数据区
    ctx.beginPath();
    dimensions.forEach((key, i) => {
      const score = result[key].score;
      const r = (score / maxScore) * maxRadius;
      const angle = angleStep * i - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    ctx.setFillStyle("rgba(88, 150, 255, 0.35)");
    ctx.setStrokeStyle("#5896ff");
    ctx.setLineWidth(2);
    ctx.fill();
    ctx.stroke();

    // 数据点与数值
    dimensions.forEach((key, i) => {
      const score = result[key].score;
      const r = (score / maxScore) * maxRadius;
      const angle = angleStep * i - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      const valueRadius = r + 10;
      const vx = center + valueRadius * Math.cos(angle);
      const vy = center + valueRadius * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.setFillStyle("#ff9b61");
      ctx.fill();

      ctx.setFillStyle("#ff7d4d");
      ctx.setFontSize(12);
      ctx.setTextAlign("center");
      ctx.setTextBaseline("middle");
      ctx.fillText(String(score), vx, vy);
    });

    ctx.draw();
  },
});
