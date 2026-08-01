const { getChemistryContentMeta } = require('./content-review-meta');

function requireText(entity, field, kind) {
  if (!entity || typeof entity[field] !== 'string' || !entity[field].trim()) {
    throw new Error(`${kind} requires a nonempty ${field}`);
  }
}

function buildEntity(kind, entity, parentField) {
  requireText(entity, 'id', kind);
  requireText(entity, 'title', kind);

  if (parentField === 'topicIds') {
    if (
      !Array.isArray(entity.topicIds)
      || entity.topicIds.length === 0
      || entity.topicIds.some((topicId) => typeof topicId !== 'string' || !topicId.trim())
    ) {
      throw new Error(`${kind} requires at least one topicIds parent ID`);
    }
  } else if (parentField) {
    requireText(entity, parentField, kind);
  }

  return {
    ...entity,
    subjectId: 'chemistry',
    contentMeta: getChemistryContentMeta(),
  };
}

function buildTheme(entity) {
  return buildEntity('chemistry theme', entity);
}

function buildTopic(entity) {
  return buildEntity('chemistry topic', entity, 'themeId');
}

function buildTemplate(entity) {
  return buildEntity('chemistry template', entity, 'topicIds');
}

function buildKnowledge(entity) {
  return buildEntity('chemistry knowledge', entity, 'topicId');
}

module.exports = {
  buildKnowledge,
  buildTemplate,
  buildTheme,
  buildTopic,
};
