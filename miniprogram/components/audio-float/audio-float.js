// components/audio-float/audio-float.js
Component({
  data: {
    visible: false, // 是否显示悬浮按钮
    title: "正在播放", // 音频标题
    playing: false, // 是否正在播放
    // 拖拽相关
    left: 0, // 按钮左边距（px）
    top: 0, // 按钮顶部距离（px）
    startX: 0, // 触摸开始X坐标
    startY: 0, // 触摸开始Y坐标
    isDragging: false, // 是否正在拖拽
    windowWidth: 375, // 窗口宽度
    windowHeight: 667, // 窗口高度
  },

  lifetimes: {
    attached() {
      // 组件实例被放入页面节点树后执行
      console.log("[AudioFloat] ========== 组件加载 ==========");
      const pages = getCurrentPages();
      if (pages.length > 0) {
        console.log("[AudioFloat] 当前页面:", pages[pages.length - 1].route);
      }

      this.audioManager = wx.getBackgroundAudioManager();
      this.getSystemInfo();
      this.initAudioManager();
      this.checkInitialState();

      // 定时检查音频状态（每500ms检查一次）
      this.checkTimer = setInterval(() => {
        this.checkAudioState();
      }, 500);
    },

    detached() {
      // 组件实例被从页面节点树移除时执行
      // 清除定时器
      if (this.checkTimer) {
        clearInterval(this.checkTimer);
        this.checkTimer = null;
      }

      // 移除所有事件监听
      if (this.audioManager) {
        this.audioManager.onPlay(() => {});
        this.audioManager.onPause(() => {});
        this.audioManager.onStop(() => {});
        this.audioManager.onEnded(() => {});
        this.audioManager.onError(() => {});
      }
    },
  },

  methods: {
    // 获取系统信息并设置初始位置
    getSystemInfo() {
      const systemInfo = wx.getSystemInfoSync();
      const windowWidth = systemInfo.windowWidth;
      const windowHeight = systemInfo.windowHeight;

      const left = windowWidth - 150; // 按钮宽度约130px，留20px边距
      const top = windowHeight - 180; // 距离底部180px，避免与tabBar重叠

      console.log("[AudioFloat] 窗口尺寸:", windowWidth, "x", windowHeight);
      console.log("[AudioFloat] 初始位置: left =", left, ", top =", top);

      // 设置初始位置（右下角）
      this.setData({
        windowWidth,
        windowHeight,
        left,
        top,
      });
    },

    // 初始化音频管理器事件监听
    initAudioManager() {
      const manager = this.audioManager;

      // 监听播放事件
      manager.onPlay(() => {
        console.log("[AudioFloat] ========== 播放事件触发 ==========");
        console.log("[AudioFloat] 标题:", manager.title);
        const pages = getCurrentPages();
        if (pages.length > 0) {
          console.log("[AudioFloat] 当前页面:", pages[pages.length - 1].route);
        }

        this.setData({
          visible: true,
          playing: true,
          title: manager.title || "正在播放",
        });

        console.log("[AudioFloat] 按钮状态: visible =", this.data.visible);
        console.log(
          "[AudioFloat] 按钮位置: left =",
          this.data.left,
          ", top =",
          this.data.top
        );
      });

      // 监听暂停事件
      manager.onPause(() => {
        console.log("[AudioFloat] 音频暂停");
        this.setData({
          playing: false,
        });
      });

      // 监听停止事件
      manager.onStop(() => {
        console.log("[AudioFloat] 音频停止");
        this.setData({
          visible: false,
          playing: false,
        });
      });

      // 监听播放结束事件
      manager.onEnded(() => {
        console.log("[AudioFloat] 音频播放结束");
        this.setData({
          visible: false,
          playing: false,
        });
      });

      // 监听错误事件
      manager.onError((err) => {
        console.error("[AudioFloat] 音频播放错误", err);
        this.setData({
          visible: false,
          playing: false,
        });
      });
    },

    // 检查初始状态（页面加载时可能已经在播放）
    checkInitialState() {
      const manager = this.audioManager;

      console.log("[AudioFloat] ========== 检查初始状态 ==========");
      console.log("[AudioFloat] src:", manager.src);
      console.log("[AudioFloat] paused:", manager.paused);
      console.log("[AudioFloat] title:", manager.title);

      // 如果有 src 且 paused 为 false，说明正在播放
      if (manager.src && !manager.paused) {
        console.log("[AudioFloat] ✅ 检测到正在播放的音频");
        this.setData({
          visible: true,
          playing: true,
          title: manager.title || "正在播放",
        });
      } else {
        console.log("[AudioFloat] ❌ 没有检测到正在播放的音频");
      }
    },

    // 定时检查音频状态（用于实时同步）
    checkAudioState() {
      const manager = this.audioManager;

      // 如果有音频源且未暂停，显示按钮
      if (manager.src && !manager.paused) {
        if (!this.data.visible) {
          console.log("[AudioFloat] 🔄 检测到音频播放，显示按钮");
          console.log("[AudioFloat] 标题:", manager.title);
        }
        this.setData({
          visible: true,
          playing: true,
          title: manager.title || "正在播放",
        });
      } else if (manager.src && manager.paused) {
        // 有音频源但已暂停
        if (this.data.playing) {
          console.log("[AudioFloat] ⏸️ 音频已暂停");
        }
        this.setData({
          playing: false,
        });
      } else {
        // 没有音频源，隐藏按钮
        if (this.data.visible) {
          console.log("[AudioFloat] ⏹️ 音频已停止，隐藏按钮");
        }
        this.setData({
          visible: false,
          playing: false,
        });
      }
    },

    // 触摸开始
    onTouchStart(e) {
      const touch = e.touches[0];
      this.setData({
        startX: touch.clientX - this.data.left,
        startY: touch.clientY - this.data.top,
        isDragging: false,
      });
    },

    // 触摸移动
    onTouchMove(e) {
      const touch = e.touches[0];
      let left = touch.clientX - this.data.startX;
      let top = touch.clientY - this.data.startY;

      // 标记为拖拽状态
      this.setData({
        isDragging: true,
      });

      // 限制按钮不超出屏幕边界
      const buttonWidth = 130; // 按钮宽度估算
      const buttonHeight = 50; // 按钮高度估算

      if (left < 10) left = 10;
      if (left > this.data.windowWidth - buttonWidth - 10)
        left = this.data.windowWidth - buttonWidth - 10;
      if (top < 10) top = 10;
      if (top > this.data.windowHeight - buttonHeight - 10)
        top = this.data.windowHeight - buttonHeight - 10;

      this.setData({
        left,
        top,
      });
    },

    // 触摸结束
    onTouchEnd(e) {
      // 如果只是点击（没有拖拽），则执行停止操作
      if (!this.data.isDragging) {
        this.handleStop();
      }

      // 重置拖拽状态
      setTimeout(() => {
        this.setData({
          isDragging: false,
        });
      }, 100);
    },

    // 点击按钮停止播放
    handleStop() {
      console.log("[AudioFloat] 用户点击停止按钮");

      wx.showModal({
        title: "停止播放",
        content: "确定要停止当前音频播放吗？",
        confirmText: "停止",
        confirmColor: "#8B7355",
        success: (res) => {
          if (res.confirm) {
            this.audioManager.stop();
            this.setData({
              visible: false,
              playing: false,
            });

            wx.showToast({
              title: "已停止播放",
              icon: "success",
              duration: 1500,
            });
          }
        },
      });
    },
  },
});
