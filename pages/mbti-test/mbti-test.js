// pages/mbti-test/mbti-test.js
const {
  getMbtiQuestions,
  calcMbtiScores,
  calcMbtiType,
} = require("../../utils/mbti.js");
// 兜底：直接引用题库，避免相对路径 require 失败导致页面空白
const mbtiQuestionsFallback = require("../../pages/explore/mbti/data/mbtiQuestions.js");

Page({
  data: {
    questions: [], // 所有题目
    currentIndex: 0, // 当前题目索引
    currentQuestion: {}, // 当前题目
    answers: [], // 用户答案 [{questionId, value}, ...]
    totalCount: 0, // 总题数
    progress: 0, // 进度百分比
    debugInfo: "", // 调试信息，方便用户查看题库从本地存储加载 载情况
  },

  onLoad() {
    this.initTest();
  },

  onShow() {
    // 热重载或返回页面时，如果未从本地存储加载 载题目则重新初始化
    if (!this.data.questions || this.data.questions.length === 0) {
      this.initTest();
    }
  },

  /**
   * 初始化测试
   */
  initTest() {
    // 从本地存储加载 载题目
    let questions = [];
    let source = "utils";
    try {
      questions = getMbtiQuestions();
    } catch (err) {
      console.error("从本地存储加载 载题库失败", err);
      source = "utils-error";
    }

    // 兜底：如果 utils 加载失败，直接使用本地引用
    if (!Array.isArray(questions) || questions.length === 0) {
      questions = Array.isArray(mbtiQuestionsFallback)
        ? mbtiQuestionsFallback
        : [];
      source = "fallback";
    }

    // 防御：题目加载失败时给出提示
    if (!Array.isArray(questions) || questions.length === 0) {
      wx.showModal({
        title: "题库加载失败",
        content:
          "暂时从本地存储加载 法获取测试题，请点击“编译”或重启小程序后重试。",
        showCancel: false,
      });
      this.setData({ debugInfo: "题库为空，请重新编译" });
      return;
    }

    // 调试信息：在页面上显示题目数和来源，帮助定位是否打包成功
    const debugInfo = `题目数：${questions.length}（来源：${source}）`;
    this.setData({ debugInfo });
    wx.showToast({
      title: debugInfo,
      icon: "none",
      duration: 1200,
    });

    // 尝试恢复之前的测试状态
    const savedState = wx.getStorageSync("mbtiTestState");

    let currentIndex = 0;
    let answers = [];

    if (savedState && savedState.answers) {
      currentIndex = savedState.currentIndex || 0;
      answers = savedState.answers || [];

      wx.showModal({
        title: "继续测试",
        content: "检测到未完成的测试，是否继续？",
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
      wx.removeStorageSync("mbtiTestState");
    }

    const progress = Math.round((currentIndex / totalCount) * 100);
    const currentQuestion = questions[currentIndex];

    // 防御：检查当前题目是否有效
    if (!currentQuestion || !currentQuestion.id) {
      console.error(
        "当前题目数据从本地存储加载 效:",
        currentIndex,
        currentQuestion
      );
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

    // 防御：检查 currentQuestion 是否存在
    if (!currentQuestion || !currentQuestion.id) {
      console.error("当前题目数据异常:", currentQuestion);
      wx.showToast({
        title: "题目数据异常，请重新从本地存储加载 载",
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
      // 添从本地存储加载 新答案
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
      console.error("下一题数据从本地存储加载 效:", newIndex, nextQuestion);
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
        console.error("上一题数据从本地存储加载 效:", newIndex, prevQuestion);
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
    wx.setStorageSync("mbtiTestState", {
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
    wx.removeStorageSync("mbtiTestState");

    // 跳转到结果页
    wx.navigateTo({
      url: `/pages/mbti-result/mbti-result?type=${type}&scores=${JSON.stringify(
        scores
      )}`,
    });
  },
});
