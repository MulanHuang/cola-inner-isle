// 脉轮测试题库
// 7个脉轮，每个脉轮约11-12题，共80题

const CHAKRA_QUESTIONS = [
  // ========== 海底轮 Root Chakra (Muladhara) - 题目 1-12 ==========
  {
    id: 1,
    question: "你会经常避免某些特定的情境吗？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 2,
    question: "你是否经常感到焦虑或不安全？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 3,
    question: "你对未来感到担忧和恐惧吗？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 4,
    question: "你是否觉得自己在生活中缺乏稳定感？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 5,
    question: "你是否经常感到疲惫或缺乏活力？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 6,
    question: "你是否难以信任他人或环境？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 7,
    question: "你是否经常感到身体紧张或僵硬？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 8,
    question: "你是否觉得自己与大地和自然失去了连接？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 9,
    question: "你是否经常担心金钱或物质安全？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 10,
    question: "你是否难以感受到归属感？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 11,
    question: "你是否经常感到孤独或被孤立？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 12,
    question: "你是否觉得自己的基本需求没有得到满足？",
    chakra: "root",
    options: [1, 2, 3, 4, 5],
  },

  // ========== 腹轮 Sacral Chakra (Svadhisthana) - 题目 13-23 ==========
  {
    id: 13,
    question: "你是否觉得自己缺乏创造力？",
    chakra: "sacral",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 14,
    question: "你是否难以表达自己的情感？",
    chakra: "sacral",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 15,
    question: "你是否对亲密关系感到恐惧或不适？",
    chakra: "sacral",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 16,
    question: "你是否经常感到情绪麻木或冷漠？",
    chakra: "sacral",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 17,
    question: "你是否难以享受生活中的乐趣？",
    chakra: "sacral",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 18,
    question: "你是否觉得自己的性能量受到压抑？",
    chakra: "sacral",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 19,
    question: "你是否经常感到内疚或羞愧？",
    chakra: "sacral",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 20,
    question: "你是否难以与他人建立深层连接？",
    chakra: "sacral",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 21,
    question: "你是否觉得自己缺乏激情和热情？",
    chakra: "sacral",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 22,
    question: "你是否经常压抑自己的欲望和需求？",
    chakra: "sacral",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 23,
    question: "你是否难以接受自己的身体和感受？",
    chakra: "sacral",
    options: [1, 2, 3, 4, 5],
  },

  // ========== 太阳神经丛轮 Solar Plexus Chakra (Manipura) - 题目 24-35 ==========
  {
    id: 24,
    question: "你是否经常感到自卑或缺乏自信？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 25,
    question: "你是否难以做出决定？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 26,
    question: "你是否觉得自己缺乏个人力量？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 27,
    question: "你是否经常感到被他人控制？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 28,
    question: "你是否难以设定和实现目标？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 29,
    question: "你是否经常感到愤怒或沮丧？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 30,
    question: "你是否觉得自己没有价值？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 31,
    question: "你是否难以为自己设定界限？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 32,
    question: "你是否经常感到无助或无力？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 33,
    question: "你是否难以承担责任？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 34,
    question: "你是否觉得自己缺乏自律和意志力？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 35,
    question: "你是否经常寻求他人的认可和批准？",
    chakra: "solar",
    options: [1, 2, 3, 4, 5],
  },

  // ========== 心轮 Heart Chakra (Anahata) - 题目 36-47 ==========
  {
    id: 36,
    question: "你是否难以给予或接受爱？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 37,
    question: "你是否经常感到心碎或悲伤？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 38,
    question: "你是否难以原谅自己或他人？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 39,
    question: "你是否觉得自己缺乏同理心？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 40,
    question: "你是否经常感到孤独或被拒绝？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 41,
    question: "你是否难以表达爱和感激？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 42,
    question: "你是否觉得自己的心被关闭了？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 43,
    question: "你是否经常感到嫉妒或占有欲？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 44,
    question: "你是否难以与他人建立亲密关系？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 45,
    question: "你是否觉得自己不值得被爱？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 46,
    question: "你是否经常感到怨恨或苦涩？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 47,
    question: "你是否难以对自己和他人表达慈悲？",
    chakra: "heart",
    options: [1, 2, 3, 4, 5],
  },

  // ========== 喉轮 Throat Chakra (Vishuddha) - 题目 48-58 ==========
  {
    id: 48,
    question: "你是否难以表达自己的真实想法？",
    chakra: "throat",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 49,
    question: "你是否经常感到喉咙紧绷或不适？",
    chakra: "throat",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 50,
    question: "你是否害怕说出自己的真相？",
    chakra: "throat",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 51,
    question: "你是否觉得自己的声音没有被听到？",
    chakra: "throat",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 52,
    question: "你是否难以倾听他人？",
    chakra: "throat",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 53,
    question: "你是否经常说谎或隐瞒真相？",
    chakra: "throat",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 54,
    question: "你是否觉得自己缺乏创造性表达？",
    chakra: "throat",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 55,
    question: "你是否难以为自己发声或捍卫自己？",
    chakra: "throat",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 56,
    question: "你是否经常感到沟通困难？",
    chakra: "throat",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 57,
    question: "你是否觉得自己的表达受到限制？",
    chakra: "throat",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 58,
    question: "你是否难以说出自己的需求和界限？",
    chakra: "throat",
    options: [1, 2, 3, 4, 5],
  },

  // ========== 眉心轮 Third Eye Chakra (Ajna) - 题目 59-69 ==========
  {
    id: 59,
    question: "你是否觉得自己缺乏直觉或洞察力？",
    chakra: "third_eye",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 60,
    question: "你是否难以想象或可视化？",
    chakra: "third_eye",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 61,
    question: "你是否经常感到困惑或迷失方向？",
    chakra: "third_eye",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 62,
    question: "你是否难以信任自己的内在智慧？",
    chakra: "third_eye",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 63,
    question: "你是否觉得自己缺乏清晰的愿景？",
    chakra: "third_eye",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 64,
    question: "你是否经常忽视自己的直觉？",
    chakra: "third_eye",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 65,
    question: "你是否难以看到事物的更大图景？",
    chakra: "third_eye",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 66,
    question: "你是否觉得自己的思维混乱或不清晰？",
    chakra: "third_eye",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 67,
    question: "你是否难以记住梦境或内在体验？",
    chakra: "third_eye",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 68,
    question: "你是否经常感到精神疲劳或头痛？",
    chakra: "third_eye",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 69,
    question: "你是否难以专注或集中注意力？",
    chakra: "third_eye",
    options: [1, 2, 3, 4, 5],
  },

  // ========== 顶轮 Crown Chakra (Sahasrara) - 题目 70-80 ==========
  {
    id: 70,
    question: "你是否觉得自己与更高的力量失去了连接？",
    chakra: "crown",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 71,
    question: "你是否难以感受到生命的意义和目的？",
    chakra: "crown",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 72,
    question: "你是否经常感到精神空虚或迷失？",
    chakra: "crown",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 73,
    question: "你是否觉得自己缺乏灵性连接？",
    chakra: "crown",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 74,
    question: "你是否难以体验到超越自我的感受？",
    chakra: "crown",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 75,
    question: "你是否经常感到与宇宙分离？",
    chakra: "crown",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 76,
    question: "你是否觉得自己缺乏智慧和理解？",
    chakra: "crown",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 77,
    question: "你是否难以接受生命的神秘和未知？",
    chakra: "crown",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 78,
    question: "你是否经常感到孤立或与整体分离？",
    chakra: "crown",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 79,
    question: "你是否觉得自己缺乏内在平静和宁静？",
    chakra: "crown",
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 80,
    question: "你是否难以体验到合一和完整的感觉？",
    chakra: "crown",
    options: [1, 2, 3, 4, 5],
  },
];

// 选项标签
const OPTION_LABELS = [
  { value: 1, label: "完全不是" },
  { value: 2, label: "有一点" },
  { value: 3, label: "中等" },
  { value: 4, label: "比较是" },
  { value: 5, label: "完全是" },
];

module.exports = {
  CHAKRA_QUESTIONS,
  OPTION_LABELS,
};
