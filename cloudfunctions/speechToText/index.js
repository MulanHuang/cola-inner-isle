// cloudfunctions/speechToText/index.js
const cloud = require("wx-server-sdk");
const axios = require("axios");
const FormData = require("form-data");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

/**
 * 语音识别云函数
 * 将录音文件转换为文字（使用 OpenAI Whisper / gpt-4o-mini-transcribe）
 *
 * 环境变量：
 * - OPENAI_API_KEY: 必填，OpenAI API Key
 * - OPENAI_BASE: 选填，自定义代理地址（默认 https://api.openai.com/v1）
 * - OPENAI_WHISPER_MODEL: 选填，默认 whisper-1，可改 gpt-4o-mini-transcribe
 */
exports.main = async (event, context) => {
  const { fileUrl, fileId } = event || {};

  try {
    if (!fileUrl && !fileId) {
      return {
        success: false,
        error: "缺少音频地址，请检查前端上传是否成功",
        text: "",
      };
    }

    // 1) 获取音频临时 URL
    let voiceUrl = fileUrl;
    if (!voiceUrl && fileId) {
      const temp = await cloud.getTempFileURL({
        fileList: [fileId],
      });
      voiceUrl = temp?.fileList?.[0]?.tempFileURL;
    }
    if (!voiceUrl) {
      return {
        success: false,
        error: "无法获取音频 URL，请确认云存储权限",
        text: "",
      };
    }

    // 2) 下载音频到内存（Buffer）
    const audioRes = await axios.get(voiceUrl, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(audioRes.data);

    // 3) 构造 OpenAI 请求
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = (process.env.OPENAI_BASE || "https://api.openai.com/v1").replace(/\/+$/, "");
    const model = process.env.OPENAI_WHISPER_MODEL || "whisper-1";

    if (!apiKey) {
      return {
        success: false,
        error: "缺少 OPENAI_API_KEY 环境变量",
        text: "",
      };
    }

    const form = new FormData();
    form.append("file", audioBuffer, {
      filename: "voice.mp3",
      contentType: "audio/mpeg",
    });
    form.append("model", model);
    form.append("response_format", "text");
    form.append("language", "zh");

    const openaiResp = await axios.post(`${baseUrl}/audio/transcriptions`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 25000, // 25s 防止长音频超时
      maxBodyLength: 20 * 1024 * 1024, // 防止大音频导致默认上限报错
    });

    const text = String(openaiResp?.data || "").trim();

    return { success: true, text };
  } catch (err) {
    console.error("语音识别失败", err?.response?.data || err);
    return {
      success: false,
      error:
        err?.response?.data?.error?.message ||
        err?.message ||
        "语音识别失败，请检查 OpenAI 配置和网络出口",
      text: "",
    };
  }
};
