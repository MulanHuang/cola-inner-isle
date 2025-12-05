// pages/chakraHistory/index.js
const { CHAKRA_INFO } = require("../chakraTest/data/chakraInfo.js");

Page({
  data: {
    loading: true,
    historyList: [],
  },

  onLoad(options) {
    this.loadHistory();
  },

  // 下载历史记录
  async loadHistory() {
    this.setData({ loading: true });

    try {
      // 先尝试从云数据库下载
      const cloudHistory = await this.loadFromCloud();

      if (cloudHistory && cloudHistory.length > 0) {
        this.processHistory(cloudHistory);
      } else {
        // 如果云数据库没有数据，尝试从本地存储下载
        const localHistory = this.loadFromLocal();
        this.processHistory(localHistory);
      }
    } catch (err) {
      console.error("加载历史记录失败：", err);

      // 降级到本地存储
      const localHistory = this.loadFromLocal();
      this.processHistory(localHistory);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 从云数据库下载
  async loadFromCloud() {
    try {
      if (!wx.cloud) {
        console.warn("云开发未初始化");
        return [];
      }

      const db = wx.cloud.database();
      const res = await db
        .collection("chakra_history")
        .orderBy("testDate", "desc")
        .limit(20) // 最多显示20条记录
        .get();

      console.log("从云数据库加载了", res.data.length, "条记录");
      return res.data;
    } catch (err) {
      console.warn("云数据库加载失败：", err);
      return [];
    }
  },

  // 从本地存储加载
  loadFromLocal() {
    try {
      const keys = wx.getStorageInfoSync().keys;
      const historyKeys = keys.filter((key) =>
        key.startsWith("chakra_history_")
      );

      const historyList = historyKeys
        .map((key) => {
          try {
            const data = wx.getStorageSync(key);
            return {
              ...data,
              _id: key,
              testDate: data.testDate || new Date(data.timestamp).toISOString(),
            };
          } catch (err) {
            console.warn("读取本地记录失败：", key, err);
            return null;
          }
        })
        .filter((item) => item !== null);

      // 按时间倒序排序
      historyList.sort((a, b) => b.timestamp - a.timestamp);

      console.log("从本地存储加载了", historyList.length, "条记录");
      return historyList;
    } catch (err) {
      console.error("本地存储加载失败：", err);
      return [];
    }
  },

  // 处理历史记录数据
  processHistory(rawHistory) {
    const historyList = rawHistory
      .filter((item) => {
        // 过滤掉没有有效 results 数据的记录
        if (!item || !item.results) {
          console.warn("跳过有效记录（缺少 results）：", item);
          return false;
        }
        // 验证 results 包含必要的脉轮数据
        const requiredChakras = [
          "root",
          "sacral",
          "solar",
          "heart",
          "throat",
          "third_eye",
          "crown",
        ];
        const hasAllChakras = requiredChakras.every(
          (type) =>
            item.results[type] &&
            typeof item.results[type].percentage === "number"
        );
        if (!hasAllChakras) {
          console.warn("跳过不完整的记录（缺少脉轮数据）：", item);
          return false;
        }
        return true;
      })
      .map((item) => {
        const date = new Date(item.testDate);
        const results = item.results;

        // 式化日期
        const dateText = this.formatDate(date);
        const timeText = this.formatTime(date);

        // 计算整体状态
        const status = this.calculateOverallStatus(results);

        // 生成脉轮预览数据
        const chakraPreview = this.generateChakraPreview(results);

        return {
          id: item._id,
          dateText: dateText,
          timeText: timeText,
          statusIcon: status.icon,
          statusText: status.text,
          chakraPreview: chakraPreview,
          rawData: item, // 保存原始数据，用于查看详情
        };
      });

    this.setData({ historyList });
  },

  // 式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  },

  // 从本地存储加载 从本地存储加载式化时间
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  },

  // 计算整体状态
  calculateOverallStatus(results) {
    const chakraTypes = [
      "root",
      "sacral",
      "solar",
      "heart",
      "throat",
      "third_eye",
      "crown",
    ];
    const percentages = chakraTypes.map((type) => results[type].percentage);

    const avgPercentage =
      percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const lowCount = percentages.filter((p) => p < 50).length;
    const highCount = percentages.filter((p) => p >= 80).length;

    if (avgPercentage >= 75 && lowCount === 0) {
      return { icon: "🌟", text: "能量充沛·整体平衡" };
    } else if (avgPercentage >= 60 && lowCount <= 1) {
      return { icon: "⭐", text: "基本平衡·持续成长" };
    } else if (lowCount >= 4) {
      return { icon: "💫", text: "多处失衡·需要关注" };
    } else {
      return { icon: "✨", text: "部分失衡·正在调整" };
    }
  },

  // 生成脉轮预览数据（只显示前3个）
  generateChakraPreview(results) {
    const chakraTypes = [
      "root",
      "sacral",
      "solar",
      "heart",
      "throat",
      "third_eye",
      "crown",
    ];

    return chakraTypes.slice(0, 3).map((type) => ({
      type: type,
      emoji: CHAKRA_INFO[type].emoji,
      percentage: results[type].percentage,
      color: CHAKRA_INFO[type].color,
    }));
  },

  // 查看详情
  viewDetail(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.historyList[index];

    // 验证数据完整性
    if (!item || !item.rawData || !item.rawData.results) {
      console.error("历史记录数据不完整：", item);
      wx.showToast({
        title: "数据加载失败，请重试",
        icon: "none",
      });
      return;
    }

    const results = item.rawData.results;

    // 验证所有脉轮数据都存在
    const requiredChakras = [
      "root",
      "sacral",
      "solar",
      "heart",
      "throat",
      "third_eye",
      "crown",
    ];
    const hasAllChakras = requiredChakras.every(
      (type) => results[type] && typeof results[type].percentage === "number"
    );

    if (!hasAllChakras) {
      console.error("脉轮数据不完整：", results);
      wx.showToast({
        title: "该记录数据不完整",
        icon: "none",
      });
      return;
    }

    console.log("准备跳转到结果页，数据：", results);

    // 跳转到结果页，从本地存储加载 递结果数据
    wx.navigateTo({
      url: `/pages/chakraResult/index?results=${encodeURIComponent(
        JSON.stringify(results)
      )}`,
      fail: (err) => {
        console.error("跳转失败：", err);
        wx.showToast({
          title: "页面跳转失败",
          icon: "none",
        });
      },
    });
  },

  // 开始测试
  goToTest() {
    wx.redirectTo({
      url: "/pages/chakraTest/index",
    });
  },

  // 返回首页
  backToHome() {
    wx.switchTab({
      url: "/pages/home/home",
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadHistory().then(() => {
      wx.stopPullDownRefresh();
    });
  },
});
