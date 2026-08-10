const VISUAL_GUIDE_TYPES = Object.freeze(['flow', 'cycle', 'compare', 'hierarchy']);
const VISUAL_GUIDE_TONES = Object.freeze(['green', 'blue', 'amber', 'slate']);

function deepFreeze(value) {
  if (value && (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const visualGuidesByKnowledgeId = deepFreeze({
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
  'chem-k-carbon-allotropes': {
    type: 'compare', title: '碳单质的差异', summary: '碳原子的不同排列方式带来不同性质。',
    items: [
      { label: '金刚石结构', note: '碳原子排列方式不同', tone: 'blue', lane: 'left' },
      { label: '金刚石性质', note: '硬度大且不导电', tone: 'green', lane: 'left' },
      { label: '石墨结构', note: '层状排列使层间容易滑动', tone: 'amber', lane: 'right' },
      { label: '石墨性质', note: '质软且能导电并有润滑性', tone: 'slate', lane: 'right' },
    ],
  },
  'chem-k-carbon-oxides': {
    type: 'compare', title: '两种碳的氧化物', summary: '一氧化碳和二氧化碳的性质及应用不同。',
    items: [
      { label: '一氧化碳性质', note: '有毒且有可燃性和还原性', tone: 'blue', lane: 'left' },
      { label: '一氧化碳安全', note: '密闭或通风不良处需防中毒', tone: 'green', lane: 'left' },
      { label: '二氧化碳性质', note: '通常不燃烧也不支持燃烧', tone: 'amber', lane: 'right' },
      { label: '二氧化碳用途', note: '可用于灭火等适当场景', tone: 'slate', lane: 'right' },
    ],
  },
  'chem-k-carbon-dioxide-lab': {
    type: 'flow', title: '二氧化碳制取检验', summary: '按实验规范制取、收集和检验二氧化碳。',
    items: [
      { label: '选择药品装置', note: '按现有实验方案准备', tone: 'blue' },
      { label: '检查气密性', note: '制气前确认装置连接', tone: 'green' },
      { label: '收集气体', note: '依据性质选择收集方法', tone: 'amber' },
      { label: '检验记录', note: '用石灰水等规范方法判断现象', tone: 'slate' },
    ],
  },
  'chem-k-fuels-energy': {
    type: 'flow', title: '燃料与低碳选择', summary: '使用燃料时兼顾能量利用和环境影响。',
    items: [
      { label: '使用燃料', note: '燃烧释放可利用能量', tone: 'blue' },
      { label: '关注排放', note: '不完全燃烧和污染物需要控制', tone: 'green' },
      { label: '提高利用效率', note: '减少无效能量损失', tone: 'amber' },
      { label: '选择低碳方式', note: '结合具体情境节约资源', tone: 'slate' },
    ],
  },
  'chem-k-metal-properties': {
    type: 'flow', title: '金属性质到用途', summary: '根据性质和使用条件选择金属材料。',
    items: [
      { label: '识别性质', note: '光泽、导电、导热和延展性等', tone: 'blue' },
      { label: '匹配用途', note: '根据用途选择关键性质', tone: 'green' },
      { label: '考虑环境', note: '强度、耐腐蚀和成本也会影响选择', tone: 'amber' },
      { label: '规范回收', note: '金属资源应合理循环利用', tone: 'slate' },
    ],
  },
  'chem-k-metal-activity': {
    type: 'hierarchy', title: '金属活动性判断', summary: '活动性顺序帮助判断金属反应的可能性。',
    items: [
      { label: '金属活动性顺序', note: '反映金属失电子能力相对强弱', tone: 'blue', depth: 0 },
      { label: '与酸反应', note: '排在氢前的金属通常能置换酸中的氢', tone: 'green', depth: 1 },
      { label: '置换反应', note: '较活泼金属可置换较不活泼金属盐溶液中的金属', tone: 'amber', depth: 1 },
      { label: '条件边界', note: '结合金属和溶液的具体条件判断', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-metal-extraction': {
    type: 'flow', title: '金属资源与冶炼', summary: '依据矿石和金属活动性选择冶炼与回收方式。',
    items: [
      { label: '认识矿石', note: '多数金属以化合物形式存在', tone: 'blue' },
      { label: '选择冶炼方法', note: '依据金属活动性和化合物性质', tone: 'green' },
      { label: '得到金属', note: '过程要符合工艺和安全条件', tone: 'amber' },
      { label: '循环利用', note: '回收可减少资源消耗和污染', tone: 'slate' },
    ],
  },
  'chem-k-metal-corrosion': {
    type: 'flow', title: '锈蚀与防护', summary: '针对锈蚀条件选择材料和防护措施。',
    items: [
      { label: '观察锈蚀条件', note: '铁与氧气和水共同作用易生锈', tone: 'blue' },
      { label: '隔绝条件', note: '涂油、刷漆或镀层可减慢锈蚀', tone: 'green' },
      { label: '选择材料', note: '合金和防护层适合不同环境', tone: 'amber' },
      { label: '维护检查', note: '及时修补破损防护层', tone: 'slate' },
    ],
  },
  'chem-k-indicators-ph': {
    type: 'flow', title: '指示剂与 pH 判断', summary: '用规范方法判断溶液酸碱性并安全处理。',
    items: [
      { label: '使用指示剂', note: '用颜色变化初步判断酸碱性', tone: 'blue' },
      { label: '读取 pH', note: '按规范比色或读数', tone: 'green' },
      { label: '作出判断', note: 'pH 小于 7 通常显酸性', tone: 'amber' },
      { label: '安全处理', note: '未知溶液不品尝不直接闻气味', tone: 'slate' },
    ],
  },
  'chem-k-common-acids': {
    type: 'hierarchy', title: '酸的共同性质', summary: '酸的性质与溶液中的氢离子有关。',
    items: [
      { label: '酸', note: '溶液中能电离出氢离子', tone: 'blue', depth: 0 },
      { label: '与指示剂', note: '使某些指示剂显示特定颜色', tone: 'green', depth: 1 },
      { label: '与活泼金属', note: '在条件适当时生成氢气和盐', tone: 'amber', depth: 1 },
      { label: '与碱和金属氧化物', note: '可发生中和或生成盐和水', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-common-bases': {
    type: 'hierarchy', title: '碱的共同性质', summary: '碱的性质与溶液中的氢氧根离子有关。',
    items: [
      { label: '碱', note: '溶液中能电离出氢氧根离子', tone: 'blue', depth: 0 },
      { label: '与指示剂', note: '使某些指示剂显示特定颜色', tone: 'green', depth: 1 },
      { label: '与酸', note: '发生中和生成盐和水', tone: 'amber', depth: 1 },
      { label: '使用边界', note: '强碱具有腐蚀性需按规范防护', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-neutralization': {
    type: 'flow', title: '中和反应判断', summary: '依据证据判断中和反应及其适用条件。',
    items: [
      { label: '确认酸碱', note: '从指示剂或 pH 等证据判断', tone: 'blue' },
      { label: '发生中和', note: '酸与碱反应生成盐和水', tone: 'green' },
      { label: '观察变化', note: '现象取决于反应物和指示剂', tone: 'amber' },
      { label: '联系应用', note: '调节土壤或处理酸碱废液需遵守条件', tone: 'slate' },
    ],
  },
  'chem-k-common-salts': {
    type: 'hierarchy', title: '常见盐及用途', summary: '根据组成、性质和条件认识常见盐的用途。',
    items: [
      { label: '盐', note: '由金属离子或铵根离子与酸根离子构成', tone: 'blue', depth: 0 },
      { label: '常见盐', note: '氯化钠、碳酸钠、碳酸钙等', tone: 'green', depth: 1 },
      { label: '用途判断', note: '用途取决于性质和实际条件', tone: 'amber', depth: 1 },
      { label: '安全使用', note: '化学品按标签和规范使用', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-ion-reactions': {
    type: 'flow', title: '复分解与离子检验', summary: '依据生成条件和现象判断离子反应。',
    items: [
      { label: '判断反应物', note: '先识别溶液中的离子', tone: 'blue' },
      { label: '检查生成条件', note: '生成沉淀、气体或水时可能反应', tone: 'green' },
      { label: '选择检验', note: '使用特征反应和规范现象', tone: 'amber' },
      { label: '得出结论', note: '结论要对应观察证据', tone: 'slate' },
    ],
  },
  'chem-k-fertilizers': {
    type: 'hierarchy', title: '化学肥料分类', summary: '肥料分类与合理施用要结合实际需要。',
    items: [
      { label: '化学肥料', note: '为植物提供一种或多种营养元素', tone: 'blue', depth: 0 },
      { label: '氮肥', note: '主要补充氮元素', tone: 'green', depth: 1 },
      { label: '磷肥和钾肥', note: '分别主要补充磷、钾元素', tone: 'amber', depth: 1 },
      { label: '合理施用', note: '依据土壤和作物需要避免过量', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-substance-classification': {
    type: 'hierarchy', title: '物质分类线索', summary: '从组成和特征逐步判断物质类别。',
    items: [
      { label: '物质', note: '先按组成是否固定分类', tone: 'blue', depth: 0 },
      { label: '混合物', note: '由多种物质组成', tone: 'green', depth: 1 },
      { label: '纯净物', note: '组成固定可继续分类', tone: 'amber', depth: 1 },
      { label: '纯净物再分类', note: '单质、化合物和酸碱盐等按特征判断', tone: 'slate', depth: 2 },
    ],
  },
  'chem-k-organic-basics': {
    type: 'hierarchy', title: '有机物与高分子', summary: '依据组成和特征认识有机物及有机高分子。',
    items: [
      { label: '含碳化合物', note: '分类要看组成和特征', tone: 'blue', depth: 0 },
      { label: '有机物', note: '多数含碳元素的化合物', tone: 'green', depth: 1 },
      { label: '无机物', note: '有些含碳化合物不属于有机物', tone: 'amber', depth: 1 },
      { label: '有机高分子', note: '相对分子质量很大的一类有机物', tone: 'slate', depth: 2 },
    ],
  },
  'chem-k-materials': {
    type: 'hierarchy', title: '材料分类与选择', summary: '材料分类和选择要结合来源、组成与用途。',
    items: [
      { label: '材料', note: '根据来源、组成和用途选择', tone: 'blue', depth: 0 },
      { label: '天然材料', note: '来自自然界并经加工使用', tone: 'green', depth: 1 },
      { label: '合成材料', note: '通过化学方法制得', tone: 'amber', depth: 1 },
      { label: '复合材料', note: '结合多种材料优点', tone: 'slate', depth: 1 },
    ],
  },
  'chem-k-chemical-health': {
    type: 'flow', title: '元素营养与健康', summary: '从元素营养出发作出科学的健康判断。',
    items: [
      { label: '认识元素作用', note: '人体需要多种元素维持生命活动', tone: 'blue' },
      { label: '获取营养', note: '食物提供不同营养元素', tone: 'green' },
      { label: '保持均衡', note: '不能用单一食物替代合理膳食', tone: 'amber' },
      { label: '科学判断', note: '不以化学名词替代健康建议', tone: 'slate' },
    ],
  },
  'chem-k-resources-environment': {
    type: 'cycle', title: '绿色化学持续关系', summary: '资源利用、污染预防和回收处理持续改进环境表现。',
    items: [
      { label: '资源利用', note: '按需要节约使用原料和能源', tone: 'blue' },
      { label: '污染预防', note: '优先从源头减少有害排放', tone: 'green' },
      { label: '回收处理', note: '分类回收并规范处置废弃物', tone: 'amber' },
      { label: '改进选择', note: '在设计和使用中持续降低环境负担', tone: 'slate' },
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
