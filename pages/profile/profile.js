// pages/profile/profile.js
const db = wx.cloud.database();

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
    statusBarHeight: 0,
    navBarHeight: 0,
    tarotCollection: "tarotDraws",
  },

  onLoad() {
    this.setNavBarHeight();
    this.loadUserFromCache();
    this.loadUserInfo();
    this.loadStats();
  },

  // 页面显示时：高亮“我的”tab + 刷新信息与统计
  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.loadUserInfo();
    this.loadStats();
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
  setNavBarHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44; // 44px 是导航栏内容高度
    this.setData({
      statusBarHeight,
      navBarHeight,
    });
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

    this.setData({ stats });
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

  // 跳转到情绪历史
  goToEmotionHistory() {
    wx.navigateTo({
      url: "/pages/emotion/history/history",
    });
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

  // 显示关于
  showAbout() {
    wx.showModal({
      title: "关于 可乐心岛",
      content:
        "可乐心岛（Cole Inner Isle）是你的心灵陪伴者，帮助你探索内心、疗愈情绪、找到内在的平静与力量。\n\n版本：1.0.0\n\n注意：本应用不提供医疗诊断，如有严重心理问题请寻求专业帮助。",
      showCancel: false,
      confirmText: "知道了",
    });
  },
  // 示例：在某个页面里添加一个按钮触发这个函数
  checkModelInfo() {
    wx.showLoading({ title: "检查模型中...", mask: true });
  },
});
