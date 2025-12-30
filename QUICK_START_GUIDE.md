# 🚀 InnerSeed 快速开始指南

整理后的项目结构更加清晰，请根据你的开发需求选择对应的目录。

---

## 📱 小程序开发

### 1. 打开项目
使用**微信开发者工具**打开 `miniprogram/` 目录（⚠️ 不是根目录！）

### 2. 配置云开发
1. 点击「云开发」按钮
2. 创建或选择云开发环境
3. 记录环境 ID

### 3. 上传云函数
在云开发控制台上传 `miniprogram/cloudfunctions/` 下的所有云函数

### 4. 导入数据
参考 `shared/database/` 目录下的说明文档导入数据

### 5. 运行
点击「编译」按钮即可预览

📖 **详细文档**: `miniprogram/README.md`

---

## 🌐 Web 应用开发

### 1. 进入目录
```bash
cd web
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
```bash
cp .env.example .env.local
# 编辑 .env.local 填入你的 API Key
```

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 访问
打开浏览器访问 http://localhost:3000

📖 **详细文档**: `web/README.md`

---

## 🔧 使用工具

### MBTI API 服务器
```bash
cd tools/server
npm install
npm start
```

### 运行数据脚本
```bash
cd tools/scripts
node test-tarot-data.js
```

📖 **详细文档**: `tools/README.md`

---

## 📦 管理共享资源

### 查看数据库数据
```bash
cd shared/database
# 查看 init-data/ 目录下的 JSON 文件
```

### 查看图片资源
```bash
cd shared/images
# 查看各个子目录下的图片
```

📖 **详细文档**: `shared/README.md`

---

## 📁 目录结构速查

```
InnerSeed/
├── web/                    # 🌐 Next.js Web 应用
│   ├── src/                # 源代码
│   ├── package.json        # 依赖管理
│   └── README.md           # 详细说明
│
├── miniprogram/           # 📱 微信小程序
│   ├── pages/              # 页面
│   ├── components/         # 组件
│   ├── cloudfunctions/     # 云函数
│   ├── app.json            # 配置
│   └── README.md           # 详细说明
│
├── tools/                 # 🔧 工具和脚本
│   ├── server/             # API 服务器
│   ├── vercel-proxy/       # 代理服务
│   ├── scripts/            # 数据脚本
│   └── README.md           # 详细说明
│
└── shared/                # 📦 共享资源
    ├── database/           # 数据库数据
    ├── images/             # 图片资源
    ├── assets/             # 其他资源
    └── README.md           # 详细说明
```

---

## ⚠️ 重要提示

### 小程序开发者
- ✅ 使用微信开发者工具打开 `miniprogram/` 目录
- ✅ 所有小程序代码都在 `miniprogram/` 目录下
- ❌ 不要打开根目录

### Web 开发者
- ✅ 在 `web/` 目录下执行所有 npm 命令
- ✅ 所有 Web 代码都在 `web/` 目录下
- ❌ 不要在根目录执行 npm 命令

### 共享资源
- ✅ 数据库数据在 `shared/database/`
- ✅ 图片资源在 `shared/images/`
- ⚠️ 小程序无法直接访问父目录，建议使用云存储

---

## 📚 文档索引

- **项目总览**: `README.md`
- **整理总结**: `PROJECT_REORGANIZATION_SUMMARY.md`
- **Web 应用**: `web/README.md`
- **微信小程序**: `miniprogram/README.md`
- **工具集**: `tools/README.md`
- **共享资源**: `shared/README.md`

---

## 🆘 常见问题

### Q: 小程序打开后找不到文件？
A: 请确保使用微信开发者工具打开的是 `miniprogram/` 目录，而不是根目录。

### Q: Web 应用 npm install 失败？
A: 请确保在 `web/` 目录下执行命令，而不是根目录。

### Q: 找不到图片资源？
A: 图片资源已移至 `shared/images/`，建议上传到云存储使用。

### Q: 云函数上传失败？
A: 确保云开发环境已正确配置，并且在微信开发者工具中打开的是 `miniprogram/` 目录。

---

## 💡 提示

- 每个目录都有独立的 README 文档，遇到问题先查看对应的 README
- 整理后的结构更加清晰，不同平台的开发互不干扰
- 所有文件都已安全移动，没有任何代码丢失

---

**祝开发顺利！** 🎉

