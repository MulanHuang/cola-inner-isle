# 🔍 雷达图调试指南

## 问题诊断步骤

### 步骤 1：检查控制台日志

编译小程序后，完成一次脉轮测试，进入结果页，查看控制台输出：

**应该看到的日志**：
```
开始处理结果数据： {root: {...}, sacral: {...}, ...}
生成的雷达图数据： [{type: 'root', name: '海底轮', value: 60, color: '#E53935'}, ...]
默认选中的脉轮： root
数据设置完成，radarData: [...]
开始初始化雷达图 Canvas...
Canvas 查询结果： [{node: {...}, width: xxx, height: xxx}]
Canvas 尺寸： xxx x xxx
设备像素比： 2
Canvas 初始化成功，准备绘制雷达图
drawRadar 被调用
ctx: CanvasRenderingContext2D {...}
chakraData: [{...}, {...}, ...]
开始绘制雷达图，中心点： xxx xxx 半径： xxx
雷达图绘制完成
```

### 步骤 2：检查可能的错误

#### 错误 1：Canvas 节点未找到
```
Canvas 节点未找到
```

**原因**：Canvas 元素未正确渲染或选择器错误

**解决方法**：
1. 检查 `components/chakra-radar/chakra-radar.wxml` 中的 class 名称是否为 `.radar-canvas`
2. 增加延迟时间（已设置为 300ms）

#### 错误 2：脉轮数据为空
```
脉轮数据为空
```

**原因**：数据未正确传递到组件

**解决方法**：
1. 检查 `pages/chakraResult/index.wxml` 中的数据绑定：`chakraData="{{radarData}}"`
2. 检查 `pages/chakraResult/index.js` 中的 `radarData` 是否正确生成

#### 错误 3：Canvas 上下文未初始化
```
Canvas 上下文未初始化
```

**原因**：Canvas 初始化失败

**解决方法**：
1. 检查是否支持 Canvas 2D API（基础库版本 >= 2.9.0）
2. 尝试重新编译小程序

### 步骤 3：手动测试

在控制台中手动测试：

```javascript
// 在结果页的控制台中执行
const page = getCurrentPages()[getCurrentPages().length - 1];
console.log('radarData:', page.data.radarData);
console.log('selectedChakra:', page.data.selectedChakra);
```

### 步骤 4：检查基础库版本

1. 微信开发者工具 → 右上角「详情」
2. 查看「基础库版本」
3. 确保版本 >= 2.9.0（Canvas 2D API 要求）

如果版本过低：
- 点击「本地设置」
- 调整「调试基础库」到最新版本

### 步骤 5：清除缓存重新编译

1. 微信开发者工具 → 顶部菜单「工具」
2. 点击「清除缓存」→「清除全部缓存」
3. 重新编译

---

## 已添加的调试功能

### 1. 详细日志输出
- Canvas 初始化日志
- 数据传递日志
- 绘制过程日志

### 2. 数据观察器
- 自动监听 `chakraData` 变化
- 数据变化时自动重绘

### 3. 延迟初始化
- 延迟 300ms 初始化 Canvas
- 确保 DOM 完全渲染

### 4. 视觉反馈
- Canvas 背景色设置为 `#fafafa`
- 如果看到灰色背景，说明 Canvas 已渲染
- 如果背景是白色，说明 Canvas 未渲染

---

## 快速修复方案

如果雷达图仍然不显示，尝试以下方案：

### 方案 1：使用旧版 Canvas API

将 `components/chakra-radar/chakra-radar.wxml` 中的：
```xml
<canvas type="2d" id="radarCanvas" class="radar-canvas"></canvas>
```

改为：
```xml
<canvas canvas-id="radarCanvas" class="radar-canvas"></canvas>
```

然后修改 `components/chakra-radar/chakra-radar.js` 中的 `initCanvas()` 方法：
```javascript
initCanvas() {
  const ctx = wx.createCanvasContext('radarCanvas', this);
  this.ctx = ctx;
  this.setData({
    canvasWidth: 350,  // 固定宽度
    canvasHeight: 300  // 固定高度
  });
  this.drawRadar();
}
```

### 方案 2：使用图片替代

如果 Canvas 实在无法工作，可以使用 SVG 或图片方式：
1. 使用 `<view>` + CSS 绘制简化版雷达图
2. 使用 ECharts for WeChat（需要额外配置）

---

## 联系我

如果以上方法都无法解决，请提供：
1. 控制台完整日志截图
2. 基础库版本号
3. 微信开发者工具版本号
4. 是否在真机上测试过

我会帮你进一步诊断问题。

---

**祝调试顺利！** 🚀

