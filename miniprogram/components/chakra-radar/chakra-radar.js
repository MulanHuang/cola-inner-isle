// components/chakra-radar/chakra-radar.js (Canvas 2D API 版本)
Component({
  properties: {
    // 脉轮数据：[{ type, name, value, color }, ...]
    chakraData: {
      type: Array,
      value: [],
      observer: "onDataChange",
    },
    // 当前选中的脉轮类型
    selectedChakra: {
      type: String,
      value: "",
      observer: "onDataChange",
    },
  },

  data: {
    canvasWidth: 350,
    canvasHeight: 300,
    canvasReady: false,
    dpr: 1,
  },

  lifetimes: {
    ready() {
      console.log("🎨 chakra-radar 组件 ready");
      this.initCanvas2D();
    },
    detached() {
      console.log("🎨 chakra-radar 组件 detached");
      this.ctx = null;
      this.canvas = null;
      this.setData({ canvasReady: false });
    },
  },

  methods: {
    // 数据变化处理器
    onDataChange(newVal, oldVal) {
      console.log(
        "📊 数据变化检测到，canvasReady:",
        this.data.canvasReady,
        "ctx:",
        !!this.ctx
      );
      if (this.data.canvasReady && this.ctx) {
        this.drawRadar();
      } else {
        // Canvas 还未准备好，延迟重试
        setTimeout(() => {
          if (this.data.canvasReady && this.ctx) {
            this.drawRadar();
          } else {
            this.initCanvas2D();
          }
        }, 300);
      }
    },

    // 初始化 Canvas 2D
    initCanvas2D(retryCount = 0) {
      console.log("🎨 开始初始化 Canvas 2D，重试次数:", retryCount);

      const query = this.createSelectorQuery();
      query
        .select("#radarCanvas")
        .fields({ node: true, size: true })
        .exec((res) => {
          console.log("📐 Canvas query 结果:", res);

          if (!res || !res[0] || !res[0].node) {
            console.warn("❌ Canvas 节点获取失败");
            if (retryCount < 5) {
              setTimeout(() => this.initCanvas2D(retryCount + 1), 300);
            }
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            console.error("❌ Canvas 2D 上下文获取失败");
            return;
          }

          // 获取设备像素比
          const systemInfo = wx.getWindowInfo
            ? wx.getWindowInfo()
            : wx.getSystemInfoSync();
          const dpr = systemInfo.pixelRatio || 2;
          const width = res[0].width || this.data.canvasWidth;
          const height = res[0].height || this.data.canvasHeight;

          // 设置 Canvas 的实际像素尺寸
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          this.canvas = canvas;
          this.ctx = ctx;
          this.setData({
            canvasReady: true,
            dpr: dpr,
            canvasWidth: width,
            canvasHeight: height,
          });

          console.log(
            "✅ Canvas 2D 初始化成功，尺寸:",
            width,
            "x",
            height,
            "DPR:",
            dpr
          );

          // 如果已有数据，立即绘制
          if (this.data.chakraData && this.data.chakraData.length > 0) {
            console.log("📊 检测到数据，开始绘制...");
            this.drawRadar();
          }
        });
    },

    // 绘制雷达图
    drawRadar() {
      console.log(
        "🎨 drawRadar 被调用，chakraData 长度:",
        this.data.chakraData?.length
      );

      if (!this.ctx) {
        console.warn("⚠️ Canvas 上下文未初始化");
        this.initCanvas2D();
        return;
      }

      if (!this.data.chakraData || this.data.chakraData.length === 0) {
        console.warn("⚠️ 脉轮数据为空");
        return;
      }

      try {
        const ctx = this.ctx;
        const width = this.data.canvasWidth;
        const height = this.data.canvasHeight;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        const dataCount = this.data.chakraData.length;

        console.log(
          "📐 绑制参数 - 中心:",
          centerX,
          ",",
          centerY,
          "半径:",
          radius
        );

        // 清除画布
        ctx.clearRect(0, 0, width, height);

        // 1. 绘制背景网格
        this.drawGrid(ctx, centerX, centerY, radius, dataCount);

        // 2. 绘制轴线
        this.drawAxes(ctx, centerX, centerY, radius, dataCount);

        // 3. 绘制数据区域
        this.drawDataArea(ctx, centerX, centerY, radius, dataCount);

        // 4. 绘制数据点
        this.drawDataPoints(ctx, centerX, centerY, radius, dataCount);

        console.log("✅ 雷达图绑制完成！");
      } catch (error) {
        console.error("❌ 绑制雷达图时出错：", error);
      }
    },

    // 绘制背景网格 (Canvas 2D API)
    drawGrid(ctx, centerX, centerY, radius, dataCount) {
      const levels = 5;

      for (let i = 1; i <= levels; i++) {
        const r = (radius / levels) * i;

        ctx.beginPath();
        for (let j = 0; j < dataCount; j++) {
          const angle = ((Math.PI * 2) / dataCount) * j - Math.PI / 2;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = "#E0E0E0";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },

    // 绘制轴线 (Canvas 2D API)
    drawAxes(ctx, centerX, centerY, radius, dataCount) {
      for (let i = 0; i < dataCount; i++) {
        const angle = ((Math.PI * 2) / dataCount) * i - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "#E0E0E0";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },

    // 绘制数据区域 (Canvas 2D API)
    drawDataArea(ctx, centerX, centerY, radius, dataCount) {
      const chakraData = this.data.chakraData;

      ctx.beginPath();
      for (let i = 0; i < dataCount; i++) {
        const angle = ((Math.PI * 2) / dataCount) * i - Math.PI / 2;
        const value = chakraData[i].value / 100;
        const r = radius * value;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(139, 115, 85, 0.2)";
      ctx.fill();
      ctx.strokeStyle = "rgba(139, 115, 85, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    },

    // 绘制数据点 (Canvas 2D API)
    drawDataPoints(ctx, centerX, centerY, radius, dataCount) {
      const chakraData = this.data.chakraData;
      const selectedChakra = this.data.selectedChakra;

      for (let i = 0; i < dataCount; i++) {
        const angle = ((Math.PI * 2) / dataCount) * i - Math.PI / 2;
        const value = chakraData[i].value / 100;
        const r = radius * value;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        // 如果是选中的脉轮，绘制高亮圆环
        if (chakraData[i].type === selectedChakra) {
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.strokeStyle = chakraData[i].color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // 绘制数据点
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = chakraData[i].color;
        ctx.fill();
      }
    },

    // 图例点击事件
    onLegendTap(e) {
      const type = e.currentTarget.dataset.type;
      console.log("点击图例：", type);
      this.triggerEvent("chakrachange", { type: type });
    },
  },
});
