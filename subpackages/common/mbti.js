// MBTI 测试工具函数

// 题库：包装成 JS 模块，避免直接 require .json 在部分环境下失败
// B版：传统版题库（70题）
const questionsDataB = require("../../pages/explore/mbti/data/mbtiQuestions.js");
// A版：最新版题库（60题，更接近官方）
const questionsDataA = require("../../pages/explore/mbti/data/mbtiQuestionsA.js");

/**
 * 校验题目数据
 * @param {Array} questionsData - 题目数组
 * @param {String} version - 版本标识
 * @returns {Array} 错误数组
 */
function validateQuestions(questionsData, version = "") {
  const errors = [];

  questionsData.forEach((question, index) => {
    // 校验必需字段
    if (!question.id) {
      errors.push(`${version}题目 ${index + 1}: 缺少 id 字段`);
    }
    if (!question.dimension) {
      errors.push(`${version}题目 ${index + 1}: 缺少 dimension 字段`);
    }
    if (!question.question) {
      errors.push(`${version}题目 ${index + 1}: 缺少 question 字段`);
    }
    if (!question.options || !Array.isArray(question.options)) {
      errors.push(`${version}题目 ${index + 1}: 缺少 options 字段或格式错误`);
    } else {
      // 校验选项
      question.options.forEach((option, optIndex) => {
        if (!option.key) {
          errors.push(
            `${version}题目 ${index + 1} 选项 ${optIndex + 1}: 缺少 key 字段`
          );
        }
        if (!option.text) {
          errors.push(
            `${version}题目 ${index + 1} 选项 ${optIndex + 1}: 缺少 text 字段`
          );
        }
        if (!option.value) {
          errors.push(
            `${version}题目 ${index + 1} 选项 ${optIndex + 1}: 缺少 value 字段`
          );
        }
      });
    }
  });

  return errors;
}

/**
 * 获取 MBTI 测试题目（B版/传统版 - 70题）
 * @returns {Array} 题目数组
 */
function getMbtiQuestions() {
  const errors = validateQuestions(questionsDataB, "B版");

  // 如果有错误，打印到控制台
  if (errors.length > 0) {
    console.error("=== MBTI B版题目数据校验失败 ===");
    errors.forEach((error) => console.error(error));
    console.error("========================");
  } else {
    console.log("✅ MBTI B版题目数据校验通过（70题）");
  }

  return questionsDataB;
}

/**
 * 获取 MBTI 测试题目（A版/最新版 - 60题，更接近官方）
 * @returns {Array} 题目数组
 */
function getMbtiQuestionsA() {
  const errors = validateQuestions(questionsDataA, "A版");

  // 如果有错误，打印到控制台
  if (errors.length > 0) {
    console.error("=== MBTI A版题目数据校验失败 ===");
    errors.forEach((error) => console.error(error));
    console.error("========================");
  } else {
    console.log("✅ MBTI A版题目数据校验通过（60题）");
  }

  return questionsDataA;
}

/**
 * 计算 MBTI 各字母的分数
 * @param {Array} answers - 用户答案数组 [{questionId, value}, ...]
 * @returns {Object} 8个字母的分数 {E, I, S, N, T, F, J, P}
 */
function calcMbtiScores(answers) {
  const scores = {
    E: 0,
    I: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  };

  // 遍历答案，累加分数
  answers.forEach((answer) => {
    const value = answer.value;
    if (scores.hasOwnProperty(value)) {
      scores[value]++;
    }
  });

  return scores;
}

/**
 * 根据分数计算 MBTI 类型
 * @param {Object} scores - 8个字母的分数
 * @returns {String} MBTI 类型，如 "INFJ"
 */
function calcMbtiType(scores) {
  let type = "";

  // E vs I
  type += scores.E >= scores.I ? "E" : "I";

  // S vs N
  type += scores.S >= scores.N ? "S" : "N";

  // T vs F
  type += scores.T >= scores.F ? "T" : "F";

  // J vs P
  type += scores.J >= scores.P ? "J" : "P";

  return type;
}

/**
 * 获取 MBTI 类型的详细信息
 * @param {String} type - MBTI 类型
 * @returns {Object} 类型信息
 */
function getMbtiTypeInfo(type) {
  const typeInfoMap = {
    INTJ: {
      name: "建筑师",
      desc: "富有想象力和战略性的思想家，一切皆在计划之中",
    },
    INTP: {
      name: "逻辑学家",
      desc: "具有创新精神的发明家，对知识有着止不住的渴望",
    },
    ENTJ: {
      name: "指挥官",
      desc: "大胆、富有想象力且意志强大的领导者，总能找到或创造解决方法",
    },
    ENTP: {
      name: "辩论家",
      desc: "聪明好奇的思想家，不会放过任何智力上的挑战",
    },
    INFJ: {
      name: "提倡者",
      desc: "安静而神秘，同时鼓舞人心且不知疲倦的理想主义者",
    },
    INFP: {
      name: "调停者",
      desc: "诗意、善良的利他主义者，总是热情地为正义事业提供帮助",
    },
    ENFJ: {
      name: "主人公",
      desc: "富有魅力且鼓舞人心的领导者，有着令听众着迷的能力",
    },
    ENFP: {
      name: "竞选者",
      desc: "热情、有创造力且社交能力强的自由精神，总能找到理由微笑",
    },
    ISTJ: { name: "物流师", desc: "实际而注重事实的个人，可靠性不容怀疑" },
    ISFJ: {
      name: "守卫者",
      desc: "非常专注而温暖的守护者，时刻准备着保护爱着的人们",
    },
    ESTJ: {
      name: "总经理",
      desc: "出色的管理者，在管理事情或人的时候无与伦比",
    },
    ESFJ: {
      name: "执政官",
      desc: "极有同情心、受欢迎且乐于助人的主人，随时准备为社区做贡献",
    },
    ISTP: { name: "鉴赏家", desc: "大胆而实际的实验者，擅长使用各种工具" },
    ISFP: {
      name: "探险家",
      desc: "灵活有魅力的艺术家，时刻准备着探索和体验新事物",
    },
    ESTP: {
      name: "企业家",
      desc: "聪明、精力充沛且善于感知的人，真心享受生活在边缘",
    },
    ESFP: {
      name: "表演者",
      desc: "自发的、精力充沛且热情的表演者，生活在他们周围永不无聊",
    },
  };

  return typeInfoMap[type] || { name: "未知类型", desc: "无法识别的类型" };
}

module.exports = {
  getMbtiQuestions,
  getMbtiQuestionsA,
  calcMbtiScores,
  calcMbtiType,
  getMbtiTypeInfo,
};
