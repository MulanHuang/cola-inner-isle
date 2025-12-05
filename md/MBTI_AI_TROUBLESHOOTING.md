# 🔧 MBTI AI 解读功能 - 故障排查指南

## 问题：点击"获取 AI 深度解读"按钮没有反应

---

## 📋 快速诊断清单

### 1️⃣ 检查云开发环境

#### ✅ 检查 app.js 中的云开发初始化

打开 `app.js`，确认有以下代码：

```javascript
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: wx.cloud.DYNAMIC_CURRENT_ENV,  // ✅ 已配置
        traceUser: true,
      });
    }
  }
});
```

**状态**：✅ 已正确配置

---

### 2️⃣ 检查云函数是否已部署

#### 步骤 1：查看云函数列表

1. 在微信开发者工具中，点击左侧"云开发"按钮
2. 进入"云函数"页面
3. 查看是否有 `mbti-analyze` 云函数

#### 步骤 2：部署云函数

如果没有看到 `mbti-analyze`，需要部署：

1. 在项目中找到 `cloudfunctions/mbti-analyze` 文件夹
2. 右键点击该文件夹
3. 选择"上传并部署：云端安装依赖"
4. 等待部署完成（约 1-2 分钟）

**常见问题**：
- ❌ 如果看不到 `cloudfunctions` 文件夹，需要先在云开发控制台创建环境
- ❌ 如果部署失败，检查网络连接和云开发权限

---

### 3️⃣ 检查控制台错误信息

#### 打开调试控制台

1. 在微信开发者工具中，点击底部"Console"标签
2. 点击"获取 AI 深度解读"按钮
3. 查看控制台输出的错误信息

#### 常见错误及解决方法

**错误 1：`wx.cloud is not defined`**
```
解决方法：
1. 检查基础库版本是否 >= 2.2.3
2. 在"详情" → "本地设置"中勾选"不校验合法域名"
3. 确认 app.js 中已初始化云开发
```

**错误 2：`cloud function not found`**
```
解决方法：
1. 确认云函数已正确部署
2. 检查云函数名称是否为 mbti-analyze
3. 在云开发控制台查看云函数列表
```

**错误 3：`env not found` 或 `environment error`**
```
解决方法：
1. 确认已创建云开发环境
2. 在云开发控制台查看环境 ID
3. 确认 app.js 中使用了正确的环境 ID
```

**错误 4：云函数返回 `success: false`**
```
解决方法：
1. 查看云函数日志（云开发控制台 → 云函数 → 日志）
2. 检查传入的参数是否正确
3. 确认云函数代码没有语法错误
```

---

### 4️⃣ 测试云函数

#### 方法 1：在控制台直接测试

在微信开发者工具的 Console 中输入：

```javascript
wx.cloud.callFunction({
  name: 'mbti-analyze',
  data: {
    type: 'INFJ',
    scores: { E: 5, I: 13, S: 8, N: 10, T: 7, F: 10, J: 11, P: 6 }
  }
}).then(res => {
  console.log('云函数返回:', res);
}).catch(err => {
  console.error('云函数错误:', err);
});
```

#### 方法 2：在云开发控制台测试

1. 打开云开发控制台
2. 进入"云函数"页面
3. 点击 `mbti-analyze` 云函数
4. 点击"测试"按钮
5. 输入测试数据：
```json
{
  "type": "INFJ",
  "scores": {
    "E": 5,
    "I": 13,
    "S": 8,
    "N": 10,
    "T": 7,
    "F": 10,
    "J": 11,
    "P": 6
  }
}
```
6. 查看返回结果

**预期返回**：
```json
{
  "success": true,
  "analysis": "【核心特质总结】\n你是一个 INFJ 类型的人..."
}
```

---

### 5️⃣ 检查前端代码

#### 确认按钮绑定

打开 `pages/mbti-result/mbti-result.wxml`，确认按钮有正确的事件绑定：

```xml
<button bindtap="getAiAnalysis">获取 AI 深度解读</button>
```

#### 确认函数存在

打开 `pages/mbti-result/mbti-result.js`，确认有 `getAiAnalysis` 函数。

---

## 🔍 详细排查步骤

### 步骤 1：确认云开发环境已创建

1. 打开微信开发者工具
2. 点击"云开发"按钮
3. 如果提示"开通云开发"，点击开通
4. 创建一个新环境（免费版即可）
5. 记录环境 ID

### 步骤 2：部署云函数

1. 找到 `cloudfunctions/mbti-analyze` 文件夹
2. 右键点击 → "上传并部署：云端安装依赖"
3. 等待部署完成
4. 在云开发控制台确认云函数已部署

### 步骤 3：测试云函数

使用上面的测试方法，确认云函数能正常返回数据。

### 步骤 4：测试前端调用

1. 完成一次 MBTI 测试
2. 在结果页点击"获取 AI 深度解读"
3. 查看控制台输出
4. 确认是否显示解读内容

---

## 💡 临时解决方案

如果云函数暂时无法使用，可以先使用默认解读：

### 方法 1：修改前端代码直接显示默认解读

编辑 `pages/mbti-result/mbti-result.js`：

```javascript
getAiAnalysis() {
  // 临时：直接显示默认解读
  this.showDefaultAnalysis();
  
  // 原代码（暂时注释）
  // wx.showLoading({ title: '生成中...', mask: true });
  // const { type, scores } = this.data;
  // this.callCloudFunction(type, scores);
}
```

### 方法 2：使用 HTTP API（如果有自己的服务器）

编辑 `pages/mbti-result/mbti-result.js`：

```javascript
getAiAnalysis() {
  wx.showLoading({ title: '生成中...', mask: true });
  const { type, scores } = this.data;
  
  // 使用 HTTP API 而不是云函数
  this.callHttpAPI(type, scores);
}
```

---

## 📞 获取帮助

### 查看日志

1. **前端日志**：微信开发者工具 → Console
2. **云函数日志**：云开发控制台 → 云函数 → 日志

### 常见问题文档

- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [云函数开发指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)

---

## ✅ 检查清单

完成以下检查，确保功能正常：

- [ ] 云开发环境已创建
- [ ] app.js 中已初始化云开发
- [ ] 云函数 mbti-analyze 已部署
- [ ] 云函数测试通过
- [ ] 前端按钮有正确的事件绑定
- [ ] 控制台没有错误信息
- [ ] 点击按钮后能看到解读内容

---

## 🎯 下一步

如果以上步骤都完成了，但仍然不工作，请：

1. 截图控制台的错误信息
2. 查看云函数日志
3. 检查网络连接
4. 尝试重启微信开发者工具

如果需要接入真实的 AI 服务（OpenAI、通义千问等），请参考：
- [MBTI_AI_ANALYSIS_GUIDE.md](MBTI_AI_ANALYSIS_GUIDE.md) - 详细部署指南
- [MBTI_AI_QUICK_SETUP.md](MBTI_AI_QUICK_SETUP.md) - 快速配置指南

