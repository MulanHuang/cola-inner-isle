/**
 * 应用常量配置文件
 * 集中管理集合名称、配置项、魔法数字等
 */

// ============================================
// 云数据库集合名称
// ============================================
const COLLECTIONS = {
  // 用户相关
  USERS: "users",
  USER_PROFILE: "userProfile",
  CHECKINS: "checkins",
  
  // 情绪记录
  EMOTIONS: "emotions",
  
  // 聊天相关
  CHATS: "chats",
  CHAT_HISTORY: "chatHistory",
  
  // 冥想相关
  MEDITATIONS: "meditations",
  MEDITATION_HISTORY: "meditationHistory",
  
  // 塔罗牌
  TAROT_CARDS: "tarotCards",
  TAROT_DRAWS: "tarotDraws",
  TAROT_DRAW: "tarotDraw", // 旧版集合名
  
  // OH卡
  OH_IMAGE_CARDS: "ohImageCards",
  OH_WORD_CARDS: "ohWordCards",
  
  // 其他
  QUOTES: "quotes",
};

// ============================================
// 缓存键名
// ============================================
const STORAGE_KEYS = {
  USER_INFO: "userInfo",
  USER_PROFILE: "userProfile",
  CLOUD_URL_CACHE: "cloudTempUrlCache",
  MEDITATION_LAST_PLAYED: "meditationLastPlayed",
  TAROT_DRAW_COUNT: "tarotDrawCount",
  EMOTION_DRAFT: "emotionDraft",
};

// ============================================
// 时间相关常量（毫秒）
// ============================================
const TIME = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_INTERVAL: 300,
  TOAST_DURATION: 2000,
  LOADING_DELAY: 500,
  ANIMATION_DURATION: 300,
  CLOUD_URL_CACHE_DURATION: 1.5 * 60 * 60 * 1000, // 1.5小时
};

// ============================================
// 分页相关
// ============================================
const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  HISTORY_PAGE_SIZE: 6,
  CHAT_HISTORY_SIZE: 50,
  MAX_LOAD_MORE: 100,
};

// ============================================
// 限制相关
// ============================================
const LIMITS = {
  MAX_CHAT_MESSAGE_LENGTH: 2000,
  MAX_EMOTION_TEXT_LENGTH: 1000,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_RETRY_COUNT: 3,
};

// ============================================
// AI 相关配置
// ============================================
const AI_CONFIG = {
  MODEL: "gpt-5-mini",
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
  STREAM_ENABLED: true,
};

// ============================================
// 导航栏配置
// ============================================
const NAV_BAR = {
  DEFAULT_HEIGHT: 44,
  DEFAULT_STATUS_BAR_HEIGHT: 20,
};

// ============================================
// TabBar 索引
// ============================================
const TAB_BAR_INDEX = {
  HOME: 0,
  PROFILE: 1,
};

// ============================================
// 页面路径
// ============================================
const PAGES = {
  HOME: "/pages/home/home",
  PROFILE: "/pages/profile/profile",
  CHAT: "/pages/chat/chat",
  MEDITATION: "/pages/meditation/meditation",
  MEDITATION_PLAYER: "/pages/meditation/player/player",
  TAROT: "/pages/tarot/tarot",
  OH: "/pages/oh/oh",
  EMOTION: "/pages/emotion/emotion",
  EXPLORE: "/pages/explore/explore",
};

// ============================================
// 云函数名称
// ============================================
const CLOUD_FUNCTIONS = {
  AI_CHAT: "aiChat",
  AI_STREAM: "aiStream",
  GET_OPENID: "getOpenid",
};

module.exports = {
  COLLECTIONS,
  STORAGE_KEYS,
  TIME,
  PAGINATION,
  LIMITS,
  AI_CONFIG,
  NAV_BAR,
  TAB_BAR_INDEX,
  PAGES,
  CLOUD_FUNCTIONS,
};

