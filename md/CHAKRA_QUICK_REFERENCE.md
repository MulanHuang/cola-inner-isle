# 🎯 脉轮测试 - 快速参考卡片

## 📋 一分钟速查

### 🚀 快速开始
```bash
1. 创建云数据库集合：chakra_history
2. 编译小程序
3. 测试功能
```

### 📂 核心文件
```
pages/chakraTest/        # 测试页面
pages/chakraResult/      # 结果页面
pages/chakraTest/data/   # 数据配置
```

### 📊 关键数据
- **题目总数**：80题
- **脉轮数量**：7个
- **解读等级**：3档（低/中/高）
- **解读总数**：21种

---

## 🌈 七大脉轮速查表

| Emoji | 中文名 | 英文Key | 题目范围 | 题数 | 颜色 | 关键词 |
|-------|--------|---------|----------|------|------|--------|
| 🔴 | 海底轮 | root | 1-12 | 12 | #E53935 | 安全·稳定·生存 |
| 🟠 | 腹轮 | sacral | 13-23 | 11 | #FF6F00 | 创造·情感·愉悦 |
| 🟡 | 太阳神经丛轮 | solar | 24-35 | 12 | #FDD835 | 力量·自信·意志 |
| 💚 | 心轮 | heart | 36-47 | 12 | #43A047 | 爱·慈悲·连接 |
| 🔵 | 喉轮 | throat | 48-58 | 11 | #1E88E5 | 表达·真实·沟通 |
| 🟣 | 眉心轮 | third_eye | 59-69 | 11 | #5E35B1 | 直觉·洞察·智慧 |
| ⚪ | 顶轮 | crown | 70-80 | 11 | #9C27B0 | 灵性·合一·超越 |

---

## 🔢 评分算法速查

### 反转计分公式
```javascript
实际得分 = 6 - 用户选择的分数
```

### 百分比计算
```javascript
百分比 = (实际得分 / 最大分数) × 100
```

### 等级判定
```javascript
if (百分比 >= 70) return 'high';    // 流动良好
if (百分比 >= 40) return 'medium';  // 基本平衡
return 'low';                        // 能量偏弱
```

### 示例计算
```
海底轮（12题）：
- 用户全选1分 → 反转后每题5分 → 总分60 → 60/60 = 100%
- 用户全选3分 → 反转后每题3分 → 总分36 → 36/60 = 60%
- 用户全选5分 → 反转后每题1分 → 总分12 → 12/60 = 20%
```

---

## 📁 文件导入速查

### 在测试页面导入
```javascript
// pages/chakraTest/index.js
const { CHAKRA_QUESTIONS } = require('./data/questions.js');
const { CHAKRA_MAPPING } = require('./data/chakraMapping.js');
```

### 在结果页面导入
```javascript
// pages/chakraResult/index.js
const { CHAKRA_RESULT_CONFIG } = require('../chakraTest/data/chakraResultConfig.js');
```

---

## 🎨 UI颜色速查

### 主题色
```css
--primary-color: #8B7355;      /* 主色 */
--secondary-color: #B8956A;    /* 辅助色 */
--background-color: #F5F1E8;   /* 背景色 */
--card-bg: #FFFFFF;            /* 卡片背景 */
```

### 脉轮色
```css
--root-color: #E53935;         /* 海底轮-红 */
--sacral-color: #FF6F00;       /* 腹轮-橙 */
--solar-color: #FDD835;        /* 太阳神经丛轮-黄 */
--heart-color: #43A047;        /* 心轮-绿 */
--throat-color: #1E88E5;       /* 喉轮-蓝 */
--third-eye-color: #5E35B1;    /* 眉心轮-紫 */
--crown-color: #9C27B0;        /* 顶轮-紫罗兰 */
```

---

## 🗄️ 数据库速查

### 集合名称
```
chakra_history
```

### 权限设置
```
仅创建者可读写
```

### 数据结构
```javascript
{
  _id: "自动生成",
  _openid: "自动填充",
  testDate: "2024-01-15T10:30:00.000Z",
  timestamp: 1705315800000,
  answers: { "1": 3, "2": 4, ... },  // 80个键值对
  results: {
    root: { score: 45, maxScore: 60, percentage: 75 },
    sacral: { score: 30, maxScore: 55, percentage: 55 },
    // ... 其他5个脉轮
  }
}
```

---

## 🔧 常用代码片段

### 1. 计算单个脉轮得分
```javascript
function calculateChakraScore(answers, chakraType) {
  const questionIds = CHAKRA_MAPPING[chakraType].questionIds;
  let totalScore = 0;
  
  questionIds.forEach(id => {
    const userAnswer = answers[id] || 3;
    const reversedScore = 6 - userAnswer;
    totalScore += reversedScore;
  });
  
  const maxScore = questionIds.length * 5;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  return { score: totalScore, maxScore, percentage };
}
```

### 2. 保存到云数据库
```javascript
const db = wx.cloud.database();
db.collection('chakra_history').add({
  data: {
    testDate: new Date(),
    timestamp: Date.now(),
    answers: this.data.answers,
    results: results
  }
});
```

### 3. 页面跳转
```javascript
// 跳转到测试页面
wx.navigateTo({ url: '/pages/chakraTest/index' });

// 跳转到结果页面
wx.navigateTo({ 
  url: `/pages/chakraResult/index?results=${JSON.stringify(results)}` 
});
```

---

## 📖 文档速查

| 需求 | 文档 | 耗时 |
|------|------|------|
| 快速部署 | CHAKRA_TEST_QUICKSTART.md | 5分钟 |
| 完整了解 | CHAKRA_TEST_README.md | 15分钟 |
| 评分逻辑 | CHAKRA_SCORING_GUIDE.md | 10分钟 |
| 查看题目 | CHAKRA_QUESTIONS_LIST.md | 5分钟 |
| 复制数据 | CHAKRA_COMPLETE_JSON.md | 2分钟 |
| 查询映射 | CHAKRA_MAPPING_TABLE.md | 3分钟 |
| 准备上线 | CHAKRA_DEPLOYMENT_CHECKLIST.md | 20分钟 |
| 项目总览 | CHAKRA_FINAL_SUMMARY.md | 10分钟 |

---

## ✅ 检查清单

### 部署前
- [ ] 云开发已开通
- [ ] chakra_history 集合已创建
- [ ] 所有文件已复制到项目
- [ ] app.json 已更新路由

### 测试时
- [ ] 能进入测试页面
- [ ] 能正常答题
- [ ] 进度能保存
- [ ] 能查看结果
- [ ] 结果能保存到云端

### 上线前
- [ ] 所有功能测试通过
- [ ] UI样式符合设计
- [ ] 评分逻辑正确
- [ ] 错误处理完善
- [ ] 性能优化完成

---

## 🐛 常见问题速查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 找不到页面 | 路由未配置 | 检查 app.json |
| 点击无反应 | 方法未添加 | 检查 explore.js |
| 提交报错 | 数据库未创建 | 创建 chakra_history |
| 结果异常 | 参数传递失败 | 检查 URL 参数 |
| 进度不保存 | 存储权限问题 | 清除缓存重试 |

---

## 📞 快速联系

### 查看完整文档
```bash
# 打开文档索引
open CHAKRA_INDEX.md
```

### 查看流程图
- 系统架构流程图：已生成
- 评分算法流程图：已生成
- 文件结构图：已生成

---

## 🎉 一句话总结

**完整、专业、可直接使用的脉轮测试工具，包含80题+21解读+161建议，5分钟即可部署！**

---

**版本**：v1.0
**状态**：✅ 生产就绪
**更新**：2024年1月

