// pages/explore/explore.js
const db = wx.cloud.database();

Page({
  data: {
    userProfile: {},
  },

  onLoad() {
    this.loadUserProfile();
  },

  onShow() {
    this.loadUserProfile();
  },

  // 加载用户档案
  async loadUserProfile() {
    try {
      const res = await db
        .collection("users")
        .where({
          _openid: "{openid}",
        })
        .limit(1)
        .get();

      if (res.data && res.data.length > 0) {
        this.setData({
          userProfile: res.data[0],
        });
      }
    } catch (err) {
      console.error("加载用户档案失败", err);
    }
  },

  // 跳转到 OH 卡
  goToOH() {
    wx.navigateTo({
      url: "/pages/oh/oh",
    });
  },

  // 跳转到情绪记录
  goToEmotion() {
    wx.navigateTo({
      url: "/pages/emotion/emotion",
    });
  },

  // 跳转到 MBTI
  goToMBTI() {
    wx.navigateTo({
      url: "/pages/explore/mbti/mbti",
    });
  },

  // 跳转到星座
  goToZodiac() {
    wx.navigateTo({
      url: "/pages/explore/zodiac/zodiac",
    });
  },

  // 跳转到内在小孩
  goToInnerChild() {
    wx.navigateTo({
      url: "/pages/explore/innerchild/innerchild",
    });
  },

  // 跳转到脉轮测试
  goToChakraTest() {
    wx.navigateTo({
      url: "/pages/chakraTest/index",
    });
  },

  // 跳转到人生梦想九宫格
  goToDreamGrid() {
    wx.navigateTo({
      url: "/pages/dreamGrid/dreamGrid",
    });
  },
});
