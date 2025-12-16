// pages/emotion/history/history.js
const db = wx.cloud.database();

// 配置常量
const CONFIG = {
  MAX_RECORDS: 200, // 最大存储/查询记录数
  INITIAL_DISPLAY: 5, // 初始显示条数
  LOAD_MORE_COUNT: 15, // 每次加载更多条数
};

Page({
  data: {
    allEmotions: [], // 所有加载的记录
    emotions: [], // 当前显示的记录
    displayCount: CONFIG.INITIAL_DISPLAY, // 当前显示数量
    totalCount: 0,
    recentDays: 0,
    hasMore: false, // 是否有更多记录可加载
    isLoadingMore: false, // 是否正在加载更多
    isDeleting: false, // 是否正在删除
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

  // 加载情绪历史（改进版：合并云数据库和本地存储，支持分页显示）
  async loadEmotionHistory() {
    wx.showLoading({ title: "加载中..." });

    try {
      let cloudEmotions = [];
      let localEmotions = [];

      // 1. 尝试从云数据库加载（最多200条）
      try {
        const res = await db
          .collection("emotions")
          .orderBy("createTime", "desc")
          .limit(CONFIG.MAX_RECORDS)
          .get();

        cloudEmotions = res.data.map((item) => ({
          ...item,
          source: "cloud",
          timeStr: this.formatTime(item.createTime),
          tagsDisplay: this.convertTagsToDisplay(item.tags),
        }));

        console.log(
          "✅ 从云数据库加载历史记录成功",
          cloudEmotions.length,
          "条"
        );
      } catch (cloudErr) {
        console.warn("⚠️ 云数据库加载失败", cloudErr.errMsg || cloudErr);
      }

      // 2. 同时从本地存储加载
      const localData = wx.getStorageSync("localEmotions") || [];
      localEmotions = localData.map((item, index) => ({
        ...item,
        source: "local",
        _id: item._id || `local_legacy_${index}`,
        timeStr: this.formatTime(item.createTime),
        tagsDisplay: this.convertTagsToDisplay(item.tags),
      }));

      console.log("✅ 从本地存储加载历史记录", localEmotions.length, "条");

      // 3. 合并数据（去重：本地数据可能与云数据重复，以云数据为准）
      const cloudTimes = new Set(cloudEmotions.map((e) => e.createTime));
      const uniqueLocalEmotions = localEmotions.filter(
        (e) => !cloudTimes.has(e.createTime)
      );

      // 4. 合并并按时间排序，限制最多200条
      let allEmotions = [...cloudEmotions, ...uniqueLocalEmotions].sort(
        (a, b) => new Date(b.createTime) - new Date(a.createTime)
      );

      if (allEmotions.length > CONFIG.MAX_RECORDS) {
        allEmotions = allEmotions.slice(0, CONFIG.MAX_RECORDS);
      }

      console.log("✅ 合并后总记录数", allEmotions.length, "条");

      // 5. 分页显示：初始只显示前 N 条
      const displayCount = Math.min(CONFIG.INITIAL_DISPLAY, allEmotions.length);
      const displayEmotions = allEmotions.slice(0, displayCount);

      this.setData({
        allEmotions: allEmotions,
        emotions: displayEmotions,
        displayCount: displayCount,
        totalCount: allEmotions.length,
        hasMore: allEmotions.length > displayCount,
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

  // 加载更多记录
  loadMore() {
    if (!this.data.hasMore || this.data.isLoadingMore) return;

    this.setData({ isLoadingMore: true });

    const { allEmotions, displayCount } = this.data;
    const newDisplayCount = Math.min(
      displayCount + CONFIG.LOAD_MORE_COUNT,
      allEmotions.length
    );
    const newDisplayEmotions = allEmotions.slice(0, newDisplayCount);

    setTimeout(() => {
      this.setData({
        emotions: newDisplayEmotions,
        displayCount: newDisplayCount,
        hasMore: newDisplayCount < allEmotions.length,
        isLoadingMore: false,
      });
    }, 300); // 轻微延迟，提升加载体验
  },

  // 计算统计数据（改进版：合并云数据库和本地存储）
  async calculateStats() {
    try {
      let cloudData = [];
      let localData = [];

      // 尝试从云数据库加载
      try {
        const res = await db
          .collection("emotions")
          .orderBy("createTime", "desc")
          .get();
        cloudData = res.data;
      } catch (cloudErr) {
        console.warn("⚠️ 统计：云数据库加载失败", cloudErr.errMsg || cloudErr);
      }

      // 从本地存储加载
      localData = wx.getStorageSync("localEmotions") || [];

      // 合并数据（使用 createTime 去重）
      const cloudTimes = new Set(
        cloudData.map((e) => new Date(e.createTime).toISOString())
      );
      const uniqueLocal = localData.filter(
        (e) => !cloudTimes.has(new Date(e.createTime).toISOString())
      );
      const emotionData = [...cloudData, ...uniqueLocal];

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

  // 确认删除记录
  confirmDelete(e) {
    const { id, source, index } = e.currentTarget.dataset;

    wx.showModal({
      title: "确认删除",
      content: "删除后无法恢复，确定要删除这条记录吗？",
      confirmText: "删除",
      confirmColor: "#ff6b6b",
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          this.deleteRecord(id, source, index);
        }
      },
    });
  },

  // 执行删除记录
  async deleteRecord(id, source, index) {
    if (this.data.isDeleting) return;

    this.setData({ isDeleting: true });
    wx.showLoading({ title: "删除中...", mask: true });

    try {
      // 根据数据来源决定删除方式
      if (source === "cloud") {
        // 从云数据库删除
        try {
          await db.collection("emotions").doc(id).remove();
          console.log("✅ 从云数据库删除成功", id);
        } catch (cloudErr) {
          console.error("❌ 云数据库删除失败", cloudErr);
          throw new Error("云数据库删除失败");
        }
      } else {
        // 从本地存储删除
        const localEmotions = wx.getStorageSync("localEmotions") || [];
        const newLocalEmotions = localEmotions.filter(
          (item) => item._id !== id
        );
        wx.setStorageSync("localEmotions", newLocalEmotions);
        console.log("✅ 从本地存储删除成功", id);
      }

      // 更新页面数据
      const { allEmotions, displayCount } = this.data;
      const newAllEmotions = allEmotions.filter((item) => item._id !== id);
      const newDisplayCount = Math.min(displayCount, newAllEmotions.length);
      const newDisplayEmotions = newAllEmotions.slice(0, newDisplayCount);

      this.setData({
        allEmotions: newAllEmotions,
        emotions: newDisplayEmotions,
        displayCount: newDisplayCount,
        totalCount: newAllEmotions.length,
        hasMore: newDisplayCount < newAllEmotions.length,
        isDeleting: false,
      });

      // 重新计算统计数据
      this.calculateStats();

      wx.hideLoading();
      wx.showToast({
        title: "已删除 🗑️",
        icon: "success",
      });
    } catch (err) {
      console.error("❌ 删除记录失败", err);
      this.setData({ isDeleting: false });
      wx.hideLoading();
      wx.showToast({
        title: "删除失败，请重试",
        icon: "none",
      });
    }
  },
});
