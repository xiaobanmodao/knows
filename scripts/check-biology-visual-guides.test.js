const assert = require('assert');

const { collectBiologyVisualGuideIssues } = require('./biology-visual-guide-contract');
const { knowledgeItems } = require('../packages/biology/data/biology-knowledge');
const repository = require('../packages/biology/repository');
const {
  getVisualGuideForKnowledge,
  visualGuidesByKnowledgeId,
} = require('../packages/biology/data/biology-visual-guides');

const validGuide = {
  type: 'flow',
  title: '观察路径',
  summary: '按顺序整理可观察的关系。',
  items: [
    { label: '条件', note: '先记录观察条件', tone: 'blue' },
    { label: '结论', note: '结论不超出证据范围', tone: 'green' },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixture() {
  return {
    sourceKnowledgeItems: [{ id: 'bio-k-fixture', visualGuide: clone(validGuide) }],
    runtimeLayers: [{
      label: '知识页',
      knowledgeItems: [{ id: 'bio-k-fixture', visualGuide: clone(validGuide) }],
    }],
  };
}

function mutateFixtureGuide(data, mutator) {
  mutator(data.sourceKnowledgeItems[0].visualGuide);
  mutator(data.runtimeLayers[0].knowledgeItems[0].visualGuide);
}

function replaceFixtureGuide(data, guide) {
  data.sourceKnowledgeItems[0].visualGuide = clone(guide);
  data.runtimeLayers[0].knowledgeItems[0].visualGuide = clone(guide);
}

function expectIssue(mutator, message) {
  const data = fixture();
  mutator(data);
  assert.throws(
    () => assert.deepStrictEqual(collectBiologyVisualGuideIssues(data), []),
    new RegExp(message),
  );
}

assert.deepStrictEqual(collectBiologyVisualGuideIssues(fixture()), []);
const independentFixture = fixture();
assert.notStrictEqual(
  independentFixture.sourceKnowledgeItems[0].visualGuide,
  independentFixture.runtimeLayers[0].knowledgeItems[0].visualGuide,
  'fixture source/runtime guides must be independent clones',
);
assert.notStrictEqual(
  independentFixture.sourceKnowledgeItems[0].visualGuide.items,
  independentFixture.runtimeLayers[0].knowledgeItems[0].visualGuide.items,
  'fixture source/runtime guide items must be independent clones',
);

expectIssue((data) => {
  delete data.sourceKnowledgeItems[0].visualGuide;
}, '缺少图解');

expectIssue((data) => {
  data.sourceKnowledgeItems[0].visualGuide.items[0].tone = 'red';
}, '色调');

expectIssue((data) => {
  data.sourceKnowledgeItems[0].visualGuide.items[1].label = '条件';
}, '标签重复');

expectIssue((data) => {
  const compareGuide = {
    type: 'compare',
    title: '比较路径',
    summary: '按两侧整理差异。',
    items: [
      { label: '左侧', note: '第一侧', tone: 'blue', lane: 'left' },
      { label: '无侧', note: '缺少右侧归属', tone: 'green' },
    ],
  };
  data.sourceKnowledgeItems[0].visualGuide = compareGuide;
  data.runtimeLayers[0].knowledgeItems[0].visualGuide = JSON.parse(JSON.stringify(compareGuide));
}, '右侧 lane');

expectIssue((data) => {
  const hierarchyGuide = {
    type: 'hierarchy',
    title: '层级路径',
    summary: '按层级整理关系。',
    items: [
      { label: '根', note: '最高层级', tone: 'slate', depth: 0 },
      { label: '分支', note: '超出允许上界', tone: 'green', depth: 3 },
    ],
  };
  data.sourceKnowledgeItems[0].visualGuide = hierarchyGuide;
  data.runtimeLayers[0].knowledgeItems[0].visualGuide = JSON.parse(JSON.stringify(hierarchyGuide));
}, 'depth');

expectIssue((data) => {
  mutateFixtureGuide(data, (guide) => {
    guide.items[0].lane = 'left';
  });
}, '不得包含 lane');

expectIssue((data) => {
  mutateFixtureGuide(data, (guide) => {
    guide.items[0].depth = 0;
  });
}, '不得包含 depth');

expectIssue((data) => {
  mutateFixtureGuide(data, (guide) => {
    guide.title = '长'.repeat(1200);
  });
}, '图解标题长度超出');

expectIssue((data) => {
  mutateFixtureGuide(data, (guide) => {
    guide.summary = '长'.repeat(1200);
  });
}, '图解摘要长度超出');

expectIssue((data) => {
  mutateFixtureGuide(data, (guide) => {
    guide.items[0].label = '长'.repeat(1200);
  });
}, '节点 1标签长度超出');

expectIssue((data) => {
  mutateFixtureGuide(data, (guide) => {
    guide.items[0].note = '长'.repeat(1200);
  });
}, '节点 1说明长度超出');

expectIssue((data) => {
  const cycleGuide = clone(validGuide);
  cycleGuide.type = 'cycle';
  cycleGuide.summary = '最后一个环节直接导致第一个环节开始。';
  replaceFixtureGuide(data, cycleGuide);
}, 'cycle 图解不得声明末尾节点直接导致起点');

expectIssue((data) => {
  const cycleGuide = clone(validGuide);
  cycleGuide.type = 'cycle';
  cycleGuide.summary = '最终阶段使第一阶段重新开始。';
  replaceFixtureGuide(data, cycleGuide);
}, 'cycle 图解不得声明末尾节点直接导致起点');

expectIssue((data) => {
  data.runtimeLayers[0].knowledgeItems[0].visualGuide.summary = '被篡改的摘要';
}, '字段与源数据不一致');

const untouched = fixture();
const snapshot = JSON.stringify(untouched);
collectBiologyVisualGuideIssues(untouched);
assert.strictEqual(JSON.stringify(untouched), snapshot);

const allKnowledgeIds = knowledgeItems.map((item) => item.id)
  .sort();
assert.strictEqual(allKnowledgeIds.length, 36, 'biology visual guide coverage count');
assert.deepStrictEqual(
  Object.keys(visualGuidesByKnowledgeId).sort(),
  allKnowledgeIds,
);
assert.deepStrictEqual(
  collectBiologyVisualGuideIssues({
    sourceKnowledgeItems: allKnowledgeIds.map((id) => ({
      id,
      visualGuide: visualGuidesByKnowledgeId[id],
    })),
  }),
  [],
);
assert.deepStrictEqual(
  collectBiologyVisualGuideIssues({
    sourceKnowledgeItems: knowledgeItems,
    runtimeLayers: [{
      label: 'repository',
      knowledgeItems: allKnowledgeIds.map((id) => repository.getKnowledgeById(id)),
    }],
  }),
  [],
);

assert.deepStrictEqual(
  Object.entries(visualGuidesByKnowledgeId)
    .filter(([, guide]) => guide.type === 'cycle')
    .map(([knowledgeId]) => knowledgeId)
    .sort(),
  ['bio-k-circulation', 'bio-k-ecosystem-function', 'bio-k-respiration-growth'],
);

assert(Object.isFrozen(visualGuidesByKnowledgeId));
assert.strictEqual(getVisualGuideForKnowledge('bio-k-unknown'), null);
knowledgeItems.forEach((knowledge) => {
  assert(knowledge.visualGuide, `${knowledge.id} visual guide`);
  assert.notStrictEqual(
    knowledge.visualGuide,
    getVisualGuideForKnowledge(knowledge.id),
    `${knowledge.id} visual guide is an independent copy`,
  );
  const runtimeKnowledge = repository.getKnowledgeById(knowledge.id);
  assert(runtimeKnowledge.visualGuide, `${knowledge.id} runtime visual guide`);
  assert.notStrictEqual(
    runtimeKnowledge.visualGuide,
    knowledge.visualGuide,
    `${knowledge.id} runtime visual guide is an independent copy`,
  );
  assert.notStrictEqual(
    runtimeKnowledge.visualGuide.items,
    knowledge.visualGuide.items,
    `${knowledge.id} runtime visual guide items are an independent copy`,
  );
});
const firstPhotosynthesisGuide = getVisualGuideForKnowledge('bio-k-photosynthesis');
const secondPhotosynthesisGuide = getVisualGuideForKnowledge('bio-k-photosynthesis');
assert.notStrictEqual(firstPhotosynthesisGuide, secondPhotosynthesisGuide);
assert.notStrictEqual(firstPhotosynthesisGuide.items, secondPhotosynthesisGuide.items);
firstPhotosynthesisGuide.items[0].label = '篡改';
assert.strictEqual(secondPhotosynthesisGuide.items[0].label, '作用条件');
assert.strictEqual(visualGuidesByKnowledgeId['bio-k-photosynthesis'].items[0].label, '作用条件');
const runtimePhotosynthesisGuide = repository.getKnowledgeById('bio-k-photosynthesis').visualGuide;
runtimePhotosynthesisGuide.items[0].label = '篡改';
assert.strictEqual(knowledgeItems.find((item) => item.id === 'bio-k-photosynthesis').visualGuide.items[0].label, '作用条件');
assert.strictEqual(repository.getKnowledgeById('bio-k-photosynthesis').visualGuide.items[0].label, '作用条件');

function labelsFor(knowledgeId) {
  return getVisualGuideForKnowledge(knowledgeId).items.map((item) => item.label);
}

assert.deepStrictEqual(labelsFor('bio-k-science-observation'), [
  '提出可观察问题', '记录条件和事实', '比较与重复', '有范围的结论',
]);
assert.strictEqual(labelsFor('bio-k-cell-life').at(-1), '生命活动');
assert.strictEqual(labelsFor('bio-k-seed-germination').at(-1), '萌发');
assert.deepStrictEqual(labelsFor('bio-k-respiration-growth'), [
  '光合作用制造有机物', '呼吸作用分解释放能量', '细胞活动与生长', '物质和能量变化',
]);
assert.deepStrictEqual(labelsFor('bio-k-circulation'), [
  '心脏推动血液', '血管运输', '毛细血管处物质交换', '血液回流到心脏',
]);
assert.deepStrictEqual(labelsFor('bio-k-digestion'), [
  '食物摄入', '消化分解', '小肠吸收', '营养物质供身体生命活动利用',
]);
assert.deepStrictEqual(labelsFor('bio-k-breathing'), [
  '空气进入呼吸道', '肺部气体交换', '氧进入血液', '细胞利用氧',
]);
const heredityGuide = getVisualGuideForKnowledge('bio-k-heredity-basics');
assert.deepStrictEqual(
  heredityGuide.items.map((item) => [item.label, item.depth]),
  [['细胞核', 0], ['染色体', 1], ['DNA上的基因片段', 2]],
);
assert.match(heredityGuide.items.at(-1).note, /基因是 DNA 上有遗传效应的片段/);
assert.match(heredityGuide.items.at(-1).note, /参与遗传信息表达/);
assert.match(heredityGuide.items.at(-1).note, /性状还受环境影响/);
const structureLevelsGuide = getVisualGuideForKnowledge('bio-k-structure-levels');
assert.strictEqual(structureLevelsGuide.type, 'flow');
assert.deepStrictEqual(
  structureLevelsGuide.items.map((item) => [item.label, item.note]),
  [
    ['细胞', '细胞是构成生物体的基本单位。'],
    ['组织', '形态相似、功能相近的细胞构成组织。'],
    ['器官', '多种组织按一定次序结合形成器官。'],
    ['器官系统或生物体', '人体的器官系统协调活动；植物由器官构成整体。'],
  ],
);
assert(structureLevelsGuide.items.every((item) => !Object.prototype.hasOwnProperty.call(item, 'depth')));

const algaePlantsGuide = getVisualGuideForKnowledge('bio-k-algae-plants');
assert.strictEqual(algaePlantsGuide.type, 'hierarchy');
assert.deepStrictEqual(
  algaePlantsGuide.items.map((item) => [item.label, item.depth]),
  [['常见植物类群', 0], ['藻类', 1], ['苔藓', 1], ['蕨类', 1]],
);
assert(algaePlantsGuide.items.every((item) => !Object.prototype.hasOwnProperty.call(item, 'lane')));

const microorganismsGuide = getVisualGuideForKnowledge('bio-k-microorganisms');
assert.strictEqual(microorganismsGuide.type, 'hierarchy');
assert.deepStrictEqual(
  microorganismsGuide.items.map((item) => [item.label, item.depth]),
  [['常见微生物与病毒', 0], ['细菌', 1], ['真菌', 1], ['病毒', 1]],
);
assert.strictEqual(microorganismsGuide.items[0].note, '包括细菌、真菌和病毒。');
assert(microorganismsGuide.items.every((item) => !Object.prototype.hasOwnProperty.call(item, 'lane')));

assert.deepStrictEqual(
  collectBiologyVisualGuideIssues({
    sourceKnowledgeItems: ['bio-k-circulation', 'bio-k-ecosystem-function', 'bio-k-respiration-growth'].map((id) => ({
      id,
      visualGuide: getVisualGuideForKnowledge(id),
    })),
  }),
  [],
  'existing cycle guides must remain valid',
);
assert.deepStrictEqual(
  getVisualGuideForKnowledge('bio-k-biological-classification').items.map((item) => [item.label, item.depth]),
  [['大分类等级', 0], ['小分类等级', 1], ['种', 2]],
);
assert.deepStrictEqual(
  getVisualGuideForKnowledge('bio-k-leaf-structure').items.map((item) => [item.label, item.depth]),
  [['叶片', 0], ['表皮与气孔', 1], ['叶肉', 1], ['叶脉', 1], ['各自功能', 2]],
);

console.log('OK biology visual guide contract test');
