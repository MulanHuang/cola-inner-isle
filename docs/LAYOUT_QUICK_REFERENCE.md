# 🎯 按钮布局快速参考卡

## 📦 WXML 结构

```xml
<!-- 整体控制区域：包含主控制按钮和功能按钮 -->
<view class="player-controls">
  
  <!-- 主控制按钮行：快退 / 播放暂停 / 快进 -->
  <view class="controls">
    <view class="control-btn" bindtap="seekBackward">
      <text class="icon">⏪</text>
    </view>
    <view class="control-btn control-btn-main" bindtap="togglePlay">
      <text class="icon">{{playing ? '⏸' : '▶️'}}</text>
    </view>
    <view class="control-btn" bindtap="seekForward">
      <text class="icon">⏩</text>
    </view>
  </view>

  <!-- 功能按钮行：循环 / 倍速 -->
  <view class="extra-controls">
    <view class="extra-btn" bindtap="toggleLoop">
      <text class="icon {{loopMode ? 'active' : ''}}">🔁</text>
      <text class="extra-text">循环</text>
    </view>
    <view class="extra-btn" bindtap="showSpeedPicker">
      <text class="icon">⚡</text>
      <text class="extra-text">{{speed}}x</text>
    </view>
  </view>
  
</view>
```

---

## 🎨 WXSS 核心样式

### 1. 整体控制区域容器
```css
.player-controls {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48rpx;                    /* 两行按钮间距 */
  margin-top: auto;              /* 自动上边距 */
  margin-bottom: auto;           /* 自动下边距 */
  padding: 40rpx 0;              /* 内边距 */
  position: relative;
  z-index: 10;                   /* 确保不被遮挡 */
}
```

### 2. 主控制按钮行
```css
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;                    /* 按钮间距 */
  width: 100%;
}
```

### 3. 副控制按钮
```css
.control-btn {
  width: 104rpx;                 /* 增大到 104rpx */
  height: 104rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 245, 240, 0.9) 100%
  );
  border-radius: 50%;
  box-shadow: 0 8rpx 24rpx rgba(255, 140, 140, 0.15),
    0 2rpx 8rpx rgba(255, 182, 193, 0.1),
    inset 0 -2rpx 4rpx rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;                /* 防止被压缩 */
}
```

### 4. 主播放按钮
```css
.control-btn-main {
  width: 136rpx;                 /* 增大到 136rpx */
  height: 136rpx;
  background: linear-gradient(
    135deg,
    #ffb6c1 0%,
    #ffa07a 50%,
    #ff9999 100%
  );
  box-shadow: 0 16rpx 40rpx rgba(255, 140, 140, 0.35),
    0 8rpx 16rpx rgba(255, 182, 193, 0.25),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.4),
    inset 0 -2rpx 4rpx rgba(0, 0, 0, 0.05);
  margin: 0 8rpx;                /* 额外的视觉缓冲 */
}
```

### 5. 功能按钮行
```css
.extra-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 80rpx;                    /* 增大到 80rpx */
  width: 100%;
  padding: 0 40rpx;
}
```

---

## 📐 关键尺寸速查表

| 元素 | 尺寸 | 间距 | 备注 |
|------|------|------|------|
| 副按钮 | 104×104rpx | gap: 40rpx | 快退/快进 |
| 主按钮 | 136×136rpx | margin: 0 8rpx | 播放/暂停 |
| 两行间距 | - | gap: 48rpx | 主控制 ↔ 功能 |
| 功能按钮间距 | - | gap: 80rpx | 循环 ↔ 倍速 |
| 容器内边距 | - | padding: 40rpx 0 | 上下留白 |

---

## 🎯 布局要点

### ✅ 使用 gap 而非 margin
```css
/* ❌ 不推荐 */
.controls {
  margin-bottom: 48rpx;
}

/* ✅ 推荐 */
.player-controls {
  gap: 48rpx;
}
```

### ✅ 使用 margin: auto 居中
```css
/* ❌ 不推荐 */
.player-content {
  justify-content: space-between;
}

/* ✅ 推荐 */
.player-content {
  justify-content: flex-start;
}
.player-controls {
  margin-top: auto;
  margin-bottom: auto;
}
```

### ✅ 使用 flex-shrink: 0 防止压缩
```css
.control-btn {
  flex-shrink: 0;  /* 防止按钮被压缩 */
}
```

---

## 🔧 调试技巧

### 查看布局边界
```css
/* 临时添加边框查看布局 */
.player-controls {
  border: 2rpx solid red;
}
.controls {
  border: 2rpx solid blue;
}
.extra-controls {
  border: 2rpx solid green;
}
```

### 调整垂直位置
```css
/* 如果控制区域偏上 */
.player-controls {
  margin-top: auto;
  margin-bottom: 80rpx;  /* 增加底部边距 */
}

/* 如果控制区域偏下 */
.player-controls {
  margin-top: 80rpx;     /* 增加顶部边距 */
  margin-bottom: auto;
}
```

---

## 📱 响应式建议

```css
/* 小屏幕适配 */
@media (max-height: 1200rpx) {
  .control-btn {
    width: 88rpx;
    height: 88rpx;
  }
  .control-btn-main {
    width: 112rpx;
    height: 112rpx;
  }
}

/* 大屏幕适配 */
@media (min-height: 1600rpx) {
  .control-btn {
    width: 120rpx;
    height: 120rpx;
  }
  .control-btn-main {
    width: 152rpx;
    height: 152rpx;
  }
}
```

---

**更新时间**：2025-11-18  
**适用版本**：微信小程序所有版本

