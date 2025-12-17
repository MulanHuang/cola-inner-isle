/**
 * updateTarotDraw 云函数
 * 更新塔罗牌抽牌记录（解读、问题、行动计划等）
 * 解决前端权限问题：在云函数中验证用户身份后更新
 */
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { drawId, collection = "tarotDraws", data = {} } = event;

  console.log("[updateTarotDraw] 开始更新记录:", {
    openid: OPENID,
    drawId,
    collection,
    dataKeys: Object.keys(data),
  });

  // 参数校验
  if (!drawId) {
    return {
      success: false,
      error: "缺少 drawId 参数",
    };
  }

  if (!OPENID) {
    return {
      success: false,
      error: "无法获取用户身份",
    };
  }

  try {
    // 先查询记录，验证是否属于当前用户
    const docRes = await db.collection(collection).doc(drawId).get();

    if (!docRes.data) {
      return {
        success: false,
        error: "记录不存在",
      };
    }

    // 验证记录所有者
    if (docRes.data._openid !== OPENID) {
      console.warn("[updateTarotDraw] ⚠️ 权限拒绝：用户尝试更新他人记录");
      return {
        success: false,
        error: "无权更新此记录",
      };
    }

    // 只允许更新特定字段（安全白名单）
    const allowedFields = ["question", "interpretation", "actionPlan"];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: "没有有效的更新字段",
      };
    }

    // 添加更新时间
    updateData.updateTime = db.serverDate();

    // 执行更新
    const updateRes = await db
      .collection(collection)
      .doc(drawId)
      .update({ data: updateData });

    console.log("[updateTarotDraw] ✅ 更新成功:", updateRes);

    return {
      success: true,
      updated: updateRes.stats.updated,
      message: "更新成功",
    };
  } catch (err) {
    console.error("[updateTarotDraw] ❌ 更新失败:", err);

    // 如果集合不存在，尝试备用集合名
    if (err.errCode === -502005 && collection === "tarotDraws") {
      console.log("[updateTarotDraw] 尝试备用集合 tarotDraw");
      return exports.main({
        ...event,
        collection: "tarotDraw",
      });
    }

    return {
      success: false,
      error: err.message,
      errCode: err.errCode,
    };
  }
};

