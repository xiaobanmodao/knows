const VISUAL_GUIDE_TYPES = Object.freeze(['flow', 'cycle', 'compare', 'hierarchy']);
const VISUAL_GUIDE_TONES = Object.freeze(['green', 'blue', 'amber', 'slate']);

const visualGuidesByKnowledgeId = Object.freeze({
  'bio-k-life-features': {
    type: 'flow',
    title: '生命活动关系',
    summary: '生物的多项生命活动与环境相互联系。',
    items: [
      { label: '环境刺激', note: '生物能对外界刺激作出反应。', tone: 'blue' },
      { label: '生活活动', note: '营养和能量维持生命活动。', tone: 'green' },
      { label: '生长繁殖', note: '生物能够生长、发育和繁殖。', tone: 'amber' },
      { label: '适应环境', note: '生物能与环境相适应。', tone: 'slate' },
    ],
  },
  'bio-k-science-observation': {
    type: 'flow',
    title: '科学观察路径',
    summary: '观察记录、比较和结论都要遵循证据。',
    items: [
      { label: '提出可观察问题', note: '围绕现象提出可记录的问题。', tone: 'blue' },
      { label: '记录条件和事实', note: '记录应区分直接事实与解释。', tone: 'green' },
      { label: '比较与重复', note: '比较时保持无关条件一致。', tone: 'amber' },
      { label: '有范围的结论', note: '结论只说明证据支持的范围。', tone: 'slate' },
    ],
  },
  'bio-k-microscope-observation': {
    type: 'flow',
    title: '显微观察步骤',
    summary: '先低倍定位，再逐步获得清晰物像。',
    items: [
      { label: '低倍定位', note: '低倍镜视野较大，便于找到目标。', tone: 'blue' },
      { label: '目标居中', note: '换高倍镜前先把目标移到中央。', tone: 'green' },
      { label: '换高倍镜', note: '高倍镜视野变暗、范围变小。', tone: 'amber' },
      { label: '清晰调焦', note: '观察时要调焦获得清晰物像。', tone: 'slate' },
    ],
  },
  'bio-k-plant-animal-cells': {
    type: 'compare',
    title: '植物和动物细胞',
    summary: '两类细胞都有基本结构，也存在结构差异。',
    items: [
      { label: '共同结构', note: '都有细胞膜、细胞质和细胞核。', tone: 'blue', lane: 'left' },
      { label: '植物细胞', note: '细胞壁提供支持和保护。', tone: 'green', lane: 'left' },
      { label: '绿色部位', note: '叶绿体与光合作用有关。', tone: 'amber', lane: 'left' },
      { label: '动物细胞', note: '没有细胞壁和叶绿体。', tone: 'slate', lane: 'right' },
      { label: '细胞形态', note: '动物细胞形态常较不规则。', tone: 'blue', lane: 'right' },
    ],
  },
  'bio-k-cell-life': {
    type: 'flow',
    title: '细胞生命活动',
    summary: '物质、能量和遗传信息参与细胞活动。',
    items: [
      { label: '物质交换', note: '细胞膜选择性地让物质进出。', tone: 'blue' },
      { label: '能量转换', note: '线粒体等结构参与能量转换。', tone: 'green' },
      { label: '遗传信息控制', note: '细胞核遗传信息参与控制活动。', tone: 'amber' },
      { label: '生命活动', note: '物质、能量和信息共同维持活动。', tone: 'slate' },
    ],
  },
  'bio-k-structure-levels': {
    type: 'hierarchy',
    title: '生物体结构层次',
    summary: '多细胞生物的各层次分工协作。',
    items: [
      { label: '细胞', note: '形态相似、功能相近的细胞可组成组织。', tone: 'blue', depth: 0 },
      { label: '组织', note: '多种组织按次序组合成器官。', tone: 'green', depth: 1 },
      { label: '器官到系统/生物体', note: '器官完成功能；人体成系统，植物器官构成整体。', tone: 'amber', depth: 2 },
    ],
  },

  'bio-k-classification-basis': {
    type: 'flow',
    title: '生物分类线索',
    summary: '分类要比较稳定特征并综合相关证据。',
    items: [
      { label: '稳定特征', note: '分类使用相对稳定、可比较的特征。', tone: 'blue' },
      { label: '形态营养生殖', note: '这些特征都可提供分类线索。', tone: 'green' },
      { label: '比较差异', note: '比较共同特征和差异特征。', tone: 'amber' },
      { label: '亲缘证据', note: '现代分类还综合亲缘关系证据。', tone: 'slate' },
    ],
  },
  'bio-k-algae-plants': {
    type: 'compare',
    title: '低等植物类群',
    summary: '藻类、苔藓和蕨类的结构与环境不同。',
    items: [
      { label: '藻类', note: '多生活在水中，结构较简单。', tone: 'blue', lane: 'left' },
      { label: '苔藓', note: '一般矮小，常生长在阴湿环境。', tone: 'green', lane: 'left' },
      { label: '蕨类结构', note: '有根、茎、叶的分化。', tone: 'amber', lane: 'right' },
      { label: '蕨类繁殖', note: '蕨类植物不靠种子繁殖。', tone: 'slate', lane: 'right' },
    ],
  },
  'bio-k-animal-groups': {
    type: 'hierarchy',
    title: '常见动物类群',
    summary: '动物可依据脊柱和其他特征识别类群。',
    items: [
      { label: '动物', note: '可依据有无脊柱进行分组。', tone: 'blue', depth: 0 },
      { label: '无脊椎动物', note: '没有由脊椎骨组成的脊柱。', tone: 'green', depth: 1 },
      { label: '脊椎动物', note: '包括鱼、两栖、爬行、鸟和哺乳类。', tone: 'amber', depth: 1 },
      { label: '区分线索', note: '体表、呼吸和生殖有助区分类群。', tone: 'slate', depth: 2 },
    ],
  },
  'bio-k-animal-behavior': {
    type: 'compare',
    title: '动物行为形成',
    summary: '先天行为和学习行为的形成基础不同。',
    items: [
      { label: '先天行为', note: '主要由遗传因素决定。', tone: 'blue', lane: 'left' },
      { label: '可观察表现', note: '运动系统支持多样位移和取食动作。', tone: 'green', lane: 'left' },
      { label: '学习行为', note: '在生活经验基础上形成。', tone: 'amber', lane: 'right' },
      { label: '共同影响', note: '行为受遗传、环境和神经调节影响。', tone: 'slate', lane: 'right' },
    ],
  },
  'bio-k-microorganisms': {
    type: 'compare',
    title: '常见微生物差异',
    summary: '细菌、真菌和病毒的结构与增殖不同。',
    items: [
      { label: '细菌', note: '多为单细胞，常通过分裂增殖。', tone: 'blue', lane: 'left' },
      { label: '真菌', note: '有单细胞和多细胞类型。', tone: 'green', lane: 'left' },
      { label: '病毒结构', note: '病毒没有完整细胞结构。', tone: 'amber', lane: 'right' },
      { label: '病毒增殖', note: '必须在活细胞内才能增殖。', tone: 'slate', lane: 'right' },
    ],
  },
  'bio-k-biological-classification': {
    type: 'hierarchy',
    title: '生物分类等级',
    summary: '由大到小的等级组织生物信息。',
    items: [
      { label: '大分类等级', note: '包含的生物范围较大。', tone: 'blue', depth: 0 },
      { label: '小分类等级', note: '范围缩小，共同特征通常更多。', tone: 'green', depth: 1 },
      { label: '种', note: '种是最基本的分类单位之一。', tone: 'amber', depth: 2 },
    ],
  },

  'bio-k-seed-germination': {
    type: 'flow',
    title: '种子萌发条件',
    summary: '萌发需要有活力的胚和适宜的外部条件。',
    items: [
      { label: '有活力的胚', note: '完整且有活力的胚是内部条件。', tone: 'blue' },
      { label: '水分', note: '吸水膨胀并启动代谢活动。', tone: 'green' },
      { label: '空气和适宜温度', note: '支持呼吸和相关生理过程。', tone: 'amber' },
      { label: '萌发', note: '内部和外部条件适宜时能够萌发。', tone: 'slate' },
    ],
  },
  'bio-k-root-absorption': {
    type: 'flow',
    title: '根的吸收路径',
    summary: '根毛帮助植物吸收水和无机盐。',
    items: [
      { label: '土壤水和无机盐', note: '植物从土壤中获得水和无机盐。', tone: 'blue' },
      { label: '根毛', note: '根毛增大与土壤接触的面积。', tone: 'green' },
      { label: '根的吸收', note: '水和无机盐通过根被吸收。', tone: 'amber' },
      { label: '植物各部分', note: '吸收后供给植物各部分。', tone: 'slate' },
    ],
  },
  'bio-k-stem-transport': {
    type: 'compare',
    title: '茎的两类运输',
    summary: '导管和筛管运输的物质与方向不同。',
    items: [
      { label: '导管', note: '运输根吸收的水和无机盐。', tone: 'blue', lane: 'left' },
      { label: '导管方向', note: '运输方向通常由下向上。', tone: 'green', lane: 'left' },
      { label: '筛管', note: '运输叶制造的有机物。', tone: 'amber', lane: 'right' },
      { label: '供应部位', note: '有机物可供应非绿色部位。', tone: 'slate', lane: 'right' },
    ],
  },
  'bio-k-leaf-structure': {
    type: 'hierarchy',
    title: '叶的结构与功能',
    summary: '叶片不同结构分别支持光合、交换和运输。',
    items: [
      { label: '叶片', note: '由表皮、叶肉和叶脉等结构组成。', tone: 'blue', depth: 0 },
      { label: '表皮与气孔', note: '表皮透明；气孔是气体进出的门户。', tone: 'green', depth: 1 },
      { label: '叶肉', note: '常有较多叶绿体，是光合重要部位。', tone: 'amber', depth: 1 },
      { label: '叶脉', note: '承担运输和支持作用。', tone: 'slate', depth: 1 },
      { label: '各自功能', note: '分别支持进光、光合、气体交换和运输。', tone: 'blue', depth: 2 },
    ],
  },
  'bio-k-photosynthesis': {
    type: 'flow',
    title: '光合作用关系',
    summary: '光合作用制造有机物，并提供氧气来源。',
    items: [
      { label: '作用条件', note: '需要光、叶绿体、二氧化碳和水。', tone: 'blue' },
      { label: '光能转化', note: '光能转化的能量储存在有机物中。', tone: 'green' },
      { label: '有机物', note: '光合作用为生物圈提供有机物来源。', tone: 'amber' },
      { label: '氧气', note: '光合作用为生物圈提供氧气来源。', tone: 'slate' },
    ],
  },
  'bio-k-respiration-growth': {
    type: 'cycle',
    title: '呼吸与植物生长',
    summary: '光合作用和呼吸作用共同参与物质能量变化。',
    items: [
      { label: '光合作用制造有机物', note: '光合作用制造有机物。', tone: 'green' },
      { label: '呼吸作用分解释放能量', note: '利用氧气分解有机物并释放能量。', tone: 'amber' },
      { label: '细胞活动与生长', note: '根、茎、叶和花等活细胞需要能量。', tone: 'blue' },
      { label: '物质和能量变化', note: '两过程持续参与物质和能量变化。', tone: 'slate' },
    ],
  },

  'bio-k-reproduction-development': {
    type: 'flow',
    title: '人的生殖和发育',
    summary: '受精、胚胎发育、出生和成长构成连续阶段。',
    items: [
      { label: '生殖细胞结合', note: '新生命的开始与精子和卵细胞结合有关。', tone: 'blue' },
      { label: '胚胎发育', note: '胚胎在母体内发育，孕期健康需要专业医疗支持。', tone: 'green' },
      { label: '出生和成长', note: '人的发育经历出生和成长等阶段。', tone: 'amber' },
      { label: '青春期变化', note: '尊重隐私并寻求可信成人和专业人士帮助很重要。', tone: 'slate' },
    ],
  },
  'bio-k-digestion': {
    type: 'flow',
    title: '食物消化和吸收',
    summary: '食物被分解为可吸收的小分子并进入体内。',
    items: [
      { label: '口腔、胃和小肠', note: '这些器官以不同方式参与食物消化。', tone: 'blue' },
      { label: '食物分解', note: '消化系统将食物分解为可吸收的小分子。', tone: 'green' },
      { label: '小肠吸收', note: '小肠长且内表面积大，是营养物质吸收的重要部位。', tone: 'amber' },
      { label: '消化健康', note: '均衡饮食、规律进食和食品卫生有助于消化健康。', tone: 'slate' },
    ],
  },
  'bio-k-breathing': {
    type: 'flow',
    title: '呼吸与气体交换',
    summary: '空气进出和肺部气体交换为细胞提供氧气。',
    items: [
      { label: '空气进入呼吸道', note: '鼻、咽、喉、气管和支气管形成气体通道。', tone: 'blue' },
      { label: '肺泡气体交换', note: '肺泡壁薄且周围毛细血管丰富，适于气体交换。', tone: 'green' },
      { label: '氧气供应细胞', note: '呼吸系统为细胞生命活动提供氧气并排出二氧化碳。', tone: 'amber' },
      { label: '呼吸健康', note: '远离烟草烟雾和保持空气清洁有助于呼吸健康。', tone: 'slate' },
    ],
  },
  'bio-k-circulation': {
    type: 'cycle',
    title: '血液循环关系',
    summary: '心脏、血管和血液持续联系身体各部分。',
    items: [
      { label: '心脏推动血液', note: '心脏有节律地收缩舒张，推动血液在血管中循环。', tone: 'blue' },
      { label: '血管运输', note: '动脉、静脉和毛细血管在结构和功能上不同。', tone: 'green' },
      { label: '血液运输物质', note: '血液运输氧气、营养物质和部分废物。', tone: 'amber' },
      { label: '维持身体联系', note: '心脏、血管和血液共同维持身体各部分联系。', tone: 'slate' },
    ],
  },
  'bio-k-urinary': {
    type: 'flow',
    title: '尿液形成和排出',
    summary: '肾脏形成尿液并排出部分废物和多余水分。',
    items: [
      { label: '血液流经肾脏', note: '肾脏能过滤血液并重吸收部分有用物质。', tone: 'blue' },
      { label: '形成尿液', note: '肾脏是形成尿液的重要器官。', tone: 'green' },
      { label: '排出尿液', note: '排尿排出部分代谢废物和多余水分。', tone: 'amber' },
      { label: '维持相对稳定', note: '泌尿系统帮助维持体内水和无机盐等相对稳定。', tone: 'slate' },
    ],
  },
  'bio-k-nervous-immunity': {
    type: 'compare',
    title: '神经调节和免疫',
    summary: '快速调节和防御识别共同维护健康。',
    items: [
      { label: '神经系统', note: '脑、脊髓和周围神经能接收信息并协调反应。', tone: 'blue', lane: 'left' },
      { label: '反射', note: '反射是人体对刺激作出的有规律反应。', tone: 'green', lane: 'left' },
      { label: '免疫防御', note: '免疫系统识别和防御部分病原体。', tone: 'amber', lane: 'right' },
      { label: '专业健康建议', note: '接种疫苗等措施需遵循专业公共卫生建议。', tone: 'slate', lane: 'right' },
    ],
  },

  'bio-k-environment-factors': {
    type: 'flow',
    title: '环境影响的观察',
    summary: '环境因素影响生物的分布、生长和行为。',
    items: [
      { label: '环境因素', note: '光、温度、水和空气等属于常见非生物因素。', tone: 'blue' },
      { label: '生物表现', note: '同种生物在不同环境中可能表现出不同生长状态。', tone: 'green' },
      { label: '比较条件', note: '研究环境影响时要区分相关现象和能够支持因果的证据。', tone: 'amber' },
      { label: '有限解释', note: '环境因素会影响生物的分布、生长和行为。', tone: 'slate' },
    ],
  },
  'bio-k-species-relations': {
    type: 'compare',
    title: '生物之间的关系',
    summary: '同种和不同种生物之间可形成多种关系。',
    items: [
      { label: '同种生物', note: '可能因食物、空间等资源发生竞争，也可能合作。', tone: 'blue', lane: 'left' },
      { label: '资源利用', note: '食物和空间等资源会影响同种生物的关系。', tone: 'green', lane: 'left' },
      { label: '不同种生物', note: '存在捕食、竞争、共生和寄生等多种关系。', tone: 'amber', lane: 'right' },
      { label: '依据证据判断', note: '生态关系不能只凭是否接触判断。', tone: 'slate', lane: 'right' },
    ],
  },
  'bio-k-ecosystem-structure': {
    type: 'hierarchy',
    title: '生态系统的组成',
    summary: '生态系统由生物成分和非生物成分共同构成。',
    items: [
      { label: '生态系统', note: '由生物成分和非生物成分共同构成。', tone: 'blue', depth: 0 },
      { label: '非生物成分', note: '生态系统中也包括非生物成分。', tone: 'green', depth: 1 },
      { label: '生物成分', note: '生物成分包括生产者、消费者和分解者。', tone: 'amber', depth: 1 },
      { label: '生产者、消费者和分解者', note: '生产者制造有机物，消费者取食，分解者分解有机物。', tone: 'slate', depth: 2 },
    ],
  },
  'bio-k-ecosystem-function': {
    type: 'cycle',
    title: '生态系统的功能',
    summary: '能量沿食物链流动，物质在生物与环境之间循环。',
    items: [
      { label: '生产者开始食物链', note: '食物链通常从生产者开始。', tone: 'blue' },
      { label: '物质和能量流动', note: '箭头表示物质和能量流动方向。', tone: 'green' },
      { label: '消费和分解', note: '物质可通过生产、消费和分解在生物与环境间循环。', tone: 'amber' },
      { label: '物质回到环境', note: '物质在生物与环境之间循环。', tone: 'slate' },
      { label: '能量逐级减少', note: '能量不能在生态系统中循环使用。', tone: 'blue' },
    ],
  },
  'bio-k-biosphere': {
    type: 'hierarchy',
    title: '生物圈的范围',
    summary: '生物圈是所有生物及其生活环境的整体。',
    items: [
      { label: '生物圈', note: '是地球上所有生物及其生活环境的整体。', tone: 'blue', depth: 0 },
      { label: '适宜生存的范围', note: '包括适合生物生存的范围。', tone: 'green', depth: 1 },
      { label: '大气圈下层、水圈和岩石圈表层', note: '这些范围构成生物圈的相关部分。', tone: 'amber', depth: 2 },
      { label: '环境彼此关联', note: '不同环境通过水、空气和物质循环彼此关联。', tone: 'slate', depth: 2 },
    ],
  },
  'bio-k-ecological-security': {
    type: 'flow',
    title: '生态安全维护',
    summary: '预防污染、保护栖息地和合理利用资源有助于生态安全。',
    items: [
      { label: '识别生态压力', note: '污染、栖息地破碎化和过度利用会影响生态安全。', tone: 'blue' },
      { label: '科学评估', note: '保护措施应基于监测、法律和科学评估。', tone: 'green' },
      { label: '保护栖息地', note: '生态安全需要预防污染、保护栖息地和合理利用资源。', tone: 'amber' },
      { label: '个人参与', note: '可通过节约资源、分类投放废弃物和尊重野生生物参与保护。', tone: 'slate' },
    ],
  },

  'bio-k-biological-reproduction': {
    type: 'compare',
    title: '有性和无性生殖',
    summary: '两种生殖方式的亲本和后代特点不同。',
    items: [
      { label: '有性生殖', note: '通常涉及两性生殖细胞结合。', tone: 'blue', lane: 'left' },
      { label: '后代多样性', note: '后代遗传组成具有多样性。', tone: 'green', lane: 'left' },
      { label: '无性生殖', note: '由一个亲本产生后代。', tone: 'amber', lane: 'right' },
      { label: '后代相似性', note: '后代与亲本通常较相似。', tone: 'slate', lane: 'right' },
    ],
  },
  'bio-k-heredity-basics': {
    type: 'hierarchy',
    title: '遗传信息的基础',
    summary: '细胞核中的染色体、DNA和基因与性状形成有关。',
    items: [
      { label: '细胞核', note: '遗传信息主要位于细胞核的染色体上。', tone: 'blue', depth: 0 },
      { label: '染色体', note: '由DNA和蛋白质等物质组成。', tone: 'green', depth: 1 },
      { label: 'DNA', note: 'DNA上有许多具有遗传效应的片段。', tone: 'amber', depth: 2 },
      { label: '基因与性状', note: '通常称为基因，且性状受遗传和环境共同影响。', tone: 'slate', depth: 2 },
    ],
  },
  'bio-k-variation': {
    type: 'compare',
    title: '变异的不同来源',
    summary: '个体差异有的可遗传，有的主要由环境引起。',
    items: [
      { label: '遗传物质改变', note: '引起的变异可能遗传给后代。', tone: 'blue', lane: 'left' },
      { label: '可遗传变异', note: '为生物适应环境变化提供了差异基础。', tone: 'green', lane: 'left' },
      { label: '环境因素', note: '营养、光照和锻炼等可造成差异。', tone: 'amber', lane: 'right' },
      { label: '不一定遗传', note: '环境因素造成的差异不一定遗传。', tone: 'slate', lane: 'right' },
    ],
  },
  'bio-k-origin-life': {
    type: 'flow',
    title: '生命起源的科学探索',
    summary: '科学解释依靠证据、模型和结论边界持续发展。',
    items: [
      { label: '探索生命起源条件', note: '科学家通过化学、地质和天文等证据探索相关条件。', tone: 'blue' },
      { label: '科学假说', note: '科学假说需要接受证据检验和同行讨论。', tone: 'green' },
      { label: '可讨论的解释', note: '解释需要尊重证据、模型和结论边界。', tone: 'amber' },
      { label: '保留未解问题', note: '不能把推测当作已被完全证实的事实。', tone: 'slate' },
    ],
  },
  'bio-k-evolution-evidence': {
    type: 'flow',
    title: '生物进化的证据',
    summary: '多种独立证据为进化提供相互印证的线索。',
    items: [
      { label: '化石等线索', note: '化石、比较解剖、胚胎发育和遗传信息等提供线索。', tone: 'blue' },
      { label: '化石记录', note: '化石记录了古代生物的遗体、遗物或生活痕迹。', tone: 'green' },
      { label: '地层中的变化', note: '不同地层中的化石可显示生物类群随时间的变化线索。', tone: 'amber' },
      { label: '相互支持的解释', note: '多种独立证据相互支持时，进化解释更有说服力。', tone: 'slate' },
    ],
  },
  'bio-k-biodiversity-conservation': {
    type: 'flow',
    title: '生物多样性保护',
    summary: '保护多样性需要维护栖息地并依法合理利用资源。',
    items: [
      { label: '生物多样性', note: '遗传、物种和生态系统多样性共同构成生物多样性。', tone: 'blue' },
      { label: '识别威胁', note: '栖息地丧失、污染和非法利用会威胁多样性。', tone: 'green' },
      { label: '保护措施', note: '就地保护、迁地保护和公众参与可在不同情境下发挥作用。', tone: 'amber' },
      { label: '合理利用资源', note: '保护需要维护栖息地并依法合理利用资源。', tone: 'slate' },
    ],
  },
});

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : null;
}

function getVisualGuideForKnowledge(knowledgeId) {
  return clone(visualGuidesByKnowledgeId[knowledgeId]);
}

module.exports = {
  getVisualGuideForKnowledge,
  visualGuidesByKnowledgeId,
  VISUAL_GUIDE_TYPES,
  VISUAL_GUIDE_TONES,
};
