const SUBJECT_REVIEW_META = {
  math: {
    status: 'verified',
    statusLabel: '已复核',
    reviewedAt: '2026-07-19',
    sourceLabel: '义务教育数学课程标准（2022年版）与人教版公开教材资料',
    sourceRefs: [
      { title: '义务教育数学课程标准（2022年版）', url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582346895190.pdf' },
      { title: '人教版初中数学新版教材介绍', url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202408/t20240826_1994351.html' },
    ],
  },
  english: {
    status: 'verified',
    statusLabel: '已复核',
    reviewedAt: '2026-07-19',
    sourceLabel: '义务教育英语课程标准（2022年版）与人教版初中英语公开教材资料',
    sourceRefs: [
      { title: '义务教育课程方案和课程标准（2022年版）', url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html' },
      { title: '人教版初中英语新教材介绍', url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html' },
    ],
  },
  physics: {
    status: 'verified',
    statusLabel: '已复核',
    reviewedAt: '2026-07-19',
    sourceLabel: '义务教育物理课程标准（2022年版）与人教版初中物理公开教材资料',
    sourceRefs: [
      { title: '义务教育课程方案和课程标准（2022年版）', url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html' },
      { title: '人教版初中物理新教材介绍', url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202409/t20240925_1995627.html' },
    ],
  },
};

function getContentReviewMeta(subjectId, overrides = {}) {
  const base = SUBJECT_REVIEW_META[subjectId] || SUBJECT_REVIEW_META.math;

  return {
    ...base,
    ...overrides,
    sourceRefs: (overrides.sourceRefs || base.sourceRefs).map((item) => ({ ...item })),
  };
}

module.exports = {
  SUBJECT_REVIEW_META,
  getContentReviewMeta,
};
