# 🎯 脉轮测试 - 完整JSON数据

## 📋 一、脉轮映射表（JSON格式）

### 可直接复制的脉轮配置

```json
{
  "root": {
    "key": "root",
    "name": "海底轮",
    "englishName": "Root Chakra (Muladhara)",
    "emoji": "🔴",
    "color": "#E53935",
    "element": "土",
    "location": "脊椎底部",
    "keyword": "安全感 · 稳定 · 生存",
    "questionIds": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "questionCount": 12,
    "reverse": true,
    "scoreRanges": {
      "low": { "min": 0, "max": 39, "level": "失衡/阻塞" },
      "medium": { "min": 40, "max": 69, "level": "一般/轻微失衡" },
      "high": { "min": 70, "max": 100, "level": "流动良好/充盈" }
    }
  },
  "sacral": {
    "key": "sacral",
    "name": "腹轮",
    "englishName": "Sacral Chakra (Svadhisthana)",
    "emoji": "🟠",
    "color": "#FF6F00",
    "element": "水",
    "location": "下腹部",
    "keyword": "创造力 · 情感 · 愉悦",
    "questionIds": [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    "questionCount": 11,
    "reverse": true,
    "scoreRanges": {
      "low": { "min": 0, "max": 39, "level": "失衡/阻塞" },
      "medium": { "min": 40, "max": 69, "level": "一般/轻微失衡" },
      "high": { "min": 70, "max": 100, "level": "流动良好/充盈" }
    }
  },
  "solar": {
    "key": "solar",
    "name": "太阳神经丛轮",
    "englishName": "Solar Plexus Chakra (Manipura)",
    "emoji": "🟡",
    "color": "#FDD835",
    "element": "火",
    "location": "上腹部",
    "keyword": "力量 · 自信 · 意志",
    "questionIds": [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    "questionCount": 12,
    "reverse": true,
    "scoreRanges": {
      "low": { "min": 0, "max": 39, "level": "失衡/阻塞" },
      "medium": { "min": 40, "max": 69, "level": "一般/轻微失衡" },
      "high": { "min": 70, "max": 100, "level": "流动良好/充盈" }
    }
  },
  "heart": {
    "key": "heart",
    "name": "心轮",
    "englishName": "Heart Chakra (Anahata)",
    "emoji": "💚",
    "color": "#43A047",
    "element": "风",
    "location": "胸部中央",
    "keyword": "爱 · 慈悲 · 连接",
    "questionIds": [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
    "questionCount": 12,
    "reverse": true,
    "scoreRanges": {
      "low": { "min": 0, "max": 39, "level": "失衡/阻塞" },
      "medium": { "min": 40, "max": 69, "level": "一般/轻微失衡" },
      "high": { "min": 70, "max": 100, "level": "流动良好/充盈" }
    }
  },
  "throat": {
    "key": "throat",
    "name": "喉轮",
    "englishName": "Throat Chakra (Vishuddha)",
    "emoji": "🔵",
    "color": "#1E88E5",
    "element": "以太",
    "location": "喉咙",
    "keyword": "表达 · 真实 · 沟通",
    "questionIds": [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
    "questionCount": 11,
    "reverse": true,
    "scoreRanges": {
      "low": { "min": 0, "max": 39, "level": "失衡/阻塞" },
      "medium": { "min": 40, "max": 69, "level": "一般/轻微失衡" },
      "high": { "min": 70, "max": 100, "level": "流动良好/充盈" }
    }
  },
  "third_eye": {
    "key": "third_eye",
    "name": "眉心轮",
    "englishName": "Third Eye Chakra (Ajna)",
    "emoji": "🟣",
    "color": "#5E35B1",
    "element": "光",
    "location": "眉心",
    "keyword": "直觉 · 洞察 · 智慧",
    "questionIds": [59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    "questionCount": 11,
    "reverse": true,
    "scoreRanges": {
      "low": { "min": 0, "max": 39, "level": "失衡/阻塞" },
      "medium": { "min": 40, "max": 69, "level": "一般/轻微失衡" },
      "high": { "min": 70, "max": 100, "level": "流动良好/充盈" }
    }
  },
  "crown": {
    "key": "crown",
    "name": "顶轮",
    "englishName": "Crown Chakra (Sahasrara)",
    "emoji": "⚪",
    "color": "#9C27B0",
    "element": "意识",
    "location": "头顶",
    "keyword": "灵性 · 合一 · 超越",
    "questionIds": [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
    "questionCount": 11,
    "reverse": true,
    "scoreRanges": {
      "low": { "min": 0, "max": 39, "level": "失衡/阻塞" },
      "medium": { "min": 40, "max": 69, "level": "一般/轻微失衡" },
      "high": { "min": 70, "max": 100, "level": "流动良好/充盈" }
    }
  }
}
```

---

## 📊 二、评分算法（JavaScript代码）

### 完整可用的评分函数

```javascript
/**
 * 计算单个脉轮的得分
 * @param {Object} answers - 用户答案 {1: 3, 2: 4, ...}
 * @param {String} chakraType - 脉轮类型
 * @returns {Object} - {score, maxScore, percentage}
 */
function calculateChakraScore(answers, chakraType) {
  const CHAKRA_MAPPING = {
    root: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    sacral: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    solar: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    heart: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
    throat: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
    third_eye: [59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    crown: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80]
  };
  
  const questionIds = CHAKRA_MAPPING[chakraType];
  let totalScore = 0;
  
  questionIds.forEach(id => {
    const userAnswer = answers[id] || 3;
    const reversedScore = 6 - userAnswer; // 反转计分
    totalScore += reversedScore;
  });
  
  const maxScore = questionIds.length * 5;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  return { score: totalScore, maxScore, percentage };
}

/**
 * 获取脉轮解读等级
 * @param {Number} percentage - 百分比分数
 * @returns {String} - 'low' | 'medium' | 'high'
 */
function getChakraLevel(percentage) {
  if (percentage >= 70) return 'high';
  if (percentage >= 40) return 'medium';
  return 'low';
}

/**
 * 计算所有脉轮得分
 * @param {Object} answers - 用户答案
 * @returns {Object} - 所有脉轮的得分
 */
function calculateAllChakras(answers) {
  const chakraTypes = ['root', 'sacral', 'solar', 'heart', 'throat', 'third_eye', 'crown'];
  const results = {};
  
  chakraTypes.forEach(type => {
    results[type] = calculateChakraScore(answers, type);
  });
  
  return results;
}
```

---

## 🎨 三、结果示例

### 完整测试结果JSON

```json
{
  "userId": "user_12345",
  "testDate": "2024-01-15T10:30:00.000Z",
  "timestamp": 1705315800000,
  "answers": {
    "1": 3, "2": 4, "3": 2, "4": 5, "5": 3,
    "6": 4, "7": 3, "8": 2, "9": 4, "10": 3,
    "11": 2, "12": 4,
    "13": 3, "14": 4, "15": 2, "16": 3, "17": 4,
    "18": 3, "19": 2, "20": 4, "21": 3, "22": 2, "23": 4
    // ... 共80题
  },
  "results": {
    "root": {
      "score": 45,
      "maxScore": 60,
      "percentage": 75,
      "level": "high"
    },
    "sacral": {
      "score": 30,
      "maxScore": 55,
      "percentage": 55,
      "level": "medium"
    },
    "solar": {
      "score": 20,
      "maxScore": 60,
      "percentage": 33,
      "level": "low"
    },
    "heart": {
      "score": 42,
      "maxScore": 60,
      "percentage": 70,
      "level": "high"
    },
    "throat": {
      "score": 28,
      "maxScore": 55,
      "percentage": 51,
      "level": "medium"
    },
    "third_eye": {
      "score": 35,
      "maxScore": 55,
      "percentage": 64,
      "level": "medium"
    },
    "crown": {
      "score": 25,
      "maxScore": 55,
      "percentage": 45,
      "level": "medium"
    }
  }
}
```

---

## 📦 四、文件位置

所有配置文件已生成在以下位置：

```
InnerSeed/
├── pages/
│   └── chakraTest/
│       └── data/
│           ├── questions.js           ✅ 80道题库
│           ├── chakraInfo.js          ✅ 脉轮信息（旧版）
│           ├── chakraMapping.js       ✅ 脉轮映射配置（新）
│           └── chakraResultConfig.js  ✅ 结果文案配置（新）
│
└── 文档/
    ├── CHAKRA_SCORING_GUIDE.md        ✅ 评分规则详解
    ├── CHAKRA_QUESTIONS_LIST.md       ✅ 80题完整清单
    └── CHAKRA_COMPLETE_JSON.md        ✅ 本文档
```

---

## ✅ 使用方法

### 在小程序中导入

```javascript
// 导入题库
const { CHAKRA_QUESTIONS } = require('./data/questions.js');

// 导入脉轮映射
const { CHAKRA_MAPPING } = require('./data/chakraMapping.js');

// 导入结果配置
const { CHAKRA_RESULT_CONFIG } = require('./data/chakraResultConfig.js');

// 使用示例
const answers = { 1: 3, 2: 4, 3: 2, /* ... */ };
const results = calculateAllChakras(answers);
console.log(results);
```

---

## 🎉 完成！

所有JSON数据和代码都已准备好，可以直接复制到你的微信小程序项目中使用！

