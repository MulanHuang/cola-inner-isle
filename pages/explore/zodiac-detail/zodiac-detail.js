// pages/explore/zodiac-detail/zodiac-detail.js
const STAR_INDEXES = [0, 1, 2, 3, 4];
const FORTUNE_CACHE_KEY = "zodiac.fortuneCache";
const DAILY_BEHAVIOR_KEY = "zodiac.dailyBehavior";

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

const ZODIAC_KEYWORDS = {
  aries: {
    theme: ["主动", "突破", "执行"],
    career: ["行动力", "开拓", "领跑"],
    wealth: ["快进快出", "预算", "控制冲动"],
    love: ["直率", "热烈", "主动表达"],
    health: ["运动", "补水", "情绪释放"],
  },
  taurus: {
    theme: ["稳定", "积累", "耐心"],
    career: ["稳健推进", "细节打磨", "可持续"],
    wealth: ["储蓄", "稳健配置", "长期主义"],
    love: ["踏实", "慢热", "可靠陪伴"],
    health: ["规律作息", "舒缓", "营养均衡"],
  },
  gemini: {
    theme: ["沟通", "灵活", "信息"],
    career: ["协作", "多线并行", "效率优化"],
    wealth: ["小额试错", "信息优势", "控制分散"],
    love: ["轻松互动", "有趣", "高频沟通"],
    health: ["节奏管理", "放松", "减压"],
  },
  cancer: {
    theme: ["情感", "安全感", "照顾"],
    career: ["稳定团队", "支持协作", "细节关怀"],
    wealth: ["稳守", "家庭规划", "避免情绪消费"],
    love: ["温柔", "共情", "仪式感"],
    health: ["作息规律", "舒缓情绪", "轻运动"],
  },
  leo: {
    theme: ["自信", "舞台感", "领导"],
    career: ["担当", "表现力", "目标驱动"],
    wealth: ["价值回报", "形象投入", "控制面子消费"],
    love: ["热情", "表达", "认可感"],
    health: ["精力管理", "作息节奏", "避免透支"],
  },
  virgo: {
    theme: ["秩序", "细节", "优化"],
    career: ["流程", "质量", "复盘"],
    wealth: ["精打细算", "风险控制", "预算"],
    love: ["稳定", "体贴", "务实"],
    health: ["规律", "轻负担运动", "压力管理"],
  },
  libra: {
    theme: ["平衡", "关系", "审美"],
    career: ["协调", "共识", "合作推进"],
    wealth: ["平衡收支", "审慎选择", "避免犹豫"],
    love: ["沟通", "体面", "互相成就"],
    health: ["节律", "舒适感", "适度运动"],
  },
  scorpio: {
    theme: ["深度", "掌控", "洞察"],
    career: ["深挖问题", "专注", "核心资源"],
    wealth: ["长期策略", "控制风险", "避免冲动"],
    love: ["信任", "深度链接", "边界清晰"],
    health: ["修复", "排压", "规律作息"],
  },
  sagittarius: {
    theme: ["探索", "自由", "成长"],
    career: ["机会捕捉", "视野", "行动"],
    wealth: ["规划", "避免承诺过多", "稳中求进"],
    love: ["坦诚", "空间感", "轻松互动"],
    health: ["节奏感", "户外活动", "放松"],
  },
  capricorn: {
    theme: ["责任", "长期", "自律"],
    career: ["目标拆解", "执行", "稳步推进"],
    wealth: ["稳健", "长期配置", "风险控制"],
    love: ["承诺", "稳定", "行动兑现"],
    health: ["耐力", "规律", "避免过劳"],
  },
  aquarius: {
    theme: ["创新", "独立", "变革"],
    career: ["新方法", "突破常规", "协作创新"],
    wealth: ["新工具", "理性规划", "控制波动"],
    love: ["理性表达", "自由", "共识"],
    health: ["节奏管理", "放松", "情绪表达"],
  },
  pisces: {
    theme: ["共情", "灵感", "浪漫"],
    career: ["创意", "柔性沟通", "氛围感"],
    wealth: ["稳守", "避免幻想", "小步试错"],
    love: ["温柔", "共鸣", "情感连接"],
    health: ["休息", "放松", "情绪整理"],
  },
};

const ZODIAC_TONES = {
  aries: {
    daily: "更适合先动起来，再做微调。",
    weekly: "用行动去验证方向，别拖太久。",
    monthly: "把冲劲转成可持续节奏。",
    yearly: "以挑战为牵引，持续突破。",
    love: "直率表达更有效。",
  },
  taurus: {
    daily: "稳住节奏，先把基础夯实。",
    weekly: "把成果做扎实，比速度更重要。",
    monthly: "用稳定积累换来安全感。",
    yearly: "耐心投入会有回报。",
    love: "慢热更能建立信任。",
  },
  gemini: {
    daily: "信息先整理清楚，再下结论。",
    weekly: "分清优先级，减少分心。",
    monthly: "多沟通、少犹豫会更顺。",
    yearly: "持续学习能打开新路径。",
    love: "轻松互动更容易升温。",
  },
  cancer: {
    daily: "先照顾好情绪，效率会更高。",
    weekly: "稳定关系会提升整体感受。",
    monthly: "营造安全感是关键。",
    yearly: "把关心变成长期陪伴。",
    love: "温柔与回应是主旋律。",
  },
  leo: {
    daily: "把光芒用在关键任务上。",
    weekly: "明确目标，带动节奏。",
    monthly: "用成果建立影响力。",
    yearly: "把领导力沉淀成方法。",
    love: "热情表达会更打动人。",
  },
  virgo: {
    daily: "先定标准，再做执行。",
    weekly: "流程清晰会更高效。",
    monthly: "复盘能带来持续优化。",
    yearly: "细节积累会形成优势。",
    love: "体贴与稳定最加分。",
  },
  libra: {
    daily: "先做权衡，再做决定。",
    weekly: "沟通一致是推进关键。",
    monthly: "保持平衡会更顺畅。",
    yearly: "稳定关系和合作更重要。",
    love: "清晰表达更有安全感。",
  },
  scorpio: {
    daily: "先看本质，再做选择。",
    weekly: "专注深挖会见成果。",
    monthly: "控制节奏更有掌控感。",
    yearly: "长期深耕更有力量。",
    love: "信任是关系的基石。",
  },
  sagittarius: {
    daily: "先设方向，再自由发挥。",
    weekly: "保持探索，但别忘执行。",
    monthly: "把视野转成具体行动。",
    yearly: "长期目标需要坚持感。",
    love: "坦诚与空间感并行。",
  },
  capricorn: {
    daily: "稳步推进，比速度更重要。",
    weekly: "执行与复盘是关键。",
    monthly: "设定里程碑更有动力。",
    yearly: "长期主义是主轴。",
    love: "用行动证明在乎。",
  },
  aquarius: {
    daily: "新方法会带来新突破。",
    weekly: "保持独立，但别忽略协作。",
    monthly: "创新要有落地路径。",
    yearly: "愿景需要耐心沉淀。",
    love: "真诚与边界同样重要。",
  },
  pisces: {
    daily: "情绪稳定后效率更高。",
    weekly: "先照顾自己，再关心别人。",
    monthly: "把灵感落到具体计划。",
    yearly: "稳定的节奏更有安全感。",
    love: "共情能拉近距离。",
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

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekKey(date) {
  const dayIndex = date.getDay();
  const startOfWeek = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - dayIndex
  );
  const year = startOfWeek.getFullYear();
  const month = String(startOfWeek.getMonth() + 1).padStart(2, "0");
  const day = String(startOfWeek.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getYearKey(date) {
  return `${date.getFullYear()}`;
}

function getYesterdayKey() {
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clampScore(score) {
  return Math.min(5, Math.max(1, score));
}

function updateBehaviorStreak() {
  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();
  const behavior = wx.getStorageSync(DAILY_BEHAVIOR_KEY) || {};
  let streak = behavior.streak || 0;

  if (behavior.lastDate === todayKey) {
    return streak;
  }

  if (behavior.lastDate === yesterdayKey) {
    streak += 1;
  } else {
    streak = 1;
  }

  wx.setStorageSync(DAILY_BEHAVIOR_KEY, {
    lastDate: todayKey,
    streak,
  });

  return streak;
}

function buildPersonalHint(userProfile) {
  if (!userProfile) {
    return "";
  }
  const hints = [];
  if (userProfile.birthTime) {
    hints.push("适合早做规划，把精力留给关键目标。");
  }
  if (userProfile.livePlace && userProfile.livePlace.length) {
    hints.push("在熟悉环境中更能发挥稳定优势。");
  }
  if (userProfile.gender) {
    hints.push("今天适合更清晰地表达需求与边界。");
  }
  return hints.length ? hints.join(" ") : "";
}

function buildKeywordHints(zodiacId) {
  const bank = ZODIAC_KEYWORDS[zodiacId];
  if (!bank) {
    return {};
  }
  const format = (label, list) =>
    list && list.length ? `${label}关键词：${list.join("、")}。` : "";
  return {
    theme: format("主题", bank.theme),
    career: format("事业", bank.career),
    wealth: format("财务", bank.wealth),
    love: format("爱情", bank.love),
    health: format("健康", bank.health),
  };
}

function buildKeywordList(zodiacId) {
  return ZODIAC_KEYWORDS[zodiacId] || {};
}

function buildToneHints(zodiacId) {
  return ZODIAC_TONES[zodiacId] || {};
}

function getDateFromKey(dateKey) {
  if (!dateKey) {
    return new Date();
  }
  const parts = dateKey.split("-");
  if (parts.length === 3) {
    return new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );
  }
  if (parts.length === 2) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  }
  if (parts.length === 1) {
    return new Date(Number(parts[0]), 0, 1);
  }
  return new Date();
}

function getPrevDateKey(tabKey, dateKey) {
  const date = getDateFromKey(dateKey);
  if (tabKey === "weekly") {
    const prev = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7);
    return getWeekKey(prev);
  }
  if (tabKey === "monthly") {
    const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return getMonthKey(prev);
  }
  if (tabKey === "yearly") {
    const prev = new Date(date.getFullYear() - 1, 0, 1);
    return getYearKey(prev);
  }
  if (tabKey === "love") {
    return getTodayKey();
  }
  const prev = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(prev.getDate()).padStart(2, "0")}`;
}

function getTrendShift(dateKey, zodiacId, tabKey) {
  const date = getDateFromKey(dateKey);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const dayOfYear = Math.floor(diff / 86400000);
  const seed = hashString(`${zodiacId}:${tabKey}`);
  const phase = (seed % 360) * (Math.PI / 180);
  const seasonal = Math.sin((dayOfYear / 365) * Math.PI * 2 + phase);
  const tabScale = tabKey === "yearly" ? 0.3 : tabKey === "monthly" ? 0.6 : tabKey === "weekly" ? 0.8 : 1;
  return Math.round(seasonal * tabScale);
}

function buildFortune(profile, zodiacId, tabKey, dateKey, userProfile) {
  const scoreTextMap = {
    5: "表现亮眼，适合大胆推进。",
    4: "稳中向好，保持节奏更有收获。",
    3: "平稳普通，细节决定体验。",
    2: "容易分心，建议保守应对。",
    1: "起伏较多，先稳住再行动。",
  };
  const getScoreText = (score) =>
    scoreTextMap[score] || "保持平和，循序渐进。";
  const cache = wx.getStorageSync(FORTUNE_CACHE_KEY) || {};
  const cachedByDate = cache[dateKey] || {};
  const cachedByZodiac = cachedByDate[zodiacId] || {};
  const cached = cachedByZodiac[tabKey];
  if (cached) {
    return cached;
  }

  const streak = updateBehaviorStreak();
  const streakBonus = Math.min(1, Math.floor(streak / 3));
  const hashSeed = `${dateKey}:${zodiacId}:${tabKey}:${streak}`;
  const seed = hashString(hashSeed);
  const fluctuation = (seed % 3) - 1;
  const trendShift = getTrendShift(dateKey, zodiacId, tabKey);
  const scoreBase = {
    love: profile.fortune.love,
    career: profile.fortune.career,
    wealth: profile.fortune.wealth,
    health: profile.fortune.health,
  };
  const scoreWeights = {
    love: (seed % 2) ? 1 : 0,
    career: (seed % 3) ? 1 : 0,
    wealth: (seed % 5) ? 0 : 1,
    health: (seed % 7) ? 0 : 1,
  };
  const tabMultiplier = tabKey === "yearly" ? 0 : 1;
  const smoothing =
    tabKey === "yearly" ? 0.7 : tabKey === "monthly" ? 0.6 : tabKey === "weekly" ? 0.5 : 0.4;
  const prevKey = getPrevDateKey(tabKey, dateKey);
  const prevCache = cache[prevKey] || {};
  const prevZodiac = prevCache[zodiacId] || {};
  const prevFortune = prevZodiac[tabKey];
  const scores = {
    love: clampScore(scoreBase.love + fluctuation + trendShift + scoreWeights.love + streakBonus),
    career: clampScore(
      scoreBase.career + fluctuation + trendShift + scoreWeights.career + tabMultiplier
    ),
    wealth: clampScore(scoreBase.wealth + fluctuation + trendShift + scoreWeights.wealth),
    health: clampScore(scoreBase.health + fluctuation + trendShift + scoreWeights.health),
  };
  if (prevFortune && prevFortune.scores) {
    const prev = prevFortune.scores.reduce((acc, item) => {
      acc[item.label] = item.score;
      return acc;
    }, {});
    scores.love = clampScore(
      Math.round(scores.love * (1 - smoothing) + (prev["爱情"] || scores.love) * smoothing)
    );
    scores.career = clampScore(
      Math.round(
        scores.career * (1 - smoothing) + (prev["事业"] || scores.career) * smoothing
      )
    );
    scores.wealth = clampScore(
      Math.round(
        scores.wealth * (1 - smoothing) + (prev["财运"] || scores.wealth) * smoothing
      )
    );
    scores.health = clampScore(
      Math.round(
        scores.health * (1 - smoothing) + (prev["健康"] || scores.health) * smoothing
      )
    );
  }
  const overall = clampScore(
    Math.round((scores.love + scores.career + scores.wealth + scores.health) / 4)
  );
  const personalHint = buildPersonalHint(userProfile);
  const keywordHints = buildKeywordHints(zodiacId);
  const keywordList = buildKeywordList(zodiacId);
  const toneHints = buildToneHints(zodiacId);
  const tabPrefix = {
    daily: "今日",
    weekly: "本周",
    monthly: "本月",
    yearly: "今年",
    love: "爱情面",
  }[tabKey] || "今日";

  const zodiacFlavor = {
    daily: `以${profile.desc}的优势切入会更顺手。`,
    weekly: `以“${profile.facts.max}”为核心推进，会更稳定。`,
    monthly: `本月适合把${profile.facts.element}能量用在长期积累上。`,
    yearly: `年度主线宜围绕${profile.facts.ruler}的特质展开。`,
    love: `情感表达更适合${profile.facts.element}式的节奏。`,
  };

  const quotesByTab = {
    daily: profile.quote,
    weekly: "把重点放在稳步推进。",
    monthly: "以长期节奏组织当下行动。",
    yearly: "让目标成为你的方向感。",
    love: "把真诚放在第一位。",
  };
  const tabQuote = quotesByTab[tabKey] || profile.quote;

  const detailBuilders = {
    daily: [
      {
        title: "综合运势",
        icon: "⭐",
        score: overall,
        text: `${profile.name}${tabPrefix}整体节奏${overall >= 4 ? "偏积极" : "偏平稳"}，更适合围绕“${profile.facts.max}”优势推进核心事项。${getScoreText(
          overall
        )}把精力集中在最能产生成果的 20%，效果会更明显。${zodiacFlavor.daily} ${keywordHints.theme || ""} ${
          personalHint ? ` ${personalHint}` : ""
        } ${toneHints.daily || ""}`,
      },
      {
        title: "事业学业",
        icon: "👑",
        score: scores.career,
        text: `事业学业侧重点在“${profile.facts.max}”，宜先搭结构再填细节。${getScoreText(
          scores.career
        )}把复杂任务拆成 2-3 个里程碑，会更容易看见进度，也能降低拖延感。${profile.name}更适合在上午完成关键步骤。${keywordHints.career} ${toneHints.daily || ""}`,
      },
      {
        title: "财富运势",
        icon: "💰",
        score: scores.wealth,
        text: `财务方面适合“稳”字当头，先控支出再谈增长。${getScoreText(
          scores.wealth
        )}可以小额试错、避免冲动消费，让现金流更安心。${profile.facts.element}属性更适合“慢慢攒”的方式。${keywordHints.wealth} ${toneHints.daily || ""}`,
      },
      {
        title: "爱情运势",
        icon: "💗",
        score: scores.love,
        text: `情感互动更需要清晰表达与及时回应。${getScoreText(
          scores.love
        )}单身适合先建立轻松互动，再推进深入了解；有伴则可通过小仪式感强化连结。${zodiacFlavor.love} ${keywordHints.love} ${toneHints.love || ""}`,
      },
      {
        title: "健康运势",
        icon: "🍃",
        score: scores.health,
        text: `身体状态以“${profile.facts.element}”的节奏为宜，稳定比强度更重要。${getScoreText(
          scores.health
        )}建议优先保证睡眠与补水，适度拉伸或轻运动更能恢复精力。${profile.name}今天更适合做低强度恢复。${keywordHints.health} ${toneHints.daily || ""}`,
      },
    ],
    weekly: [
      {
        title: "本周主题",
        icon: "🗓️",
        score: overall,
        text: `${profile.name}本周主线更偏${overall >= 4 ? "推进" : "稳住"}，适合以“阶段性成果”做节奏锚点。${getScoreText(
          overall
        )}先完成一件能带来确定性的任务，会显著提升后续动力。${zodiacFlavor.weekly} ${keywordHints.theme || ""} ${
          personalHint ? ` ${personalHint}` : ""
        } ${toneHints.weekly || ""}`,
      },
      {
        title: "事业节奏",
        icon: "🧭",
        score: scores.career,
        text: `事业学业适合拉长时间维度安排，先做结构再做细节。${getScoreText(
          scores.career
        )}建议把每周重点控制在 2-3 件，避免被碎片任务稀释注意力。${keywordHints.career} ${toneHints.weekly || ""}`,
      },
      {
        title: "财务规划",
        icon: "💼",
        score: scores.wealth,
        text: `本周更适合做预算梳理与小步试错。${getScoreText(
          scores.wealth
        )}可以设置“本周支出上限”，让消费更有边界感。${keywordHints.wealth} ${toneHints.weekly || ""}`,
      },
      {
        title: "关系提示",
        icon: "🤝",
        score: scores.love,
        text: `关系中更需要稳定沟通和持续回应。${getScoreText(
          scores.love
        )}把一次坦诚的对话放在轻松场景里，效果更好。${keywordHints.love} ${toneHints.weekly || ""}`,
      },
      {
        title: "身心管理",
        icon: "🍃",
        score: scores.health,
        text: `保持节奏比冲刺更重要，适度休息会提升效率。${getScoreText(
          scores.health
        )}建议固定一段“低噪音时间”，让身心真正停下来。${keywordHints.health} ${toneHints.weekly || ""}`,
      },
    ],
    monthly: [
      {
        title: "本月重点",
        icon: "📌",
        score: overall,
        text: `${profile.name}本月更强调“${profile.facts.max}”的优势发挥，适合确立阶段目标与关键指标。${getScoreText(
          overall
        )}把目标拆成“可验证的小成果”，更容易保持稳定产出。${zodiacFlavor.monthly} ${keywordHints.theme || ""} ${
          personalHint ? ` ${personalHint}` : ""
        } ${toneHints.monthly || ""}`,
      },
      {
        title: "事业布局",
        icon: "🏗️",
        score: scores.career,
        text: `适合做长期规划与节奏铺排，把关键节点先锁定。${getScoreText(
          scores.career
        )}建议提前完成 1 个可交付成果，建立“可见的进度感”。${keywordHints.career} ${toneHints.monthly || ""}`,
      },
      {
        title: "财务策略",
        icon: "📊",
        score: scores.wealth,
        text: `本月适合优化支出结构或建立储备。${getScoreText(
          scores.wealth
        )}把“固定支出/弹性支出”分开，会更容易做调整。${keywordHints.wealth} ${toneHints.monthly || ""}`,
      },
      {
        title: "情感氛围",
        icon: "💞",
        score: scores.love,
        text: `关系更适合营造稳定、安全的互动氛围。${getScoreText(
          scores.love
        )}可以约定固定的相处时间，让彼此都有可预期的连接感。${keywordHints.love} ${toneHints.monthly || ""}`,
      },
      {
        title: "健康管理",
        icon: "🧘",
        score: scores.health,
        text: `适合建立可持续的作息与运动节奏。${getScoreText(
          scores.health
        )}重点在“规律”，而不是一次性强度。${keywordHints.health} ${toneHints.monthly || ""}`,
      },
    ],
    yearly: [
      {
        title: "年度主线",
        icon: "🌟",
        score: overall,
        text: `${profile.name}今年更强调长期主义与积累，适合制定清晰里程碑与阶段复盘点。${getScoreText(
          overall
        )}把目标放在“可持续成长”上，会更稳更有收获。${zodiacFlavor.yearly} ${keywordHints.theme || ""} ${
          personalHint ? ` ${personalHint}` : ""
        } ${toneHints.yearly || ""}`,
      },
      {
        title: "事业方向",
        icon: "🚀",
        score: scores.career,
        text: `年度事业适合确定赛道与持续深耕，避免频繁切换。${getScoreText(
          scores.career
        )}建议建立个人方法论，逐步形成可复用的能力模型。${keywordHints.career} ${toneHints.yearly || ""}`,
      },
      {
        title: "财富策略",
        icon: "🏦",
        score: scores.wealth,
        text: `适合稳健配置与长期规划，控制风险更重要。${getScoreText(
          scores.wealth
        )}避免过度分散，先把基础盘打稳。${keywordHints.wealth} ${toneHints.yearly || ""}`,
      },
      {
        title: "关系长期",
        icon: "💍",
        score: scores.love,
        text: `关系更看重长期承诺与价值观一致。${getScoreText(
          scores.love
        )}适合建立清晰的沟通规则与共同目标。${keywordHints.love} ${toneHints.yearly || ""}`,
      },
      {
        title: "健康节奏",
        icon: "🌿",
        score: scores.health,
        text: `长期健康更需要规律与耐心投入。${getScoreText(
          scores.health
        )}建议把体检/运动计划列入年度清单。${keywordHints.health} ${toneHints.yearly || ""}`,
      },
    ],
    love: [
      {
        title: "情感氛围",
        icon: "💗",
        score: scores.love,
        text: `爱情面整体偏${scores.love >= 4 ? "积极" : "平稳"}，把真诚放在首位会更顺利。${getScoreText(
          scores.love
        )}在表达感受时避免“拐弯猜测”，越清晰越温柔。${zodiacFlavor.love} ${keywordHints.love} ${
          personalHint ? ` ${personalHint}` : ""
        } ${toneHints.love || ""}`,
      },
      {
        title: "单身建议",
        icon: "✨",
        score: scores.love,
        text: `适合在轻松场景主动表达兴趣，保持自然与松弛感。${getScoreText(
          scores.love
        )}先从共同话题建立连接，再推进更深入的互动。${keywordHints.love} ${toneHints.love || ""}`,
      },
      {
        title: "有伴建议",
        icon: "🤍",
        score: scores.love,
        text: `更适合共同安排可落实的小计划，增强安全感与信任感。${getScoreText(
          scores.love
        )}“把话说清楚、把事做落地”会减少误解。${keywordHints.love} ${toneHints.love || ""}`,
      },
      {
        title: "沟通关键词",
        icon: "🗣️",
        score: overall,
        text: `清晰、回应、共情是关键词，避免含糊或过度猜测。${getScoreText(
          overall
        )}把“我需要”与“我感受”区分开表达，更容易被理解。${keywordHints.love} ${toneHints.love || ""}`,
      },
      {
        title: "自我关怀",
        icon: "🌙",
        score: scores.health,
        text: `把情绪照顾好，关系才更稳。适合安排放松与自我修复。${getScoreText(
          scores.health
        )}让自己先安定下来，会更容易给出稳定回应。${keywordHints.health} ${toneHints.love || ""}`,
      },
    ],
  };

  const tagMap = {
    theme: keywordList.theme || [],
    career: keywordList.career || [],
    wealth: keywordList.wealth || [],
    love: keywordList.love || [],
    health: keywordList.health || [],
  };
  const actionTemplates = {
    theme: {
      daily: "行动建议：完成一件最关键任务。",
      weekly: "行动建议：设定一个阶段性成果。",
      monthly: "行动建议：锁定一个可验证目标。",
      yearly: "行动建议：设定年度里程碑。",
      love: "行动建议：主动表达真实需求。",
    },
    career: {
      daily: "行动建议：先做结构再落细节。",
      weekly: "行动建议：控制每周重点在 2-3 件。",
      monthly: "行动建议：提前交付一个可见成果。",
      yearly: "行动建议：建立可复用的方法论。",
      love: "行动建议：在相处中保持明确回应。",
    },
    wealth: {
      daily: "行动建议：记录支出并设定上限。",
      weekly: "行动建议：做一次预算复盘。",
      monthly: "行动建议：调整固定/弹性支出比例。",
      yearly: "行动建议：建立长期储备与风险控制。",
      love: "行动建议：用小投入制造仪式感。",
    },
    love: {
      daily: "行动建议：用清晰表达减少误解。",
      weekly: "行动建议：安排一次高质量对话。",
      monthly: "行动建议：建立固定相处节奏。",
      yearly: "行动建议：对齐长期价值观与目标。",
      love: "行动建议：真诚说出期待与边界。",
    },
    health: {
      daily: "行动建议：优先保证睡眠与补水。",
      weekly: "行动建议：安排一次深度休息。",
      monthly: "行动建议：形成规律作息与运动。",
      yearly: "行动建议：把体检/运动列入清单。",
      love: "行动建议：先稳定情绪再沟通。",
    },
  };
  const riskTemplates = {
    theme: {
      daily: "风险提醒：多线并行会稀释成果。",
      weekly: "风险提醒：节奏过快易疲惫。",
      monthly: "风险提醒：目标过多会分散能量。",
      yearly: "风险提醒：频繁切换会削弱积累。",
      love: "风险提醒：回避沟通会加深误会。",
    },
    career: {
      daily: "风险提醒：被琐事打断节奏。",
      weekly: "风险提醒：任务过碎导致拖延。",
      monthly: "风险提醒：不复盘会重复踩坑。",
      yearly: "风险提醒：方向不稳会消耗动力。",
      love: "风险提醒：含糊表达引发猜测。",
    },
    wealth: {
      daily: "风险提醒：冲动消费影响现金流。",
      weekly: "风险提醒：小支出累积失控。",
      monthly: "风险提醒：大额支出缺乏预案。",
      yearly: "风险提醒：过度分散降低收益。",
      love: "风险提醒：把花钱当情绪补偿。",
    },
    love: {
      daily: "风险提醒：过度揣测会耗能。",
      weekly: "风险提醒：缺少回应造成距离。",
      monthly: "风险提醒：沟通不对齐容易误解。",
      yearly: "风险提醒：价值观不一致易反复。",
      love: "风险提醒：回避冲突会累积压力。",
    },
    health: {
      daily: "风险提醒：熬夜会削弱恢复。",
      weekly: "风险提醒：压力堆积影响状态。",
      monthly: "风险提醒：节奏失衡导致疲惫。",
      yearly: "风险提醒：长期忽视小问题。",
      love: "风险提醒：情绪过载影响判断。",
    },
  };
  const boostTemplates = {
    theme: "加分项：保持稳定输出。",
    career: "加分项：清晰目标与复盘。",
    wealth: "加分项：小额试错与记录。",
    love: "加分项：真诚表达与回应。",
    health: "加分项：规律作息与放松。",
  };
  const getSectionKey = (title) => {
    if (title.includes("事业") || title.includes("学业") || title.includes("方向")) {
      return "career";
    }
    if (title.includes("财")) {
      return "wealth";
    }
    if (title.includes("爱") || title.includes("关系") || title.includes("沟通")) {
      return "love";
    }
    if (title.includes("健康") || title.includes("身心")) {
      return "health";
    }
    return "theme";
  };
  const enhanceDetails = (details) =>
    details.map((item) => {
      const sectionKey = getSectionKey(item.title);
      const tags = tagMap[sectionKey] || [];
      const action =
        item.action || actionTemplates[sectionKey][tabKey] || actionTemplates.theme[tabKey];
      const risk =
        item.risk || riskTemplates[sectionKey][tabKey] || riskTemplates.theme[tabKey];
      const boost =
        item.boost ||
        (tags.length
          ? `加分项：${tags.join("、")}。`
          : boostTemplates[sectionKey]);
      return {
        ...item,
        action,
        risk,
        boost,
        tags: item.tags || tags,
      };
    });

  const fortune = {
    quote: tabQuote,
    overall,
    scores: [
      { label: "爱情", score: scores.love },
      { label: "事业", score: scores.career },
      { label: "财运", score: scores.wealth },
      { label: "健康", score: scores.health },
    ],
    lucky: [
      { label: "幸运颜色", value: profile.facts.color },
      { label: "幸运数字", value: profile.facts.number },
      { label: "速配星座", value: profile.facts.match },
    ],
    good: profile.good,
    bad: profile.bad,
    details: enhanceDetails(detailBuilders[tabKey] || detailBuilders.daily),
  };
  const nextCache = {
    ...cache,
    [dateKey]: {
      ...cachedByDate,
      [zodiacId]: {
        ...cachedByZodiac,
        [tabKey]: fortune,
      },
    },
  };
  wx.setStorageSync(FORTUNE_CACHE_KEY, nextCache);

  return fortune;
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
    calendarTabs: [
      { key: "daily", label: "日运" },
      { key: "weekly", label: "周运" },
      { key: "monthly", label: "月运" },
      { key: "yearly", label: "年运" },
      { key: "love", label: "爱情" },
    ],
    activeCalendarTab: "daily",
    calendarDisplay: {
      day: "",
      month: "",
    },
    weekDays: [],
    selectedDateKey: "",
    userProfile: null,
  },

  onLoad(options) {
    const zodiacId = options.id || "aries";
    const userProfile = wx.getStorageSync("userProfile") || null;
    const profile = ZODIAC_PROFILES[zodiacId] || ZODIAC_PROFILES.aries;
    const analysisSections = buildAnalysis(profile);
    const selectedDateKey = getTodayKey();
    const fortune = buildFortune(
      profile,
      zodiacId,
      this.data.activeCalendarTab,
      selectedDateKey,
      userProfile
    );

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
      calendarDisplay: this.getCalendarDisplay(selectedDateKey),
      weekDays: this.getWeekDays(selectedDateKey),
      selectedDateKey,
      userProfile,
    });
  },

  onNavReady(e) {
    this.setData({
      navBarHeight: e.detail.navBarHeight || 0,
    });
  },

  getCalendarDisplay(dateKey) {
    const now = dateKey ? new Date(dateKey) : new Date();
    return {
      day: String(now.getDate()).padStart(2, "0"),
      month: String(now.getMonth() + 1).padStart(2, "0"),
    };
  },

  getWeekDays(selectedDateKey) {
    const now = new Date();
    const dayIndex = now.getDay();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - dayIndex
    );
    const labels = ["日", "一", "二", "三", "四", "五", "六"];
    const weekDays = [];

    for (let i = 0; i < 7; i += 1) {
      const date = new Date(
        startOfWeek.getFullYear(),
        startOfWeek.getMonth(),
        startOfWeek.getDate() + i
      );
      const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
      const dateKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      weekDays.push({
        label: labels[i],
        date: String(date.getDate()).padStart(2, "0"),
        isToday,
        dateKey,
        isSelected: selectedDateKey === dateKey,
      });
    }

    return weekDays;
  },

  getDateKeyForTab(tabKey, selectedDateKey) {
    const baseDate = selectedDateKey
      ? new Date(selectedDateKey)
      : new Date();
    if (tabKey === "weekly") {
      return getWeekKey(baseDate);
    }
    if (tabKey === "monthly") {
      return getMonthKey(baseDate);
    }
    if (tabKey === "yearly") {
      return getYearKey(baseDate);
    }
    if (tabKey === "love") {
      return getTodayKey();
    }
    return selectedDateKey || getTodayKey();
  },

  onCalendarTabChange(e) {
    const next = e.currentTarget.dataset.key;
    if (!next || next === this.data.activeCalendarTab) {
      return;
    }
    const dateKey = this.getDateKeyForTab(next, this.data.selectedDateKey);
    const profile = ZODIAC_PROFILES[this.data.zodiacId] || ZODIAC_PROFILES.aries;
    const fortune = buildFortune(
      profile,
      this.data.zodiacId,
      next,
      dateKey,
      this.data.userProfile
    );
    this.setData({ activeCalendarTab: next, fortune });
  },

  onCalendarDayTap(e) {
    const selectedDateKey = e.currentTarget.dataset.date;
    if (!selectedDateKey || selectedDateKey === this.data.selectedDateKey) {
      return;
    }
    const tabKey = this.data.activeCalendarTab;
    const dateKey = this.getDateKeyForTab(tabKey, selectedDateKey);
    const profile = ZODIAC_PROFILES[this.data.zodiacId] || ZODIAC_PROFILES.aries;
    const fortune = buildFortune(
      profile,
      this.data.zodiacId,
      tabKey,
      dateKey,
      this.data.userProfile
    );
    this.setData({
      selectedDateKey,
      weekDays: this.getWeekDays(selectedDateKey),
      calendarDisplay: this.getCalendarDisplay(selectedDateKey),
      fortune,
    });
  },
});
