const assert = require('assert');

const {
  buildConfirmedChangeReport,
  checkConfirmedChangeReport,
} = require('./check-math-confirmed-changes');

const report = buildConfirmedChangeReport();

assert.strictEqual(report.schemaVersion, 1);
assert.strictEqual(report.status, 'covered-but-volume-map-blocked');
assert.strictEqual(report.changes.length, 2);
assert.deepStrictEqual(report.changes.map((item) => item.id), [
  'math-function-split',
  'math-data-analysis-additions',
]);
assert.strictEqual(report.changes.every((item) => item.coverage === 'runtime-content-covered'), true);
assert.strictEqual(report.runtimeGuard.volumeMapStatus, 'needs-official-volume-map');
assert.strictEqual(report.runtimeGuard.officialMappingCount, 0);
assert.strictEqual(checkConfirmedChangeReport(report), true);

assert.throws(
  () => checkConfirmedChangeReport({ ...report, status: 'ready' }),
  /covered-but-volume-map-blocked|状态|status/,
);
assert.throws(
  () => checkConfirmedChangeReport({
    ...report,
    changes: report.changes.map((item, index) => index === 0
      ? { ...item, foundSignals: ['19.1 函数'] }
      : item),
  }),
  /信号|signals|覆盖/,
);
assert.throws(
  () => checkConfirmedChangeReport({
    ...report,
    runtimeGuard: { ...report.runtimeGuard, officialMappingCount: 29 },
  }),
  /official|映射|volumeMap|runtimeGuard|门禁/,
);

console.log('OK math confirmed-change coverage contract: 2 official changes covered; volume map remains blocked');
