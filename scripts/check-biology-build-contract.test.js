const assert = require('assert');

const biology = require('../packages/biology/data/biology-knowledge');
const { topics } = require('../packages/biology/data/biology-topics');
const repository = require('../packages/biology/repository');
const { getReferenceEntries } = require('../packages/catalog/utils/reference-index');
const { collectBiologyObservationContractIssues } = require('./biology-build-contract');

function makeFixture() {
  const runtimeKnowledgeItems = biology.knowledgeItems.map((knowledge) => (
    repository.getKnowledgeById(knowledge.id)
  ));
  const runtimeTopics = topics.map((topic) => repository.getTopicById(topic.id));
  const home = repository.getSubjectHome();

  return {
    sourceKnowledgeItems: biology.knowledgeItems,
    runtimeLayers: [
      { label: '知识页', knowledgeItems: runtimeKnowledgeItems },
      { label: '单元聚合页', knowledgeItems: runtimeTopics.flatMap((topic) => topic.knowledgeItems) },
      { label: '首页聚合', knowledgeItems: home.topics.flatMap((topic) => topic.knowledgeItems) },
    ],
    referenceEntries: getReferenceEntries('experiment').filter((entry) => entry.subjectId === 'biology'),
  };
}

assert.deepStrictEqual(collectBiologyObservationContractIssues(makeFixture()), []);

const tamperedKnowledge = makeFixture();
const knowledgeObservation = tamperedKnowledge.runtimeLayers[0].knowledgeItems
  .find((knowledge) => knowledge.safetyObservation).safetyObservation;
knowledgeObservation.steps[0] = '篡改后的观察步骤';
assert.throws(
  () => assert.deepStrictEqual(collectBiologyObservationContractIssues(tamperedKnowledge), []),
  /知识页运行时生物观察/,
);

const tamperedTopic = makeFixture();
const topicObservation = tamperedTopic.runtimeLayers[1].knowledgeItems
  .find((knowledge) => knowledge.safetyObservation).safetyObservation;
topicObservation.emergencyNote = '篡改后的应急说明';
assert.throws(
  () => assert.deepStrictEqual(collectBiologyObservationContractIssues(tamperedTopic), []),
  /单元聚合页运行时生物观察/,
);

const tamperedReference = makeFixture();
tamperedReference.referenceEntries = tamperedReference.referenceEntries.slice(1);
assert.throws(
  () => assert.deepStrictEqual(collectBiologyObservationContractIssues(tamperedReference), []),
  /参考索引观察记录缺失/,
);

console.log('OK biology build contract test');
