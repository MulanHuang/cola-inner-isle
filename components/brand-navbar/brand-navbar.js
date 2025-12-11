Component({
  options: {
    multipleSlots: true,
    styleIsolation: "apply-shared",
  },

  properties: {
    title: {
      type: String,
      value: "可乐心岛",
    },
    logo: {
      type: String,
      value: "/images/logo.svg",
    },
    showBack: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    contentHeight: 44,
  },

  lifetimes: {
    attached() {
      this.computeNavHeights();
    },
  },

  methods: {
    onBack() {
      this.triggerEvent("back");
      // 默认行为：返回上一页
      wx.navigateBack({
        delta: 1,
        fail: () => {
          // 如果没有上一页，返回首页
          wx.switchTab({ url: "/pages/index/index" });
        },
      });
    },

    computeNavHeights() {
      const systemInfo = wx.getSystemInfoSync();
      const statusBarHeight = systemInfo.statusBarHeight || 0;

      let menuButtonRect = null;
      try {
        menuButtonRect = wx.getMenuButtonBoundingClientRect
          ? wx.getMenuButtonBoundingClientRect()
          : null;
      } catch (err) {
        console.warn(
          "[brand-navbar] getMenuButtonBoundingClientRect failed",
          err
        );
      }

      // 以胶囊按钮高度 + 上下间距为内容高度，兼容无胶囊的场景使用默认 44
      const contentHeight = menuButtonRect
        ? menuButtonRect.height + (menuButtonRect.top - statusBarHeight) * 2
        : 44;

      const navBarHeight = statusBarHeight + contentHeight;

      this.setData({
        statusBarHeight,
        navBarHeight,
        contentHeight,
      });

      this.triggerEvent("ready", {
        statusBarHeight,
        navBarHeight,
        contentHeight,
      });
    },
  },
});
