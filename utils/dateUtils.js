/**
 * 本地时间工具函数
 * 使用用户手机真实时区，不固定北京时间
 */

/**
 * 获取"此刻"的本地时间 Date 对象（使用用户手机真实时区）
 * @returns {Date}
 */
function getLocalNow() {
  return new Date();
}

/**
 * 把任意时间戳转换为"本地日期字符串" YYYY-MM-DD
 * @param {number|Date} ts - 时间戳或 Date 对象
 * @returns {string}
 */
function formatLocalDate(ts) {
  const d = ts instanceof Date ? ts : new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 格式化为中文日期显示 "YYYY年MM月DD日"
 * @param {Date} date
 * @returns {string}
 */
function formatLocalDateCN(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}年${m}月${d}日`;
}

/**
 * 获取星期几的中文名
 * @param {Date} date
 * @returns {string}
 */
function getWeekdayCN(date) {
  const weekdays = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  return weekdays[date.getDay()];
}

/**
 * 获取某一天所在周（周一到周日）在本地时间下的日期范围
 * @param {Date} date - 本地 Date 对象
 * @returns {{monday: Date, sunday: Date}}
 */
function getLocalWeekRange(date) {
  const day = date.getDay() === 0 ? 7 : date.getDay(); // 周日=0 转为7
  const monday = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - (day - 1)
  );
  const sunday = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 6
  );
  return { monday, sunday };
}

/**
 * 获取某个月在本地时间下的第一天/最后一天
 * @param {Date} date
 * @returns {{first: Date, last: Date}}
 */
function getLocalMonthRange(date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return { first, last };
}

/**
 * 获取当前是一年中的第几周（ISO 8601标准）
 * @param {Date} date
 * @returns {number}
 */
function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * 获取日期数组（从 startDate 到 endDate）
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Date[]}
 */
function getDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * 判断两个日期是否是同一天
 * @param {Date} d1
 * @param {Date} d2
 * @returns {boolean}
 */
function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * 获取用户设备当前时区偏移（分钟）
 * 注意：JavaScript 的 getTimezoneOffset() 返回的是 UTC - 本地时间
 * 例如：北京时间 UTC+8，getTimezoneOffset() 返回 -480
 * 为了便于后端计算（UTC + offset = 本地时间），我们取负值
 * 即返回值为正数表示东时区，负数表示西时区
 * 例如：北京时间返回 480，纽约时间返回 -300 或 -240（夏令时）
 * @returns {number} 时区偏移分钟数（UTC + 返回值 = 本地时间）
 */
function getTimezoneOffsetMinutes() {
  // getTimezoneOffset() 返回 UTC - 本地时间（分钟）
  // 我们需要的是 本地时间 - UTC，所以取负值
  return -new Date().getTimezoneOffset();
}

module.exports = {
  getLocalNow,
  formatLocalDate,
  formatLocalDateCN,
  getWeekdayCN,
  getLocalWeekRange,
  getLocalMonthRange,
  getWeekNumber,
  getDateRange,
  isSameDay,
  getTimezoneOffsetMinutes,
};

