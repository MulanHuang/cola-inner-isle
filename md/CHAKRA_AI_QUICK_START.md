# ⚡ 脉轮 AI 分析 - 快速开始

## 🎯 一分钟部署

### 1️⃣ 配置 API Key（必须）

在微信开发者工具 → 云开发控制台 → 设置 → 环境变量：

```
变量名：OPENAI_API_KEY
变量值：sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 2️⃣ 部署云函数（必须）

右键点击 `cloudfunctions/analyzeChakraResult` → 选择「上传并部署：云端安装依赖」

### 3️⃣ 编译运行（测试）

点击「编译」→ 进入脉轮测试 → 完成测试 → 查看结果页

---

## 📂 文件清单

### 新增文件（4 个）

```
✅ cloudfunctions/common/openaiClient.js          # OpenAI 客户端封装
✅ cloudfunctions/analyzeChakraResult/index.js    # 脉轮分析云函数
✅ cloudfunctions/analyzeChakraResult/package.json
✅ cloudfunctions/analyzeChakraResult/config.json
```

### 修改文件（3 个）

```
✏️ pages/chakraResult/index.js      # 添加 AI 分析调用逻辑
✏️ pages/chakraResult/index.wxml    # 添加 AI 分析展示区域
✏️ pages/chakraResult/index.wxss    # 添加 AI 分析样式
```

---

## 🎨 功能展示

### 前端展示流程

1. 用户完成测试 → 跳转到结果页
2. 显示「AI 正在为你生成专属分析...」（5-10 秒）
3. 成功后显示：
   - ✨ 整体总结
   - 🌈 七大脉轮详细分析（每个脉轮一张卡片）
   - 🌟 可以相信的自己
   - 🌱 适合关注的方向
   - 🧘‍♀️ 日常小练习
4. 失败时显示兜底文案（不影响原有功能）

### AI 分析内容示例

**整体总结**：

> 你的能量状态整体处于中等平衡，心轮和生殖轮表现出色，显示出你在情感连接和创造力方面的天赋。太阳神经丛轮和根轮可以多一些关注，这会帮助你建立更稳固的自信和安全感。

**根轮分析**：

- 分数：38
- 状态：可以关注
- 可能感受：偶尔焦虑，安全感不足，需要支持
- 建议：
  - 每天赤脚在草地上走 10 分钟
  - 练习深呼吸，感受身体与大地的连接
  - 多吃根茎类食物，如红薯、胡萝卜

---

## 🔧 自定义配置

### 修改 AI 模型

在 `cloudfunctions/analyzeChakraResult/index.js` 第 95 行：

```javascript
options: {
  model: "gpt-5-mini",  // 改为 "gpt-4o" 获得更好效果（但更贵）
  temperature: 1,
  maxTokens: 2000,
}
```

### 修改 AI 语气

在 `cloudfunctions/analyzeChakraResult/index.js` 第 54-68 行修改 `systemPrompt`

### 修改兜底文案

在 `pages/chakraResult/index.wxml` 第 86-90 行修改错误提示文案

---

## 💰 成本估算

- **gpt-5-mini**：约 ¥0.007 / 次（推荐）
- **gpt-4o**：约 ¥0.07 / 次（更准确）

假设每天 100 次测试：

- 使用 gpt-5.1：约 ¥0.7 / 天 = ¥21 / 月
- 使用 gpt-4o：约 ¥7 / 天 = ¥210 / 月

---

## 🐛 故障排查

### 问题 1：显示「分析未能生成」

**检查步骤**：

1. 云开发控制台 → 环境变量 → 确认 `OPENAI_API_KEY` 已配置
2. 云开发控制台 → 云函数 → analyzeChakraResult → 查看日志
3. 确认 OpenAI 账户有余额

### 问题 2：一直显示「分析中...」

**可能原因**：

- 网络问题
- OpenAI API 响应慢
- 超时（默认 30 秒）

**解决方法**：

- 检查网络连接
- 查看云函数日志
- 增加超时时间（在 `openaiClient.js` 中修改 `timeout`）

### 问题 3：返回格式错误

**解决方法**：

- 代码已自动处理 Markdown 格式
- 如仍有问题，查看云函数日志中的原始响应

---

## 📊 监控建议

### 查看云函数日志

云开发控制台 → 云函数 → analyzeChakraResult → 日志

关注以下信息：

- ✅ 成功：`分析完成，返回结果`
- ❌ 失败：`脉轮分析失败`
- ⚠️ 警告：`JSON 解析失败`

### 成本监控

云开发控制台 → 统计分析 → 云函数调用次数

---

## ✅ 测试清单

- [ ] 配置 OpenAI API Key
- [ ] 部署云函数成功
- [ ] 完成一次完整测试
- [ ] 查看 AI 分析结果正常显示
- [ ] 测试网络断开时的兜底文案
- [ ] 查看云函数日志无错误

---

## 📚 详细文档

完整部署指南：`CHAKRA_AI_ANALYSIS_README.md`

---

## 🎉 完成！

现在你的脉轮测试已经接入 AI 智能分析功能！

**下一步建议**：

1. 测试几次，观察 AI 生成的内容质量
2. 根据需要调整 System Prompt
3. 监控成本和调用次数
4. 收集用户反馈，持续优化

有问题随时查看详细文档或云函数日志！✨
