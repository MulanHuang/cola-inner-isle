/**
 * 使用开源 Rider-Waite 逆位文案填充
 * 数据源: https://raw.githubusercontent.com/dariusk/corpora/master/data/divination/tarot_interpretations.json
 * 许可证: CC0
 *
 * 输入: database/init-data/tarotCards-with-reversed.json
 * 输出: 覆盖写回同文件（保留原有字段，逆位字段优先用官方数据）
 *
 * 说明:
 * - 官方文案为英文，可后续人工翻译；本脚本优先保证“逆位含义”不再是模板。
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const filePath = path.join(
  __dirname,
  "..",
  "database",
  "init-data",
  "tarotCards-with-reversed.json"
);

function fetchOfficialCards() {
  const url =
    "https://raw.githubusercontent.com/dariusk/corpora/master/data/divination/tarot_interpretations.json";
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed?.tarot_interpretations || []);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

async function main() {
  const raw = fs.readFileSync(filePath, "utf8");
  const cards = JSON.parse(raw);

  console.log("⏬ 正在获取官方逆位数据...");
  const official = await fetchOfficialCards();
  const map = {};
  official.forEach((c) => {
    map[c.name] = c;
  });

  const merged = cards.map((card) => {
    const off = map[card.nameEn];
    if (!off) return card;
    const shadow = Array.isArray(off.meanings?.shadow)
      ? off.meanings.shadow
      : [];
    const reversedMeaning = shadow.length
      ? `【逆位】${shadow.join("； ")}`
      : card.reversedMeaning;
    const reversedKeywords = shadow.length
      ? shadow.slice(0, 3).join("； ")
      : card.reversedKeywords || card.keywords || "逆位含义待补充";

    return {
      ...card,
      reversedMeaning,
      reversedKeywords,
    };
  });

  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
  console.log("✅ 已合并官方逆位数据并覆盖写入 tarotCards-with-reversed.json");
}

main().catch((err) => {
  console.error("❌ 合并失败:", err);
  process.exit(1);
});
