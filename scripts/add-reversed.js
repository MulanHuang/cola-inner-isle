/**
 * 为塔罗牌数据补充逆位字段
 * 输入: database/init-data/tarotCards.json
 * 输出: database/init-data/tarotCards-with-reversed.json
 */
const fs = require("fs");
const path = require("path");

const srcPath = path.join(
  __dirname,
  "..",
  "database",
  "init-data",
  "tarotCards.json"
);
const outPath = path.join(
  __dirname,
  "..",
  "database",
  "init-data",
  "tarotCards-with-reversed.json"
);

function main() {
  const raw = fs.readFileSync(srcPath, "utf8");
  const data = JSON.parse(raw);

  const withReversed = data.map((card) => {
    const baseKeywords = card.keywords || card.name || "主题";
    const reversedKeywords =
      card.reversedKeywords ||
      `${baseKeywords}（逆位，阻滞/过度/失衡）`;

    const baseMeaning = card.meaning || "正位含义待补充";
    const reversedMeaning =
      card.reversedMeaning ||
      `【逆位】当这张牌逆位出现，表示与“${baseKeywords}”相关的能量出现阻滞、过度或失衡，需要反思并调整：${baseMeaning}`;

    return {
      ...card,
      reversedKeywords,
      reversedMeaning,
    };
  });

  fs.writeFileSync(outPath, JSON.stringify(withReversed, null, 2));
  console.log(`✅ 完成，输出文件: ${outPath}`);
}

main();
