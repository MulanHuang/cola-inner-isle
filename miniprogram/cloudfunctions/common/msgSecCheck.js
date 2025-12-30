// cloudfunctions/common/msgSecCheck.js
// ============================================================
// 微信内容安全审核模块
// 封装 msgSecCheck API，用于检查 AI 输出是否合规
// ============================================================

const cloud = require("wx-server-sdk");

// 安全的兜底回复（当内容审核不通过时使用）
const SAFE_FALLBACK_MESSAGES = {
  default:
    "感谢你的分享，我感受到了你此刻的情绪。有时候，给自己一点安静的时间，慢慢消化这些感受，也是一种温柔的自我照顾。💛",
  chat: "我理解你现在的感受，这些情绪都是真实的，也是被允许的。如果你愿意，可以继续和我分享，我会一直在这里陪伴你。",
  emotion:
    "我感受到你现在的情绪，这种感受是真实的，也是被允许的。给自己一点温柔的时间，你已经很努力了 💝",
  tarot:
    "这张牌在此刻出现，更像是一个温柔的提醒。它邀请你回到当下，留意自己最近的感受和选择。慢慢来，你有足够的时间去理解这些讯息。",
  ohCard:
    "看到这张卡出现在你面前，我感受到此刻的你可能正在经历一些内心的波动。这很正常，每一种情绪都值得被看见。💛",
  mbti: "你的性格独特而珍贵。每个人都有自己的节奏和方式，允许自己做真实的自己，就是最好的成长。",
  chakra:
    "你的能量正在流动，每个部分都在为你工作。给自己一些时间和空间，温柔地照顾好自己。",
};

/**
 * 调用微信内容安全审核 API
 * @param {string} content - 需要审核的文本内容
 * @param {string} openid - 用户的 openid（可选，用于追踪）
 * @param {number} scene - 场景值：1=资料，2=评论，3=论坛，4=社交日志（默认2）
 * @returns {Promise<{safe: boolean, result: object}>}
 */
async function checkContentSafety(content, openid = "", scene = 2) {
  // 如果内容为空，直接返回安全
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return { safe: true, result: null };
  }

  try {
    console.log("[msgSecCheck] 开始内容安全审核，内容长度:", content.length);

    // 调用微信内容安全 API
    const result = await cloud.openapi.security.msgSecCheck({
      openid: openid || "",
      scene: scene,
      version: 2,
      content: content.slice(0, 2500), // API 限制最大 2500 字符
    });

    console.log("[msgSecCheck] 审核结果:", JSON.stringify(result));

    // result.result.suggest: "pass" / "review" / "risky"
    // result.result.label: 100=正常，10001=广告，20001=时政，20002=色情，等
    const isSafe = result?.result?.suggest === "pass";

    return {
      safe: isSafe,
      result: result,
      label: result?.result?.label,
      suggest: result?.result?.suggest,
    };
  } catch (err) {
    console.error("[msgSecCheck] 审核调用失败:", err.message);
    // 审核服务异常时，为了用户体验，默认放行但记录日志
    // 如果需要更严格的策略，可以改为返回 safe: false
    return {
      safe: true,
      result: null,
      error: err.message,
    };
  }
}

/**
 * 审核 AI 输出内容，如果不通过则返回安全的兜底回复
 * @param {string} aiContent - AI 生成的内容
 * @param {string} type - 内容类型：chat/emotion/tarot/ohCard/mbti/chakra/default
 * @param {string} openid - 用户 openid（可选）
 * @returns {Promise<{content: string, passed: boolean, original: string}>}
 */
async function safeAIResponse(aiContent, type = "default", openid = "") {
  const checkResult = await checkContentSafety(aiContent, openid, 2);

  if (checkResult.safe) {
    return {
      content: aiContent,
      passed: true,
      original: aiContent,
    };
  }

  // 内容不安全，使用兜底回复
  console.warn("[msgSecCheck] AI 输出未通过审核，使用兜底回复");
  console.warn("[msgSecCheck] 原因:", checkResult.suggest, checkResult.label);

  const fallbackMessage =
    SAFE_FALLBACK_MESSAGES[type] || SAFE_FALLBACK_MESSAGES.default;

  return {
    content: fallbackMessage,
    passed: false,
    original: aiContent,
    reason: checkResult.suggest,
    label: checkResult.label,
  };
}

/**
 * 获取指定类型的安全兜底消息
 * @param {string} type - 消息类型
 * @returns {string}
 */
function getFallbackMessage(type = "default") {
  return SAFE_FALLBACK_MESSAGES[type] || SAFE_FALLBACK_MESSAGES.default;
}

module.exports = {
  checkContentSafety,
  safeAIResponse,
  getFallbackMessage,
  SAFE_FALLBACK_MESSAGES,
};
