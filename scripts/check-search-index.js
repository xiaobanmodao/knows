const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const {
  buildSearchIndex,
  renderSearchIndexModule,
  validateSubjectTokenBudget,
} = require('./search-index-builder');
const { SEARCH_INDEX_META, SEARCH_INDEX_ROWS } = require('../packages/catalog/data/search-index');
const { searchAllSubjects } = require('../packages/catalog/utils/search-index');

const root = path.resolve(__dirname, '..');
const generatedPath = path.join(root, 'packages/catalog/data/search-index.js');
const built = buildSearchIndex();
const issues = [];

if (fs.readFileSync(generatedPath, 'utf8') !== renderSearchIndexModule(built)) {
  issues.push('packages/catalog/data/search-index.js 与当前内容源不一致，请运行 node scripts/build-search-index.js');
}

if (fs.existsSync(path.join(root, 'data/search-index.js'))) {
  issues.push('主包仍包含完整 data/search-index.js');
}
if (fs.existsSync(path.join(root, 'utils/search-index.js'))) {
  issues.push('主包仍包含完整 utils/search-index.js');
}

if (SEARCH_INDEX_META.sourceHash !== built.meta.sourceHash
  || SEARCH_INDEX_META.entryCount !== built.meta.entryCount
  || SEARCH_INDEX_ROWS.length !== built.entries.length) {
  issues.push('搜索索引元数据或哈希与内容源不一致');
}

const keys = built.entries.map((entry) => entry.key);
if (new Set(keys).size !== keys.length) {
  issues.push('搜索索引 key 不唯一');
}

const priorEntries = built.entries.filter((entry) => !['chemistry', 'biology'].includes(entry.subjectId));
const priorHash = crypto.createHash('sha256').update(JSON.stringify(priorEntries)).digest('hex');
if (priorEntries.length !== 833 || priorHash !== '090d0f25a0d325338ccdfd1b4088365580eadd0f1e54441e79c5f3f45cd57e80') {
  issues.push(`旧三科搜索语义或顺序发生变化：${priorEntries.length}/${priorHash}`);
}
const chemistryEntries = built.entries.filter((entry) => entry.subjectId === 'chemistry');
if (chemistryEntries.length !== 62) {
  issues.push('化学搜索实体应为 10 专题 + 40 知识点 + 12 方法，共 62 条');
}

const biologyEntries = built.entries.filter((entry) => entry.subjectId === 'biology');
if (biologyEntries.length !== 48) {
  issues.push('生物搜索实体应为 6 专题 + 36 知识点 + 6 方法，共 48 条');
}

const biologyTokenLimits = {
  maxTokenChars: 60,
  maxEntryTokenChars: 220,
  maxSubjectTokenChars: 6000,
};
try {
  validateSubjectTokenBudget(biologyEntries, 'biology', biologyTokenLimits);
} catch (error) {
  issues.push(`生物搜索 token 超出轻量预算：${error.message}`);
}

const chemistryTokenLimits = {
  maxTokenChars: 60,
  maxEntryTokenChars: 240,
  maxSubjectTokenChars: 9000,
};
if (typeof validateSubjectTokenBudget !== 'function') {
  issues.push('搜索构建器缺少可复用的学科 token 预算验证器');
} else {
  try {
    validateSubjectTokenBudget(chemistryEntries, 'chemistry', chemistryTokenLimits);
  } catch (error) {
    issues.push(`化学搜索 token 超出轻量预算：${error.message}`);
  }

  [
    {
      label: '单 token 长正文',
      entries: [{ key: 'chemistry:knowledge:long-token', subjectId: 'chemistry', tokens: ['长'.repeat(61)] }],
      expectedMessage: '单个 token',
    },
    {
      label: '单条正文聚合',
      entries: [{
        key: 'chemistry:knowledge:long-entry',
        subjectId: 'chemistry',
        tokens: ['甲'.repeat(50), '乙'.repeat(50), '丙'.repeat(50), '丁'.repeat(50), '戊'.repeat(50)],
      }],
      expectedMessage: '单条 token',
    },
    {
      label: '全科正文聚合',
      entries: Array.from({ length: 38 }, (_, index) => ({
        key: `chemistry:knowledge:long-subject-${index}`,
        subjectId: 'chemistry',
        tokens: ['甲'.repeat(60), '乙'.repeat(60), '丙'.repeat(60), '丁'.repeat(60)],
      })),
      expectedMessage: '全科 token',
    },
  ].forEach((fixture) => {
    let rejected = false;
    try {
      validateSubjectTokenBudget(fixture.entries, 'chemistry', chemistryTokenLimits);
    } catch (error) {
      rejected = error.message.includes(fixture.expectedMessage);
    }
    if (!rejected) issues.push(`${fixture.label}夹具没有被预算验证器拒绝`);
  });
}

built.entries.forEach((entry) => {
  if (!entry.refId || !entry.subjectId || !entry.type || !entry.title || !entry.tokens.length) {
    issues.push(`搜索索引字段不完整: ${entry.key}`);
  }

  if (entry.tokens.some((token) => token.length > 80)) {
    issues.push(`搜索索引 token 超过 80 字符: ${entry.key}`);
  }
});

const canonicalChecks = [
  ['手拉手模型', 'math'],
  ['被动语态', 'english'],
  ['定语从句', 'english'],
  ['阅读主旨', 'english'],
  ['受力分析', 'physics'],
  ['浮力', 'physics'],
  ['欧姆定律', 'physics'],
  ['质量守恒定律', 'chemistry'],
  ['化学方程式配平', 'chemistry'],
  ['氧气制取', 'chemistry'],
  ['二氧化碳检验', 'chemistry'],
  ['溶质质量分数', 'chemistry'],
  ['金属活动性顺序', 'chemistry'],
  ['pH', 'chemistry'],
  ['中和反应', 'chemistry'],
  ['粗盐提纯', 'chemistry'],
  ['燃烧条件', 'chemistry'],
  ['细胞膜', 'biology'],
  ['光合作用', 'biology'],
  ['消化系统', 'biology'],
  ['生态系统', 'biology'],
  ['遗传和变异', 'biology'],
  ['生物多样性', 'biology'],
];

canonicalChecks.forEach(([keyword, subjectId]) => {
  const [result] = searchAllSubjects(keyword);
  if (!result || result.subjectId !== subjectId) {
    issues.push(`搜索“${keyword}”未命中预期学科 ${subjectId}`);
  }
});

let searchPage;
global.Page = (config) => { searchPage = config; };
delete require.cache[require.resolve('../packages/catalog/pages/search/index')];
require('../packages/catalog/pages/search/index');
const searchFilterIds = searchPage.data.subjectFilters.map((item) => item.id);
if (searchFilterIds.join(',') !== 'all,math,english,physics,chemistry,biology') {
  issues.push(`搜索页学科筛选未从五科清单生成：${searchFilterIds.join(',')}`);
}
delete global.Page;

if (issues.length) {
  console.log('FOUND_SEARCH_INDEX_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK ${built.meta.entryCount} generated search entries and source hash checked`);
