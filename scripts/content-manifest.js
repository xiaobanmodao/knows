const crypto = require('crypto');
const adapters = require('./subject-adapters');

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
  adapters.forEach((adapter) => {
    adapter.getManifestEntities().forEach(({ type, entities: subjectEntities }) => {
      addEntities(entities, adapter.subjectId, type, subjectEntities);
    });
  });

  return {
    version,
    entityCount: Object.keys(entities).length,
    entities,
  };
}

module.exports = { buildContentManifest };
