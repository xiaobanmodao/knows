const assert = require('assert');
const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  DEFAULT_EVIDENCE_PATH,
  EVIDENCE_KIND,
  REVIEW_ID,
  checkBiologyTopicFrameworkEvidence,
} = require('./check-biology-topic-framework-evidence');
const { getContentSource } = require('../data/content-source-registry');
const { getBiologyReview } = require('../packages/biology/data/content-review-meta');
const { topics: biologyTopics } = require('../packages/biology/data/biology-topics');

assert.strictEqual(EVIDENCE_KIND, 'official-framework-support');
assert.strictEqual(REVIEW_ID, 'biology-topic-framework-support-2026-v1');
assert.match(DEFAULT_EVIDENCE_PATH, /docs[\\/]evidence[\\/]biology-topic-framework-review-2026\.json$/);
assert.strictEqual(
  getContentSource('pep-compulsory-biology-textbook').title,
  '人教版义务教育生物学（七～八年级）新教材介绍',
);
assert.strictEqual(
  getBiologyReview().sourceRefs.find((source) => source.key === 'pep-compulsory-biology-textbook').title,
  '人教版义务教育生物学（七至八年级）新教材介绍',
  'Task 2 must not rewrite runtime biology review metadata titles',
);

const evidencePath = path.join(
  os.tmpdir(),
  `knows-biology-topic-framework-evidence-missing-${process.pid}-${Date.now()}.json`,
);

assert.throws(
  () => checkBiologyTopicFrameworkEvidence({ evidencePath }),
  /生物专题官方框架佐证记录读取失败/,
);

const defaultRun = spawnSync(process.execPath, [path.join(__dirname, 'check-biology-topic-framework-evidence.js')], {
  encoding: 'utf8',
});
assert.strictEqual(defaultRun.status, 0);
assert.match(defaultRun.stdout, /OK biology topic framework evidence/);
assert.deepStrictEqual(checkBiologyTopicFrameworkEvidence(), {
  topicCount: 6,
  sourceKeys: ['moe-biology-curriculum-2022', 'pep-compulsory-biology-textbook'],
  evidenceKind: 'official-framework-support',
});

function buildSnapshotHash(topic) {
  return crypto.createHash('sha256').update(JSON.stringify({
    id: topic.id,
    unitLabel: topic.unitLabel,
    title: topic.title,
    summary: topic.summary,
    gradeBands: topic.gradeBands,
    keywords: topic.keywords,
    knowledgeIds: topic.knowledgeIds,
    templateIds: topic.templateIds,
    coverImage: topic.coverImage,
    diagramImage: topic.diagramImage,
  })).digest('hex');
}

function createSourceContracts() {
  return [
    [
      'moe-biology-curriculum-2022',
      'curriculum-baseline',
      '作为义务教育生物学课程标准的官方基线，用于宏观课程框架观察。',
    ],
    [
      'pep-compulsory-biology-textbook',
      'textbook-unit-framework-summary',
      '公开介绍说明教材包括六个单元、对应课程标准前六个学习主题，并概述六个单元的宏观内容。',
    ],
  ].map(([key, role, observation]) => {
    const source = getContentSource(key);
    return { key, title: source.title, url: source.url, role, observation };
  });
}

const frameworkDomainsById = {
  'bio-unit-cells': ['life/cells'],
  'bio-unit-diversity': ['organism diversity/classification'],
  'bio-unit-plants': ['plant life/processes'],
  'bio-unit-health': ['human physiology/health'],
  'bio-unit-environment': ['organism/environment'],
  'bio-unit-evolution': ['continuity/evolution'],
};

function createCompleteEvidence() {
  return {
    schemaVersion: 1,
    reviewId: REVIEW_ID,
    reviewedAt: '2026-08-11',
    evidenceKind: EVIDENCE_KIND,
    scope: {
      supports: [
        '现有原创生物专题与官方公开课程、教材单元框架的宏观领域相容。',
        '专题稳定标识、标题与内部复核快照可追溯。',
      ],
      notVerified: ['教材逐章标题', '教材章节顺序', '教材册次映射', '教材正文与原始插图'],
    },
    sources: createSourceContracts(),
    topics: biologyTopics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      reviewSnapshotHash: buildSnapshotHash(topic),
      frameworkDomains: frameworkDomainsById[topic.id],
    })),
  };
}

const prohibitedEvidencePath = path.join(
  os.tmpdir(),
  `knows-biology-topic-framework-prohibited-${process.pid}-${Date.now()}.json`,
);
fs.writeFileSync(prohibitedEvidencePath, JSON.stringify({ chapterOrder: 1 }));
try {
  assert.throws(
    () => checkBiologyTopicFrameworkEvidence({ evidencePath: prohibitedEvidencePath }),
    /不得包含教材映射、内容输入或外部资源字段/,
  );
} finally {
  fs.rmSync(prohibitedEvidencePath, { force: true });
}

const completeEvidencePath = path.join(
  os.tmpdir(),
  `knows-biology-topic-framework-complete-${process.pid}-${Date.now()}.json`,
);
const completeEvidence = createCompleteEvidence();
fs.writeFileSync(completeEvidencePath, JSON.stringify(completeEvidence));
const reorderedEvidencePath = path.join(
  os.tmpdir(),
  `knows-biology-topic-framework-reordered-${process.pid}-${Date.now()}.json`,
);
fs.writeFileSync(reorderedEvidencePath, JSON.stringify({
  ...completeEvidence,
  topics: [completeEvidence.topics[1], completeEvidence.topics[0], ...completeEvidence.topics.slice(2)],
}));
assert.throws(
  () => checkBiologyTopicFrameworkEvidence({ evidencePath: reorderedEvidencePath }),
  /专题佐证 ID 或顺序漂移/,
);
const originalReview = getBiologyReview;
const biologyReviewModule = require('../packages/biology/data/content-review-meta');
try {
  assert.deepStrictEqual(checkBiologyTopicFrameworkEvidence({ evidencePath: completeEvidencePath }), {
    topicCount: 6,
    sourceKeys: ['moe-biology-curriculum-2022', 'pep-compulsory-biology-textbook'],
    evidenceKind: 'official-framework-support',
  });

  const runtimeReviewSourceKeyDrift = {
    ...biologyReviewModule.BIOLOGY_REVIEW,
    sourceKeys: [...biologyReviewModule.BIOLOGY_REVIEW.sourceKeys],
    sourceRefs: biologyReviewModule.BIOLOGY_REVIEW.sourceRefs.map((source) => (source.key === 'pep-compulsory-biology-textbook'
      ? { key: 'moe-physics-2022', title: '义务教育物理课程标准（2022年版）', url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html' }
      : { ...source })),
  };
  biologyReviewModule.getBiologyReview = () => ({
    ...runtimeReviewSourceKeyDrift,
    sourceKeys: [...runtimeReviewSourceKeyDrift.sourceKeys],
    sourceRefs: runtimeReviewSourceKeyDrift.sourceRefs.map((source) => ({ ...source })),
  });
  assert.throws(
    () => checkBiologyTopicFrameworkEvidence({ evidencePath: completeEvidencePath }),
    /复核来源键不完整/,
  );

  const runtimeReviewUrlDrift = {
    ...biologyReviewModule.BIOLOGY_REVIEW,
    sourceKeys: [...biologyReviewModule.BIOLOGY_REVIEW.sourceKeys],
    sourceRefs: biologyReviewModule.BIOLOGY_REVIEW.sourceRefs.map((source) => (source.key === 'pep-compulsory-biology-textbook'
      ? { ...source, url: `${source.url}?drift=1` }
      : { ...source })),
  };
  biologyReviewModule.getBiologyReview = () => ({
    ...runtimeReviewUrlDrift,
    sourceKeys: [...runtimeReviewUrlDrift.sourceKeys],
    sourceRefs: runtimeReviewUrlDrift.sourceRefs.map((source) => ({ ...source })),
  });
  assert.throws(
    () => checkBiologyTopicFrameworkEvidence({ evidencePath: completeEvidencePath }),
    /复核来源 URL 漂移/,
  );
} finally {
  biologyReviewModule.getBiologyReview = originalReview;
  fs.rmSync(completeEvidencePath, { force: true });
  fs.rmSync(reorderedEvidencePath, { force: true });
}

console.log('OK biology topic framework evidence contract');
