# 图片资源说明

本目录存放小程序所需的所有图片资源。

## 📁 目录结构

```
images/
├── tab/                    # 底部导航栏图标
│   ├── home.png           # 首页图标（未选中）
│   ├── home-active.png    # 首页图标（选中）
│   ├── chat.png           # 对话图标（未选中）
│   ├── chat-active.png    # 对话图标（选中）
│   ├── meditation.png     # 冥想图标（未选中）
│   ├── meditation-active.png  # 冥想图标（选中）
│   ├── profile.png        # 我的图标（未选中）
│   └── profile-active.png # 我的图标（选中）
├── tarot/                 # 塔罗牌图片
│   ├── tarot-back.png     # 塔罗牌背面
│   ├── fool.png           # 愚者
│   ├── magician.png       # 魔术师
│   ├── high-priestess.png # 女祭司
│   ├── empress.png        # 皇后
│   ├── emperor.png        # 皇帝
│   ├── hierophant.png     # 教皇
│   ├── lovers.png         # 恋人
│   ├── chariot.png        # 战车
│   ├── strength.png       # 力量
│   ├── hermit.png         # 隐者
│   ├── wheel.png          # 命运之轮
│   ├── justice.png        # 正义
│   ├── hanged-man.png     # 倒吊人
│   ├── death.png          # 死神
│   ├── temperance.png     # 节制
│   ├── devil.png          # 恶魔
│   ├── tower.png          # 塔
│   ├── star.png           # 星星
│   ├── moon.png           # 月亮
│   ├── sun.png            # 太阳
│   ├── judgement.png      # 审判
│   └── world.png          # 世界
├── meditation/            # 冥想封面图
│   ├── emotion-1.jpg      # 情绪疗愈封面
│   ├── emotion-2.jpg
│   ├── chakra-root.jpg    # 根轮封面
│   ├── chakra-sacral.jpg  # 脐轮封面
│   ├── chakra-solar.jpg   # 太阳轮封面
│   ├── chakra-heart.jpg   # 心轮封面
│   ├── chakra-throat.jpg  # 喉轮封面
│   ├── chakra-third-eye.jpg  # 眉心轮封面
│   ├── chakra-crown.jpg   # 顶轮封面
│   ├── sleep-1.jpg        # 睡眠封面
│   ├── relax-1.jpg        # 放松封面
│   ├── innerchild-1.jpg   # 内在小孩封面
│   ├── awareness-1.jpg    # 觉察封面
│   ├── affirmation-1.jpg  # 肯定语封面
│   └── manifestation-1.jpg # 显化封面
├── default-avatar.png     # 默认用户头像
├── ai-avatar.png          # AI 头像
└── user-avatar.png        # 用户消息头像
```

## 🎨 设计规范

### Tab 图标
- **尺寸**：81px × 81px（@3x）
- **格式**：PNG（透明背景）
- **颜色**：
  - 未选中：#999999
  - 选中：#8B7355

### 塔罗牌图片
- **尺寸**：建议 400px × 640px（比例 5:8）
- **格式**：PNG 或 JPG
- **风格**：统一的塔罗牌风格，建议使用韦特塔罗或现代简约风格

### 冥想封面
- **尺寸**：建议 600px × 600px（正方形）
- **格式**：JPG
- **风格**：温柔、治愈、自然风格
- **色调**：与主题色协调（大地色系）

### 头像图片
- **尺寸**：200px × 200px
- **格式**：PNG（透明背景）
- **风格**：简约、温柔

## 📥 资源获取建议

### 免费图片资源网站
- **Unsplash**：https://unsplash.com/
- **Pexels**：https://www.pexels.com/
- **Pixabay**：https://pixabay.com/

### 图标资源
- **Iconfont**：https://www.iconfont.cn/
- **Flaticon**：https://www.flaticon.com/

### 塔罗牌图片
- 可以使用开源的韦特塔罗牌图片
- 或者使用 AI 生成工具（如 Midjourney、Stable Diffusion）生成统一风格的塔罗牌

### 冥想封面建议主题
- **情绪疗愈**：温柔的光线、柔和的色彩
- **脉轮系列**：对应颜色的抽象图案（根轮-红色、脐轮-橙色等）
- **睡眠**：夜空、星星、月亮
- **放松**：海浪、森林、自然景观
- **内在小孩**：温暖的光、童年元素
- **觉察**：禅意、简约
- **肯定语**：阳光、花朵
- **显化**：星空、宇宙

## ⚠️ 注意事项

1. **版权**：确保所有图片资源有合法使用权
2. **大小**：控制图片文件大小，建议单张不超过 500KB
3. **优化**：使用图片压缩工具（如 TinyPNG）优化图片
4. **命名**：使用英文小写和连字符，避免中文和特殊字符
5. **备份**：保留原始高清图片作为备份

## 🛠️ 图片处理工具推荐

- **压缩**：TinyPNG (https://tinypng.com/)
- **编辑**：Figma、Photoshop、Canva
- **格式转换**：CloudConvert (https://cloudconvert.com/)
- **批量处理**：XnConvert

## 📝 临时占位符

在开发阶段，如果暂时没有图片资源，可以：
1. 使用纯色背景 + 文字
2. 使用 Emoji 作为临时图标
3. 使用占位图服务（如 https://placeholder.com/）

