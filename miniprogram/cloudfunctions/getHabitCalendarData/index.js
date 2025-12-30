/**
 * 获取习惯日历数据云函数
 * 聚合用户真实使用记录：塔罗、心语、冥想、情绪
 *
 * 重要：所有时间判断统一使用云数据库自动生成的 _createTime (UTC)
 * 然后结合前端传入的用户时区偏移，转换为用户本地日期进行归属判断
 * 不再固定使用北京时间，而是动态使用用户设备的时区
 */
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 当前仅统计 4 个习惯（与前端打卡日历对应）
const HABIT_KEYS = ["tarot", "chat", "meditation", "emotion"];

// 习惯配置：key -> 集合名称数组（按顺序尝试，查到有数据的集合就用）
const HABIT_COLLECTIONS = {
  // 塔罗：兼容早期集合名
  tarot: ["tarotDraws", "tarotDraw"],
  // 心语聊天：新集合 chatHistory，兼容旧集合 chats
  chat: ["chatHistory", "chats"],
  // 冥想记录
  meditation: ["meditationHistory"],
  // 情绪记录
  emotion: ["emotions"],
};

/**
 * 将 UTC 时间转换为用户本地日期字符串 (YYYY-MM-DD)
 * @param {Date|number} utcTime - UTC 时间（Date 对象或时间戳）
 * @param {number} timezoneOffsetMinutes - 用户时区偏移（分钟），UTC + offset = 本地时间
 *   例如：北京时间 UTC+8 为 480，纽约 UTC-5 为 -300
 * @returns {string} 用户本地日期字符串
 */
function utcToLocalDateStr(utcTime, timezoneOffsetMinutes) {
  const utcMs = utcTime instanceof Date ? utcTime.getTime() : utcTime;
  // 将时区偏移从分钟转换为毫秒
  const offsetMs = timezoneOffsetMinutes * 60 * 1000;
  const localMs = utcMs + offsetMs;
  const localDate = new Date(localMs);

  const y = localDate.getUTCFullYear();
  const m = String(localDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(localDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 将用户本地日期字符串转换为 UTC 时间戳
 * @param {string} dateStr - 用户本地日期 (YYYY-MM-DD)
 * @param {string} time - 时间 ("00:00:00" 或 "23:59:59.999")
 * @param {number} timezoneOffsetMinutes - 用户时区偏移（分钟）
 * @returns {number} UTC 时间戳
 */
function localDateToUtcTs(dateStr, time, timezoneOffsetMinutes) {
  // 解析日期和时间
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes, secondsWithMs] = time.split(":");
  const [seconds, ms] = secondsWithMs.split(".").map(Number);

  // 构建本地时间的 UTC 时间戳（先假设是 UTC 时间）
  const utcDate = Date.UTC(
    year,
    month - 1,
    day,
    parseInt(hours),
    parseInt(minutes),
    seconds || 0,
    ms || 0
  );

  // 减去时区偏移得到真正的 UTC 时间戳
  const offsetMs = timezoneOffsetMinutes * 60 * 1000;
  return utcDate - offsetMs;
}

/**
 * 云函数入口
 * @param {Object} event - { startDate, endDate, timezoneOffsetMinutes }
 *   startDate, endDate: 日期范围 (YYYY-MM-DD，用户本地时间)
 *   timezoneOffsetMinutes: 用户设备时区偏移（分钟），UTC + offset = 本地时间
 */
exports.main = async (event) => {
  const { OPENID: openid } = cloud.getWXContext();
  const { startDate, endDate, timezoneOffsetMinutes } = event || {};

  console.log("========== getHabitCalendarData 云函数开始 ==========");
  console.log("用户 openid:", openid);
  console.log("查询日期范围 (用户本地时间):", startDate, "至", endDate);
  console.log("用户时区偏移 (分钟):", timezoneOffsetMinutes);

  if (!startDate || !endDate) {
    return { success: false, error: "缺少 startDate 或 endDate 参数" };
  }

  // 如果前端没有传入时区偏移，默认使用北京时间 (UTC+8 = 480分钟)，保持向后兼容
  const offsetMinutes =
    typeof timezoneOffsetMinutes === "number" ? timezoneOffsetMinutes : 480;
  console.log("实际使用的时区偏移 (分钟):", offsetMinutes);

  try {
    // 将用户本地日期转换为 UTC 时间戳范围
    const startUtcTs = localDateToUtcTs(startDate, "00:00:00", offsetMinutes);
    const endUtcTs = localDateToUtcTs(endDate, "23:59:59.999", offsetMinutes);

    console.log("UTC 时间戳范围:", startUtcTs, "至", endUtcTs);
    console.log(
      "对应 UTC 时间:",
      new Date(startUtcTs).toISOString(),
      "至",
      new Date(endUtcTs).toISOString()
    );

    // 并行查询各个习惯的记录
    const habitRecords = {};
    const queryPromises = Object.entries(HABIT_COLLECTIONS).map(
      async ([habitKey, collections]) => {
        const records = await queryHabitRecords(
          openid,
          collections,
          startUtcTs,
          endUtcTs,
          offsetMinutes
        );
        habitRecords[habitKey] = records;
      }
    );

    await Promise.all(queryPromises);

    // 打印各习惯的记录数
    console.log("========== 查询结果汇总 ==========");
    Object.entries(habitRecords).forEach(([key, records]) => {
      console.log(`${key}: ${records.length} 条记录`);
    });

    // 按用户本地日期聚合数据
    const dailyData = aggregateByLocalDate(
      habitRecords,
      startDate,
      endDate,
      offsetMinutes
    );

    // 打印每天的完成状态
    console.log("========== 每日完成状态 ==========");
    Object.entries(dailyData).forEach(([dateStr, habits]) => {
      const completed = Object.entries(habits)
        .filter(([_, done]) => done)
        .map(([k]) => k);
      if (completed.length > 0) {
        console.log(`${dateStr}: 完成 [${completed.join(", ")}]`);
      }
    });

    console.log("========== getHabitCalendarData 云函数完成 ==========");

    return {
      success: true,
      data: {
        habitRecords,
        dailyData,
      },
    };
  } catch (err) {
    console.error("获取习惯日历数据失败", err);
    return {
      success: false,
      error: err.message || "unknown error",
    };
  }
};

/**
 * 查询指定习惯的记录
 * 使用云数据库自动生成的 _createTime (UTC) 进行时间范围查询
 * 同时也会尝试使用自定义 createTime 字段作为备选
 * @param {string} openid
 * @param {string[]} collections - 该习惯可能使用的集合名（按顺序尝试）
 * @param {number} startUtcTs
 * @param {number} endUtcTs
 * @param {number} timezoneOffsetMinutes - 用户时区偏移（分钟）
 * @returns {Promise<Array<{_id, _createTime, localDate}>>}
 */
async function queryHabitRecords(
  openid,
  collections,
  startUtcTs,
  endUtcTs,
  timezoneOffsetMinutes
) {
  const allRecords = [];

  for (const collName of collections) {
    try {
      console.log(`[${collName}] 开始查询...`);
      console.log(
        `[${collName}] 查询条件: openid=${openid}, startUtcTs=${startUtcTs}, endUtcTs=${endUtcTs}`
      );

      // 首先，不带时间条件查询总数（用于调试）
      try {
        const totalRes = await db
          .collection(collName)
          .where({ _openid: openid })
          .count();
        console.log(
          `[${collName}] 该用户在此集合中的总记录数: ${totalRes.total}`
        );
      } catch (countErr) {
        console.log(
          `[${collName}] 查询总数失败:`,
          countErr.message || countErr
        );
      }

      // 首先尝试使用 _createTime 系统字段查询
      let res = await db
        .collection(collName)
        .where({
          _openid: openid,
          _createTime: _.gte(new Date(startUtcTs)).and(
            _.lte(new Date(endUtcTs))
          ),
        })
        .orderBy("_createTime", "desc")
        .limit(500)
        .get();

      let count = res.data ? res.data.length : 0;
      console.log(`[${collName}] _createTime 查询结果: ${count} 条记录`);

      // 如果 _createTime 查询无结果，尝试使用自定义 createTime 字段
      if (count === 0) {
        try {
          res = await db
            .collection(collName)
            .where({
              _openid: openid,
              createTime: _.gte(new Date(startUtcTs)).and(
                _.lte(new Date(endUtcTs))
              ),
            })
            .orderBy("createTime", "desc")
            .limit(500)
            .get();
          count = res.data ? res.data.length : 0;
          console.log(`[${collName}] createTime 备选查询结果: ${count} 条记录`);
        } catch (fallbackErr) {
          console.log(
            `[${collName}] createTime 备选查询失败，跳过:`,
            fallbackErr.message || fallbackErr
          );
        }
      }

      // 特别为 chatHistory 添加额外诊断：如果仍然无结果，查看集合中所有记录的结构
      if (count === 0 && collName === "chatHistory") {
        try {
          const sampleRes = await db.collection(collName).limit(5).get();
          console.log(`[${collName}] 诊断：查询集合前5条记录（不限 openid）:`);
          if (sampleRes.data && sampleRes.data.length > 0) {
            sampleRes.data.forEach((item, idx) => {
              console.log(`[${collName}] 样本 ${idx + 1}:`, {
                _id: item._id,
                _openid: item._openid,
                _createTime: item._createTime,
                createTime: item.createTime,
                hasUserContent: !!item.userContent,
                hasAiContent: !!item.aiContent,
              });
            });
          } else {
            console.log(`[${collName}] 诊断：集合为空或不存在`);
          }
        } catch (diagErr) {
          console.log(
            `[${collName}] 诊断查询失败:`,
            diagErr.message || diagErr
          );
        }
      }

      if (count > 0) {
        // 将每条记录的时间转换为用户本地日期
        const records = res.data.map((item, index) => {
          // 优先使用 _createTime，其次使用 createTime
          const utcTime = item._createTime || item.createTime;
          const localDateStr = utcToLocalDateStr(
            utcTime,
            timezoneOffsetMinutes
          );

          if (index < 3) {
            console.log(`[${collName}] 记录 ${index + 1}:`, {
              _id: item._id,
              _createTime_UTC:
                utcTime instanceof Date ? utcTime.toISOString() : utcTime,
              localDate: localDateStr,
              timezoneOffsetMinutes: timezoneOffsetMinutes,
            });
          }

          return {
            _id: item._id,
            _createTime: utcTime,
            localDate: localDateStr,
          };
        });

        // 累积记录而不是直接返回，以支持多集合合并
        allRecords.push(...records);

        // 如果已有数据，可以选择继续查或直接返回
        // 为了兼容旧数据，我们优先返回第一个有数据的集合
        console.log(
          `[${collName}] 查到 ${records.length} 条记录，停止继续查找备选集合`
        );
        break;
      }
    } catch (err) {
      console.warn(
        `[${collName}] 查询失败:`,
        err.errCode || err.message || err
      );
      // 继续尝试下一个备选集合名
      continue;
    }
  }

  // 去重（按 _id）
  const uniqueRecords = [];
  const seenIds = new Set();
  for (const record of allRecords) {
    if (!seenIds.has(record._id)) {
      seenIds.add(record._id);
      uniqueRecords.push(record);
    }
  }

  console.log(
    `[queryHabitRecords] 最终返回 ${uniqueRecords.length} 条唯一记录`
  );
  return uniqueRecords;
}

/**
 * 按用户本地日期聚合数据
 * 输出结构：
 * {
 *   "2025-11-29": { tarot: true, chat: false, meditation: true, emotion: false },
 *   ...
 * }
 * @param {Object} habitRecords - 各习惯的记录
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} endDate - 结束日期 (YYYY-MM-DD)
 * @param {number} timezoneOffsetMinutes - 用户时区偏移（分钟）
 */
function aggregateByLocalDate(
  habitRecords,
  startDate,
  endDate,
  timezoneOffsetMinutes
) {
  const dailyData = {};

  // 初始化日期范围内的所有日期
  // 直接解析日期字符串，不依赖时区
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${day}`;

    // 为每一天初始化所有习惯为 false
    dailyData[dateKey] = {};
    HABIT_KEYS.forEach((habitKey) => {
      dailyData[dateKey][habitKey] = false;
    });
  }

  console.log(
    `[聚合] 时区偏移: ${timezoneOffsetMinutes} 分钟，日期范围: ${startDate} 至 ${endDate}`
  );

  // 填充实际记录（使用转换后的用户本地日期）
  Object.entries(habitRecords).forEach(([habitKey, records]) => {
    if (!HABIT_KEYS.includes(habitKey)) return; // 安全保护

    records.forEach((record) => {
      const dateStr = record.localDate;
      if (dailyData[dateStr]) {
        dailyData[dateStr][habitKey] = true;
        console.log(`[聚合] ${habitKey} 在 ${dateStr} 标记为完成`);
      }
    });
  });

  return dailyData;
}
