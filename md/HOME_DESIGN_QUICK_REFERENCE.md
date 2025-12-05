# 🎨 首页设计快速参考

## 📐 尺寸规范

### 间距
```css
页面内边距: 24rpx
卡片间距: 24rpx
卡片内边距: 32rpx
快捷入口内边距: 32rpx 20rpx
```

### 圆角
```css
卡片圆角: 24rpx
快捷入口圆角: 20rpx
按钮圆角: 50rpx
标签圆角: 40rpx
```

### 字体大小
```css
导航栏标题: 34rpx
卡片标题: 32rpx
今日一句: 30rpx
快捷入口文字: 26rpx
标签文字: 26rpx
辅助文字: 24rpx
作者署名: 24rpx
状态标签: 22rpx
```

### 图标尺寸
```css
导航栏 Logo: 52rpx × 52rpx
快捷入口图标: 56rpx × 56rpx
今日一句图标: 52rpx
```

---

## 🎨 颜色系统

### 主色调
```css
主色: #8B7355 (棕色)
辅助色: #B8956A (浅棕)
深色: #6D5A43 (深棕)
```

### 背景色
```css
页面背景: #F5F1E8 (米色)
卡片背景: #FFFFFF (白色)
今日一句: linear-gradient(135deg, #FFF9F0 0%, #F5F1E8 100%)
塔罗卡片: linear-gradient(135deg, #F0E6D7 0%, #DECCB5 100%)
自我探索: linear-gradient(135deg, #F0E8FF 0%, #E0D5F5 100%)
```

### 文字颜色
```css
主文字: #333333
次要文字: #666666
辅助文字: #999999
塔罗标题: #2F2418
```

---

## 💫 阴影系统

### 卡片阴影
```css
/* 默认状态 */
box-shadow: 
  0 6rpx 20rpx rgba(139, 115, 85, 0.08),
  0 2rpx 8rpx rgba(139, 115, 85, 0.04);

/* 点击状态 */
box-shadow: 
  0 4rpx 16rpx rgba(139, 115, 85, 0.1),
  0 2rpx 6rpx rgba(139, 115, 85, 0.05);
```

### 快捷入口阴影
```css
/* 默认状态 */
box-shadow: 
  0 4rpx 16rpx rgba(139, 115, 85, 0.08),
  0 2rpx 8rpx rgba(139, 115, 85, 0.04);

/* 点击状态 */
box-shadow: 
  0 2rpx 10rpx rgba(139, 115, 85, 0.12),
  0 1rpx 4rpx rgba(139, 115, 85, 0.06);
```

### 按钮阴影
```css
/* 主按钮 */
box-shadow: 
  0 8rpx 20rpx rgba(139, 115, 85, 0.25),
  0 4rpx 10rpx rgba(139, 115, 85, 0.15);

/* 次按钮 */
box-shadow: 0 2rpx 8rpx rgba(139, 115, 85, 0.08);
```

---

## 🎭 动画效果

### 缓动函数
```css
标准过渡: cubic-bezier(0.4, 0, 0.2, 1)
时长: 0.3s
```

### 缩放效果
```css
/* 点击反馈 */
transform: scale(0.95);  /* 快捷入口 */
transform: scale(0.96);  /* 按钮 */
```

### 涟漪效果
```css
/* 快捷入口 */
.shortcut-item::after {
  width: 0 → 200%;
  height: 0 → 200%;
  transition: 0.4s ease;
}

/* 按钮 */
.btn-primary::before {
  width: 0 → 300%;
  height: 0 → 300%;
  transition: 0.4s ease;
}
```

---

## 🌟 特殊效果

### 毛玻璃效果
```css
backdrop-filter: blur(10rpx);  /* 标签 */
backdrop-filter: blur(20rpx);  /* 导航栏 */
```

### 渐变装饰
```css
/* 径向渐变 */
background: radial-gradient(
  circle,
  rgba(255, 255, 255, 0.3) 0%,
  transparent 60%
);

/* 线性渐变 */
background: linear-gradient(
  90deg,
  transparent,
  rgba(139, 115, 85, 0.1),
  transparent
);
```

---

## 📱 交互规范

### 点击反馈
1. **缩放**: 所有可点击元素添加 `scale(0.95-0.96)`
2. **阴影**: 点击时减弱阴影效果
3. **涟漪**: 从中心扩散的圆形波纹

### 悬停效果
1. **箭头**: 向右移动 `4rpx`
2. **图标**: 放大至 `1.1` 倍
3. **背景**: 显示渐变线装饰

---

## 🔧 代码片段

### 卡片基础样式
```css
.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 6rpx 20rpx rgba(139, 115, 85, 0.08),
              0 2rpx 8rpx rgba(139, 115, 85, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
```

### 渐变装饰
```css
.card::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 249, 240, 0.8) 0%,
    transparent 70%
  );
  opacity: 0.5;
}
```

### 涟漪效果
```css
.item::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(139, 115, 85, 0.05);
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.item:active::after {
  width: 200%;
  height: 200%;
}
```

---

## ✅ 检查清单

设计新组件时，确保：
- [ ] 使用统一的圆角规范
- [ ] 添加双层阴影效果
- [ ] 实现点击缩放反馈
- [ ] 使用标准缓动函数
- [ ] 添加渐变装饰（可选）
- [ ] 实现涟漪效果（可选）
- [ ] 测试不同屏幕尺寸
- [ ] 检查颜色对比度
- [ ] 验证动画性能

---

## 📚 相关文件

- `pages/home/home.wxss` - 首页样式
- `components/shortcut-icon/shortcut-icon.wxss` - 快捷入口图标
- `app.wxss` - 全局样式
- `custom-tab-bar/index.wxss` - 底部导航栏
- `DESIGN_OPTIMIZATION_SUMMARY.md` - 详细优化说明

