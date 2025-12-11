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
    // 🚀 音频缓冲状态（用于UI显示加载动画）
    audioBuffering: false,
    audioReady: false,
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

      // 🚀 优化方案2：并行初始化音频管理器
      this.initAudioManager();

      // 🚀 优化方案1：优先使用列表页传递的数据，跳过数据库查询
      if (options.audioData) {
        try {
          const audioData = JSON.parse(decodeURIComponent(options.audioData));
          console.log("[player] ✅ 使用列表页传递的数据，跳过数据库查询");
          this.handleAudioData(audioData);
        } catch (parseErr) {
          console.warn(
            "[player] ⚠️ 解析传递数据失败，回退到数据库查询:",
            parseErr.message
          );
          this.loadAudioInfo();
        }
      } else {
        // 没有传递数据时（如从分享链接进入），回退到数据库查询
        console.log("[player] 📡 无传递数据，执行数据库查询");
        this.loadAudioInfo();
      }
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

  // 🚀 处理音频数据（从传递数据或数据库查询结果）
  async handleAudioData(audioData) {
    const fileId = audioData.audioUrl || audioData.audioURL;

    console.log("[player] 音频数据:");
    console.log("[player] - _id:", audioData._id);
    console.log("[player] - title:", audioData.title);
    console.log("[player] - fileId:", fileId);

    if (!fileId) {
      console.error("[player] ❌ 音频文件地址缺失");
      wx.showModal({
        title: "播放失败",
        content: "音频文件地址缺失",
        showCancel: false,
      });
      return;
    }

    this.setData({
      audio: {
        ...audioData,
        audioUrl: fileId,
      },
    });

    // 解析并预设 duration
    const dbDuration = audioData.duration;
    if (dbDuration) {
      const durationInSeconds = this.parseDurationString(dbDuration);
      if (durationInSeconds > 0) {
        console.log(
          "[player] 预设时长:",
          dbDuration,
          "->",
          durationInSeconds,
          "秒"
        );
        this.setData({
          duration: durationInSeconds,
          durationStr: this.formatTime(durationInSeconds),
        });
      }
    }

    // 准备音频（会优先使用缓存的临时URL）
    try {
      await this.prepareAudio(fileId);
      console.log("[player] ✅ 音频准备完成，等待用户点击播放");
    } catch (prepareError) {
      console.error("[player] ❌ prepareAudio 执行失败:", prepareError);
      wx.showModal({
        title: "加载失败",
        content: `准备音频时出错: ${prepareError.message || "未知错误"}`,
        showCancel: false,
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

        // 🔧 解析并预设 duration，在播放前就显示正确的总时长
        const dbDuration = audioData.duration;
        if (dbDuration) {
          const durationInSeconds = this.parseDurationString(dbDuration);
          if (durationInSeconds > 0) {
            console.log(
              "[player] 预设时长:",
              dbDuration,
              "->",
              durationInSeconds,
              "秒"
            );
            this.setData({
              duration: durationInSeconds,
              durationStr: this.formatTime(durationInSeconds),
            });
          }
        }

        console.log("[player] 准备音频，fileId:", fileId);

        // 先转换 fileID -> 临时可播放 URL
        try {
          await this.prepareAudio(fileId);
          console.log("[player] ✅ prepareAudio 执行完成，等待用户点击播放");
        } catch (prepareError) {
          console.error("[player] ❌ prepareAudio 执行失败:", prepareError);
          wx.showModal({
            title: "加载失败",
            content: `准备音频时出错: ${prepareError.message || "未知错误"}`,
            showCancel: false,
          });
        }
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
      console.log("[player] 当前 duration:", audioManager.duration);
      this.setData({ playing: true });
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

    // 🚀 监听等待加载事件 - 显示缓冲状态
    audioManager.onWaiting(() => {
      console.log("[player] ⏳ 音频缓冲中...");
      this.setData({ audioBuffering: true });
    });

    // 🚀 监听可以播放事件 - 隐藏缓冲状态，提供触感反馈
    audioManager.onCanplay(() => {
      console.log("[player] ✅ 音频缓冲完成，可以流畅播放了");
      this.setData({
        audioBuffering: false,
        audioReady: true,
      });
      // 轻触感反馈，让用户感知到音频已准备好
      wx.vibrateShort({ type: "light" }).catch(() => {});
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

  // 只准备音频（获取临时URL并设置播放器），不自动播放
  async prepareAudio(fileId) {
    console.log("[player] ========== 开始准备音频 ==========");
    console.log("[player] 输入 fileId:", fileId);
    console.log("[player] 音频标题:", this.data.audio.title);

    if (this.data.isPreparing) {
      console.log("[player] ⚠️ 已有准备进行中，跳过重复调用");
      return false;
    }

    if (!fileId) {
      console.error("[player] ❌ fileId 为空");
      wx.showToast({ title: "音频地址缺失", icon: "none" });
      return false;
    }

    // 🚀 优先检查本地缓存的临时URL（预加载优化）
    try {
      const urlCache = wx.getStorageSync("audioUrlCache") || {};
      if (urlCache[fileId]) {
        const cachedUrl = urlCache[fileId];
        const safeUrl = encodeURI(cachedUrl);
        console.log("[player] ✅ 使用缓存的临时URL（预加载命中）");
        this.setData({ tempAudioUrl: safeUrl });
        return true;
      }
    } catch (cacheErr) {
      console.warn("[player] ⚠️ 读取缓存失败:", cacheErr.message);
    }

    wx.showLoading({ title: "加载音频..." });
    this.setData({ isPreparing: true });

    try {
      // 步骤1：调用 getTempFileURL 获取临时链接
      console.log("[player] 📡 正在调用 wx.cloud.getTempFileURL...");
      console.log("[player] 📡 fileId:", fileId);
      const res = await wx.cloud.getTempFileURL({ fileList: [fileId] });

      console.log("[player] 📡 getTempFileURL 返回结果:");
      console.log("[player] - fileList 长度:", res?.fileList?.length);

      // 步骤2：检查返回结果
      const fileInfo = res?.fileList?.[0];
      if (!fileInfo) {
        console.error("[player] ❌ fileList 为空或不存在");
        throw new Error("未能获取音频文件信息");
      }

      console.log("[player] 📄 文件信息 status:", fileInfo.status);

      if (fileInfo.status !== 0) {
        console.error("[player] ❌ 获取临时链接失败，错误码:", fileInfo.status);
        console.error("[player] ❌ 错误信息:", fileInfo.errMsg);
        throw new Error(fileInfo.errMsg || "获取临时链接失败");
      }

      if (!fileInfo.tempFileURL) {
        console.error("[player] ❌ tempFileURL 为空");
        throw new Error("未能获取临时播放链接");
      }

      const rawUrl = fileInfo.tempFileURL;
      // 对 URL 进行编码处理，处理中文和特殊字符
      const safeUrl = encodeURI(rawUrl);
      console.log("[player] ✅ 原始临时链接:", rawUrl);
      console.log("[player] ✅ 编码后链接:", safeUrl);

      this.setData({ tempAudioUrl: safeUrl });

      // 🚀 将新获取的URL存入缓存，供下次使用
      try {
        const urlCache = wx.getStorageSync("audioUrlCache") || {};
        urlCache[fileId] = rawUrl;
        wx.setStorageSync("audioUrlCache", urlCache);
        console.log("[player] ✅ 临时URL已缓存");
      } catch (cacheErr) {
        console.warn("[player] ⚠️ 缓存URL失败:", cacheErr.message);
      }

      console.log("[player] ✅ 音频准备完成，tempAudioUrl 已保存");
      return true;
    } catch (error) {
      console.error("[player] ❌ 准备音频异常:", error.message);
      wx.showModal({
        title: "加载失败",
        content: error.message || "未知错误",
        showCancel: false,
      });
      return false;
    } finally {
      wx.hideLoading();
      this.setData({ isPreparing: false });
    }
  },

  // 将 fileID 转成临时 https 并播放（用于循环播放等场景）
  async prepareAndPlay(fileId) {
    console.log("[player] ========== 开始准备并播放 ==========");

    // 如果已经有临时URL，直接播放
    if (this.data.tempAudioUrl) {
      this.startPlayback();
      return;
    }

    // 否则先准备再播放
    const success = await this.prepareAudio(fileId);
    if (success && this.data.tempAudioUrl) {
      this.startPlayback();
    } else {
      console.error("[player] ❌ 准备失败，无法播放");
    }
  },

  // 实际开始播放音频
  startPlayback() {
    console.log("[player] 🎵 开始设置音频管理器并播放...");

    const safeUrl = this.data.tempAudioUrl;
    if (!safeUrl) {
      console.error("[player] ❌ 临时URL为空，无法播放");
      wx.showToast({ title: "音频未准备好", icon: "none" });
      return;
    }

    // iOS 真机必须先设置 title，否则可能无法播放
    const audioTitle = this.data.audio.title || "冥想音频";
    audioManager.title = audioTitle;
    console.log("[player] - title:", audioTitle);

    audioManager.epname = "可乐心岛冥想";
    audioManager.singer = "可乐心岛";
    audioManager.coverImgUrl = this.data.audio.cover || "";
    audioManager.playbackRate = this.data.speed;

    // src 必须最后设置，设置 src 后 BackgroundAudioManager 会自动开始播放
    audioManager.src = safeUrl;
    console.log("[player] - src 已设置，等待自动播放...");

    // 记录播放历史（异步执行，不阻塞播放）
    setTimeout(() => {
      this.recordPlayHistory();
    }, 100);
  },

  // 切换播放/暂停
  togglePlay() {
    console.log("[player] ========== 用户点击播放/暂停按钮 ==========");
    console.log("[player] 当前 playing 状态:", this.data.playing);
    console.log("[player] tempAudioUrl 存在:", !!this.data.tempAudioUrl);
    console.log("[player] audioManager.src 存在:", !!audioManager.src);

    if (this.data.isPreparing) {
      console.log("[player] ⏳ 正在准备中，请稍候...");
      wx.showToast({ title: "正在加载...", icon: "loading" });
      return;
    }

    // 如果正在播放，则暂停
    if (this.data.playing) {
      console.log("[player] ⏸ 执行暂停操作");
      audioManager.pause();
      return;
    }

    // 检查当前 audioManager.src 是否是当前音频
    const isCurrentAudio =
      audioManager.src && audioManager.src === this.data.tempAudioUrl;
    console.log("[player] 是否是当前音频:", isCurrentAudio);

    // 如果是当前音频且已加载，直接继续播放
    if (isCurrentAudio) {
      console.log("[player] ▶️ 继续播放当前音频");
      audioManager.play();
      return;
    }

    // 首次播放或切换音频：使用已准备好的临时URL
    if (this.data.tempAudioUrl) {
      console.log("[player] ▶️ 首次播放，设置新的音频源");
      // 🚀 显示缓冲状态
      this.setData({ audioBuffering: true });
      this.startPlayback();
    } else if (this.data.audio?.audioUrl) {
      // 如果临时URL也没有，重新准备并播放
      console.log("[player] ⏳ 临时URL不存在，重新准备并播放");
      // 🚀 显示缓冲状态
      this.setData({ audioBuffering: true });
      this.prepareAndPlay(this.data.audio.audioUrl);
    } else {
      console.error("[player] ❌ 没有可用的音频源");
      wx.showToast({ title: "音频加载失败", icon: "none" });
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

  // 格式化时间（支持小时格式）
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      // HH:MM:SS 格式
      return `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      // MM:SS 格式
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
  },

  // 解析数据库中的 duration 字符串（支持 HH:MM:SS、MM:SS、M:SS 格式）
  parseDurationString(durationStr) {
    if (!durationStr || typeof durationStr !== "string") return 0;
    const parts = durationStr.split(":").map(Number);
    if (parts.some(isNaN)) return 0;

    if (parts.length === 3) {
      // HH:MM:SS 格式
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS 格式
      return parts[0] * 60 + parts[1];
    }
    return 0;
  },
});
