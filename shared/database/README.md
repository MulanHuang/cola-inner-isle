# InnerSeed 数据库设计

## 数据库集合列表

### 1. users（用户信息）

存储用户的基本信息、个人档案和登录信息。

**字段说明：**

```json
{
  "_id": "自动生成",
  "_openid": "用户openid（自动）",

  // === 基本信息 ===
  "name": "用户昵称",
  "avatarUrl": "头像URL",

  // === 个人档案 ===
  "gender": "性别（male/female）",
  "birthday": "生日（YYYY/MM/DD 或 YYYY-MM-DD）",
  "birthTime": "出生时间（HH:mm）",
  "zodiac": "星座ID（aries/taurus/gemini等）",
  "birthPlace": ["省", "市", "区"],
  "livePlace": ["省", "市", "区"],
  "bloodType": "血型（A/B/O/AB）",
  "mbti": "MBTI类型",

  // === 登录信息 ===
  "lastLoginTime": "最后登录时间",
  "loginCount": "登录次数",
  "firstLoginTime": "首次登录时间",
  "lastLoginDevice": {
    "brand": "设备品牌",
    "model": "设备型号",
    "system": "操作系统",
    "platform": "平台"
  },

  // === 时间戳 ===
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

**字段详细说明：**

| 字段              | 类型   | 必填 | 说明                  |
| ----------------- | ------ | ---- | --------------------- |
| `_openid`         | String | 自动 | 微信用户唯一标识      |
| `name`            | String | 否   | 用户昵称              |
| `avatarUrl`       | String | 否   | 用户头像 URL          |
| `gender`          | String | 否   | 性别：male/female     |
| `birthday`        | String | 否   | 生日，格式 YYYY/MM/DD |
| `birthTime`       | String | 否   | 出生时间，格式 HH:mm  |
| `zodiac`          | String | 否   | 星座 ID               |
| `birthPlace`      | Array  | 否   | 出生地，省市区数组    |
| `livePlace`       | Array  | 否   | 居住地，省市区数组    |
| `lastLoginTime`   | Date   | 否   | 最后登录时间          |
| `loginCount`      | Number | 否   | 累计登录次数          |
| `firstLoginTime`  | Date   | 否   | 首次登录时间          |
| `lastLoginDevice` | Object | 否   | 最后登录设备信息      |

### 2. emotions（情绪记录）

存储用户的情绪记录。

**字段说明：**

```json
{
  "_id": "自动生成",
  "_openid": "用户openid（自动）",
  "emotionId": "情绪ID（happy/sad/anxious等）",
  "emotionName": "情绪名称",
  "emotionIcon": "情绪图标",
  "description": "文字描述",
  "tags": ["标签数组"],
  "createTime": "创建时间"
}
```

### 3. chats（对话记录）

存储用户与 AI 的对话记录。

**字段说明：**

```json
{
  "_id": "自动生成",
  "_openid": "用户openid（自动）",
  "role": "角色（user/assistant）",
  "content": "消息内容",
  "createTime": "创建时间"
}
```

### 4. meditations（冥想音频）

存储冥想音频的基本信息。

**字段说明：**

```json
{
  "_id": "自动生成",
  "title": "音频标题",
  "description": "音频描述",
  "category": "分类（emotion/spiritual/sleep/awareness/innerchild/relax/affirmation/manifestation/chakra）",
  "chakraType": "脉轮类型（仅category为chakra时）",
  "cover": "封面图URL",
  "audioUrl": "音频文件URL",
  "duration": "时长（格式：MM:SS）",
  "plays": "播放次数",
  "order": "排序",
  "createTime": "创建时间"
}
```

### 5. meditationHistory（冥想播放历史）

存储用户的冥想播放记录。

**字段说明：**

```json
{
  "_id": "自动生成",
  "_openid": "用户openid（自动）",
  "audioId": "音频ID",
  "audioTitle": "音频标题",
  "category": "分类",
  "createTime": "播放时间"
}
```

### 6. quotes（每日一句）

存储治愈短句。

**字段说明：**

```json
{
  "_id": "自动生成",
  "content": "短句内容",
  "author": "作者（可选）",
  "createTime": "创建时间"
}
```

### 7. tarotCards（塔罗牌）

存储塔罗牌的基本信息。

**字段说明：**

```json
{
  "_id": "自动生成",
  "name": "牌名",
  "nameEn": "英文名",
  "keywords": "关键词",
  "meaning": "基本含义",
  "image": "牌面图片URL",
  "order": "排序",
  "createTime": "创建时间"
}
```

### 8. tarotDraws（塔罗抽牌记录）

存储用户的塔罗抽牌记录。

**字段说明：**

```json
{
  "_id": "自动生成",
  "_openid": "用户openid（自动）",
  "cardId": "塔罗牌ID",
  "date": "日期（toDateString格式）",
  "question": "用户问题",
  "interpretation": "AI解读",
  "createTime": "创建时间"
}
```

### 9. checkins（每日签到记录）

存储用户的每日签到记录。

**字段说明：**

```json
{
  "_id": "自动生成",
  "_openid": "用户openid（自动）",
  "date": "签到日期（YYYY-MM-DD格式）",
  "weekStart": "本周一的日期（YYYY-MM-DD格式）",
  "createTime": "签到时间"
}
```

**权限设置：** 仅创建者可读写

**索引建议：** `_openid` + `date`（唯一索引，防止重复签到）

## 索引建议

为提高查询性能，建议创建以下索引：

1. **emotions**: `_openid` + `createTime`（降序）
2. **chats**: `_openid` + `createTime`（升序）
3. **meditationHistory**: `_openid` + `createTime`（降序）
4. **tarotDraws**: `_openid` + `date`（降序）
5. **meditations**: `category` + `order`（升序）
6. **checkins**: `_openid` + `date`（唯一索引）

## 权限设置

建议权限配置：

- 所有集合：仅创建者可读写
- 公共数据（quotes, tarotCards, meditations）：所有用户可读，仅管理员可写
