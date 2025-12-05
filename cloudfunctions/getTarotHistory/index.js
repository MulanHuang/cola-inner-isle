// cloudfunctions/getTarotHistory/index.js
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

/**
 * 获取塔罗历史记录云函数
 */
exports.main = async (event) => {
  const { page = 0, pageSize = 20 } = event;
  const { OPENID: openid } = cloud.getWXContext();

  try {
    const listResult = await queryWithFallback({
      openid,
      page,
      pageSize,
      primary: "tarotDraws",
      secondary: "tarotDraw",
    });

    return {
      success: true,
      list: listResult.list,
      hasMore: listResult.hasMore,
    };
  } catch (err) {
    console.error("获取塔罗历史失败", err);
    return {
      success: false,
      error: err.message,
      errCode: err.errCode,
      list: [],
      hasMore: false,
    };
  }
};

async function queryWithFallback({
  openid,
  page,
  pageSize,
  primary,
  secondary,
}) {
  try {
    // 先做简单查询，避免聚合权限受限
    return await simpleQuery({
      collectionName: primary,
      openid,
      page,
      pageSize,
    });
  } catch (err) {
    if (!shouldFallback(err)) throw err;

    // 再尝试主集合的聚合查询（lookup）
    try {
      return await queryHistory({
        collectionName: primary,
        openid,
        page,
        pageSize,
      });
    } catch (err2) {
      if (!shouldFallback(err2)) throw err2;
    }

    // 再尝试备用集合
    try {
      return await queryHistory({
        collectionName: secondary,
        openid,
        page,
        pageSize,
      });
    } catch (err3) {
      if (!shouldFallback(err3)) throw err3;
      // 最低降级：备用集合简单查询
      return await simpleQuery({
        collectionName: secondary,
        openid,
        page,
        pageSize,
      });
    }
  }
}

async function queryHistory({ collectionName, openid, page, pageSize }) {
  const res = await db
    .collection(collectionName)
    .aggregate()
    .match({ _openid: openid })
    .sort({ createTime: -1 })
    .skip(page * pageSize)
    .limit(pageSize)
    .lookup({
      from: "tarotCards",
      localField: "cardId",
      foreignField: "_id",
      as: "card",
    })
    .end();

  const list = (res.list || []).map((item) => {
    const card = item.card && item.card[0];
    return {
      _id: item._id,
      cardId: item.cardId,
      cardName: card?.name || "未知牌",
      cardImage: card?.image || "",
      question: item.question || "",
      interpretation: item.interpretation || "",
      actionPlan: item.actionPlan || "",
      date: item.date || "",
      createTime: item.createTime,
    };
  });

  return { list, hasMore: list.length === pageSize };
}

async function simpleQuery({ collectionName, openid, page, pageSize }) {
  // 简单查询不做 lookup，兼容最严格的集合权限
  const res = await db
    .collection(collectionName)
    .where({ _openid: openid })
    .orderBy("createTime", "desc")
    .skip(page * pageSize)
    .limit(pageSize)
    .get();

  const list = (res.data || []).map((item) => ({
    _id: item._id,
    cardId: item.cardId,
    cardName: item.cardName || "未知牌",
    cardImage: item.cardImage || "",
    question: item.question || "",
    interpretation: item.interpretation || "",
    actionPlan: item.actionPlan || "",
    date: item.date || "",
    createTime: item.createTime,
  }));

  return { list, hasMore: list.length === pageSize };
}

function shouldFallback(err) {
  return (
    err &&
    (err.errCode === -502005 ||
      err.errCode === -502003 ||
      err.errCode === -501002 || // 聚合/权限错误
      (typeof err.errMsg === "string" &&
        err.errMsg.toLowerCase().includes("permission denied")))
  );
}
