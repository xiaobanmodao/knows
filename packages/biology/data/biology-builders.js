function requireText(entity, field, kind) {
  if (!entity || typeof entity[field] !== 'string' || !entity[field].trim()) {
    throw new Error(`${kind} requires a nonempty ${field}`);
  }
}

function buildEntity(kind, entity, parentField) {
  requireText(entity, 'id', kind);
  requireText(entity, 'title', kind);
  if (!entity.id.startsWith('bio-')) throw new Error(`${kind} ID must start with bio-`);
  if (parentField) requireText(entity, parentField, kind);
  return { ...entity, subjectId: 'biology' };
}

function buildTopic(entity) {
  return buildEntity('biology topic', entity);
}

function buildKnowledge(entity) {
  return buildEntity('biology knowledge', entity, 'topicId');
}

function buildTemplate(entity) {
  const template = buildEntity('biology template', entity);
  if (!template.id.startsWith('bio-tpl-')) throw new Error('biology template ID must start with bio-tpl-');
  return template;
}

module.exports = { buildKnowledge, buildTemplate, buildTopic };
