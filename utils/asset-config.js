const REMOTE_ASSET_BASE = 'cloud://cloud1-d3gm5t961d46590c3.636c-cloud1-d3gm5t961d46590c3-1428676715';
const CLOUD_ENV_ID = 'cloud1-d3gm5t961d46590c3';

function normalizeBase(base) {
  return String(base || '').replace(/\/+$/, '');
}

function resolveAssetUrl(path) {
  const value = String(path || '');
  const base = normalizeBase(REMOTE_ASSET_BASE);

  if (!value || !base || /^https?:\/\//.test(value) || /^cloud:\/\//.test(value)) {
    return value;
  }

  return `${base}${value.startsWith('/') ? value : `/${value}`}`;
}

module.exports = {
  REMOTE_ASSET_BASE,
  CLOUD_ENV_ID,
  resolveAssetUrl,
};
