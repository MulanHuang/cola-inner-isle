# 🤖 脉轮测试 AI 分析功能 - 完整部署指南

## 📋 功能概述

本次改造为脉轮测试结果页接入了 OpenAI 最新模型，实现了：

✅ **智能分析**：根据 7 个脉轮分数自动生成详细分析  
✅ **个性化建议**：针对每个脉轮给出具体可操作的日常练习  
✅ **温柔陪伴**：使用非诊断性语言，温柔鼓励的语气  
✅ **优雅降级**：接口失败时显示兜底文案，不影响基础功能

---

## 📁 新增文件清单

### 1. 云函数相关（3 个文件）

```
cloudfunctions/
├── common/
│   └── openaiClient.js          # OpenAI 客户端封装（新增）
└── analyzeChakraResult/         # 脉轮分析云函数（新增）
    ├── index.js                 # 云函数主逻辑
    ├── package.json             # 依赖配置
    └── config.json              # 云函数配置
```

### 2. 前端页面改造（3 个文件）

```
pages/chakraResult/
├── index.js                     # 已修改：添加 AI 分析调用逻辑
├── index.wxml                   # 已修改：添加 AI 分析展示区域
└── index.wxss                   # 已修改：添加 AI 分析样式
```

---

## 🚀 部署步骤

### 第一步：配置 OpenAI API Key

在微信开发者工具中：

1. 打开「云开发」控制台
2. 进入「设置」→「环境变量」
3. 添加环境变量：
   - 变量名：`OPENAI_API_KEY`
   - 变量值：你的 OpenAI API Key（sk-xxx...）

**重要**：API Key 只在云函数端配置，不会暴露给前端。

### 第二步：部署云函数

在微信开发者工具中：

1. 右键点击 `cloudfunctions/analyzeChakraResult` 文件夹
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成（约 30 秒）

### 第三步：编译运行

1. 点击「编译」按钮
2. 进入「自我探索」→「脉轮测试」
3. 完成测试后查看结果页
4. 应该能看到「AI 正在为你生成专属分析...」的加载状态

---

## 🎯 功能说明

### 接口输入参数

云函数 `analyzeChakraResult` 接收以下参数：

```javascript
{
  chakraScores: {
    root: 38,              // 根轮分数
    sacral: 40,            // 生殖轮分数
    solarPlexus: 32,       // 太阳神经丛轮分数
    heart: 45,             // 心轮分数
    throat: 37,            // 喉轮分数
    thirdEye: 36,          // 眉心轮分数
    crown: 37              // 顶轮分数
  },
  level: "中等平衡",       // 整体平衡等级（可选）
  strongChakras: ["heart", "sacral"],  // 强项脉轮（可选）
  weakChakras: ["solarPlexus", "root"], // 较弱脉轮（可选）
  gender: "female",       // 性别（可选）
  age: 29,                // 年龄（可选）
  language: "zh"          // 语言，默认中文
}
```

### 接口输出格式

返回固定的 JSON 结构：

```javascript
{
  overall_summary: "整体总结文字...",
  chakra_details: [
    {
      name: "根轮",
      score: 38,
      status: "基本平衡",
      possible_feelings: "安全感尚可，偶尔焦虑，正在成长",
      suggestions: [
        "每天赤脚在草地上走 10 分钟",
        "练习深呼吸，感受身体与大地的连接",
        "多吃根茎类食物，如红薯、胡萝卜"
      ]
    },
    // ... 其他 6 个脉轮
  ],
  strengths: [
    "你的心轮能量充沛，善于给予和接受爱",
    "生殖轮平衡良好，情感表达自如"
  ],
  growth_focus: [
    "可以多关注太阳神经丛轮，培养自信和个人力量",
    "根轮需要一些支持，建议多做扎根练习"
  ],
  simple_practices: [
    "每天早晨做 5 分钟冥想",
    "写感恩日记，记录 3 件小事",
    "练习瑜伽的山式和战士式"
  ]
}
```

---

## 🎨 前端展示结构

结果页面从上到下的展示顺序：

1. **头部**：标题 + 副标题
2. **雷达图模块**：七大脉轮雷达图（原有）
3. **脉轮详细分析模块**：点击雷达图查看单个脉轮（原有）
4. **🆕 AI 智能分析区域**（新增）：
   - 整体总结卡片
   - 七大脉轮详细分析（每个脉轮一张卡片）
   - 可以相信的自己
   - 适合关注的方向
   - 日常小练习
5. **脉轮能量图**：条形图展示（原有）
6. **详细解读**：本地解读文案（原有）
7. **按钮组**：重新测试、历史记录、返回首页

---

## 🛡️ 安全性说明

### API Key 安全

✅ **正确做法**（已实现）：

- API Key 存储在云函数环境变量中
- 只在服务器端调用 OpenAI API
- 前端无法访问 API Key

❌ **错误做法**（已避免）：

- 不要在前端代码中硬编码 API Key
- 不要在小程序配置文件中暴露 API Key

### 统一封装

所有 OpenAI 调用都通过 `cloudfunctions/common/openaiClient.js` 统一管理：

```javascript
const { callOpenAI } = require("../common/index.js");

const result = await callOpenAI({
  systemPrompt: "你是一位温柔的陪伴者...",
  userPrompt: "用户的问题...",
  options: {
    model: "gpt-5-mini",
    temperature: 1,
    maxTokens: 2000,
  },
});
```

---

## 🔧 自定义配置

### 修改 AI 模型

在 `cloudfunctions/analyzeChakraResult/index.js` 中：

```javascript
const response = await callOpenAI({
  systemPrompt,
  userPrompt,
  options: {
    model: "gpt-5-mini", // 改为 "gpt-4o" 获得更好效果
    temperature: 1,
    maxTokens: 2000,
    timeout: 30000,
  },
});
```

### 修改 System Prompt

在 `cloudfunctions/analyzeChakraResult/index.js` 的 `systemPrompt` 变量中修改 AI 的角色定位和输出要求。

### 修改兜底文案

在 `pages/chakraResult/index.wxml` 中修改 `ai-error` 区域的文案。

---

## 🐛 常见问题

### 1. 显示「AI 分析未能生成」

**可能原因**：

- OpenAI API Key 未配置或无效
- 网络连接问题
- OpenAI API 配额不足

**解决方法**：

- 检查云函数环境变量中的 `OPENAI_API_KEY`
- 查看云函数日志（云开发控制台 → 云函数 → 日志）
- 确认 OpenAI 账户有足够余额

### 2. 返回的 JSON 格式不正确

**可能原因**：

- AI 返回了 Markdown 格式的 JSON（如 \`\`\`json）
- AI 没有严格按照要求输出

**解决方法**：

- 代码中已添加自动清理 Markdown 标记的逻辑
- 如果仍有问题，可以在 System Prompt 中强调「不要使用 Markdown」

### 3. 分析速度慢

**可能原因**：

- 使用了 `gpt-4o` 模型（更慢但更准确）
- OpenAI API 响应慢

**解决方法**：

- 使用 `gpt-5-mini` 模型（更快但稍弱）
- 调整 `maxTokens` 参数减少生成长度

---

## 📊 成本估算

使用 `gpt-5-mini` 模型：

- 输入：约 500 tokens（$0.00015 / 1K tokens）
- 输出：约 1500 tokens（$0.0006 / 1K tokens）
- **单次分析成本**：约 $0.001（不到 1 分钱）

使用 `gpt-4o` 模型：

- **单次分析成本**：约 $0.01（1 分钱）

---

## ✅ 测试清单

部署完成后，请测试以下场景：

- [ ] 完成脉轮测试，查看结果页是否显示「AI 正在分析...」
- [ ] 等待 5-10 秒，查看是否成功显示 AI 分析结果
- [ ] 检查 7 个脉轮是否都有详细分析
- [ ] 检查「可以相信的自己」等底部区域是否正常显示
- [ ] 模拟接口失败（关闭网络），查看是否显示兜底文案
- [ ] 查看云函数日志，确认没有错误

---

## 🎉 完成！

现在你的脉轮测试工具已经接入了 AI 智能分析功能！

如需进一步定制，可以修改：

- System Prompt（调整 AI 的语气和风格）
- 前端样式（修改颜色、布局等）
- 兜底文案（修改错误提示）

祝使用愉快！✨
