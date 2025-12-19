// pages/behavior-strength/behavior-strength-report.js

const questionsData = require("./behavior-strength-questions.js");

Page({
  data: {
    record: null,
    resultList: [],
    topStrengths: [],
  },

  onLoad(options) {
    const key = options.key;
    const history = this.loadHistory();
    const record = this.findRecord(history, key) || this.loadLatestResult();

    if (!record) {
      wx.showToast({ title: "未找到报告", icon: "none" });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }

    if (!record.displayTime && record.meta?.completedAt) {
      record.displayTime = this.formatTime(record.meta.completedAt);
    }

    const resultList = (record.resultList || []).map((item) => {
      const score = Number(item.score) || 0;
      const level = item.level || this.getLevel(score);
      return {
        ...item,
        score,
        level,
        levelKey: this.getLevelKey(level),
        percent: Math.round((score / 5) * 100),
        detail: item.detail || this.getDetailAnalysis(item.key, level),
      };
    });
    const topStrengths = record.topStrengths || [];
    const radarResult = record.result || this.buildResultFromList(resultList);

    this.setData({
      record,
      resultList,
      topStrengths,
    });

    this.drawRadar(radarResult);
  },

  loadHistory() {
    try {
      const history = wx.getStorageSync("behavior-strength-history");
      return Array.isArray(history) ? history : [];
    } catch (err) {
      console.warn("behavior-strength history load failed:", err);
      return [];
    }
  },

  loadLatestResult() {
    try {
      return wx.getStorageSync("behavior-strength-result") || null;
    } catch (err) {
      console.warn("behavior-strength latest result load failed:", err);
      return null;
    }
  },

  findRecord(history, key) {
    if (!key) return null;
    return (
      history.find(
        (item, index) =>
          String(item.meta?.completedAt || index) === String(key)
      ) || null
    );
  },

  getDimensionAnalysis(level, name) {
    if (level === "高") {
      return `${name}是你的明显优势，保持输出与稳定发挥会带来更高成就感。`;
    }
    if (level === "中") {
      return `${name}处于稳定区间，适度练习和刻意使用会让优势更清晰。`;
    }
    return `${name}目前呈现较少使用的倾向，若与目标相关可小步尝试。`;
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
    const levelKey = this.getLevelKey(level);
    return {
      typical: entry.typical,
      value: entry.value,
      blindspot: entry.blindspot[levelKey],
      action: entry.action[levelKey],
    };
  },

  getLevelKey(level) {
    if (level === "高") return "high";
    if (level === "中") return "mid";
    return "low";
  },

  getLevel(score) {
    if (score >= 4.2) return "高";
    if (score >= 3.2) return "中";
    return "低";
  },

  buildResultFromList(resultList) {
    return resultList.reduce((acc, item) => {
      if (!item.key) return acc;
      acc[item.key] = { score: item.score, level: item.level };
      return acc;
    }, {});
  },

  handleRestart() {
    wx.navigateTo({
      url: "/pages/behavior-strength/behavior-strength",
    });
  },

  handleHistoryNav() {
    wx.navigateTo({
      url: "/pages/behavior-strength/behavior-strength-history",
    });
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  drawRadar(result) {
    const ctx = wx.createCanvasContext("radarCanvas", this);

    const size = 320;
    const center = size / 2;
    const maxRadius = 120;
    const maxScore = 5;

    const dimensions = questionsData.dimensions.map((dim) => dim.key);
    const dimensionMeta = questionsData.dimensions.reduce((acc, dim) => {
      acc[dim.key] = dim.name;
      return acc;
    }, {});
    const angleStep = (Math.PI * 2) / dimensions.length;

    ctx.clearRect(0, 0, size, size);

    for (let level = 1; level <= 5; level += 1) {
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
      ctx.setStrokeStyle("#eadfce");
      ctx.stroke();
    }

    dimensions.forEach((_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = center + maxRadius * Math.cos(angle);
      const y = center + maxRadius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.setStrokeStyle("#e0d3c1");
      ctx.stroke();
    });

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

    ctx.beginPath();
    dimensions.forEach((key, i) => {
      const score = result[key]?.score || 0;
      const r = (score / maxScore) * maxRadius;
      const angle = angleStep * i - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    ctx.setFillStyle("rgba(255, 176, 98, 0.35)");
    ctx.setStrokeStyle("#ff9b61");
    ctx.setLineWidth(2);
    ctx.fill();
    ctx.stroke();

    dimensions.forEach((key, i) => {
      const score = result[key]?.score || 0;
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
