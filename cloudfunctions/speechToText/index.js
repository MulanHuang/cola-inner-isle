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
 * 支持两种调用方式：
 * 1. fileBase64 + fileName: 直接传递 base64 编码的音频数据（推荐，避开云存储权限问题）
 * 2. fileUrl / fileId: 传递云存储文件地址
 *
 * 环境变量：
 * - OPENAI_API_KEY: 必填，OpenAI API Key
 * - OPENAI_BASE: 选填，自定义代理地址（默认走阿里云代理 https://api.cola.center/api/openai）
 * - OPENAI_WHISPER_MODEL: 选填，默认 whisper-1，可改 gpt-4o-mini-transcribe
 */
exports.main = async (event, context) => {
  const { fileUrl, fileId, fileBase64, fileName } = event || {};

  try {
    let audioBuffer;

    // 方式1: 直接接收 base64 编码的音频数据（推荐）
    if (fileBase64) {
      console.log(
        "[speechToText] 使用 base64 模式，数据长度:",
        fileBase64.length
      );
      audioBuffer = Buffer.from(fileBase64, "base64");
    }
    // 方式2: 通过云存储 URL 获取音频
    else if (fileUrl || fileId) {
      console.log("[speechToText] 使用云存储模式");
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
      // 下载音频到内存
      const audioRes = await axios.get(voiceUrl, {
        responseType: "arraybuffer",
      });
      audioBuffer = Buffer.from(audioRes.data);
    }
    // 无有效输入
    else {
      return {
        success: false,
        error: "缺少音频数据，请传入 fileBase64 或 fileUrl/fileId",
        text: "",
      };
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return {
        success: false,
        error: "音频数据为空",
        text: "",
      };
    }

    console.log("[speechToText] 音频大小:", audioBuffer.length, "bytes");

    // 3) 构造 OpenAI 请求
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = (
      process.env.OPENAI_BASE || "https://api.cola.center/api/openai"
    ).replace(/\/+$/, "");
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
      filename: fileName || "voice.mp3",
      contentType: "audio/mpeg",
    });
    form.append("model", model);
    form.append("response_format", "text");
    form.append("language", "zh");

    const openaiResp = await axios.post(
      `${baseUrl}/audio/transcriptions`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 25000, // 25s 防止长音频超时
        maxBodyLength: 20 * 1024 * 1024, // 防止大音频导致默认上限报错
      }
    );

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
