const crypto = require('crypto');

const math = require('../packages/math/repository');
const english = require('../packages/english/data/english-content');
const englishUnits = require('../packages/english/data/english-units');
const physics = require('../packages/physics/data/physics-content');
const physicsCurriculum = require('../packages/physics/data/physics-curriculum');

function hashEntity(entity) {
  return crypto.createHash('sha256').update(JSON.stringify(entity)).digest('hex');
}

function addEntities(target, subjectId, type, entities) {
  entities.forEach((entity) => {
    const key = `${subjectId}:${type}:${entity.id}`;
    target[key] = {
      subjectId,
      type,
      id: entity.id,
      title: entity.title || entity.name || entity.word || '',
      hash: hashEntity(entity),
    };
  });
}

function buildContentManifest(version = 'current') {
  const entities = {};
  const mathChapters = math.getAllChapters();

  addEntities(entities, 'math', 'chapter', mathChapters);
  addEntities(entities, 'math', 'topic', math.getMathStudyMap().topicGroups.flatMap((group) => group.topics));
  addEntities(entities, 'math', 'knowledge', mathChapters.flatMap((chapter) => chapter.knowledgeItems));
  addEntities(entities, 'math', 'template', math.getAllTemplates());
  addEntities(entities, 'english', 'unit', englishUnits.units);
  addEntities(entities, 'english', 'word', englishUnits.vocabulary);
  addEntities(entities, 'english', 'grammar', englishUnits.grammarPoints);
  addEntities(entities, 'english', 'topic', english.topics);
  addEntities(entities, 'english', 'knowledge', english.knowledgeItems);
  addEntities(entities, 'english', 'template', english.templates);
  addEntities(entities, 'physics', 'chapter', physicsCurriculum.chapters);
  addEntities(entities, 'physics', 'knowledge', physicsCurriculum.knowledgeItems);
  addEntities(entities, 'physics', 'template', physicsCurriculum.templates);
  addEntities(entities, 'physics', 'topic', physics.topics);
  addEntities(entities, 'physics', 'structured-knowledge', physics.knowledgeItems);
  addEntities(entities, 'physics', 'structured-template', physics.templates);

  return {
    version,
    entityCount: Object.keys(entities).length,
    entities,
  };
}

module.exports = { buildContentManifest };
