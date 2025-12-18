// pages/explore/zodiac-detail/zodiac-detail.js
const STAR_INDEXES = [0, 1, 2, 3, 4];

const ZODIAC_PROFILES = {
  aries: {
    name: "白羊座",
    icon: "♈",
    date: "3.21-4.19",
    desc: "热情、积极、勇敢的开拓者",
    analysis: {
      basic:
        "白羊座的能量像一束直线的火光，行动迅速、思维直接，喜欢用结果证明自己。你有很强的自我驱动力，不喜欢被束缚，越是有挑战的目标越能激发斗志。比如工作中遇到新项目，你通常会第一个举手试水，边做边摸索，快速把事情推起来。场景化例子：职场中更愿意冲在第一线争取资源。",
      specific:
        "作为黄道十二宫的开端，白羊座象征“开始”。你习惯用第一反应做判断，擅长开启新局面，哪怕经验不足也愿意先上场再调整。生活中你会更愿意先做出决定，比如直接报名课程、主动发起活动，再在过程中不断修正方向。场景化例子：学习上喜欢先动手实践，再回头补理论。",
      style:
        "行事风格偏“快、准、冲”，喜欢边做边学。遇到问题时更倾向于先解决再复盘，执行效率高，但需要注意节奏的可持续性。比如临时任务堆积时你会先把最紧急的完成，再回头补细节。场景化例子：关系里倾向直接表达感受和需求。",
      blind:
        "情绪上头时容易忽略细节，耐心不足可能让你在重复性任务上感到疲惫。适当放慢速度、留出观察时间，会让你的成果更稳。比如沟通时先确认需求再行动，会减少返工。场景化例子：职场中注意先对齐目标再推进，效率更高。",
      summary:
        "白羊座的魅力在于勇敢与率真。把冲劲与耐心结合，你的“开拓者”能力会更持久，也更容易获得长期成就。场景化例子：职场中你敢主动接手难题并快速推进；学习上偏好先实操再总结；关系里更倾向直接表达与快速建立默契。",
    },
    traits: {
      expression: "直接果敢，热情外放，行动速度快。",
      strengths: "执行力强，敢于尝试新事物。",
      weaknesses: "容易冲动，耐心不足。",
    },
    style: "喜欢先行动再优化，靠直觉推进目标。",
    blind: "情绪上头时容易忽略细节，需要留出缓冲。",
    summary: "节奏放慢一点，优势会更稳定。",
    quote: "按习惯有序地进行。",
    facts: {
      max: "勇敢",
      element: "火",
      ruler: "火星",
      color: "红色",
      number: "9",
      match: "狮子座",
    },
    fortune: { overall: 4, love: 4, career: 4, wealth: 3, health: 4 },
    good: "主动沟通",
    bad: "过度催促",
  },
  taurus: {
    name: "金牛座",
    icon: "♉",
    date: "4.20-5.20",
    desc: "稳重、务实、可靠的守护者",
    analysis: {
      basic:
        "金牛座的核心是稳定与安全感。你做事踏实、重视现实回报，不喜欢浮夸和不确定。慢热但一旦投入，就会非常可靠。比如在团队里你更愿意把流程和资源安排好，再稳步推进。场景化例子：职场中常常是把关质量和节奏的人。",
      specific:
        "金牛座是黄道宫的第二宫，代表“拥有”。你擅长积累资源、打造基础，重视生活的质感与秩序，对美和舒适很敏感。日常中你会优先把家里和工作环境布置得舒服，效率也因此更高。场景化例子：学习上喜欢固定的节奏与稳定的环境。",
      style:
        "行事风格稳健、循序渐进，习惯把目标拆解成可执行的步骤。你不追求速度，但追求可持续的成果。比如你会先做预算、列清单，再一步步落实。场景化例子：关系里偏向细水长流的陪伴。",
      blind:
        "过度追求稳定可能让你错过变化带来的机会。适度接受新方法，会让你的坚持更有弹性。比如在新工具或新流程出现时，给自己一个试用期再决定是否采用。场景化例子：职场中遇到新方向时给自己留出尝试空间。",
      summary:
        "金牛座的优势在于耐心与持久。稳中求变，你的价值会被更多人看到，也能积累更长远的成果。场景化例子：职场中你擅长稳定产出、把流程做扎实；学习上愿意重复练习打基础；关系里重视长期投入与可靠陪伴。",
    },
    traits: {
      expression: "节奏稳定，重视安全感与实际结果。",
      strengths: "耐心强，执行持久，可信赖。",
      weaknesses: "较慢热，容易固执。",
    },
    style: "按部就班推进，善于把资源用在刀刃上。",
    blind: "害怕变化时会错过机会，需要更灵活。",
    summary: "稳中求变能带来新的突破。",
    quote: "让成果说话。",
    facts: {
      max: "稳重",
      element: "土",
      ruler: "金星",
      color: "绿色",
      number: "6",
      match: "处女座",
    },
    fortune: { overall: 4, love: 3, career: 4, wealth: 4, health: 4 },
    good: "整理财务",
    bad: "固守旧法",
  },
  gemini: {
    name: "双子座",
    icon: "♊",
    date: "5.21-6.21",
    desc: "机智、灵活、善于沟通",
    analysis: {
      basic:
        "双子座是风象星座，思维灵活、反应快，喜欢新鲜感和交流互动。你擅长捕捉信息、快速学习，并把复杂问题讲清楚。比如会议里你能快速提炼重点，用更易懂的方式转达给团队。场景化例子：职场中常被当作沟通协调的关键角色。",
      specific:
        "双子座主掌沟通与信息交换，像一座“桥梁”。你能在不同观点之间找到连接点，让事情更好推进。生活里你往往是朋友间的消息集散地，能快速整合信息。场景化例子：关系里擅长化解尴尬和打破沉默。",
      style:
        "行事风格轻快、多线并行，善于用沟通和协作完成任务。你对流程优化和效率提升有天然敏感度。比如同时处理多个项目时，你会用清单或工具把任务拆分。场景化例子：学习上喜欢多渠道输入并快速总结。",
      blind:
        "兴趣广泛容易分心，过多选择会降低专注度。明确优先级、聚焦关键目标，会让成果更稳定。比如每天只定三件关键事，完成后再扩展。场景化例子：职场中需要避免同时开太多战线。",
      summary:
        "双子座的优势在于信息力与表达力。专注一点，你会更有深度，也更容易形成自己的标签。场景化例子：职场中你能快速整理信息并推动沟通；学习上喜欢多渠道输入但需定重点；关系里善于聊天活跃气氛。",
    },
    traits: {
      expression: "思维敏捷，话题转换快。",
      strengths: "学习力强，善于连接资源。",
      weaknesses: "容易分心，持续度不足。",
    },
    style: "通过交流和信息整合达成目标。",
    blind: "过多选择会降低专注度，需要聚焦。",
    summary: "明确优先级，效率会大幅提升。",
    quote: "把想法落在关键点上。",
    facts: {
      max: "多变",
      element: "风",
      ruler: "水星",
      color: "黄色",
      number: "5",
      match: "天秤座",
    },
    fortune: { overall: 3, love: 4, career: 3, wealth: 3, health: 4 },
    good: "拓展人脉",
    bad: "多头并进",
  },
  cancer: {
    name: "巨蟹座",
    icon: "♋",
    date: "6.22-7.22",
    desc: "温柔、体贴、富有同情心",
    analysis: {
      basic:
        "巨蟹座情感细腻，重视安全感与归属感。你在关系中温柔体贴，善于照顾他人，内心却也很敏感。比如在团队里你会留意成员情绪，主动补位和安抚。场景化例子：关系里你常是更愿意付出的一方。",
      specific:
        "巨蟹座象征“家庭与情感”。你容易被情绪影响，但也拥有很强的共情力，能敏锐感知他人的需求。生活中你会记得朋友的喜好和细节，愿意为此做准备。场景化例子：学习上偏向稳定、被支持的环境。",
      style:
        "行事风格以关系和感受为导向，做事前会先考虑对方感受。你擅长用细节建立信任。比如沟通时会先表达理解，再给出建议。场景化例子：职场中你会主动照顾新人适应团队。",
      blind:
        "情绪波动时容易陷入内耗，对外界评价过度敏感。提升自我边界感，会让你更稳定。比如给自己设定休息时间，不让情绪一直被打扰。场景化例子：关系里需要避免过度迎合。",
      summary:
        "巨蟹座的魅力在于温柔与守护。学会照顾自己，你会更有力量，也更能持续付出。场景化例子：职场中你会主动照顾团队情绪与细节；学习上喜欢稳定节奏与安全感环境；关系里擅长关心与照料对方。",
    },
    traits: {
      expression: "情感细腻，重视归属与家庭感。",
      strengths: "包容度高，善于照顾他人。",
      weaknesses: "容易情绪化，缺乏安全感。",
    },
    style: "以感受为导向，重视关系的稳定。",
    blind: "过度在意别人的评价，需要更自信。",
    summary: "把关注点拉回自己，心会更安定。",
    quote: "柔软也可以很有力量。",
    facts: {
      max: "敏感",
      element: "水",
      ruler: "月亮",
      color: "银白",
      number: "2",
      match: "双鱼座",
    },
    fortune: { overall: 4, love: 4, career: 3, wealth: 3, health: 4 },
    good: "照顾家人",
    bad: "情绪内耗",
  },
  leo: {
    name: "狮子座",
    icon: "♌",
    date: "7.23-8.22",
    desc: "自信、慷慨、充满领导力",
    analysis: {
      basic:
        "狮子座充满自信与热情，喜欢被认可，也擅长带动氛围。你天生有领导气质，敢于站在舞台中央。比如在项目推进中，你会主动担当发言人。场景化例子：职场中常常承担对外展示或汇报角色。",
      specific:
        "狮子座由太阳守护，象征光芒与荣耀。你重视尊严与价值感，愿意为目标投入大量能量。生活中你更愿意做出有代表性的成果，而不是平平无奇。场景化例子：学习上喜欢获得认可或排名。",
      style:
        "行事风格果断、外向，善于鼓舞他人。你会以明确的目标驱动团队前进。比如在集体迷茫时，你会率先定调并推动执行。场景化例子：关系里喜欢组织活动和营造仪式感。",
      blind:
        "过度好强会给自己压力，容易忽略他人的感受。适当放下控制，会让你更受欢迎。比如在讨论时多让别人表达，会让团队更团结。场景化例子：职场中学会授权会更省力。",
      summary:
        "狮子座的优势在于自信与感染力。学会倾听，你的光芒更长久，也更具号召力。场景化例子：职场中你敢担当与定方向；学习上喜欢在公开场合展示成果；关系里偏主动表达与带动氛围。",
    },
    traits: {
      expression: "气场强烈，喜欢成为焦点。",
      strengths: "领导力强，热情外放。",
      weaknesses: "自尊心强，容易逞强。",
    },
    style: "用行动带动团队，擅长掌控节奏。",
    blind: "过度好胜会忽略他人感受。",
    summary: "愿意倾听，魅力会更突出。",
    quote: "把能量用在最重要的目标上。",
    facts: {
      max: "自信",
      element: "火",
      ruler: "太阳",
      color: "金色",
      number: "1",
      match: "白羊座",
    },
    fortune: { overall: 4, love: 4, career: 5, wealth: 3, health: 4 },
    good: "展示成果",
    bad: "强撑面子",
  },
  virgo: {
    name: "处女座",
    icon: "♍",
    date: "8.23-9.22",
    desc: "细致、完美、追求卓越",
    analysis: {
      basic:
        "处女座追求秩序与效率，擅长从细节中发现问题并优化。你对自己要求高，做事严谨。比如你会在报告里检查格式与逻辑的每个细节。场景化例子：职场中是流程把控和质量检查的核心。",
      specific:
        "处女座由水星守护，象征理性与分析。你习惯用逻辑和数据做判断，行动之前会先规划。日常里你可能会列出流程、步骤和风险点。场景化例子：学习上偏好系统化笔记与复盘。",
      style:
        "行事风格细致而稳健，善于拆解任务、逐项落实。你重视流程与质量。比如把大目标拆成每周计划，再按表推进。场景化例子：关系里会提前安排细节和行程。",
      blind:
        "过度完美容易造成焦虑，挑剔也会影响人际。放松标准、接受差异，会让你更轻松。比如允许自己“先完成再优化”。场景化例子：职场中避免把小问题放大化。",
      summary:
        "处女座的优势在于细节掌控与高效率。适度松弛，你会更高效，也更有满足感。场景化例子：职场中你会严格把控流程质量；学习上善于做笔记与复盘；关系里容易为对方安排细节与计划。",
    },
    traits: {
      expression: "逻辑清晰，做事严谨。",
      strengths: "专注细节，执行稳定。",
      weaknesses: "容易焦虑，过于挑剔。",
    },
    style: "靠计划和复盘不断优化结果。",
    blind: "对自己要求过高，容易疲惫。",
    summary: "放下部分完美主义更轻松。",
    quote: "细节决定成败。",
    facts: {
      max: "细致",
      element: "土",
      ruler: "水星",
      color: "米色",
      number: "5",
      match: "金牛座",
    },
    fortune: { overall: 4, love: 3, career: 4, wealth: 4, health: 3 },
    good: "梳理计划",
    bad: "过度苛责",
  },
  libra: {
    name: "天秤座",
    icon: "♎",
    date: "9.23-10.23",
    desc: "优雅、公正、追求和谐",
    analysis: {
      basic:
        "天秤座擅长平衡与协调，追求和谐与美感。你注重公平，喜欢用沟通解决问题。比如在团队分歧时，你会先听完双方意见再做调整。场景化例子：职场中擅长做资源协调与沟通桥梁。",
      specific:
        "天秤座由金星守护，象征关系与审美。你在人际中很有亲和力，懂得如何让气氛舒适。生活中你会关注仪式感和氛围布置。场景化例子：关系里喜欢保持互动与平衡感。",
      style:
        "行事风格温和、理性，倾向于先收集意见再做决定。你善于形成共识。比如在制定计划前，你会先做小范围共识对齐。场景化例子：学习上更喜欢讨论式或小组式模式。",
      blind:
        "过度犹豫会拖慢节奏，太在意别人看法会失去主见。坚持立场会让你更有力量。比如设定明确的决策截止时间。场景化例子：职场中需要更快做决定。",
      summary:
        "天秤座的优势在于协调与审美。更果断一点，你会更受信任，也更容易推进事情。场景化例子：职场中你擅长协调资源与关系；学习上喜欢找伙伴一起讨论；关系里注重仪式感与沟通体验。",
    },
    traits: {
      expression: "重视公平，擅长协调关系。",
      strengths: "审美好，沟通能力强。",
      weaknesses: "犹豫不决，选择困难。",
    },
    style: "以平衡为目标，倾向合作达成共识。",
    blind: "过度顾虑他人会忽略自己需求。",
    summary: "立场清晰时更容易赢得支持。",
    quote: "让选择更果断一点。",
    facts: {
      max: "平衡",
      element: "风",
      ruler: "金星",
      color: "粉色",
      number: "6",
      match: "双子座",
    },
    fortune: { overall: 3, love: 4, career: 3, wealth: 3, health: 4 },
    good: "协作沟通",
    bad: "拖延决定",
  },
  scorpio: {
    name: "天蝎座",
    icon: "♏",
    date: "10.24-11.22",
    desc: "深刻、神秘、意志坚定",
    analysis: {
      basic:
        "天蝎座情感浓烈、洞察力强。你不轻易相信他人，但一旦认定就会非常坚定。比如在合作关系中，你会先观察一段时间再全力投入。场景化例子：关系里偏向深度绑定与强信任。",
      specific:
        "天蝎座象征深度与重生。你擅长探究真相，能够在压力下保持高度专注。面对复杂问题时，你会主动深入到底层原因。场景化例子：职场中喜欢追根究底找到关键点。",
      style:
        "行事风格深入、稳准，喜欢掌握核心信息后再行动。你追求控制感和确定性。比如你会先把关键资源掌握在手，再推进下一步。场景化例子：学习上更倾向研究型、深入型。",
      blind:
        "过度敏感会让你陷入猜测，强烈情绪可能影响判断。学会信任，会更轻松。比如把担心说出来，比自己猜测更有效。场景化例子：关系里避免过度控制或试探。",
      summary:
        "天蝎座的优势在于洞察与韧性。减少内耗，你会更有力量，也更能发挥影响力。场景化例子：职场中你擅长深挖问题并掌控关键点；学习上喜欢研究式学习；关系里重视信任与深度链接。",
    },
    traits: {
      expression: "洞察力强，情感深沉。",
      strengths: "专注力强，抗压能力高。",
      weaknesses: "情绪极端，占有欲强。",
    },
    style: "目标明确，喜欢深挖本质。",
    blind: "过度敏感会增加内耗。",
    summary: "适度放松反而更有掌控感。",
    quote: "越专注越接近答案。",
    facts: {
      max: "深刻",
      element: "水",
      ruler: "冥王星",
      color: "深红",
      number: "8",
      match: "巨蟹座",
    },
    fortune: { overall: 4, love: 3, career: 4, wealth: 4, health: 3 },
    good: "深入研究",
    bad: "过度猜测",
  },
  sagittarius: {
    name: "射手座",
    icon: "♐",
    date: "11.23-12.21",
    desc: "乐观、自由、热爱冒险",
    analysis: {
      basic:
        "射手座乐观开朗，喜欢探索与成长。你追求自由，不喜欢被限制，对新体验充满好奇。比如在计划中你更愿意尝试新的方法或路线。场景化例子：学习上愿意跨学科探索。",
      specific:
        "射手座由木星守护，象征扩张与远见。你愿意追求更大的舞台，热衷学习与旅行。生活里你会主动寻找跨领域的学习机会。场景化例子：职场中喜欢参与新的业务拓展。",
      style:
        "行事风格开放、积极，喜欢边行动边调整。你擅长抓住机会，拥有强烈的行动欲。比如想到点子就会立刻尝试，快速验证。场景化例子：关系里追求自由且坦诚的沟通方式。",
      blind:
        "过于追求自由可能忽略细节，承诺过多会让计划失衡。增加执行力会更稳。比如给每个承诺设置可量化的时间点。场景化例子：职场中注意把承诺落成具体行动。",
      summary:
        "射手座的优势在于视野与乐观。把热情落实，你会更有成果，也更容易被认可。场景化例子：职场中你擅长探索新机会；学习上喜欢跨领域拓展；关系里向往自由且坦诚交流。",
    },
    traits: {
      expression: "思想开放，热衷探索。",
      strengths: "积极乐观，学习新事物快。",
      weaknesses: "耐心不足，易三分钟热度。",
    },
    style: "偏好自由发挥，善于捕捉机会。",
    blind: "规划不足时会错失稳定成果。",
    summary: "适当自律能让成果更扎实。",
    quote: "把热情转为持续的行动。",
    facts: {
      max: "自由",
      element: "火",
      ruler: "木星",
      color: "紫色",
      number: "3",
      match: "白羊座",
    },
    fortune: { overall: 4, love: 4, career: 3, wealth: 3, health: 4 },
    good: "拓展视野",
    bad: "随意承诺",
  },
  capricorn: {
    name: "摩羯座",
    icon: "♑",
    date: "12.22-1.19",
    desc: "踏实、负责、目标明确",
    analysis: {
      basic:
        "摩羯座务实、有责任感，目标感强。你愿意为长期目标默默努力，不惧压力。比如面对长期项目，你会愿意先吃苦把基础打牢。场景化例子：职场中偏向承担核心责任。",
      specific:
        "摩羯座由土星守护，象征纪律与成就。你重视社会地位与成果，习惯把目标拆解落实。生活里你会提前规划时间表和资源安排。场景化例子：学习上习惯按阶段设定目标。",
      style:
        "行事风格稳健、有条理，喜欢按计划推进。你对时间和资源的管理很有方法。比如你会设定阶段性里程碑来追踪进度。场景化例子：关系里更偏稳定和长线规划。",
      blind:
        "过度压抑情绪容易疲惫，太重视结果会忽略过程的幸福感。学会放松很重要。比如定期安排休息日，不让自己一直紧绷。场景化例子：职场中避免长期过度加压。",
      summary:
        "摩羯座的优势在于自律与耐力。适度放松，你会更有持续力，也更容易保持热情。场景化例子：职场中你会制定长期目标并持续推进；学习上耐心打基础与长期积累；关系里偏稳定与责任感。",
    },
    traits: {
      expression: "稳重可靠，注重结果。",
      strengths: "执行力强，责任感足。",
      weaknesses: "容易压抑，过于谨慎。",
    },
    style: "按目标拆解任务，循序渐进。",
    blind: "把压力都扛在自己身上。",
    summary: "学会分担，效率会更高。",
    quote: "一步一个脚印。",
    facts: {
      max: "踏实",
      element: "土",
      ruler: "土星",
      color: "咖啡色",
      number: "4",
      match: "处女座",
    },
    fortune: { overall: 4, love: 3, career: 4, wealth: 4, health: 4 },
    good: "稳步推进",
    bad: "自我压迫",
  },
  aquarius: {
    name: "水瓶座",
    icon: "♒",
    date: "1.20-2.18",
    desc: "独立、创新、富有远见",
    analysis: {
      basic:
        "水瓶座独立理性，强调自由与创新。你思维前卫，喜欢探索新方法，容易引领趋势。比如你会提出不同于常规的解决方案。场景化例子：职场中擅长提出创新流程。",
      specific:
        "水瓶座由天王星守护，象征变革与突破。你不满足于传统框架，愿意用独特视角看问题。生活里你会乐于尝试新工具或新模式。场景化例子：学习上喜欢用新平台或新课程。",
      style:
        "行事风格灵活、富创意，擅长跳出现有规则寻找新解法。你对群体与社会议题也很敏感。比如在团队中你会提出更公平或更高效的方案。场景化例子：关系里需要空间但愿意分享理念。",
      blind:
        "过于理性可能让人觉得疏离，不愿妥协会增加沟通成本。适当表达情绪会更亲近。比如在沟通时多说“我感受到…”。场景化例子：职场中需要更具同理心的表达。",
      summary:
        "水瓶座的优势在于创新与前瞻。多一点温度，你会更有影响力，也更容易被理解。场景化例子：职场中你会提出新思路优化流程；学习上喜欢用新工具或新方法；关系里需要空间但也愿意分享想法。",
    },
    traits: {
      expression: "思维前卫，强调自由。",
      strengths: "创意丰富，擅长突破常规。",
      weaknesses: "情感疏离，难以妥协。",
    },
    style: "喜欢尝试新方法，重视独立性。",
    blind: "过于理性会忽略人情。",
    summary: "增加情感表达会更有支持。",
    quote: "创新是你的底色。",
    facts: {
      max: "创新",
      element: "风",
      ruler: "天王星",
      color: "蓝色",
      number: "7",
      match: "双子座",
    },
    fortune: { overall: 3, love: 3, career: 4, wealth: 3, health: 4 },
    good: "输出创意",
    bad: "情绪疏离",
  },
  pisces: {
    name: "双鱼座",
    icon: "♓",
    date: "2.19-3.20",
    desc: "浪漫、敏感、富有想象力",
    analysis: {
      basic:
        "双鱼座浪漫敏感，富有想象力与共情力。你容易被情绪触动，也擅长理解他人的感受。比如你能捕捉到别人没说出口的情绪。场景化例子：关系里容易共情对方并主动安慰。",
      specific:
        "双鱼座由海王星守护，象征灵感与梦境。你对艺术、情感与灵性领域有天然的亲近感。生活里你可能更喜欢音乐、影像或创作。场景化例子：学习上喜欢以兴趣和灵感驱动。",
      style:
        "行事风格随性而感性，容易凭直觉做决定。你在氛围中表现更好，适合柔性沟通。比如在压力小的环境下效率会更高。场景化例子：职场中适合创意或内容类任务。",
      blind:
        "过度理想化会让现实落差变大，逃避问题会积累压力。把灵感落地更稳。比如给创意设一个可执行的小目标。场景化例子：关系里需要更直接的沟通来减少误会。",
      summary:
        "双鱼座的优势在于共情与灵感。增加行动力，你会更有安全感，也更容易把梦想实现。场景化例子：职场中你擅长氛围营造与创意；学习上容易被兴趣驱动；关系里重视情感共鸣与温柔表达。",
    },
    traits: {
      expression: "感性浪漫，直觉敏锐。",
      strengths: "共情强，想象力丰富。",
      weaknesses: "容易逃避，现实感不足。",
    },
    style: "靠灵感与感受做决定，注重氛围。",
    blind: "过度理想化会影响判断。",
    summary: "保持现实感更容易落地。",
    quote: "把灵感落到日常。",
    facts: {
      max: "浪漫",
      element: "水",
      ruler: "海王星",
      color: "海蓝",
      number: "11",
      match: "天蝎座",
    },
    fortune: { overall: 4, love: 4, career: 3, wealth: 3, health: 4 },
    good: "情感交流",
    bad: "回避问题",
  },
};

function buildAnalysis(profile) {
  return [
    {
      title: "基本特质",
      content: profile.analysis.basic,
    },
    {
      title: "具体特质",
      content: profile.analysis.specific,
    },
    {
      title: "行事风格",
      content: profile.analysis.style,
    },
    {
      title: "个性盲点",
      content: profile.analysis.blind,
    },
    {
      title: "总结",
      content: profile.analysis.summary,
    },
  ];
}

function buildFortune(profile) {
  return {
    quote: profile.quote,
    overall: profile.fortune.overall,
    scores: [
      { label: "爱情", score: profile.fortune.love },
      { label: "事业", score: profile.fortune.career },
      { label: "财运", score: profile.fortune.wealth },
      { label: "健康", score: profile.fortune.health },
    ],
    lucky: [
      { label: "幸运颜色", value: profile.facts.color },
      { label: "幸运数字", value: profile.facts.number },
      { label: "速配星座", value: profile.facts.match },
    ],
    good: profile.good,
    bad: profile.bad,
    details: [
      {
        title: "综合运势",
        icon: "⭐",
        score: profile.fortune.overall,
        text: `${profile.name}今天整体节奏稳定，保持专注可以看到实质进展。`,
      },
      {
        title: "事业学业",
        icon: "👑",
        score: profile.fortune.career,
        text: "交流协作顺畅，按计划推进会收获明确成果。",
      },
      {
        title: "财富运势",
        icon: "💰",
        score: profile.fortune.wealth,
        text: "收支保持平衡，适合做长期规划与复盘。",
      },
      {
        title: "爱情运势",
        icon: "💗",
        score: profile.fortune.love,
        text: "表达更坦率一些，会获得更积极的回应。",
      },
      {
        title: "健康运势",
        icon: "🍃",
        score: profile.fortune.health,
        text: "注意作息和饮食，适度放松提升状态。",
      },
    ],
  };
}

Page({
  data: {
    navBarHeight: 0,
    zodiacId: "",
    zodiac: {},
    profileFacts: [],
    traits: {
      expression: "",
      strengths: "",
      weaknesses: "",
    },
    analysisSections: [],
    fortune: {
      quote: "",
      overall: 0,
      scores: [],
      lucky: [],
      good: "",
      bad: "",
      details: [],
    },
    starIndexes: STAR_INDEXES,
  },

  onLoad(options) {
    const zodiacId = options.id || "aries";
    const profile = ZODIAC_PROFILES[zodiacId] || ZODIAC_PROFILES.aries;
    const analysisSections = buildAnalysis(profile);
    const fortune = buildFortune(profile);

    this.setData({
      zodiacId,
      zodiac: {
        name: profile.name,
        icon: profile.icon,
        date: profile.date,
        desc: profile.desc,
      },
      profileFacts: [
        { label: "最大特征", value: profile.facts.max },
        { label: "四象属性", value: profile.facts.element },
        { label: "主管行星", value: profile.facts.ruler },
        { label: "幸运颜色", value: profile.facts.color },
        { label: "幸运号码", value: profile.facts.number },
        { label: "速配星座", value: profile.facts.match },
      ],
      traits: profile.traits,
      analysisSections,
      fortune,
    });
  },

  onNavReady(e) {
    this.setData({
      navBarHeight: e.detail.navBarHeight || 0,
    });
  },
});
