/**
 * MBTI 深度解读 Prompt 模板
 * 用于生成温柔、人性化、有边界感的性格分析
 */

/**
 * 生成 MBTI 深度解读的 System Prompt
 */
const SYSTEM_PROMPT = `你是一位温柔、真实、有边界感的心灵陪伴者。
你的任务是根据用户的 MBTI 测试结果，为他们提供深度的性格解读。

请做到以下几点：
1. 语言温柔、人性化、带共情，不使用生硬的心理学术语
2. 不要下定论，不贴标签，只描述倾向并给出理解与支持
3. 使用第二人称 "你"，像一个温暖但专业的朋友在对话
4. 结合维度得分差异，给出更精准的描述
5. 避免过度美化或批判，保持客观但温暖的态度

输出结构要求：
- 核心特质总结（1 段，80-120 字）
- 能量与情绪模式（1 段，100-150 字）
- 人际与关系风格（1 段，100-150 字）
- 工作与学习风格（1 段，100-150 字）
- 温柔的成长建议（3-5 条，每条 30-50 字）

注意事项：
- 如果某个维度得分差异很大（如 I:18 vs E:10），要重点描述这个倾向
- 如果某个维度得分接近（如 T:14 vs F:13），要说明这种平衡性
- 避免使用"你应该"、"你必须"等强制性语言
- 多用"你可能"、"或许"、"倾向于"等柔和表达`;

/**
 * 生成 MBTI 深度解读的 User Prompt
 * @param {string} type - MBTI 类型（如 "INFJ"）
 * @param {object} scores - 维度分数对象 {E, I, S, N, T, F, J, P}
 * @param {array} answers - 用户答题记录（可选）
 * @returns {string} User Prompt
 */
function generateUserPrompt(type, scores, answers = null) {
  // 计算各维度的倾向程度
  const dimensions = [
    {
      name: '能量来源',
      left: 'E（外向）',
      right: 'I（内向）',
      leftScore: scores.E,
      rightScore: scores.I,
      dominant: scores.E > scores.I ? 'E' : 'I',
      difference: Math.abs(scores.E - scores.I)
    },
    {
      name: '信息获取',
      left: 'S（实感）',
      right: 'N（直觉）',
      leftScore: scores.S,
      rightScore: scores.N,
      dominant: scores.S > scores.N ? 'S' : 'N',
      difference: Math.abs(scores.S - scores.N)
    },
    {
      name: '决策方式',
      left: 'T（思考）',
      right: 'F（情感）',
      leftScore: scores.T,
      rightScore: scores.F,
      dominant: scores.T > scores.F ? 'T' : 'F',
      difference: Math.abs(scores.T - scores.F)
    },
    {
      name: '生活态度',
      left: 'J（判断）',
      right: 'P（感知）',
      leftScore: scores.J,
      rightScore: scores.P,
      dominant: scores.J > scores.P ? 'J' : 'P',
      difference: Math.abs(scores.J - scores.P)
    }
  ];

  // 生成维度分析描述
  const dimensionAnalysis = dimensions.map(dim => {
    const total = dim.leftScore + dim.rightScore;
    const dominantPercent = Math.round((Math.max(dim.leftScore, dim.rightScore) / total) * 100);
    
    let tendency = '';
    if (dim.difference <= 2) {
      tendency = '非常平衡';
    } else if (dim.difference <= 5) {
      tendency = '略有倾向';
    } else if (dim.difference <= 10) {
      tendency = '明显倾向';
    } else {
      tendency = '强烈倾向';
    }
    
    return `${dim.name}：${dim.left} ${dim.leftScore} : ${dim.rightScore} ${dim.right}（${tendency}于 ${dim.dominant}，占比 ${dominantPercent}%）`;
  }).join('\n');

  // 构建 User Prompt
  let prompt = `请根据以下 MBTI 测试结果，为用户生成一份温柔、细腻、贴心的深度性格解读：

【基本信息】
MBTI 类型：${type}

【维度得分】
${dimensionAnalysis}

【总体得分】
E（外向）：${scores.E}
I（内向）：${scores.I}
S（实感）：${scores.S}
N（直觉）：${scores.N}
T（思考）：${scores.T}
F（情感）：${scores.F}
J（判断）：${scores.J}
P（感知）：${scores.P}`;

  // 如果有答题记录，可以添加更多上下文
  if (answers && answers.length > 0) {
    prompt += `\n\n【答题情况】
共完成 ${answers.length} 道题目`;
  }

  prompt += `\n\n请输出一份符合以下结构的中文分析：

1. **核心特质总结**（1 段）
2. **能量与情绪模式**（1 段）
3. **人际与关系风格**（1 段）
4. **工作与学习风格**（1 段）
5. **温柔的成长建议**（3-5 条）

请确保语言温柔、真实、有共情，像一个懂他的朋友在说话。`;

  return prompt;
}

module.exports = {
  SYSTEM_PROMPT,
  generateUserPrompt
};

