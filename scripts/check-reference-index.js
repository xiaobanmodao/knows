const fs = require('fs');
const path = require('path');
const {
  buildReferenceIndex,
  renderReferenceIndexModule,
} = require('./reference-index-builder');
const {
  REFERENCE_INDEX_META,
  filterReferenceEntries,
  getReferenceEntries,
} = require('../utils/reference-index');
const { buildContentRoute } = require('../utils/content-routes');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'data/reference-index.js');
const expectedIndex = buildReferenceIndex();
const expectedSource = renderReferenceIndexModule(expectedIndex);
const actualSource = fs.readFileSync(outputPath, 'utf8');
const issues = [];

function issue(owner, message) {
  issues.push(`${owner}: ${message}`);
}

if (actualSource !== expectedSource) issue('生成文件', 'data/reference-index.js 与三科内容源不一致');
if (Buffer.byteLength(actualSource, 'utf8') > 150 * 1024) issue('生成文件', '索引源文件超过 150 KiB 主包预算');
if (REFERENCE_INDEX_META.sourceHash !== expectedIndex.meta.sourceHash) issue('源哈希', '运行时哈希与构建结果不一致');

const expectedCounts = { formula: 173, word: 336, grammar: 84, experiment: 29 };
const allKeys = new Set();
Object.entries(expectedCounts).forEach(([kind, expectedCount]) => {
  const entries = getReferenceEntries(kind);
  if (entries.length !== expectedCount) issue(kind, `应为 ${expectedCount} 条，当前 ${entries.length}`);
  entries.forEach((entry) => {
    if (allKeys.has(entry.key)) issue(entry.key, '跨类型索引键重复');
    allKeys.add(entry.key);
    ['key', 'kind', 'subjectId', 'refId', 'title', 'subtitle', 'primary'].forEach((field) => {
      if (!String(entry[field] || '').trim()) issue(entry.key, `缺少 ${field}`);
    });
  });
});

const formulas = getReferenceEntries('formula');
const mathFormulaCount = formulas.filter((entry) => entry.subjectId === 'math').length;
const physicsFormulaCount = formulas.filter((entry) => entry.subjectId === 'physics').length;
if (mathFormulaCount !== 89 || physicsFormulaCount !== 84) {
  issue('公式学科规模', `应为数学 89 / 物理 84，当前 ${mathFormulaCount}/${physicsFormulaCount}`);
}

getReferenceEntries('experiment').forEach((entry) => {
  if (!entry.focusId || !entry.focusId.endsWith('-experiment')) issue(entry.key, '缺少稳定实验定位 ID');
  const route = buildContentRoute({
    subjectId: entry.subjectId,
    type: 'knowledge',
    id: entry.refId,
    focusType: 'experiment',
    focusId: entry.focusId,
  });
  if (!route.includes(`focusId=${encodeURIComponent(entry.focusId)}`)) issue(entry.key, '实验定位参数没有进入分包路由');
});

[
  ['formula', '勾股定理为什么成立', '17.1 勾股定理'],
  ['formula', 'kg/m³', '密度及其计算'],
  ['word', 'spelled', 'spell'],
  ['word', 'colour', 'colour'],
  ['grammar', 'There be', 'There be 场景描述'],
  ['grammar', '名词性物主代词', '形容词性与名词性物主代词'],
  ['experiment', '晶体熔化', '探究晶体熔化时温度变化'],
  ['experiment', '伏安法', '伏安法测定值电阻'],
].forEach(([kind, keyword, expectedTitle]) => {
  const results = filterReferenceEntries({ kind, keyword });
  if (!results.some((entry) => entry.title === expectedTitle)) {
    issue(`${kind}/${keyword}`, `没有命中 ${expectedTitle}`);
  }
});

const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
if (!appConfig.pages.includes('pages/reference-index/index')) issue('页面配置', 'app.json 未注册知识索引页');

if (issues.length) {
  console.log('FOUND_REFERENCE_INDEX_ISSUES');
  issues.forEach((item) => console.log(item));
  process.exit(1);
}

console.log(`OK ${allKeys.size} reference entries: ${mathFormulaCount} math formulas, ${physicsFormulaCount} physics formulas, 336 words, 84 grammar points and 29 experiments checked`);
