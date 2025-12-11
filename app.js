// app.js
// 统一维护云环境配置，避免环境切换导致的连错库
const ENV_MAP = {
  release: "cloud1-5gc5jltwbcbef586",
  trial: "cloud1-5gc5jltwbcbef586",
  develop: "cloud1-5gc5jltwbcbef586",
};

function getCloudEnvId() {
  try {
    const info = wx.getAccountInfoSync?.();
    const envVersion = info?.miniProgram?.envVersion || "develop";
    const envId = ENV_MAP[envVersion] || ENV_MAP.develop;
    if (!envId) throw new Error("ENV_MAP 未配置该环境");
    return envId;
  } catch (err) {
    console.error("[App] 读取环境版本失败，使用默认 develop 环境", err);
    return ENV_MAP.develop;
  }
}

App({
  onLaunch() {
    console.log("[App] ========== 小程序启动 ==========");

    // 初始化云开发环境
    if (!wx.cloud) {
      console.error("[App] 请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      const cloudEnvId = getCloudEnvId();
      try {
        wx.cloud.init({
          env: cloudEnvId, // 使用具体的环境 ID，真机兼容性更好
          traceUser: true,
        });
        console.log("[App] 云开发初始化成功，环境 ID:", cloudEnvId);
        this.globalData.cloudEnvId = cloudEnvId;

        // 🚀 预加载关键图片（卡背），提升首屏体验
        this.preloadCriticalImages();

        // 📊 记录用户登录信息到云数据库
        this.recordUserLogin();
      } catch (err) {
        console.error("[App] 云开发初始化失败", err);
        wx.showToast({
          title: "云环境初始化失败",
          icon: "none",
        });
      }
    }

    // 启动时从本地读取用户信息
    this.getUserProfile();
  },

  /**
   * 🚀 预加载关键图片
   * 在 App 启动时预加载塔罗牌和 OH 卡的背面图片，
   * 确保用户进入相关页面时能立即看到卡背，无需等待加载
   */
  preloadCriticalImages() {
    const criticalImages = [
      // 塔罗牌背面（.webp 格式，tarot 页面使用）
      "cloud://cloud1-5gc5jltwbcbef586.636c-cloud1-5gc5jltwbcbef586-1386967363/tarotCardsImages/tarotCardsBack/Back 1.webp",
      // OH 卡背面
      "cloud://cloud1-5gc5jltwbcbef586.636c-cloud1-5gc5jltwbcbef586-1386967363/ohCards-back.webp",
    ];

    console.log("[App] 🚀 开始预加载关键图片...");

    criticalImages.forEach((url) => {
      wx.getImageInfo({
        src: url,
        success: () => {
          console.log("[App] ✅ 预加载成功:", url.split("/").pop());
        },
        fail: (err) => {
          console.warn(
            "[App] ⚠️ 预加载失败:",
            url.split("/").pop(),
            err.errMsg
          );
        },
      });
    });
  },

  // 获取用户信息
  getUserProfile() {
    const userInfo = wx.getStorageSync("userInfo");
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      console.log("[App] 已加载本地用户信息");
    }
  },

  // 保存用户信息
  saveUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync("userInfo", userInfo);
    console.log("[App] 用户信息已保存");
  },

  /**
   * 📊 记录用户登录信息到云数据库
   * 获取设备信息并调用云函数记录登录
   */
  recordUserLogin() {
    try {
      // 获取设备信息
      const systemInfo = wx.getSystemInfoSync();
      const deviceInfo = {
        brand: systemInfo.brand || "",
        model: systemInfo.model || "",
        system: systemInfo.system || "",
        platform: systemInfo.platform || "",
      };

      // 调用云函数记录登录信息（异步执行，不阻塞启动流程）
      wx.cloud
        .callFunction({
          name: "updateUserLogin",
          data: { deviceInfo },
        })
        .then((res) => {
          if (res.result && res.result.success) {
            console.log(
              "[App] ✅ 登录信息已记录",
              res.result.isNewUser
                ? "（新用户）"
                : `（第${res.result.loginCount}次登录）`
            );
            // 保存登录状态到全局
            this.globalData.loginInfo = {
              loginCount: res.result.loginCount,
              isNewUser: res.result.isNewUser,
            };
          } else {
            console.warn("[App] ⚠️ 记录登录信息返回失败:", res.result);
          }
        })
        .catch((err) => {
          console.warn("[App] ⚠️ 记录登录信息失败:", err);
          // 登录记录失败不影响正常使用
        });
    } catch (err) {
      console.warn("[App] ⚠️ 获取设备信息失败:", err);
    }
  },

  globalData: {
    userInfo: null,
    cloudEnvId: "", // 云开发环境 ID
    loginInfo: null, // 登录信息
  },
});
