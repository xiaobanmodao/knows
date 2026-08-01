const { buildTemplate } = require('./chemistry-builders');

function orderedSteps(actions) {
  return actions.map((action, index) => ({ order: index + 1, action }));
}

function defineTemplate(definition) {
  return buildTemplate({
    ...definition,
    name: definition.title,
    figure: `/assets/figures/generated/chemistry/templates/${definition.id}.png`,
  });
}

const templates = [
  defineTemplate({
    id: 'chem-tpl-observation',
    title: '实验现象观察与规范描述',
    topicIds: [
      'chem-topic-lab',
      'chem-topic-air-oxygen',
      'chem-topic-carbon-fuels',
      'chem-topic-metals',
      'chem-topic-acids-bases',
      'chem-topic-salts-fertilizers',
      'chem-topic-materials-environment',
    ],
    category: '实验观察',
    summary: '把实验事实与解释分开记录，按反应前、反应中、反应后的顺序描述可观察证据。',
    keywords: ['实验现象', '证据记录', '规范描述', '结论边界'],
    cues: ['需要区分实验现象与由现象得到的结论', '需要比较两组实验或反应前后状态'],
    steps: orderedSteps([
      '先记录反应前物质的颜色、状态和装置条件。',
      '按时间顺序观察发光、放热、气泡、沉淀或颜色改变等可见事实。',
      '使用“产生”“变为”“逐渐”等客观词语，不把物质名称猜测写进现象。',
      '再把现象与对照、检验或方程式联系起来形成有证据的解释。',
    ]),
    pitfalls: ['把“生成二氧化碳”直接当作现象', '只写“发生反应”，没有颜色、状态或气泡等具体证据'],
    examples: [{
      scenario: '将带火星的木条伸入一瓶待检气体，木条复燃，如何规范记录并解释？',
      steps: [
        '现象写为“带火星的木条复燃”，这是直接观察到的事实。',
        '依据氧气能支持燃烧且该检验具有指向性，解释为瓶内气体是氧气。',
      ],
      conclusion: '先写“木条复燃”，再写“说明该气体是氧气”，现象与结论不能互相替代。',
    }],
  }),
  defineTemplate({
    id: 'chem-tpl-instrument-reading',
    title: '仪器选择、量取与读数',
    topicIds: ['chem-topic-lab', 'chem-topic-water-solution'],
    category: '基本操作',
    summary: '依据用途和精度选择仪器，检查量程与分度值，在正确视线位置读取并记录合理位数。',
    keywords: ['仪器选择', '量筒', '分度值', '读数'],
    cues: ['需要量取液体体积或读取温度', '需要判断仰视、俯视造成的读数偏差'],
    steps: orderedSteps([
      '根据测量对象、范围和所需精度确定仪器。',
      '观察量程、分度值和单位，确认仪器完好并放置稳定。',
      '读数时让视线与液面最低处或刻度指示位置保持水平。',
      '按分度能力记录数值和单位，并结合操作方向分析误差。',
    ]),
    pitfalls: ['量筒平放或手持读数', '只报数字不写单位，或记录超过仪器分度能力的位数'],
    examples: [{
      scenario: '用量筒量取 18 mL 水，液面接近刻度时怎样完成操作？',
      steps: [
        '先沿量筒内壁倾倒至接近 18 mL，再用胶头滴管逐滴补加。',
        '把量筒放在水平桌面，视线与凹液面最低处相平，读到 18 mL。',
      ],
      conclusion: '仪器稳定、视线水平并在接近刻度时改用滴管，能减少量取误差。',
    }],
  }),
  defineTemplate({
    id: 'chem-tpl-gas-apparatus',
    title: '气体发生装置选择',
    topicIds: ['chem-topic-air-oxygen', 'chem-topic-carbon-fuels'],
    category: '气体实验',
    summary: '根据反应物状态、反应条件和速率控制需要选择发生装置，并先检查装置气密性。',
    keywords: ['气体制取', '发生装置', '反应条件', '气密性'],
    cues: ['已知反应物是固体或液体且要制取气体', '需要比较加热型与常温型发生装置'],
    steps: orderedSteps([
      '确认反应物状态以及反应是否需要加热。',
      '判断是否需要随时添加液体或控制反应速率。',
      '选择能密闭导气且便于固定的发生容器和连接方式。',
      '在装药品前检查气密性，并在教师指导下按顺序装配。',
    ]),
    pitfalls: ['装入药品后才检查气密性', '忽略是否加热，仅凭气体名称选择装置'],
    examples: [{
      scenario: '用二氧化锰催化过氧化氢溶液制氧气，应选哪类发生装置？',
      steps: [
        '反应物包含液体，反应在常温下进行，因此不选需要酒精灯的固体加热装置。',
        '若要控制产生气体的快慢，可选能分次加入液体并密闭导气的常温装置。',
      ],
      conclusion: '依据“固液常温、需要控速”选择常温发生装置，选择理由来自反应条件。',
    }],
  }),
  defineTemplate({
    id: 'chem-tpl-gas-collection-test',
    title: '气体收集、检验与验满',
    topicIds: ['chem-topic-air-oxygen', 'chem-topic-carbon-fuels'],
    category: '气体实验',
    summary: '依据气体的密度、溶解性和是否与水反应选择收集法，用特征反应区分检验与验满。',
    keywords: ['气体收集', '气体检验', '气体验满', '排水法'],
    cues: ['需要从排水法和排空气法中选择', '同一知识情境同时涉及“检验气体种类”和“确认气体已集满”'],
    steps: orderedSteps([
      '先判断气体在水中的溶解性以及是否与水明显反应。',
      '不能排水时，再比较气体与空气的密度选择排空气方向。',
      '检验时取少量气体利用特征现象确认气体种类。',
      '验满时在集气瓶口操作，不能把检验步骤简单照搬到瓶内。',
    ]),
    pitfalls: ['把检验和验满写成同一位置的操作', '用点燃未知气体或直接闻气味作为检验方法'],
    examples: [{
      scenario: '实验室收集氧气后，怎样分别检验氧气和判断一瓶氧气已满？',
      steps: [
        '检验时把带火星木条伸入瓶内，木条复燃说明气体是氧气。',
        '验满时把带火星木条放在瓶口，木条复燃说明氧气已到达瓶口。',
      ],
      conclusion: '同一特征反应因操作位置不同分别承担检验和验满，未知气体不得用点燃法冒险识别。',
    }],
  }),
  defineTemplate({
    id: 'chem-tpl-valence-formula',
    title: '根据化合价书写化学式',
    topicIds: ['chem-topic-particles-elements', 'chem-topic-language-conservation'],
    category: '化学用语',
    summary: '先确定元素或常见原子团的化合价，再用化合物中正负化合价代数和为零确定最简原子个数比。',
    keywords: ['化合价', '化学式', '最简比', '正负化合价'],
    cues: ['已知元素化合价要求写化学式', '需要检查化学式中各元素原子个数是否合理'],
    steps: orderedSteps([
      '按“正价元素在前、负价元素在后”的常见顺序写出符号。',
      '在符号上方明确常见化合价，计算使代数和为零的原子个数比。',
      '把原子个数比约成最简整数比并写成右下角数字，数字 1 省略。',
      '重新计算各元素化合价乘以原子个数的总和，确认等于零。',
    ]),
    pitfalls: ['把化合价数字写在元素符号右上角后直接当作化学式下标', '没有约成最简整数比或漏写原子团括号'],
    examples: [{
      scenario: '已知铝通常显 +3 价、氧通常显 -2 价，写出氧化铝的化学式。',
      steps: [
        '先写 Al 和 O；要使正负化合价代数和为零，最小公倍数为 6。',
        '取 2 个 Al 和 3 个 O，核对 2×(+3)+3×(-2)=0。',
      ],
      conclusion: '氧化铝写作 Al2O3，下标表示组成中的最简原子个数比。',
    }],
  }),
  defineTemplate({
    id: 'chem-tpl-equation-balancing',
    title: '化学方程式书写与配平',
    topicIds: [
      'chem-topic-air-oxygen',
      'chem-topic-language-conservation',
      'chem-topic-carbon-fuels',
      'chem-topic-metals',
      'chem-topic-acids-bases',
      'chem-topic-salts-fertilizers',
    ],
    category: '化学用语',
    summary: '以真实反应和元素守恒为依据，用化学计量数配平化学式，并补全条件与必要的气体或沉淀符号。',
    keywords: ['化学方程式', '配平', '反应条件', '质量守恒'],
    cues: ['需要把文字表达式改写为化学方程式', '方程式左右两侧原子数不相等'],
    steps: orderedSteps([
      '依据反应事实写出正确的反应物、生成物化学式和反应箭头。',
      '选择较复杂或出现次数较少的元素，调整化学式前的计量数。',
      '逐种核对左右两侧原子数，并把计量数化为最简整数比。',
      '根据反应实际标注加热、点燃或催化剂等条件和必要的状态符号。',
    ]),
    pitfalls: ['为配平而改动化学式右下角数字', '只看原子数，不核对反应事实、条件和生成物状态'],
    examples: [{
      scenario: '配平镁在氧气中燃烧生成氧化镁的方程式。',
      steps: [
        '先写 Mg + O2 -> MgO，氧原子数左右不等。',
        '在 MgO 前写 2，再在 Mg 前写 2，核对镁、氧原子数均相等，并标注点燃。',
      ],
      conclusion: '方程式为 2Mg + O2 -> 2MgO，条件为点燃，计量数 2:1:2 已是最简比。',
    }],
  }),
  defineTemplate({
    id: 'chem-tpl-mass-conservation',
    title: '质量守恒的微观解释',
    topicIds: ['chem-topic-language-conservation'],
    category: '守恒推理',
    summary: '把宏观质量关系转化为反应前后原子种类、数目和质量均不改变的微观重组过程。',
    keywords: ['质量守恒', '原子重组', '密闭体系', '证据解释'],
    cues: ['反应前后称量结果看似增大或减小', '需要补全未知物质或解释配平依据'],
    steps: orderedSteps([
      '明确研究边界，判断称量是否包含逸出气体或进入体系的空气。',
      '列出反应前后各物质及其所含元素，确认原子种类不变。',
      '用粒子图或方程式核对每种原子的数目。',
      '把原子重组与封闭体系总质量不变联系起来解释观察结果。',
    ]),
    pitfalls: ['把敞口实验读数变化误判为质量守恒失效', '说成分子数或物质种类在反应前后一定不变'],
    examples: [{
      scenario: '敞口加热铜粉后固体质量增加，这是否违背质量守恒？',
      steps: [
        '研究边界若只称铜粉和生成固体，空气中的氧没有计入反应前读数。',
        '铜与进入体系的氧结合生成氧化铜；把参加反应的氧也计入，反应前后总质量相等。',
      ],
      conclusion: '读数增加来自体系边界外氧气的进入，不违背化学反应中的质量守恒。',
    }],
  }),
  defineTemplate({
    id: 'chem-tpl-stoichiometry',
    title: '化学方程式计算',
    topicIds: ['chem-topic-language-conservation'],
    category: '简单计算',
    summary: '根据已配平方程式给出的质量关系，用初中范围内的单步比例求一种纯物质的质量。',
    keywords: ['化学方程式计算', '相对质量', '质量比例', '规范格式'],
    cues: ['已知一种反应物或生成物的质量求另一种质量', '需要从化学计量数建立质量比'],
    steps: orderedSteps([
      '写出并检查所研究反应对应的已配平化学方程式。',
      '在相关物质下方写出化学计量数与相对分子质量乘积。',
      '在质量关系下方对应写已知量和未知量，列出单一比例。',
      '求解、写单位，并用质量比检查数量级是否合理。',
    ]),
    pitfalls: ['使用未配平的方程式建立比例', '把化学计量数之比直接当成质量比，忽略相对质量'],
    examples: [{
      scenario: '充分分解 34 g 过氧化氢，按 2H2O2 -> 2H2O + O2 计算生成氧气质量。',
      steps: [
        '方程式中 2H2O2 与 O2 的质量关系为 2×34:32，即 68:32。',
        '列比例 68:32 = 34:x，得到 x=16 g。',
      ],
      conclusion: '在反应完全且过氧化氢按纯物质质量计的条件下，可生成 16 g 氧气。',
    }],
  }),
  defineTemplate({
    id: 'chem-tpl-solubility-curve',
    title: '溶解度曲线读取',
    topicIds: ['chem-topic-water-solution'],
    category: '图表读取',
    summary: '先固定温度和溶剂质量，再从曲线读取溶解度，判断饱和状态及温度变化时的结晶趋势。',
    keywords: ['溶解度曲线', '温度', '饱和溶液', '结晶'],
    cues: ['图中给出物质溶解度随温度的变化', '需要比较同温度下溶解能力或降温析出趋势'],
    steps: orderedSteps([
      '确认横轴温度、纵轴溶解度及单位。',
      '从指定温度作辅助线到曲线，再读取每 100 g 溶剂可溶解的最大质量。',
      '把实际溶质和溶剂质量换算到同一基准，判断未饱和、恰好饱和或有固体剩余。',
      '比较温度变化前后的溶解度，判断是否可能析晶并说明条件。',
    ]),
    pitfalls: ['把溶解度误当成 100 g 溶液中溶质质量', '比较曲线高低时忽略温度必须相同'],
    examples: [{
      scenario: '某物质 20 ℃时溶解度为 30 g，向 100 g 水中加入 40 g 该物质并充分搅拌。',
      steps: [
        '20 ℃时 100 g 水最多溶解 30 g 溶质。',
        '加入 40 g 后有 30 g 溶解，10 g 保持固体，所得溶液达到饱和。',
      ],
      conclusion: '温度和溶剂质量固定后，溶解度给出最大溶解量；不能把未溶固体计入溶液质量。',
    }],
  }),
  defineTemplate({
    id: 'chem-tpl-mass-fraction',
    title: '溶质质量分数计算',
    topicIds: ['chem-topic-water-solution'],
    category: '简单计算',
    summary: '以溶液总质量为分母，用溶质质量除以溶液质量并化为百分数，计算前先辨清各质量关系。',
    keywords: ['溶质质量分数', '溶质质量', '溶液质量', '百分数'],
    cues: ['给出溶质和溶剂质量求溶液浓度', '溶解、蒸发或加水后需要比较质量分数'],
    steps: orderedSteps([
      '辨认已溶解的溶质质量，不把未溶固体计入。',
      '用溶质质量加溶剂质量得到溶液质量，或直接读取情境中已知的溶液质量。',
      '代入“溶质质量分数=溶质质量/溶液质量×100%”。',
      '检查结果应为百分数，并说明无溶质损失等适用条件。',
    ]),
    pitfalls: ['把溶剂质量放在分母', '把加入但未溶解的固体全部当作溶质质量'],
    examples: [{
      scenario: '把 10 g 氯化钠完全溶解在 90 g 水中，求所得溶液的溶质质量分数。',
      steps: [
        '溶液质量为 10 g + 90 g = 100 g。',
        '溶质质量分数为 10 g / 100 g × 100% = 10%。',
      ],
      conclusion: '氯化钠完全溶解且没有损失时，所得溶液的溶质质量分数为 10%。',
    }],
  }),
  defineTemplate({
    id: 'chem-tpl-solution-preparation',
    title: '一定质量分数溶液配制',
    topicIds: ['chem-topic-water-solution'],
    category: '实验操作',
    summary: '按计算、称量、量取、溶解和标识的顺序配制一定溶质质量分数的溶液，并分析操作误差。',
    keywords: ['溶液配制', '称量', '量取', '溶解'],
    cues: ['要求用固体溶质和水配制指定质量分数溶液', '需要分析洒失、仰视或器壁残留导致的偏差'],
    steps: orderedSteps([
      '根据目标溶液质量和质量分数计算所需溶质与水的质量。',
      '用天平称量固体溶质，用量筒量取所需水量。',
      '把溶质和水转移到烧杯中，用玻璃棒搅拌至完全溶解。',
      '将溶液转入洁净容器并标明名称和质量分数，按规范处理器材。',
    ]),
    pitfalls: ['直接在量筒中溶解固体', '称量后有溶质洒失却仍按原计算值标注浓度'],
    examples: [{
      scenario: '配制 50 g、6%的氯化钠溶液，需要多少氯化钠和水？',
      steps: [
        '氯化钠质量为 50 g×6%=3 g。',
        '水的质量为 50 g-3 g=47 g；按计算结果称量、量取并在烧杯中溶解。',
      ],
      conclusion: '需 3 g 氯化钠和 47 g 水；实际操作必须在教师指导下完成并准确标识。',
    }],
  }),
  defineTemplate({
    id: 'chem-tpl-experiment-design',
    title: '控制变量与实验方案评价',
    topicIds: [
      'chem-topic-lab',
      'chem-topic-air-oxygen',
      'chem-topic-water-solution',
      'chem-topic-metals',
      'chem-topic-acids-bases',
      'chem-topic-salts-fertilizers',
      'chem-topic-materials-environment',
    ],
    category: '科学探究',
    summary: '围绕一个可检验问题改变单一因素，设置可比较证据，并从安全、公平和可重复性评价方案。',
    keywords: ['控制变量', '对照实验', '实验方案', '证据评价'],
    cues: ['问题中出现“探究某因素是否影响”', '需要判断两组实验能否公平比较或如何改进'],
    steps: orderedSteps([
      '把研究问题改写为可观察、可比较的变量关系。',
      '确定自变量、因变量和需要保持相同的控制变量。',
      '设计对照与记录方式，预先识别风险并服从教师的实验安排。',
      '依据证据作有限结论，分析异常、误差和可行的重复或改进。',
    ]),
    pitfalls: ['一次改变多个条件却把结果归因于其中一个', '没有观察指标，或结论超出实际证据支持的范围'],
    examples: [{
      scenario: '探究温度是否影响白糖在水中的溶解快慢，怎样设计公平比较？',
      steps: [
        '设置等体积冷水和温水，仅改变水温；白糖质量、颗粒大小、容器和搅拌方式保持相同。',
        '同时加入白糖并用同样方式搅拌，记录固体恰好看不见所需时间，多次比较。',
      ],
      conclusion: '只有温度不同且记录方法一致时，时间差异才可作为温度影响溶解快慢的证据。',
    }],
  }),
];

module.exports = { templates };
