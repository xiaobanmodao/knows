const assert = require('assert');
const { topics } = require('../packages/biology/data/biology-topics');
const { knowledgeItems } = require('../packages/biology/data/biology-knowledge');
const { templates } = require('../packages/biology/data/biology-templates');

const FORBIDDEN_FIELDS = new Set([
  'assessment', 'assessments', 'answerSubmission', 'checkpoint', 'checkpoints',
  'outputTask', 'outputTasks', 'problem', 'problems', 'progress', 'quiz',
  'quizzes', 'score', 'task', 'tasks',
]);

function assertText(value, label) {
  assert.strictEqual(typeof value, 'string', `${label} must be a string`);
  assert(value.trim(), `${label} must not be empty`);
}

function rejectForbidden(value, path = 'biology') {
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, child]) => {
    assert(!FORBIDDEN_FIELDS.has(key), `${path}.${key} is forbidden`);
    rejectForbidden(child, `${path}.${key}`);
  });
}

assert.strictEqual(topics.length, 6, 'biology unit count');
assert.strictEqual(knowledgeItems.length, 36, 'biology knowledge count');
assert.strictEqual(templates.length, 6, 'biology template count');

const entityIds = [...topics, ...knowledgeItems, ...templates].map((item) => item.id);
assert.strictEqual(new Set(entityIds).size, entityIds.length, 'biology entity IDs must be unique');
entityIds.forEach((id) => assert(id.startsWith('bio-'), `${id} must start with bio-`));

const unitIds = topics.map((topic) => topic.id);
assert.strictEqual(new Set(unitIds).size, 6, 'unit IDs must be unique');
const topicById = new Map(topics.map((topic) => [topic.id, topic]));
const knowledgeById = new Map(knowledgeItems.map((item) => [item.id, item]));
const templateById = new Map(templates.map((item) => [item.id, item]));

topics.forEach((topic) => {
  ['subjectId', 'unitLabel', 'title', 'summary'].forEach((field) => assertText(topic[field], `${topic.id}.${field}`));
  assert.strictEqual(topic.subjectId, 'biology', `${topic.id}.subjectId`);
  assert(Array.isArray(topic.gradeBands) && topic.gradeBands.length > 0, `${topic.id}.gradeBands`);
  assert(Array.isArray(topic.keywords) && topic.keywords.length >= 4, `${topic.id}.keywords`);
  assert.strictEqual(topic.knowledgeIds.length, 6, `${topic.id} knowledge count`);
  assert(topic.templateIds.length >= 1, `${topic.id}.templateIds`);
  topic.knowledgeIds.forEach((knowledgeId) => {
    const knowledge = knowledgeById.get(knowledgeId);
    assert(knowledge, `${topic.id} references missing knowledge ${knowledgeId}`);
    assert.strictEqual(knowledge.topicId, topic.id, `${knowledgeId} parent topic`);
  });
  topic.templateIds.forEach((templateId) => assert(templateById.has(templateId), `${topic.id} missing template ${templateId}`));
});

let exampleCount = 0;
let safetyCount = 0;
knowledgeItems.forEach((knowledge) => {
  ['subjectId', 'topicId', 'title', 'summary', 'boundary'].forEach((field) => assertText(knowledge[field], `${knowledge.id}.${field}`));
  assert.strictEqual(knowledge.subjectId, 'biology', `${knowledge.id}.subjectId`);
  assert(topicById.has(knowledge.topicId), `${knowledge.id} unknown topic`);
  assert(Array.isArray(knowledge.knowledgePoints) && knowledge.knowledgePoints.length >= 3, `${knowledge.id}.knowledgePoints`);
  assert(Array.isArray(knowledge.pitfalls) && knowledge.pitfalls.length >= 1, `${knowledge.id}.pitfalls`);
  assert.strictEqual(knowledge.examples.length, 3, `${knowledge.id} example count`);
  knowledge.examples.forEach((example) => {
    assert(example.id.startsWith('bio-ex-'), `${knowledge.id} example ID`);
    ['scenario', 'explanation', 'conclusion'].forEach((field) => assertText(example[field], `${example.id}.${field}`));
    exampleCount += 1;
  });
  if (knowledge.safetyObservation) {
    safetyCount += 1;
    ['context', 'precautions', 'emergencyNote'].forEach((field) => assertText(knowledge.safetyObservation[field], `${knowledge.id}.safetyObservation.${field}`));
    assert(Array.isArray(knowledge.safetyObservation.steps) && knowledge.safetyObservation.steps.length >= 2, `${knowledge.id}.safetyObservation.steps`);
  }
  knowledge.templateIds.forEach((templateId) => assert(templateById.has(templateId), `${knowledge.id} missing template ${templateId}`));
});

assert.strictEqual(exampleCount, 108, 'biology example count');
assert.strictEqual(safetyCount, 6, 'biology safety observation count');
templates.forEach((template) => {
  assert(template.id.startsWith('bio-tpl-'), `${template.id} must start with bio-tpl-`);
  assert(Array.isArray(template.topicIds) && template.topicIds.length >= 1, `${template.id}.topicIds`);
  template.topicIds.forEach((topicId) => assert(topicById.has(topicId), `${template.id} missing topic ${topicId}`));
});

rejectForbidden({ topics, knowledgeItems, templates });
console.log(`OK biology: ${topics.length} units, ${knowledgeItems.length} knowledge items, ${templates.length} templates, ${exampleCount} examples`);
