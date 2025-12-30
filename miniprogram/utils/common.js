/**
 * 公共工具函数模块
 * 提取各页面重复使用的通用功能
 */

/**
 * 设置导航栏高度
 * 获取系统信息并计算状态栏和导航栏高度
 * @param {Object} pageInstance - 页面实例 (this)
 */
function setNavBarHeight(pageInstance) {
  try {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44;
    pageInstance.setData({
      statusBarHeight,
      navBarHeight,
    });
  } catch (err) {
    console.error("[common] 获取系统信息失败:", err.message);
    // 使用默认值
    pageInstance.setData({
      statusBarHeight: 20,
      navBarHeight: 64,
    });
  }
}

/**
 * 触觉反馈 - 轻微
 */
function vibrateLight() {
  wx.vibrateShort({ type: "light" });
}

/**
 * 触觉反馈 - 中等
 */
function vibrateMedium() {
  wx.vibrateShort({ type: "medium" });
}

/**
 * 触觉反馈 - 重度
 */
function vibrateHeavy() {
  wx.vibrateShort({ type: "heavy" });
}

/**
 * 格式化秒数为 mm:ss 格式
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(seconds) {
  if (!seconds || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 格式化秒数为 HH:mm:ss 格式（用于长时间显示）
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
function formatTimeWithHours(seconds) {
  if (!seconds || seconds < 0) return "00:00:00";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date|number} date - Date 对象或时间戳
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期为 YYYY/MM/DD HH:mm 格式
 * @param {Date|number} date - Date 对象或时间戳
 * @returns {string} 格式化后的日期时间字符串
 */
function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * 设置 TabBar 选中状态
 * @param {number} index - TabBar 索引 (0: 首页, 1: 我的)
 */
function setTabBarSelected(index) {
  if (typeof this.getTabBar === "function" && this.getTabBar()) {
    this.getTabBar().setData({ selected: index });
  }
}

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {number} interval - 间隔时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(fn, interval = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 显示加载提示
 * @param {string} title - 提示文字
 */
function showLoading(title = "加载中...") {
  wx.showLoading({ title, mask: true });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示成功提示
 * @param {string} title - 提示文字
 */
function showSuccess(title) {
  wx.showToast({ title, icon: "success" });
}

/**
 * 显示错误提示
 * @param {string} title - 提示文字
 */
function showError(title) {
  wx.showToast({ title, icon: "none" });
}

module.exports = {
  setNavBarHeight,
  vibrateLight,
  vibrateMedium,
  vibrateHeavy,
  formatTime,
  formatTimeWithHours,
  formatDate,
  formatDateTime,
  setTabBarSelected,
  debounce,
  throttle,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
};

