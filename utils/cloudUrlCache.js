/**
 * 云存储临时 URL 智能缓存工具
 * 解决体验版/正式版中 cloud:// 路径图片不显示的问题
 * 通过本地缓存减少重复请求，提升用户体验
 */

const CACHE_KEY = "cloudTempUrlCache";
const CACHE_DURATION = 1.5 * 60 * 60 * 1000; // 1.5小时（留30分钟安全余量）

/**
 * 获取缓存数据
 * @returns {Object} 缓存对象 { fileID: { tempUrl, time } }
 */
function getCache() {
  try {
    return wx.getStorageSync(CACHE_KEY) || {};
  } catch (err) {
    console.warn("[cloudUrlCache] 读取缓存失败:", err.message);
    return {};
  }
}

/**
 * 保存缓存数据
 * @param {Object} cache - 缓存对象
 */
function saveCache(cache) {
  try {
    wx.setStorageSync(CACHE_KEY, cache);
  } catch (err) {
    console.warn("[cloudUrlCache] 保存缓存失败:", err.message);
  }
}

/**
 * 清理过期缓存（可选，定期调用）
 */
function cleanExpiredCache() {
  const cache = getCache();
  const now = Date.now();
  let cleaned = 0;

  Object.keys(cache).forEach((key) => {
    if (now - cache[key].time > CACHE_DURATION) {
      delete cache[key];
      cleaned++;
    }
  });

  if (cleaned > 0) {
    saveCache(cache);
    console.log("[cloudUrlCache] 🧹 清理过期缓存:", cleaned, "条");
  }
}

/**
 * 批量获取临时 URL（带智能缓存）
 * @param {string[]} cloudUrls - cloud:// 路径数组
 * @returns {Promise<Object>} fileID -> tempFileURL 映射
 */
async function getTempUrlsWithCache(cloudUrls) {
  if (!cloudUrls || cloudUrls.length === 0) return {};

  const now = Date.now();
  const cache = getCache();
  const urlMap = {};
  const needFetch = [];

  // 1. 检查缓存，区分有效缓存和需要获取的
  cloudUrls.forEach((url) => {
    if (!url || !url.startsWith("cloud://")) return;

    const cached = cache[url];
    if (cached && now - cached.time < CACHE_DURATION) {
      // 缓存有效，直接使用
      urlMap[url] = cached.tempUrl;
    } else {
      // 需要重新获取
      needFetch.push(url);
    }
  });

  const cachedCount = Object.keys(urlMap).length;
  if (cachedCount > 0) {
    console.log("[cloudUrlCache] ✅ 命中缓存:", cachedCount, "个");
  }

  // 2. 批量获取未缓存的
  if (needFetch.length > 0) {
    console.log("[cloudUrlCache] 🔄 获取新URL:", needFetch.length, "个");

    try {
      const res = await wx.cloud.getTempFileURL({ fileList: needFetch });

      res.fileList.forEach((item) => {
        if (item.status === 0 && item.tempFileURL) {
          urlMap[item.fileID] = item.tempFileURL;
          // 更新缓存
          cache[item.fileID] = {
            tempUrl: item.tempFileURL,
            time: now,
          };
        } else {
          console.warn(
            "[cloudUrlCache] ⚠️ 获取失败:",
            item.fileID,
            item.status
          );
        }
      });

      // 保存更新后的缓存
      saveCache(cache);
    } catch (err) {
      console.warn("[cloudUrlCache] ❌ 批量获取失败:", err.message);
    }
  }

  return urlMap;
}

/**
 * 获取单个临时 URL（带缓存）
 * @param {string} cloudUrl - cloud:// 路径
 * @returns {Promise<string>} 临时 URL 或原路径（失败时）
 */
async function getTempUrlWithCache(cloudUrl) {
  if (!cloudUrl || !cloudUrl.startsWith("cloud://")) return cloudUrl;

  const urlMap = await getTempUrlsWithCache([cloudUrl]);
  return urlMap[cloudUrl] || cloudUrl;
}

/**
 * 清除指定 URL 的缓存（用于强制刷新）
 * @param {string|string[]} cloudUrls - 要清除的 cloud:// 路径（单个或数组）
 */
function invalidateCache(cloudUrls) {
  const cache = getCache();
  const urls = Array.isArray(cloudUrls) ? cloudUrls : [cloudUrls];
  let cleared = 0;

  urls.forEach((url) => {
    if (cache[url]) {
      delete cache[url];
      cleared++;
    }
  });

  if (cleared > 0) {
    saveCache(cache);
    console.log("[cloudUrlCache] 🗑️ 已清除缓存:", cleared, "条");
  }

  return cleared;
}

/**
 * 清除所有缓存
 */
function clearAllCache() {
  try {
    wx.removeStorageSync(CACHE_KEY);
    console.log("[cloudUrlCache] 🗑️ 已清除全部缓存");
  } catch (err) {
    console.warn("[cloudUrlCache] 清除缓存失败:", err.message);
  }
}

module.exports = {
  getTempUrlsWithCache,
  getTempUrlWithCache,
  cleanExpiredCache,
  invalidateCache,
  clearAllCache,
  CACHE_DURATION,
};
