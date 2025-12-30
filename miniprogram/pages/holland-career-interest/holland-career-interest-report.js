// pages/holland-career-interest/holland-career-interest-report.js

const questionsData = require("./holland-career-interest-data.js");
const insightData = require("./holland-result-insight.js");
const combinationRules = require("./holland-combination-rules.js");

const dimensionOrder = questionsData.dimensions.map((dim) => dim.key);

Page({
  data: {
    record: null,
    resultList: [],
    topDimensions: [],
    topInsights: [],
    combinationCode: "",
    combinationTexts: [],
    maxDimensionTotal: 0,
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

    const maxDimensionTotal = questionsData.dimensions.reduce((max, dim) => {
      return Math.max(max, dim.questions.length);
    }, 0);

    const resultList = (record.resultList || []).map((item) => {
      const total = Number(item.total) || 0;
      const score = Number(item.score) || 0;
      const percent = total ? Math.round((score / total) * 100) : 0;
      const level = item.level || this.getLevel(percent);
      return {
        ...item,
        total,
        score,
        percent,
        level,
        levelKey: this.getLevelKey(level),
      };
    });

    const topDimensions = record.topDimensions || this.pickTopDimensions(resultList);
    const topKeys = topDimensions.map((item) => item.key);
    const topInsights = record.topInsights || this.getTopInsights(topKeys);
    const combination = record.combination || this.buildCombination(topKeys);

    const radarResult = record.result || this.buildResultFromList(resultList);

    this.setData({
      record,
      resultList,
      topDimensions,
      topInsights,
      combinationCode: combination.code,
      combinationTexts: combination.texts,
      maxDimensionTotal,
    });

    this.drawRadar(radarResult);
  },

  loadHistory() {
    try {
      const history = wx.getStorageSync("holland-career-interest-history");
      return Array.isArray(history) ? history : [];
    } catch (err) {
      console.warn("holland-career-interest history load failed:", err);
      return [];
    }
  },

  loadLatestResult() {
    try {
      return wx.getStorageSync("holland-career-interest-result") || null;
    } catch (err) {
      console.warn("holland-career-interest latest result load failed:", err);
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

  pickTopDimensions(resultList) {
    return [...resultList]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return dimensionOrder.indexOf(a.key) - dimensionOrder.indexOf(b.key);
      })
      .slice(0, 3);
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

  buildResultFromList(resultList) {
    return resultList.reduce((acc, item) => {
      if (!item.key) return acc;
      acc[item.key] = { score: item.score, total: item.total };
      return acc;
    }, {});
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

  handleRestart() {
    wx.navigateTo({
      url: "/pages/holland-career-interest/holland-career-interest",
    });
  },

  handleHistoryNav() {
    wx.navigateTo({
      url: "/pages/holland-career-interest/holland-career-interest-history",
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
      const r = maxScore ? (score / maxScore) * maxRadius : 0;
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
