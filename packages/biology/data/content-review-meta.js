const BIOLOGY_SOURCE_KEYS = [
  'moe-biology-curriculum-2022',
  'pep-compulsory-biology-textbook',
];

const BIOLOGY_REVIEW = Object.freeze({
  status: 'reviewed',
  reviewedAt: '2026-08-10',
  sourceKeys: BIOLOGY_SOURCE_KEYS,
});

function getBiologyReview() {
  return {
    ...BIOLOGY_REVIEW,
    sourceKeys: [...BIOLOGY_REVIEW.sourceKeys],
  };
}

module.exports = {
  BIOLOGY_SOURCE_KEYS,
  getBiologyReview,
};
