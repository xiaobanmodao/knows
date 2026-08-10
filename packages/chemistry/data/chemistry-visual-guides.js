const VISUAL_GUIDE_TYPES = Object.freeze(['flow', 'cycle', 'compare', 'hierarchy']);
const VISUAL_GUIDE_TONES = Object.freeze(['green', 'blue', 'amber', 'slate']);

const visualGuidesByKnowledgeId = Object.freeze({
  'chem-k-lab-object-change': {
    type: 'flow', title: '化学变化的观察', summary: '观察现象，依据证据提出有范围的解释。',
    items: [
      { label: '研究物质', note: '关注组成、性质和变化', tone: 'blue' },
      { label: '记录现象', note: '区分颜色、气体、沉淀等现象', tone: 'green' },
      { label: '提出解释', note: '解释要由证据支持', tone: 'amber' },
      { label: '复核条件', note: '结论说明适用范围', tone: 'slate' },
    ],
  },
  'chem-k-lab-instruments': {
    type: 'hierarchy', title: '常用仪器用途', summary: '按实验任务选择仪器并规范操作。',
    items: [
      { label: '常用仪器', note: '按实验任务选择', tone: 'blue', depth: 0 },
      { label: '加热仪器', note: '酒精灯等用于规范加热', tone: 'green', depth: 1 },
      { label: '量取仪器', note: '量筒读数时视线与液面相平', tone: 'amber', depth: 1 },
      { label: '夹持与观察', note: '按器材用途规范操作', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-lab-operations': {
    type: 'flow', title: '基本实验操作', summary: '按规范完成实验前、中、后的操作。',
    items: [
      { label: '识别药品标签', note: '先确认名称和危险提示', tone: 'blue' },
      { label: '连接装置', note: '按实验要求连接并检查', tone: 'green' },
      { label: '检查气密性', note: '加热或制气前确认装置密闭', tone: 'amber' },
      { label: '整理记录', note: '按教师要求处理器材和废弃物', tone: 'slate' },
    ],
  },
  'chem-k-lab-inquiry': {
    type: 'flow', title: '探究证据链', summary: '问题、假设、方案和结论都要接受证据检验。',
    items: [
      { label: '提出问题', note: '问题应能通过观察或实验回答', tone: 'blue' },
      { label: '作出假设', note: '假设要能被证据检验', tone: 'green' },
      { label: '设计方案', note: '控制条件并记录操作', tone: 'amber' },
      { label: '得出结论', note: '结论不超出记录范围', tone: 'slate' },
    ],
  },
  'chem-k-air-composition': {
    type: 'hierarchy', title: '空气组成线索', summary: '空气是由多种气体组成的混合物。',
    items: [
      { label: '空气', note: '多种气体组成的混合物', tone: 'blue', depth: 0 },
      { label: '主要成分', note: '氮气和氧气所占体积分数较大', tone: 'green', depth: 1 },
      { label: '少量成分', note: '稀有气体、二氧化碳和水蒸气等', tone: 'amber', depth: 1 },
      { label: '空气质量', note: '污染物会影响健康和环境', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-oxygen-properties': {
    type: 'hierarchy', title: '氧气性质与用途', summary: '由氧气性质认识用途和安全条件。',
    items: [
      { label: '氧气', note: '由性质认识用途和安全', tone: 'blue', depth: 0 },
      { label: '物理性质', note: '通常为无色无味气体', tone: 'green', depth: 1 },
      { label: '化学性质', note: '能支持燃烧但通常不燃烧', tone: 'amber', depth: 1 },
      { label: '用途和安全', note: '供给呼吸和助燃需符合条件', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-oxygen-preparation': {
    type: 'flow', title: '氧气制取与检验', summary: '依据反应条件规范制取、收集和检验氧气。',
    items: [
      { label: '选择反应和装置', note: '依据反应物状态和条件选择', tone: 'blue' },
      { label: '检查气密性', note: '装置连接后先确认密闭性', tone: 'green' },
      { label: '收集气体', note: '按氧气性质选择合适方法', tone: 'amber' },
      { label: '检验记录', note: '用规范操作确认现象', tone: 'slate' },
    ],
  },
  'chem-k-combustion-catalyst': {
    type: 'hierarchy', title: '氧化与催化条件', summary: '反应条件会影响氧化现象和反应速率。',
    items: [
      { label: '氧化与速率', note: '认识反应条件和速率变化', tone: 'blue', depth: 0 },
      { label: '燃烧', note: '可燃物与氧气接触并达到着火点', tone: 'green', depth: 1 },
      { label: '缓慢氧化', note: '进行缓慢但仍有能量变化', tone: 'amber', depth: 1 },
      { label: '催化剂', note: '改变反应速率而反应前后质量和化学性质不变', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-water-composition': {
    type: 'flow', title: '水组成的证据', summary: '通过电解现象和检验认识水的组成。',
    items: [
      { label: '观察电解现象', note: '在规范装置中收集气体', tone: 'blue' },
      { label: '比较气体体积', note: '两种气体体积比提供组成线索', tone: 'green' },
      { label: '检验氢气', note: '按规范方法确认可燃性', tone: 'amber' },
      { label: '形成结论', note: '水由氢、氧元素组成', tone: 'slate' },
    ],
  },
  'chem-k-water-purification': {
    type: 'flow', title: '水净化方法边界', summary: '不同方法分别处理水中不同类型的杂质。',
    items: [
      { label: '沉降', note: '除去较大不溶性杂质', tone: 'blue' },
      { label: '过滤', note: '分离不溶于水的固体', tone: 'green' },
      { label: '吸附和消毒', note: '改善色味或杀灭部分微生物', tone: 'amber' },
      { label: '硬水软化', note: '降低可溶性钙镁化合物影响', tone: 'slate' },
    ],
  },
  'chem-k-dissolution-solubility': {
    type: 'flow', title: '溶解与饱和判断', summary: '结合温度和状态判断溶解与饱和。',
    items: [
      { label: '认识溶液', note: '溶质均匀分散在溶剂中', tone: 'blue' },
      { label: '达到饱和', note: '一定温度下不能再溶解该溶质', tone: 'green' },
      { label: '读溶解度', note: '注意温度和溶剂质量条件', tone: 'amber' },
      { label: '判断变化', note: '升降温或蒸发会改变状态', tone: 'slate' },
    ],
  },
  'chem-k-solution-concentration': {
    type: 'flow', title: '质量分数计算', summary: '明确质量关系并规范表达溶液浓度。',
    items: [
      { label: '明确已知量', note: '区分溶质、溶液和溶剂质量', tone: 'blue' },
      { label: '列出质量分数', note: '溶质质量除以溶液质量', tone: 'green' },
      { label: '按步骤配制', note: '称量、溶解和转移要规范', tone: 'amber' },
      { label: '核对表达', note: '结果通常用百分数和条件说明', tone: 'slate' },
    ],
  },
  'chem-k-particles': {
    type: 'hierarchy', title: '微粒认识物质', summary: '物质由不同类型的微观粒子构成。',
    items: [
      { label: '物质', note: '由微观粒子构成', tone: 'blue', depth: 0 },
      { label: '分子', note: '保持物质化学性质的一种微粒', tone: 'green', depth: 1 },
      { label: '原子', note: '化学变化中的基本微粒', tone: 'amber', depth: 1 },
      { label: '离子', note: '带电的原子或原子团', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-atomic-structure': {
    type: 'hierarchy', title: '原子结构信息', summary: '原子结构提供质量和粒子组成的信息。',
    items: [
      { label: '原子', note: '由原子核和核外电子构成', tone: 'blue', depth: 0 },
      { label: '原子核', note: '由质子和中子构成', tone: 'green', depth: 1 },
      { label: '核外电子', note: '在核外一定区域运动', tone: 'amber', depth: 1 },
      { label: '相对原子质量', note: '主要由质子和中子质量决定', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-elements-periodic-table': {
    type: 'hierarchy', title: '元素与周期表', summary: '元素符号和周期表呈现元素分类与规律。',
    items: [
      { label: '元素', note: '质子数相同的一类原子', tone: 'blue', depth: 0 },
      { label: '元素符号', note: '用规定符号表示元素', tone: 'green', depth: 1 },
      { label: '元素类别', note: '金属、非金属和稀有气体等', tone: 'amber', depth: 1 },
      { label: '周期表信息', note: '按原子序数排列并显示规律', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-formula-valence': {
    type: 'flow', title: '化学式书写检查', summary: '依据化合价写出并复核化学式。',
    items: [
      { label: '确定元素或原子团', note: '先识别组成成分', tone: 'blue' },
      { label: '查用化合价', note: '正负化合价代数和为零', tone: 'green' },
      { label: '写出最简比', note: '下标表示原子个数比', tone: 'amber' },
      { label: '复核读法', note: '检查符号、括号和下标', tone: 'slate' },
    ],
  },
  'chem-k-symbols-formulas': {
    type: 'hierarchy', title: '化学符号含义', summary: '符号和数字表达物质及其组成信息。',
    items: [
      { label: '化学用语', note: '用符号和数字表达物质信息', tone: 'blue', depth: 0 },
      { label: '元素符号', note: '表示元素或一个原子', tone: 'green', depth: 1 },
      { label: '化学式', note: '表示物质及其组成', tone: 'amber', depth: 1 },
      { label: '数字含义', note: '前系数与右下角数字表示的对象不同', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-mass-conservation': {
    type: 'flow', title: '质量守恒的解释', summary: '封闭体系中原子守恒解释质量守恒。',
    items: [
      { label: '明确反应体系', note: '比较同一封闭体系前后质量', tone: 'blue' },
      { label: '观察反应', note: '记录生成物和反应物变化', tone: 'green' },
      { label: '从原子看守恒', note: '原子种类和数目反应前后不变', tone: 'amber' },
      { label: '解释差异', note: '气体逸出或进入会影响称量结果', tone: 'slate' },
    ],
  },
  'chem-k-equations': {
    type: 'flow', title: '方程式书写步骤', summary: '写式、配平并检查化学方程式守恒。',
    items: [
      { label: '写出反应物和生成物', note: '依据事实写出化学式', tone: 'blue' },
      { label: '配平原子数', note: '只改变化学计量数', tone: 'green' },
      { label: '标明条件和状态', note: '按现有规范注明必要信息', tone: 'amber' },
      { label: '检查守恒', note: '元素种类和数目两侧一致', tone: 'slate' },
    ],
  },
  'chem-k-stoichiometry': {
    type: 'flow', title: '方程式计算路径', summary: '从正确方程式建立质量关系完成计算。',
    items: [
      { label: '审清问题', note: '确定求量和已知量', tone: 'blue' },
      { label: '写正确方程式', note: '先配平并确认条件', tone: 'green' },
      { label: '列质量比例', note: '系数对应物质的量比例并转为质量关系', tone: 'amber' },
      { label: '核对单位', note: '结果与已知量和问法对应', tone: 'slate' },
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
