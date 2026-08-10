const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { themes } = require('../packages/chemistry/data/chemistry-themes');
const { topics: chemistryTopics } = require('../packages/chemistry/data/chemistry-topics');
const { templates: chemistryTemplates } = require('../packages/chemistry/data/chemistry-templates');
const { knowledgeItems: chemistryKnowledge } = require('../packages/chemistry/data/chemistry-knowledge');
const { topics: biologyTopics } = require('../packages/biology/data/biology-topics');
const { templates: biologyTemplates } = require('../packages/biology/data/biology-templates');
const { knowledgeItems: biologyKnowledge } = require('../packages/biology/data/biology-knowledge');

const CHEMISTRY_HIGH_RISK_BATCHES = Object.freeze([
  Object.freeze({
    id: 'chemistry-inquiry-high-risk-v1.11',
    themeId: 'chem-theme-inquiry',
    label: '科学探究与化学实验',
    topics: 1,
    knowledge: 4,
    templates: 3,
    equations: 1,
    experiments: 0,
  }),
  Object.freeze({
    id: 'chemistry-properties-high-risk-v1.11',
    themeId: 'chem-theme-properties',
    label: '物质的性质与应用',
    topics: 6,
    knowledge: 24,
    templates: 8,
    equations: 23,
    experiments: 8,
  }),
  Object.freeze({
    id: 'chemistry-structure-high-risk-v1.11',
    themeId: 'chem-theme-structure',
    label: '物质的组成与结构',
    topics: 1,
    knowledge: 4,
    templates: 1,
    equations: 0,
    experiments: 0,
  }),
  Object.freeze({
    id: 'chemistry-change-high-risk-v1.11',
    themeId: 'chem-theme-change',
    label: '物质的化学变化',
    topics: 1,
    knowledge: 4,
    templates: 4,
    equations: 4,
    experiments: 0,
  }),
  Object.freeze({
    id: 'chemistry-society-high-risk-v1.11',
    themeId: 'chem-theme-society',
    label: '化学与社会·跨学科实践',
    topics: 1,
    knowledge: 4,
    templates: 2,
    equations: 0,
    experiments: 0,
  }),
]);

const BIOLOGY_HIGH_RISK_BATCHES = Object.freeze([
  Object.freeze({ id: 'biology-cells-high-risk-v1.11', topicId: 'bio-unit-cells', label: '生物和细胞', safetyObservations: 1 }),
  Object.freeze({ id: 'biology-diversity-high-risk-v1.11', topicId: 'bio-unit-diversity', label: '多种多样的生物', safetyObservations: 0 }),
  Object.freeze({ id: 'biology-plants-high-risk-v1.11', topicId: 'bio-unit-plants', label: '植物的生活', safetyObservations: 1 }),
  Object.freeze({ id: 'biology-health-high-risk-v1.11', topicId: 'bio-unit-health', label: '人体生理与健康', safetyObservations: 2 }),
  Object.freeze({ id: 'biology-environment-high-risk-v1.11', topicId: 'bio-unit-environment', label: '生物与环境', safetyObservations: 1 }),
  Object.freeze({ id: 'biology-evolution-high-risk-v1.11', topicId: 'bio-unit-evolution', label: '生命的延续和发展', safetyObservations: 1 }),
]);

const DEFAULT_CHEMISTRY_DATA = {
  themes,
  topics: chemistryTopics,
  templates: chemistryTemplates,
  knowledgeItems: chemistryKnowledge,
};
const DEFAULT_BIOLOGY_DATA = {
  topics: biologyTopics,
  templates: biologyTemplates,
  knowledgeItems: biologyKnowledge,
};

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function requireText(owner, value, field) {
  assert.ok(typeof value === 'string' && value.trim(), `${owner}: 缺少 ${field}`);
}

function requireList(owner, value, minimum, field) {
  assert.ok(Array.isArray(value) && value.length >= minimum, `${owner}: ${field} 至少 ${minimum} 项`);
}

function assertUniqueIds(records, label) {
  const ids = records.map((record) => record.id);
  assert.strictEqual(new Set(ids).size, ids.length, `${label}: ID 必须唯一`);
}

function assertReview(owner, record) {
  const review = record && (record.review || record.contentMeta);
  assert.ok(review, `${owner}: 缺少复核元数据`);
  assert.ok(['verified', 'reviewed'].includes(review.status), `${owner}: 复核状态无效`);
  requireText(owner, review.reviewedAt, '复核日期');
  requireList(owner, review.sourceKeys, 1, '来源键');
  return review;
}

function countReview(records) {
  return records.reduce((counts, record) => {
    const review = record.review || record.contentMeta;
    const status = review && review.status;
    if (status === 'verified') counts.verified += 1;
    else if (status === 'reviewed') counts.reviewed += 1;
    else counts.untracked += 1;
    return counts;
  }, { verified: 0, reviewed: 0, untracked: 0 });
}

function validateChemistrySection(owner, section) {
  requireText(owner, section.type, '区块类型');
  if (section.type === 'equation') {
    ['equationId', 'equation', 'condition', 'interpretation', 'ratioNote'].forEach((field) => {
      requireText(owner, section[field], field);
    });
    assert.strictEqual(typeof section.phenomenon, 'string', `${owner}: phenomenon 必须为字符串`);
    return;
  }
  if (section.type === 'experiment') {
    ['experimentId', 'purpose', 'phenomenon', 'conclusion', 'safety'].forEach((field) => {
      requireText(owner, section[field], field);
    });
    ['apparatus', 'steps', 'errors'].forEach((field) => requireList(owner, section[field], 2, field));
    assert.strictEqual(section.primary, true, `${owner}: primary 实验标记无效`);
  }
}

function validateChemistryBatch(batch, data = DEFAULT_CHEMISTRY_DATA) {
  const theme = data.themes.find((item) => item.id === batch.themeId);
  assert.ok(theme, `${batch.id}: 主题不存在`);
  assertReview(`${batch.id}/${theme.id}`, theme);

  const topicById = new Map(data.topics.map((item) => [item.id, item]));
  const knowledgeById = new Map(data.knowledgeItems.map((item) => [item.id, item]));
  const templateById = new Map(data.templates.map((item) => [item.id, item]));
  const topics = theme.topicIds.map((topicId) => {
    const topic = topicById.get(topicId);
    assert.ok(topic, `${batch.id}: 主题引用了不存在的专题 ${topicId}`);
    assert.strictEqual(topic.themeId, theme.id, `${batch.id}/${topic.id}: 父级主题不一致`);
    assertReview(`${batch.id}/${topic.id}`, topic);
    topic.templateIds.forEach((templateId) => {
      const template = templateById.get(templateId);
      assert.ok(template, `${batch.id}/${topic.id}: 缺少方法模板 ${templateId}`);
      assert.ok(template.topicIds.includes(topic.id), `${batch.id}/${templateId}: 未登记专题 ${topic.id}`);
    });
    return topic;
  });
  assert.strictEqual(topics.length, batch.topics, `${batch.id}: 专题数量不符`);

  const knowledge = topics.flatMap((topic) => topic.knowledgeIds.map((knowledgeId) => {
    const item = knowledgeById.get(knowledgeId);
    assert.ok(item, `${batch.id}/${topic.id}: 缺少知识点 ${knowledgeId}`);
    assert.strictEqual(item.topicId, topic.id, `${batch.id}/${item.id}: 父级专题不一致`);
    assertReview(`${batch.id}/${item.id}`, item);
    assert(Array.isArray(item.sections), `${batch.id}/${item.id}: sections 缺失`);
    item.templateIds.forEach((templateId) => assert.ok(templateById.has(templateId), `${batch.id}/${item.id}: 方法模板不存在 ${templateId}`));
    item.sections.forEach((section, index) => validateChemistrySection(`${batch.id}/${item.id}/sections/${index}`, section));
    return item;
  }));
  assert.strictEqual(knowledge.length, batch.knowledge, `${batch.id}: 知识点数量不符`);

  const templateIds = [...new Set(topics.flatMap((topic) => topic.templateIds))];
  const batchTemplates = templateIds.map((templateId) => {
    const template = templateById.get(templateId);
    assert.ok(template, `${batch.id}: 缺少方法模板 ${templateId}`);
    assert.ok(topics.some((topic) => template.topicIds.includes(topic.id)), `${batch.id}/${template.id}: 专题引用缺失`);
    assertReview(`${batch.id}/${template.id}`, template);
    return template;
  });
  assert.strictEqual(batchTemplates.length, batch.templates, `${batch.id}: 方法模板数量不符`);

  const equations = knowledge.flatMap((item) => item.sections.filter((section) => section.type === 'equation'));
  const experiments = knowledge.flatMap((item) => item.sections.filter((section) => section.type === 'experiment'));
  assert.strictEqual(new Set(equations.map((section) => section.equationId)).size, equations.length, `${batch.id}: 方程式 ID 重复`);
  assert.strictEqual(new Set(experiments.map((section) => section.experimentId)).size, experiments.length, `${batch.id}: 实验 ID 重复`);
  assert.strictEqual(equations.length, batch.equations, `${batch.id}: 方程式数量不符`);
  assert.strictEqual(experiments.length, batch.experiments, `${batch.id}: 实验数量不符`);

  return {
    id: batch.id,
    subjectId: 'chemistry',
    label: batch.label,
    status: 'passed',
    counts: {
      themes: 1,
      topics: topics.length,
      knowledge: knowledge.length,
      templates: batchTemplates.length,
      equations: equations.length,
      experiments: experiments.length,
    },
    review: countReview([...topics, ...knowledge, ...batchTemplates]),
  };
}

function validateBiologyObservation(owner, observation) {
  assert.ok(observation, `${owner}: 观察记录缺失`);
  ['context', 'precautions', 'emergencyNote'].forEach((field) => requireText(owner, observation[field], field));
  requireList(owner, observation.steps, 2, '步骤');
  assertReview(owner, observation);
}

function validateBiologyBatch(batch, data = DEFAULT_BIOLOGY_DATA) {
  const topic = data.topics.find((item) => item.id === batch.topicId);
  assert.ok(topic, `${batch.id}: 专题不存在`);
  assertReview(`${batch.id}/${topic.id}`, topic);
  const knowledgeById = new Map(data.knowledgeItems.map((item) => [item.id, item]));
  const templateById = new Map(data.templates.map((item) => [item.id, item]));
  const knowledge = topic.knowledgeIds.map((knowledgeId) => {
    const item = knowledgeById.get(knowledgeId);
    assert.ok(item, `${batch.id}: 缺少知识点 ${knowledgeId}`);
    assert.strictEqual(item.topicId, topic.id, `${batch.id}/${item.id}: 父级专题不一致`);
    assertReview(`${batch.id}/${item.id}`, item);
    requireList(`${batch.id}/${item.id}`, item.examples, 3, '例子');
    item.examples.forEach((example, index) => {
      ['id', 'scenario', 'explanation', 'conclusion'].forEach((field) => requireText(`${batch.id}/${item.id}/examples/${index}`, example[field], field));
    });
    if (item.safetyObservation) validateBiologyObservation(`${batch.id}/${item.id}/safetyObservation`, item.safetyObservation);
    item.templateIds.forEach((templateId) => assert.ok(templateById.has(templateId), `${batch.id}/${item.id}: 方法模板不存在 ${templateId}`));
    return item;
  });
  assert.strictEqual(knowledge.length, 6, `${batch.id}: 知识点数量不符`);
  const templateIds = [...new Set(topic.templateIds)];
  const batchTemplates = templateIds.map((templateId) => {
    const template = templateById.get(templateId);
    assert.ok(template, `${batch.id}: 缺少方法模板 ${templateId}`);
    assert(template.topicIds.includes(topic.id), `${batch.id}/${template.id}: 专题引用缺失`);
    assertReview(`${batch.id}/${template.id}`, template);
    return template;
  });
  assert.strictEqual(batchTemplates.length, 1, `${batch.id}: 方法模板数量不符`);
  const examples = knowledge.reduce((sum, item) => sum + item.examples.length, 0);
  const safetyObservations = knowledge.filter((item) => item.safetyObservation).length;
  assert.strictEqual(examples, 18, `${batch.id}: 例子数量不符`);
  assert.strictEqual(safetyObservations, batch.safetyObservations, `${batch.id}: 观察记录数量不符`);

  return {
    id: batch.id,
    subjectId: 'biology',
    label: batch.label,
    status: 'passed',
    counts: {
      topics: 1,
      knowledge: knowledge.length,
      templates: batchTemplates.length,
      examples,
      safetyObservations,
    },
    review: countReview([topic, ...knowledge, ...batchTemplates]),
  };
}

function buildFoundationHighRiskBatchReport({ chemistryData = DEFAULT_CHEMISTRY_DATA, biologyData = DEFAULT_BIOLOGY_DATA } = {}) {
  const allChemistryEntities = [...chemistryData.themes, ...chemistryData.topics, ...chemistryData.templates, ...chemistryData.knowledgeItems];
  const allBiologyEntities = [...biologyData.topics, ...biologyData.templates, ...biologyData.knowledgeItems];
  assertUniqueIds(allChemistryEntities, '化学实体');
  assertUniqueIds(allBiologyEntities, '生物实体');
  const chemistryResults = CHEMISTRY_HIGH_RISK_BATCHES.map((batch) => validateChemistryBatch(batch, chemistryData));
  const biologyResults = BIOLOGY_HIGH_RISK_BATCHES.map((batch) => validateBiologyBatch(batch, biologyData));
  return {
    schemaVersion: 1,
    sourceHash: hash({ chemistry: allChemistryEntities, biology: allBiologyEntities }),
    batches: [...chemistryResults, ...biologyResults],
    totals: {
      chemistry: {
        themes: chemistryData.themes.length,
        topics: chemistryData.topics.length,
        knowledge: chemistryData.knowledgeItems.length,
        templates: chemistryData.templates.length,
        equations: new Set(chemistryData.knowledgeItems.flatMap((item) => item.sections).filter((section) => section.type === 'equation').map((section) => section.equationId)).size,
        experiments: new Set(chemistryData.knowledgeItems.flatMap((item) => item.sections).filter((section) => section.type === 'experiment').map((section) => section.experimentId)).size,
      },
      biology: {
        topics: biologyData.topics.length,
        knowledge: biologyData.knowledgeItems.length,
        templates: biologyData.templates.length,
        examples: biologyData.knowledgeItems.reduce((sum, item) => sum + item.examples.length, 0),
        safetyObservations: biologyData.knowledgeItems.filter((item) => item.safetyObservation).length,
      },
    },
  };
}

function writeReport(report, outputPath) {
  const absolutePath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return absolutePath;
}

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const report = buildFoundationHighRiskBatchReport();
  const outputPath = getOption('--report');
  if (outputPath) console.log(`Report: ${writeReport(report, outputPath)}`);
  report.batches.forEach((batch) => console.log(`OK high-risk batch ${batch.id}: ${JSON.stringify(batch.counts)}`));
  console.log(`OK chemistry biology high-risk batches: ${report.batches.length} batches, source ${report.sourceHash}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FOUND_CHEMISTRY_BIOLOGY_HIGH_RISK_BATCH_ISSUES\n${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  BIOLOGY_HIGH_RISK_BATCHES,
  CHEMISTRY_HIGH_RISK_BATCHES,
  buildFoundationHighRiskBatchReport,
  validateBiologyBatch,
  validateChemistryBatch,
};
