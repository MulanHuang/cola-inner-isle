# InnerSeed 微信小程序

可乐心岛：用于情绪记录、自我反思与轻工具体验的微信小程序。

## 🚀 快速开始

### 1. 打开项目
使用**微信开发者工具**打开 `miniprogram/` 目录（即本目录）。

### 2. 配置云开发
1. 在微信开发者工具中，点击「云开发」按钮
2. 创建或选择云开发环境
3. 记录环境 ID（格式：`cloud1-xxxxx`）

### 3. 上传云函数
在云开发控制台中，上传 `cloudfunctions/` 目录下的所有云函数：
- aiChat
- aiProxy
- analyzeChakraOverall
- analyzeChakraResult
- emotionInterpret
- getHabitCalendarData
- mbti-analyze
- ohInterpret
- tarotInterpret
- updateTarotDraw
- updateUserLogin

### 4. 导入数据库数据
参考 `../shared/database/` 目录下的说明文档，导入初始数据：
- 冥想音频数据
- 情绪文案数据
- 其他初始数据

详见：
- `../shared/database/README.md`
- `../shared/database/README_情绪文案导入说明.md`
- `../shared/database/冥想数据修复说明.md`

### 5. 编译运行
点击「编译」按钮，即可在模拟器中预览小程序。

---

## 📁 目录结构

```
miniprogram/
├── pages/                # 页面
│   ├── home/             # 首页
│   ├── chat/             # AI 聊天
│   ├── meditation/       # 冥想
│   ├── emotion/          # 情绪记录
│   ├── profile/          # 个人中心
│   ├── tarot/            # 塔罗牌
│   ├── mbti-test/        # MBTI 测试
│   ├── chakraTest/       # 脉轮测试
│   ├── oh/               # OH 卡牌
│   └── ...               # 其他页面
├── components/           # 组件
│   ├── audio-float/      # 全局悬浮音乐控制
│   ├── brand-navbar/     # 品牌导航栏
│   ├── chakra-radar/     # 脉轮雷达图
│   ├── ec-canvas/        # ECharts 画布
│   └── tab-icon/         # Tab 图标
├── cloudfunctions/       # 云函数
│   ├── aiChat/           # AI 聊天
│   ├── aiProxy/          # AI 代理
│   ├── emotionInterpret/ # 情绪解读
│   ├── tarotInterpret/   # 塔罗解读
│   ├── mbti-analyze/     # MBTI 分析
│   └── ...               # 其他云函数
├── utils/                # 工具函数
│   ├── aiStream.js       # AI 流式输出
│   ├── common.js         # 通用工具
│   ├── userProfile.js    # 用户档案
│   ├── request.js        # 网络请求
│   └── ...               # 其他工具
├── custom-tab-bar/       # 自定义 TabBar
├── subpackages/          # 分包
├── app.js                # 小程序入口
├── app.json              # 小程序配置
├── app.wxss              # 全局样式
├── project.config.json   # 项目配置
└── sitemap.json          # 站点地图
```

---

## 🎯 主要功能

### 核心功能
- 🎭 **情绪记录** - 记录每日情绪，AI 智能解读
- 🧘 **冥想音频** - 脉轮冥想、情绪疗愈等音频
- 💬 **AI 聊天** - 心语 AI 助手，陪伴式对话
- 👤 **个人档案** - 管理个人信息、星座、MBTI 等

### 轻工具
- 🔮 **塔罗牌占卜** - 单张抽牌、三张时间流等
- 🧠 **MBTI 测试** - 性格测试与深度解读
- 🌈 **脉轮测试** - 七轮能量测试与分析
- 🎴 **OH 卡牌** - 潜意识探索工具
- 🎯 **霍兰德职业兴趣测试**
- 💪 **行为优势测试**

### 其他功能
- 📅 **习惯日历** - 记录每日习惯打卡
- 📝 **计划管理** - 日计划、周计划、月计划
- 🌟 **探索页** - 发现更多心理学工具

---

## 🗄️ 数据库集合

小程序使用微信云开发数据库，主要集合包括：

- `users` - 用户信息
- `emotions` - 情绪记录
- `meditations` - 冥想音频
- `tarot_draws` - 塔罗抽牌记录
- `mbti_results` - MBTI 测试结果
- `chakra_results` - 脉轮测试结果
- `quotes` - 温暖文案
- `habit_records` - 习惯打卡记录
- `plans` - 计划记录

详见 `../shared/database/README.md`

---

## 🔧 云函数说明

### AI 相关
- **aiChat** - AI 聊天（流式输出）
- **aiProxy** - AI 代理（转发到腾讯云服务器）
- **emotionInterpret** - 情绪解读
- **tarotInterpret** - 塔罗解读
- **ohInterpret** - OH 卡解读
- **mbti-analyze** - MBTI 深度分析

### 数据处理
- **analyzeChakraOverall** - 脉轮整体分析
- **analyzeChakraResult** - 脉轮结果分析
- **getHabitCalendarData** - 获取习惯日历数据
- **updateTarotDraw** - 更新塔罗抽牌记录
- **updateUserLogin** - 更新用户登录信息

---

## 🎨 图片资源

所有图片资源已移至 `../shared/images/` 目录。

小程序中引用图片时，使用相对路径：
```javascript
// 错误（旧路径）
'/images/icon.png'

// 正确（新路径 - 如果需要引用共享资源）
// 注意：小程序无法直接访问父目录，需要将图片复制到小程序目录
// 或者使用云存储
```

**建议**：将常用图片上传到云存储，使用云存储 URL。

详见 `../shared/images/README.md`

---

## ⚙️ 配置说明

### project.config.json
小程序项目配置文件，包含：
- AppID
- 云函数根目录
- 编译设置
- 打包忽略规则

### app.json
小程序全局配置，包含：
- 页面路径
- 分包配置
- TabBar 配置
- 权限配置
- 云开发配置

---

## 🚨 注意事项

1. **云开发环境** - 确保已正确配置云开发环境 ID
2. **云函数** - 所有云函数需要上传并部署后才能使用
3. **数据库权限** - 确保数据库集合权限设置正确
4. **图片资源** - 建议使用云存储管理图片
5. **API Key** - 敏感信息不要提交到代码仓库

---

## 📞 支持

如有问题，请查看：
- 微信小程序官方文档：https://developers.weixin.qq.com/miniprogram/dev/
- 云开发文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html

