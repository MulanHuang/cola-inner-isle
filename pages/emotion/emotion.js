// pages/emotion/emotion.js
const db = wx.cloud.database();
// ✅ AI 温柔回应改为前端直连 Vercel 代理（流式输出）
// 🔥 已升级为流式输出，用户可在 0.2 秒内看到字符开始出现

const { callAIStream } = require("../../utils/aiStream.js");

Page({
  data: {
    // 温暖一句（本地备用数据）
    localQuotes: [
      { content: "你的感受是真实的，值得被看见", author: "" },
      { content: "每一次呼吸，都是与自己和解的机会", author: "" },
      { content: "温柔地对待自己，就像对待一个好朋友", author: "" },
      { content: "你已经足够好了，真的", author: "" },
      { content: "允许自己慢下来，感受此刻", author: "" },
      { content: "你比想象中更勇敢、更坚强", author: "" },
      { content: "每一天都是重新开始的机会", author: "" },
      { content: "倾听内心的声音，它知道答案", author: "" },
      { content: "给自己一些时间，慢慢来", author: "" },
      { content: "你值得被爱，也值得被理解", author: "" },
      { content: "世界很吵，但你可以很温柔", author: "" },
      { content: "允许自己不完美，是一种温柔的力量", author: "" },
      { content: "你的情绪不是麻烦，是信号", author: "" },
      { content: "别忘了，你也是需要被温柔对待的人", author: "" },
      { content: "心软不是弱点，是你温暖的证据", author: "" },
    ],
    emotionQuote: {
      content: "你的感受是真实的，值得被看见",
      author: "",
    },
    emotions: [
      { id: "happy", name: "开心", icon: "😊" },
      { id: "excited", name: "兴奋", icon: "🤩" },
      { id: "calm", name: "平静", icon: "😌" },
      { id: "grateful", name: "感恩", icon: "🙏" },
      { id: "sad", name: "难过", icon: "😢" },
      { id: "anxious", name: "焦虑", icon: "😰" },
      { id: "angry", name: "愤怒", icon: "😠" },
      { id: "tired", name: "疲惫", icon: "😴" },
      { id: "confused", name: "困惑", icon: "😕" },
      { id: "lonely", name: "孤独", icon: "😔" },
      { id: "stressed", name: "压力", icon: "😫" },
      { id: "peaceful", name: "安宁", icon: "🕊️" },
    ],
    // 情绪反馈文案
    emotionFeedbacks: {
      happy: "真好，看到你开心的样子 ✨",
      excited: "感受到你的兴奋啦！这份能量真棒 🌟",
      calm: "平静是一种力量，你做得很好 🌊",
      grateful: "感恩的心会带来更多美好 🌸",
      sad: "难过没关系，允许自己慢慢来 🫂",
      anxious: "焦虑时记得深呼吸，你已经很努力了 🌿",
      angry: "愤怒也是一种表达，你的感受我都懂 🔥",
      tired: "累了就休息一下，你值得被温柔对待 🌙",
      confused: "困惑是成长的开始，慢慢理清就好 🧭",
      lonely: "孤独时记得，这里永远有人陪伴你 💫",
      stressed: "压力很大吧，一步一步来，不着急 🌱",
      peaceful: "这份安宁真珍贵，好好享受这一刻 🕊️",
    },
    // 感恩快速模板
    gratitudeTemplates: [
      {
        id: "grateful1",
        icon: "🙏",
        label: "今天我感激的是…",
        text: "今天我感激的是：",
      },
      {
        id: "grateful2",
        icon: "💝",
        label: "让我微笑的瞬间…",
        text: "让我微笑的瞬间：",
      },
      {
        id: "grateful3",
        icon: "🌸",
        label: "温暖我的人或事…",
        text: "温暖我的人或事：",
      },
      {
        id: "grateful4",
        icon: "☀️",
        label: "今天的小确幸…",
        text: "今天的小确幸：",
      },
    ],
    // 成功快速模板
    successTemplates: [
      {
        id: "success1",
        icon: "🌟",
        label: "我做得好的事…",
        text: "我做得好的事：",
      },
      {
        id: "success2",
        icon: "💪",
        label: "我坚持的一件事…",
        text: "我坚持的一件事：",
      },
      {
        id: "success3",
        icon: "🎯",
        label: "我完成的小目标…",
        text: "我完成的小目标：",
      },
      {
        id: "success4",
        icon: "✨",
        label: "我进步的地方…",
        text: "我进步的地方：",
      },
    ],
    tags: [
      { id: "work", name: "工作", icon: "💼" },
      { id: "study", name: "学习", icon: "📚" },
      { id: "relationship", name: "人际关系", icon: "👥" },
      { id: "family", name: "家庭", icon: "🏠" },
      { id: "love", name: "爱情", icon: "💕" },
      { id: "health", name: "健康", icon: "🏃" },
      { id: "money", name: "财务", icon: "💰" },
      { id: "growth", name: "成长", icon: "🌱" },
      { id: "dream", name: "梦想", icon: "⭐" },
      { id: "gratitude", name: "感恩", icon: "🙏" },
      { id: "happiness", name: "小确幸", icon: "✨" },
      { id: "success", name: "成功", icon: "🎯" },
      { id: "other", name: "其他", icon: "🔖" },
    ],
    selectedEmotion: "",
    selectedEmotionName: "",
    selectedEmotionIcon: "",
    emotionFeedback: "", // 当前情绪的反馈文案
    energyLevel: 0, // 今日能量指数 (0-5)
    gratitudeItems: ["", "", ""], // 3个感恩事项
    successItems: ["", "", ""], // 3个成功事项
    description: "", // 自由输入区
    selectedTags: [],
    aiReply: "",
    aiLoading: false,
    // 感恩输入框状态管理
    currentFocusedGratitudeIndex: -1, // 当前聚焦的感恩输入框索引（-1表示未聚焦）
    gratitudeFocusStates: [false, false, false], // 每个感恩输入框的聚焦状态
    gratitudeCursorPositions: [0, 0, 0], // 每个感恩输入框的光标位置
    gratitudeExpandStates: [false, false, false], // 每条感恩记录的展开状态
    // 成功输入框状态管理
    currentFocusedSuccessIndex: -1, // 当前聚焦的成功输入框索引（-1表示未聚焦）
    successFocusStates: [false, false, false], // 每个成功输入框的聚焦状态
    successCursorPositions: [0, 0, 0], // 每个成功输入框的光标位置
    successExpandStates: [false, false, false], // 每条成功记录的展开状态
    // 字数限制
    maxTextLength: 100, // 最大字数
    // 折叠控制
    showMoreGratitude: false,
    showMoreSuccess: false,
    showThirdGratitude: false,
    showThirdSuccess: false,
    completionScore: 0,
    completionTotal: 5,
  },

  onLoad() {
    this.loadEmotionQuote();
  },

  // 加载温暖一句（改进版：支持降级到本地数据）
  async loadEmotionQuote() {
    try {
      // 尝试从云数据库下载
      const res = await db
        .collection("quotes")
        .aggregate()
        .sample({ size: 1 })
        .end();

      if (res.list && res.list.length > 0) {
        this.setData({
          emotionQuote: res.list[0],
        });
        console.log("✅ 从云数据库下载温暖一句成功");
        return;
      }
    } catch (err) {
      console.warn("⚠️ 云数据库加载失败，使用本地数据", err.errMsg || err);
    }

    // 降级方案：使用本地数据
    const randomIndex = Math.floor(
      Math.random() * this.data.localQuotes.length
    );
    this.setData({
      emotionQuote: this.data.localQuotes[randomIndex],
    });
    console.log("✅ 使用本地温暖一句");
  },

  // 刷新温暖一句
  refreshEmotionQuote() {
    this.loadEmotionQuote();
  },

  // 选择情绪
  selectEmotion(e) {
    const emotionId = e.currentTarget.dataset.id;
    const emotion =
      this.data.emotions.find((item) => item.id === emotionId) || {};
    const feedback = this.data.emotionFeedbacks[emotionId] || "";
    this.setData({
      selectedEmotion: emotionId,
      emotionFeedback: feedback,
      selectedEmotionName: emotion.name || "",
      selectedEmotionIcon: emotion.icon || "",
    });
    this.updateCompletion();
  },

  // 设置能量指数
  setEnergyLevel(e) {
    const level = e.currentTarget.dataset.level;
    this.setData({
      energyLevel: parseInt(level),
    });
    this.updateCompletion();
  },

  // 感恩输入框获得焦点
  onGratitudeFocus(e) {
    const index = e.currentTarget.dataset.index;
    const gratitudeFocusStates = [...this.data.gratitudeFocusStates];
    gratitudeFocusStates[index] = true;
    this.setData({
      currentFocusedGratitudeIndex: index,
      gratitudeFocusStates,
    });
  },

  // 感恩输入框失去焦点
  onGratitudeBlur(e) {
    const index = e.currentTarget.dataset.index;
    const gratitudeFocusStates = [...this.data.gratitudeFocusStates];
    gratitudeFocusStates[index] = false;
    this.setData({
      gratitudeFocusStates,
    });
    // 延迟清除聚焦索引，避免点击模板按钮时已经失焦
    setTimeout(() => {
      if (this.data.currentFocusedGratitudeIndex === index) {
        this.setData({ currentFocusedGratitudeIndex: -1 });
      }
    }, 200);
  },

  // 插入感恩模板（智能版）
  insertGratitudeTemplate(e) {
    const templateText = e.currentTarget.dataset.text;
    const gratitudeItems = [...this.data.gratitudeItems];

    // 策略1：优先插入到当前聚焦的输入框
    let targetIndex = this.data.currentFocusedGratitudeIndex;

    // 策略2：如果没有聚焦的输入框，找第一个空白的输入框
    if (targetIndex === -1) {
      targetIndex = gratitudeItems.findIndex(
        (item) => !item || item.trim() === ""
      );
    }

    // 策略3：如果所有输入框都有内容，默认插入到第一个
    if (targetIndex === -1) {
      targetIndex = 0;
    }

    // 检查是否已有相同模板前缀，避免重复插入
    const currentValue = gratitudeItems[targetIndex];
    if (currentValue && currentValue.startsWith(templateText)) {
      // 已有相同模板前缀，不重复插入，只聚焦并定位光标
      const gratitudeFocusStates = [...this.data.gratitudeFocusStates];
      gratitudeFocusStates[targetIndex] = true;
      const gratitudeCursorPositions = [...this.data.gratitudeCursorPositions];
      gratitudeCursorPositions[targetIndex] = templateText.length;
      this.setData({
        currentFocusedGratitudeIndex: targetIndex,
        gratitudeFocusStates,
        gratitudeCursorPositions,
      });
      return;
    }

    // 插入模板前缀
    gratitudeItems[targetIndex] = templateText;

    // 更新数据并设置光标位置
    const gratitudeFocusStates = [...this.data.gratitudeFocusStates];
    gratitudeFocusStates[targetIndex] = true;
    const gratitudeCursorPositions = [...this.data.gratitudeCursorPositions];
    gratitudeCursorPositions[targetIndex] = templateText.length;

    this.setData({
      gratitudeItems,
      currentFocusedGratitudeIndex: targetIndex,
      gratitudeFocusStates,
      gratitudeCursorPositions,
    });
    this.updateCompletion();
  },

  // 输入感恩事项
  onGratitudeInput(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const cursor = e.detail.cursor || 0;

    const gratitudeItems = [...this.data.gratitudeItems];
    gratitudeItems[index] = value;

    const gratitudeCursorPositions = [...this.data.gratitudeCursorPositions];
    gratitudeCursorPositions[index] = cursor;

    this.setData({
      gratitudeItems,
      gratitudeCursorPositions,
    });
    this.updateCompletion();
  },

  // 成功输入框获得焦点
  onSuccessFocus(e) {
    const index = e.currentTarget.dataset.index;
    const successFocusStates = [...this.data.successFocusStates];
    successFocusStates[index] = true;
    this.setData({
      currentFocusedSuccessIndex: index,
      successFocusStates,
    });
  },

  // 成功输入框失去焦点
  onSuccessBlur(e) {
    const index = e.currentTarget.dataset.index;
    const successFocusStates = [...this.data.successFocusStates];
    successFocusStates[index] = false;
    this.setData({
      successFocusStates,
    });
    // 延迟清除聚焦索引，避免点击模板按钮时已经失焦
    setTimeout(() => {
      if (this.data.currentFocusedSuccessIndex === index) {
        this.setData({ currentFocusedSuccessIndex: -1 });
      }
    }, 200);
  },

  // 插入成功模板（智能版）
  insertSuccessTemplate(e) {
    const templateText = e.currentTarget.dataset.text;
    const successItems = [...this.data.successItems];

    // 策略1：优先插入到当前聚焦的输入框
    let targetIndex = this.data.currentFocusedSuccessIndex;

    // 策略2：如果没有聚焦的输入框，找第一个空白的输入框
    if (targetIndex === -1) {
      targetIndex = successItems.findIndex(
        (item) => !item || item.trim() === ""
      );
    }

    // 策略3：如果所有输入框都有内容，默认插入到第一个
    if (targetIndex === -1) {
      targetIndex = 0;
    }

    // 检查是否已有相同模板前缀，避免重复插入
    const currentValue = successItems[targetIndex];
    if (currentValue && currentValue.startsWith(templateText)) {
      // 已有相同模板前缀，不重复插入，只聚焦并定位光标
      const successFocusStates = [...this.data.successFocusStates];
      successFocusStates[targetIndex] = true;
      const successCursorPositions = [...this.data.successCursorPositions];
      successCursorPositions[targetIndex] = templateText.length;
      this.setData({
        currentFocusedSuccessIndex: targetIndex,
        successFocusStates,
        successCursorPositions,
      });
      return;
    }

    // 插入模板前缀
    successItems[targetIndex] = templateText;

    // 更新数据并设置光标位置
    const successFocusStates = [...this.data.successFocusStates];
    successFocusStates[targetIndex] = true;
    const successCursorPositions = [...this.data.successCursorPositions];
    successCursorPositions[targetIndex] = templateText.length;

    this.setData({
      successItems,
      currentFocusedSuccessIndex: targetIndex,
      successFocusStates,
      successCursorPositions,
    });
    this.updateCompletion();
  },

  // 输入成功事项
  onSuccessInput(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const cursor = e.detail.cursor || 0;

    const successItems = [...this.data.successItems];
    successItems[index] = value;

    const successCursorPositions = [...this.data.successCursorPositions];
    successCursorPositions[index] = cursor;

    this.setData({
      successItems,
      successCursorPositions,
    });
    this.updateCompletion();
  },

  // 切换感恩记录的展开状态
  toggleGratitudeExpand(e) {
    const index = e.currentTarget.dataset.index;
    const gratitudeExpandStates = [...this.data.gratitudeExpandStates];
    gratitudeExpandStates[index] = !gratitudeExpandStates[index];
    this.setData({ gratitudeExpandStates });
  },

  // 展开/收起感恩列表
  toggleGratitudeList() {
    if (!this.data.showMoreGratitude) {
      // 展开第二条并聚焦
      const gratitudeFocusStates = [...this.data.gratitudeFocusStates];
      gratitudeFocusStates[1] = true;
      this.setData({
        showMoreGratitude: true,
        gratitudeFocusStates,
        currentFocusedGratitudeIndex: 1,
      });
      return;
    }

    if (!this.data.showThirdGratitude) {
      // 展开第三条并聚焦
      const gratitudeFocusStates = [...this.data.gratitudeFocusStates];
      gratitudeFocusStates[2] = true;
      this.setData({
        showThirdGratitude: true,
        gratitudeFocusStates,
        currentFocusedGratitudeIndex: 2,
      });
      return;
    }
  },

  // 切换成功记录的展开状态
  toggleSuccessExpand(e) {
    const index = e.currentTarget.dataset.index;
    const successExpandStates = [...this.data.successExpandStates];
    successExpandStates[index] = !successExpandStates[index];
    this.setData({ successExpandStates });
  },

  // 展开/收起成功列表
  toggleSuccessList() {
    if (!this.data.showMoreSuccess) {
      const successFocusStates = [...this.data.successFocusStates];
      successFocusStates[1] = true;
      this.setData({
        showMoreSuccess: true,
        successFocusStates,
        currentFocusedSuccessIndex: 1,
      });
      return;
    }

    if (!this.data.showThirdSuccess) {
      const successFocusStates = [...this.data.successFocusStates];
      successFocusStates[2] = true;
      this.setData({
        showThirdSuccess: true,
        successFocusStates,
        currentFocusedSuccessIndex: 2,
      });
      return;
    }
  },

  // 获取字数统计文本
  getCharCountText(text, maxLength) {
    const length = text ? text.length : 0;
    const remaining = maxLength - length;

    if (remaining <= 10) {
      return `还可以写 ${remaining} 字`;
    }
    return `${length}/${maxLength}`;
  },

  // 输入描述
  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value,
    });
    this.updateCompletion();
  },

  // 更新完成度徽章
  updateCompletion() {
    const { selectedEmotion, energyLevel, gratitudeItems, successItems, description } =
      this.data;
    let score = 0;
    if (selectedEmotion) score += 1;
    if (energyLevel > 0) score += 1;
    if (gratitudeItems.some((item) => item && item.trim())) score += 1;
    if (successItems.some((item) => item && item.trim())) score += 1;
    if (description && description.trim().length > 0) score += 1;
    this.setData({ completionScore: score });
  },

  // 切换标签（增强版：添加触觉反馈和音效）
  toggleTag(e) {
    // 防止事件冒泡
    if (!e || !e.currentTarget || !e.currentTarget.dataset) {
      console.warn("⚠️ toggleTag: 事件对象异常", e);
      return;
    }

    const tagId = e.currentTarget.dataset.id;

    // 验证 tagId 是否有效
    if (!tagId) {
      console.warn("⚠️ toggleTag: tagId 为空");
      return;
    }

    const selectedTags = [...this.data.selectedTags];
    const index = selectedTags.indexOf(tagId);

    // 切换选中状态
    if (index > -1) {
      // 取消选中
      selectedTags.splice(index, 1);
      console.log(`✅ 取消选中标签: ${tagId}`);
    } else {
      // 选中
      selectedTags.push(tagId);
      console.log(`✅ 选中标签: ${tagId}`);

      // 触觉反馈（轻微震动）
      wx.vibrateShort({
        type: "light",
        success: () => {
          console.log("✅ 触觉反馈成功");
        },
        fail: (err) => {
          console.log("⚠️ 触觉反馈失败", err);
        },
      });
    }

    // 更新数据
    this.setData({
      selectedTags,
    });

    // 显示轻量提示（可选）
    const tag = this.data.tags.find((t) => t.id === tagId);
    if (tag) {
      const action = index > -1 ? "已移除" : "已添加";
      console.log(`${tag.icon} ${tag.name} ${action}`);
    }
  },

  // 保存情绪记录（改进版：支持本地存储降级）
  async saveEmotion() {
    if (!this.data.selectedEmotion) {
      wx.showToast({
        title: "轻轻选择一个情绪吧 🌸",
        icon: "none",
      });
      return;
    }

    wx.showLoading({ title: "正在温柔记录..." });

    try {
      const emotion = this.data.emotions.find(
        (e) => e.id === this.data.selectedEmotion
      );

      // 过滤掉空的感恩和成功事项
      const gratitudeList = this.data.gratitudeItems.filter((item) =>
        item.trim()
      );
      const successList = this.data.successItems.filter((item) => item.trim());

      const emotionData = {
        emotionId: this.data.selectedEmotion,
        emotionName: emotion.name,
        emotionIcon: emotion.icon,
        energyLevel: this.data.energyLevel,
        gratitudeItems: gratitudeList,
        successItems: successList,
        description: this.data.description,
        tags: this.data.selectedTags,
        createTime: new Date().toISOString(),
      };

      // 调试日志：确认标签数据
      console.log("📝 准备保存的情绪数据：", {
        情绪: emotionData.emotionName,
        能量指数: emotionData.energyLevel,
        感恩事项: emotionData.gratitudeItems.length,
        成功事项: emotionData.successItems.length,
        标签: emotionData.tags,
        标签数量: emotionData.tags.length,
      });

      // 尝试保存到云数据库
      try {
        await db.collection("emotions").add({
          data: {
            ...emotionData,
            createTime: db.serverDate(),
          },
        });
        console.log("✅ 情绪记录已保存到云数据库");
      } catch (cloudErr) {
        console.warn(
          "⚠️ 云数据库保存失败，使用本地存储",
          cloudErr.errMsg || cloudErr
        );

        // 降级方案：保存到本地存储
        const localEmotions = wx.getStorageSync("localEmotions") || [];
        localEmotions.unshift(emotionData); // 添加到数组开头

        // 只保留最近100条记录
        if (localEmotions.length > 100) {
          localEmotions.length = 100;
        }

        wx.setStorageSync("localEmotions", localEmotions);
        console.log("✅ 情绪记录已保存到本地存储");
      }

      wx.hideLoading();
      wx.showToast({
        title: "今日日记已温柔记录 💝",
        icon: "success",
      });

      // 重置表单
      setTimeout(() => {
        this.setData({
          selectedEmotion: "",
          selectedEmotionName: "",
          selectedEmotionIcon: "",
          emotionFeedback: "",
          energyLevel: 0,
          gratitudeItems: ["", "", ""],
          successItems: ["", "", ""],
          description: "",
          selectedTags: [],
          aiReply: "",
          showMoreGratitude: false,
          showMoreSuccess: false,
          showThirdGratitude: false,
          showThirdSuccess: false,
          completionScore: 0,
        });
        // 刷新温暖一句
        this.loadEmotionQuote();
      }, 1500);
    } catch (err) {
      console.error("❌ 保存情绪记录失败", err);
      wx.hideLoading();
      wx.showToast({
        title: "保存失败，请稍后再试 🌸",
        icon: "none",
        duration: 2000,
      });
    }
  },

  // 获取 AI 温柔回应（流式输出）
  getAIReflection() {
    if (!this.data.selectedEmotion && !this.data.description) {
      wx.showToast({ title: "先选择情绪或写一点内容吧 🌸", icon: "none" });
      return;
    }

    const emotion = this.data.emotions.find(
      (e) => e.id === this.data.selectedEmotion
    );
    const emotionName = emotion ? emotion.name : "未选择";

    const selectedTagNames = this.data.selectedTags
      .map((id) => {
        const tag = this.data.tags.find((t) => t.id === id);
        return tag ? tag.name : "";
      })
      .filter(Boolean);

    this.setData({ aiLoading: true, aiReply: "" });

    const systemPrompt = `你是一位温柔、善解人意的情绪陪伴者。
你的任务是：
1. 先共情、理解用户当前的情绪状态
2. 用温暖、不评判的语言回应
3. 给出一点温柔的建议或新视角
4. 不要指责，不要简单地说"加油"
5. 不要诊断、不要贴标签
6. 用中文回答，语言自然、有温度

回应风格：
- 像一个真正关心你的朋友
- 先接住情绪，再给建议
- 用"我感受到..."、"或许..."这样的表达
- 适当使用温暖的emoji，但不要过多`;

    const tagsText =
      selectedTagNames.length > 0 ? selectedTagNames.join("、") : "无";
    const descText =
      this.data.description?.trim() || "（用户没有填写详细描述）";

    const userPrompt = `当前情绪：${emotionName}
相关标签：${tagsText}
具体描述：${descText}

请给我一段温柔的回应。`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    console.log("[emotion] 🔥 开始流式请求");

    // 🔥 使用流式调用
    this._currentStreamTask = callAIStream({
      messages,
      model: "gpt-5-mini",
      onChunk: (chunk, fullText) => {
        // 实时更新 AI 回复内容
        this.setData({ aiReply: fullText });
      },
      onComplete: (fullText) => {
        console.log("[emotion] ✅ 流式输出完成");
        this.setData({ aiReply: fullText, aiLoading: false });
        this._currentStreamTask = null;
      },
      onError: (err) => {
        console.error("[emotion] ❌ 获取温柔回应失败:", err.message);
        // 温柔的兜底回复
        const fallbackReply = `我感受到你现在的情绪，这种感受是真实的，也是被允许的。

有时候，我们只是需要一个安静的角落，让自己慢慢消化这些感受。

如果你愿意，可以试着深呼吸几次，给自己一点温柔的时间。你已经很努力了 💝`;

        this.setData({ aiReply: fallbackReply, aiLoading: false });
        this._currentStreamTask = null;
      },
    });
  },

  // 查看历史
  viewHistory() {
    wx.navigateTo({
      url: "/pages/emotion/history/history",
    });
  },
});
