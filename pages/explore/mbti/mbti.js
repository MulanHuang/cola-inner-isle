// pages/explore/mbti/mbti.js
const db = wx.cloud.database();

Page({
  data: {
    navBarHeight: 0,
    currentMBTI: "",
    selectedMBTI: "",
    mbtiTypes: [
      { type: "INTJ", name: "建筑师" },
      { type: "INTP", name: "逻辑学家" },
      { type: "ENTJ", name: "指挥官" },
      { type: "ENTP", name: "辩论家" },
      { type: "INFJ", name: "提倡者" },
      { type: "INFP", name: "调停者" },
      { type: "ENFJ", name: "主人公" },
      { type: "ENFP", name: "竞选者" },
      { type: "ISTJ", name: "物流师" },
      { type: "ISFJ", name: "守卫者" },
      { type: "ESTJ", name: "总经理" },
      { type: "ESFJ", name: "执政官" },
      { type: "ISTP", name: "鉴赏家" },
      { type: "ISFP", name: "探险家" },
      { type: "ESTP", name: "企业家" },
      { type: "ESFP", name: "表演者" },
    ],
    mbtiInfo: {
      INTJ: { name: "建筑师", desc: "富有想象力和战略性的思想家" },
      INTP: { name: "逻辑学家", desc: "具有创新精神的发明家" },
      ENTJ: { name: "指挥官", desc: "大胆、富有想象力的领导者" },
      ENTP: { name: "辩论家", desc: "聪明好奇的思想家" },
      INFJ: { name: "提倡者", desc: "安静而神秘的理想主义者" },
      INFP: { name: "调停者", desc: "诗意、善良的利他主义者" },
      ENFJ: { name: "主人公", desc: "富有魅力的领导者" },
      ENFP: { name: "竞选者", desc: "热情、有创造力的社交家" },
      ISTJ: { name: "物流师", desc: "实际而注重事实的个人" },
      ISFJ: { name: "守卫者", desc: "非常专注而温暖的守护者" },
      ESTJ: { name: "总经理", desc: "出色的管理者" },
      ESFJ: { name: "执政官", desc: "极有同情心的主人" },
      ISTP: { name: "鉴赏家", desc: "大胆而实际的实验者" },
      ISFP: { name: "探险家", desc: "灵活有魅力的艺术家" },
      ESTP: { name: "企业家", desc: "聪明、精力充沛的冒险家" },
      ESFP: { name: "表演者", desc: "自发的、精力充沛的表演者" },
    },
  },

  onLoad() {
    this.loadCurrentMBTI();
  },

  // 导航栏准备完成
  onNavReady(e) {
    this.setData({
      navBarHeight: e.detail.navBarHeight || 0,
    });
  },

  // 加载当前MBTI
  async loadCurrentMBTI() {
    try {
      const res = await db
        .collection("users")
        .where({
          _openid: "{openid}",
        })
        .limit(1)
        .get();

      if (res.data && res.data.length > 0 && res.data[0].mbti) {
        this.setData({
          currentMBTI: res.data[0].mbti,
          selectedMBTI: res.data[0].mbti,
        });
      }
    } catch (err) {
      console.error("加载MBTI失败", err);
    }
  },

  // 选择MBTI
  selectMBTI(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      selectedMBTI: type,
    });
  },

  // 保存MBTI
  async saveMBTI() {
    if (!this.data.selectedMBTI) {
      wx.showToast({
        title: "请选择类型",
        icon: "none",
      });
      return;
    }

    wx.showLoading({ title: "保存中..." });

    try {
      // 查询用户是否存在
      const res = await db
        .collection("users")
        .where({
          _openid: "{openid}",
        })
        .limit(1)
        .get();

      if (res.data && res.data.length > 0) {
        // 更新
        await db
          .collection("users")
          .doc(res.data[0]._id)
          .update({
            data: {
              mbti: this.data.selectedMBTI,
            },
          });
      } else {
        // 新增
        await db.collection("users").add({
          data: {
            mbti: this.data.selectedMBTI,
            createTime: db.serverDate(),
          },
        });
      }

      this.setData({
        currentMBTI: this.data.selectedMBTI,
      });

      wx.hideLoading();
      wx.showToast({
        title: "保存成功",
        icon: "success",
      });
    } catch (err) {
      console.error("保存MBTI失败", err);
      wx.hideLoading();
      wx.showToast({
        title: "保存失败",
        icon: "none",
      });
    }
  },

  // 开始测试
  startTest() {
    wx.navigateTo({
      url: "/pages/mbti-test/mbti-test",
    });
  },

  // 查看测试历史
  viewHistory() {
    wx.navigateTo({
      url: "/pages/mbti-history/mbti-history",
    });
  },
});
