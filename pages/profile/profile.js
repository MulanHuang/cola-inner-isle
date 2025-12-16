// pages/profile/profile.js
const db = wx.cloud.database();
const _ = db.command;
const { getUserProfile } = require("../../utils/userProfile");
const { setNavBarHeight } = require("../../utils/common");

Page({
  data: {
    userInfo: {},
    userCollection: "users",
    // 兜底候选，兼容早期或误配的集合名
    userCollectionCandidates: ["users", "userProfiles", "userProfile", "user"],
    stats: {
      emotionCount: 0,
      chatCount: 0,
      meditationCount: 0,
      tarotCount: 0,
    },
    dailyAffirmation: "今天你很棒了。",
    // 根据能量的肯定语映射
    affirmationsByEnergy: {
      high: [
        "你今天能量满满，继续发光吧 ✨",
        "感受到你的活力，真棒！🌟",
        "保持这份热情，你很闪耀 💫",
      ],
      medium: [
        "今天平稳地前进着，很棒 🌿",
        "保持节奏，你做得很好 🌸",
        "一步一步，稳稳地走 🍀",
      ],
      low: [
        "累了就休息，你值得被温柔对待 🌙",
        "慢慢来，没关系的 🫂",
        "给自己一点时间，你已经很努力了 💝",
      ],
      default: [
        "今天你很棒了。",
        "你的存在本身就是一种力量 💖",
        "允许自己慢下来，感受此刻 🌿",
        "每一天都是重新开始的机会 ✨",
        "你比想象中更勇敢、更坚强 🌟",
      ],
    },
    // 周签到相关数据
    weekDays: [], // 本周一到周日的签到状态
    weekCheckinCount: 0, // 本周签到天数
    todayChecked: false, // 今天是否已签到
    checkinLoading: false, // 签到加载状态
    totalCheckinDays: 0, // 累计签到天数
    statusBarHeight: 0,
    navBarHeight: 0,
    tarotCollection: "tarotDraws",
    userZodiac: null, // 用户星座信息
    showPrivacyPopup: false, // 隐私协议弹窗显示状态
  },

  onLoad() {
    this.initNavBarHeight();
    this.loadUserFromCache();
    this.loadUserInfo();
    this.loadStats();
    this.loadWeekCheckinData();
    this.loadTotalCheckinDays();
    this.loadUserZodiac();
    this.loadDailyAffirmation();
  },

  // 页面显示时：高亮“我的”tab + 刷新信息与统计
  onShow() {
    console.log("[profile] onShow triggered");
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      console.log("[profile] Setting tabBar selected to 3, show to true");
      this.getTabBar().setData({ selected: 3, show: true });
    }
    this.loadUserInfo();
    this.loadStats();
    this.loadWeekCheckinData();
    this.loadTotalCheckinDays();
    this.loadUserZodiac();
    this.loadDailyAffirmation();
  },

  // 优先用本地缓存填充昵称，避免刷新时闪动
  loadUserFromCache() {
    try {
      const cached = wx.getStorageSync("userProfile");
      if (cached && typeof cached === "object") {
        this.setData({ userInfo: cached });
      }
    } catch (err) {
      console.warn("读取缓存用户信息失败", err);
    }
  },

  // 设置导航栏高度
  initNavBarHeight() {
    setNavBarHeight(this);
  },

  // 加载用户星座信息
  loadUserZodiac() {
    const profile = getUserProfile();
    if (profile.zodiac) {
      this.setData({ userZodiac: profile.zodiac });
    } else {
      this.setData({ userZodiac: null });
    }
  },

  // 根据用户最近情绪记录的能量状态，动态生成肯定语
  async loadDailyAffirmation() {
    try {
      const res = await db
        .collection("emotions")
        .where({ _openid: "{openid}" })
        .orderBy("createTime", "desc")
        .limit(1)
        .get();

      let affirmation = "";
      if (res.data && res.data.length > 0) {
        const record = res.data[0];
        const energyLevel = record.energyLevel || 0;

        let candidates;
        if (energyLevel >= 4) {
          candidates = this.data.affirmationsByEnergy.high;
        } else if (energyLevel >= 2) {
          candidates = this.data.affirmationsByEnergy.medium;
        } else {
          candidates = this.data.affirmationsByEnergy.low;
        }
        affirmation = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        const defaults = this.data.affirmationsByEnergy.default;
        affirmation = defaults[Math.floor(Math.random() * defaults.length)];
      }
      this.setData({ dailyAffirmation: affirmation });
    } catch (err) {
      console.warn("[profile] 加载肯定语失败", err);
      const defaults = this.data.affirmationsByEnergy.default;
      const affirmation = defaults[Math.floor(Math.random() * defaults.length)];
      this.setData({ dailyAffirmation: affirmation });
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const { res } = await this.getUserDocWithFallback();

      if (res.data && res.data.length > 0) {
        this.updateLocalUserInfo(res.data[0]);
      }
    } catch (err) {
      if (err && err.errCode === -502005) {
        console.warn("用户信息集合不存在，请在云开发控制台创建 users 集合");
      }
      console.error("加载用户信息失败", err);
    }
  },

  // 查找可用的用户集合并返回查询结果
  async getUserDocWithFallback() {
    const tried = [];
    const candidates = [
      this.data.userCollection,
      ...this.data.userCollectionCandidates.filter(
        (c) => c !== this.data.userCollection
      ),
    ];

    for (const collectionName of candidates) {
      tried.push(collectionName);
      try {
        const res = await db
          .collection(collectionName)
          .where({ _openid: "{openid}" })
          .limit(1)
          .get();
        if (this.data.userCollection !== collectionName) {
          this.setData({ userCollection: collectionName });
        }
        return { collectionName, res };
      } catch (err) {
        if (err && err.errCode === -502005) {
          // 继续尝试下一个集合名
          continue;
        }
        throw err;
      }
    }

    const error = new Error("用户集合不存在");
    error.errCode = -502005;
    error.triedCollections = tried;
    throw error;
  },

  showMissingUserCollectionTip(tried) {
    const list = (tried || []).join("、") || this.data.userCollection;
    wx.showModal({
      title: "请先创建用户集合",
      content: `当前环境未找到用户集合（尝试：${list}）。请在云开发控制台新建集合「users」，并设置“仅创建者可读写”。然后重新尝试保存昵称。`,
      showCancel: false,
      confirmText: "我知道了",
    });
  },

  // 更新本地状态及缓存
  updateLocalUserInfo(userInfo) {
    const merged = { ...this.data.userInfo, ...userInfo };
    this.setData({ userInfo: merged });
    try {
      wx.setStorageSync("userProfile", merged);
    } catch (err) {
      console.warn("缓存用户信息失败", err);
    }
  },

  // 加载统计数据（各集合独立查询，互不影响）
  async loadStats() {
    const stats = {
      emotionCount: 0,
      chatCount: 0,
      meditationCount: 0,
      tarotCount: 0,
    };

    // 情绪记录数
    try {
      const emotionRes = await db
        .collection("emotions")
        .where({ _openid: "{openid}" })
        .count();
      stats.emotionCount = emotionRes.total || 0;
    } catch (err) {
      console.warn("[profile] 情绪统计加载失败", err.errCode);
    }

    // 对话次数（用户消息数）
    try {
      const chatRes = await db
        .collection("chats")
        .where({
          _openid: "{openid}",
          role: "user",
        })
        .count();
      stats.chatCount = chatRes.total || 0;
    } catch (err) {
      console.warn("[profile] 对话统计加载失败", err.errCode);
    }

    // 冥想次数
    try {
      const meditationRes = await db
        .collection("meditationHistory")
        .where({ _openid: "{openid}" })
        .count();
      stats.meditationCount = meditationRes.total || 0;
    } catch (err) {
      console.warn("[profile] 冥想统计加载失败", err.errCode);
    }

    // 塔罗记录数，兼容 tarotDraws / tarotDraw
    try {
      const tarotRes = await db
        .collection(this.data.tarotCollection)
        .where({ _openid: "{openid}" })
        .count();
      stats.tarotCount = tarotRes.total || 0;
    } catch (err) {
      if (
        err &&
        err.errCode === -502005 &&
        this.data.tarotCollection !== "tarotDraw"
      ) {
        // 尝试备用集合名
        try {
          this.setData({ tarotCollection: "tarotDraw" });
          const tarotRes = await db
            .collection("tarotDraw")
            .where({ _openid: "{openid}" })
            .count();
          stats.tarotCount = tarotRes.total || 0;
        } catch (e) {
          console.warn("[profile] 塔罗统计加载失败", e.errCode);
        }
      } else {
        console.warn("[profile] 塔罗统计加载失败", err.errCode);
      }
    }

    this.setData({
      stats,
      // 以总冥想次数兜底展示连续天数，后续可接入真实 streak 数据
      streakDays: stats.meditationCount || 0,
    });
  },

  // ==================== 周签到功能 ====================

  /**
   * 获取本周一到周日的日期数组
   * @returns {Array} weekDays - 包含 label, date, checked, isToday, isPast 的数组
   */
  getThisWeekDays() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0-6, 周日为0
    // 计算本周一的偏移量
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const weekDays = [];
    const labels = ["一", "二", "三", "四", "五", "六", "日"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = this.formatDate(date);
      const todayStr = this.formatDate(today);

      weekDays.push({
        label: labels[i],
        date: dateStr, // YYYY-MM-DD
        checked: false,
        isToday: dateStr === todayStr,
        isPast: date < today && dateStr !== todayStr,
      });
    }
    return weekDays;
  },

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  /**
   * 获取本周一的日期字符串
   */
  getWeekStart(date) {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    d.setDate(d.getDate() + mondayOffset);
    return this.formatDate(d);
  },

  /**
   * 加载本周签到数据
   */
  async loadWeekCheckinData() {
    try {
      // 1. 获取本周日期
      const weekDays = this.getThisWeekDays();
      const weekStart = weekDays[0].date;
      const weekEnd = weekDays[6].date;
      const todayStr = this.formatDate(new Date());

      // 2. 查询本周的签到记录
      const checkins = await db
        .collection("checkins")
        .where({
          _openid: "{openid}",
          date: _.gte(weekStart).and(_.lte(weekEnd)),
        })
        .get();

      // 3. 标记哪些天已签到
      const checkedDates = new Set(checkins.data.map((c) => c.date));

      weekDays.forEach((day) => {
        day.checked = checkedDates.has(day.date);
      });

      // 4. 计算本周签到天数
      const weekCheckinCount = checkedDates.size;
      const todayChecked = checkedDates.has(todayStr);

      this.setData({
        weekDays,
        weekCheckinCount,
        todayChecked,
      });
    } catch (err) {
      // 集合不存在时，初始化空数据
      if (err && err.errCode === -502005) {
        console.warn("[profile] checkins 集合不存在，请在云开发控制台创建");
      } else {
        console.error("[profile] 加载签到数据失败", err);
      }

      // 仍然初始化本周日期（未签到状态）
      const weekDays = this.getThisWeekDays();
      this.setData({
        weekDays,
        weekCheckinCount: 0,
        todayChecked: false,
      });
    }
  },

  /**
   * 加载累计签到天数
   */
  async loadTotalCheckinDays() {
    try {
      const countRes = await db
        .collection("checkins")
        .where({ _openid: "{openid}" })
        .count();

      this.setData({
        totalCheckinDays: countRes.total || 0,
      });
    } catch (err) {
      console.warn("[profile] 获取累计签到天数失败", err);
      this.setData({ totalCheckinDays: 0 });
    }
  },

  /**
   * 签到操作
   */
  async handleCheckinTap() {
    // 防止重复点击
    if (this.data.checkinLoading || this.data.todayChecked) {
      if (this.data.todayChecked) {
        wx.showToast({ title: "今天已签到啦", icon: "none" });
      }
      return;
    }

    this.setData({ checkinLoading: true });

    try {
      const today = this.formatDate(new Date());
      const weekStart = this.getWeekStart(new Date());

      // 检查今天是否已签到（双重检查）
      const existRes = await db
        .collection("checkins")
        .where({ _openid: "{openid}", date: today })
        .count();

      if (existRes.total > 0) {
        wx.showToast({ title: "今天已签到啦", icon: "none" });
        this.setData({ todayChecked: true, checkinLoading: false });
        return;
      }

      // 写入签到记录
      await db.collection("checkins").add({
        data: {
          date: today,
          weekStart: weekStart,
          createTime: db.serverDate(),
        },
      });

      // 更新本地状态
      const weekDays = [...this.data.weekDays];
      const todayIndex = weekDays.findIndex((d) => d.isToday);
      if (todayIndex !== -1) {
        weekDays[todayIndex].checked = true;
      }

      this.setData({
        weekDays,
        weekCheckinCount: this.data.weekCheckinCount + 1,
        todayChecked: true,
        checkinLoading: false,
        totalCheckinDays: this.data.totalCheckinDays + 1, // 累计签到天数+1
      });

      wx.showToast({ title: "签到成功！", icon: "success" });
    } catch (err) {
      console.error("[profile] 签到失败", err);

      // 集合不存在的特殊提示
      if (err && err.errCode === -502005) {
        wx.showModal({
          title: "请创建签到集合",
          content:
            '签到功能需要在云开发控制台创建 "checkins" 集合，并设置权限为"仅创建者可读写"。',
          showCancel: false,
          confirmText: "我知道了",
        });
      } else {
        wx.showToast({ title: "签到失败，请重试", icon: "none" });
      }

      this.setData({ checkinLoading: false });
    }
  },

  // ==================== 头像昵称填写能力（新API） ====================

  /**
   * 显示头像选择操作表
   * 提供"使用微信头像"和"从相册选择"两个选项
   */
  /**
   * 显示头像选择操作表
   * 提供"从相册选择"和"拍照"两个选项
   */
  showAvatarActionSheet() {
    const that = this;
    // 先检查隐私协议授权
    that.requirePrivacyAuthorize(() => {
      wx.showActionSheet({
        itemList: ["从相册选择", "拍照"],
        success(res) {
          if (res.tapIndex === 0) {
            that.chooseAvatarFromSource("album");
          } else if (res.tapIndex === 1) {
            that.chooseAvatarFromSource("camera");
          }
        },
        fail(err) {
          if (err.errMsg && err.errMsg.includes("cancel")) return;
          console.warn("[profile] 操作表显示失败", err);
        },
      });
    });
  },

  /**
   * 检查并请求隐私协议授权
   * @param {Function} callback - 授权成功后的回调
   */
  requirePrivacyAuthorize(callback) {
    // 保存回调函数，供同意后调用
    this._privacyCallback = callback;

    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({
        success: () => {
          console.log("[profile] 隐私协议已授权");
          callback && callback();
        },
        fail: (err) => {
          console.warn("[profile] 隐私协议授权失败", err);
          // 授权失败时，弹窗会由 app.js 的 onNeedPrivacyAuthorization 触发
        },
      });
    } else {
      // 旧版本不支持隐私协议，直接执行
      callback && callback();
    }
  },

  /**
   * 打开隐私协议页面
   */
  openPrivacyContract() {
    wx.openPrivacyContract({
      success: () => {
        console.log("[profile] 打开隐私协议成功");
      },
      fail: (err) => {
        console.error("[profile] 打开隐私协议失败", err);
        wx.showToast({
          title: "打开隐私协议失败",
          icon: "none",
        });
      },
    });
  },

  /**
   * 用户同意隐私协议
   */
  handleAgreePrivacy() {
    console.log("[profile] 用户同意隐私协议");
    this.setData({ showPrivacyPopup: false });

    // 调用 app.js 中保存的 resolve 函数
    const app = getApp();
    if (app.globalData.resolvePrivacyAuthorization) {
      app.globalData.resolvePrivacyAuthorization({
        buttonId: "agree-btn",
        event: "agree",
      });
      app.globalData.resolvePrivacyAuthorization = null;
    }

    // 执行之前保存的回调
    if (this._privacyCallback) {
      this._privacyCallback();
      this._privacyCallback = null;
    }
  },

  /**
   * 用户拒绝隐私协议
   */
  handleDisagreePrivacy() {
    console.log("[profile] 用户拒绝隐私协议");
    this.setData({ showPrivacyPopup: false });

    // 调用 app.js 中保存的 resolve 函数
    const app = getApp();
    if (app.globalData.resolvePrivacyAuthorization) {
      app.globalData.resolvePrivacyAuthorization({
        event: "disagree",
      });
      app.globalData.resolvePrivacyAuthorization = null;
    }

    wx.showToast({
      title: "需要同意隐私协议才能使用此功能",
      icon: "none",
    });
  },

  /**
   * 阻止弹窗背景滚动
   */
  preventTouchMove() {
    return false;
  },

  /**
   * 从指定来源选择头像
   * @param {string} source - 来源：'album' 或 'camera'
   */
  chooseAvatarFromSource(source) {
    const that = this;
    wx.chooseImage({
      count: 1,
      sourceType: [source],
      sizeType: ["compressed"],
      success(res) {
        console.log("[profile] chooseImage 成功", res);
        const filePath = res.tempFilePaths && res.tempFilePaths[0];
        if (!filePath) {
          console.warn("[profile] 未获取到图片路径");
          return;
        }

        // 先更新本地显示
        that.updateLocalUserInfo({
          ...that.data.userInfo,
          avatarUrl: filePath,
        });

        // 上传到云存储并保存到数据库
        that.uploadAndSaveAvatar(filePath);
      },
      fail(err) {
        console.error("[profile] chooseImage 失败", err);
        if (err.errMsg && err.errMsg.includes("cancel")) return;
        // 如果是隐私协议问题，给出更明确的提示
        if (err.errno === 112) {
          wx.showModal({
            title: "权限未配置",
            content:
              "相册权限尚未在小程序后台声明，请联系开发者在「用户隐私保护指引」中添加「选中的照片或视频」权限。",
            showCancel: false,
            confirmText: "我知道了",
          });
          return;
        }
        // errno 104 表示用户拒绝了隐私协议
        if (err.errno === 104) {
          wx.showToast({
            title: "需要同意隐私协议",
            icon: "none",
          });
          return;
        }
        wx.showToast({
          title: source === "album" ? "选择图片失败" : "拍照失败",
          icon: "none",
        });
      },
    });
  },

  /**
   * 选择头像回调（微信新API：open-type="chooseAvatar"）
   * 用户从相册、拍照或微信头像中选择后触发（备用方法）
   */
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    if (!avatarUrl) return;

    // 先更新本地显示（提升体验）
    this.updateLocalUserInfo({
      ...this.data.userInfo,
      avatarUrl,
    });

    // 上传到云存储并保存到数据库
    await this.uploadAndSaveAvatar(avatarUrl);
  },

  /**
   * 上传头像到云存储并保存到数据库
   */
  async uploadAndSaveAvatar(tempFilePath) {
    wx.showLoading({ title: "保存中...", mask: true });

    try {
      let avatarUrl = tempFilePath;

      // 尝试上传到云存储
      try {
        const cloudPath = `avatars/${Date.now()}-${Math.floor(
          Math.random() * 1e6
        )}.png`;
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath,
          filePath: tempFilePath,
        });
        avatarUrl = uploadRes.fileID || tempFilePath;
      } catch (err) {
        console.warn("[profile] 云上传失败，使用临时路径", err);
      }

      // 保存到数据库
      const { res: userRes, collectionName } =
        await this.getUserDocWithFallback();

      if (userRes.data && userRes.data.length > 0) {
        await db
          .collection(collectionName)
          .doc(userRes.data[0]._id)
          .update({
            data: {
              avatarUrl,
              updateTime: db.serverDate(),
            },
          });
      } else {
        await db.collection(collectionName).add({
          data: {
            name: this.data.userInfo.name || "",
            avatarUrl,
            createTime: db.serverDate(),
            updateTime: db.serverDate(),
          },
        });
      }

      // 更新本地（确保使用云存储URL）
      this.updateLocalUserInfo({
        ...this.data.userInfo,
        avatarUrl,
      });

      wx.showToast({ title: "头像已更新", icon: "success" });
    } catch (err) {
      console.error("[profile] 保存头像失败", err);
      wx.showToast({ title: "保存失败，请重试", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 昵称输入框失焦时保存（微信新API：type="nickname"）
   */
  onNicknameBlur(e) {
    const name = (e.detail.value || "").trim();
    const currentName = (this.data.userInfo.name || "").trim();

    // 只有昵称有变化且不为空时才保存
    if (name && name !== currentName) {
      this.saveNickname(name);
    }
  },

  /**
   * 昵称输入时实时更新本地显示（可选）
   */
  onNicknameInput(e) {
    const name = e.detail.value || "";
    // 仅更新本地显示，不保存到数据库
    this.setData({
      "userInfo.name": name,
    });
  },

  // 编辑个人资料
  editProfile() {
    wx.showModal({
      title: "编辑资料",
      content: "请输入你的昵称",
      editable: true,
      placeholderText: this.data.userInfo.name || "输入昵称",
      success: async (res) => {
        if (res.confirm) {
          this.saveNickname(res.content);
        }
      },
    });
  },

  // 保存/更新昵称
  async saveNickname(rawName) {
    const nickname = (rawName || "").trim();
    if (!nickname) {
      wx.showToast({
        title: "昵称不能为空",
        icon: "none",
      });
      return;
    }

    wx.showLoading({ title: "保存中..." });
    try {
      const { res: userRes, collectionName } =
        await this.getUserDocWithFallback();

      if (userRes.data && userRes.data.length > 0) {
        await db
          .collection(collectionName)
          .doc(userRes.data[0]._id)
          .update({
            data: {
              name: nickname,
              updateTime: db.serverDate(),
            },
          });
        this.updateLocalUserInfo({ ...userRes.data[0], name: nickname });
      } else {
        const addRes = await db.collection(collectionName).add({
          data: {
            name: nickname,
            createTime: db.serverDate(),
            updateTime: db.serverDate(),
          },
        });
        this.updateLocalUserInfo({
          _id: addRes._id,
          name: nickname,
        });
      }

      wx.showToast({
        title: "保存成功",
        icon: "success",
      });
    } catch (err) {
      if (err && err.errCode === -502005) {
        // 集合不存在时尝试自动创建并写入
        const created = await this.createUserDocIfMissing(
          nickname,
          err.triedCollections
        );
        if (!created) {
          this.showMissingUserCollectionTip(err.triedCollections);
        }
        return;
      }
      console.error("保存昵称失败", err);
      wx.showToast({
        title: "保存失败，请稍后再试",
        icon: "none",
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 若集合不存在，尝试按候选名创建并写入一条记录
  async createUserDocIfMissing(nickname, tried = []) {
    const candidates = [
      this.data.userCollection,
      ...this.data.userCollectionCandidates.filter(
        (c) => c !== this.data.userCollection
      ),
    ];

    for (const collectionName of candidates) {
      // 已尝试过的跳过
      if (tried.includes(collectionName)) continue;
      try {
        const addRes = await db.collection(collectionName).add({
          data: {
            name: nickname,
            createTime: db.serverDate(),
            updateTime: db.serverDate(),
          },
        });
        this.setData({ userCollection: collectionName });
        this.updateLocalUserInfo({
          _id: addRes._id,
          name: nickname,
        });
        wx.showToast({ title: "保存成功", icon: "success" });
        return true;
      } catch (err) {
        // 继续尝试下一个候选
        if (!(err && err.errCode === -502005)) {
          console.error("自动创建用户集合失败", err);
          break;
        }
      }
    }
    return false;
  },

  // 跳转到冥想记录
  goToMeditationHistory() {
    wx.navigateTo({
      url: "/pages/meditation/history/history",
      fail: (err) => {
        console.error("打开冥想记录失败", err);
        wx.showToast({
          title: "打开失败，请重编译后重试",
          icon: "none",
        });
      },
    });
  },

  // 跳转到塔罗历史
  goToTarotHistory() {
    wx.navigateTo({
      url: "/pages/tarot/history/history",
      fail: (err) => {
        console.error("打开塔罗历史失败", err);
        wx.showToast({
          title: "打开失败，请重编译后重试",
          icon: "none",
        });
      },
    });
  },

  // 跳转到自我探索
  goToExplore() {
    wx.navigateTo({
      url: "/pages/explore/explore",
    });
  },

  // 跳转到情绪记录
  goToEmotion() {
    wx.navigateTo({
      url: "/pages/emotion/emotion",
    });
  },

  // 跳转到情绪历史
  goToEmotionHistory() {
    wx.navigateTo({
      url: "/pages/emotion/history/history",
      fail: (err) => {
        console.error("打开情绪历史失败", err);
        wx.showToast({
          title: "打开失败",
          icon: "none",
        });
      },
    });
  },

  // 跳转到个人档案
  goToProfileInfo() {
    wx.navigateTo({
      url: "/pages/profile/profile-info/profile-info",
    });
  },

  // 显示关于
  showAbout() {
    wx.showModal({
      title: "关于 可乐心岛",
      content:
        "可乐心岛（Cola Inner Isle）是你的心灵陪伴者，帮助你探索内心、疗愈情绪、找到内在的平静与力量。\n\n版本：1.0.0\n\n注意：本应用不提供医疗诊断，如有严重心理问题请寻求专业帮助。",
      showCancel: false,
      confirmText: "知道了",
    });
  },
  // 示例：在某个页面里添加一个按钮触发这个函数
  checkModelInfo() {
    wx.showLoading({ title: "检查模型中...", mask: true });
  },
});
