const { diffContentSourceCatalog } = require('./content-source-catalog');

function countMetrics(entities) {
  return entities.reduce((totals, entity) => ({
    examples: totals.examples + entity.exampleCount,
    experiments: totals.experiments + entity.experimentCount,
    assets: totals.assets + entity.assetCount,
  }), { examples: 0, experiments: 0, assets: 0 });
}

function countReview(entities) {
  return entities.reduce((counts, entity) => ({
    ...counts,
    [entity.review.status]: counts[entity.review.status] + 1,
  }), { verified: 0, reviewed: 0, untracked: 0 });
}

function buildContentSourceInputAuditReport({ input, importedCatalog, currentCatalog, batch = null, scope = null }) {
  const diff = diffContentSourceCatalog(currentCatalog, importedCatalog);
  const metrics = countMetrics(input.entities);
  const report = {
    schemaVersion: 1,
    status: diff.counts.added || diff.counts.modified || diff.counts.removed ? 'changed' : 'passed',
    sourceVersion: input.sourceVersion,
    batchId: batch ? batch.id : null,
    scope: {
      subjectId: batch ? batch.subjectId : scope?.subjectId || null,
      type: batch ? batch.type : scope?.type || null,
    },
    inputHash: input.inputHash,
    currentSourceHash: currentCatalog.sourceHash,
    importedSourceHash: importedCatalog.sourceHash,
    counts: {
      entities: input.entityCount,
      aliases: input.aliasCount,
    },
    metrics,
    review: countReview(input.entities),
    expected: batch ? {
      entities: batch.expectedCount,
      aliases: batch.expectedAliasCount,
      examples: batch.expectedExampleCount,
      experiments: batch.expectedExperimentCount,
      assets: batch.expectedAssetCount,
    } : null,
    diff,
  };
  return report;
}

module.exports = {
  buildContentSourceInputAuditReport,
  countMetrics,
  countReview,
};
