# ✅ 数据库配置检查清单

## 📦 第 1 步：创建数据库集合（11 个）

### 用户数据集合（8 个）

- [ ] **users** - 用户基本信息

  - 权限：仅创建者可读写
  - 说明：存储用户昵称、生日、星座、MBTI 等

- [ ] **emotions** - 情绪记录

  - 权限：仅创建者可读写
  - 说明：存储用户的情绪日记

- [ ] **chats** - AI 对话记录

  - 权限：仅创建者可读写
  - 说明：存储用户与 AI 的对话历史

- [ ] **tarotDraws** - 塔罗抽牌记录

  - 权限：仅创建者可读写
  - 说明：存储用户的塔罗抽牌历史

- [ ] **meditationHistory** - 冥想历史

  - 权限：仅创建者可读写
  - 说明：存储用户的冥想记录

- [ ] **chakra_history** - 脉轮测试历史

  - 权限：仅创建者可读写
  - 说明：存储用户的脉轮测试结果

- [ ] **tarotDraw** - 塔罗记录备用

  - 权限：仅创建者可读写
  - 说明：备用集合，兼容早期版本

- [ ] **checkins** - 每日签到记录 ⭐ 新增
  - 权限：仅创建者可读写
  - 说明：存储用户的每日签到记录（日期、周起始日期）

### 公共数据集合（3 个）

- [ ] **quotes** - 每日一句

  - 权限：所有用户可读，仅创建者可写
  - 说明：温暖语录数据
  - **必须导入数据**：`database/init-data/quotes.json`（15 条）

- [ ] **tarotCards** - 塔罗牌数据

  - 权限：所有用户可读，仅创建者可写
  - 说明：22 张大阿卡纳塔罗牌
  - **必须导入数据**：`database/init-data/tarotCards.json`（22 张）

- [ ] **meditations** - 冥想音频列表
  - 权限：所有用户可读，仅创建者可写
  - 说明：冥想音频元数据
  - **必须导入数据**：`database/init-data/meditations.json`（15 个）

---

## 📥 第 2 步：导入初始数据（3 个文件）

- [ ] 导入 `database/init-data/quotes.json` → `quotes` 集合

  - 预期结果：15 条数据

- [ ] 导入 `database/init-data/tarotCards.json` → `tarotCards` 集合

  - 预期结果：22 条数据

- [ ] 导入 `database/init-data/meditations.json` → `meditations` 集合
  - 预期结果：15 条数据

---

## 🔐 第 3 步：权限配置检查

### 用户数据集合（仅创建者可读写）

- [ ] users
- [ ] emotions
- [ ] chats
- [ ] tarotDraws
- [ ] meditationHistory
- [ ] chakra_history
- [ ] tarotDraw

### 公共数据集合（所有用户可读，仅创建者可写）

- [ ] quotes
- [ ] tarotCards
- [ ] meditations

---

## 🧪 第 4 步：功能测试

- [ ] 重新编译小程序
- [ ] 首页：每日一句正常显示
- [ ] 情绪记录：可以保存情绪日记
- [ ] 塔罗牌：可以抽牌并查看历史
- [ ] 用户中心：可以编辑昵称
- [ ] 统计数据：显示各项记录数量
- [ ] 控制台：没有数据库相关错误

---

## 📊 数据验证

### quotes 集合

- [ ] 有 15 条数据
- [ ] 每条数据包含 `content` 和 `author` 字段

### tarotCards 集合

- [ ] 有 22 条数据
- [ ] 每条数据包含 `name`、`keywords`、`meaning`、`image` 字段

### meditations 集合

- [ ] 有 15 条数据
- [ ] 每条数据包含 `title`、`category`、`audioUrl`、`duration` 字段

---

## ✅ 完成标志

当以下所有条件都满足时，数据库配置完成：

1. ✅ 10 个集合全部创建
2. ✅ 权限配置正确
3. ✅ 3 个初始数据文件已导入
4. ✅ 数据量正确（quotes: 15, tarotCards: 22, meditations: 15）
5. ✅ 小程序重新编译
6. ✅ 主要功能测试通过
7. ✅ 控制台没有数据库错误

---

## 🎯 优先级说明

### 🔴 必须完成（否则无法使用）

- users
- emotions
- tarotDraws
- quotes（含数据）
- tarotCards（含数据）

### 🟡 重要功能（建议完成）

- chats
- meditationHistory
- meditations（含数据）

### 🟢 可选功能（可以稍后添加）

- chakra_history
- tarotDraw

---

## 📞 遇到问题？

如果配置过程中遇到问题，请查看：

- `QUICK_FIX_DATABASE.md` - 快速修复指南
- `DATABASE_SETUP_GUIDE.md` - 详细配置教程
- `数据库权限配置-图文教程.md` - 图文教程
- `快速修复数据库权限.md` - 权限配置说明

---

**预计完成时间：5-10 分钟** ⏱️
