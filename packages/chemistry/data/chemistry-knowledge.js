const { foundationKnowledge } = require('./chemistry-knowledge-foundations');
const { applicationKnowledge } = require('./chemistry-knowledge-applications');

const knowledgeItems = [...foundationKnowledge, ...applicationKnowledge];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function collectUniqueSections(type, idField) {
  const records = new Map();
  knowledgeItems.forEach((knowledge) => {
    knowledge.sections.forEach((section) => {
      if (section.type === type && !records.has(section[idField])) {
        records.set(section[idField], section);
      }
    });
  });
  return clone([...records.values()]);
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
  knowledgeItems,
};
