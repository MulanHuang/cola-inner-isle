# 📚 脉轮雷达图 - 代码示例详解（适合初学者）

## 🎯 核心代码结构

本文档详细解释雷达图功能的关键代码，帮助初学者理解实现原理。

---

## 1️⃣ 雷达图组件 - WXML 模板

**文件**：`components/chakra-radar/chakra-radar.wxml`

```xml
<!-- 脉轮雷达图组件 -->
<view class="chakra-radar-container">
  <!-- Canvas 雷达图 -->
  <canvas 
    type="2d"                    <!-- 使用 Canvas 2D API -->
    id="radarCanvas"             <!-- Canvas ID -->
    class="radar-canvas"         <!-- 样式类名 -->
    bindtouchstart="onTouchStart" <!-- 触摸事件（可选） -->
  ></canvas>
  
  <!-- 图例（可点击切换选中脉轮） -->
  <view class="radar-legend">
    <!-- 循环渲染 7 个脉轮图例 -->
    <view 
      wx:for="{{chakraData}}"                    <!-- 遍历脉轮数据 -->
      wx:key="type"                              <!-- 唯一标识 -->
      class="legend-item {{selectedChakra === item.type ? 'active' : ''}}" <!-- 选中时添加 active 类 -->
      bindtap="onLegendTap"                      <!-- 点击事件 -->
      data-type="{{item.type}}"                  <!-- 传递脉轮类型 -->
    >
      <!-- 颜色点 -->
      <view class="legend-dot" style="background: {{item.color}}"></view>
      <!-- 脉轮名称 -->
      <view class="legend-name">{{item.name}}</view>
      <!-- 百分比 -->
      <view class="legend-value">{{item.value}}%</view>
    </view>
  </view>
</view>
```

**关键点**：
- `type="2d"`：使用新版 Canvas 2D API（性能更好）
- `wx:for`：循环渲染图例
- `data-type`：在点击事件中获取脉轮类型
- 动态 class：`{{selectedChakra === item.type ? 'active' : ''}}`

---

## 2️⃣ 雷达图组件 - JS 逻辑（核心）

**文件**：`components/chakra-radar/chakra-radar.js`

### 2.1 组件属性定义

```javascript
Component({
  properties: {
    // 脉轮数据：[{ type, name, value, color }, ...]
    chakraData: {
      type: Array,           // 数据类型：数组
      value: [],             // 默认值：空数组
      observer: 'drawRadar'  // 数据变化时自动调用 drawRadar() 方法
    },
    // 当前选中的脉轮类型
    selectedChakra: {
      type: String,          // 数据类型：字符串
      value: ''              // 默认值：空字符串
    }
  },
  
  // ... 其他代码
});
```

**关键点**：
- `observer`：数据观察器，数据变化时自动重绘雷达图
- `properties`：父组件传递的数据

### 2.2 初始化 Canvas

```javascript
initCanvas() {
  // 1. 创建选择器查询
  const query = this.createSelectorQuery();
  
  // 2. 选择 Canvas 节点，获取节点信息和尺寸
  query.select('.radar-canvas')
    .fields({ node: true, size: true })
    .exec((res) => {
      if (res[0]) {
        // 3. 获取 Canvas 节点和上下文
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 4. 获取设备像素比（高清屏适配）
        const dpr = wx.getSystemInfoSync().pixelRatio;
        
        // 5. 设置 Canvas 实际尺寸（物理像素）
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        
        // 6. 缩放上下文，保持逻辑像素一致
        ctx.scale(dpr, dpr);

        // 7. 保存 Canvas 和上下文到组件实例
        this.canvas = canvas;
        this.ctx = ctx;
        
        // 8. 保存逻辑尺寸到 data
        this.setData({
          canvasWidth: res[0].width,
          canvasHeight: res[0].height
        });
        
        // 9. 绘制雷达图
        this.drawRadar();
      }
    });
}
```

**关键点**：
- `createSelectorQuery()`：查询 DOM 节点
- `pixelRatio`：设备像素比（iPhone 为 2 或 3）
- `ctx.scale(dpr, dpr)`：缩放上下文，避免模糊

### 2.3 绘制雷达图主流程

```javascript
drawRadar() {
  // 0. 检查是否已初始化
  if (!this.ctx || !this.data.chakraData || this.data.chakraData.length === 0) {
    return;
  }

  // 1. 获取基本参数
  const ctx = this.ctx;
  const width = this.data.canvasWidth;
  const height = this.data.canvasHeight;
  const centerX = width / 2;              // 中心点 X 坐标
  const centerY = height / 2;             // 中心点 Y 坐标
  const radius = Math.min(width, height) / 2 - 40; // 半径（留出边距）
  const dataCount = this.data.chakraData.length;   // 数据点数量（7个）

  // 2. 清空画布
  ctx.clearRect(0, 0, width, height);

  // 3. 绘制背景网格（5层）
  this.drawGrid(ctx, centerX, centerY, radius, dataCount);

  // 4. 绘制轴线和标签
  this.drawAxes(ctx, centerX, centerY, radius, dataCount);

  // 5. 绘制数据区域（填充）
  this.drawDataArea(ctx, centerX, centerY, radius, dataCount);

  // 6. 绘制数据点
  this.drawDataPoints(ctx, centerX, centerY, radius, dataCount);
}
```

**关键点**：
- 绘制顺序：网格 → 轴线 → 数据区域 → 数据点（从底层到顶层）
- `clearRect()`：清空画布，避免重复绘制

### 2.4 绘制背景网格

```javascript
drawGrid(ctx, centerX, centerY, radius, dataCount) {
  const levels = 5; // 5层网格（20%, 40%, 60%, 80%, 100%）
  
  // 循环绘制 5 层网格
  for (let i = 1; i <= levels; i++) {
    const r = (radius / levels) * i; // 当前层的半径
    
    ctx.beginPath(); // 开始新路径
    
    // 循环绘制 7 个顶点
    for (let j = 0; j < dataCount; j++) {
      // 计算角度（从顶部开始，顺时针）
      const angle = (Math.PI * 2 / dataCount) * j - Math.PI / 2;
      
      // 计算顶点坐标
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      if (j === 0) {
        ctx.moveTo(x, y); // 移动到起点
      } else {
        ctx.lineTo(x, y); // 连线到下一个点
      }
    }
    
    ctx.closePath();              // 闭合路径
    ctx.strokeStyle = '#E0E0E0';  // 线条颜色：浅灰色
    ctx.lineWidth = 1;            // 线条宽度
    ctx.stroke();                 // 绘制线条
  }
}
```

**关键点**：
- `angle = (Math.PI * 2 / 7) * j - Math.PI / 2`：计算每个顶点的角度
  - `Math.PI * 2 / 7`：每个顶点间隔 360° / 7
  - `- Math.PI / 2`：从顶部开始（-90°）
- `Math.cos(angle)` 和 `Math.sin(angle)`：极坐标转直角坐标

### 2.5 绘制数据区域

```javascript
drawDataArea(ctx, centerX, centerY, radius, dataCount) {
  const chakraData = this.data.chakraData;
  
  ctx.beginPath();
  
  // 循环绘制 7 个数据点
  for (let i = 0; i < dataCount; i++) {
    const angle = (Math.PI * 2 / dataCount) * i - Math.PI / 2;
    const value = chakraData[i].value / 100; // 转换为 0-1 的比例
    const r = radius * value;                // 根据数值计算半径
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.closePath();
  
  // 填充颜色（半透明棕色）
  ctx.fillStyle = 'rgba(139, 115, 85, 0.2)';
  ctx.fill();
  
  // 描边
  ctx.strokeStyle = 'rgba(139, 115, 85, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
}
```

**关键点**：
- `value / 100`：将百分比转换为 0-1 的比例
- `radius * value`：根据数值计算实际半径
- `fill()` 和 `stroke()`：填充和描边

### 2.6 图例点击事件

```javascript
onLegendTap(e) {
  // 1. 获取点击的脉轮类型
  const type = e.currentTarget.dataset.type;
  
  // 2. 触发父组件的事件，通知选中的脉轮变化
  this.triggerEvent('chakrachange', { type: type });
}
```

**关键点**：
- `e.currentTarget.dataset.type`：获取 `data-type` 属性值
- `triggerEvent()`：触发自定义事件，通知父组件

---

## 3️⃣ 结果页 - WXML 模板

**文件**：`pages/chakraResult/index.wxml`

```xml
<!-- 雷达图模块 -->
<view class="radar-section card">
  <view class="section-title">🌈 七大脉轮雷达图</view>
  <view class="section-subtitle">点击图例查看详细分析</view>
  
  <!-- 使用雷达图组件 -->
  <chakra-radar 
    chakraData="{{radarData}}"              <!-- 传递雷达图数据 -->
    selectedChakra="{{selectedChakra}}"     <!-- 传递选中的脉轮 -->
    bind:chakrachange="onChakraChange"      <!-- 监听脉轮切换事件 -->
  ></chakra-radar>
</view>

<!-- 脉轮详细分析模块 -->
<view class="analysis-section card">
  <!-- 头部：脉轮名称 + 百分比 -->
  <view class="analysis-header">
    <view class="analysis-title">
      <text class="analysis-emoji">{{selectedChakraInfo.emoji}}</text>
      <text class="analysis-name">{{selectedChakraInfo.name}}</text>
    </view>
    <view class="analysis-score" style="background: {{selectedChakraInfo.color}}">
      {{selectedChakraInfo.percentage}}%
    </view>
  </view>

  <!-- 状态卡片 -->
  <view class="analysis-status">
    <text class="status-icon">{{selectedChakraInfo.statusIcon}}</text>
    <text class="status-title">{{selectedChakraInfo.statusTitle}}</text>
  </view>

  <!-- 详细内容 -->
  <view class="analysis-content">
    <!-- 状态总结 -->
    <view class="content-block">
      <view class="block-label">💫 状态总结</view>
      <view class="block-text">{{selectedChakraInfo.description}}</view>
    </view>

    <!-- 可能感受（标签） -->
    <view class="content-block">
      <view class="block-label">🌟 可能感受</view>
      <view class="traits-list">
        <view wx:for="{{selectedChakraInfo.traits}}" wx:key="*this" class="trait-tag">
          {{item}}
        </view>
      </view>
    </view>

    <!-- 练习建议（列表） -->
    <view class="content-block">
      <view class="block-label">🧘‍♀️ 练习建议</view>
      <view class="practice-list">
        <view wx:for="{{selectedChakraInfo.practices}}" wx:key="*this" class="practice-item">
          • {{item}}
        </view>
      </view>
    </view>

    <!-- 正念宣言 -->
    <view class="content-block">
      <view class="block-label">✨ 正念宣言</view>
      <view class="affirmation-text">{{selectedChakraInfo.affirmation}}</view>
    </view>
  </view>
</view>
```

**关键点**：
- `bind:chakrachange`：监听子组件的自定义事件
- `{{selectedChakraInfo.xxx}}`：动态绑定数据

---

## 4️⃣ 结果页 - JS 逻辑

**文件**：`pages/chakraResult/index.js`

### 4.1 处理结果数据

```javascript
processResults(results) {
  // ... 生成 chakraList ...

  // 生成雷达图数据
  const radarData = chakraList.map((item) => ({
    type: item.type,                  // 脉轮类型
    name: item.info.name,             // 脉轮名称
    value: item.result.percentage,    // 百分比
    color: item.info.color,           // 颜色
  }));

  // 找到得分最低的脉轮作为默认选中
  const lowestChakra = chakraList.reduce((min, item) =>
    item.result.percentage < min.result.percentage ? item : min
  );

  this.setData({
    results: results,
    chakraList: chakraList,
    radarData: radarData,                // 设置雷达图数据
    selectedChakra: lowestChakra.type,   // 设置默认选中
  });

  // 更新选中脉轮的详细信息
  this.updateSelectedChakraInfo(lowestChakra.type);
}
```

**关键点**：
- `map()`：转换数据格式
- `reduce()`：找到得分最低的脉轮

### 4.2 更新选中脉轮信息

```javascript
updateSelectedChakraInfo(chakraType) {
  // 1. 查找对应的脉轮数据
  const chakra = this.data.chakraList.find(
    (item) => item.type === chakraType
  );
  if (!chakra) return;

  // 2. 提取需要的数据
  const percentage = chakra.result.percentage;
  const info = chakra.info;
  const interpretation = chakra.interpretation;

  // 3. 根据得分确定状态图标
  let statusIcon = '💫';
  if (percentage >= 80) {
    statusIcon = '🌟';
  } else if (percentage >= 50) {
    statusIcon = '⭐';
  }

  // 4. 更新 data
  this.setData({
    selectedChakraInfo: {
      type: chakraType,
      name: info.name,
      emoji: info.emoji,
      color: info.color,
      percentage: percentage,
      statusIcon: statusIcon,
      statusTitle: interpretation.title,
      description: interpretation.description,
      traits: interpretation.traits,
      practices: info.suggestions.practice,
      affirmation: info.suggestions.affirmation,
    },
  });
}
```

**关键点**：
- `find()`：查找数组中的元素
- 根据得分动态设置状态图标

### 4.3 处理脉轮切换事件

```javascript
onChakraChange(e) {
  // 1. 获取切换的脉轮类型
  const chakraType = e.detail.type;
  
  // 2. 更新选中的脉轮
  this.setData({
    selectedChakra: chakraType,
  });
  
  // 3. 更新详细信息
  this.updateSelectedChakraInfo(chakraType);
}
```

**关键点**：
- `e.detail.type`：获取子组件传递的数据
- 更新 `selectedChakra` 会触发雷达图重绘（因为有 `observer`）

---

## 🎓 学习要点总结

### Canvas 绘图
1. **初始化**：`createSelectorQuery()` → `getContext('2d')` → `scale(dpr, dpr)`
2. **绘制流程**：`beginPath()` → `moveTo()` / `lineTo()` → `closePath()` → `stroke()` / `fill()`
3. **坐标计算**：极坐标 → 直角坐标（`Math.cos()` 和 `Math.sin()`）

### 组件通信
1. **父传子**：`properties` + WXML 属性绑定
2. **子传父**：`triggerEvent()` + `bind:eventname`
3. **数据观察**：`observer` 自动响应数据变化

### 数据处理
1. **数组转换**：`map()` 转换格式
2. **数组查找**：`find()` 查找元素，`reduce()` 聚合计算
3. **动态绑定**：`{{variable}}` 在 WXML 中绑定数据

---

**希望这些代码示例能帮助你理解雷达图的实现原理！** 📚✨

