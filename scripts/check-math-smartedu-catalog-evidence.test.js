const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const checker = path.join(__dirname, 'check-math-smartedu-catalog-evidence.js');
const source = path.join(root, 'docs/evidence/math-smartedu-catalog-2026.json');
const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-smartedu-math-evidence-'));
const tempSource = path.join(tempDirectory, 'evidence.json');

function run(inputPath) {
  return spawnSync(process.execPath, [checker, inputPath], {
    cwd: root,
    encoding: 'utf8',
  });
}

try {
  fs.copyFileSync(source, tempSource);
  const valid = run(tempSource);
  assert.strictEqual(valid.status, 0, valid.stderr || valid.stdout);
  assert.match(valid.stdout, /OK math SmartEdu catalog evidence: 6 volumes, 31 directory observations/);

  const sourceWithDetailMetadata = JSON.parse(fs.readFileSync(tempSource, 'utf8'));
  sourceWithDetailMetadata.resourceRecords.forEach((record) => {
    assert.ok(record.detailMetadata);
    assert.strictEqual(record.detailMetadata.globalTitle, record.title);
    assert.strictEqual(record.detailMetadata.versionVisible, 'RELEASE');
    assert.strictEqual(record.detailMetadata.format, 'pdf');
    assert.strictEqual(record.detailMetadata.previewAssetCount, 49);
    assert.ok(record.platformMetadata);
    assert.strictEqual(record.platformMetadata.versionId, record.resourceId);
    assert.strictEqual(record.platformMetadata.providerName, '智慧中小学');
    assert.strictEqual(record.platformMetadata.catalogType, 'tchMaterial');
  });

  const tamperedDetailMetadata = JSON.parse(fs.readFileSync(tempSource, 'utf8'));
  tamperedDetailMetadata.resourceRecords[0].detailMetadata.globalTitle = '另一本教材';
  fs.writeFileSync(tempSource, `${JSON.stringify(tamperedDetailMetadata, null, 2)}\n`, 'utf8');
  const invalidDetailMetadata = run(tempSource);
  assert.notStrictEqual(invalidDetailMetadata.status, 0);
  assert.match(`${invalidDetailMetadata.stdout}\n${invalidDetailMetadata.stderr}`, /detailMetadata|globalTitle/);

  fs.copyFileSync(source, tempSource);

  const tamperedPlatformMetadata = JSON.parse(fs.readFileSync(tempSource, 'utf8'));
  tamperedPlatformMetadata.resourceRecords[0].platformMetadata.providerName = '其他平台';
  fs.writeFileSync(tempSource, `${JSON.stringify(tamperedPlatformMetadata, null, 2)}\n`, 'utf8');
  const invalidPlatformMetadata = run(tempSource);
  assert.notStrictEqual(invalidPlatformMetadata.status, 0);
  assert.match(`${invalidPlatformMetadata.stdout}\n${invalidPlatformMetadata.stderr}`, /platformMetadata|providerName/);

  fs.copyFileSync(source, tempSource);

  const missingDirectoryObservation = JSON.parse(fs.readFileSync(tempSource, 'utf8'));
  delete missingDirectoryObservation.resourceRecords[0].directoryChapters;
  fs.writeFileSync(tempSource, `${JSON.stringify(missingDirectoryObservation, null, 2)}\n`, 'utf8');
  const missingDirectory = run(tempSource);
  assert.notStrictEqual(missingDirectory.status, 0);
  assert.match(`${missingDirectory.stdout}\n${missingDirectory.stderr}`, /directoryChapters/);

  fs.copyFileSync(source, tempSource);

  const tampered = JSON.parse(fs.readFileSync(tempSource, 'utf8'));
  tampered.resourceRecords[0].resourceId = tampered.resourceRecords[1].resourceId;
  tampered.resourceRecords[0].platformMetadata.versionId = tampered.resourceRecords[0].resourceId;
  fs.writeFileSync(tempSource, `${JSON.stringify(tampered, null, 2)}\n`, 'utf8');
  const invalid = run(tempSource);
  assert.notStrictEqual(invalid.status, 0);
  assert.match(`${invalid.stdout}\n${invalid.stderr}`, /resourceId 不得重复/);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK math SmartEdu catalog evidence contract');
