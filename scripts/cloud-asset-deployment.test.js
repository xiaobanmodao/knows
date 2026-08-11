const assert = require('assert');

const {
  buildCloudAssetPlan,
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
const plan = buildCloudAssetPlan({ manifest, sourceCommit: 'abc123', subject: 'biology' });

assert.strictEqual(plan.assetCount, 2);
assert.strictEqual(plan.batches.length, 1);
assert.deepStrictEqual(
  plan.assets.map((asset) => asset.fileID),
  [
    `${REMOTE_ASSET_BASE}${manifest.assets[0].cloudPath}`,
    `${REMOTE_ASSET_BASE}${manifest.assets[2].cloudPath}`,
  ],
);
assert(plan.assets.some((asset) => asset.source.endsWith('bio-unit-cells/cover.png')));
assert.throws(
  () => validateCloudAssetEvidence({ plan, evidence: { tempFileURL: 'https://secret.example/' }, expectedCommit: 'abc123' }),
  /临时 URL/,
);

function buildEvidence(overrides = {}) {
  return {
    schemaVersion: 1,
    verifiedAt: '2026-08-11T00:00:00.000Z',
    cloudEnvId: plan.cloudEnvId,
    sourceCommit: plan.sourceCommit,
    planSnapshotHash: plan.snapshotHash,
    results: plan.assets.map((asset) => ({
      fileID: asset.fileID,
      status: 0,
      hasTempFileURL: true,
    })),
    ...overrides,
  };
}

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
assert.strictEqual(validateCloudAssetEvidence({
  plan,
  evidence: buildEvidence(),
  expectedCommit: 'abc123',
}), true);
assert.strictEqual(validateCloudAssetEvidence({
  plan,
  evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errMsg: '资源校验完成' }, ...buildEvidence().results.slice(1)] }),
  expectedCommit: 'abc123',
}), true);
assert.strictEqual(validateCloudAssetEvidence({
  plan,
  evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errCode: 'ERR_TOKEN_PARSE', errMsg: 'token parsing failed' }, ...buildEvidence().results.slice(1)] }),
  expectedCommit: 'abc123',
}), true);

assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ cloudEnvId: 'cloud1-wrong' }),
    expectedCommit: 'abc123',
  }),
  /环境/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ sourceCommit: 'def456' }),
    expectedCommit: 'abc123',
  }),
  /提交/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ planSnapshotHash: '0'.repeat(64) }),
    expectedCommit: 'abc123',
  }),
  /快照哈希/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: buildEvidence().results.slice(1) }),
    expectedCommit: 'abc123',
  }),
  /遗漏/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [...buildEvidence().results, buildEvidence().results[0]] }),
    expectedCommit: 'abc123',
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
    expectedCommit: 'abc123',
  }),
  /未知/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], status: -1 }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: 'abc123',
  }),
  /status/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], hasTempFileURL: false }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: 'abc123',
  }),
  /临时 URL 标记/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ schemaVersion: 2 }),
    expectedCommit: 'abc123',
  }),
  /schemaVersion/,
);
const evidenceWithoutVerifiedAt = buildEvidence();
delete evidenceWithoutVerifiedAt.verifiedAt;
assert.throws(
  () => validateCloudAssetEvidence({ plan, evidence: evidenceWithoutVerifiedAt, expectedCommit: 'abc123' }),
  /verifiedAt/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ verifiedAt: 'not-a-date' }),
    expectedCommit: 'abc123',
  }),
  /verifiedAt/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ verifiedAt: '2026-02-30T00:00:00.000Z' }),
    expectedCommit: 'abc123',
  }),
  /verifiedAt/,
);
[
  buildEvidence({ signedUrl: 'https://secret.example/' }),
  buildEvidence({ results: [{ ...buildEvidence().results[0], url: 'https://secret.example/' }, ...buildEvidence().results.slice(1)] }),
  buildEvidence({ results: [{ ...buildEvidence().results[0], token: 'secret' }, ...buildEvidence().results.slice(1)] }),
  buildEvidence({ results: [{ ...buildEvidence().results[0], metadata: { signedUrl: 'https://secret.example/' } }, ...buildEvidence().results.slice(1)] }),
].forEach((evidence) => {
  assert.throws(
    () => validateCloudAssetEvidence({ plan, evidence, expectedCommit: 'abc123' }),
    /未批准字段/,
  );
});
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errMsg: { token: 'secret' } }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: 'abc123',
  }),
  /错误字段必须为标量/,
);
[
  'https://signed.example/asset.png?X-Amz-Signature=secret',
  'https%3A%2F%2Fsigned.example%2Fasset.png%3Ftoken%3Dsecret',
  '签名失败：credential=secret',
  'https%25253A%25252F%25252Fsigned.example%25252Fasset.png%25253Ftoken%25253Dsecret',
  'request failed: access_token=secret',
].forEach((errMsg) => {
  assert.throws(
    () => validateCloudAssetEvidence({
      plan,
      evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errMsg }, ...buildEvidence().results.slice(1)] }),
      expectedCommit: 'abc123',
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
    expectedCommit: 'abc123',
  }),
  /安全文本/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], errCode: 'https://signed.example/?token=secret' }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: 'abc123',
  }),
  /errCode/,
);
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [{ ...buildEvidence().results[0], tempFileURL: 'https://secret.example/' }, ...buildEvidence().results.slice(1)] }),
    expectedCommit: 'abc123',
  }),
  /临时 URL/,
);

console.log('OK cloud asset deployment contract');
