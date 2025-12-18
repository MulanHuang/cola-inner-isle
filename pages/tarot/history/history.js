// pages/tarot/history/history.js
const db = wx.cloud.database();

Page({
  data: {
    list: [],
    loading: false,
    page: 0,
    pageSize: 20,
    hasMore: true,
    tarotCollection: "tarotDraws",
  },

  goToTarot() {
    wx.navigateTo({
      url: "/pages/tarot/tarot",
    });
  },

  onLoad() {
    this.fetchHistory(true);
  },

  onShow() {
    // 返回页面时刷新，确保最新记录显示
    this.fetchHistory(true);
  },

  onPullDownRefresh() {
    this.fetchHistory(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.fetchHistory(false);
    }
  },

  async fetchHistory(refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const page = refresh ? 0 : this.data.page;
    const { pageSize } = this.data;

    try {
      // 直接从数据库查询历史记录
      const { list: newList, hasMore } = await this.fetchHistoryFromDBSimple(
        page,
        pageSize
      );
      this.setData({
        list: refresh ? newList : this.data.list.concat(newList),
        page: refresh ? 1 : page + 1,
        hasMore,
      });
    } catch (err) {
      console.error("加载塔罗历史失败", err);
      wx.showToast({ title: "加载失败，请稍后再试", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 客户端简易查询（不做 lookup），兼容云函数未部署或权限问题
  async fetchHistoryFromDBSimple(page, pageSize) {
    const buildList = (items = []) =>
      items.map((item) => {
        return {
          _id: item._id,
          cardId: item.cardId,
          cardName: item.cardName || "未知牌",
          cardImage: item.cardImage || "",
          isReversed: !!item.isReversed,
          question: item.question || "",
          interpretation: item.interpretation || "",
          date: item.date || "",
          createTime: item.createTime,
        };
      });

    const collectionName = this.data.tarotCollection;
    try {
      const res = await db
        .collection(collectionName)
        .where({
          _openid: "{openid}",
        })
        .orderBy("createTime", "desc")
        .skip(page * pageSize)
        .limit(pageSize)
        .get();

      const list = buildList(res.data || []);
      return {
        list,
        hasMore: list.length === pageSize,
      };
    } catch (err) {
      if (err && err.errCode === -502005 && collectionName !== "tarotDraw") {
        // 集合不存在时兼容旧表名
        const res = await db
          .collection("tarotDraw")
          .where({
            _openid: "{openid}",
          })
          .orderBy("createTime", "desc")
          .skip(page * pageSize)
          .limit(pageSize)
          .get();

        const list = buildList(res.data || []);
        return {
          list,
          hasMore: list.length === pageSize,
        };
      }
      throw err;
    }
  },
});
