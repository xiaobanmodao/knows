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
  assert.match(valid.stdout, /OK math SmartEdu catalog evidence: 6 volumes/);

  const tampered = JSON.parse(fs.readFileSync(tempSource, 'utf8'));
  tampered.resourceRecords[0].resourceId = tampered.resourceRecords[1].resourceId;
  fs.writeFileSync(tempSource, `${JSON.stringify(tampered, null, 2)}\n`, 'utf8');
  const invalid = run(tempSource);
  assert.notStrictEqual(invalid.status, 0);
  assert.match(`${invalid.stdout}\n${invalid.stderr}`, /resourceId 不得重复/);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK math SmartEdu catalog evidence contract');
