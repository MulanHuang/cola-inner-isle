// pages/mbti-test/mbti-test.js
// 从主包 utils 加载 MBTI 工具函数（解决跨分包 require 问题）
const {
  getMbtiQuestions,
  getMbtiQuestionsA,
  calcMbtiScores,
  calcMbtiType,
} = require("../../utils/mbti.js");
// 兜底：直接引用题库（从主包路径）
const mbtiQuestionsFallbackB = require("../../pages/explore/mbti/data/mbtiQuestions.js");
const mbtiQuestionsFallbackA = require("../../pages/explore/mbti/data/mbtiQuestionsA.js");

Page({
  data: {
    navBarHeight: 0, // 导航栏高度
    version: "A", // 测试版本：A=最新版(60题)，B=传统版(70题)
    versionName: "最新版", // 版本名称
    questions: [], // 所有题目
    currentIndex: 0, // 当前题目索引
    currentQuestion: {}, // 当前题目
    answers: [], // 用户答案 [{questionId, value}, ...]
    totalCount: 0, // 总题数
    progress: 0, // 进度百分比
    debugInfo: "", // 调试信息，方便用户查看题库加载情况
  },

  onLoad(options) {
    // 获取版本参数，默认为A版（最新版）
    const version = options.version || "A";
    const versionName = version === "A" ? "最新版" : "传统版";
    this.setData({ version, versionName });
    this.initTest();
  },

  // 导航栏准备完成
  onNavReady(e) {
    this.setData({
      navBarHeight: e.detail.navBarHeight || 0,
    });
  },

  onShow() {
    // 热重载或返回页面时，如果未加载题目则重新初始化
    if (!this.data.questions || this.data.questions.length === 0) {
      this.initTest();
    }
  },

  /**
   * 初始化测试
   */
  initTest() {
    const { version, versionName } = this.data;

    // 根据版本加载题目
    let questions = [];
    let source = "utils";
    try {
      if (version === "A") {
        questions = getMbtiQuestionsA();
      } else {
        questions = getMbtiQuestions();
      }
    } catch (err) {
      console.error("加载题库失败", err);
      source = "utils-error";
    }

    // 兜底：如果 utils 加载失败，直接使用本地引用
    if (!Array.isArray(questions) || questions.length === 0) {
      const fallback =
        version === "A" ? mbtiQuestionsFallbackA : mbtiQuestionsFallbackB;
      questions = Array.isArray(fallback) ? fallback : [];
      source = "fallback";
    }

    // 防御：题目加载失败时给出提示
    if (!Array.isArray(questions) || questions.length === 0) {
      wx.showModal({
        title: "题库加载失败",
        content: "暂时无法获取测试题，请点击“编译”或重启小程序后重试。",
        showCancel: false,
      });
      this.setData({ debugInfo: "题库为空，请重新编译" });
      return;
    }

    // 调试信息：在页面上显示题目数和来源，帮助定位是否打包成功
    const debugInfo = `${versionName}题目数：${questions.length}（来源：${source}）`;
    this.setData({ debugInfo });
    wx.showToast({
      title: `${versionName} ${questions.length}题`,
      icon: "none",
      duration: 1200,
    });

    // 尝试恢复之前的测试状态（根据版本区分存储）
    const stateKey = `mbtiTestState_${version}`;
    const savedState = wx.getStorageSync(stateKey);

    let currentIndex = 0;
    let answers = [];

    if (savedState && savedState.answers) {
      currentIndex = savedState.currentIndex || 0;
      answers = savedState.answers || [];

      wx.showModal({
        title: "继续测试",
        content: `检测到未完成的${versionName}测试，是否继续？`,
        confirmText: "继续",
        cancelText: "重新开始",
        success: (res) => {
          if (!res.confirm) {
            // 重新开始
            currentIndex = 0;
            answers = [];
            this.setTestData(questions, currentIndex, answers);
          } else {
            this.setTestData(questions, currentIndex, answers);
          }
        },
      });
    } else {
      this.setTestData(questions, currentIndex, answers);
    }
  },

  /**
   * 设置测试数据
   */
  setTestData(questions, currentIndex, answers) {
    const totalCount = questions.length;

    // 防御：题目数组为空
    if (!questions || totalCount === 0) {
      console.error("题目数组为空");
      wx.showModal({
        title: "加载失败",
        content: "题目数据为空，请重新编译小程序",
        showCancel: false,
      });
      return;
    }

    // 防御：索引越界时重置
    if (currentIndex >= totalCount || currentIndex < 0) {
      currentIndex = 0;
      answers = [];
      wx.removeStorageSync(`mbtiTestState_${this.data.version}`);
    }

    const progress = Math.round((currentIndex / totalCount) * 100);
    const currentQuestion = questions[currentIndex];

    // 防御：检查当前题目是否有效
    if (!currentQuestion || !currentQuestion.id) {
      console.error("当前题目数据无效:", currentIndex, currentQuestion);
      wx.showModal({
        title: "题目数据异常",
        content: `第 ${currentIndex + 1} 题数据异常，请重新编译小程序`,
        showCancel: false,
      });
      return;
    }

    this.setData({
      questions,
      currentIndex,
      currentQuestion,
      answers,
      totalCount,
      progress,
    });
  },

  /**
   * 选择答案
   */
  selectOption(e) {
    const { value } = e.currentTarget.dataset;
    const { currentQuestion, currentIndex, answers, questions, totalCount } =
      this.data;

    // 轻触反馈，避免失败影响主流程
    if (wx && wx.vibrateShort) {
      wx.vibrateShort({
        type: "light",
        fail: () => {},
      });
    }

    // 防御：检查 currentQuestion 是否存在
    if (!currentQuestion || !currentQuestion.id) {
      console.error("当前题目数据异常:", currentQuestion);
      wx.showToast({
        title: "题目数据异常，请重新加载",
        icon: "none",
      });
      return;
    }

    // 记录答案
    const newAnswer = {
      questionId: currentQuestion.id,
      value: value,
    };

    // 检查是否已经回答过这道题
    const existingIndex = answers.findIndex(
      (a) => a.questionId === currentQuestion.id
    );
    let newAnswers = [...answers];

    if (existingIndex >= 0) {
      // 更新答案
      newAnswers[existingIndex] = newAnswer;
    } else {
      // 添加新答案
      newAnswers.push(newAnswer);
    }

    // 更新答案数组
    this.setData({ answers: newAnswers });

    // 延迟跳转，让用户看到选择效果
    setTimeout(() => {
      if (currentIndex < totalCount - 1) {
        // 跳转到下一题
        this.nextQuestion(newAnswers);
      } else {
        // 最后一题，计算结果
        this.calculateResult(newAnswers);
      }
    }, 300);
  },

  /**
   * 下一题
   */
  nextQuestion(answers) {
    const { currentIndex, questions, totalCount } = this.data;
    const newIndex = currentIndex + 1;

    // 防御：检查索引是否有效
    if (newIndex >= totalCount) {
      console.error("索引越界:", newIndex, totalCount);
      return;
    }

    const progress = Math.round((newIndex / totalCount) * 100);
    const nextQuestion = questions[newIndex];

    // 防御：检查下一题是否有效
    if (!nextQuestion || !nextQuestion.id) {
      console.error("下一题数据无效:", newIndex, nextQuestion);
      wx.showToast({
        title: "题目数据异常",
        icon: "none",
      });
      return;
    }

    this.setData({
      currentIndex: newIndex,
      currentQuestion: nextQuestion,
      answers,
      progress,
    });

    // 保存状态
    this.saveTestState(newIndex, answers);
  },

  /**
   * 上一题
   */
  prevQuestion() {
    const { currentIndex, questions, totalCount } = this.data;

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const progress = Math.round((newIndex / totalCount) * 100);
      const prevQuestion = questions[newIndex];

      // 防御：检查上一题是否有效
      if (!prevQuestion || !prevQuestion.id) {
        console.error("上一题数据无效:", newIndex, prevQuestion);
        wx.showToast({
          title: "题目数据异常",
          icon: "none",
        });
        return;
      }

      this.setData({
        currentIndex: newIndex,
        currentQuestion: prevQuestion,
        progress,
      });

      // 保存状态
      this.saveTestState(newIndex, this.data.answers);
    }
  },

  /**
   * 保存测试状态
   */
  saveTestState(currentIndex, answers) {
    const stateKey = `mbtiTestState_${this.data.version}`;
    wx.setStorageSync(stateKey, {
      currentIndex,
      answers,
      timestamp: Date.now(),
    });
  },

  /**
   * 计算结果
   */
  calculateResult(answers) {
    wx.showLoading({ title: "计算中..." });

    // 计算分数
    const scores = calcMbtiScores(answers);

    // 计算类型
    const type = calcMbtiType(scores);

    wx.hideLoading();

    // 清除保存的测试状态
    wx.removeStorageSync(`mbtiTestState_${this.data.version}`);

    // 跳转到结果页（传递版本信息）
    wx.navigateTo({
      url: `/pages/mbti-result/mbti-result?type=${type}&scores=${JSON.stringify(
        scores
      )}`,
    });
  },
});
