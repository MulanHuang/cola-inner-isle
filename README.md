# InnerSeed（可乐心岛）

一个集成了情绪记录、自我反思与轻工具体验的多平台应用项目。

## 📁 项目结构

本项目已按照功能和平台进行了清晰的目录分区，便于维护和开发：

```
InnerSeed/
├── web/                    # 🌐 Next.js Web 应用
├── miniprogram/           # 📱 微信小程序
├── tools/                 # 🔧 迁移期工具和脚本
└── shared/                # 📦 共享资源
```

---

## 🌐 Web 应用 (`web/`)

基于 **Next.js 14** 的现代 Web 应用，提供 AI 聊天、情绪分析等功能。

### 目录结构
```
web/
├── src/
│   ├── app/              # Next.js App Router
│   ├── lib/              # 核心库（AI Pipeline 等）
│   ├── prompts/          # AI Prompt 模板
│   └── services/         # 业务逻辑层
├── next.config.js        # Next.js 配置
├── tsconfig.json         # TypeScript 配置
├── package.json          # 依赖管理
└── *.md                  # 相关文档
```

### 快速开始
```bash
cd web
npm install
npm run dev
```

访问 http://localhost:3000

### 主要文档
- `QUICKSTART.md` - 快速开始指南
- `AI_PIPELINE_V1_RULES.md` - AI Pipeline 架构规则
- `CHAT_IMPLEMENTATION_EXAMPLE.md` - 聊天功能实现示例
- `CHAT_MIGRATION_COMPLETE.md` - 聊天功能迁移完成说明

---

## 📱 微信小程序 (`miniprogram/`)

完整的微信小程序应用，包含情绪记录、冥想、塔罗牌、MBTI 测试等功能。

### 目录结构
```
miniprogram/
├── pages/                # 页面
├── components/           # 组件
├── cloudfunctions/       # 云函数
├── utils/                # 工具函数
├── custom-tab-bar/       # 自定义 TabBar
├── subpackages/          # 分包
├── app.js                # 小程序入口
├── app.json              # 小程序配置
├── app.wxss              # 全局样式
└── project.config.json   # 项目配置
```

### 快速开始
1. 使用微信开发者工具打开 `miniprogram/` 目录
2. 配置云开发环境
3. 上传云函数
4. 导入数据库数据（参考 `shared/database/`）
5. 编译运行

### 主要功能
- 🎭 情绪记录与 AI 解读
- 🧘 冥想音频播放
- 🔮 塔罗牌占卜
- 🧠 MBTI 性格测试
- 💬 AI 聊天助手
- 📊 脉轮测试
- 🎴 OH 卡牌

---

## 🔧 工具 (`tools/`)

迁移期使用的服务器、代理和脚本工具。

### 目录结构
```
tools/
├── server/               # MBTI 深度解读 API 服务器
├── vercel-proxy/         # Vercel 代理服务
└── scripts/              # 数据处理脚本
```

### server/ - MBTI API 服务器
基于 Express 的 Node.js 服务器，提供 MBTI 深度解读功能。

```bash
cd tools/server
npm install
npm start
```

### vercel-proxy/ - Vercel 代理
用于代理 OpenAI API 请求的 Vercel 函数。

### scripts/ - 数据脚本
- `add-reversed.js` - 添加塔罗牌逆位数据
- `merge-official-reversed.js` - 合并官方逆位数据
- `test-tarot-data.js` - 测试塔罗牌数据
- `upload-to-cloud.js` - 上传数据到云存储

---

## 📦 共享资源 (`shared/`)

跨平台共享的数据和资源文件。

### 目录结构
```
shared/
├── database/             # 数据库初始化数据
├── images/               # 图片资源
└── assets/               # 其他资源文件
```

### database/ - 数据库数据
包含小程序云数据库的初始化数据和说明文档：
- `init-data/` - JSON 格式的初始数据
- `README.md` - 数据库设计文档
- `README_情绪文案导入说明.md` - 情绪文案导入指南
- `冥想数据修复说明.md` - 冥想数据修复指南

### images/ - 图片资源
小程序使用的所有图片资源，包括：
- 图标 (icons)
- TabBar 图标
- 塔罗牌图片
- 冥想封面
- 其他 UI 图片

详见 `shared/images/README.md`

### assets/ - 其他资源
- TabBar 图标
- 其他共享资源

---

## 🚀 开发指南

### 环境要求
- **Web**: Node.js 20+, npm/yarn/pnpm
- **小程序**: 微信开发者工具, 云开发环境

### 开发流程
1. **Web 开发**: 在 `web/` 目录下进行
2. **小程序开发**: 在 `miniprogram/` 目录下进行
3. **共享资源**: 在 `shared/` 目录下管理

### 注意事项
- 小程序的工作目录是 `miniprogram/`，使用微信开发者工具时请打开此目录
- Web 应用的工作目录是 `web/`
- 共享资源（如图片、数据库数据）统一放在 `shared/` 目录
- 迁移期工具放在 `tools/` 目录，未来可能会被移除或重构

---

## 📄 许可证

Private Project

---

## 👥 贡献

本项目为私有项目。

