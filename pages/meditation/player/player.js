// pages/meditation/player/player.js
const db = wx.cloud.database();
const audioManager = wx.getBackgroundAudioManager();

Page({
  data: {
    audioId: "",
    audio: {},
    tempAudioUrl: "",
    playing: false,
    currentTime: 0,
    duration: 0,
    currentTimeStr: "00:00",
    durationStr: "00:00",
    progress: 0,
    loopMode: false,
    speed: 1.0,
    isPreparing: false,
    // 定时关闭
    sleepTimer: 0, // 剩余秒数，0 表示未设置
    sleepTimerStr: "", // 显示文本
    // 定时面板相关
    timerPanelVisible: false,
    timerOptions: [
      0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
    ],
    selectedTimerIndex: 0, // 0=关, 1=30分, 2=60分, 3=90分
    lastTimerMinutes: 0, // 上次设置的分钟数
    remainingTimeStr: "0 分钟", // 剩余播放时间字符串
  },
  _lastTimeUpdate: 0,
  _timeUpdateGap: 400,
  _sleepTimerInterval: null,

  onLoad(options) {
    console.log("[player] ========== 页面加载 ==========");
    console.log("[player] options:", options);
    this._lastTimeUpdate = 0;

    // 加载上次定时设置
    const lastTimer = wx.getStorageSync("lastTimerMinutes") || 0;
    this.setData({ lastTimerMinutes: lastTimer });

    if (options.id) {
      this.setData({ audioId: options.id });
      this.initAudioManager();
      this.loadAudioInfo();
    } else {
      console.error("[player] ❌ 缺少音频 ID");
      wx.showModal({
        title: "加载失败",
        content: "缺少音频 ID 参数",
        showCancel: false,
        success: () => {
          wx.navigateBack();
        },
      });
    }
  },

  onUnload() {
    // 页面卸载时不停止播放，允许后台播放；仅移除事件避免重复绑定
    this.detachAudioEvents();
    // 清除定时关闭定时器
    if (this._sleepTimerInterval) {
      clearInterval(this._sleepTimerInterval);
      this._sleepTimerInterval = null;
    }
  },

  // 加载音频信息
  async loadAudioInfo() {
    console.log("[player] ========== 加载音频信息 ==========");
    console.log("[player] audioId:", this.data.audioId);

    if (!this.data.audioId) {
      console.error("[player] ❌ audioId 为空，无法加载");
      wx.showModal({
        title: "加载失败",
        content: "音频 ID 为空",
        showCancel: false,
        success: () => {
          wx.navigateBack();
        },
      });
      return;
    }

    try {
      const res = await db
        .collection("meditations")
        .doc(this.data.audioId)
        .get();

      console.log("[player] 数据库查询结果:", res);
      console.log(
        "[player] 数据库查询结果 (JSON):",
        JSON.stringify(res, null, 2)
      );

      if (res.data) {
        const audioData = res.data;

        // 兼容 audioUrl 和 audioURL 两种命名（统一使用 audioUrl）
        const fileId = audioData.audioUrl || audioData.audioURL;

        console.log("[player] 音频数据:");
        console.log("[player] - _id:", audioData._id);
        console.log("[player] - title:", audioData.title);
        console.log("[player] - category:", audioData.category);
        console.log("[player] - audioUrl:", audioData.audioUrl);
        console.log("[player] - audioURL:", audioData.audioURL);
        console.log("[player] - 最终使用的 fileId:", fileId);
        console.log("[player] - cover:", audioData.cover);

        if (!fileId) {
          console.error("[player] ❌ 数据库中没有 audioUrl 或 audioURL 字段");
          wx.showModal({
            title: "播放失败",
            content: "音频文件地址缺失，请检查数据库配置",
            showCancel: false,
          });
          return;
        }

        this.setData({
          audio: {
            ...audioData,
            audioUrl: fileId, // 确保 audioUrl 字段存在
          },
        });

        console.log("[player] 准备播放音频，fileId:", fileId);

        // 先转换 fileID -> 临时可播放 URL，再启动播放
        try {
          await this.prepareAndPlay(fileId);
          console.log("[player] ✅ prepareAndPlay 执行完成");
        } catch (prepareError) {
          console.error("[player] ❌ prepareAndPlay 执行失败:", prepareError);
          wx.showModal({
            title: "播放失败",
            content: `准备播放时出错: ${prepareError.message || "未知错误"}`,
            showCancel: false,
          });
        }

        // 记录播放历史
        this.recordPlayHistory();
      } else {
        console.error("[player] ❌ 未找到音频数据");
        wx.showToast({
          title: "未找到音频",
          icon: "none",
        });
      }
    } catch (err) {
      console.error("[player] ❌ 加载音频信息失败 ==========");
      console.error("[player] 错误类型:", err.name);
      console.error("[player] 错误信息:", err.message);
      console.error("[player] 完整错误:", JSON.stringify(err, null, 2));

      wx.showModal({
        title: "加载失败",
        content: `数据库查询失败: ${err.message || "未知错误"}`,
        showCancel: false,
      });
    }
  },

  // 初始化音频管理器
  initAudioManager() {
    console.log("[player] ========== 初始化音频管理器 ==========");
    this.detachAudioEvents();

    // iOS 静音键/混音配置，防止被系统静音拦截
    wx.setInnerAudioOption({
      obeyMuteSwitch: false,
      mixWithOther: true,
    });

    audioManager.onPlay(() => {
      console.log("[player] ✅ 音频开始播放");
      console.log("[player] 当前 src:", audioManager.src);
      console.log("[player] 当前 title:", audioManager.title);
      console.log("[player] 当前 paused:", audioManager.paused);
      console.log("[player] 当前 duration:", audioManager.duration);
      console.log("[player] 当前 currentTime:", audioManager.currentTime);
      this.setData({ playing: true });

      // 显示播放成功提示
      wx.showToast({
        title: "开始播放",
        icon: "success",
        duration: 1500,
      });
    });

    audioManager.onPause(() => {
      console.log("[player] ⏸ 音频暂停");
      this.setData({ playing: false });
    });

    audioManager.onStop(() => {
      console.log("[player] ⏹ 音频停止");
      this.setData({ playing: false });
    });

    audioManager.onEnded(() => {
      console.log("[player] 🏁 音频播放结束");
      if (this.data.loopMode) {
        console.log("[player] 🔁 循环模式已开启，重新播放");
        const fileId = this.data.audio.audioUrl || this.data.audio.audioURL;
        this.prepareAndPlay(fileId);
      } else {
        this.setData({ playing: false });
      }
    });

    audioManager.onTimeUpdate(() => {
      const now = Date.now();
      if (now - this._lastTimeUpdate < this._timeUpdateGap) return;
      this._lastTimeUpdate = now;

      const duration = audioManager.duration || 0;
      const currentTime = audioManager.currentTime || 0;
      const progress =
        duration > 0 ? (currentTime / duration) * 100 : this.data.progress;

      this.setData({
        currentTime,
        duration,
        currentTimeStr: this.formatTime(currentTime),
        durationStr: this.formatTime(duration),
        progress,
      });
    });

    audioManager.onError((err) => {
      console.error("[player] ❌ 音频播放错误 ==========");
      console.error("[player] 错误码:", err.errCode);
      console.error("[player] 错误信息:", err.errMsg);
      console.error("[player] 当前 src:", audioManager.src);
      console.error("[player] 当前 title:", audioManager.title);
      console.error("[player] 完整错误对象:", JSON.stringify(err));

      // 真机调试：显示详细错误信息
      wx.showModal({
        title: "播放失败",
        content: `错误码: ${err.errCode}\n错误信息: ${err.errMsg}`,
        showCancel: false,
      });
    });

    // 监听等待加载事件（真机调试用）
    audioManager.onWaiting(() => {
      console.log("[player] ⏳ 音频加载中...");
    });

    // 监听可以播放事件（真机调试用）
    audioManager.onCanplay(() => {
      console.log("[player] ✅ 音频可以播放了");
    });
  },

  detachAudioEvents() {
    if (audioManager.offPlay) audioManager.offPlay();
    if (audioManager.offPause) audioManager.offPause();
    if (audioManager.offStop) audioManager.offStop();
    if (audioManager.offEnded) audioManager.offEnded();
    if (audioManager.offTimeUpdate) audioManager.offTimeUpdate();
    if (audioManager.offError) audioManager.offError();
    if (audioManager.offWaiting) audioManager.offWaiting();
    if (audioManager.offCanplay) audioManager.offCanplay();
  },

  // 将 fileID 转成临时 https 并播放
  async prepareAndPlay(fileId) {
    console.log("[player] ========== 开始准备播放 ==========");
    console.log("[player] 输入 fileId:", fileId);
    console.log("[player] 音频标题:", this.data.audio.title);

    if (this.data.isPreparing) {
      console.log("[player] ⚠️ 已有播放准备进行中，跳过重复调用");
      return;
    }

    if (!fileId) {
      console.error("[player] ❌ fileId 为空");
      wx.showToast({ title: "音频地址缺失", icon: "none" });
      return;
    }

    wx.showLoading({ title: "加载音频..." });
    this.setData({ isPreparing: true });

    try {
      // 清理旧的播放状态，避免残留
      audioManager.stop();

      // 步骤1：调用 getTempFileURL 获取临时链接
      console.log("[player] 📡 正在调用 wx.cloud.getTempFileURL...");
      console.log("[player] 请求参数:", { fileList: [fileId] });

      const res = await wx.cloud.getTempFileURL({ fileList: [fileId] });

      console.log("[player] 📡 getTempFileURL 返回结果:");
      console.log("[player] - 完整响应:", JSON.stringify(res, null, 2));
      console.log("[player] - fileList 长度:", res?.fileList?.length);

      // 步骤2：检查返回结果
      const fileInfo = res?.fileList?.[0];
      if (!fileInfo) {
        console.error("[player] ❌ fileList 为空或不存在");
        wx.showModal({
          title: "加载失败",
          content: "未能获取音频文件信息，请检查 fileId 是否正确",
          showCancel: false,
        });
        return;
      }

      console.log("[player] 📄 文件信息:");
      console.log("[player] - status:", fileInfo.status);
      console.log("[player] - errMsg:", fileInfo.errMsg);
      console.log("[player] - tempFileURL:", fileInfo.tempFileURL);

      if (fileInfo.status !== 0) {
        console.error("[player] ❌ 获取临时链接失败");
        console.error("[player] - 错误码:", fileInfo.status);
        console.error("[player] - 错误信息:", fileInfo.errMsg);
        if (fileInfo.status === -130 || /permission/i.test(fileInfo.errMsg)) {
          wx.showModal({
            title: "加载失败",
            content: "云存储权限不足，无法获取文件，请检查读权限或重新上传",
            showCancel: false,
          });
          return;
        }
        wx.showModal({
          title: "加载失败",
          content: `错误码: ${fileInfo.status}\n${
            fileInfo.errMsg || "未知错误"
          }`,
          showCancel: false,
        });
        return;
      }

      if (!fileInfo.tempFileURL) {
        console.error("[player] ❌ tempFileURL 为空");
        wx.showModal({
          title: "加载失败",
          content: "未能获取临时播放链接",
          showCancel: false,
        });
        return;
      }

      const rawUrl = fileInfo.tempFileURL;
      const safeUrl = encodeURI(rawUrl); // 处理中文/空格，避免 iOS 播放器拒绝
      console.log("[player] ✅ 成功获取临时链接:", rawUrl);
      console.log("[player] ✅ 转换后的播放链接:", safeUrl);
      this.setData({ tempAudioUrl: safeUrl });

      // 步骤3：设置 BackgroundAudioManager 属性
      console.log("[player] 🎵 开始设置音频管理器属性...");

      // iOS 真机必须先设置 title，否则可能无法播放
      const audioTitle = this.data.audio.title || "冥想音频";
      audioManager.title = audioTitle;
      console.log("[player] - title:", audioTitle);

      audioManager.epname = "可乐心岛冥想"; // 专辑名称
      console.log("[player] - epname: 可乐心岛冥想");

      audioManager.singer = "可乐心岛"; // 歌手名称
      console.log("[player] - singer: 可乐心岛");

      const coverUrl = this.data.audio.cover || "";
      audioManager.coverImgUrl = coverUrl;
      console.log("[player] - coverImgUrl:", coverUrl);

      audioManager.playbackRate = this.data.speed;
      console.log("[player] - playbackRate:", this.data.speed);

      // src 必须最后设置
      audioManager.src = safeUrl;
      console.log("[player] - src:", safeUrl);

      // 主动触发播放
      audioManager.play();

      console.log("[player] ✅ 音频管理器配置完成，等待播放...");
    } catch (error) {
      console.error("[player] ❌ 异常错误 ==========");
      console.error("[player] 错误类型:", error.name);
      console.error("[player] 错误信息:", error.message);
      console.error("[player] 错误堆栈:", error.stack);
      console.error("[player] 完整错误对象:", JSON.stringify(error, null, 2));

      wx.showModal({
        title: "播放失败",
        content: `发生异常: ${
          error.message || "未知错误"
        }\n\n请检查：\n1. 网络连接\n2. 云存储权限\n3. 音频文件是否存在`,
        showCancel: false,
      });

      // 重新抛出错误，让外层捕获
      throw error;
    } finally {
      wx.hideLoading();
      this.setData({ isPreparing: false });
    }
  },

  // 切换播放/暂停
  togglePlay() {
    console.log("[player] ========== 用户点击播放/暂停按钮 ==========");
    console.log("[player] 当前 playing 状态:", this.data.playing);
    console.log("[player] audioManager.src:", audioManager.src);
    console.log("[player] audioManager.paused:", audioManager.paused);

    if (this.data.isPreparing) {
      wx.showToast({ title: "正在准备音频...", icon: "none" });
      return;
    }

    // 如果还没准备好音频源，先尝试重新准备并播放
    if (!audioManager.src && this.data.audio?.audioUrl) {
      console.log("[player] 音频源未设置，重新准备播放");
      this.prepareAndPlay(this.data.audio.audioUrl);
      return;
    }

    if (this.data.playing) {
      console.log("[player] 执行暂停操作");
      audioManager.pause();
    } else {
      console.log("[player] 执行播放操作");
      audioManager.play();

      // 延迟检查播放状态
      setTimeout(() => {
        console.log("[player] 播放后检查状态:");
        console.log("[player] - paused:", audioManager.paused);
        console.log("[player] - currentTime:", audioManager.currentTime);
        console.log("[player] - duration:", audioManager.duration);
      }, 500);
    }
  },

  // 快退
  seekBackward() {
    const newTime = Math.max(0, audioManager.currentTime - 15);
    audioManager.seek(newTime);
  },

  // 快进
  seekForward() {
    const newTime = Math.min(
      audioManager.duration,
      audioManager.currentTime + 15
    );
    audioManager.seek(newTime);
  },

  // 进度条改变
  onProgressChange(e) {
    const value = e.detail.value;
    if (!this.data.duration) {
      wx.showToast({ title: "音频尚未加载完毕", icon: "none" });
      return;
    }
    const newTime = (value / 100) * this.data.duration;
    audioManager.seek(newTime);
  },

  // 切换循环模式
  toggleLoop() {
    const newLoopMode = !this.data.loopMode;
    this.setData({
      loopMode: newLoopMode,
    });

    // 提示用户循环状态
    wx.showToast({
      title: newLoopMode ? "已开启循环" : "已关闭循环",
      icon: "none",
      duration: 1500,
    });
  },

  // 诊断音频状态
  diagnoseAudioState() {
    console.log("[player] ========== 音频状态诊断 ==========");

    const src = audioManager.src || "";
    const title = audioManager.title || "";
    const paused = audioManager.paused;
    const duration = audioManager.duration || 0;
    const currentTime = audioManager.currentTime || 0;
    const buffered = audioManager.buffered || 0;
    const playbackRate = audioManager.playbackRate || 1;

    console.log("[player] audioManager.src:", src || "(未设置)");
    console.log("[player] audioManager.title:", title || "(未设置)");
    console.log("[player] audioManager.paused:", paused);
    console.log("[player] audioManager.duration:", duration);
    console.log("[player] audioManager.currentTime:", currentTime);
    console.log("[player] audioManager.buffered:", buffered);
    console.log("[player] audioManager.playbackRate:", playbackRate);

    console.log("[player] this.data.audioId:", this.data.audioId || "(未设置)");
    console.log(
      "[player] this.data.audio.title:",
      this.data.audio?.title || "(未设置)"
    );
    console.log(
      "[player] this.data.tempAudioUrl:",
      this.data.tempAudioUrl || "(未设置)"
    );

    const statusText = `
音频状态诊断：
- 音频ID: ${this.data.audioId || "未设置"}
- 数据库标题: ${this.data.audio?.title || "未加载"}
- 临时URL: ${this.data.tempAudioUrl ? "已获取" : "未获取"}
- 音频源: ${src ? "已设置" : "❌ 未设置"}
- 播放器标题: ${title || "无"}
- 暂停状态: ${paused ? "是" : "否"}
- 时长: ${duration.toFixed(1)}秒
- 当前时间: ${currentTime.toFixed(1)}秒
- 缓冲进度: ${buffered}%
- 播放速度: ${playbackRate}x
    `.trim();

    wx.showModal({
      title: "音频状态诊断",
      content: statusText,
      showCancel: true,
      cancelText: "关闭",
      confirmText: src ? "强制播放" : "重新加载",
      success: (res) => {
        if (res.confirm) {
          if (src) {
            console.log("[player] 用户点击强制播放");
            audioManager.play();
            wx.showToast({
              title: "已尝试播放",
              icon: "none",
            });
          } else {
            console.log("[player] 用户点击重新加载");
            if (this.data.audio?.audioUrl) {
              this.prepareAndPlay(this.data.audio.audioUrl);
            } else if (this.data.audioId) {
              this.loadAudioInfo();
            } else {
              wx.showToast({
                title: "无法重新加载，缺少音频信息",
                icon: "none",
                duration: 2000,
              });
            }
          }
        }
      },
    });
  },

  // 显示速度选择器
  showSpeedPicker() {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const speedNames = speeds.map((s) => `${s}x`);

    wx.showActionSheet({
      itemList: speedNames,
      success: (res) => {
        const speed = speeds[res.tapIndex];
        this.setData({ speed });
        audioManager.playbackRate = speed;
      },
    });
  },

  // ========== 定时关闭面板相关 ==========

  // 显示定时关闭面板
  showSleepTimerPicker() {
    // 计算剩余播放时间
    const remaining = this.data.duration - this.data.currentTime;
    const remainingMin = Math.ceil(remaining / 60);
    const hours = Math.floor(remainingMin / 60);
    const mins = remainingMin % 60;
    const remainingTimeStr =
      hours > 0 ? `${hours} 小时 ${mins} 分钟` : `${mins} 分钟`;

    // 根据当前 sleepTimer 计算 selectedTimerIndex
    let selectedIndex = 0;
    if (this.data.sleepTimer > 0) {
      const currentMinutes = Math.round(this.data.sleepTimer / 60);
      // 在 timerOptions 中查找最接近的索引
      selectedIndex = this.findClosestTimerIndex(currentMinutes);
    }

    this.setData({
      timerPanelVisible: true,
      remainingTimeStr,
      selectedTimerIndex: selectedIndex,
    });
  },

  // 查找最接近的定时选项索引
  findClosestTimerIndex(minutes) {
    const options = this.data.timerOptions;
    let closestIndex = 0;
    let minDiff = Math.abs(options[0] - minutes);

    for (let i = 1; i < options.length; i++) {
      const diff = Math.abs(options[i] - minutes);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    return closestIndex;
  },

  // 隐藏定时关闭面板
  hideTimerPanel() {
    this.setData({ timerPanelVisible: false });
  },

  // 阻止滑动穿透
  preventTouchMove() {
    return false;
  },

  // 阻止事件冒泡（点击面板内部不关闭）
  stopPropagation() {
    // 空方法，仅用于阻止冒泡
  },

  // 点击定时选项
  onTimerOptionTap(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const minutes = parseInt(e.currentTarget.dataset.minutes);

    this.setData({ selectedTimerIndex: index });
    this.setSleepTimer(minutes);

    // 保存到本地存储（非 0 时）
    if (minutes > 0) {
      wx.setStorageSync("lastTimerMinutes", minutes);
      this.setData({ lastTimerMinutes: minutes });
    }

    // 延迟关闭面板
    setTimeout(() => {
      this.hideTimerPanel();
    }, 300);
  },

  // 本集结束后关闭
  onEndOfTrackTap() {
    const remaining = this.data.duration - this.data.currentTime;
    if (remaining <= 0) {
      wx.showToast({ title: "音频即将结束", icon: "none" });
      return;
    }

    // 设置定时器为剩余秒数
    this.setSleepTimerBySeconds(Math.ceil(remaining));

    // 关闭面板
    setTimeout(() => {
      this.hideTimerPanel();
    }, 300);
  },

  // 上次定时时间
  onLastTimerTap() {
    const lastMinutes = this.data.lastTimerMinutes;
    if (lastMinutes <= 0) {
      wx.showToast({ title: "暂无上次记录", icon: "none" });
      return;
    }

    // 使用 findClosestTimerIndex 查找最接近的索引
    const selectedIndex = this.findClosestTimerIndex(lastMinutes);

    this.setData({ selectedTimerIndex: selectedIndex });
    this.setSleepTimer(lastMinutes);

    // 关闭面板
    setTimeout(() => {
      this.hideTimerPanel();
    }, 300);
  },

  // 设置定时关闭（分钟）
  setSleepTimer(minutes) {
    // 清除现有定时器
    if (this._sleepTimerInterval) {
      clearInterval(this._sleepTimerInterval);
      this._sleepTimerInterval = null;
    }

    if (minutes === 0) {
      this.setData({
        sleepTimer: 0,
        sleepTimerStr: "",
        selectedTimerIndex: 0,
      });
      wx.showToast({ title: "已关闭定时", icon: "none" });
      return;
    }

    let remaining = minutes * 60;
    this.setData({
      sleepTimer: remaining,
      sleepTimerStr: this.formatSleepTime(remaining),
    });

    wx.showToast({ title: `${minutes} 分钟后关闭`, icon: "none" });

    this._sleepTimerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(this._sleepTimerInterval);
        this._sleepTimerInterval = null;
        this.setData({
          sleepTimer: 0,
          sleepTimerStr: "",
          selectedTimerIndex: 0,
        });
        audioManager.pause();
        wx.showToast({ title: "定时结束，已暂停", icon: "none" });
      } else {
        this.setData({
          sleepTimer: remaining,
          sleepTimerStr: this.formatSleepTime(remaining),
        });
      }
    }, 1000);
  },

  // 设置定时关闭（秒数，用于"本集结束后关闭"）
  setSleepTimerBySeconds(seconds) {
    // 清除现有定时器
    if (this._sleepTimerInterval) {
      clearInterval(this._sleepTimerInterval);
      this._sleepTimerInterval = null;
    }

    let remaining = seconds;
    this.setData({
      sleepTimer: remaining,
      sleepTimerStr: this.formatSleepTime(remaining),
      selectedTimerIndex: -1, // 非标准选项
    });

    wx.showToast({ title: "本集结束后关闭", icon: "none" });

    this._sleepTimerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(this._sleepTimerInterval);
        this._sleepTimerInterval = null;
        this.setData({
          sleepTimer: 0,
          sleepTimerStr: "",
          selectedTimerIndex: 0,
        });
        audioManager.pause();
        wx.showToast({ title: "本集已结束，已暂停", icon: "none" });
      } else {
        this.setData({
          sleepTimer: remaining,
          sleepTimerStr: this.formatSleepTime(remaining),
        });
      }
    }, 1000);
  },

  // 格式化定时显示
  formatSleepTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remainM = m % 60;
      return `${h}时${remainM}分`;
    }
    return m > 0 ? `${m}分` : `${s}秒`;
  },

  // 记录播放历史（只写 meditationHistory，不再修改 meditations）
  async recordPlayHistory() {
    const historyItem = {
      audioId: this.data.audioId,
      audioTitle: this.data.audio.title,
      category: this.data.audio.category,
      createTime: Date.now(),
    };

    try {
      await db.collection("meditationHistory").add({
        data: {
          ...historyItem,
          createTime: db.serverDate(),
        },
      });
      console.log("[player] ✅ 冥想播放历史已写入云端", historyItem);
    } catch (err) {
      console.error("[player] ❌ 冥想播放历史写入云端失败", err);
      this.saveHistoryLocally(historyItem);
      console.log("[player] 已回退到本地存储保存播放历史");
    }
  },

  // 本地兜底保存播放历史，避免权限不足时数据丢失
  saveHistoryLocally(entry) {
    try {
      const key = "meditationHistoryLocal";
      const list = wx.getStorageSync(key) || [];
      list.unshift(entry);
      wx.setStorageSync(key, list.slice(0, 50)); // 最多保留50条
      console.log("[player] 播放历史已本地暂存", entry);
    } catch (e) {
      console.warn("[player] 本地暂存播放历史失败", e);
    }
  },

  // 格式化时间
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  },
});
