# ✅ 脉轮测试 - 部署检查清单

## 📦 一、文件完整性检查

### 1. 核心功能文件

- ✅ `pages/chakraTest/index.wxml` - 测试页面结构
- ✅ `pages/chakraTest/index.wxss` - 测试页面样式
- ✅ `pages/chakraTest/index.js` - 测试页面逻辑
- ✅ `pages/chakraTest/index.json` - 测试页面配置

- ✅ `pages/chakraResult/index.wxml` - 结果页面结构
- ✅ `pages/chakraResult/index.wxss` - 结果页面样式
- ✅ `pages/chakraResult/index.js` - 结果页面逻辑
- ✅ `pages/chakraResult/index.json` - 结果页面配置

### 2. 数据配置文件

- ✅ `pages/chakraTest/data/questions.js` - 80道题库
- ✅ `pages/chakraTest/data/chakraInfo.js` - 脉轮信息（旧版，保留兼容）
- ✅ `pages/chakraTest/data/chakraMapping.js` - 脉轮映射配置（新增）
- ✅ `pages/chakraTest/data/chakraResultConfig.js` - 结果文案配置（新增）

### 3. 配置更新

- ✅ `app.json` - 已添加新页面路由
- ✅ `pages/explore/explore.wxml` - 已添加脉轮测试入口
- ✅ `pages/explore/explore.js` - 已添加跳转逻辑

### 4. 文档文件

- ✅ `CHAKRA_TEST_README.md` - 完整使用指南
- ✅ `CHAKRA_TEST_DATABASE.md` - 数据库结构文档
- ✅ `CHAKRA_TEST_QUICKSTART.md` - 快速部署指南
- ✅ `CHAKRA_TEST_SUMMARY.md` - 交付总结
- ✅ `CHAKRA_SCORING_GUIDE.md` - 评分规则详解
- ✅ `CHAKRA_QUESTIONS_LIST.md` - 80题完整清单
- ✅ `CHAKRA_COMPLETE_JSON.md` - 完整JSON数据
- ✅ `CHAKRA_MAPPING_TABLE.md` - 映射表格
- ✅ `CHAKRA_DEPLOYMENT_CHECKLIST.md` - 本检查清单

---

## 🔧 二、代码集成检查

### 1. 检查 app.json 路由配置

打开 `app.json`，确认包含以下路由：

```json
{
  "pages": [
    "pages/chakraTest/index",
    "pages/chakraResult/index"
  ]
}
```

**检查方法**：
```bash
# 在项目根目录执行
grep -A 5 "chakraTest" app.json
```

### 2. 检查自我探索页面集成

打开 `pages/explore/explore.wxml`，确认包含脉轮测试入口：

```xml
<view class="explore-item" bindtap="goToChakraTest">
  <view class="explore-icon">🌈</view>
  <view class="explore-content">
    <view class="explore-name">脉轮测试</view>
    <view class="explore-desc">探索你的能量中心</view>
  </view>
  <view class="explore-arrow">→</view>
</view>
```

打开 `pages/explore/explore.js`，确认包含跳转方法：

```javascript
goToChakraTest() {
  wx.navigateTo({ url: "/pages/chakraTest/index" });
}
```

### 3. 检查数据文件导出

确认所有数据文件都正确导出：

```javascript
// pages/chakraTest/data/questions.js
module.exports = { CHAKRA_QUESTIONS, OPTION_LABELS };

// pages/chakraTest/data/chakraMapping.js
module.exports = { CHAKRA_MAPPING };

// pages/chakraTest/data/chakraResultConfig.js
module.exports = { CHAKRA_RESULT_CONFIG };
```

---

## ☁️ 三、云开发配置检查

### 1. 云开发环境

- [ ] 已开通云开发
- [ ] 已选择云开发环境
- [ ] 云开发环境ID已配置

**检查方法**：
1. 打开微信开发者工具
2. 点击顶部菜单「云开发」
3. 确认能正常打开云开发控制台

### 2. 云数据库配置

- [ ] 已创建 `chakra_history` 集合
- [ ] 权限设置为「仅创建者可读写」
- [ ] 已创建索引（可选）

**创建步骤**：
1. 云开发控制台 → 数据库
2. 点击「添加集合」
3. 输入集合名：`chakra_history`
4. 权限：仅创建者可读写
5. 点击「确定」

**索引配置（可选）**：
```json
{
  "indexName": "user_date_index",
  "keys": [
    { "field": "_openid", "order": "asc" },
    { "field": "testDate", "order": "desc" }
  ]
}
```

---

## 🧪 四、功能测试清单

### 1. 测试页面功能

- [ ] 能正常进入测试页面
- [ ] 题目显示正确（共80题）
- [ ] 进度条显示正确（x/80）
- [ ] 能选择答案（1-5分）
- [ ] 选中状态显示正确
- [ ] 「上一题」按钮功能正常
- [ ] 「下一题」按钮功能正常
- [ ] 第1题时「上一题」按钮禁用
- [ ] 第80题时显示「查看结果」按钮
- [ ] 提交前有确认弹窗

### 2. 进度保存功能

- [ ] 答题中途退出，进度已保存
- [ ] 重新进入时提示继续测试
- [ ] 选择继续，恢复到上次进度
- [ ] 选择重新开始，清除旧进度

### 3. 结果页面功能

- [ ] 能正常显示结果页面
- [ ] 7个脉轮能量条显示正确
- [ ] 百分比计算正确
- [ ] 能量条颜色正确（7种颜色）
- [ ] 详细解读显示正确
- [ ] 生活建议显示正确
- [ ] 冥想建议显示正确
- [ ] 正念宣言显示正确
- [ ] 「重新测试」按钮功能正常
- [ ] 「返回首页」按钮功能正常

### 4. 数据存储功能

- [ ] 测试结果能保存到云数据库
- [ ] 能查询历史测试记录
- [ ] 数据格式正确
- [ ] _openid 自动填充

---

## 🎨 五、UI样式检查

### 1. 测试页面样式

- [ ] 背景色为米色（#F5F1E8）
- [ ] 卡片圆角为20rpx
- [ ] 按钮圆角为50rpx
- [ ] 选中状态有渐变背景
- [ ] 进度条动画流畅
- [ ] 字体大小合适
- [ ] 间距布局合理

### 2. 结果页面样式

- [ ] 7个脉轮颜色正确
- [ ] 能量条动画流畅
- [ ] 卡片阴影效果正确
- [ ] 标签样式美观
- [ ] 建议区块有渐变背景
- [ ] 响应式布局正常

---

## 📊 六、评分逻辑验证

### 测试用例1：全选1分（完全不是）

**预期结果**：所有脉轮都应该是100%（能量充沛）

```javascript
// 用户答案
const answers = {};
for (let i = 1; i <= 80; i++) {
  answers[i] = 1; // 完全不是
}

// 预期结果
// 每题反转后得5分
// 海底轮：12题 × 5 = 60分 / 60 = 100%
// 腹轮：11题 × 5 = 55分 / 55 = 100%
// ... 其他脉轮同理
```

### 测试用例2：全选5分（完全是）

**预期结果**：所有脉轮都应该是20%（能量很弱）

```javascript
// 用户答案
const answers = {};
for (let i = 1; i <= 80; i++) {
  answers[i] = 5; // 完全是
}

// 预期结果
// 每题反转后得1分
// 海底轮：12题 × 1 = 12分 / 60 = 20%
// 腹轮：11题 × 1 = 11分 / 55 = 20%
// ... 其他脉轮同理
```

### 测试用例3：全选3分（中等）

**预期结果**：所有脉轮都应该是60%（基本平衡）

```javascript
// 用户答案
const answers = {};
for (let i = 1; i <= 80; i++) {
  answers[i] = 3; // 中等
}

// 预期结果
// 每题反转后得3分
// 海底轮：12题 × 3 = 36分 / 60 = 60%
// 腹轮：11题 × 3 = 33分 / 55 = 60%
// ... 其他脉轮同理
```

---

## 🐛 七、常见问题排查

### 问题1：编译报错找不到页面

**原因**：app.json 中未添加页面路由

**解决**：
```json
// 在 app.json 的 pages 数组中添加
"pages/chakraTest/index",
"pages/chakraResult/index"
```

### 问题2：点击脉轮测试无反应

**原因**：explore.js 中未添加跳转方法

**解决**：
```javascript
// 在 pages/explore/explore.js 中添加
goToChakraTest() {
  wx.navigateTo({ url: '/pages/chakraTest/index' });
}
```

### 问题3：提交测试时报错

**原因**：云数据库未创建或权限不足

**解决**：
1. 检查云开发是否已开通
2. 检查 chakra_history 集合是否已创建
3. 检查权限设置是否正确

### 问题4：结果页面显示异常

**原因**：results 参数传递失败

**解决**：
1. 检查 URL 参数长度是否超限
2. 检查 JSON.stringify 是否正确
3. 检查云数据库保存是否成功

### 问题5：进度保存不生效

**原因**：本地存储权限问题

**解决**：
1. 检查 wx.setStorageSync 是否报错
2. 检查存储空间是否已满
3. 清除缓存后重试

---

## ✅ 八、最终验收标准

### 功能完整性

- ✅ 80道题目全部可答
- ✅ 进度保存功能正常
- ✅ 评分算法正确
- ✅ 结果展示完整
- ✅ 云端存储正常

### 用户体验

- ✅ 界面美观，符合设计规范
- ✅ 操作流畅，无卡顿
- ✅ 文案温暖，有疗愈感
- ✅ 反馈及时，有引导提示
- ✅ 错误处理完善

### 性能指标

- ✅ 页面加载时间 < 2秒
- ✅ 答题响应时间 < 100ms
- ✅ 结果计算时间 < 500ms
- ✅ 数据保存时间 < 1秒

---

## 🎉 九、部署完成确认

当以上所有检查项都完成后，你的脉轮测试工具就可以正式上线了！

**最后步骤**：

1. ✅ 完成所有功能测试
2. ✅ 完成所有样式检查
3. ✅ 完成评分逻辑验证
4. ✅ 邀请测试用户试用
5. ✅ 收集反馈并优化
6. ✅ 正式发布给所有用户

**恭喜！🎊 你的脉轮测试工具已经准备就绪！**

愿每一位用户都能通过这个工具，更好地了解自己的能量状态，找到内在的平衡与和谐。🌸

