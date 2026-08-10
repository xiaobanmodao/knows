const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { buildContentSourceCatalog } = require('./content-source-catalog');

const root = path.resolve(__dirname, '..');
const builder = path.join(__dirname, 'build-content-source-input.js');
const checker = path.join(__dirname, 'check-content-source-input.js');

function runBuilder(inputPath, outputPath, extraArgs = []) {
  return spawnSync(process.execPath, [builder, inputPath, '--output', outputPath, ...extraArgs], {
    cwd: root,
    encoding: 'utf8',
  });
}

function runCurrentBuilder(outputPath, extraArgs = []) {
  return spawnSync(process.execPath, [builder, '--from-current', '--output', outputPath, ...extraArgs], {
    cwd: root,
    encoding: 'utf8',
  });
}

function runChecker(inputPath, extraArgs = []) {
  return spawnSync(process.execPath, [checker, inputPath, ...extraArgs], {
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
  assert.match(jsonOutputData.inputHash, /^[a-f0-9]{64}$/);

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
  assert.match(csvOutputData.inputHash, /^[a-f0-9]{64}$/);

  const currentCatalogInput = path.join(directory, 'current-catalog.json');
  fs.writeFileSync(currentCatalogInput, JSON.stringify(buildContentSourceCatalog()));
  const noDiffResult = runChecker(currentCatalogInput, ['--require-no-diff']);
  assert.strictEqual(noDiffResult.status, 0, noDiffResult.stderr || noDiffResult.stdout);
  assert.match(noDiffResult.stdout, /diff \+0 ~0 -0/);

  const currentInputOutput = path.join(directory, 'current-input-output.json');
  const currentBuilderResult = runCurrentBuilder(currentInputOutput);
  assert.strictEqual(currentBuilderResult.status, 0, currentBuilderResult.stderr || currentBuilderResult.stdout);
  const currentInputData = JSON.parse(fs.readFileSync(currentInputOutput, 'utf8'));
  assert.strictEqual(currentInputData.entityCount, 948);
  assert.strictEqual(currentInputData.aliasCount, 89);
  assert.match(currentInputData.inputHash, /^[a-f0-9]{64}$/);
  const generatedCurrentCheck = runChecker(currentInputOutput, ['--require-no-diff']);
  assert.strictEqual(generatedCurrentCheck.status, 0, generatedCurrentCheck.stderr || generatedCurrentCheck.stdout);

  const englishUnitsOutput = path.join(directory, 'english-units-input.json');
  const englishUnitsResult = runCurrentBuilder(englishUnitsOutput, ['--subject', 'english', '--type', 'unit']);
  assert.strictEqual(englishUnitsResult.status, 0, englishUnitsResult.stderr || englishUnitsResult.stdout);
  const englishUnitsData = JSON.parse(fs.readFileSync(englishUnitsOutput, 'utf8'));
  assert.strictEqual(englishUnitsData.entityCount, 42);
  assert.ok(englishUnitsData.entities.every((entity) => entity.subjectId === 'english' && entity.type === 'unit'));
  const englishUnitsCheck = runChecker(englishUnitsOutput, ['--subject', 'english', '--type', 'unit', '--require-no-diff']);
  assert.strictEqual(englishUnitsCheck.status, 0, englishUnitsCheck.stderr || englishUnitsCheck.stdout);

  const changedCatalogInput = path.join(directory, 'changed-catalog.json');
  const changedCatalog = buildContentSourceCatalog();
  changedCatalog.entities[0] = { ...changedCatalog.entities[0], title: `${changedCatalog.entities[0].title}（输入变更）` };
  fs.writeFileSync(changedCatalogInput, JSON.stringify(changedCatalog));
  const diffResult = runChecker(changedCatalogInput);
  assert.strictEqual(diffResult.status, 0, diffResult.stderr || diffResult.stdout);
  assert.match(diffResult.stdout, /diff \+0 ~1 -0/);
  const blockedDiffResult = runChecker(changedCatalogInput, ['--require-no-diff']);
  assert.notStrictEqual(blockedDiffResult.status, 0);

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
