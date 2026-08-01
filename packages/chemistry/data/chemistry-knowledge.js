const { foundationKnowledge } = require('./chemistry-knowledge-foundations');
const { applicationKnowledge } = require('./chemistry-knowledge-applications');

const knowledgeItems = [...foundationKnowledge, ...applicationKnowledge];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getRawChemistrySections(type) {
  const sections = knowledgeItems.flatMap((knowledge) => (
    (knowledge.sections || []).filter((section) => section.type === type)
  ));
  return clone(sections);
}

function collectUniqueSections(type, idField) {
  const records = new Map();
  getRawChemistrySections(type).forEach((section) => {
    if (!records.has(section[idField])) {
      records.set(section[idField], section);
    }
  });
  return [...records.values()];
}

function getChemistryExperiments() {
  return collectUniqueSections('experiment', 'experimentId');
}

function getChemistryEquations() {
  return collectUniqueSections('equation', 'equationId');
}

module.exports = {
  applicationKnowledge,
  foundationKnowledge,
  getChemistryEquations,
  getChemistryExperiments,
  getRawChemistrySections,
  knowledgeItems,
};
