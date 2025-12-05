# InnerSeed - 心灵陪伴小程序

InnerSeed 是一款温柔的心灵陪伴小程序，帮助用户探索内心、疗愈情绪、找到内在的平静。

## ✨ 核心功能

### 1. 首页 Home
- 📝 **今日一句**：每日治愈短句，可随机切换
- 🔮 **每日塔罗**：每天抽取一张塔罗牌，输入问题获取 AI 解读
- 🚀 **快捷入口**：情绪记录、AI对话、冥想
- 🌱 **自我探索**：MBTI、星座、内在小孩

### 2. AI 陪伴对话
- 💬 聊天气泡界面
- 🎤 支持文字输入 + 语音输入
- 🤖 AI 温柔回复（温柔、理性、非诊断）
- 💾 所有聊天记录自动保存

### 3. 冥想模块
8 大分类：
- 💖 情绪疗愈
- ✨ 灵性提升（含 7 大脉轮冥想）
- 🌙 睡眠
- 🔍 自我觉察
- 👶 内在小孩
- 🌊 身体放松
- 💫 肯定语
- 🌟 显化（温和版）

### 4. 情绪记录
- 😊 12 种情绪选择
- 📝 文字描述
- 🏷️ 可选标签
- 📊 历史记录和统计

### 5. 自我探索
- 🧩 **MBTI**：16 种人格类型
- ⭐ **星座**：根据生日自动计算
- 👶 **内在小孩**：疗愈练习和引导

### 6. 用户中心
- 👤 个人信息管理
- 📈 数据统计
- 📚 历史记录查看

## 🚀 快速开始

### 前置要求
- 微信开发者工具
- 微信小程序账号
- 微信云开发环境

### 安装步骤

#### 1. 克隆项目
```bash
cd InnerSeed
```

#### 2. 配置小程序 AppID
打开 `project.config.json`，修改：
```json
{
  "appid": "YOUR_APPID"  // 替换为你的小程序 AppID
}
```

#### 3. 配置云开发环境
打开 `app.js`，修改：
```javascript
wx.cloud.init({
  env: 'YOUR_CLOUD_ENV_ID',  // 替换为你的云开发环境 ID
  traceUser: true,
});
```

#### 4. 创建数据库集合
在微信开发者工具的云开发控制台中，创建以下集合：
- `users` - 用户信息
- `emotions` - 情绪记录
- `chats` - 对话记录
- `meditations` - 冥想音频
- `meditationHistory` - 冥想历史
- `quotes` - 每日一句
- `tarotCards` - 塔罗牌
- `tarotDraws` - 塔罗抽牌记录

详细字段说明见 `database/README.md`

#### 5. 导入初始数据
将 `database/init-data/` 目录下的 JSON 文件导入到对应的数据库集合中：
- `quotes.json` → `quotes` 集合
- `tarotCards.json` → `tarotCards` 集合
- `meditations.json` → `meditations` 集合

#### 6. 部署云函数
在微信开发者工具中，右键点击 `cloudfunctions` 目录下的每个云函数文件夹，选择"上传并部署：云端安装依赖"：
- `aiChat` - AI 对话
- `tarotInterpret` - 塔罗解读
- `speechToText` - 语音识别

#### 7. 配置 API（重要）
打开以下云函数文件，替换为你的 API：

**cloudfunctions/aiChat/index.js**
```javascript
// TODO: 替换为你的大模型 API
// 支持：OpenAI、文心一言、通义千问、讯飞星火等
```

**cloudfunctions/tarotInterpret/index.js**
```javascript
// TODO: 替换为你的大模型 API
```

**cloudfunctions/speechToText/index.js**
```javascript
// TODO: 替换为你的语音识别 API
// 支持：微信同声传译、腾讯云、阿里云、百度等
```

#### 8. 准备素材资源
将以下资源放入 `images` 目录：
- Tab 图标（home.png, chat.png, meditation.png, profile.png 及其 active 版本）
- 塔罗牌图片（tarot-back.png 和各牌面图片）
- 冥想封面图片
- 默认头像（default-avatar.png）
- AI 头像（ai-avatar.png）
- 用户头像（user-avatar.png）

### 运行项目
1. 在微信开发者工具中打开项目
2. 点击"编译"按钮
3. 在模拟器或真机中预览

## 📁 项目结构

```
InnerSeed/
├── pages/                    # 页面目录
│   ├── home/                # 首页
│   ├── chat/                # AI 对话
│   ├── meditation/          # 冥想
│   │   └── player/         # 播放器
│   ├── emotion/             # 情绪记录
│   │   └── history/        # 历史记录
│   ├── explore/             # 自我探索
│   │   ├── mbti/           # MBTI
│   │   ├── zodiac/         # 星座
│   │   └── innerchild/     # 内在小孩
│   ├── profile/             # 用户中心
│   └── tarot/               # 塔罗牌
├── cloudfunctions/          # 云函数
│   ├── aiChat/             # AI 对话
│   ├── tarotInterpret/     # 塔罗解读
│   └── speechToText/       # 语音识别
├── database/                # 数据库文档
│   ├── README.md           # 数据库设计说明
│   └── init-data/          # 初始数据
├── images/                  # 图片资源
├── app.js                   # 小程序入口
├── app.json                 # 全局配置
├── app.wxss                 # 全局样式
└── project.config.json      # 项目配置
```

## 🎨 设计风格

- **颜色主题**：大地色系（#8B7355, #B8956A, #F5F1E8）
- **风格**：干净、简约、治愈
- **字体**：系统默认字体
- **图标**：Emoji + 简约图标

## ⚠️ 注意事项

1. **隐私保护**：所有用户数据仅用户本人可见
2. **免责声明**：本应用不提供医疗诊断，如有严重心理问题请寻求专业帮助
3. **内容规范**：禁止涉及医疗诊断、宗教宣教、金钱预测
4. **API 配置**：务必配置真实的 AI API 和语音识别 API，否则相关功能无法使用

## 📝 TODO

- [ ] 配置真实的 AI API
- [ ] 配置语音识别 API
- [ ] 准备所有图片素材
- [ ] 准备冥想音频文件
- [ ] 完善塔罗牌图片
- [ ] 添加更多每日一句
- [ ] 优化 UI 细节
- [ ] 性能优化

## 📄 License

MIT License

## 🙏 致谢

感谢所有为心理健康和心灵成长做出贡献的人们。

