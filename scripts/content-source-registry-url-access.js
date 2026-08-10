const crypto = require('crypto');

const REGISTRY_ACCESS_AUDIT_SCHEMA_VERSION = 1;
const ALLOWED_SOURCE_KINDS = new Set(['official', 'reference']);

function normalizeRegistrySources(sources) {
  if (!Array.isArray(sources)) throw new Error('来源注册表条目必须为数组');
  const keys = new Set();
  return sources
    .map((source) => {
      if (!source || typeof source !== 'object' || Array.isArray(source)) {
        throw new Error('来源注册表条目必须为对象');
      }
      if (!source.key || !source.title || !ALLOWED_SOURCE_KINDS.has(source.kind)) {
        throw new Error(`来源注册表条目必须包含 key、title 和 official or reference kind：${source.key || '(empty)'}`);
      }
      if (keys.has(source.key)) throw new Error(`来源注册表 key 重复：${source.key}`);
      keys.add(source.key);
      if (typeof source.url !== 'string' || !source.url.startsWith('https://')) {
        throw new Error(`来源注册表 URL 必须使用 https：${source.key}`);
      }
      try {
        const parsed = new URL(source.url);
        if (parsed.protocol !== 'https:') throw new Error('protocol');
      } catch (error) {
        throw new Error(`来源注册表 URL 无效：${source.key}`);
      }
      return {
        key: source.key,
        title: source.title,
        kind: source.kind,
        url: source.url,
      };
    })
    .sort((left, right) => left.key.localeCompare(right.key));
}

function hashRegistrySources(sources) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalizeRegistrySources(sources)))
    .digest('hex');
}

function collectRegisteredSourceUrls(sources) {
  const normalized = normalizeRegistrySources(sources);
  const byUrl = new Map();
  normalized.forEach((source) => {
    const entry = byUrl.get(source.url) || { url: source.url, sourceKeys: [] };
    entry.sourceKeys.push(source.key);
    byUrl.set(source.url, entry);
  });
  return [...byUrl.values()]
    .map((entry) => ({ ...entry, sourceKeys: [...entry.sourceKeys].sort() }))
    .sort((left, right) => left.url.localeCompare(right.url));
}

function normalizeRequestResult(url, response) {
  const statusCode = Number(response && response.statusCode);
  if (!Number.isInteger(statusCode) || statusCode < 200 || statusCode >= 400) {
    return {
      url,
      status: 'failed',
      httpStatus: Number.isInteger(statusCode) ? statusCode : null,
      error: Number.isInteger(statusCode) ? `HTTP ${statusCode}` : '无效 HTTP 状态码',
    };
  }
  return {
    url,
    status: 'passed',
    httpStatus: statusCode,
    finalUrl: response.finalUrl || url,
  };
}

async function auditRegisteredSourceUrls({ sources, requestUrl } = {}) {
  if (typeof requestUrl !== 'function') throw new Error('来源注册表 URL 审计必须提供 requestUrl 函数');
  const normalized = normalizeRegistrySources(sources);
  const registryUrls = collectRegisteredSourceUrls(normalized);
  const urls = [];
  for (const registryUrl of registryUrls) {
    try {
      urls.push({
        ...registryUrl,
        ...normalizeRequestResult(registryUrl.url, await requestUrl(registryUrl.url)),
      });
    } catch (error) {
      urls.push({
        ...registryUrl,
        status: 'failed',
        httpStatus: null,
        error: error.message || String(error),
      });
    }
  }
  const passed = urls.filter((entry) => entry.status === 'passed').length;
  const failed = urls.length - passed;
  return {
    schemaVersion: REGISTRY_ACCESS_AUDIT_SCHEMA_VERSION,
    auditKind: 'content-source-registry',
    generatedFrom: {
      registryHash: hashRegistrySources(normalized),
      sourceCount: normalized.length,
    },
    status: failed ? 'blocked' : urls.length ? 'passed' : 'no-sources',
    summary: {
      total: urls.length,
      checked: urls.length,
      passed,
      failed,
    },
    urls,
  };
}

module.exports = {
  REGISTRY_ACCESS_AUDIT_SCHEMA_VERSION,
  normalizeRegistrySources,
  hashRegistrySources,
  collectRegisteredSourceUrls,
  auditRegisteredSourceUrls,
};
