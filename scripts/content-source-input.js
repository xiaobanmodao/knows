const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = 1;

const REVIEW_STATUSES = new Set(['verified', 'reviewed', 'untracked']);
const ENTITY_FIELDS = new Set([
  'key', 'subjectId', 'type', 'id', 'title', 'parentId', 'review', 'reviewStatus',
  'reviewedAt', 'sourceKeys', 'contentHash', 'exampleCount', 'experimentCount', 'assetCount',
]);
const ALIAS_FIELDS = new Set(['key', 'subjectId', 'type', 'aliasId', 'targetId', 'targetKey']);
const BODY_FIELDS = new Set([
  'summary', 'content', 'sections', 'examples', 'problems', 'formula', 'experiment',
  'figure', 'image', 'body', 'explanation',
]);

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function fail(message, index) {
  throw new Error(`内容源输入${index === undefined ? '' : `第 ${index + 1} 条`}：${message}`);
}

function requireText(value, field, index) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} 必须为非空字符串`, index);
  return value.trim();
}

function normalizeCount(value, field, index) {
  const parsed = typeof value === 'string' && value.trim() ? Number(value) : value;
  if (!Number.isInteger(parsed) || parsed < 0) fail(`${field} 必须为非负整数`, index);
  return parsed;
}

function normalizeSourceKeys(value, index) {
  if (typeof value === 'string' && !value.trim()) return [];
  const sourceKeys = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[|,]/)
      : [];
  return [...new Set(sourceKeys.map((sourceKey) => requireText(sourceKey, 'sourceKeys', index)))].sort();
}

function normalizeReview(record, index) {
  const review = record.review && typeof record.review === 'object'
    ? record.review
    : {
      status: record.reviewStatus,
      reviewedAt: record.reviewedAt,
      sourceKeys: record.sourceKeys,
    };
  if (!review || !REVIEW_STATUSES.has(review.status)) fail(`复核状态无效：${review && review.status}`, index);
  if (review.reviewedAt !== null && review.reviewedAt !== undefined && typeof review.reviewedAt !== 'string') {
    fail('reviewedAt 必须为字符串或 null', index);
  }
  return {
    status: review.status,
    reviewedAt: review.reviewedAt || null,
    sourceKeys: normalizeSourceKeys(review.sourceKeys, index),
  };
}

function rejectUnexpectedFields(record, allowedFields, index) {
  Object.keys(record).forEach((field) => {
    if (BODY_FIELDS.has(field)) fail(`不得包含正文字段：${field}`, index);
    if (!allowedFields.has(field)) fail(`不支持的字段：${field}`, index);
  });
}

function normalizeEntity(record, index) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) fail('实体必须为对象', index);
  rejectUnexpectedFields(record, ENTITY_FIELDS, index);
  const normalized = {
    key: requireText(record.key, 'key', index),
    subjectId: requireText(record.subjectId, 'subjectId', index),
    type: requireText(record.type, 'type', index),
    id: requireText(record.id, 'id', index),
    title: requireText(record.title, 'title', index),
    parentId: record.parentId ? requireText(record.parentId, 'parentId', index) : null,
    review: normalizeReview(record, index),
    contentHash: requireText(record.contentHash, 'contentHash', index),
    exampleCount: normalizeCount(record.exampleCount, 'exampleCount', index),
    experimentCount: normalizeCount(record.experimentCount, 'experimentCount', index),
    assetCount: normalizeCount(record.assetCount, 'assetCount', index),
  };
  if (!/^[a-f0-9]{64}$/.test(normalized.contentHash)) fail('contentHash 必须为 64 位十六进制哈希', index);
  return normalized;
}

function normalizeAlias(record, index) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) fail('别名必须为对象', index);
  rejectUnexpectedFields(record, ALIAS_FIELDS, index);
  return {
    key: requireText(record.key, 'key', index),
    subjectId: requireText(record.subjectId, 'subjectId', index),
    type: requireText(record.type, 'type', index),
    aliasId: requireText(record.aliasId, 'aliasId', index),
    targetId: requireText(record.targetId, 'targetId', index),
    targetKey: requireText(record.targetKey, 'targetKey', index),
  };
}

function assertUniqueKeys(records, label) {
  const keys = new Set();
  records.forEach((record, index) => {
    if (keys.has(record.key)) fail(`${label} key 重复：${record.key}`, index);
    keys.add(record.key);
  });
  return keys;
}

function sourceInputHashInput(source) {
  return {
    schemaVersion: source.schemaVersion,
    sourceVersion: source.sourceVersion,
    entityCount: source.entityCount,
    aliasCount: source.aliasCount,
    entities: source.entities,
    aliases: source.aliases,
  };
}

function hashSourceInput(source) {
  return crypto.createHash('sha256').update(JSON.stringify(sourceInputHashInput(source))).digest('hex');
}

function normalizeSourceInput(input) {
  const source = Array.isArray(input)
    ? { schemaVersion: SCHEMA_VERSION, sourceVersion: 'imported-input', entities: input, aliases: [] }
    : input;
  if (!source || typeof source !== 'object' || Array.isArray(source)) fail('根对象无效');
  if (source.schemaVersion !== SCHEMA_VERSION) fail(`schemaVersion 必须为 ${SCHEMA_VERSION}`);
  const sourceVersion = requireText(source.sourceVersion, 'sourceVersion');
  if (!Array.isArray(source.entities)) fail('entities 必须为数组');
  if (source.aliases !== undefined && !Array.isArray(source.aliases)) fail('aliases 必须为数组');

  const entities = source.entities.map(normalizeEntity).sort((left, right) => left.key.localeCompare(right.key));
  const aliases = (source.aliases || []).map(normalizeAlias).sort((left, right) => left.key.localeCompare(right.key));
  const entityKeys = assertUniqueKeys(entities, '实体');
  const aliasKeys = assertUniqueKeys(aliases, '别名');
  const allKeys = new Set(entityKeys);
  aliasKeys.forEach((key, index) => {
    if (allKeys.has(key)) fail(`实体和别名 key 冲突：${key}`, index);
    allKeys.add(key);
  });
  entities.forEach((entity, index) => {
    if (!entity.parentId) return;
    const sameSubjectParent = entities.some((candidate) => candidate.subjectId === entity.subjectId && candidate.id === entity.parentId);
    if (!sameSubjectParent && !/^(grade|g\d+|theme|book|unit|chapter|ch\d+)/i.test(entity.parentId)
      && !/^[a-z0-9]+-(?:grade|g\d+|theme|book|unit|chapter|ch\d+|topic)/i.test(entity.parentId)) {
      fail(`parentId 格式无法识别：${entity.parentId}`, index);
    }
  });
  aliases.forEach((alias, index) => {
    if (!entityKeys.has(alias.targetKey)) fail(`别名目标不存在：${alias.targetKey}`, index);
  });

  const normalized = {
    schemaVersion: SCHEMA_VERSION,
    sourceVersion,
    entityCount: entities.length,
    aliasCount: aliases.length,
    entities,
    aliases,
  };
  if (hasOwn(source, 'entityCount') && source.entityCount !== normalized.entityCount) fail('entityCount 与 entities 不一致');
  if (hasOwn(source, 'aliasCount') && source.aliasCount !== normalized.aliasCount) fail('aliasCount 与 aliases 不一致');
  normalized.inputHash = hashSourceInput(normalized);
  if (hasOwn(source, 'inputHash') && source.inputHash !== normalized.inputHash) fail('inputHash 与输入内容不一致');
  return normalized;
}

function checkSourceInput(input) {
  normalizeSourceInput(input);
  return true;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const source = String(text).replace(/^\uFEFF/, '');

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inQuotes) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"' && field === '') {
      inQuotes = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
      }
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (inQuotes) fail('CSV 引号未闭合');
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) fail('CSV 不能为空');

  const headers = rows.shift().map((header) => header.trim());
  if (headers.some((header) => !header)) fail('CSV 表头不能为空');
  if (new Set(headers).size !== headers.length) fail('CSV 表头不得重复');
  return rows.map((values, rowIndex) => {
    if (values.length !== headers.length) fail(`CSV 第 ${rowIndex + 2} 行字段数量不一致`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function loadSourceInputFile(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);
  let raw;
  try {
    raw = fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    throw new Error(`无法读取内容源输入：${absolutePath}；${error.message}`);
  }
  const extension = path.extname(absolutePath).toLowerCase();
  if (extension === '.csv') {
    const sourceVersion = requireText(options.sourceVersion, 'sourceVersion');
    return normalizeSourceInput({
      schemaVersion: SCHEMA_VERSION,
      sourceVersion,
      entities: parseCsv(raw),
      aliases: [],
    });
  }
  if (extension === '.json') {
    let input;
    try {
      input = JSON.parse(raw);
    } catch (error) {
      throw new Error(`内容源 JSON 解析失败：${error.message}`);
    }
    if (Array.isArray(input)) {
      input = {
        schemaVersion: SCHEMA_VERSION,
        sourceVersion: options.sourceVersion || 'imported-input',
        entities: input,
        aliases: [],
      };
    } else if (options.sourceVersion && input && typeof input === 'object' && !input.sourceVersion) {
      input = { ...input, sourceVersion: options.sourceVersion };
    }
    return normalizeSourceInput(input);
  }
  throw new Error(`内容源输入只支持 .json 或 .csv：${absolutePath}`);
}

module.exports = {
  SCHEMA_VERSION,
  BODY_FIELDS: [...BODY_FIELDS],
  hashSourceInput,
  loadSourceInputFile,
  normalizeSourceInput,
  parseCsv,
  checkSourceInput,
};
