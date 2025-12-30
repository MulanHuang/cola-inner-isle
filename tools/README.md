# InnerSeed 工具集

迁移期使用的服务器、代理和脚本工具。

## 📁 目录结构

```
tools/
├── server/               # MBTI 深度解读 API 服务器
├── vercel-proxy/         # Vercel 代理服务
└── scripts/              # 数据处理脚本
```

---

## 🖥️ server/ - MBTI API 服务器

基于 **Express** 的 Node.js 服务器，提供 MBTI 深度解读功能。

### 快速开始

```bash
cd server
npm install
npm start
```

服务器将在 http://localhost:3000 启动。

### 开发模式

```bash
npm run dev
```

使用 nodemon 自动重启。

### API 端点

- `POST /api/mbti-analyze` - MBTI 深度分析

### 配置

创建 `.env` 文件：
```env
OPENAI_API_KEY=sk-xxx
PORT=3000
```

### 文件说明

- `index.js` - 服务器入口
- `api/mbti-analyze.js` - MBTI 分析 API
- `prompts/mbti-analysis-prompt.js` - MBTI 分析 Prompt
- `package.json` - 依赖管理

---

## 🌐 vercel-proxy/ - Vercel 代理

用于代理 OpenAI API 请求的 Vercel 函数，解决小程序无法直接调用 OpenAI API 的问题。

### 部署到 Vercel

```bash
cd vercel-proxy
vercel
```

### API 端点

- `POST /api/openai` - OpenAI API 代理
- `POST /api/speech` - 语音合成代理

### 配置

在 Vercel 项目设置中添加环境变量：
```
OPENAI_API_KEY=sk-xxx
```

### 文件说明

- `api/openai.js` - OpenAI API 代理
- `api/speech.js` - 语音合成代理
- `vercel.json` - Vercel 配置

---

## 📜 scripts/ - 数据处理脚本

用于处理和上传数据的 Node.js 脚本。

### add-reversed.js

添加塔罗牌逆位数据。

```bash
node scripts/add-reversed.js
```

### merge-official-reversed.js

合并官方塔罗牌逆位数据。

```bash
node scripts/merge-official-reversed.js
```

### test-tarot-data.js

测试塔罗牌数据的完整性和正确性。

```bash
node scripts/test-tarot-data.js
```

### upload-to-cloud.js

上传数据到微信云存储。

```bash
node scripts/upload-to-cloud.js
```

**注意**：需要先配置云开发环境。

---

## 🚨 注意事项

### 关于迁移

这些工具是在项目迁移期间使用的临时解决方案：

- **server/** - 未来可能会被 Next.js API Routes 替代
- **vercel-proxy/** - 未来可能会被统一的后端服务替代
- **scripts/** - 数据处理完成后可能不再需要

### 维护状态

- ⚠️ **临时工具** - 这些工具可能会在未来被移除或重构
- ⚠️ **最小维护** - 仅在必要时进行维护
- ⚠️ **不推荐扩展** - 新功能应该在 Web 或小程序中实现

---

## 🔧 技术栈

### server/
- **框架**: Express
- **语言**: JavaScript (Node.js)
- **AI**: OpenAI API
- **依赖**: cors, dotenv, axios

### vercel-proxy/
- **平台**: Vercel Serverless Functions
- **语言**: JavaScript (Node.js)
- **AI**: OpenAI API

### scripts/
- **语言**: JavaScript (Node.js)
- **云服务**: 微信云开发

---

## 📝 开发指南

### 添加新脚本

1. 在 `scripts/` 目录下创建新的 `.js` 文件
2. 添加必要的依赖
3. 编写脚本逻辑
4. 更新本 README

### 修改 API

1. 修改 `server/api/` 或 `vercel-proxy/api/` 中的文件
2. 测试 API 端点
3. 更新文档

---

## 📞 支持

如有问题，请查看相关文档或联系项目维护者。

**建议**：优先使用 Web 应用（`../web/`）的 API Routes 实现新功能。

