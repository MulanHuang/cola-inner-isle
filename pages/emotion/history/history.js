// pages/emotion/history/history.js
const db = wx.cloud.database();

Page({
  data: {
    emotions: [],
    totalCount: 0,
    recentDays: 0,
    // 标签映射表（与 emotion.js 保持一致）
    tagMap: {
      work: { name: "工作", icon: "💼" },
      study: { name: "学习", icon: "📚" },
      relationship: { name: "人际关系", icon: "👥" },
      family: { name: "家庭", icon: "🏠" },
      love: { name: "爱情", icon: "💕" },
      health: { name: "健康", icon: "🏃" },
      money: { name: "财务", icon: "💰" },
      growth: { name: "成长", icon: "🌱" },
      dream: { name: "梦想", icon: "⭐" },
      gratitude: { name: "感恩", icon: "🙏" },
      happiness: { name: "小确幸", icon: "✨" },
      success: { name: "成功", icon: "🎯" },
      other: { name: "其他", icon: "🔖" },
    },
  },

  onLoad() {
    this.loadEmotionHistory();
    this.calculateStats();
  },

  // 转换标签 ID 为标签对象（包含名称和图标）
  convertTagsToDisplay(tagIds) {
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return [];
    }

    return tagIds
      .map((tagId) => {
        const tagInfo = this.data.tagMap[tagId];
        if (tagInfo) {
          return {
            id: tagId,
            name: tagInfo.name,
            icon: tagInfo.icon,
            displayText: `${tagInfo.icon} ${tagInfo.name}`,
          };
        }
        // 如果找不到对应的标签，返回 ID 本身
        return {
          id: tagId,
          name: tagId,
          icon: "🔖",
          displayText: `🔖 ${tagId}`,
        };
      })
      .filter(Boolean);
  },

  // 加载情绪历史（改进版：支持本地存储降级）
  async loadEmotionHistory() {
    wx.showLoading({ title: "加载中..." });

    try {
      let emotions = [];

      // 尝试从云数据库加载
      try {
        const res = await db
          .collection("emotions")
          .orderBy("createTime", "desc")
          .limit(100)
          .get();

        emotions = res.data.map((item) => ({
          ...item,
          timeStr: this.formatTime(item.createTime),
          // 转换标签 ID 为显示对象
          tagsDisplay: this.convertTagsToDisplay(item.tags),
        }));

        console.log("✅ 从云数据库加载历史记录成功", emotions.length, "条");
        console.log("✅ 标签数据已转换", emotions[0]?.tagsDisplay);
      } catch (cloudErr) {
        console.warn(
          "⚠️ 云数据库加载失败，使用本地存储",
          cloudErr.errMsg || cloudErr
        );

        // 降级方案：从本地存储加载
        const localEmotions = wx.getStorageSync("localEmotions") || [];
        emotions = localEmotions.map((item) => ({
          ...item,
          timeStr: this.formatTime(item.createTime),
          // 转换标签 ID 为显示对象
          tagsDisplay: this.convertTagsToDisplay(item.tags),
        }));

        console.log("✅ 从本地存储加载历史记录", emotions.length, "条");
        console.log("✅ 标签数据已转换", emotions[0]?.tagsDisplay);
      }

      this.setData({
        emotions,
        totalCount: emotions.length,
      });

      wx.hideLoading();
    } catch (err) {
      console.error("❌ 加载情绪历史失败", err);
      wx.hideLoading();
      wx.showToast({
        title: "加载失败 🌸",
        icon: "none",
      });
    }
  },

  // 计算统计数据（改进版：支持本地存储降级）
  async calculateStats() {
    try {
      let emotionData = [];

      // 尝试从云数据库加载
      try {
        const res = await db
          .collection("emotions")
          .orderBy("createTime", "desc")
          .get();
        emotionData = res.data;
      } catch (cloudErr) {
        // 降级方案：从本地存储加载
        emotionData = wx.getStorageSync("localEmotions") || [];
      }

      // 计算连续记录天数
      let recentDays = 0;
      if (emotionData.length > 0) {
        const dates = emotionData.map((item) => {
          const date = new Date(item.createTime);
          return date.toDateString();
        });

        const uniqueDates = [...new Set(dates)].sort((a, b) => {
          return new Date(b) - new Date(a);
        });

        // 从今天开始往前计算连续天数
        const today = new Date().toDateString();
        if (uniqueDates[0] === today) {
          recentDays = 1;
          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i - 1]);
            const currDate = new Date(uniqueDates[i]);
            const diffDays = Math.floor(
              (prevDate - currDate) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === 1) {
              recentDays++;
            } else {
              break;
            }
          }
        }
      }

      this.setData({
        recentDays,
      });
    } catch (err) {
      console.error("❌ 计算统计数据失败", err);
    }
  },

  // 格式化时间
  formatTime(date) {
    const d = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hour = d.getHours().toString().padStart(2, "0");
    const minute = d.getMinutes().toString().padStart(2, "0");

    if (d >= today) {
      return `今天 ${hour}:${minute}`;
    } else if (d >= yesterday) {
      return `昨天 ${hour}:${minute}`;
    } else {
      return `${month}-${day} ${hour}:${minute}`;
    }
  },
});
