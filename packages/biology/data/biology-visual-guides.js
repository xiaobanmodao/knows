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
