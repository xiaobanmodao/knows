const BIOLOGY_SOURCES = {
  'moe-biology-curriculum-2022': {
    title: '义务教育生物学课程标准（2022年版）',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582359998122.pdf',
  },
  'pep-compulsory-biology-textbook': {
    title: '人教版义务教育生物学（七至八年级）新教材介绍',
    url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202409/t20240914_1995532.html',
  },
};

const BIOLOGY_SOURCE_KEYS = Object.keys(BIOLOGY_SOURCES);

const BIOLOGY_REVIEW = Object.freeze({
  status: 'reviewed',
  reviewedAt: '2026-08-10',
  sourceKeys: BIOLOGY_SOURCE_KEYS,
  sourceRefs: BIOLOGY_SOURCE_KEYS.map((key) => ({ key, ...BIOLOGY_SOURCES[key] })),
});

function getBiologyReview() {
  return {
    ...BIOLOGY_REVIEW,
    sourceKeys: [...BIOLOGY_REVIEW.sourceKeys],
    sourceRefs: BIOLOGY_REVIEW.sourceRefs.map((source) => ({ ...source })),
  };
}

module.exports = {
  BIOLOGY_REVIEW,
  BIOLOGY_SOURCES,
  BIOLOGY_SOURCE_KEYS,
  getBiologyReview,
};
