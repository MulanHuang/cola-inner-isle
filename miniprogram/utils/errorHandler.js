/**
 * 统一错误处理模块
 * 提供一致的错误处理策略和用户反馈
 */

// 错误类型
const ERROR_TYPES = {
  NETWORK: "NETWORK",
  DATABASE: "DATABASE",
  AUTH: "AUTH",
  VALIDATION: "VALIDATION",
  CLOUD_FUNCTION: "CLOUD_FUNCTION",
  STORAGE: "STORAGE",
  UNKNOWN: "UNKNOWN",
};

// 用户友好的错误消息
const ERROR_MESSAGES = {
  NETWORK: "网络连接失败，请检查网络后重试",
  DATABASE: "数据加载失败，请稍后重试",
  AUTH: "登录已过期，请重新登录",
  VALIDATION: "输入数据有误，请检查后重试",
  CLOUD_FUNCTION: "服务暂时不可用，请稍后重试",
  STORAGE: "存储操作失败，请稍后重试",
  UNKNOWN: "操作失败，请稍后重试",
  
  // 特定错误码
  "-502005": "数据集合不存在，请联系管理员",
  "-1": "网络请求失败，请检查网络",
};

/**
 * 识别错误类型
 * @param {Error|Object} error - 错误对象
 * @returns {string} 错误类型
 */
function getErrorType(error) {
  if (!error) return ERROR_TYPES.UNKNOWN;
  
  const errCode = error.errCode || error.code;
  const errMsg = error.errMsg || error.message || "";
  
  // 数据库错误
  if (errCode === -502005 || errMsg.includes("collection")) {
    return ERROR_TYPES.DATABASE;
  }
  
  // 网络错误
  if (errCode === -1 || errMsg.includes("network") || errMsg.includes("timeout")) {
    return ERROR_TYPES.NETWORK;
  }
  
  // 认证错误
  if (errMsg.includes("auth") || errMsg.includes("login") || errMsg.includes("openid")) {
    return ERROR_TYPES.AUTH;
  }
  
  // 云函数错误
  if (errMsg.includes("cloud") || errMsg.includes("function")) {
    return ERROR_TYPES.CLOUD_FUNCTION;
  }
  
  // 存储错误
  if (errMsg.includes("storage") || errMsg.includes("file")) {
    return ERROR_TYPES.STORAGE;
  }
  
  return ERROR_TYPES.UNKNOWN;
}

/**
 * 获取用户友好的错误消息
 * @param {Error|Object} error - 错误对象
 * @param {string} defaultMsg - 默认消息
 * @returns {string} 用户友好的错误消息
 */
function getUserMessage(error, defaultMsg) {
  if (!error) return defaultMsg || ERROR_MESSAGES.UNKNOWN;
  
  const errCode = String(error.errCode || error.code || "");
  
  // 检查特定错误码
  if (ERROR_MESSAGES[errCode]) {
    return ERROR_MESSAGES[errCode];
  }
  
  // 根据错误类型返回消息
  const errorType = getErrorType(error);
  return ERROR_MESSAGES[errorType] || defaultMsg || ERROR_MESSAGES.UNKNOWN;
}

/**
 * 统一错误处理
 * @param {Error|Object} error - 错误对象
 * @param {Object} options - 配置选项
 * @param {string} options.context - 错误发生的上下文（用于日志）
 * @param {boolean} options.showToast - 是否显示 Toast 提示（默认 true）
 * @param {string} options.defaultMsg - 默认错误消息
 * @param {boolean} options.silent - 静默模式，不显示任何提示
 */
function handleError(error, options = {}) {
  const {
    context = "",
    showToast = true,
    defaultMsg = "",
    silent = false,
  } = options;
  
  // 记录错误日志
  const logPrefix = context ? `[${context}]` : "[Error]";
  console.error(logPrefix, error);
  
  // 静默模式直接返回
  if (silent) return;
  
  // 显示用户提示
  if (showToast) {
    const message = getUserMessage(error, defaultMsg);
    wx.showToast({
      title: message,
      icon: "none",
      duration: 2000,
    });
  }
}

/**
 * 包装异步函数，自动处理错误
 * @param {Function} asyncFn - 异步函数
 * @param {Object} options - 错误处理配置
 * @returns {Function} 包装后的函数
 */
function withErrorHandler(asyncFn, options = {}) {
  return async function (...args) {
    try {
      return await asyncFn.apply(this, args);
    } catch (error) {
      handleError(error, options);
      return null;
    }
  };
}

/**
 * 安全执行异步操作
 * @param {Promise} promise - Promise 对象
 * @param {Object} options - 错误处理配置
 * @returns {Promise<[Error|null, any]>} [错误, 结果] 元组
 */
async function safeAsync(promise, options = {}) {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    handleError(error, { ...options, showToast: false });
    return [error, null];
  }
}

module.exports = {
  ERROR_TYPES,
  ERROR_MESSAGES,
  getErrorType,
  getUserMessage,
  handleError,
  withErrorHandler,
  safeAsync,
};

