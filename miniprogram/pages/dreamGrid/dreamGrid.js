// pages/dreamGrid/dreamGrid.js

/**
 * 人生梦想九宫格 - 自我探索工具
 * 支持编辑模式、总览模式和导出海报功能
 */

// 默认九宫格数据
const DEFAULT_AREAS = [
  { id: 1, key: "habit", title: "#1 习惯 & 日常", goal: "", actions: [] },
  { id: 2, key: "health", title: "#2 健康 & 情绪", goal: "", actions: [] },
  {
    id: 3,
    key: "relationship",
    title: "#3 人际 & 感情",
    goal: "",
    actions: [],
  },
  { id: 4, key: "career", title: "#4 学业 & 事业", goal: "", actions: [] },
  { id: 5, key: "growth", title: "#5 个人成长", goal: "", actions: [] },
  { id: 6, key: "finance", title: "#6 财务 & 投资", goal: "", actions: [] },
  { id: 7, key: "knowledge", title: "#7 知识 & 技能", goal: "", actions: [] },
  { id: 8, key: "hobby", title: "#8 兴趣 & 爱好", goal: "", actions: [] },
  { id: 9, key: "reflection", title: "#9 反思 & 洞察", goal: "", actions: [] },
];

// 本地存储 key
const STORAGE_KEY = "dreamGridData";
const SAVE_TIP_KEY = "hasShownSaveTip";

// 九宫格柔和背景色 (温暖米白色系)
const GRID_COLORS = [
  "#FFF7F0",
  "#F8F4FF",
  "#F3FBFF",
  "#F8FFF5",
  "#FFF5F8",
  "#FFFBF0",
  "#F5F8FF",
  "#FFF8F5",
  "#F7FFF7",
];

Page({
  data: {
    areas: [],
    mode: "edit",
    editingAreaIndex: null,
    tempGoal: "",
    tempActionInput: "",
    tempActions: [],
    posterGenerating: false,
    gridColors: GRID_COLORS,
    completedCount: 0,
    // 弹窗交互相关
    showGoalError: false,
    actionInputFocus: false,
    newActionIndex: -1,
    // 首次保存提示
    showSaveTip: false,
    saveTipFading: false,
    // 导航栏高度
    navBarHeight: 0,
  },

  onLoad() {
    this.loadFromStorage();
  },

  // 导航栏准备完成
  onNavReady(e) {
    this.setData({
      navBarHeight: e.detail.navBarHeight || 0,
    });
  },

  loadFromStorage() {
    try {
      const savedData = wx.getStorageSync(STORAGE_KEY);
      if (savedData && Array.isArray(savedData) && savedData.length === 9) {
        const areasWithColors = savedData.map((area, index) => ({
          ...area,
          color: area.color || GRID_COLORS[index],
        }));
        this.setData({ areas: areasWithColors });
        this.updateCompletedCount(areasWithColors);
        console.log("✅ 从本地存储加载九宫格数据");
      } else {
        const defaultWithColors = DEFAULT_AREAS.map((area, index) => ({
          ...area,
          color: GRID_COLORS[index],
        }));
        this.setData({ areas: defaultWithColors });
        this.updateCompletedCount(defaultWithColors);
        console.log("✅ 使用默认九宫格数据");
      }
    } catch (err) {
      console.error("❌ 加载本地存储失败", err);
      const defaultWithColors = DEFAULT_AREAS.map((area, index) => ({
        ...area,
        color: GRID_COLORS[index],
      }));
      this.setData({ areas: defaultWithColors });
      this.updateCompletedCount(defaultWithColors);
    }
  },

  // 更新完成度计数
  updateCompletedCount(areas) {
    const count = areas.filter((area) => area.goal && area.goal.trim()).length;
    this.setData({ completedCount: count });
  },

  saveToStorage() {
    try {
      wx.setStorageSync(STORAGE_KEY, this.data.areas);
      console.log("✅ 九宫格数据已保存");
    } catch (err) {
      console.error("❌ 保存本地存储失败", err);
    }
  },

  // 显示首次保存提示
  showFirstSaveTip() {
    try {
      const hasShown = wx.getStorageSync(SAVE_TIP_KEY);
      if (!hasShown) {
        this.setData({ showSaveTip: true, saveTipFading: false });
        // 2秒后开始淡出
        setTimeout(() => {
          this.setData({ saveTipFading: true });
          // 0.5秒淡出动画后隐藏
          setTimeout(() => {
            this.setData({ showSaveTip: false });
          }, 500);
        }, 2000);
        // 标记已显示
        wx.setStorageSync(SAVE_TIP_KEY, true);
      }
    } catch (err) {
      console.error("❌ 处理首次保存提示失败", err);
    }
  },

  switchMode(e) {
    const newMode = e.currentTarget.dataset.mode;
    this.setData({ mode: newMode });
  },

  // 总览模式点击宫格，切换到编辑模式并打开弹窗
  onOverviewItemTap(e) {
    const index = e.currentTarget.dataset.index;
    const area = this.data.areas[index];
    this.setData({
      mode: "edit",
      editingAreaIndex: index,
      tempGoal: area.goal || "",
      tempActionInput: "",
      tempActions: [...(area.actions || [])],
      showGoalError: false,
      newActionIndex: -1,
    });
  },

  openEditModal(e) {
    const index = e.currentTarget.dataset.index;
    const area = this.data.areas[index];
    this.setData({
      editingAreaIndex: index,
      tempGoal: area.goal || "",
      tempActionInput: "",
      tempActions: [...(area.actions || [])],
      showGoalError: false,
      newActionIndex: -1,
    });
  },

  closeEditModal() {
    this.setData({
      editingAreaIndex: null,
      tempGoal: "",
      tempActionInput: "",
      tempActions: [],
      showGoalError: false,
      actionInputFocus: false,
      newActionIndex: -1,
    });
  },

  stopPropagation() {},

  onGoalInput(e) {
    this.setData({
      tempGoal: e.detail.value,
      showGoalError: false, // 用户开始输入时隐藏错误提示
    });
  },

  onTempActionInput(e) {
    this.setData({ tempActionInput: e.detail.value });
  },

  addAction() {
    const input = this.data.tempActionInput.trim();
    if (!input) {
      wx.showToast({ title: "请输入行动计划", icon: "none" });
      return;
    }
    const tempActions = [...this.data.tempActions, input];
    const newIndex = tempActions.length - 1;

    // 设置新添加项的高亮索引，清空输入，保持focus
    this.setData({
      tempActions,
      tempActionInput: "",
      newActionIndex: newIndex,
      actionInputFocus: true,
    });

    // 0.4秒后取消高亮
    setTimeout(() => {
      this.setData({ newActionIndex: -1 });
    }, 400);
  },

  removeAction(e) {
    const index = e.currentTarget.dataset.index;
    const tempActions = [...this.data.tempActions];
    tempActions.splice(index, 1);
    this.setData({ tempActions, newActionIndex: -1 });
  },

  saveAreaEdit() {
    const { tempGoal, tempActions, editingAreaIndex, areas } = this.data;

    // 验证目标不为空
    if (!tempGoal.trim()) {
      this.setData({ showGoalError: true });
      // 2秒后自动隐藏错误提示
      setTimeout(() => {
        this.setData({ showGoalError: false });
      }, 2000);
      return;
    }

    const newAreas = [...areas];
    newAreas[editingAreaIndex] = {
      ...newAreas[editingAreaIndex],
      goal: tempGoal.trim(),
      actions: [...tempActions],
    };
    this.setData({ areas: newAreas });
    this.updateCompletedCount(newAreas);
    this.saveToStorage();
    this.closeEditModal();

    // 显示首次保存提示
    this.showFirstSaveTip();

    wx.showToast({ title: "保存成功 ✨", icon: "success" });
  },

  onExportPosterTap() {
    if (this.data.mode === "edit") {
      this.setData({ mode: "overview" });
      setTimeout(() => {
        this.generatePoster();
      }, 300);
    } else {
      this.generatePoster();
    }
  },

  generatePoster() {
    const { areas, posterGenerating } = this.data;
    if (posterGenerating) return;

    this.setData({ posterGenerating: true });
    wx.showLoading({ title: "正在生成海报..." });

    const ctx = wx.createCanvasContext("posterCanvas");
    const canvasWidth = 750;
    const canvasHeight = 1100;

    // 绘制背景 - 米白色
    ctx.setFillStyle("#FFFDFB");
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 绘制顶部标题
    ctx.setFillStyle("#2D2A26");
    ctx.setFontSize(36);
    ctx.setTextAlign("center");
    ctx.fillText("✨ 人生梦想九宫格", canvasWidth / 2, 60);

    // 副标题
    ctx.setFillStyle("#A8A4A0");
    ctx.setFontSize(18);
    ctx.fillText("我的目标与行动计划", canvasWidth / 2, 92);

    // 日期
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    ctx.fillText(`记录于：${dateStr}`, canvasWidth / 2, 118);

    // 绘制九宫格
    const gridStartY = 148;
    const gridSize = 218;
    const gridGap = 14;
    const gridRadius = 16;
    const gridStartX = (canvasWidth - gridSize * 3 - gridGap * 2) / 2;

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = gridStartX + col * (gridSize + gridGap);
      const y = gridStartY + row * (gridSize + gridGap);
      const area = areas[i];

      // 绘制圆角矩形背景
      this.drawRoundRect(ctx, x, y, gridSize, gridSize, gridRadius);
      ctx.setFillStyle(area.color || GRID_COLORS[i]);
      ctx.fill();

      // 标题
      ctx.setFillStyle("#2D2A26");
      ctx.setFontSize(15);
      ctx.setTextAlign("left");
      const titleText =
        area.title.length > 12
          ? area.title.substring(0, 12) + "..."
          : area.title;
      ctx.fillText(titleText, x + 14, y + 26);

      // 目标
      ctx.setFillStyle("#666666");
      ctx.setFontSize(12);
      if (area.goal) {
        const goalText =
          area.goal.length > 28
            ? area.goal.substring(0, 28) + "..."
            : area.goal;
        this.drawWrappedText(
          ctx,
          goalText,
          x + 14,
          y + 50,
          gridSize - 28,
          17,
          2
        );
      } else {
        ctx.setFillStyle("#B8B4B0");
        ctx.fillText("等待你的灵感 ✨", x + 14, y + 50);
      }

      // 行动计划（最多3条）
      let offsetY = y + 95;
      ctx.setFillStyle("#9A9690");
      ctx.setFontSize(11);
      if (area.actions && area.actions.length > 0) {
        for (let j = 0; j < Math.min(area.actions.length, 3); j++) {
          const actionText =
            area.actions[j].length > 18
              ? area.actions[j].substring(0, 18) + "..."
              : area.actions[j];
          ctx.fillText(`· ${actionText}`, x + 14, offsetY);
          offsetY += 18;
        }
      }
    }

    // 底部励志文字
    ctx.setFillStyle("#D4A574");
    ctx.setFontSize(18);
    ctx.setTextAlign("center");
    ctx.fillText(
      "小步前进，也是很了不起的进展 ✨",
      canvasWidth / 2,
      canvasHeight - 60
    );

    // 底部来源文字
    ctx.setFillStyle("#B8B4B0");
    ctx.setFontSize(13);
    ctx.fillText(
      "Made with 💛 可乐心岛 · 人生梦想九宫格",
      canvasWidth / 2,
      canvasHeight - 32
    );

    // 绘制完成
    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: "posterCanvas",
          success: (res) => {
            wx.hideLoading();
            this.setData({ posterGenerating: false });
            wx.previewImage({
              urls: [res.tempFilePath],
              current: res.tempFilePath,
            });
          },
          fail: (err) => {
            console.error("❌ 生成海报失败", err);
            wx.hideLoading();
            this.setData({ posterGenerating: false });
            wx.showToast({ title: "生成海报失败，请重试", icon: "none" });
          },
        });
      }, 500);
    });
  },

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const chars = text.split("");
    let line = "";
    let lineCount = 0;
    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== "") {
        ctx.fillText(line, x, y + lineCount * lineHeight);
        line = chars[i];
        lineCount++;
        if (lineCount >= maxLines) {
          if (i < chars.length - 1) {
            ctx.fillText(line + "...", x, y + lineCount * lineHeight);
          }
          return;
        }
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y + lineCount * lineHeight);
  },

  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  },
});
