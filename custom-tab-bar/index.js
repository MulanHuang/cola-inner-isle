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
        label: "练习",
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

      console.log(
        "[tabBar] onSwitchTab triggered, path:",
        path,
        "index:",
        index
      );

      // 获取当前页面栈
      const pages = getCurrentPages();
      const currentUrl =
        pages.length > 0 ? "/" + pages[pages.length - 1].route : "";

      console.log(
        "[tabBar] currentUrl:",
        currentUrl,
        "pages.length:",
        pages.length
      );

      // 只有当前确实在目标 tabBar 页面（不是子页面）且页面栈只有一层时才跳过
      if (currentUrl === path && pages.length === 1) {
        console.log("[tabBar] Already on target page, skip");
        return;
      }

      // 更新选中状态
      this.setData({ selected: index });

      // 执行跳转 - 使用 switchTab
      wx.switchTab({
        url: path,
        success: () => {
          console.log("[tabBar] switchTab success to:", path);
          // 轻触震动反馈
          wx.vibrateShort({ type: "light" });
        },
        fail: (err) => {
          console.error("[tabBar] switchTab failed:", err);
          // switchTab 失败时，尝试使用 reLaunch
          console.log("[tabBar] Fallback to reLaunch");
          wx.reLaunch({
            url: path,
            success: () => {
              console.log("[tabBar] reLaunch success to:", path);
              wx.vibrateShort({ type: "light" });
            },
            fail: (err2) => {
              console.error("[tabBar] reLaunch also failed:", err2);
            },
          });
        },
      });
    },
  },
});
