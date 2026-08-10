const { collectStructuredVisualGuideIssues } = require('./structured-visual-guide-contract');

function collectBiologyVisualGuideIssues(options = {}) {
  return collectStructuredVisualGuideIssues({ ...options, subjectLabel: '生物' });
}

module.exports = { collectBiologyVisualGuideIssues };
