// 脉轮映射和评分规则配置
// 本文件定义了80道题目与7个脉轮的映射关系，以及评分逻辑

/**
 * 脉轮映射表
 *
 * 说明：
 * - 所有题目都是负向题（reverse: true）
 * - 高分表示问题严重，需要在计算时反转：reversedScore = 6 - originalScore
 * - 例如：用户选5分（完全是）→ 反转后1分（表示该脉轮能量低）
 */

const CHAKRA_MAPPING = {
  // 海底轮 Root Chakra (Muladhara)
  root: {
    key: "root",
    name: "海底轮",
    englishName: "Root Chakra (Muladhara)",
    emoji: "🔴",
    color: "#E53935",
    element: "土",
    location: "脊椎底部",
    keyword: "安全感 · 稳定 · 生存",
    questionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    questionCount: 12,
    reverse: true, // 所有题目都是负向题
    scoreRanges: {
      low: { min: 0, max: 39, level: "失衡/阻塞" },
      medium: { min: 40, max: 69, level: "一般/轻微失衡" },
      high: { min: 70, max: 100, level: "流动良好/充盈" },
    },
  },

  // 腹轮 Sacral Chakra (Svadhisthana)
  sacral: {
    key: "sacral",
    name: "腹轮",
    englishName: "Sacral Chakra (Svadhisthana)",
    emoji: "🟠",
    color: "#FF6F00",
    element: "水",
    location: "下腹部",
    keyword: "创造力 · 情感 · 愉悦",
    questionIds: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    questionCount: 11,
    reverse: true,
    scoreRanges: {
      low: { min: 0, max: 39, level: "失衡/阻塞" },
      medium: { min: 40, max: 69, level: "一般/轻微失衡" },
      high: { min: 70, max: 100, level: "流动良好/充盈" },
    },
  },

  // 太阳轮 Solar Plexus Chakra (Manipura)
  solar: {
    key: "solar",
    name: "太阳轮",
    englishName: "Solar Plexus Chakra (Manipura)",
    emoji: "🟡",
    color: "#FDD835",
    element: "火",
    location: "上腹部",
    keyword: "力量 · 自信 · 意志",
    questionIds: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    questionCount: 12,
    reverse: true,
    scoreRanges: {
      low: { min: 0, max: 39, level: "失衡/阻塞" },
      medium: { min: 40, max: 69, level: "一般/轻微失衡" },
      high: { min: 70, max: 100, level: "流动良好/充盈" },
    },
  },

  // 心轮 Heart Chakra (Anahata)
  heart: {
    key: "heart",
    name: "心轮",
    englishName: "Heart Chakra (Anahata)",
    emoji: "💚",
    color: "#43A047",
    element: "风",
    location: "胸部中央",
    keyword: "爱 · 慈悲 · 连接",
    questionIds: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
    questionCount: 12,
    reverse: true,
    scoreRanges: {
      low: { min: 0, max: 39, level: "失衡/阻塞" },
      medium: { min: 40, max: 69, level: "一般/轻微失衡" },
      high: { min: 70, max: 100, level: "流动良好/充盈" },
    },
  },

  // 喉轮 Throat Chakra (Vishuddha)
  throat: {
    key: "throat",
    name: "喉轮",
    englishName: "Throat Chakra (Vishuddha)",
    emoji: "🔵",
    color: "#1E88E5",
    element: "以太",
    location: "喉咙",
    keyword: "表达 · 真实 · 沟通",
    questionIds: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
    questionCount: 11,
    reverse: true,
    scoreRanges: {
      low: { min: 0, max: 39, level: "失衡/阻塞" },
      medium: { min: 40, max: 69, level: "一般/轻微失衡" },
      high: { min: 70, max: 100, level: "流动良好/充盈" },
    },
  },

  // 眉心轮 Third Eye Chakra (Ajna)
  third_eye: {
    key: "third_eye",
    name: "眉心轮",
    englishName: "Third Eye Chakra (Ajna)",
    emoji: "🟣",
    color: "#5E35B1",
    element: "光",
    location: "眉心",
    keyword: "直觉 · 洞察 · 智慧",
    questionIds: [59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    questionCount: 11,
    reverse: true,
    scoreRanges: {
      low: { min: 0, max: 39, level: "失衡/阻塞" },
      medium: { min: 40, max: 69, level: "一般/轻微失衡" },
      high: { min: 70, max: 100, level: "流动良好/充盈" },
    },
  },

  // 顶轮 Crown Chakra (Sahasrara)
  crown: {
    key: "crown",
    name: "顶轮",
    englishName: "Crown Chakra (Sahasrara)",
    emoji: "⚪",
    color: "#9C27B0",
    element: "意识",
    location: "头顶",
    keyword: "灵性 · 合一 · 超越",
    questionIds: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
    questionCount: 11,
    reverse: true,
    scoreRanges: {
      low: { min: 0, max: 39, level: "失衡/阻塞" },
      medium: { min: 40, max: 69, level: "一般/轻微失衡" },
      high: { min: 70, max: 100, level: "流动良好/充盈" },
    },
  },
};

module.exports = {
  CHAKRA_MAPPING,
};
