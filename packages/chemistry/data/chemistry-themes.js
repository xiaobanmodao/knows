const { buildTheme } = require('./chemistry-builders');

const themes = [
  buildTheme({
    id: 'chem-theme-inquiry',
    title: '科学探究与化学实验',
    summary: '以规范实验、证据记录和模型建构认识化学，强调安全、求实、合作与责任。',
    topicIds: ['chem-topic-lab'],
  }),
  buildTheme({
    id: 'chem-theme-properties',
    title: '物质的性质与应用',
    summary: '从空气、水、碳、金属、酸碱盐等常见物质出发，建立性质、用途、制备与安全使用之间的联系。',
    topicIds: [
      'chem-topic-air-oxygen',
      'chem-topic-water-solution',
      'chem-topic-carbon-fuels',
      'chem-topic-metals',
      'chem-topic-acids-bases',
      'chem-topic-salts-fertilizers',
    ],
  }),
  buildTheme({
    id: 'chem-theme-structure',
    title: '物质的组成与结构',
    summary: '用分子、原子、离子和元素等初步模型解释物质组成，并学习用化学符号准确表达。',
    topicIds: ['chem-topic-particles-elements'],
  }),
  buildTheme({
    id: 'chem-theme-change',
    title: '物质的化学变化',
    summary: '从反应事实、质量守恒和化学方程式理解物质转化，开展义务教育范围内的简单定量推理。',
    topicIds: ['chem-topic-language-conservation'],
  }),
  buildTheme({
    id: 'chem-theme-society',
    title: '化学与社会·跨学科实践',
    summary: '联系材料、资源、环境和健康问题，运用需求分析、方案评价、伦理与法律意识参与跨学科实践。',
    topicIds: ['chem-topic-materials-environment'],
  }),
];

module.exports = { themes };
