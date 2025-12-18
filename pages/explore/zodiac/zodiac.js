// pages/explore/zodiac/zodiac.js
const db = wx.cloud.database();

Page({
  data: {
    navBarHeight: 0, // 导航栏高度
    birthday: "",
    currentZodiac: "",
    showProfileTip: false, // 是否显示档案完善提示
    zodiacList: [
      { id: "aries", name: "白羊座", icon: "♈", date: "3.21-4.19" },
      { id: "taurus", name: "金牛座", icon: "♉", date: "4.20-5.20" },
      { id: "gemini", name: "双子座", icon: "♊", date: "5.21-6.21" },
      { id: "cancer", name: "巨蟹座", icon: "♋", date: "6.22-7.22" },
      { id: "leo", name: "狮子座", icon: "♌", date: "7.23-8.22" },
      { id: "virgo", name: "处女座", icon: "♍", date: "8.23-9.22" },
      { id: "libra", name: "天秤座", icon: "♎", date: "9.23-10.23" },
      { id: "scorpio", name: "天蝎座", icon: "♏", date: "10.24-11.22" },
      { id: "sagittarius", name: "射手座", icon: "♐", date: "11.23-12.21" },
      { id: "capricorn", name: "摩羯座", icon: "♑", date: "12.22-1.19" },
      { id: "aquarius", name: "水瓶座", icon: "♒", date: "1.20-2.18" },
      { id: "pisces", name: "双鱼座", icon: "♓", date: "2.19-3.20" },
    ],
    zodiacInfo: {
      aries: {
        name: "白羊座",
        icon: "♈",
        date: "3.21-4.19",
        desc: "热情、积极、勇敢的开拓者",
      },
      taurus: {
        name: "金牛座",
        icon: "♉",
        date: "4.20-5.20",
        desc: "稳重、务实、可靠的守护者",
      },
      gemini: {
        name: "双子座",
        icon: "♊",
        date: "5.21-6.21",
        desc: "机智、灵活、善于沟通",
      },
      cancer: {
        name: "巨蟹座",
        icon: "♋",
        date: "6.22-7.22",
        desc: "温柔、体贴、富有同情心",
      },
      leo: {
        name: "狮子座",
        icon: "♌",
        date: "7.23-8.22",
        desc: "自信、慷慨、充满领导力",
      },
      virgo: {
        name: "处女座",
        icon: "♍",
        date: "8.23-9.22",
        desc: "细致、完美、追求卓越",
      },
      libra: {
        name: "天秤座",
        icon: "♎",
        date: "9.23-10.23",
        desc: "优雅、公正、追求和谐",
      },
      scorpio: {
        name: "天蝎座",
        icon: "♏",
        date: "10.24-11.22",
        desc: "深刻、神秘、意志坚定",
      },
      sagittarius: {
        name: "射手座",
        icon: "♐",
        date: "11.23-12.21",
        desc: "乐观、自由、热爱冒险",
      },
      capricorn: {
        name: "摩羯座",
        icon: "♑",
        date: "12.22-1.19",
        desc: "踏实、负责、目标明确",
      },
      aquarius: {
        name: "水瓶座",
        icon: "♒",
        date: "1.20-2.18",
        desc: "独立、创新、富有远见",
      },
      pisces: {
        name: "双鱼座",
        icon: "♓",
        date: "2.19-3.20",
        desc: "浪漫、敏感、富有想象力",
      },
    },
  },

  onLoad() {
    const hasProfileBirthday = this.applyBirthdayFromProfile();
    if (!hasProfileBirthday) {
      this.loadBirthdayFromCloud();
    }
    this.checkProfileTip();
  },

  // 导航栏准备完成
  onNavReady(e) {
    this.setData({
      navBarHeight: e.detail.navBarHeight || 0,
    });
  },

  // 检查是否需要显示档案完善提示
  checkProfileTip() {
    const profile = wx.getStorageSync("userProfile");
    // 如果没有出生日期，显示提示
    if (!profile || !profile.birthDate) {
      this.setData({ showProfileTip: true });
    }
  },

  // 跳转到个人档案页面
  goToProfileInfo() {
    wx.navigateTo({
      url: "/pages/profile/profile-info/profile-info",
    });
  },

  // 关闭档案提示
  closeProfileTip() {
    this.setData({ showProfileTip: false });
  },

  applyBirthdayFromProfile() {
    const profile = wx.getStorageSync("userProfile");
    if (profile && profile.birthDate) {
      const birthday = this.normalizeBirthday(profile.birthDate);
      const zodiac = this.calculateZodiac(profile.birthDate);
      this.setData({
        birthday,
        currentZodiac: zodiac,
      });
      return true;
    }

    return false;
  },

  normalizeBirthday(birthday) {
    return birthday ? birthday.replace(/\//g, "-") : "";
  },

  // 加载生日（云端）
  async loadBirthdayFromCloud() {
    try {
      const res = await db
        .collection("users")
        .where({
          _openid: "{openid}",
        })
        .limit(1)
        .get();

      if (res.data && res.data.length > 0 && res.data[0].birthday) {
        const birthday = this.normalizeBirthday(res.data[0].birthday);
        const zodiac = this.calculateZodiac(res.data[0].birthday);

        this.setData({
          birthday,
          currentZodiac: zodiac,
        });
      }
    } catch (err) {
      console.error("加载生日失败", err);
    }
  },

  // 生日改变
  onBirthdayChange(e) {
    const birthday = e.detail.value;
    const zodiac = this.calculateZodiac(birthday);

    this.setData({
      birthday,
      currentZodiac: zodiac,
    });
  },

  // 计算星座
  calculateZodiac(birthday) {
    const date = new Date(birthday);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19))
      return "aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20))
      return "taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 21))
      return "gemini";
    if ((month === 6 && day >= 22) || (month === 7 && day <= 22))
      return "cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22))
      return "virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 23))
      return "libra";
    if ((month === 10 && day >= 24) || (month === 11 && day <= 22))
      return "scorpio";
    if ((month === 11 && day >= 23) || (month === 12 && day <= 21))
      return "sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
      return "capricorn";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
      return "aquarius";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20))
      return "pisces";

    return "";
  },

  onZodiacTap(e) {
    const zodiacId = e.currentTarget.dataset.id;
    if (!zodiacId || !this.data.zodiacInfo[zodiacId]) {
      return;
    }

    const info = this.data.zodiacInfo[zodiacId];
    wx.showModal({
      title: info.name,
      content: `${info.date}\n${info.desc}`,
      showCancel: false,
    });
  },

  // 保存生日
  async saveBirthday() {
    if (!this.data.birthday) {
      wx.showToast({
        title: "请选择生日",
        icon: "none",
      });
      return;
    }

    wx.showLoading({ title: "保存中..." });

    try {
      const res = await db
        .collection("users")
        .where({
          _openid: "{openid}",
        })
        .limit(1)
        .get();

      if (res.data && res.data.length > 0) {
        await db
          .collection("users")
          .doc(res.data[0]._id)
          .update({
            data: {
              birthday: this.data.birthday,
              zodiac: this.data.currentZodiac,
            },
          });
      } else {
        await db.collection("users").add({
          data: {
            birthday: this.data.birthday,
            zodiac: this.data.currentZodiac,
            createTime: db.serverDate(),
          },
        });
      }

      wx.hideLoading();
      wx.showToast({
        title: "保存成功",
        icon: "success",
      });
    } catch (err) {
      console.error("保存生日失败", err);
      wx.hideLoading();
      wx.showToast({
        title: "保存失败",
        icon: "none",
      });
    }
  },
});
