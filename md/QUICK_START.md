# InnerSeed 快速启动指南

## ✅ 问题已解决！

Tab 图标已创建完成，现在可以启动模拟器了。

## 📱 立即启动

1. **在微信开发者工具中点击"编译"按钮**
2. 模拟器应该可以正常启动了

## 🎨 当前图标状态

已创建 8 个占位符 PNG 图标：
- ✅ `images/tab/home.png` (灰色)
- ✅ `images/tab/home-active.png` (棕色)
- ✅ `images/tab/chat.png` (灰色)
- ✅ `images/tab/chat-active.png` (棕色)
- ✅ `images/tab/meditation.png` (灰色)
- ✅ `images/tab/meditation-active.png` (棕色)
- ✅ `images/tab/profile.png` (灰色)
- ✅ `images/tab/profile-active.png` (棕色)

**颜色方案：**
- 未选中：#999999 (灰色)
- 选中：#8B7355 (棕色)

## 🔧 后续配置（必须完成才能正常使用）

### 1. 配置小程序 AppID
打开 `project.config.json`，修改：
```json
{
  "appid": "你的小程序AppID"
}
```

### 2. 配置云开发环境
打开 `app.js`，修改：
```javascript
wx.cloud.init({
  env: '你的云开发环境ID',
  traceUser: true,
});
```

### 3. 创建数据库集合
在微信开发者工具的"云开发"控制台中创建以下集合：
- users
- emotions
- chats
- meditations
- meditationHistory
- quotes
- tarotCards
- tarotDraws

### 4. 导入初始数据
将以下文件导入到对应的数据库集合：
- `database/init-data/quotes.json` → quotes 集合
- `database/init-data/tarotCards.json` → tarotCards 集合
- `database/init-data/meditations.json` → meditations 集合

### 5. 部署云函数
右键点击以下文件夹，选择"上传并部署：云端安装依赖"：
- cloudfunctions/aiChat
- cloudfunctions/tarotInterpret
- cloudfunctions/speechToText

### 6. 配置 API（重要）
在云函数中配置真实的 API：
- `cloudfunctions/aiChat/index.js` - 配置 AI 对话 API
- `cloudfunctions/tarotInterpret/index.js` - 配置塔罗解读 API
- `cloudfunctions/speechToText/index.js` - 配置语音识别 API

## 🎨 改进图标（可选）

当前图标是简单的彩色方块占位符。如果想要更好看的图标：

### 方法 1：使用在线工具
1. 访问 https://www.iconfont.cn/ 或 https://www.flaticon.com/
2. 搜索并下载图标（home, chat, meditation, profile）
3. 调整大小为 81x81 像素
4. 替换 `images/tab/` 目录下的文件

### 方法 2：使用 Figma/Sketch 设计
1. 创建 81x81 画布
2. 设计图标
3. 导出为 PNG
4. 保存到 `images/tab/`

### 方法 3：使用 AI 生成
1. 使用 Midjourney 或 DALL-E 生成图标
2. 调整大小
3. 替换现有文件

## 📚 更多文档

- 完整说明：`README.md`
- 项目结构：`PROJECT_STRUCTURE.md`
- 交付清单：`DELIVERY_CHECKLIST.md`
- 数据库设计：`database/README.md`
- 图片资源：`images/README.md`

## ⚠️ 常见问题

### Q: 模拟器显示"Failed to launch simulator"
A: 检查是否所有图标文件都存在于 `images/tab/` 目录

### Q: 云函数调用失败
A: 确保已部署云函数并配置了正确的环境 ID

### Q: 数据库查询失败
A: 确保已创建所有必需的数据库集合

### Q: AI 回复是临时文本
A: 需要在云函数中配置真实的 AI API（查看 TODO 注释）

## 🎉 开始使用

现在你可以：
1. ✅ 点击"编译"启动模拟器
2. ✅ 浏览各个页面
3. ✅ 测试基本功能
4. ⚠️ 配置云开发后测试完整功能

祝你开发顺利！🌱

