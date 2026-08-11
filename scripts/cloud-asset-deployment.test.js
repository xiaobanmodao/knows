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
const sourceCommit = '1010edcb9c1a4427b7b2822b9f41728850091b6b';
const otherSourceCommit = 'fedcba9876543210fedcba9876543210fedcba98';
const invalidSourceCommit = 'https://signed.example/?token=secret';
const plan = buildCloudAssetPlan({ manifest, sourceCommit, subject: 'biology' });
const diagnosticPlan = buildCloudAssetPlan({ manifest, subject: 'biology' });

assert.strictEqual(plan.assetCount, 2);
assert.strictEqual(diagnosticPlan.sourceCommit, null);
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

console.log('OK cloud asset deployment contract');
