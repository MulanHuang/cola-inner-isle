# 🎵 全局悬浮音乐控制按钮组件

## 📦 组件说明

这是一个全局悬浮的音乐控制按钮组件，用于在小程序的任何页面显示当前正在播放的背景音频，并提供快速停止功能。

---

## ✨ 功能特性

1. ✅ **自动显示/隐藏**：当有背景音频播放时自动显示，停止后自动隐藏
2. ✅ **实时状态同步**：监听音频播放、暂停、停止、结束等事件
3. ✅ **显示音频标题**：显示当前播放的音频标题（如"顶轮之光"）
4. ✅ **播放状态指示**：小绿点动画表示正在播放
5. ✅ **一键停止**：点击按钮可快速停止音频播放
6. ✅ **样式精美**：深色半透明背景、圆角胶囊形、毛玻璃效果
7. ✅ **全局可用**：在 app.json 中全局注册后，所有页面都可使用

---

## 📂 文件结构

```
components/audio-float/
├── audio-float.js      # 组件逻辑
├── audio-float.wxml    # 组件模板
├── audio-float.wxss    # 组件样式
├── audio-float.json    # 组件配置
└── README.md           # 使用说明（本文件）
```

---

## 🚀 使用方法

### 方法1：全局注册（推荐）

已在 `app.json` 中全局注册，所有页面都可以直接使用。

**app.json 配置：**
```json
{
  "usingComponents": {
    "audio-float": "/components/audio-float/audio-float"
  }
}
```

**在任意页面的 WXML 中使用：**
```xml
<!-- 在页面底部添加一行即可 -->
<audio-float />
```

### 方法2：页面级注册

如果只想在特定页面使用，可以在页面的 JSON 文件中注册：

**pages/xxx/xxx.json：**
```json
{
  "usingComponents": {
    "audio-float": "/components/audio-float/audio-float"
  }
}
```

**pages/xxx/xxx.wxml：**
```xml
<audio-float />
```

---

## 📋 推荐使用页面

建议在以下页面添加 `<audio-float />` 组件：

1. ✅ **pages/home/home.wxml** - 首页
2. ✅ **pages/chat/chat.wxml** - 陪伴页
3. ✅ **pages/meditation/meditation.wxml** - 冥想列表页
4. ✅ **pages/emotion/emotion.wxml** - 情绪记录页
5. ✅ **pages/profile/profile.wxml** - 个人中心页
6. ❌ **pages/meditation/player/player.wxml** - 播放器页面（不需要，因为已有播放控制）

---

## 🎨 样式说明

### 默认样式
- **位置**：右下角固定定位（`right: 30rpx; bottom: 120rpx`）
- **背景**：深色半透明（`rgba(0, 0, 0, 0.75)`）
- **形状**：圆角胶囊形（`border-radius: 50rpx`）
- **效果**：毛玻璃效果（`backdrop-filter: blur(10rpx)`）
- **阴影**：柔和阴影（`box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.3)`）

### 播放状态指示器
- **未播放**：灰色小点
- **正在播放**：绿色小点 + 脉冲动画

### 自定义样式
如果需要调整样式，可以修改 `audio-float.wxss` 文件。

---

## 🔧 技术实现

### 核心原理
1. 组件内部获取全局的 `wx.getBackgroundAudioManager()`
2. 监听音频管理器的各种事件（onPlay、onPause、onStop、onEnded、onError）
3. 根据事件更新组件的显示状态（visible、playing、title）
4. 点击按钮时调用 `audioManager.stop()` 停止播放

### 事件监听
```javascript
audioManager.onPlay(() => {
  // 显示按钮，更新标题
});

audioManager.onStop(() => {
  // 隐藏按钮
});

audioManager.onEnded(() => {
  // 隐藏按钮
});
```

### 初始状态检查
组件加载时会检查是否已有音频在播放：
```javascript
if (manager.src && !manager.paused) {
  // 显示按钮
}
```

---

## ⚠️ 注意事项

1. **全局单例**：`wx.getBackgroundAudioManager()` 是全局单例，所有页面共享同一个实例
2. **事件监听清理**：组件销毁时会自动清理事件监听，避免内存泄漏
3. **播放器页面**：建议在播放器页面（player.wxml）不添加此组件，因为播放器本身已有完整的控制界面
4. **底部位置**：默认位置是 `bottom: 120rpx`，避免与 tabBar 重叠，可根据需要调整

---

## 🎯 使用示例

### 示例1：在首页使用

**pages/home/home.wxml：**
```xml
<view class="container">
  <!-- 首页内容 -->
  <view class="content">
    ...
  </view>

  <!-- 全局悬浮音乐控制按钮 -->
  <audio-float />
</view>
```

### 示例2：在陪伴页使用

**pages/chat/chat.wxml：**
```xml
<view class="container">
  <!-- 聊天内容 -->
  <scroll-view class="chat-list">
    ...
  </scroll-view>

  <!-- 全局悬浮音乐控制按钮 -->
  <audio-float />
</view>
```

---

## 🐛 常见问题

### Q1：按钮不显示？
**A：** 检查以下几点：
1. 确保有音频正在播放
2. 确认组件已正确注册（app.json 或页面 json）
3. 确认页面 wxml 中已添加 `<audio-float />`

### Q2：点击按钮没反应？
**A：** 检查控制台是否有错误信息，确保 `wx.getBackgroundAudioManager()` 可以正常调用。

### Q3：按钮位置不合适？
**A：** 修改 `audio-float.wxss` 中的 `.audio-float-container` 样式：
```css
.audio-float-container {
  right: 30rpx;   /* 调整右边距 */
  bottom: 120rpx; /* 调整底部距离 */
}
```

### Q4：想要不同的样式？
**A：** 直接修改 `audio-float.wxss` 文件，所有样式都可以自定义。

---

## 📊 效果预览

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│        页面内容区域              │
│                                 │
│                                 │
│                    ┌──────────┐ │
│                    │ ● 顶轮之光 ⏹│ │ ← 悬浮按钮
│                    └──────────┘ │
│                                 │
└─────────────────────────────────┘
  [首页] [陪伴] [冥想] [我的]  ← tabBar
```

---

## 💡 扩展建议

如果你想要更多功能，可以考虑：

1. **添加播放/暂停切换**：点击按钮切换播放状态，而不是直接停止
2. **显示播放进度**：在按钮上显示当前播放进度
3. **点击跳转到播放器**：点击按钮跳转到播放器页面
4. **拖拽功能**：允许用户拖动按钮位置
5. **更多样式选项**：提供多种主题样式

---

## 📝 更新日志

### v1.0.0 (2025-11-18)
- ✅ 初始版本发布
- ✅ 支持自动显示/隐藏
- ✅ 支持显示音频标题
- ✅ 支持一键停止播放
- ✅ 支持播放状态指示

---

**开发者：** Augment Agent  
**最后更新：** 2025-11-18

