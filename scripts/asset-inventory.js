const fs = require('fs');
const math = require('../packages/math/repository');
const english = require('../packages/english/data/english-content');
const englishUnits = require('../packages/english/data/english-units');
const physics = require('../packages/physics/data/physics-content');
const physicsCurriculum = require('../packages/physics/data/physics-curriculum');
const { topics: chemistryTopics } = require('../packages/chemistry/data/chemistry-topics');
const { templates: chemistryTemplates } = require('../packages/chemistry/data/chemistry-templates');
const { topics: biologyTopics } = require('../packages/biology/data/biology-topics');

function localPath(assetPath) {
  return String(assetPath || '')
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^cloud:\/\/[^/]+/, '')
    .replace(/^\//, '');
}

function addAsset(set, assetPath) {
  const value = localPath(assetPath);

  if (value && value.startsWith('assets/') && fs.existsSync(value)) {
    set.add(value);
  }
}

function collectRemoteAssets() {
  const assets = new Set();

  math.getAllChapters().forEach((chapter) => {
    addAsset(assets, chapter.chapterFigure && chapter.chapterFigure.image);
    chapter.knowledgeItems.forEach((knowledge) => {
      addAsset(assets, knowledge.coverImage);
      addAsset(assets, knowledge.sourceImage);
      knowledge.problems.forEach((problem) => {
        addAsset(assets, problem.image);
        addAsset(assets, problem.sourceImage);
      });
    });
  });

  math.getMathStudyMap().topicGroups.forEach((group) => {
    group.topics.forEach((topic) => addAsset(assets, topic.coverImage || topic.image));
  });

  math.getAllTemplates().forEach((template) => addAsset(assets, template.figure));

  [english, physics].forEach((content) => {
    content.topics.forEach((topic) => {
      addAsset(assets, topic.coverImage);
      addAsset(assets, topic.diagramImage);
    });
    content.templates.forEach((template) => addAsset(assets, template.figure));
  });

  physicsCurriculum.knowledgeItems.forEach((knowledge) => addAsset(assets, knowledge.coverImage));
  englishUnits.units.forEach((unit) => addAsset(assets, unit.coverImage));

  chemistryTopics.forEach((topic) => {
    addAsset(assets, topic.coverImage);
    (topic.diagramImages || []).forEach((diagram) => addAsset(assets, diagram.image));
  });
  chemistryTemplates.forEach((template) => addAsset(assets, template.figure));

  biologyTopics.forEach((topic) => {
    addAsset(assets, topic.coverImage);
    addAsset(assets, topic.diagramImage);
  });

  return [...assets].sort();
}

module.exports = {
  collectRemoteAssets,
  localPath,
};
