const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildCloudAssetPlan,
  buildConsoleVerificationScript,
  buildVerificationBatches,
  getPlanSnapshotHash,
  getSubjectFromAsset,
  validateCloudAssetEvidence,
} = require('./cloud-asset-deployment');
const { REMOTE_ASSET_BASE } = require('../utils/asset-config');

const manifest = {
  assets: [
    { source: 'assets/figures/generated/subjects/biology/topics/bio-unit-cells/cover.png', cloudPath: '/assets/figures/generated/subjects/biology/topics/bio-unit-cells/cover.png', width: 1280, height: 900, bytes: 1024, sha256: 'a'.repeat(64) },
    { source: 'assets/figures/generated/chemistry/topics/chem-topic/cover.png', cloudPath: '/assets/figures/generated/chemistry/topics/chem-topic/cover.png', width: 1280, height: 900, bytes: 1024, sha256: 'b'.repeat(64) },
    { source: 'assets/figures/generated/subjects/biology/topics/bio-unit-cells/diagram.png', cloudPath: '/assets/figures/generated/subjects/biology/topics/bio-unit-cells/diagram.png', width: 960, height: 675, bytes: 512, sha256: 'c'.repeat(64) },
  ],
};
const sourceCommit = '1010edcb9c1a4427b7b2822b9f41728850091b6b';
const otherSourceCommit = 'fedcba9876543210fedcba9876543210fedcba98';
const invalidSourceCommit = 'https://signed.example/?token=secret';
const plan = buildCloudAssetPlan({ manifest, sourceCommit, subject: 'biology' });
const diagnosticPlan = buildCloudAssetPlan({ manifest, subject: 'biology' });
const fullPlan = buildCloudAssetPlan({ manifest, sourceCommit });

assert.strictEqual(plan.assetCount, 2);
assert.strictEqual(diagnosticPlan.sourceCommit, null);
assert.strictEqual(plan.batches.length, 1);
assert.strictEqual(fullPlan.subject, null);
assert.strictEqual(fullPlan.assetCount, 3);
assert.deepStrictEqual(
  plan.assets.map((asset) => asset.fileID),
  [
    `${REMOTE_ASSET_BASE}${manifest.assets[0].cloudPath}`,
    `${REMOTE_ASSET_BASE}${manifest.assets[2].cloudPath}`,
  ],
);
assert(plan.assets.some((asset) => asset.source.endsWith('bio-unit-cells/cover.png')));
assert.throws(
  () => buildCloudAssetPlan({ manifest, sourceCommit, subject: 'biologgy' }),
  /subject.*biologgy/,
);
assert.throws(
  () => buildCloudAssetPlan({ manifest: { assets: [] }, sourceCommit }),
  /资源数量/,
);
assert.throws(
  () => buildCloudAssetPlan({ manifest, sourceCommit: invalidSourceCommit, subject: 'biology' }),
  /sourceCommit/,
);
['abcdef', 'a'.repeat(65), 'g'.repeat(7)].forEach((invalidCommit) => {
  assert.throws(
    () => buildCloudAssetPlan({ manifest, sourceCommit: invalidCommit, subject: 'biology' }),
    /sourceCommit/,
  );
});
assert.throws(
  () => validateCloudAssetEvidence({ plan, evidence: { tempFileURL: 'https://secret.example/' }, expectedCommit: sourceCommit }),
  /临时 URL/,
);

const zeroAssetPlan = {
  schemaVersion: 1,
  generatedAt: '2026-08-11T00:00:00.000Z',
  cloudEnvId: plan.cloudEnvId,
  sourceCommit,
  subject: 'biology',
  assetCount: 0,
  assets: [],
  batches: [],
};
zeroAssetPlan.snapshotHash = getPlanSnapshotHash(zeroAssetPlan);
const zeroAssetEvidence = {
  schemaVersion: 1,
  verifiedAt: '2026-08-11T00:00:00.000Z',
  cloudEnvId: zeroAssetPlan.cloudEnvId,
  sourceCommit,
  planSnapshotHash: zeroAssetPlan.snapshotHash,
  results: [],
};
assert.throws(
  () => buildConsoleVerificationScript(zeroAssetPlan),
  /资源数量/,
);
assert.throws(
  () => validateCloudAssetEvidence({ plan: zeroAssetPlan, evidence: zeroAssetEvidence, expectedCommit: sourceCommit }),
  /资源数量/,
);

function buildEvidence(overrides = {}) {
  return buildEvidenceForPlan(plan, overrides);
}

function buildEvidenceForPlan(targetPlan, overrides = {}) {
  return {
    schemaVersion: 1,
    verifiedAt: '2026-08-11T00:00:00.000Z',
    cloudEnvId: targetPlan.cloudEnvId,
    sourceCommit: targetPlan.sourceCommit,
    planSnapshotHash: targetPlan.snapshotHash,
    results: targetPlan.assets.map((asset) => ({
      fileID: asset.fileID,
      status: 0,
      hasTempFileURL: true,
    })),
    ...overrides,
  };
}

const typoSubjectPlan = { ...plan, subject: 'biologgy' };
typoSubjectPlan.snapshotHash = getPlanSnapshotHash(typoSubjectPlan);
const wrongKnownSubjectPlan = { ...plan, subject: 'chemistry' };
wrongKnownSubjectPlan.snapshotHash = getPlanSnapshotHash(wrongKnownSubjectPlan);
assert.throws(
  () => buildConsoleVerificationScript(typoSubjectPlan),
  /subject.*biologgy/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan: typoSubjectPlan,
    evidence: buildEvidenceForPlan(typoSubjectPlan),
    expectedCommit: sourceCommit,
  }),
  /subject.*biologgy/,
);
assert.throws(
  () => buildConsoleVerificationScript(wrongKnownSubjectPlan),
  /subject.*不匹配/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan: wrongKnownSubjectPlan,
    evidence: buildEvidenceForPlan(wrongKnownSubjectPlan),
    expectedCommit: sourceCommit,
  }),
  /subject.*不匹配/,
);
assert.doesNotThrow(() => buildConsoleVerificationScript(fullPlan));

assert.throws(
  () => validateCloudAssetEvidence({
    plan: diagnosticPlan,
    evidence: buildEvidence(),
    expectedCommit: sourceCommit,
  }),
  /sourceCommit/,
);

assert.strictEqual(
  getSubjectFromAsset('assets/figures/generated/subjects/biology/topics/bio-unit-cells/cover.png'),
  'biology',
);
assert.strictEqual(
  getSubjectFromAsset('assets/figures/generated/chemistry/topics/chem-topic/cover.png'),
  'chemistry',
);
assert.strictEqual(getSubjectFromAsset('assets/figures/generated/other/topic.png'), null);

assert.deepStrictEqual(
  buildVerificationBatches(Array.from({ length: 51 }, (_, index) => ({ fileID: `cloud://asset-${index}` })))
    .map((batch) => batch.length),
  [50, 1],
);
assert.throws(
  () => buildVerificationBatches([{ fileID: 'cloud://asset-1' }], 51),
  /50/,
);

const laterPlan = { ...plan, generatedAt: '2030-01-01T00:00:00.000Z' };
assert.strictEqual(getPlanSnapshotHash(laterPlan), plan.snapshotHash);
const planWithTamperedBatches = { ...plan, batches: [] };
assert.notStrictEqual(getPlanSnapshotHash(planWithTamperedBatches), plan.snapshotHash);
assert.strictEqual(validateCloudAssetEvidence({
  plan,
  evidence: buildEvidence(),
  expectedCommit: sourceCommit,
}), true);
assert.throws(
  () => validateCloudAssetEvidence({
    plan: planWithTamperedBatches,
    evidence: buildEvidence(),
    expectedCommit: sourceCommit,
  }),
  /批次/,
);
assert.strictEqual(validateCloudAssetEvidence({
  plan,
  evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errMsg: '资源校验完成' }, ...buildEvidence().results.slice(1)] }),
  expectedCommit: sourceCommit,
}), true);
assert.strictEqual(validateCloudAssetEvidence({
  plan,
  evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errCode: 'ERR_TOKEN_PARSE', errMsg: 'token parsing failed' }, ...buildEvidence().results.slice(1)] }),
  expectedCommit: sourceCommit,
}), true);
assert.strictEqual(validateCloudAssetEvidence({
  plan,
  evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errMsg: 'a'.repeat(512) }, ...buildEvidence().results.slice(1)] }),
  expectedCommit: sourceCommit,
}), true);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errMsg: 'a'.repeat(513) }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: sourceCommit,
  }),
  /安全文本/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan: { ...plan, sourceCommit: invalidSourceCommit },
    evidence: buildEvidence(),
    expectedCommit: sourceCommit,
  }),
  /sourceCommit/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ sourceCommit: invalidSourceCommit }),
    expectedCommit: sourceCommit,
  }),
  /sourceCommit/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence(),
    expectedCommit: invalidSourceCommit,
  }),
  /sourceCommit/,
);

assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ cloudEnvId: 'cloud1-wrong' }),
    expectedCommit: sourceCommit,
  }),
  /环境/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ sourceCommit: otherSourceCommit }),
    expectedCommit: sourceCommit,
  }),
  /提交/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ planSnapshotHash: '0'.repeat(64) }),
    expectedCommit: sourceCommit,
  }),
  /快照哈希/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: buildEvidence().results.slice(1) }),
    expectedCommit: sourceCommit,
  }),
  /遗漏/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [...buildEvidence().results, buildEvidence().results[0]] }),
    expectedCommit: sourceCommit,
  }),
  /重复/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [...buildEvidence().results, {
      fileID: 'cloud://unknown',
      status: 0,
      hasTempFileURL: true,
    }] }),
    expectedCommit: sourceCommit,
  }),
  /未知/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], status: -1 }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: sourceCommit,
  }),
  /status/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], hasTempFileURL: false }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: sourceCommit,
  }),
  /临时 URL 标记/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ schemaVersion: 2 }),
    expectedCommit: sourceCommit,
  }),
  /schemaVersion/,
);
const evidenceWithoutVerifiedAt = buildEvidence();
delete evidenceWithoutVerifiedAt.verifiedAt;
assert.throws(
  () => validateCloudAssetEvidence({ plan, evidence: evidenceWithoutVerifiedAt, expectedCommit: sourceCommit }),
  /verifiedAt/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ verifiedAt: 'not-a-date' }),
    expectedCommit: sourceCommit,
  }),
  /verifiedAt/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ verifiedAt: '2026-02-30T00:00:00.000Z' }),
    expectedCommit: sourceCommit,
  }),
  /verifiedAt/,
);
[
  '2026-08-11T00:00:00.000+00:00',
  '2026-08-11T00:00:00Z',
].forEach((verifiedAt) => {
  assert.throws(
    () => validateCloudAssetEvidence({
      plan,
      evidence: buildEvidence({ verifiedAt }),
      expectedCommit: sourceCommit,
    }),
    /verifiedAt/,
  );
});
[
  buildEvidence({ signedUrl: 'https://secret.example/' }),
  buildEvidence({ results: [{ ...buildEvidence().results[0], url: 'https://secret.example/' }, ...buildEvidence().results.slice(1)] }),
  buildEvidence({ results: [{ ...buildEvidence().results[0], token: 'secret' }, ...buildEvidence().results.slice(1)] }),
  buildEvidence({ results: [{ ...buildEvidence().results[0], metadata: { signedUrl: 'https://secret.example/' } }, ...buildEvidence().results.slice(1)] }),
].forEach((evidence) => {
  assert.throws(
    () => validateCloudAssetEvidence({ plan, evidence, expectedCommit: sourceCommit }),
    /未批准字段/,
  );
});
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errMsg: { token: 'secret' } }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: sourceCommit,
  }),
  /错误字段必须为标量/,
);
[
  'https://signed.example/asset.png?X-Amz-Signature=secret',
  'https%3A%2F%2Fsigned.example%2Fasset.png%3Ftoken%3Dsecret',
  '签名失败：credential=secret',
  'https%25253A%25252F%25252Fsigned.example%25252Fasset.png%25253Ftoken%25253Dsecret',
  'request failed: access_token=secret',
  'request failed: sig=secret',
  '%FF%68%74%74%70%73%3A%2F%2Fsigned.example%2Fasset.png%3Ftoken%3Dsecret',
  'ftp://signed.example/asset.png',
  'ftp:',
  '//signed.example/asset.png',
  'https:/signed.example/asset.png',
  'https%ZZ://signed.example/asset.png',
].forEach((errMsg) => {
  assert.throws(
    () => validateCloudAssetEvidence({
      plan,
      evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errMsg }, ...buildEvidence().results.slice(1)] }),
      expectedCommit: sourceCommit,
    }),
    /安全文本/,
  );
});
const fiveTimesEncodedSignedUrl = Array.from(
  { length: 5 },
  () => null,
).reduce(
  (value) => encodeURIComponent(value),
  'https://signed.example/asset.png?token=secret',
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errMsg: fiveTimesEncodedSignedUrl }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: sourceCommit,
  }),
  /安全文本/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errCode: 'https://signed.example/?token=secret' }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: sourceCommit,
  }),
  /errCode/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], tempFileURL: 'https://secret.example/' }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: sourceCommit,
  }),
  /临时 URL/,
);

const consoleScript = buildConsoleVerificationScript(plan);
assert.match(consoleScript, /getImageTempUrls/);
assert.match(consoleScript, /hasTempFileURL/);
assert.doesNotMatch(consoleScript, /JSON\.stringify\([^)]*tempFileURL/);
assert.doesNotMatch(consoleScript, /uploadFile|getTempFileURL/);

const cliFixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-cloud-asset-deployment-'));
const cliManifestPath = path.join(cliFixtureRoot, 'manifest.json');
const cliPlanPath = path.join(cliFixtureRoot, 'plan.json');
const cliEvidencePath = path.join(cliFixtureRoot, 'evidence.json');

function runCli(script, args) {
  return childProcess.execFileSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

try {
  fs.writeFileSync(cliManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const buildOutput = runCli('build-cloud-asset-deployment-plan.js', [
    '--manifest', cliManifestPath,
    '--output', cliPlanPath,
    '--subject', 'biology',
    '--commit', sourceCommit,
  ]);
  assert.match(buildOutput, /cloud asset deployment plan/);

  const cliPlan = JSON.parse(fs.readFileSync(cliPlanPath, 'utf8'));
  assert(cliPlan.assets.some((asset) => asset.source.endsWith('bio-unit-cells/cover.png')));
  assert(cliPlan.assets.every((asset) => asset.source.includes('/biology/')));
  assert(fs.existsSync(path.join(path.dirname(cliPlanPath), 'verify-in-devtools.js')));
  assert.throws(
    () => runCli('build-cloud-asset-deployment-plan.js', [
      '--manifest', cliManifestPath,
      '--output', cliPlanPath,
      '--subject', 'biologgy',
      '--commit', sourceCommit,
    ]),
    (error) => /FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES/.test(error.stderr) && /biologgy/.test(error.stderr),
  );

  fs.writeFileSync(cliEvidencePath, `${JSON.stringify({
    schemaVersion: 1,
    verifiedAt: '2026-08-11T00:00:00.000Z',
    cloudEnvId: cliPlan.cloudEnvId,
    sourceCommit,
    planSnapshotHash: cliPlan.snapshotHash,
    results: cliPlan.assets.map((asset) => ({
      fileID: asset.fileID,
      status: 0,
      hasTempFileURL: true,
    })),
  }, null, 2)}\n`);
  assert.strictEqual(
    runCli('check-cloud-asset-deployment-evidence.js', [cliPlanPath, cliEvidencePath, '--commit', sourceCommit]),
    `OK cloud asset deployment evidence: ${cliPlan.assetCount} assets verified\n`,
  );

  const failedEvidence = JSON.parse(fs.readFileSync(cliEvidencePath, 'utf8'));
  failedEvidence.results[0].status = 1;
  fs.writeFileSync(cliEvidencePath, `${JSON.stringify(failedEvidence, null, 2)}\n`);
  assert.throws(
    () => runCli('check-cloud-asset-deployment-evidence.js', [cliPlanPath, cliEvidencePath, '--commit', sourceCommit]),
    (error) => /FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES/.test(error.stderr),
  );
  assert.throws(
    () => runCli('check-cloud-asset-deployment-evidence.js', [cliPlanPath, cliEvidencePath]),
    (error) => /FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES/.test(error.stderr),
  );
  fs.writeFileSync(cliEvidencePath, '{ invalid json\n');
  assert.throws(
    () => runCli('check-cloud-asset-deployment-evidence.js', [cliPlanPath, cliEvidencePath, '--commit', sourceCommit]),
    (error) => /FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES/.test(error.stderr),
  );
  fs.writeFileSync(cliPlanPath, `${JSON.stringify(zeroAssetPlan, null, 2)}\n`);
  fs.writeFileSync(cliEvidencePath, `${JSON.stringify(zeroAssetEvidence, null, 2)}\n`);
  assert.throws(
    () => runCli('check-cloud-asset-deployment-evidence.js', [cliPlanPath, cliEvidencePath, '--commit', sourceCommit]),
    (error) => /FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES/.test(error.stderr) && /资源数量/.test(error.stderr),
  );
  fs.writeFileSync(cliPlanPath, `${JSON.stringify(typoSubjectPlan, null, 2)}\n`);
  fs.writeFileSync(cliEvidencePath, `${JSON.stringify(buildEvidenceForPlan(typoSubjectPlan), null, 2)}\n`);
  assert.throws(
    () => runCli('check-cloud-asset-deployment-evidence.js', [cliPlanPath, cliEvidencePath, '--commit', sourceCommit]),
    (error) => /FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES/.test(error.stderr) && /subject.*biologgy/.test(error.stderr),
  );
} finally {
  fs.rmSync(cliFixtureRoot, { recursive: true, force: true });
}

const readinessScript = path.join(__dirname, 'check-release-readiness.js');
const missingEvidencePath = path.join(
  os.tmpdir(),
  `knows-missing-cloud-asset-evidence-${process.pid}-${Date.now()}.json`,
);
fs.rmSync(missingEvidencePath, { force: true });
const readinessEnvironment = {
  ...process.env,
  CLOUD_ASSET_DEPLOYMENT_EVIDENCE: missingEvidencePath,
};
const defaultReadiness = childProcess.spawnSync(process.execPath, [readinessScript], {
  cwd: path.resolve(__dirname, '..'),
  encoding: 'utf8',
  env: readinessEnvironment,
});
assert.doesNotMatch(
  `${defaultReadiness.stdout}${defaultReadiness.stderr}`,
  /云资源部署证据/,
  '默认发布检查不得要求云资源部署证据',
);
assert.ok(!fs.existsSync(missingEvidencePath), '默认发布检查不得生成云资源部署证据');

const strictReadiness = childProcess.spawnSync(process.execPath, [readinessScript, '--require-device-evidence'], {
  cwd: path.resolve(__dirname, '..'),
  encoding: 'utf8',
  env: readinessEnvironment,
});
assert.notStrictEqual(strictReadiness.status, 0, '严格发布检查必须在缺少云资源部署证据时阻断');
assert.match(
  `${strictReadiness.stdout}${strictReadiness.stderr}`,
  /云资源部署证据:.*文件不存在/,
  '严格发布检查必须明确报告缺少云资源部署证据',
);
assert.ok(!fs.existsSync(missingEvidencePath), '严格发布检查不得生成伪造云资源部署证据');

console.log('OK cloud asset deployment contract');
