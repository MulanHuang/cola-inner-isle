# InnerSeed 项目结构总览

## 📂 完整目录结构

```
InnerSeed/
│
├── pages/                          # 页面目录
│   │
│   ├── home/                       # 首页
│   │   ├── home.wxml              # 页面结构
│   │   ├── home.wxss              # 页面样式
│   │   ├── home.js                # 页面逻辑
│   │   └── home.json              # 页面配置
│   │
│   ├── chat/                       # AI 对话页面
│   │   ├── chat.wxml
│   │   ├── chat.wxss
│   │   ├── chat.js
│   │   └── chat.json
│   │
│   ├── meditation/                 # 冥想模块
│   │   ├── meditation.wxml        # 冥想列表
│   │   ├── meditation.wxss
│   │   ├── meditation.js
│   │   ├── meditation.json
│   │   └── player/                # 播放器子页面
│   │       ├── player.wxml
│   │       ├── player.wxss
│   │       ├── player.js
│   │       └── player.json
│   │
│   ├── emotion/                    # 情绪记录模块
│   │   ├── emotion.wxml           # 情绪记录
│   │   ├── emotion.wxss
│   │   ├── emotion.js
│   │   ├── emotion.json
│   │   └── history/               # 历史记录子页面
│   │       ├── history.wxml
│   │       ├── history.wxss
│   │       ├── history.js
│   │       └── history.json
│   │
│   ├── explore/                    # 自我探索模块
│   │   ├── explore.wxml           # 探索主页
│   │   ├── explore.wxss
│   │   ├── explore.js
│   │   ├── explore.json
│   │   ├── mbti/                  # MBTI 子页面
│   │   │   ├── mbti.wxml
│   │   │   ├── mbti.wxss
│   │   │   ├── mbti.js
│   │   │   └── mbti.json
│   │   ├── zodiac/                # 星座子页面
│   │   │   ├── zodiac.wxml
│   │   │   ├── zodiac.wxss
│   │   │   ├── zodiac.js
│   │   │   └── zodiac.json
│   │   └── innerchild/            # 内在小孩子页面
│   │       ├── innerchild.wxml
│   │       ├── innerchild.wxss
│   │       ├── innerchild.js
│   │       └── innerchild.json
│   │
│   ├── profile/                    # 用户中心
│   │   ├── profile.wxml
│   │   ├── profile.wxss
│   │   ├── profile.js
│   │   └── profile.json
│   │
│   └── tarot/                      # 塔罗牌页面
│       ├── tarot.wxml
│       ├── tarot.wxss
│       ├── tarot.js
│       └── tarot.json
│
├── cloudfunctions/                 # 云函数目录
│   │
│   ├── aiChat/                    # AI 对话云函数
│   │   ├── index.js               # 云函数入口
│   │   ├── package.json           # 依赖配置
│   │   └── config.json            # 云函数配置
│   │
│   ├── tarotInterpret/            # 塔罗解读云函数
│   │   ├── index.js
│   │   ├── package.json
│   │   └── config.json
│   │
│   └── speechToText/              # 语音识别云函数
│       ├── index.js
│       ├── package.json
│       └── config.json
│
├── database/                       # 数据库文档
│   ├── README.md                  # 数据库设计说明
│   └── init-data/                 # 初始数据
│       ├── quotes.json            # 每日一句数据
│       ├── tarotCards.json        # 塔罗牌数据
│       └── meditations.json       # 冥想音频数据
│
├── images/                         # 图片资源目录
│   ├── README.md                  # 图片资源说明
│   ├── tab/                       # 底部导航图标
│   ├── tarot/                     # 塔罗牌图片
│   ├── meditation/                # 冥想封面
│   ├── default-avatar.png         # 默认头像
│   ├── ai-avatar.png              # AI 头像
│   └── user-avatar.png            # 用户头像
│
├── app.js                          # 小程序入口文件
├── app.json                        # 全局配置
├── app.wxss                        # 全局样式
├── project.config.json             # 项目配置
├── sitemap.json                    # 站点地图配置
├── README.md                       # 项目说明文档
└── PROJECT_STRUCTURE.md            # 本文件
```

## 📊 数据库集合

| 集合名 | 说明 | 主要字段 |
|--------|------|----------|
| users | 用户信息 | name, birthday, zodiac, mbti, bloodType |
| emotions | 情绪记录 | emotionId, emotionName, description, tags |
| chats | 对话记录 | role, content, createTime |
| meditations | 冥想音频 | title, category, audioUrl, cover, duration |
| meditationHistory | 冥想历史 | audioId, audioTitle, category |
| quotes | 每日一句 | content, author |
| tarotCards | 塔罗牌 | name, keywords, meaning, image |
| tarotDraws | 塔罗记录 | cardId, date, question, interpretation |

## 🔧 云函数说明

| 云函数 | 功能 | 输入 | 输出 |
|--------|------|------|------|
| aiChat | AI 对话 | message, history | reply |
| tarotInterpret | 塔罗解读 | cardName, question | interpretation |
| speechToText | 语音识别 | filePath | text |

## 📱 页面路由

| 路径 | 页面 | 类型 |
|------|------|------|
| /pages/home/home | 首页 | TabBar |
| /pages/chat/chat | AI 对话 | TabBar |
| /pages/meditation/meditation | 冥想列表 | TabBar |
| /pages/profile/profile | 用户中心 | TabBar |
| /pages/meditation/player/player | 冥想播放器 | 普通页面 |
| /pages/emotion/emotion | 情绪记录 | 普通页面 |
| /pages/emotion/history/history | 情绪历史 | 普通页面 |
| /pages/explore/explore | 自我探索 | 普通页面 |
| /pages/explore/mbti/mbti | MBTI | 普通页面 |
| /pages/explore/zodiac/zodiac | 星座 | 普通页面 |
| /pages/explore/innerchild/innerchild | 内在小孩 | 普通页面 |
| /pages/tarot/tarot | 塔罗牌 | 普通页面 |

## 🎨 主题配置

### 颜色变量
- 主色：`#8B7355`（棕色）
- 辅助色：`#B8956A`（浅棕）
- 背景色：`#F5F1E8`（米色）
- 文字色：`#333333`（深灰）
- 次要文字：`#999999`（灰色）

### 字体大小
- 标题：`48rpx`
- 副标题：`36rpx`
- 正文：`28rpx`
- 辅助文字：`24rpx`

## 📦 依赖说明

### 小程序依赖
- 微信小程序基础库：`2.19.4` 或更高
- 云开发 SDK：`wx-server-sdk@~2.6.3`

### 云函数依赖
所有云函数都依赖：
```json
{
  "wx-server-sdk": "~2.6.3"
}
```

## 🔐 权限配置

### 小程序权限
- `scope.userInfo`：获取用户信息（可选）
- `scope.record`：录音功能

### 云函数权限
- `openapi.aiVoice.translateVoice`：语音识别（speechToText）

## 📝 开发规范

### 命名规范
- 文件名：小写字母 + 连字符（kebab-case）
- 变量名：驼峰命名（camelCase）
- 常量名：大写字母 + 下划线（UPPER_CASE）
- 类名：帕斯卡命名（PascalCase）

### 代码规范
- 使用 ES6+ 语法
- 使用 async/await 处理异步
- 统一使用 2 空格缩进
- 添加必要的注释

### 提交规范
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关

