const crypto = require('crypto');
const fs = require('fs');
const math = require('../packages/math/repository');
const english = require('../packages/english/data/english-content');
const englishUnits = require('../packages/english/data/english-units');
const physics = require('../packages/physics/data/physics-content');
const physicsCurriculum = require('../packages/physics/data/physics-curriculum');
const { topics: chemistryTopics } = require('../packages/chemistry/data/chemistry-topics');
const { templates: chemistryTemplates } = require('../packages/chemistry/data/chemistry-templates');
const { topics: biologyTopics } = require('../packages/biology/data/biology-topics');

const EXPECTED_REMOTE_ASSET_REFERENCE_COUNT = 801;
const EXPECTED_REMOTE_ASSET_REFERENCE_SHA256 = 'dc07d43b28ac795043f22992bde8122adbc0b164a51daa00181da21001c4c4b0';
const EXPECTED_REMOTE_ASSET_COUNT = 231;
const EXPECTED_REMOTE_ASSET_SHA256 = '0cb5269655a4efd2f486dba78c22b913aba3ea7cfc9f6e1fd2c0e141721affb1';
const SOURCE_MANAGED_ASSET_PATTERNS = [
  /^assets\/figures\/generated\/topics\/[^/]+\/[^/]+\.png$/,
  /^assets\/figures\/generated\/templates\/model-[^/]+\.png$/,
  /^assets\/figures\/generated\/subjects\/(?:biology|english|physics)\//,
  /^assets\/figures\/generated\/chemistry\/(?:topics|diagrams|templates)\//,
];

function localPath(assetPath) {
  return String(assetPath || '')
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^cloud:\/\/[^/]+/, '')
    .replace(/^\//, '');
}

function addAsset(set, assetPath) {
  const value = localPath(assetPath);

  if (value && value.startsWith('assets/')) {
    set.add(value);
  }
}

function collectRemoteAssetReferences() {
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

function fingerprint(sources) {
  return crypto.createHash('sha256').update(JSON.stringify(sources)).digest('hex');
}

function isSourceManagedAsset(source) {
  return SOURCE_MANAGED_ASSET_PATTERNS.some((pattern) => pattern.test(source));
}

function collectRemoteAssets(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('远程资源清单选项必须为对象');
  }
  if (Object.keys(options).some((key) => key !== 'existsSync')) {
    throw new Error('远程资源清单选项无效');
  }
  const existsSync = options.existsSync || fs.existsSync;
  if (typeof existsSync !== 'function') throw new Error('远程资源存在性检查无效');

  const references = collectRemoteAssetReferences();
  if (
    references.length !== EXPECTED_REMOTE_ASSET_REFERENCE_COUNT
    || fingerprint(references) !== EXPECTED_REMOTE_ASSET_REFERENCE_SHA256
  ) {
    throw new Error('远程资源引用基线不一致');
  }

  const sources = references.filter(isSourceManagedAsset);
  if (
    sources.length !== EXPECTED_REMOTE_ASSET_COUNT
    || fingerprint(sources) !== EXPECTED_REMOTE_ASSET_SHA256
  ) {
    throw new Error('远程资源基线数量不一致');
  }
  if (sources.some((source) => !existsSync(source))) {
    throw new Error('远程资源原图缺失');
  }
  return sources;
}

module.exports = {
  EXPECTED_REMOTE_ASSET_COUNT,
  EXPECTED_REMOTE_ASSET_REFERENCE_COUNT,
  collectRemoteAssets,
  collectRemoteAssetReferences,
  isSourceManagedAsset,
  localPath,
};
