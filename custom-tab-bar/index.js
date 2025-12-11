// Apple iOS 风格自定义底部导航栏

Component({
  data: {
    show: true,
    selected: 0,
    list: [
      {
        pagePath: "/pages/home/home",
        label: "首页",
        iconPath: "/assets/tabbar/home-outline.svg",
        selectedIconPath: "/assets/tabbar/home-filled.svg",
      },
      {
        pagePath: "/pages/chat/chat",
        label: "心语",
        iconPath: "/assets/tabbar/companion-outline.svg",
        selectedIconPath: "/assets/tabbar/companion-filled.svg",
      },
      {
        pagePath: "/pages/meditation/meditation",
        label: "冥想",
        iconPath: "/assets/tabbar/meditation-outline.svg",
        selectedIconPath: "/assets/tabbar/meditation-filled.svg",
      },
      {
        pagePath: "/pages/profile/profile",
        label: "我的",
        iconPath: "/assets/tabbar/profile-outline.svg",
        selectedIconPath: "/assets/tabbar/profile-filled.svg",
      },
    ],
  },

  options: {
    addGlobalClass: true,
  },

  methods: {
    onSwitchTab(e) {
      const { path, index } = e.currentTarget.dataset;

      // 避免重复跳转
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentUrl = "/" + pages[pages.length - 1].route;
        if (currentUrl === path) return;
      }

      // 更新选中状态
      this.setData({ selected: index });

      // 执行跳转
      wx.switchTab({ url: path });

      // 轻触震动反馈（仅在成功切换时触发）
      wx.vibrateShort({ type: "light" });
    },
  },
});
