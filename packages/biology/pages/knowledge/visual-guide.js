const { prepareStructuredVisualGuide } = require('../../../../utils/structured-visual-guide');

function prepareVisualGuide(guide) {
  return prepareStructuredVisualGuide(guide);
}

module.exports = {
  prepareVisualGuide,
};
