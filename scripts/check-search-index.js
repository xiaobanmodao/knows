const fs = require('fs');
const path = require('path');

const { buildSearchIndex, renderSearchIndexModule } = require('./search-index-builder');
const { SEARCH_INDEX_META, SEARCH_INDEX_ROWS } = require('../data/search-index');
const { searchAllSubjects } = require('../utils/search-index');

const root = path.resolve(__dirname, '..');
const generatedPath = path.join(root, 'data/search-index.js');
const built = buildSearchIndex();
const issues = [];

if (fs.readFileSync(generatedPath, 'utf8') !== renderSearchIndexModule(built)) {
  issues.push('data/search-index.js 与当前内容源不一致，请运行 node scripts/build-search-index.js');
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
];

canonicalChecks.forEach(([keyword, subjectId]) => {
  const [result] = searchAllSubjects(keyword);
  if (!result || result.subjectId !== subjectId) {
    issues.push(`搜索“${keyword}”未命中预期学科 ${subjectId}`);
  }
});

if (issues.length) {
  console.log('FOUND_SEARCH_INDEX_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK ${built.meta.entryCount} generated search entries and source hash checked`);
