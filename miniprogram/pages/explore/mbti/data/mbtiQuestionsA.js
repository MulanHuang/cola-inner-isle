// MBTI 测试题库数据
// 基于已提供截图题意改写为 A/B 选择题（仅内部使用）
module.exports = [
  {
    id: 1,
    dimension: "E-I",
    question: "你是否容易和刚认识的人聊得来？",
    options: [
      { key: "A", text: "很快就能建立联系", value: "E" },
      { key: "B", text: "需要时间慢慢熟悉", value: "I" },
    ],
  },
  {
    id: 2,
    dimension: "E-I",
    question: "在社交场合中，你通常会：",
    options: [
      { key: "A", text: "主动结识新朋友", value: "E" },
      { key: "B", text: "等待别人先来交流", value: "I" },
    ],
  },
  {
    id: 3,
    dimension: "E-I",
    question: "聚会结束后，你更常感到：",
    options: [
      { key: "A", text: "精力充沛", value: "E" },
      { key: "B", text: "需要独处恢复", value: "I" },
    ],
  },
  {
    id: 4,
    dimension: "E-I",
    question: "你的社交圈通常是：",
    options: [
      { key: "A", text: "范围广、认识很多人", value: "E" },
      { key: "B", text: "范围小、关系较深", value: "I" },
    ],
  },
  {
    id: 5,
    dimension: "E-I",
    question: "在热闹的环境中，你更可能：",
    options: [
      { key: "A", text: "感到兴奋和投入", value: "E" },
      { key: "B", text: "感到分心或想离开", value: "I" },
    ],
  },

  {
    id: 6,
    dimension: "S-N",
    question: "你更容易被哪类想法吸引？",
    options: [
      { key: "A", text: "清晰、具体、实用的想法", value: "S" },
      { key: "B", text: "新奇、复杂、有可能性的想法", value: "N" },
    ],
  },
  {
    id: 7,
    dimension: "S-N",
    question: "在讨论问题时，你更关注：",
    options: [
      { key: "A", text: "实际发生了什么", value: "S" },
      { key: "B", text: "未来可能会怎样", value: "N" },
    ],
  },
  {
    id: 8,
    dimension: "S-N",
    question: "你是否容易对高度理论化的讨论失去兴趣？",
    options: [
      { key: "A", text: "是的，更偏好实际内容", value: "S" },
      { key: "B", text: "不会，反而觉得有趣", value: "N" },
    ],
  },
  {
    id: 9,
    dimension: "S-N",
    question: "在做事情时，你更偏向：",
    options: [
      { key: "A", text: "使用成熟可靠的方法", value: "S" },
      { key: "B", text: "尝试新的方式", value: "N" },
    ],
  },
  {
    id: 10,
    dimension: "S-N",
    question: "你是否喜欢思考抽象或哲学性的问题？",
    options: [
      { key: "A", text: "觉得不太实用", value: "S" },
      { key: "B", text: "觉得很有意思", value: "N" },
    ],
  },

  {
    id: 11,
    dimension: "T-F",
    question: "在做决定时，你更看重：",
    options: [
      { key: "A", text: "逻辑、事实和效率", value: "T" },
      { key: "B", text: "他人的感受和关系", value: "F" },
    ],
  },
  {
    id: 12,
    dimension: "T-F",
    question: "当别人向你倾诉烦恼时，你更常：",
    options: [
      { key: "A", text: "帮对方分析解决方案", value: "T" },
      { key: "B", text: "先给予情感上的理解", value: "F" },
    ],
  },
  {
    id: 13,
    dimension: "T-F",
    question: "在发生分歧时，你更在意：",
    options: [
      { key: "A", text: "把道理说清楚", value: "T" },
      { key: "B", text: "是否伤害他人感受", value: "F" },
    ],
  },
  {
    id: 14,
    dimension: "T-F",
    question: "你更容易被什么说服？",
    options: [
      { key: "A", text: "理性、有逻辑的论证", value: "T" },
      { key: "B", text: "有情感共鸣的表达", value: "F" },
    ],
  },
  {
    id: 15,
    dimension: "T-F",
    question: "当事实与感受冲突时，你更可能：",
    options: [
      { key: "A", text: "遵循事实判断", value: "T" },
      { key: "B", text: "听从内心感受", value: "F" },
    ],
  },

  {
    id: 16,
    dimension: "J-P",
    question: "面对任务时，你通常会：",
    options: [
      { key: "A", text: "提前规划并尽早完成", value: "J" },
      { key: "B", text: "灵活推进，临近再做", value: "P" },
    ],
  },
  {
    id: 17,
    dimension: "J-P",
    question: "你的日常节奏更接近：",
    options: [
      { key: "A", text: "稳定、有规律", value: "J" },
      { key: "B", text: "随情况变化", value: "P" },
    ],
  },
  {
    id: 18,
    dimension: "J-P",
    question: "当计划被打乱时，你更可能：",
    options: [
      { key: "A", text: "尽快回到原计划", value: "J" },
      { key: "B", text: "接受变化并调整", value: "P" },
    ],
  },
  {
    id: 19,
    dimension: "J-P",
    question: "你是否经常列待办清单？",
    options: [
      { key: "A", text: "经常或几乎每天", value: "J" },
      { key: "B", text: "很少或几乎不列", value: "P" },
    ],
  },
  {
    id: 20,
    dimension: "J-P",
    question: "你的工作方式更像：",
    options: [
      { key: "A", text: "按步骤稳定推进", value: "J" },
      { key: "B", text: "灵感来了集中爆发", value: "P" },
    ],
  },

  {
    id: 21,
    dimension: "E-I",
    question: "你是否更喜欢与人一起工作？",
    options: [
      { key: "A", text: "是的，更有动力", value: "E" },
      { key: "B", text: "不是，更喜欢独立", value: "I" },
    ],
  },
  {
    id: 22,
    dimension: "S-N",
    question: "在描述一段经历时，你更倾向于：",
    options: [
      { key: "A", text: "讲清楚具体发生了什么", value: "S" },
      { key: "B", text: "表达整体感受和意义", value: "N" },
    ],
  },
  {
    id: 23,
    dimension: "T-F",
    question: "你是否更看重效率，即使忽略部分情感？",
    options: [
      { key: "A", text: "是的，结果更重要", value: "T" },
      { key: "B", text: "不是，情感同样重要", value: "F" },
    ],
  },
  {
    id: 24,
    dimension: "J-P",
    question: "你是否容易拖到最后一刻才行动？",
    options: [
      { key: "A", text: "很少", value: "J" },
      { key: "B", text: "经常", value: "P" },
    ],
  },
  {
    id: 25,
    dimension: "E-I",
    question: "在热闹的环境中，你更可能：",
    options: [
      { key: "A", text: "感到兴奋和投入", value: "E" },
      { key: "B", text: "感到分心或想离开", value: "I" },
    ],
  },

  {
    id: 26,
    dimension: "S-N",
    question: "你更喜欢哪类讨论？",
    options: [
      { key: "A", text: "围绕现实问题的讨论", value: "S" },
      { key: "B", text: "围绕想法和可能性的讨论", value: "N" },
    ],
  },
  {
    id: 27,
    dimension: "S-N",
    question: "你是否容易对高度理论化的讨论感到无聊？",
    options: [
      { key: "A", text: "是的，更喜欢实际内容", value: "S" },
      { key: "B", text: "不会，反而觉得有趣", value: "N" },
    ],
  },
  {
    id: 28,
    dimension: "S-N",
    question: "你在工作中更偏好：",
    options: [
      { key: "A", text: "按步骤完成任务", value: "S" },
      { key: "B", text: "灵活调整并尝试新思路", value: "N" },
    ],
  },
  {
    id: 29,
    dimension: "S-N",
    question: "你是否享受探索陌生的观点？",
    options: [
      { key: "A", text: "不太感兴趣", value: "S" },
      { key: "B", text: "非常享受", value: "N" },
    ],
  },
  {
    id: 30,
    dimension: "S-N",
    question: "在描述一段经历时，你更倾向于：",
    options: [
      { key: "A", text: "讲清楚发生了什么", value: "S" },
      { key: "B", text: "表达整体感受和意义", value: "N" },
    ],
  },

  {
    id: 31,
    dimension: "T-F",
    question: "在冲突中，你更优先考虑：",
    options: [
      { key: "A", text: "把道理说清楚", value: "T" },
      { key: "B", text: "不伤害对方感受", value: "F" },
    ],
  },
  {
    id: 32,
    dimension: "T-F",
    question: "你是否容易被情绪化的观点影响？",
    options: [
      { key: "A", text: "不太容易", value: "T" },
      { key: "B", text: "比较容易", value: "F" },
    ],
  },
  {
    id: 33,
    dimension: "T-F",
    question: "在做决定时，你通常：",
    options: [
      { key: "A", text: "依据事实和逻辑", value: "T" },
      { key: "B", text: "依据感受和直觉", value: "F" },
    ],
  },
  {
    id: 34,
    dimension: "T-F",
    question: "当事实与感受冲突时，你更可能：",
    options: [
      { key: "A", text: "遵循事实", value: "T" },
      { key: "B", text: "跟随内心", value: "F" },
    ],
  },
  {
    id: 35,
    dimension: "T-F",
    question: "你是否更看重效率，即使忽略部分情感？",
    options: [
      { key: "A", text: "是的，结果更重要", value: "T" },
      { key: "B", text: "不是，情感同样重要", value: "F" },
    ],
  },

  {
    id: 36,
    dimension: "J-P",
    question: "你是否习惯提前完成任务？",
    options: [
      { key: "A", text: "是的，越早越安心", value: "J" },
      { key: "B", text: "不一定，临近再做", value: "P" },
    ],
  },
  {
    id: 37,
    dimension: "J-P",
    question: "你的作息通常是：",
    options: [
      { key: "A", text: "稳定、有规律", value: "J" },
      { key: "B", text: "不固定、看情况", value: "P" },
    ],
  },
  {
    id: 38,
    dimension: "J-P",
    question: "你是否经常拖到最后一刻才行动？",
    options: [
      { key: "A", text: "很少", value: "J" },
      { key: "B", text: "经常", value: "P" },
    ],
  },
  {
    id: 39,
    dimension: "J-P",
    question: "你的工作方式更像：",
    options: [
      { key: "A", text: "按流程逐步完成", value: "J" },
      { key: "B", text: "灵活跳跃式推进", value: "P" },
    ],
  },
  {
    id: 40,
    dimension: "J-P",
    question: "面对截止期限时，你通常：",
    options: [
      { key: "A", text: "感到有掌控感", value: "J" },
      { key: "B", text: "感到压力较大", value: "P" },
    ],
  },

  {
    id: 41,
    dimension: "E-I",
    question: "你是否更喜欢热闹、忙碌的环境？",
    options: [
      { key: "A", text: "是的，更有活力", value: "E" },
      { key: "B", text: "不是，更喜欢安静", value: "I" },
    ],
  },
  {
    id: 42,
    dimension: "E-I",
    question: "你是否会避免打电话？",
    options: [
      { key: "A", text: "不会，打电话很自然", value: "E" },
      { key: "B", text: "会，能避免就避免", value: "I" },
    ],
  },
  {
    id: 43,
    dimension: "T-F",
    question: "你是否容易被过去的错误困扰？",
    options: [
      { key: "A", text: "不太会，一般能放下", value: "T" },
      { key: "B", text: "会，经常反复想起", value: "F" },
    ],
  },
  {
    id: 44,
    dimension: "T-F",
    question: "当别人对你评价很高时，你更可能：",
    options: [
      { key: "A", text: "觉得这是认可", value: "T" },
      { key: "B", text: "担心让对方失望", value: "F" },
    ],
  },
  {
    id: 45,
    dimension: "J-P",
    question: "你是否更喜欢事情有明确结果？",
    options: [
      { key: "A", text: "是的，更安心", value: "J" },
      { key: "B", text: "不是，保持开放更好", value: "P" },
    ],
  },

  {
    id: 46,
    dimension: "S-N",
    question: "你是否更关注事物的实际用途？",
    options: [
      { key: "A", text: "是的，实用最重要", value: "S" },
      { key: "B", text: "不是，更在意意义", value: "N" },
    ],
  },
  {
    id: 47,
    dimension: "S-N",
    question: "你是否喜欢构思新想法？",
    options: [
      { key: "A", text: "一般，更偏现实", value: "S" },
      { key: "B", text: "非常喜欢", value: "N" },
    ],
  },
  {
    id: 48,
    dimension: "T-F",
    question: "你是否更容易注意到他人的情绪变化？",
    options: [
      { key: "A", text: "不太容易", value: "T" },
      { key: "B", text: "很容易", value: "F" },
    ],
  },
  {
    id: 49,
    dimension: "J-P",
    question: "你是否容易感到事情压得你喘不过气？",
    options: [
      { key: "A", text: "不太会", value: "J" },
      { key: "B", text: "经常会", value: "P" },
    ],
  },
  {
    id: 50,
    dimension: "E-I",
    question: "你对未来是否整体感到乐观？",
    options: [
      { key: "A", text: "是的，比较有信心", value: "E" },
      { key: "B", text: "不一定，较为谨慎", value: "I" },
    ],
  },

  {
    id: 51,
    dimension: "S-N",
    question: "你更偏好哪种任务？",
    options: [
      { key: "A", text: "有清晰步骤的任务", value: "S" },
      { key: "B", text: "需要创意的任务", value: "N" },
    ],
  },
  {
    id: 52,
    dimension: "J-P",
    question: "你是否更喜欢先完成事情再放松？",
    options: [
      { key: "A", text: "是的，完成后更安心", value: "J" },
      { key: "B", text: "不是，可以边做边放松", value: "P" },
    ],
  },
  {
    id: 53,
    dimension: "T-F",
    question: "你在做选择时更依赖：",
    options: [
      { key: "A", text: "理性判断", value: "T" },
      { key: "B", text: "情绪直觉", value: "F" },
    ],
  },
  {
    id: 54,
    dimension: "E-I",
    question: "你是否更喜欢与人共事而非独处？",
    options: [
      { key: "A", text: "是的，更有动力", value: "E" },
      { key: "B", text: "不是，更专注", value: "I" },
    ],
  },
  {
    id: 55,
    dimension: "S-N",
    question: "你是否容易沉浸在未来的设想中？",
    options: [
      { key: "A", text: "不太会，更关注当下", value: "S" },
      { key: "B", text: "经常会", value: "N" },
    ],
  },

  {
    id: 56,
    dimension: "T-F",
    question: "在道德问题上，你是否喜欢辩论？",
    options: [
      { key: "A", text: "是的，喜欢分析", value: "T" },
      { key: "B", text: "不是，更在意感受", value: "F" },
    ],
  },
  {
    id: 57,
    dimension: "J-P",
    question: "你是否觉得保持固定作息很难？",
    options: [
      { key: "A", text: "不难，习惯规律", value: "J" },
      { key: "B", text: "比较难", value: "P" },
    ],
  },
  {
    id: 58,
    dimension: "E-I",
    question: "在陌生环境中，你更容易：",
    options: [
      { key: "A", text: "主动融入", value: "E" },
      { key: "B", text: "先观察再行动", value: "I" },
    ],
  },
  {
    id: 59,
    dimension: "T-F",
    question: "你是否认为善意比绝对诚实更重要？",
    options: [
      { key: "A", text: "不是，诚实更重要", value: "T" },
      { key: "B", text: "是的，善意更重要", value: "F" },
    ],
  },

  {
    id: 60,
    dimension: "S-N",
    question: "你更相信哪一种？",
    options: [
      { key: "A", text: "事实和经验", value: "S" },
      { key: "B", text: "直觉和感觉", value: "N" },
    ],
  },
];
