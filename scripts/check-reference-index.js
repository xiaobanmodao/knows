const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  buildReferenceIndex,
  renderReferenceIndexModule,
} = require('./reference-index-builder');
const {
  REFERENCE_KIND_META,
  REFERENCE_INDEX_META: MAIN_REFERENCE_INDEX_META,
} = require('../data/reference-index-meta');
const {
  REFERENCE_INDEX_META,
} = require('../packages/catalog/data/reference-index');
const {
  REFERENCE_KINDS,
  filterReferenceEntries,
  getReferenceEntries,
} = require('../packages/catalog/utils/reference-index');
const { buildContentRoute } = require('../utils/content-routes');
const { getSubjectRegistry } = require('../data/subject-manifest');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'packages/catalog/data/reference-index.js');
const metaPath = path.join(root, 'data/reference-index-meta.js');
const expectedIndex = buildReferenceIndex();
const expectedSource = renderReferenceIndexModule(expectedIndex);
const actualSource = fs.readFileSync(outputPath, 'utf8');
const metaSource = fs.readFileSync(metaPath, 'utf8');
const issues = [];

function issue(owner, message) {
  issues.push(`${owner}: ${message}`);
}

if (fs.existsSync(path.join(root, 'data/reference-index.js'))) issue('主包', '仍包含完整 data/reference-index.js');
if (fs.existsSync(path.join(root, 'utils/reference-index.js'))) issue('主包', '仍包含完整 utils/reference-index.js');
if (actualSource !== expectedSource) issue('生成文件', 'packages/catalog/data/reference-index.js 与五科内容源不一致');
if (metaSource.includes('REFERENCE_INDEX_ROWS')) issue('主包元数据', '不得包含完整参考索引行');
if (REFERENCE_INDEX_META.sourceHash !== expectedIndex.meta.sourceHash) issue('源哈希', '运行时哈希与构建结果不一致');
if (MAIN_REFERENCE_INDEX_META.sourceHash !== REFERENCE_INDEX_META.sourceHash) {
  issue('源哈希', '主包元数据与 catalog 完整索引不一致');
}

const priorEntries = expectedIndex.entries.filter((entry) => !['chemistry', 'biology'].includes(entry.subjectId));
const priorHash = crypto.createHash('sha256').update(JSON.stringify(priorEntries)).digest('hex');
if (priorEntries.length !== 202 || priorHash !== '4c4410c37e2940b3142c2ffde8ec433957afaad4e0a4be0830b4578241d130b5') {
  issue('旧三科参考语义', `发生变化：${priorEntries.length}/${priorHash}`);
}
if (expectedIndex.meta.entryCount !== 244) issue('物化生参考规模', `物化生记录应为 244，当前 ${expectedIndex.meta.entryCount}`);

const expectedKindMeta = [
  { id: 'formula', title: '公式', count: 173, subjectIds: ['math', 'physics'] },
  { id: 'word', title: '单词', count: 336, subjectIds: ['english'] },
  { id: 'grammar', title: '语法', count: 84, subjectIds: ['english'] },
  { id: 'experiment', title: '实验', count: 43, subjectIds: ['physics', 'chemistry', 'biology'] },
  { id: 'equation', title: '方程式', count: 28, subjectIds: ['chemistry'] },
];
if (JSON.stringify(REFERENCE_KIND_META) !== JSON.stringify(expectedKindMeta)) {
  issue('生成参考类型元数据', `不匹配：${JSON.stringify(REFERENCE_KIND_META)}`);
}
if (JSON.stringify(REFERENCE_KINDS) !== JSON.stringify(expectedKindMeta)) {
  issue('运行时参考类型元数据', '未直接使用生成的类型、标题、数量与学科能力');
}

const expectedCounts = { formula: 173, word: 336, grammar: 84, experiment: 43, equation: 28 };
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
  if (!entry.focusId) issue(entry.key, '缺少稳定实验定位 ID');
  if (entry.subjectId === 'physics' && !entry.focusId.endsWith('-experiment')) issue(entry.key, '物理实验定位 ID 格式回归');
  if (entry.subjectId === 'chemistry' && !entry.focusId.startsWith('chem-exp-')) issue(entry.key, '化学实验定位 ID 格式错误');
  if (entry.subjectId === 'biology' && !entry.focusId.startsWith('bio-exp-')) issue(entry.key, '生物观察定位 ID 格式错误');
  const route = buildContentRoute({
    subjectId: entry.subjectId,
    type: 'knowledge',
    id: entry.refId,
    focusType: 'experiment',
    focusId: entry.focusId,
  });
  if (!route.includes(`focusId=${encodeURIComponent(entry.focusId)}`)) issue(entry.key, '实验定位参数没有进入分包路由');
});

getReferenceEntries('equation').forEach((entry) => {
  if (entry.subjectId !== 'chemistry' || !entry.focusId.startsWith('chem-eq-')) issue(entry.key, '化学方程式归属或定位 ID 错误');
  const route = buildContentRoute({
    subjectId: entry.subjectId,
    type: 'knowledge',
    id: entry.refId,
    focusType: 'equation',
    focusId: entry.focusId,
  });
  if (!route.includes('focusType=equation') || !route.includes(`focusId=${encodeURIComponent(entry.focusId)}`)) {
    issue(entry.key, '方程式定位参数没有进入化学知识页路由');
  }
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
  ['experiment', '粗盐提纯', '粗盐中难溶性杂质的去除'],
  ['experiment', '燃烧条件', '燃烧条件的探究'],
  ['experiment', '显微镜', '显微镜与细胞观察'],
  ['experiment', '生物多样性', '生物多样性保护'],
  ['equation', '石灰水', '二氧化碳与石灰水反应'],
  ['equation', '中和反应', '盐酸与氢氧化钠反应'],
].forEach(([kind, keyword, expectedTitle]) => {
  const results = filterReferenceEntries({ kind, keyword });
  if (!results.some((entry) => entry.title === expectedTitle)) {
    issue(`${kind}/${keyword}`, `没有命中 ${expectedTitle}`);
  }
});

let referencePage;
const openedRoutes = [];
global.Page = (config) => { referencePage = config; };
global.wx = {
  showLoading() {},
  hideLoading() {},
  showModal() {},
  navigateTo({ url, success, complete }) {
    openedRoutes.push(url);
    if (success) success({});
    if (complete) complete({});
  },
};
delete require.cache[require.resolve('../packages/catalog/pages/reference-index/index')];
require('../packages/catalog/pages/reference-index/index');
[
  ['experiment', 'chem-k-oxygen-preparation', 'chem-exp-oxygen', 'chemistry'],
  ['equation', 'chem-k-neutralization', 'chem-eq-neutralization', 'chemistry'],
  ['experiment', 'bio-k-microscope-observation', 'bio-exp-microscope-observation', 'biology'],
].forEach(([kind, refId, focusId, subjectId]) => {
  referencePage.openEntry({
    currentTarget: { dataset: { kind, refId, subjectId, focusId } },
  });
});
if (!openedRoutes[0].includes('focusType=experiment') || !openedRoutes[0].includes('focusId=chem-exp-oxygen')) {
  issue('参考页实验打开', `路由错误：${openedRoutes[0]}`);
}
if (!openedRoutes[1].includes('focusType=equation') || !openedRoutes[1].includes('focusId=chem-eq-neutralization')) {
  issue('参考页方程式打开', `路由错误：${openedRoutes[1]}`);
}
if (!openedRoutes[2].includes('focusType=experiment') || !openedRoutes[2].includes('focusId=bio-exp-microscope-observation')) {
  issue('参考页生物观察打开', `路由错误：${openedRoutes[2]}`);
}
if (!openedRoutes[2].startsWith('/packages/biology/pages/knowledge/index')) {
  issue('参考页生物观察打开', `未进入生物知识页：${openedRoutes[2]}`);
}
delete global.Page;
delete global.wx;

const biologyKnowledgeWxml = fs.readFileSync(path.join(root, 'packages/biology/pages/knowledge/index.wxml'), 'utf8');
const biologyKnowledgePage = fs.readFileSync(path.join(root, 'packages/biology/pages/knowledge/index.js'), 'utf8');
if (!biologyKnowledgeWxml.includes('id="experiment-{{knowledge.safetyObservation.id}}"')) {
  issue('生物观察定位', '知识页缺少 experiment-{{knowledge.safetyObservation.id}} 锚点');
}
if (!biologyKnowledgePage.includes('selector: `#${focus.type}-${focus.id}`')) {
  issue('生物观察定位', '知识页定位选择器没有使用 experiment-<focusId> 前缀');
}

let profilePage;
global.Page = (config) => { profilePage = config; };
delete require.cache[require.resolve('../pages/profile/index')];
const profileModule = require('../pages/profile/index');
const profileReferenceIds = profilePage.data.referenceItems.map((item) => item.id);
if (profileReferenceIds.join(',') !== 'formula,word,grammar,experiment,equation') {
  issue('我的页参考入口', `未使用五类生成元数据：${profileReferenceIds.join(',')}`);
}
if (!profilePage.data.versionItems.some((item) => item.includes('化学：'))
  || !profilePage.data.versionItems.some((item) => item.includes('生物：'))
  || !profilePage.data.versionItems.some((item) => item.includes('5 科'))) {
  issue('我的页学科规模', '五科目录未包含化学、生物或 5 科说明');
}
if (typeof profileModule.buildSubjectVersionItems !== 'function') {
  issue('我的页学科摘要', '缺少按 subject.id 生成摘要的可验证 helper');
} else {
  const activeSubjects = getSubjectRegistry();
  const reordered = [activeSubjects[3], activeSubjects[0], activeSubjects[2], activeSubjects[1], activeSubjects[4]];
  const reorderedItems = profileModule.buildSubjectVersionItems(reordered);
  const expectedPrefixes = ['化学：', '数学：', '物理：', '英语：', '生物：'];
  expectedPrefixes.forEach((prefix, index) => {
    if (!reorderedItems[index].startsWith(prefix)) {
      issue('我的页学科摘要', `重排后第 ${index + 1} 项应以 ${prefix} 开头，实际 ${reorderedItems[index]}`);
    }
  });
  if (!reorderedItems.some((item) => item.includes('5 科目录'))) {
    issue('我的页学科摘要', '重排五科后目录数量文案不正确');
  }
  const syntheticSubject = {
    id: 'biology',
    name: '初中生物',
    shortName: '生物',
    counts: { topic: 8, knowledge: 32 },
    topicCount: 8,
    knowledgeCount: 32,
  };
  const syntheticItems = profileModule.buildSubjectVersionItems([...reordered, syntheticSubject]);
  if (!syntheticItems.some((item) => item === '生物：8 专题 · 32 知识点')) {
    issue('我的页学科摘要', `合成生物摘要缺失：${syntheticItems.join(' | ')}`);
  }
  if (syntheticItems.some((item) => item.includes('undefined'))) {
    issue('我的页学科摘要', '合成生物摘要存在 undefined');
  }
}
delete global.Page;

const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
if (!appConfig.pages.includes('pages/reference-index/index')) issue('页面配置', 'app.json 未注册知识索引页');

if (issues.length) {
  console.log('FOUND_REFERENCE_INDEX_ISSUES');
  issues.forEach((item) => console.log(item));
  process.exit(1);
}

console.log(`OK ${allKeys.size} reference entries: ${mathFormulaCount} math formulas, ${physicsFormulaCount} physics formulas, 336 words, 84 grammar points, 43 experiments and 28 equations checked`);
