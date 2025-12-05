/**
 * 塔罗牌数据验证脚本
 * 用于验证 tarotCards-cloud.json 文件的完整性和正确性
 */

const fs = require("fs");
const path = require("path");

// 读取 JSON 文件
const jsonPath = path.join(
  __dirname,
  "../database/init-data/tarotCards-cloud.json"
);

console.log("🔍 开始验证塔罗牌数据...\n");

try {
  // 1. 检查文件是否存在
  if (!fs.existsSync(jsonPath)) {
    console.error("❌ 错误：找不到文件", jsonPath);
    process.exit(1);
  }
  console.log("✅ 文件存在");

  // 2. 读取文件内容
  const fileContent = fs.readFileSync(jsonPath, "utf8");
  console.log("✅ 文件读取成功");

  // 3. 解析 JSON
  let tarotCards;
  try {
    tarotCards = JSON.parse(fileContent);
    console.log("✅ JSON 格式正确");
  } catch (parseError) {
    console.error("❌ JSON 解析失败:", parseError.message);
    process.exit(1);
  }

  // 4. 检查是否是数组
  if (!Array.isArray(tarotCards)) {
    console.error("❌ 错误：数据不是数组格式");
    process.exit(1);
  }
  console.log("✅ 数据是数组格式");

  // 5. 检查数据数量
  console.log(`✅ 塔罗牌数量: ${tarotCards.length} 张`);
  if (tarotCards.length !== 78) {
    console.warn(
      `⚠️  警告：标准塔罗牌应该有 78 张，当前有 ${tarotCards.length} 张`
    );
  }

  // 6. 检查每张牌的必需字段
  const requiredFields = [
    "name",
    "nameEn",
    "keywords",
    "meaning",
    "image",
    "order",
  ];
  let hasErrors = false;

  tarotCards.forEach((card, index) => {
    const missingFields = requiredFields.filter((field) => !card[field]);
    if (missingFields.length > 0) {
      console.error(
        `❌ 第 ${index + 1} 张牌缺少字段:`,
        missingFields.join(", ")
      );
      console.error(`   牌名: ${card.name || "未知"}`);
      hasErrors = true;
    }
  });

  if (!hasErrors) {
    console.log("✅ 所有塔罗牌都包含必需字段");
  }

  // 7. 检查云存储 URL 格式
  const cloudUrlPattern = /^cloud:\/\/[a-z0-9\-\.]+\/tarot\/PNG\/.+\.png$/;
  let invalidUrls = 0;

  tarotCards.forEach((card, index) => {
    if (!cloudUrlPattern.test(card.image)) {
      console.error(`❌ 第 ${index + 1} 张牌的图片 URL 格式不正确:`);
      console.error(`   牌名: ${card.name}`);
      console.error(`   URL: ${card.image}`);
      invalidUrls++;
    }
  });

  if (invalidUrls === 0) {
    console.log("✅ 所有图片 URL 格式正确");
  } else {
    console.error(`❌ 有 ${invalidUrls} 张牌的图片 URL 格式不正确`);
  }

  // 8. 检查 order 字段是否连续
  const orders = tarotCards.map((card) => card.order).sort((a, b) => a - b);
  let orderErrors = 0;

  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i) {
      console.error(`❌ order 字段不连续: 期望 ${i}, 实际 ${orders[i]}`);
      orderErrors++;
    }
  }

  if (orderErrors === 0) {
    console.log("✅ order 字段连续且正确");
  }

  // 9. 检查是否有重复的牌名
  const names = tarotCards.map((card) => card.name);
  const uniqueNames = new Set(names);
  if (names.length !== uniqueNames.size) {
    console.error("❌ 存在重复的牌名");
    const duplicates = names.filter(
      (name, index) => names.indexOf(name) !== index
    );
    console.error("   重复的牌名:", [...new Set(duplicates)].join(", "));
  } else {
    console.log("✅ 没有重复的牌名");
  }

  // 10. 统计塔罗牌类型
  const majorArcana = tarotCards.filter((card) => card.order <= 21);
  const cups = tarotCards.filter((card) => card.nameEn.includes("Cups"));
  const pentacles = tarotCards.filter((card) =>
    card.nameEn.includes("Pentacles")
  );
  const swords = tarotCards.filter((card) => card.nameEn.includes("Swords"));
  const wands = tarotCards.filter((card) => card.nameEn.includes("Wands"));

  console.log("\n📊 塔罗牌统计:");
  console.log(`   大阿尔卡纳: ${majorArcana.length} 张`);
  console.log(`   圣杯牌组: ${cups.length} 张`);
  console.log(`   钱币牌组: ${pentacles.length} 张`);
  console.log(`   宝剑牌组: ${swords.length} 张`);
  console.log(`   权杖牌组: ${wands.length} 张`);
  console.log(`   总计: ${tarotCards.length} 张`);

  // 11. 提取环境 ID
  if (tarotCards.length > 0) {
    const sampleUrl = tarotCards[0].image;
    const envIdMatch = sampleUrl.match(/cloud:\/\/([^\/]+)\//);
    if (envIdMatch) {
      console.log("\n🔧 云存储环境 ID:");
      console.log(`   ${envIdMatch[1]}`);
    }
  }

  // 12. 最终结果
  console.log("\n" + "=".repeat(50));
  if (!hasErrors && invalidUrls === 0 && orderErrors === 0) {
    console.log("🎉 验证通过！数据完整且格式正确。");
    console.log("\n📝 下一步:");
    console.log("   1. 将数据导入到云数据库 tarotCards 集合");
    console.log("   2. 上传塔罗牌图片到云存储 tarot/PNG/ 目录");
    console.log('   3. 设置云存储权限为 "所有用户可读"');
    console.log("   4. 在小程序中测试抽取塔罗牌功能");
  } else {
    console.log("⚠️  验证完成，但存在一些问题，请修复后再导入。");
  }
  console.log("=".repeat(50));
} catch (error) {
  console.error("❌ 验证过程中发生错误:", error.message);
  process.exit(1);
}
