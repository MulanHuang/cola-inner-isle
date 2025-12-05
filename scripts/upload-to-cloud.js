/**
 * 上传资源到微信云存储
 * 使用方法：
 * 1. 在微信开发者工具中打开"云开发控制台"
 * 2. 进入"存储" -> "文件管理"
 * 3. 手动上传文件，或使用此脚本批量上传
 */

const cloud = require('wx-server-sdk');

// 使用动态当前环境，避免手动填写 envId 出现错配
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

/**
 * 批量上传塔罗牌图片到云存储
 * 
 * 目录结构：
 * cloud://cloud1-5gc5jltwbcbef586.xxxx/tarot/
 *   - 0-The Fool.png
 *   - 1-The Magician.png
 *   - ...
 * 
 * 使用步骤：
 * 1. 在云开发控制台创建 tarot 文件夹
 * 2. 将 images/tarrot-cards/PNG/ 中的所有图片上传到 tarot 文件夹
 * 3. 图片会自动获得云存储 URL
 */

// 塔罗牌文件映射（22张大阿卡纳）
const tarotCardFiles = [
  { id: 'fool', filename: '0-The Fool.png' },
  { id: 'magician', filename: '1-The Magician.png' },
  { id: 'high-priestess', filename: '2-The High Priestess.png' },
  { id: 'empress', filename: '3-The Empress.png' },
  { id: 'emperor', filename: '4-The Emperor.png' },
  { id: 'hierophant', filename: '5-The Hierophant.png' },
  { id: 'lovers', filename: '6-The Lovers.png' },
  { id: 'chariot', filename: '7-The Chariot.png' },
  { id: 'strength', filename: '8-Strength.png' },
  { id: 'hermit', filename: '9-The Hermit.png' },
  { id: 'wheel', filename: '10-Wheel of Fortune.png' },
  { id: 'justice', filename: '11-Justice.png' },
  { id: 'hanged-man', filename: '12-The Hanged Man.png' },
  { id: 'death', filename: '13-Death.png' },
  { id: 'temperance', filename: '14-Temperance.png' },
  { id: 'devil', filename: '15-The Devil.png' },
  { id: 'tower', filename: '16-The Tower.png' },
  { id: 'star', filename: '17-The Star.png' },
  { id: 'moon', filename: '18-The Moon.png' },
  { id: 'sun', filename: '19-The Sun.png' },
  { id: 'judgement', filename: '20-Judgement.png' },
  { id: 'world', filename: '21-The World.png' }
];

/**
 * 生成云存储 URL
 * 格式：cloud://环境ID.xxxx/路径/文件名
 */
function generateCloudUrl(filename) {
  return `cloud://cloud1-5gc5jltwbcbef586.636c-cloud1-5gc5jltwbcbef586-1330238286/tarot/${filename}`;
}

/**
 * 生成更新后的 tarotCards.json
 */
function generateUpdatedTarotCards() {
  const cards = [
    { name: "愚者", nameEn: "The Fool", keywords: "新开始、冒险、纯真", meaning: "代表新的开始和无限可能，鼓励你以开放的心态迎接未知", id: "fool", order: 0 },
    { name: "魔术师", nameEn: "The Magician", keywords: "创造、行动、技能", meaning: "象征着将想法转化为现实的能力，你拥有实现目标的资源", id: "magician", order: 1 },
    { name: "女祭司", nameEn: "The High Priestess", keywords: "直觉、智慧、内在", meaning: "提醒你倾听内在的声音，相信自己的直觉和潜意识", id: "high-priestess", order: 2 },
    { name: "皇后", nameEn: "The Empress", keywords: "丰盛、滋养、创造", meaning: "代表丰盛和滋养，鼓励你关爱自己和他人", id: "empress", order: 3 },
    { name: "皇帝", nameEn: "The Emperor", keywords: "权威、结构、稳定", meaning: "象征秩序和稳定，提醒你建立清晰的界限和结构", id: "emperor", order: 4 },
    { name: "教皇", nameEn: "The Hierophant", keywords: "传统、信仰、指引", meaning: "代表传统智慧和精神指引，寻找内在的信仰", id: "hierophant", order: 5 },
    { name: "恋人", nameEn: "The Lovers", keywords: "选择、关系、和谐", meaning: "象征重要的选择和关系，提醒你遵从内心的真实感受", id: "lovers", order: 6 },
    { name: "战车", nameEn: "The Chariot", keywords: "意志、前进、胜利", meaning: "代表坚定的意志和前进的动力，你有能力克服障碍", id: "chariot", order: 7 },
    { name: "力量", nameEn: "Strength", keywords: "勇气、耐心、温柔", meaning: "象征内在的力量和温柔的勇气，以爱和耐心面对挑战", id: "strength", order: 8 },
    { name: "隐者", nameEn: "The Hermit", keywords: "内省、独处、智慧", meaning: "提醒你向内探索，在独处中寻找智慧和答案", id: "hermit", order: 9 },
    { name: "命运之轮", nameEn: "Wheel of Fortune", keywords: "变化、循环、机遇", meaning: "象征生命的循环和变化，接纳生命的起伏", id: "wheel", order: 10 },
    { name: "正义", nameEn: "Justice", keywords: "公平、真相、平衡", meaning: "代表公正和平衡，提醒你做出诚实的选择", id: "justice", order: 11 },
    { name: "倒吊人", nameEn: "The Hanged Man", keywords: "放下、换位、等待", meaning: "鼓励你换个角度看问题，在等待中获得新的领悟", id: "hanged-man", order: 12 },
    { name: "死神", nameEn: "Death", keywords: "转变、结束、重生", meaning: "象征旧事物的结束和新生，拥抱转变带来的成长", id: "death", order: 13 },
    { name: "节制", nameEn: "Temperance", keywords: "平衡、和谐、整合", meaning: "提醒你寻找平衡，整合生命中的不同面向", id: "temperance", order: 14 },
    { name: "恶魔", nameEn: "The Devil", keywords: "束缚、欲望、觉察", meaning: "提醒你觉察内在的束缚和限制，你有能力解放自己", id: "devil", order: 15 },
    { name: "塔", nameEn: "The Tower", keywords: "突变、释放、觉醒", meaning: "象征突然的改变和旧结构的瓦解，为新生创造空间", id: "tower", order: 16 },
    { name: "星星", nameEn: "The Star", keywords: "希望、疗愈、灵感", meaning: "带来希望和疗愈的能量，相信美好的未来", id: "star", order: 17 },
    { name: "月亮", nameEn: "The Moon", keywords: "直觉、梦境、潜意识", meaning: "提醒你关注内在的直觉和潜意识的信息", id: "moon", order: 18 },
    { name: "太阳", nameEn: "The Sun", keywords: "喜悦、成功、光明", meaning: "象征喜悦和成功，享受生命的美好时刻", id: "sun", order: 19 },
    { name: "审判", nameEn: "Judgement", keywords: "觉醒、重生、召唤", meaning: "代表内在的觉醒和重生，回应生命的召唤", id: "judgement", order: 20 },
    { name: "世界", nameEn: "The World", keywords: "完成、圆满、整合", meaning: "象征一个周期的完成和圆满，庆祝你的成就", id: "world", order: 21 }
  ];

  return cards.map(card => {
    const fileInfo = tarotCardFiles.find(f => f.id === card.id);
    return {
      ...card,
      image: generateCloudUrl(fileInfo.filename)
    };
  });
}

// 导出函数供其他模块使用
module.exports = {
  tarotCardFiles,
  generateCloudUrl,
  generateUpdatedTarotCards
};

// 如果直接运行此脚本，输出更新后的 JSON
if (require.main === module) {
  const updatedCards = generateUpdatedTarotCards();
  console.log(JSON.stringify(updatedCards, null, 2));
}
