const { collectStructuredVisualGuideIssues } = require('./structured-visual-guide-contract');

function collectChemistryVisualGuideIssues(options = {}) {
  return collectStructuredVisualGuideIssues({ ...options, subjectLabel: '化学' });
}

module.exports = { collectChemistryVisualGuideIssues };
