const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  EVIDENCE_KIND,
  REVIEW_ID,
  buildChemistryTopicFrameworkSnapshot,
  checkChemistryTopicFrameworkEvidence,
} = require('./check-chemistry-topic-framework-evidence');
const { getContentSource } = require('../data/content-source-registry');
const { topics: chemistryTopics } = require('../packages/chemistry/data/chemistry-topics');

assert.strictEqual(EVIDENCE_KIND, 'official-framework-support');
assert.strictEqual(REVIEW_ID, 'chemistry-topic-framework-support-2026-v1');

const missingEvidencePath = path.join(
  os.tmpdir(),
  `knows-chemistry-topic-framework-evidence-${process.pid}-${Date.now()}.json`,
);

assert.throws(
  () => checkChemistryTopicFrameworkEvidence({ evidencePath: missingEvidencePath }),
  /化学专题官方框架佐证记录读取失败/,
);

const defaultRun = spawnSync(process.execPath, [path.join(__dirname, 'check-chemistry-topic-framework-evidence.js')], {
  encoding: 'utf8',
});
assert.strictEqual(defaultRun.status, 1, 'default checker must fail before evidence is added');
assert.match(defaultRun.stderr, /化学专题官方框架佐证记录读取失败/);

const prohibitedEvidencePath = path.join(
  os.tmpdir(),
  `knows-chemistry-topic-framework-prohibited-${process.pid}-${Date.now()}.json`,
);
fs.writeFileSync(prohibitedEvidencePath, JSON.stringify({ chapterOrder: 1 }));
assert.throws(
  () => checkChemistryTopicFrameworkEvidence({ evidencePath: prohibitedEvidencePath }),
  /不得包含教材映射、内容输入或外部来源字段/,
);
fs.rmSync(prohibitedEvidencePath, { force: true });

const frameworkDomainsById = {
  'chem-topic-lab': ['chemical inquiry/laboratory safety'],
  'chem-topic-air-oxygen': ['air/oxygen/combustion'],
  'chem-topic-water-solution': ['water/solutions'],
  'chem-topic-particles-elements': ['particles/elements'],
  'chem-topic-language-conservation': ['chemical language/conservation'],
  'chem-topic-carbon-fuels': ['carbon compounds/fuels'],
  'chem-topic-metals': ['metals/materials'],
  'chem-topic-acids-bases': ['acids/bases'],
  'chem-topic-salts-fertilizers': ['salts/fertilizers'],
  'chem-topic-materials-environment': ['materials/resources/environment'],
};

function createSourceContracts() {
  return [
    ['moe-chemistry-2022', 'curriculum-baseline', '作为义务教育化学课程标准的官方基线，用于宏观课程框架观察。'],
    ['moe-textbook-catalog-2024', 'textbook-edition-catalog', '国家目录列有人教版义务教育教科书化学九年级上下册，作为教材版本与册次的目录观察。'],
    ['pep-chemistry-training-2024', 'textbook-revision-context', '人教社化学编辑室举办新教材培训会，公开说明培训聚焦编写思路和教材修订情况。'],
  ].map(([key, role, observation]) => {
    const source = getContentSource(key);
    return { key, title: source.title, url: source.url, role, observation };
  });
}

function createCompleteEvidence() {
  return {
    schemaVersion: 1,
    reviewId: REVIEW_ID,
    reviewedAt: '2026-08-11',
    evidenceKind: EVIDENCE_KIND,
    scope: {
      supports: [
        '现有原创化学专题与官方公开课程、教材版本语境的宏观领域相容。',
        '专题稳定标识、标题与内部复核快照可追溯。',
      ],
      notVerified: ['教材逐章标题', '教材章节顺序', '教材册次映射', '教材正文与原始插图'],
    },
    sources: createSourceContracts(),
    topics: chemistryTopics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      reviewSnapshotHash: buildChemistryTopicFrameworkSnapshot(topic).hash,
      frameworkDomains: frameworkDomainsById[topic.id],
    })),
  };
}

const sourceDriftEvidencePath = path.join(
  os.tmpdir(),
  `knows-chemistry-topic-framework-source-drift-${process.pid}-${Date.now()}.json`,
);
const sourceContracts = createSourceContracts();
sourceContracts[0].url = `${sourceContracts[0].url}?drift=1`;
const sourceDriftEvidence = createCompleteEvidence();
sourceDriftEvidence.sources = sourceContracts;
fs.writeFileSync(sourceDriftEvidencePath, JSON.stringify(sourceDriftEvidence));
try {
  assert.throws(
    () => checkChemistryTopicFrameworkEvidence({ evidencePath: sourceDriftEvidencePath }),
    /来源 URL 漂移/,
  );
} finally {
  fs.rmSync(sourceDriftEvidencePath, { force: true });
}

const completeEvidencePath = path.join(
  os.tmpdir(),
  `knows-chemistry-topic-framework-complete-${process.pid}-${Date.now()}.json`,
);
fs.writeFileSync(completeEvidencePath, JSON.stringify(createCompleteEvidence()));
try {
  assert.doesNotThrow(() => checkChemistryTopicFrameworkEvidence({ evidencePath: completeEvidencePath }));
} finally {
  fs.rmSync(completeEvidencePath, { force: true });
}

console.log('OK chemistry topic framework evidence contract');
