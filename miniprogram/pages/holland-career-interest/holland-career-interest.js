// pages/holland-career-interest/holland-career-interest.js

const questionsData = require("./holland-career-interest-data.js");
const insightData = require("./holland-result-insight.js");
const combinationRules = require("./holland-combination-rules.js");

const dimensionOrder = questionsData.dimensions.map((dim) => dim.key);

Page({
  data: {
    questions: [],
    currentIndex: 0,
    answers: {},
    finished: false,
    result: null,
    resultList: [],
    topDimensions: [],
    topInsights: [],
    scaleLabels: [],
    currentAnswer: null,
    progressPercent: 0,
    dimensions: [],
    showIntro: true,
    totalQuestions: 0,
    estimatedMinutes: 0,
    maxDimensionTotal: 0,
    combinationCode: "",
    combinationTexts: [],
    usageNotes: [
      "用于自我理解与行动偏好观察",
      "帮助你识别更容易进入状态的环境",
      "不构成评判、诊断或职业建议",
    ],
    historyList: [],
  },

  onLoad() {
    const { labels } = questionsData.scale;
    const scaleLabels = [
      {
        value: questionsData.scale.positive,
        label: labels.yes,
        shortLabel: labels.yes,
      },
      {
        value: questionsData.scale.negative,
        label: labels.no,
        shortLabel: labels.no,
      },
    ];

    const totalQuestions = questionsData.dimensions.reduce(
      (sum, dim) => sum + dim.questions.length,
      0
    );
    const maxDimensionTotal = questionsData.dimensions.reduce((max, dim) => {
      return Math.max(max, dim.questions.length);
    }, 0);
    const estimatedMinutes = Math.max(3, Math.ceil(totalQuestions / 15));

    this.setData({
      scaleLabels,
      dimensions: questionsData.dimensions,
      totalQuestions,
      estimatedMinutes,
      maxDimensionTotal,
    });

    this.loadHistory();
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
      const cached = wx.getStorageSync("holland-career-interest-history");
      if (Array.isArray(cached)) history = cached;
    } catch (err) {
      console.warn("holland-career-interest history load failed:", err);
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
      topDimensions: [],
      topInsights: [],
      currentAnswer: null,
      progressPercent,
      combinationCode: "",
      combinationTexts: [],
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
    const dimensionTotals = {};
    dimensionOrder.forEach((key) => {
      dimensionScores[key] = 0;
      const dim = questionsData.dimensions.find((item) => item.key === key);
      dimensionTotals[key] = dim ? dim.questions.length : 0;
    });

    Object.values(answers).forEach((item) => {
      if (!dimensionScores[item.dimension]) {
        dimensionScores[item.dimension] = 0;
      }
      dimensionScores[item.dimension] += item.score;
    });

    const result = {};
    const resultList = questionsData.dimensions.map((dim) => {
      const score = dimensionScores[dim.key] || 0;
      const total = dimensionTotals[dim.key] || 0;
      const percent = total ? Math.round((score / total) * 100) : 0;
      const level = this.getLevel(percent);
      const levelKey = this.getLevelKey(level);
      result[dim.key] = { score, total };
      return {
        key: dim.key,
        name: dim.name,
        description: dim.description,
        score,
        total,
        percent,
        level,
        levelKey,
      };
    });

    const sortedTop = [...resultList].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return dimensionOrder.indexOf(a.key) - dimensionOrder.indexOf(b.key);
    });

    const topDimensions = sortedTop.slice(0, 3);
    const topKeys = topDimensions.map((item) => item.key);
    const topInsights = this.getTopInsights(topKeys);
    const combination = this.buildCombination(topKeys);
    const resultListWithMeta = resultList.map((item) => {
      const rank = topKeys.indexOf(item.key);
      return {
        ...item,
        isTop: rank !== -1,
        topRank: rank !== -1 ? rank + 1 : 0,
      };
    });

    const payload = {
      type: questionsData.id,
      name: questionsData.name,
      result,
      resultList,
      topDimensions,
      topInsights,
      combination,
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
        resultList: resultListWithMeta,
        topDimensions,
        topInsights,
        combinationCode: combination.code,
        combinationTexts: combination.texts,
      },
      () => {
        this.drawRadar(result);
      }
    );

    try {
      wx.setStorageSync("holland-career-interest-result", payload);
      const historyKey = "holland-career-interest-history";
      const history = wx.getStorageSync(historyKey);
      const list = Array.isArray(history) ? history : [];
      list.unshift(payload);
      const nextList = list.slice(0, 10);
      wx.setStorageSync(historyKey, nextList);
      this.setData({ historyList: nextList });
    } catch (err) {
      console.warn("holland-career-interest result storage failed:", err);
    }
  },

  handleHistoryNav() {
    wx.navigateTo({
      url: "/pages/holland-career-interest/holland-career-interest-history",
    });
  },

  getLevel(percent) {
    if (percent >= 70) return "高";
    if (percent >= 40) return "中";
    return "低";
  },

  getLevelKey(level) {
    if (level === "高") return "high";
    if (level === "中") return "mid";
    return "low";
  },

  getTopInsights(keys) {
    const insightMap = insightData.dimensions.reduce((acc, item) => {
      acc[item.key] = item;
      return acc;
    }, {});

    return keys.map((key) => {
      const detail = insightMap[key] || {};
      return {
        key,
        name: detail.name || key,
        shortLabel: detail.shortLabel || "",
        coreInsight: detail.coreInsight || "",
        energyDescription: detail.energyDescription || [],
        supportiveEnvironment: detail.supportiveEnvironment || [],
        possibleDrain: detail.possibleDrain || [],
      };
    });
  },

  buildCombination(keys) {
    const meta = combinationRules.dimensionMeta || {};
    const [first, second, third] = keys;
    const replacements = {
      firstName: meta[first]?.name || first || "",
      secondName: meta[second]?.name || second || "",
      thirdName: meta[third]?.name || third || "",
      firstShort: meta[first]?.short || "",
      secondShort: meta[second]?.short || "",
      thirdShort: meta[third]?.short || "",
    };

    const texts = (combinationRules.generationRules || []).map((rule) =>
      this.formatTemplate(rule.template, replacements)
    );

    return {
      code: keys.join(""),
      texts,
    };
  },

  formatTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || "";
    });
  },

  // ======================
  // 雷达图绘制（核心）
  // ======================
  drawRadar(result) {
    const ctx = wx.createCanvasContext("radarCanvas", this);

    const size = 320;
    const center = size / 2;
    const maxRadius = 120;
    const maxScore = Math.max(
      ...dimensionOrder.map((key) => result[key]?.total || 1)
    );

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
      const score = result[key]?.score || 0;
      const r = maxScore ? (score / maxScore) * maxRadius : 0;
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
      const score = result[key]?.score || 0;
      const r = maxScore ? (score / maxScore) * maxRadius : 0;
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
