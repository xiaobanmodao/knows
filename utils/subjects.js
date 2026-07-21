const {
  SUBJECT_LABELS,
  getSubjectMeta,
  getSubjectRegistry,
} = require('../data/subject-manifest');
const { searchAllSubjects } = require('./search-index');
const { normalizeSubjectId } = require('./content-routes');

module.exports = {
  SUBJECT_LABELS,
  getSubjectMeta,
  getSubjectRegistry,
  normalizeSubjectId,
  searchAllSubjects,
};
