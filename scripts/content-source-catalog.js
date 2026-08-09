const crypto = require('crypto');

const { LEGACY_KNOWLEDGE_ALIASES } = require('../data/content-id-aliases');
const { buildContentManifest } = require('./content-manifest');
const { collectAuditEntities } = require('./content-audit');

const SCHEMA_VERSION = 1;
const SOURCE_VERSION = 'v1.11-current';

function sha256(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function entityKey(entity) {
  return `${entity.subjectId}:${entity.type}:${entity.id}`;
}

function buildSourceEntities() {
  const manifest = buildContentManifest(SOURCE_VERSION);
  return collectAuditEntities()
    .map((entity) => {
      const key = entityKey(entity);
      const manifestEntity = manifest.entities[key];
      return {
        key,
        subjectId: entity.subjectId,
        type: entity.type,
        id: entity.id,
        title: entity.title,
        parentId: entity.parentId || null,
        review: {
          status: entity.reviewed.status,
          reviewedAt: entity.reviewed.reviewedAt || null,
          sourceKeys: entity.reviewed.sourceRefs.map((source) => source.key).filter(Boolean).sort(),
        },
        contentHash: manifestEntity ? manifestEntity.hash : null,
        exampleCount: entity.exampleCount,
        experimentCount: entity.experimentCount,
        assetCount: entity.assetRefs.length,
      };
    })
    .sort((left, right) => left.key.localeCompare(right.key));
}

function buildAliases() {
  return Object.entries(LEGACY_KNOWLEDGE_ALIASES)
    .map(([aliasId, targetId]) => ({
      key: `math:knowledge-alias:${aliasId}`,
      subjectId: 'math',
      type: 'knowledge-alias',
      aliasId,
      targetId,
      targetKey: `math:knowledge:${targetId}`,
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

function catalogHashInput(report) {
  return {
    schemaVersion: report.schemaVersion,
    sourceVersion: report.sourceVersion,
    entities: report.entities,
    aliases: report.aliases,
  };
}

function buildContentSourceCatalog() {
  const entities = buildSourceEntities();
  const aliases = buildAliases();
  const report = {
    schemaVersion: SCHEMA_VERSION,
    sourceVersion: SOURCE_VERSION,
    entityCount: entities.length,
    aliasCount: aliases.length,
    entities,
    aliases,
  };
  return {
    ...report,
    sourceHash: sha256(catalogHashInput(report)),
  };
}

function checkContentSourceCatalog(report) {
  if (!report || report.schemaVersion !== SCHEMA_VERSION) {
    throw new Error('内容源目录 schemaVersion 必须为 1');
  }
  if (report.sourceVersion !== SOURCE_VERSION) {
    throw new Error(`内容源目录 sourceVersion 无效：${report.sourceVersion}`);
  }
  if (!Array.isArray(report.entities) || !Array.isArray(report.aliases)) {
    throw new Error('内容源目录 entities 和 aliases 必须为数组');
  }
  if (report.entityCount !== report.entities.length || report.aliasCount !== report.aliases.length) {
    throw new Error('内容源目录数量与实体数组不一致');
  }
  if (report.sourceHash !== sha256(catalogHashInput(report))) {
    throw new Error('内容源目录 sourceHash 与实体内容不一致');
  }

  const keys = new Set();
  report.entities.forEach((entity) => {
    if (!entity.key || !entity.subjectId || !entity.type || !entity.id || !entity.title) {
      throw new Error(`内容源目录实体字段不完整：${entity.key || '(empty)'}`);
    }
    if (keys.has(entity.key)) throw new Error(`内容源目录实体 key 重复：${entity.key}`);
    keys.add(entity.key);
    if (!/^[a-f0-9]{64}$/.test(entity.contentHash || '')) {
      throw new Error(`内容源目录实体哈希无效：${entity.key}`);
    }
    if (!entity.review || !['verified', 'reviewed', 'untracked'].includes(entity.review.status)) {
      throw new Error(`内容源目录复核状态无效：${entity.key}`);
    }
    if (!Array.isArray(entity.review.sourceKeys)) {
      throw new Error(`内容源目录来源键无效：${entity.key}`);
    }
    ['summary', 'examples', 'sections', 'problems'].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(entity, field)) {
        throw new Error(`内容源目录不得包含正文字段：${entity.key}/${field}`);
      }
    });
  });

  const aliases = new Set();
  report.aliases.forEach((alias) => {
    if (!alias.key || !alias.aliasId || !alias.targetId || !alias.targetKey) {
      throw new Error(`内容源目录别名字段不完整：${alias.key || '(empty)'}`);
    }
    if (aliases.has(alias.key)) throw new Error(`内容源目录别名 key 重复：${alias.key}`);
    aliases.add(alias.key);
    if (!keys.has(alias.targetKey)) {
      throw new Error(`内容源目录别名目标不存在：${alias.key} -> ${alias.targetKey}`);
    }
  });

  return true;
}

module.exports = {
  SCHEMA_VERSION,
  SOURCE_VERSION,
  buildContentSourceCatalog,
  checkContentSourceCatalog,
  sha256,
};
