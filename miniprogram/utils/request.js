// utils/request.js
// 统一管理小程序调用自建后端 API 的请求逻辑
//
// ⚠️ 注意：所有 AI 功能（聊天、情绪解读、脉轮分析、塔罗解读、OH卡解读等）
// 已全部迁移到云函数，通过 wx.cloud.callFunction 调用。
// 云函数内部会调用腾讯云服务器转发到 DeepSeek API。
// 小程序端不再直接请求 AI 相关接口。
//
// 如需添加非 AI 相关的后端接口，可在此文件中添加。

// 腾讯云服务器地址（仅供参考，实际调用通过云函数）
const API_BASE_URL = "http://114.132.210.92:3001";

module.exports = {
  API_BASE_URL,
};
