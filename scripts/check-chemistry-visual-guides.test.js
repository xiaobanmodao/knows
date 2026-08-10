const assert = require('assert');
const { collectChemistryVisualGuideIssues } = require('./chemistry-visual-guide-contract');
const {
  getVisualGuideForKnowledge,
  visualGuidesByKnowledgeId,
} = require('../packages/chemistry/data/chemistry-visual-guides');
const { knowledgeItems } = require('../packages/chemistry/data/chemistry-knowledge');
const repository = require('../packages/chemistry/repository');

const foundationIds = [
  'chem-k-lab-object-change', 'chem-k-lab-instruments', 'chem-k-lab-operations',
  'chem-k-lab-inquiry', 'chem-k-air-composition', 'chem-k-oxygen-properties',
  'chem-k-oxygen-preparation', 'chem-k-combustion-catalyst', 'chem-k-water-composition',
  'chem-k-water-purification', 'chem-k-dissolution-solubility',
  'chem-k-solution-concentration', 'chem-k-particles', 'chem-k-atomic-structure',
  'chem-k-elements-periodic-table', 'chem-k-formula-valence',
  'chem-k-symbols-formulas', 'chem-k-mass-conservation', 'chem-k-equations',
  'chem-k-stoichiometry',
].sort();

foundationIds.forEach((knowledgeId) => {
  assert(visualGuidesByKnowledgeId[knowledgeId], `${knowledgeId} must have a source guide`);
});
assert.strictEqual(getVisualGuideForKnowledge('chem-k-unknown'), null);

assert.strictEqual(Object.keys(visualGuidesByKnowledgeId).length, 40);
assert.strictEqual(knowledgeItems.length, 40);
knowledgeItems.forEach((knowledge) => {
  assert(knowledge.visualGuide, `${knowledge.id} must have a visual guide`);
  assert.notStrictEqual(
    knowledge.visualGuide,
    getVisualGuideForKnowledge(knowledge.id),
    `${knowledge.id} guide must be cloned`,
  );
});
assert.deepStrictEqual(
  collectChemistryVisualGuideIssues({
    sourceKnowledgeItems: knowledgeItems,
    runtimeLayers: [{
      label: 'repository',
      knowledgeItems: knowledgeItems.map((knowledge) => repository.getKnowledgeById(knowledge.id)),
    }],
  }),
  [],
);

const guideTypes = Object.entries(visualGuidesByKnowledgeId)
  .map(([knowledgeId, guide]) => ({ knowledgeId, type: guide.type }));
assert.deepStrictEqual(
  guideTypes.filter((guide) => guide.type === 'cycle').map((guide) => guide.knowledgeId),
  ['chem-k-resources-environment'],
);
['flow', 'compare', 'hierarchy'].forEach((type) => {
  assert(guideTypes.some((guide) => guide.type === type), `must include a ${type} guide`);
});

const sourceOxygenGuide = visualGuidesByKnowledgeId['chem-k-oxygen-properties'];
assert(Object.isFrozen(visualGuidesByKnowledgeId));
assert(Object.isFrozen(sourceOxygenGuide));
assert(Object.isFrozen(sourceOxygenGuide.items));
assert(Object.isFrozen(sourceOxygenGuide.items[0]));

const first = getVisualGuideForKnowledge('chem-k-oxygen-preparation');
const second = getVisualGuideForKnowledge('chem-k-oxygen-preparation');
assert.notStrictEqual(first, second);
assert.notStrictEqual(first.items, second.items);
first.items[0].label = '篡改';
assert.strictEqual(second.items[0].label, '选择反应和装置');

const guide = {
  type: 'flow',
  title: '实验阅读顺序',
  summary: '用顺序区分操作、观察与结论。',
  items: [
    { label: '操作条件', note: '先确认题目给出的条件。', tone: 'blue' },
    { label: '观察记录', note: '记录可直接看到的现象。', tone: 'green' },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixture() {
  return {
    sourceKnowledgeItems: [{ id: 'chem-k-fixture', visualGuide: clone(guide) }],
    runtimeLayers: [{
      label: 'repository',
      knowledgeItems: [{ id: 'chem-k-fixture', visualGuide: clone(guide) }],
    }],
  };
}

function replaceGuide(data, nextGuide) {
  data.sourceKnowledgeItems[0].visualGuide = clone(nextGuide);
  data.runtimeLayers[0].knowledgeItems[0].visualGuide = clone(nextGuide);
}

function expectIssue(mutator, message) {
  const data = fixture();
  mutator(data);
  assert.throws(
    () => assert.deepStrictEqual(collectChemistryVisualGuideIssues(data), []),
    new RegExp(message),
  );
}

assert.deepStrictEqual(collectChemistryVisualGuideIssues(fixture()), []);

const invalidTone = fixture();
invalidTone.sourceKnowledgeItems[0].visualGuide.items[0].tone = 'red';
invalidTone.runtimeLayers[0].knowledgeItems[0].visualGuide.items[0].tone = 'red';
assert.throws(
  () => assert.deepStrictEqual(collectChemistryVisualGuideIssues(invalidTone), []),
  /色调/,
);

const compareWithoutRight = {
  type: 'compare',
  title: '两类物质比较',
  summary: '比较两类物质的特征。',
  items: [
    { label: '左侧项目', note: '左列内容。', tone: 'blue', lane: 'left' },
    { label: '无右列', note: '必须归入右列。', tone: 'green' },
  ],
};
const hierarchyDepthThree = {
  type: 'hierarchy',
  title: '物质层级',
  summary: '按类别整理物质。',
  items: [
    { label: '物质', note: '最上层类别。', tone: 'slate', depth: 0 },
    { label: '错误层级', note: '层级只允许到第二层。', tone: 'amber', depth: 3 },
  ],
};
const falseCycle = {
  type: 'cycle',
  title: '资源关系',
  summary: '最后一个环节直接导致第一个环节开始。',
  items: [
    { label: '资源使用', note: '按照需要使用资源。', tone: 'blue' },
    { label: '回收处理', note: '减少对环境的影响。', tone: 'green' },
  ],
};

expectIssue((data) => replaceGuide(data, compareWithoutRight), '右侧 lane');
expectIssue((data) => replaceGuide(data, hierarchyDepthThree), 'depth');
expectIssue((data) => replaceGuide(data, falseCycle), '末尾节点直接导致起点');

expectIssue((data) => {
  data.sourceKnowledgeItems[0].visualGuide.items[0].lane = 'left';
  data.runtimeLayers[0].knowledgeItems[0].visualGuide.items[0].lane = 'left';
}, '不得包含 lane');

expectIssue((data) => {
  data.sourceKnowledgeItems[0].visualGuide.items[0].depth = 0;
  data.runtimeLayers[0].knowledgeItems[0].visualGuide.items[0].depth = 0;
}, '不得包含 depth');

expectIssue((data) => {
  data.sourceKnowledgeItems[0].visualGuide.items[1].label = '操作条件';
  data.runtimeLayers[0].knowledgeItems[0].visualGuide.items[1].label = '操作条件';
}, '标签重复');

expectIssue((data) => {
  data.sourceKnowledgeItems[0].visualGuide.title = '长'.repeat(25);
  data.runtimeLayers[0].knowledgeItems[0].visualGuide.title = '长'.repeat(25);
}, '图解标题长度超出');

expectIssue((data) => {
  data.sourceKnowledgeItems[0].visualGuide.summary = 'https://example.com';
  data.runtimeLayers[0].knowledgeItems[0].visualGuide.summary = 'https://example.com';
}, 'URL 或 HTML');

expectIssue((data) => {
  data.runtimeLayers[0].knowledgeItems[0].visualGuide.summary = '被单独篡改的摘要';
}, '字段与源数据不一致');

expectIssue((data) => {
  data.sourceKnowledgeItems.push({ id: 'chem-k-fixture', visualGuide: clone(guide) });
}, '源数据图解归属不一致：知识点 ID 重复');

const untouched = fixture();
const snapshot = JSON.stringify(untouched);
collectChemistryVisualGuideIssues(untouched);
assert.strictEqual(JSON.stringify(untouched), snapshot);

console.log('OK chemistry visual guide contract test');
