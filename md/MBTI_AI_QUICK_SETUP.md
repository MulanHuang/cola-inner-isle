# ⚡ MBTI AI 解读 - 5 分钟快速配置

## 🎯 目标

让 MBTI 测试结果页面的"获取 AI 深度解读"按钮能够正常工作。

---

## 📋 配置清单

### ✅ 方案 A：使用微信云函数（推荐）

#### 第 1 步：初始化云开发（1 分钟）

在 `app.js` 中添加：

```javascript
App({
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: "your-env-id", // 👈 替换为你的云开发环境 ID
      traceUser: true,
    });
  },
});
```

#### 第 2 步：部署云函数（2 分钟）

1. 在微信开发者工具中，右键点击 `cloudfunctions/mbti-analyze`
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成（约 1-2 分钟）

#### 第 3 步：配置 AI 服务（2 分钟）

编辑 `cloudfunctions/mbti-analyze/index.js`，选择一个 AI 服务：

**选项 1：使用 OpenAI（推荐）**

```javascript
// 1. 在 package.json 中添加依赖
{
  "dependencies": {
    "wx-server-sdk": "~2.6.3",
    "openai": "^4.20.0"
  }
}

// 2. 在 index.js 中添加代码
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: 'sk-your-api-key-here' // 👈 替换为你的 OpenAI API Key
});

// 在 exports.main 中调用
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt }
  ],
  temperature: 1,
  max_tokens: 1500
});

const analysis = completion.choices[0].message.content;
```

**选项 2：使用通义千问（国内推荐）**

```javascript
// 1. 在 package.json 中添加依赖
{
  "dependencies": {
    "wx-server-sdk": "~2.6.3",
    "axios": "^1.6.0"
  }
}

// 2. 在 index.js 中添加代码
const axios = require('axios');

const response = await axios.post(
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  {
    model: "qwen-turbo",
    input: {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ]
    },
    parameters: { temperature: 0.7 }
  },
  {
    headers: {
      'Authorization': 'Bearer sk-your-api-key-here', // 👈 替换为你的 API Key
      'Content-Type': 'application/json'
    }
  }
);

const analysis = response.data.output.text;
```

#### 第 4 步：重新部署（1 分钟）

1. 右键点击 `cloudfunctions/mbti-analyze`
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

#### 第 5 步：测试（1 分钟）

1. 在小程序中完成 MBTI 测试
2. 在结果页点击"获取 AI 深度解读"
3. 等待 5-10 秒，查看生成的解读

---

### ✅ 方案 B：使用独立服务器

#### 第 1 步：安装依赖（1 分钟）

```bash
cd server
npm install
```

#### 第 2 步：配置环境变量（1 分钟）

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3000
OPENAI_API_KEY=sk-your-api-key-here  # 👈 替换为你的 API Key
```

#### 第 3 步：启动服务器（1 分钟）

```bash
npm start
```

#### 第 4 步：修改前端代码（1 分钟）

编辑 `pages/mbti-result/mbti-result.js`：

```javascript
getAiAnalysis() {
  wx.showLoading({ title: '生成中...', mask: true });

  const { type, scores } = this.data;

  // 使用 HTTP API 而不是云函数
  this.callHttpAPI(type, scores);
}
```

并修改 API 地址：

```javascript
callHttpAPI(type, scores) {
  wx.request({
    url: 'https://your-domain.com/api/mbti/analyze', // 👈 替换为你的服务器地址
    // ...
  });
}
```

#### 第 5 步：测试（1 分钟）

同方案 A 的第 5 步。

---

## 🔑 获取 API Key

### OpenAI

1. 访问 https://platform.openai.com/api-keys
2. 注册/登录账号
3. 创建新的 API Key
4. 复制 Key（格式：`sk-...`）

### 通义千问

1. 访问 https://dashscope.aliyun.com/
2. 注册/登录账号
3. 创建 API Key
4. 复制 Key

### 文心一言

1. 访问 https://cloud.baidu.com/product/wenxinworkshop
2. 注册/登录账号
3. 创建应用获取 API Key

---

## 🐛 常见问题

### Q: 云函数调用失败？

**检查清单**：

- [ ] 云开发环境是否已初始化？
- [ ] 云函数是否已正确部署？
- [ ] API Key 是否正确配置？
- [ ] 网络是否正常？

**解决方法**：

1. 查看云函数日志（云开发控制台 → 云函数 → 日志）
2. 检查控制台错误信息
3. 确认 API Key 有效且有余额

### Q: 生成的内容不理想？

**调整参数**：

- `temperature`: 0.5-0.9（越高越有创意）
- `max_tokens`: 1000-2000（控制长度）

**优化 Prompt**：

- 添加更多示例
- 强调特定风格
- 调整字数要求

### Q: 调用太慢？

**优化方法**：

- 使用更快的模型（如 gpt-3.5-turbo）
- 减少 max_tokens
- 使用国内 AI 服务

---

## ✅ 完成检查

- [ ] 云开发已初始化
- [ ] 云函数已部署
- [ ] AI 服务已配置
- [ ] API Key 已设置
- [ ] 测试通过

---

## 📚 更多资源

- 详细部署指南：`MBTI_AI_ANALYSIS_GUIDE.md`
- Prompt 示例：`MBTI_PROMPT_EXAMPLES.md`
- 完整功能文档：`MBTI_TEST_README.md`

---

## 🎉 恭喜！

你的 MBTI AI 深度解读功能已经配置完成！

现在用户可以获得温柔、专业、个性化的性格分析了。✨
