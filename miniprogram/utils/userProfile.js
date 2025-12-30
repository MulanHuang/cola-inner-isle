/**
 * utils/userProfile.js
 * 统一的用户信息管理模块
 * 用于个人信息的获取、星座计算、AI提示词构建等
 */

// 星座信息映射表
const ZODIAC_MAP = {
  aries: {
    name: "白羊座",
    emoji: "♈",
    range: "3.21-4.19",
    element: "火象",
    trait: "热情、冲动、勇敢",
  },
  taurus: {
    name: "金牛座",
    emoji: "♉",
    range: "4.20-5.20",
    element: "土象",
    trait: "稳重、务实、固执",
  },
  gemini: {
    name: "双子座",
    emoji: "♊",
    range: "5.21-6.21",
    element: "风象",
    trait: "灵活、好奇、善变",
  },
  cancer: {
    name: "巨蟹座",
    emoji: "♋",
    range: "6.22-7.22",
    element: "水象",
    trait: "敏感、顾家、情绪化",
  },
  leo: {
    name: "狮子座",
    emoji: "♌",
    range: "7.23-8.22",
    element: "火象",
    trait: "自信、慷慨、骄傲",
  },
  virgo: {
    name: "处女座",
    emoji: "♍",
    range: "8.23-9.22",
    element: "土象",
    trait: "细致、挑剔、完美主义",
  },
  libra: {
    name: "天秤座",
    emoji: "♎",
    range: "9.23-10.23",
    element: "风象",
    trait: "优雅、公正、犹豫",
  },
  scorpio: {
    name: "天蝎座",
    emoji: "♏",
    range: "10.24-11.22",
    element: "水象",
    trait: "神秘、专注、占有欲强",
  },
  sagittarius: {
    name: "射手座",
    emoji: "♐",
    range: "11.23-12.21",
    element: "火象",
    trait: "乐观、自由、直率",
  },
  capricorn: {
    name: "摩羯座",
    emoji: "♑",
    range: "12.22-1.19",
    element: "土象",
    trait: "务实、有野心、严肃",
  },
  aquarius: {
    name: "水瓶座",
    emoji: "♒",
    range: "1.20-2.18",
    element: "风象",
    trait: "独立、创新、叛逆",
  },
  pisces: {
    name: "双鱼座",
    emoji: "♓",
    range: "2.19-3.20",
    element: "水象",
    trait: "浪漫、敏感、富有同情心",
  },
};

/**
 * 根据生日计算星座
 * @param {string} birthday - 生日字符串 (YYYY/MM/DD 或 YYYY-MM-DD)
 * @returns {object|null} { id, name, emoji, range, element, trait } 或 null
 */
function calculateZodiac(birthday) {
  if (!birthday) return null;

  try {
    const date = new Date(birthday.replace(/\//g, "-"));
    if (isNaN(date.getTime())) return null;

    const month = date.getMonth() + 1;
    const day = date.getDate();

    let zodiacId = "";

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19))
      zodiacId = "aries";
    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20))
      zodiacId = "taurus";
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 21))
      zodiacId = "gemini";
    else if ((month === 6 && day >= 22) || (month === 7 && day <= 22))
      zodiacId = "cancer";
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22))
      zodiacId = "leo";
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22))
      zodiacId = "virgo";
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 23))
      zodiacId = "libra";
    else if ((month === 10 && day >= 24) || (month === 11 && day <= 22))
      zodiacId = "scorpio";
    else if ((month === 11 && day >= 23) || (month === 12 && day <= 21))
      zodiacId = "sagittarius";
    else if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
      zodiacId = "capricorn";
    else if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
      zodiacId = "aquarius";
    else if ((month === 2 && day >= 19) || (month === 3 && day <= 20))
      zodiacId = "pisces";

    if (!zodiacId) return null;

    return { id: zodiacId, ...ZODIAC_MAP[zodiacId] };
  } catch (e) {
    console.error("[userProfile] 计算星座失败", e);
    return null;
  }
}

/**
 * 获取完整用户画像（本地缓存）
 * @returns {object} 用户画像对象
 */
function getUserProfile() {
  try {
    const profile = wx.getStorageSync("userProfile") || {};
    const userInfo = wx.getStorageSync("userInfo") || {};

    // 计算星座
    let zodiac = null;
    if (profile.birthDate) {
      zodiac = calculateZodiac(profile.birthDate);
    }

    return {
      name: userInfo.name || profile.name || "",
      avatarUrl: userInfo.avatarUrl || "",
      gender: profile.gender || "",
      birthday: profile.birthDate || "",
      birthTime: profile.birthTime || "",
      zodiac: zodiac,
      birthPlace: profile.birthPlace || [],
      livePlace: profile.livePlace || [],
      hasProfile: !!(profile.gender && profile.birthDate),
    };
  } catch (e) {
    console.error("[userProfile] 获取用户画像失败", e);
    return { hasProfile: false };
  }
}

/**
 * 从云端获取用户完整信息
 * @returns {Promise<object>} 用户完整信息对象
 */
async function getUserProfileFromCloud() {
  try {
    if (!wx.cloud) {
      console.warn("[userProfile] 云开发未初始化");
      return null;
    }

    const db = wx.cloud.database();
    const res = await db
      .collection("users")
      .where({ _openid: "{openid}" })
      .limit(1)
      .get();

    if (res.data && res.data.length > 0) {
      const cloudData = res.data[0];
      console.log("[userProfile] ✅ 从云端获取用户信息成功");

      // 计算星座
      let zodiac = null;
      if (cloudData.birthday) {
        zodiac = calculateZodiac(cloudData.birthday);
      }

      return {
        _id: cloudData._id,
        name: cloudData.name || "",
        avatarUrl: cloudData.avatarUrl || "",
        gender: cloudData.gender || "",
        birthday: cloudData.birthday || "",
        birthTime: cloudData.birthTime || "",
        zodiac: zodiac,
        birthPlace: cloudData.birthPlace || [],
        livePlace: cloudData.livePlace || [],
        bloodType: cloudData.bloodType || "",
        mbti: cloudData.mbti || "",
        // 登录信息
        lastLoginTime: cloudData.lastLoginTime || null,
        loginCount: cloudData.loginCount || 0,
        firstLoginTime: cloudData.firstLoginTime || null,
        lastLoginDevice: cloudData.lastLoginDevice || {},
        // 时间戳
        createTime: cloudData.createTime || null,
        updateTime: cloudData.updateTime || null,
        hasProfile: !!(cloudData.gender && cloudData.birthday),
      };
    }

    console.log("[userProfile] 云端暂无用户信息");
    return null;
  } catch (e) {
    console.error("[userProfile] 从云端获取用户信息失败", e);
    return null;
  }
}

/**
 * 同步本地用户信息到云端
 * @param {object} profileData - 要同步的用户信息
 * @returns {Promise<boolean>} 是否同步成功
 */
async function syncUserProfileToCloud(profileData) {
  try {
    if (!wx.cloud) {
      console.warn("[userProfile] 云开发未初始化");
      return false;
    }

    const db = wx.cloud.database();
    const res = await db
      .collection("users")
      .where({ _openid: "{openid}" })
      .limit(1)
      .get();

    const cloudData = {
      ...profileData,
      updateTime: db.serverDate(),
    };

    // 移除不应该覆盖的字段
    delete cloudData._id;
    delete cloudData._openid;
    delete cloudData.hasProfile;

    if (res.data && res.data.length > 0) {
      await db
        .collection("users")
        .doc(res.data[0]._id)
        .update({ data: cloudData });
      console.log("[userProfile] ✅ 用户信息已同步到云端（更新）");
    } else {
      await db.collection("users").add({
        data: {
          ...cloudData,
          createTime: db.serverDate(),
        },
      });
      console.log("[userProfile] ✅ 用户信息已同步到云端（新增）");
    }

    return true;
  } catch (e) {
    console.error("[userProfile] 同步用户信息到云端失败", e);
    return false;
  }
}

/**
 * 构建个人信息上下文（用于 AI 提示词）
 * @param {object} options - 配置选项 { type: 'tarot'|'ohCard'|'chat'|'ohChat' }
 * @returns {string} 格式化的个人信息上下文
 */
function buildProfileContext(options = {}) {
  const profile = getUserProfile();

  if (!profile.hasProfile) return "";

  let context = "\n【用户背景信息（请适当融入分析，但不要刻意强调）】\n";

  if (profile.name) context += `- 称呼：${profile.name}\n`;
  if (profile.gender) {
    context += `- 性别：${profile.gender === "male" ? "男" : "女"}\n`;
  }
  if (profile.zodiac) {
    context += `- 星座：${profile.zodiac.name}（${profile.zodiac.element}，${profile.zodiac.trait}）\n`;
  }
  if (profile.birthday) {
    context += `- 生日：${profile.birthday}\n`;
  }
  if (profile.birthPlace && profile.birthPlace.length > 0) {
    context += `- 出生地：${profile.birthPlace.join(" ")}\n`;
  }

  // 根据功能类型添加使用指引
  const typeGuides = {
    tarot:
      "\n请结合用户的星座特质和个人背景，提供更具个性化、更贴近用户内心的塔罗解读。",
    ohCard:
      "\n请结合用户的个人背景和性格特质，提供更有针对性、更能引发共鸣的 OH 卡分析。",
    chat: "\n在对话中可自然地结合用户背景提供个性化陪伴，但不要刻意提及或过度解读个人信息。",
    ohChat:
      "\n在 OH 卡对话引导中，可结合用户的星座特质和背景，提供更有深度的探索方向。",
  };

  context += typeGuides[options.type] || "";

  return context;
}

// 导出模块
module.exports = {
  ZODIAC_MAP,
  calculateZodiac,
  getUserProfile,
  getUserProfileFromCloud,
  syncUserProfileToCloud,
  buildProfileContext,
};
