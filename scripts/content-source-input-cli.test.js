const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const builder = path.join(__dirname, 'build-content-source-input.js');

function runBuilder(inputPath, outputPath, extraArgs = []) {
  return spawnSync(process.execPath, [builder, inputPath, '--output', outputPath, ...extraArgs], {
    cwd: root,
    encoding: 'utf8',
  });
}

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-source-input-'));
try {
  const jsonInput = path.join(directory, 'source.json');
  const jsonOutput = path.join(directory, 'source-json-output.json');
  fs.writeFileSync(jsonInput, JSON.stringify({
    schemaVersion: 1,
    sourceVersion: 'fixture-json-v1',
    entities: [{
      key: 'math:knowledge:json-fixture',
      subjectId: 'math',
      type: 'knowledge',
      id: 'json-fixture',
      title: 'JSON fixture',
      parentId: null,
      review: { status: 'verified', reviewedAt: '2026-08-10', sourceKeys: ['source-b', 'source-a'] },
      contentHash: 'b'.repeat(64),
      exampleCount: 1,
      experimentCount: 0,
      assetCount: 0,
    }],
    aliases: [],
  }));
  const jsonResult = runBuilder(jsonInput, jsonOutput);
  assert.strictEqual(jsonResult.status, 0, jsonResult.stderr || jsonResult.stdout);
  const jsonOutputData = JSON.parse(fs.readFileSync(jsonOutput, 'utf8'));
  assert.strictEqual(jsonOutputData.sourceVersion, 'fixture-json-v1');
  assert.deepStrictEqual(jsonOutputData.entities[0].review.sourceKeys, ['source-a', 'source-b']);

  const csvInput = path.join(directory, 'source.csv');
  const csvOutput = path.join(directory, 'source-csv-output.json');
  fs.writeFileSync(csvInput, [
    'key,subjectId,type,id,title,parentId,reviewStatus,reviewedAt,sourceKeys,contentHash,exampleCount,experimentCount,assetCount',
    'english:knowledge:csv-fixture,english,knowledge,csv-fixture,"A, CSV fixture",,verified,2026-08-10,"pep|moe",' + 'c'.repeat(64) + ',2,0,1',
  ].join('\n'));
  const csvResult = runBuilder(csvInput, csvOutput, ['--source-version', 'fixture-csv-v1']);
  assert.strictEqual(csvResult.status, 0, csvResult.stderr || csvResult.stdout);
  const csvOutputData = JSON.parse(fs.readFileSync(csvOutput, 'utf8'));
  assert.strictEqual(csvOutputData.sourceVersion, 'fixture-csv-v1');
  assert.strictEqual(csvOutputData.entities[0].title, 'A, CSV fixture');
  assert.deepStrictEqual(csvOutputData.entities[0].review.sourceKeys, ['moe', 'pep']);
  assert.strictEqual(csvOutputData.entities[0].exampleCount, 2);

  const invalidInput = path.join(directory, 'invalid.csv');
  const invalidOutput = path.join(directory, 'invalid-output.json');
  fs.writeFileSync(invalidInput, 'key,subjectId\ninvalid,math\n');
  const invalidResult = runBuilder(invalidInput, invalidOutput, ['--source-version', 'fixture-invalid-v1']);
  assert.notStrictEqual(invalidResult.status, 0);
  assert.match(`${invalidResult.stdout}\n${invalidResult.stderr}`, /title|contentHash|字段|输入/);
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}

console.log('OK content source input CLI contract');
