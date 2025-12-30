/**
 * updateUserLogin 云函数
 * 记录用户登录信息，包括登录时间、登录次数、设备信息等
 */
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { deviceInfo = {} } = event;

  console.log("[updateUserLogin] 开始记录用户登录信息, openid:", OPENID);

  try {
    // 查询用户是否已存在
    const userRes = await db
      .collection("users")
      .where({ _openid: OPENID })
      .limit(1)
      .get();

    const now = db.serverDate();
    const loginDevice = {
      brand: deviceInfo.brand || "",
      model: deviceInfo.model || "",
      system: deviceInfo.system || "",
      platform: deviceInfo.platform || "",
    };

    if (userRes.data && userRes.data.length > 0) {
      // 用户已存在，更新登录信息
      const existingUser = userRes.data[0];
      const currentLoginCount = existingUser.loginCount || 0;

      await db
        .collection("users")
        .doc(existingUser._id)
        .update({
          data: {
            lastLoginTime: now,
            loginCount: _.inc(1),
            lastLoginDevice: loginDevice,
            updateTime: now,
          },
        });

      console.log("[updateUserLogin] ✅ 用户登录信息已更新，登录次数:", currentLoginCount + 1);

      return {
        success: true,
        isNewUser: false,
        loginCount: currentLoginCount + 1,
        message: "登录信息已更新",
      };
    } else {
      // 新用户，创建记录
      const newUserData = {
        lastLoginTime: now,
        firstLoginTime: now,
        loginCount: 1,
        lastLoginDevice: loginDevice,
        createTime: now,
        updateTime: now,
      };

      const addRes = await db.collection("users").add({ data: newUserData });

      console.log("[updateUserLogin] ✅ 新用户记录已创建，_id:", addRes._id);

      return {
        success: true,
        isNewUser: true,
        loginCount: 1,
        userId: addRes._id,
        message: "新用户记录已创建",
      };
    }
  } catch (err) {
    console.error("[updateUserLogin] ❌ 记录登录信息失败:", err);
    return {
      success: false,
      error: err.message,
      errCode: err.errCode,
    };
  }
};

