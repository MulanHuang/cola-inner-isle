// pages/explore/innerchild/innerchild.js
Page({
  data: {
    navBarHeight: 0, // 导航栏高度
  },

  // 导航栏准备完成
  onNavReady(e) {
    this.setData({
      navBarHeight: e.detail.navBarHeight || 0,
    });
  },

  // 跳转到冥想
  goToMeditation(e) {
    const category = e.currentTarget.dataset.category;
    wx.switchTab({
      url: "/pages/meditation/meditation",
      success: () => {
        // 通过事件通知冥想页面切换分类
        wx.setStorageSync("meditationCategory", category);
      },
    });
  },

  // 跳转到心语对话
  goToChat() {
    wx.switchTab({
      url: "/pages/chat/chat",
    });
  },

  // 写日记
  writeJournal() {
    wx.showModal({
      title: "写给内在小孩",
      content: "此功能可以在情绪记录中实现，或者通过心语对话来倾诉",
      showCancel: true,
      cancelText: "情绪记录",
      confirmText: "心语对话",
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: "/pages/chat/chat",
          });
        } else if (res.cancel) {
          wx.navigateTo({
            url: "/pages/emotion/emotion",
          });
        }
      },
    });
  },
});
