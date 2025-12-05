# 📝 脉轮 AI 分析 - 代码示例

## 1️⃣ OpenAI 客户端封装

**文件**：`cloudfunctions/common/openaiClient.js`

```javascript
const { callOpenAI } = require("../common/index.js");

// 基础调用
const result = await callOpenAI({
  systemPrompt: "你是一位温柔的陪伴者...",
  userPrompt: "用户的问题...",
});

// 自定义配置
const result = await callOpenAI({
  systemPrompt: "系统提示...",
  userPrompt: "用户提示...",
  options: {
    model: "gpt-5-mini", // 模型名称
    temperature: 1, // 温度参数
    maxTokens: 2000, // 最大 token 数
    timeout: 30000, // 超时时间（毫秒）
  },
});
```

---

## 2️⃣ 云函数调用示例

**文件**：`pages/chakraResult/index.js`

```javascript
// 调用云函数
const res = await wx.cloud.callFunction({
  name: "analyzeChakraResult",
  data: {
    chakraScores: {
      root: 38,
      sacral: 40,
      solarPlexus: 32,
      heart: 45,
      throat: 37,
      thirdEye: 36,
      crown: 37,
    },
    level: "中等平衡",
    strongChakras: ["heart", "sacral"],
    weakChakras: ["solarPlexus", "root"],
    language: "zh",
  },
});

// 处理返回结果
if (res.result && res.result.success) {
  this.setData({
    aiAnalysis: res.result.data,
    isAnalyzing: false,
  });
} else {
  // 显示兜底文案
  this.setData({
    isAnalyzing: false,
    analysisError: true,
  });
}
```

---

## 3️⃣ System Prompt 示例

**文件**：`cloudfunctions/analyzeChakraResult/index.js`

```javascript
const systemPrompt = `你是一位温柔、专业的身心健康陪伴者，专注于脉轮能量分析。

你的角色定位：
1. 温柔、中立、不带评判地陪伴用户探索自己的能量状态
2. 使用日常生活化的语言，避免过于玄学或神秘的表达
3. 绝对禁止使用任何医学或心理诊断词汇（如：治疗、治愈、抑郁症、焦虑症、障碍、疾病等）
4. 不提供医疗建议或心理治疗建议，只提供日常自我照顾的温柔提醒
5. 多用"也许"、"可以"、"可能"等非绝对语气
6. 关注用户的感受和体验，而非问题和缺陷

输出要求：
1. 必须返回严格的 JSON 格式，不要有任何额外文本、注释或 Markdown 标记
2. 不要增加或减少字段，严格按照指定的 JSON 结构输出
3. 所有文本内容使用中文
4. 语气温柔、鼓励、充满希望
5. 每个建议都要具体、可操作、生活化`;
```

---

## 4️⃣ User Prompt 示例

```javascript
const userPrompt = `请根据以下脉轮测试结果，生成一份温柔、详细的分析报告：

用户信息：
性别：female
年龄：29

脉轮分数（满分100）：
- 根轮：38
- 生殖轮：40
- 太阳神经丛轮：32
- 心轮：45
- 喉轮：37
- 眉心轮：36
- 顶轮：37

整体状态：中等平衡
相对强项：心轮、生殖轮
可以关注：太阳神经丛轮、根轮

请严格按照以下 JSON 格式输出（不要有任何额外文本）：
{
  "overall_summary": "整体总结，80-120字...",
  "chakra_details": [...],
  "strengths": [...],
  "growth_focus": [...],
  "simple_practices": [...]
}`;
```

---

## 5️⃣ 前端 WXML 条件渲染

**文件**：`pages/chakraResult/index.wxml`

```xml
<!-- 根据状态显示不同内容 -->
<view wx:if="{{showAiSection}}" class="ai-analysis-section">
  <!-- 分析中 -->
  <view wx:if="{{isAnalyzing}}" class="ai-loading card">
    <view class="loading-icon">🤖</view>
    <view class="loading-text">AI 正在为你生成专属分析...</view>
  </view>

  <!-- 分析失败 -->
  <view wx:elif="{{analysisError}}" class="ai-error card">
    <view class="error-text">本次详细分析未能生成</view>
  </view>

  <!-- 分析成功 -->
  <view wx:elif="{{aiAnalysis}}" class="ai-result">
    <!-- 显示 AI 生成的内容 -->
    <view class="ai-summary card">
      <view class="summary-content">{{aiAnalysis.overall_summary}}</view>
    </view>
  </view>
</view>
```

---

## 6️⃣ 错误处理示例

```javascript
async analyzeChakraResults(results) {
  this.setData({
    isAnalyzing: true,
    analysisError: false,
  });

  try {
    const res = await wx.cloud.callFunction({
      name: "analyzeChakraResult",
      data: { /* ... */ },
    });

    if (res.result && res.result.success) {
      // 成功
      this.setData({
        aiAnalysis: res.result.data,
        isAnalyzing: false,
      });
    } else {
      // 失败
      this.setData({
        isAnalyzing: false,
        analysisError: true,
      });
    }
  } catch (err) {
    console.error("调用 AI 分析失败：", err);
    // 显示兜底文案
    this.setData({
      isAnalyzing: false,
      analysisError: true,
    });
  }
}
```

---

## 7️⃣ 数据映射示例

```javascript
// 前端脉轮类型 → 后端脉轮类型
const chakraScores = {
  root: results.root?.percentage || 0,
  sacral: results.sacral?.percentage || 0,
  solarPlexus: results.solar?.percentage || 0, // 注意：前端是 solar
  heart: results.heart?.percentage || 0,
  throat: results.throat?.percentage || 0,
  thirdEye: results.third_eye?.percentage || 0, // 注意：前端是 third_eye
  crown: results.crown?.percentage || 0,
};
```

---

## 8️⃣ 样式示例

**文件**：`pages/chakraResult/index.wxss`

```css
/* AI 加载动画 */
.loading-icon {
  font-size: 80rpx;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
}

/* AI 分析卡片 */
.ai-summary {
  padding: 30rpx;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 20rpx;
}

/* 脉轮详细卡片 */
.ai-chakra-card {
  padding: 30rpx;
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}
```

---

## 🎯 完整调用流程

```
1. 用户完成测试
   ↓
2. chakraTest/index.js 计算分数
   ↓
3. 跳转到 chakraResult/index.js
   ↓
4. processResults() 处理数据
   ↓
5. analyzeChakraResults() 调用云函数
   ↓
6. 云函数 analyzeChakraResult/index.js
   ↓
7. callOpenAI() 调用 OpenAI API
   ↓
8. 返回 JSON 结果
   ↓
9. 前端展示 AI 分析
```

---

## 📚 相关文档

- 完整部署指南：`CHAKRA_AI_ANALYSIS_README.md`
- 快速开始：`CHAKRA_AI_QUICK_START.md`
