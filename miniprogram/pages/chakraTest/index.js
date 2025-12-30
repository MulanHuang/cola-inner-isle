// pages/chakraTest/index.js
const { CHAKRA_QUESTIONS, OPTION_LABELS } = require("./data/questions.js");

Page({
  data: {
    navBarHeight: 0, // 导航栏高度
    questions: [],
    currentIndex: 0,
    currentQuestion: {},
    totalQuestions: 80,
    answers: {}, // 存储所有答案 {questionId: answer}
    selectedAnswer: null,
    optionLabels: OPTION_LABELS,
    progress: 0,
  },

  // 导航栏准备完成
  onNavReady(e) {
    this.setData({
      navBarHeight: e.detail.navBarHeight || 0,
    });
  },

  onLoad(options) {
    // 确保云开发已初始化
    if (!wx.cloud) {
      wx.showToast({
        title: "云开发环境未初始化",
        icon: "none",
      });
      return;
    }

    this.setData({
      questions: CHAKRA_QUESTIONS,
      totalQuestions: CHAKRA_QUESTIONS.length,
      currentQuestion: CHAKRA_QUESTIONS[0],
    });

    // 检查是否有保存的进度
    this.loadProgress();
  },

  // 加载保存的进度
  loadProgress() {
    const savedAnswers = wx.getStorageSync("chakra_test_progress");
    if (savedAnswers) {
      wx.showModal({
        title: "发现未完成的测试",
        content: "是否继续上次的测试？",
        success: (res) => {
          if (res.confirm) {
            const answers = JSON.parse(savedAnswers);
            const lastIndex = Object.keys(answers).length - 1;
            this.setData({
              answers: answers,
              currentIndex: lastIndex >= 0 ? lastIndex : 0,
            });
            this.loadQuestion(this.data.currentIndex);
          } else {
            wx.removeStorageSync("chakra_test_progress");
          }
        },
      });
    }
  },

  // 加载题目
  loadQuestion(index) {
    const question = this.data.questions[index];
    const savedAnswer = this.data.answers[question.id];
    const progress = Math.round(((index + 1) / this.data.totalQuestions) * 100);

    this.setData({
      currentIndex: index,
      currentQuestion: question,
      selectedAnswer: savedAnswer || null,
      progress: progress,
    });
  },

  // 选择选项
  selectOption(e) {
    const value = e.currentTarget.dataset.value;
    // 轻微震动反馈
    this.triggerHaptic();
    this.setData({
      selectedAnswer: value,
    });

    // 自动进入下一题（添加短暂延迟以提供视觉反馈）
    setTimeout(() => {
      // 如果不是最后一题，自动进入下一题
      if (this.data.currentIndex < this.data.totalQuestions - 1) {
        this.nextQuestion();
      }
      // 如果是最后一题，不自动提交，让用户点击"查看结果"按钮
    }, 300);
  },

  triggerHaptic() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: "light" });
    }
  },

  // 下一题
  nextQuestion() {
    if (!this.data.selectedAnswer) {
      wx.showToast({
        title: "请选择一个选项",
        icon: "none",
      });
      return;
    }

    // 保存答案
    const questionId = this.data.currentQuestion.id;
    const answers = this.data.answers;
    answers[questionId] = this.data.selectedAnswer;

    this.setData({ answers });

    // 保存进度到本地
    wx.setStorageSync("chakra_test_progress", JSON.stringify(answers));

    // 加载下一题
    if (this.data.currentIndex < this.data.totalQuestions - 1) {
      this.loadQuestion(this.data.currentIndex + 1);
    }
  },

  // 上一题
  previousQuestion() {
    if (this.data.currentIndex > 0) {
      this.loadQuestion(this.data.currentIndex - 1);
    }
  },

  // 提交测试
  submitTest() {
    if (!this.data.selectedAnswer) {
      wx.showToast({
        title: "请选择一个选项",
        icon: "none",
      });
      return;
    }

    // 保存最后一题的答案
    const questionId = this.data.currentQuestion.id;
    const answers = this.data.answers;
    answers[questionId] = this.data.selectedAnswer;

    // 校验是否所有题目都已作答
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < this.data.totalQuestions) {
      wx.showModal({
        title: "提示",
        content: `您还有 ${
          this.data.totalQuestions - answeredCount
        } 道题未作答，是否继续提交？`,
        confirmText: "继续提交",
        cancelText: "返回答题",
        success: (res) => {
          if (res.confirm) {
            this.showSubmitConfirm(answers);
          }
        },
      });
      return;
    }

    this.showSubmitConfirm(answers);
  },

  // 显示提交确认弹窗
  showSubmitConfirm(answers) {
    wx.showModal({
      title: "确认提交",
      content: "确定要提交测试并查看结果吗？",
      confirmText: "查看结果",
      success: (res) => {
        if (res.confirm) {
          this.calculateAndSaveResult(answers);
        }
      },
    });
  },

  // 查看历史记录
  viewHistory() {
    wx.navigateTo({
      url: "/pages/chakraHistory/index",
    });
  },

  // 计算并保存结果
  async calculateAndSaveResult(answers) {
    wx.showLoading({
      title: "正在计算结果...",
      mask: true,
    });

    try {
      console.log("开始计算脉轮得分，答案数量：", Object.keys(answers).length);

      const { calculateChakraScore } = require("./data/chakraInfo.js");

      // 计算每个脉轮的得分
      const results = {
        root: calculateChakraScore(answers, "root"),
        sacral: calculateChakraScore(answers, "sacral"),
        solar: calculateChakraScore(answers, "solar"),
        heart: calculateChakraScore(answers, "heart"),
        throat: calculateChakraScore(answers, "throat"),
        third_eye: calculateChakraScore(answers, "third_eye"),
        crown: calculateChakraScore(answers, "crown"),
      };

      console.log("脉轮得分计算完成：", results);

      // 尝试保存到云数据库（如果集合不存在则跳过）
      try {
        console.log("尝试保存到云数据库...");
        const db = wx.cloud.database();

        const saveResult = await db.collection("chakra_history").add({
          data: {
            answers: answers,
            results: results,
            testDate: db.serverDate(),
            timestamp: Date.now(),
          },
        });

        console.log("云数据库保存成功，记录ID：", saveResult._id);
      } catch (dbErr) {
        // 如果数据库保存失败，只记录日志，不影响查看结果
        console.warn("云数据库保存失败（不影响查看结果）：", dbErr);
        console.warn("错误信息：", dbErr.errMsg);

        // 保存到本地存储作为备份
        try {
          const historyKey = `chakra_history_${Date.now()}`;
          wx.setStorageSync(historyKey, {
            answers: answers,
            results: results,
            testDate: new Date().toISOString(),
            timestamp: Date.now(),
          });
          console.log("已保存到本地存储：", historyKey);
        } catch (storageErr) {
          console.warn("本地存储也失败：", storageErr);
        }
      }

      // 清除本地进度
      wx.removeStorageSync("chakra_test_progress");

      wx.hideLoading();

      // 显示成功提示
      wx.showToast({
        title: "计算完成",
        icon: "success",
        duration: 1000,
      });

      // 延迟跳转
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/chakraResult/index?results=${encodeURIComponent(
            JSON.stringify(results)
          )}`,
        });
      }, 1000);
    } catch (err) {
      console.error("计算脉轮得分失败，详细错误：", err);
      console.error("错误代码：", err.errCode);
      console.error("错误信息：", err.errMsg);

      wx.hideLoading();

      wx.showModal({
        title: "计算失败",
        content: `无法计算脉轮得分，请重试。\n\n错误：${
          err.message || err.errMsg || "未知错误"
        }`,
        showCancel: true,
        confirmText: "重试",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            this.calculateAndSaveResult(answers);
          }
        },
      });
    }
  },
});
