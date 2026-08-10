const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  buildLiveReport,
  checkLiveReport,
  sha256File,
  validateLiveRecord,
} = require('./math-smartedu-catalog-live');

const evidenceRecord = {
  grade: '七年级',
  volume: '上册',
  resourceId: 'resource-7u',
  title: '（根据2022年版课程标准修订）义务教育教科书·数学七年级上册',
  revisionMarker: '2022-revised',
  directoryPreviewPages: [5, 6, 7],
};

function buildLiveRecord(overrides = {}) {
  return {
    id: evidenceRecord.resourceId,
    title: evidenceRecord.title,
    tag_list: [
      { tag_name: '人教版' },
      { tag_name: '初中' },
      { tag_name: '数学' },
      { tag_name: evidenceRecord.grade },
      { tag_name: evidenceRecord.volume },
    ],
    custom_properties: {
      preview: {
        Slide5: 'https://r1-ndr.ykt.cbern.com.cn/edu_product/esp/assets/demo/image/5.jpg',
        Slide6: 'https://r2-ndr.ykt.cbern.com.cn/edu_product/esp/assets/demo/image/6.jpg',
        Slide7: 'https://r3-ndr.ykt.cbern.com.cn/edu_product/esp/assets/demo/image/7.jpg',
      },
    },
    ...overrides,
  };
}

try {
  const valid = validateLiveRecord(evidenceRecord, buildLiveRecord());
  assert.deepStrictEqual(valid, {
    resourceId: 'resource-7u',
    title: evidenceRecord.title,
    previewPages: [5, 6, 7],
  });

  assert.throws(
    () => validateLiveRecord(evidenceRecord, buildLiveRecord({ id: 'different-resource' })),
    /resourceId|资源 ID/i,
  );
  assert.throws(
    () => validateLiveRecord(evidenceRecord, buildLiveRecord({ title: '其他教材' })),
    /title|书名/i,
  );
  assert.throws(
    () => validateLiveRecord(evidenceRecord, buildLiveRecord({ tag_list: [{ tag_name: '人教版' }] })),
    /tag|标签|册次/i,
  );
  assert.throws(
    () => validateLiveRecord(evidenceRecord, buildLiveRecord({
      custom_properties: {
        preview: {
          Slide5: 'https://r1-ndr.ykt.cbern.com.cn/edu_product/esp/assets/demo/image/5.jpg',
          Slide6: 'https://r2-ndr.ykt.cbern.com.cn/edu_product/esp/assets/demo/image/6.jpg',
        },
      },
    })),
    /preview|目录页|7/,
  );
  assert.throws(
    () => validateLiveRecord({ ...evidenceRecord, revisionMarker: 'unmarked-edition' }, buildLiveRecord()),
    /revision|版本|修订/i,
  );

  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-smartedu-live-'));
  const evidencePath = path.join(tempDirectory, 'evidence.json');
  const sourceEvidencePath = path.join(__dirname, '..', 'docs/evidence/math-smartedu-catalog-2026.json');
  const reportInput = JSON.parse(fs.readFileSync(sourceEvidencePath, 'utf8'));
  fs.copyFileSync(sourceEvidencePath, evidencePath);
  const reportResult = {
    sourceId: reportInput.sourceId,
    records: reportInput.resourceRecords.map((record) => ({
      resourceId: record.resourceId,
      title: record.title,
      previewPages: record.directoryPreviewPages,
    })),
  };
  const report = buildLiveReport(reportInput, evidencePath, reportResult, '2026-08-10T08:39:07.639Z');
  assert.strictEqual(report.evidenceSha256, sha256File(evidencePath));
  assert.strictEqual(checkLiveReport(reportInput, report, { evidenceSha256: sha256File(evidencePath) }), true);
  assert.throws(
    () => checkLiveReport(reportInput, { ...report, evidenceSha256: '0'.repeat(64) }, { evidenceSha256: sha256File(evidencePath) }),
    /hash|哈希|evidenceSha256/i,
  );
  assert.throws(
    () => checkLiveReport(reportInput, { ...report, sourceId: 'other-source' }, { evidenceSha256: sha256File(evidencePath) }),
    /sourceId|来源/i,
  );
  assert.throws(
    () => checkLiveReport(reportInput, { ...report, records: [] }, { evidenceSha256: sha256File(evidencePath) }),
    /records|记录|数量/i,
  );
  assert.throws(
    () => checkLiveReport(reportInput, { ...report, checkedAt: 'not-a-date' }, { evidenceSha256: sha256File(evidencePath) }),
    /checkedAt|时间/i,
  );
  const offlineReportPath = path.join(tempDirectory, 'offline-report.json');
  fs.writeFileSync(offlineReportPath, `${JSON.stringify(report)}\n`, 'utf8');
  const offlineCli = spawnSync(process.execPath, [
    path.join(__dirname, 'check-math-smartedu-catalog-live-report.js'),
    offlineReportPath,
    evidencePath,
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.strictEqual(offlineCli.status, 0, `${offlineCli.stdout}\n${offlineCli.stderr}`);
  assert.match(`${offlineCli.stdout}\n${offlineCli.stderr}`, /OK math SmartEdu live report/);
  const tamperedReportPath = path.join(tempDirectory, 'tampered-report.json');
  fs.writeFileSync(tamperedReportPath, `${JSON.stringify({ ...report, sourceId: 'other-source' })}\n`, 'utf8');
  const tamperedCli = spawnSync(process.execPath, [
    path.join(__dirname, 'check-math-smartedu-catalog-live-report.js'),
    tamperedReportPath,
    evidencePath,
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.notStrictEqual(tamperedCli.status, 0);
  assert.match(`${tamperedCli.stdout}\n${tamperedCli.stderr}`, /sourceId|来源/);
  const canonicalReportPath = path.join(__dirname, '..', 'docs/evidence/math-smartedu-catalog-live-2026.json');
  const canonicalCli = spawnSync(process.execPath, [
    path.join(__dirname, 'check-math-smartedu-catalog-live-report.js'),
    canonicalReportPath,
    sourceEvidencePath,
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.strictEqual(canonicalCli.status, 0, `${canonicalCli.stdout}\n${canonicalCli.stderr}`);
  assert.match(`${canonicalCli.stdout}\n${canonicalCli.stderr}`, /OK math SmartEdu live report/);

  const reportPath = path.join(tempDirectory, 'report.json');
  const inputPath = path.join(tempDirectory, 'input.json');
  fs.writeFileSync(inputPath, '{}\n', 'utf8');
  const cli = spawnSync(process.execPath, [
    path.join(__dirname, 'math-smartedu-catalog-live.js'),
    '--report',
    reportPath,
    inputPath,
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.notStrictEqual(cli.status, 0);
  assert.match(`${cli.stdout}\n${cli.stderr}`, /schemaVersion|官方平台目录在线复核/);
  fs.rmSync(tempDirectory, { recursive: true, force: true });
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

if (!process.exitCode) console.log('OK math SmartEdu live evidence contract');
