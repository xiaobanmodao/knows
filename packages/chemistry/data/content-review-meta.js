const CHEMISTRY_SOURCES = {
  'moe-chemistry-2022': {
    title: '义务教育化学课程标准（2022年版）',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
  },
  'moe-textbook-catalog-2024': {
    title: '2024年义务教育国家课程教学用书目录',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202408/W020250418502592948423.pdf',
  },
  'pep-chemistry-training-2024': {
    title: '人教版义务教育化学新教材培训通知',
    url: 'https://www.pep.com.cn/rjdt/rjdt/202405/t20240517_1992181.shtml',
  },
};

const SOURCE_KEYS = Object.keys(CHEMISTRY_SOURCES);

const CHEMISTRY_REVIEW_META = {
  status: 'verified',
  statusLabel: '已复核',
  reviewedAt: '2026-08-01',
  sourceLabel: '义务教育化学课程标准（2022年版）、国家课程教学用书目录与人教版新教材公开资料',
  sourceKeys: SOURCE_KEYS,
  sourceRefs: SOURCE_KEYS.map((key) => ({ key, ...CHEMISTRY_SOURCES[key] })),
};

function getChemistryContentMeta(overrides = {}) {
  const sourceKeys = overrides.sourceKeys || CHEMISTRY_REVIEW_META.sourceKeys;
  const sourceRefs = overrides.sourceRefs || CHEMISTRY_REVIEW_META.sourceRefs;

  return {
    ...CHEMISTRY_REVIEW_META,
    ...overrides,
    sourceKeys: [...sourceKeys],
    sourceRefs: sourceRefs.map((source) => ({ ...source })),
  };
}

module.exports = {
  CHEMISTRY_REVIEW_META,
  CHEMISTRY_SOURCES,
  getChemistryContentMeta,
};
