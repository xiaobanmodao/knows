const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

const {
  buildCloudAssetPlan,
  buildConsoleVerificationScript,
  buildVerificationBatches,
  getPlanSnapshotHash,
  validateCloudAssetPlan,
  validateCloudAssetEvidence,
  validateStrictCloudAssetEvidence,
} = require('./cloud-asset-deployment');
const {
  createRemoteAssetManifest,
  getSubjectFromAsset,
  validateCurrentRemoteAssetManifest,
  validateRemoteAssetManifest,
} = require('./remote-asset-manifest');
const { REMOTE_ASSET_BASE } = require('../utils/asset-config');

const manifest = {
  version: 2,
  generatedAt: '2026-08-11T00:00:00.000Z',
  assetCount: 5,
  assets: [
    { source: 'assets/figures/generated/subjects/biology/topics/bio-unit-cells/cover.png', cloudPath: '/assets/figures/generated/subjects/biology/topics/bio-unit-cells/cover.png', width: 1280, height: 900, bytes: 1024, sha256: 'a'.repeat(64), sourceSha256: '1'.repeat(64) },
    { source: 'assets/figures/generated/chemistry/topics/chem-topic/cover.png', cloudPath: '/assets/figures/generated/chemistry/topics/chem-topic/cover.png', width: 1280, height: 900, bytes: 1024, sha256: 'b'.repeat(64), sourceSha256: '2'.repeat(64) },
    { source: 'assets/figures/generated/subjects/biology/topics/bio-unit-cells/diagram.png', cloudPath: '/assets/figures/generated/subjects/biology/topics/bio-unit-cells/diagram.png', width: 960, height: 675, bytes: 512, sha256: 'c'.repeat(64), sourceSha256: '3'.repeat(64) },
    { source: 'assets/figures/generated/templates/model-factorization.png', cloudPath: '/assets/figures/generated/templates/model-factorization.png', width: 960, height: 675, bytes: 768, sha256: 'd'.repeat(64), sourceSha256: '4'.repeat(64) },
    { source: 'assets/figures/generated/subjects/english/topics/eng-topic-reading/cover.png', cloudPath: '/assets/figures/generated/subjects/english/topics/eng-topic-reading/cover.png', width: 960, height: 675, bytes: 640, sha256: 'e'.repeat(64), sourceSha256: '5'.repeat(64) },
  ],
};
const sourceCommit = '1010edcb9c1a4427b7b2822b9f41728850091b6b';
const otherSourceCommit = 'fedcba9876543210fedcba9876543210fedcba98';
const invalidSourceCommit = 'https://signed.example/?token=secret';
const hostilePayload = 'https://signed.example/asset.png?token=secret';
const rawCloudErrorMetadata = [
  { errMsg: 'Resource available' },
  { errMsg: 'token parsing failed' },
  { errMsg: 'Bearer top-secret' },
  { errMsg: 'password top-secret' },
  { errMsg: 'client_secret top-secret' },
  { errCode: 'SAFE_ERROR' },
  { errCode: 'AKIAIOSFODNN7EXAMPLE' },
];

function assertSanitizedReject(action, expectedPattern, payloads = [hostilePayload]) {
  assert.throws(action, (error) => (
    expectedPattern.test(error.message)
    && payloads.every((payload) => !error.message.includes(payload))
    && !/https:\/\/|token=|signature=/i.test(error.message)
  ));
}

const plan = buildCloudAssetPlan({ manifest, sourceCommit, subject: 'biology' });
const diagnosticPlan = buildCloudAssetPlan({ manifest, subject: 'biology' });
const fullPlan = buildCloudAssetPlan({ manifest, sourceCommit });

assert.strictEqual(plan.assetCount, 2);
assert.strictEqual(diagnosticPlan.sourceCommit, null);
assert.strictEqual(plan.batches.length, 1);
assert.strictEqual(fullPlan.subject, null);
assert.strictEqual(fullPlan.assetCount, 5);
assert.strictEqual(buildCloudAssetPlan({ manifest, sourceCommit, subject: 'math' }).assetCount, 1);
assert.deepStrictEqual(
  plan.assets.map((asset) => Object.keys(asset).sort()),
  plan.assets.map(() => [
    'bytes',
    'cloudPath',
    'fileID',
    'height',
    'sha256',
    'source',
    'sourceSha256',
    'subject',
    'width',
  ]),
);
assert.deepStrictEqual(
  plan.assets.map((asset) => asset.fileID),
  [
    `${REMOTE_ASSET_BASE}${manifest.assets[0].cloudPath}`,
    `${REMOTE_ASSET_BASE}${manifest.assets[2].cloudPath}`,
  ],
);
assert(plan.assets.some((asset) => asset.source.endsWith('bio-unit-cells/cover.png')));
assertSanitizedReject(
  () => buildCloudAssetPlan({ manifest, sourceCommit, subject: 'biologgy' }),
  /subject 无效/,
  ['biologgy'],
);
assert.throws(
  () => buildCloudAssetPlan({ manifest: { ...manifest, assetCount: 0, assets: [] }, sourceCommit }),
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
assertSanitizedReject(
  () => buildConsoleVerificationScript(typoSubjectPlan),
  /subject 无效/,
  ['biologgy'],
);
assertSanitizedReject(
  () => validateCloudAssetEvidence({
    plan: typoSubjectPlan,
    evidence: buildEvidenceForPlan(typoSubjectPlan),
    expectedCommit: sourceCommit,
  }),
  /subject 无效/,
  ['biologgy'],
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
assert.strictEqual(getSubjectFromAsset('assets/figures/generated/topics/g9-topic-circle/cover.png'), 'math');
assert.strictEqual(getSubjectFromAsset('assets/figures/generated/templates/model-factorization.png'), 'math');
assert.throws(() => getSubjectFromAsset('assets/figures/generated/other/topic.png'), /未知资源路径/);
[
  'assets/figures/generated/topics/../../secrets/cover.png',
  'assets/figures/generated/topics//g9-topic-circle/cover.png',
  'assets/figures/generated/topics/./g9-topic-circle/cover.png',
  'assets/figures/generated/topics/g9-topic-circle\\cover.png',
  'assets/figures/generated/topics/g9-topic-circle/cover.png?token=secret',
  'assets/figures/generated/topics/g9-topic-circle/cover.png#signature=secret',
  'assets/figures/generated/topics/https://host/a.png?token=top-secret',
  'assets/figures/generated/topics/g9-topic-circle/cover.jpg',
  'assets/figures/generated/topics/g9 topic circle/cover.png',
  'assets/figures/generated/topics/g9%2Dtopic-circle/cover.png',
].forEach((source) => {
  assertSanitizedReject(() => getSubjectFromAsset(source), /资源路径无效/, [source]);
});
assertSanitizedReject(() => getSubjectFromAsset(hostilePayload), /资源路径无效/);

const forgedSignedUrlPlan = JSON.parse(JSON.stringify(plan));
forgedSignedUrlPlan.assets[0].fileID = hostilePayload;
forgedSignedUrlPlan.batches[0][0].fileID = forgedSignedUrlPlan.assets[0].fileID;
forgedSignedUrlPlan.snapshotHash = getPlanSnapshotHash(forgedSignedUrlPlan);
assertSanitizedReject(
  () => validateCloudAssetPlan(forgedSignedUrlPlan),
  /fileID/,
);
assert.throws(
  () => validateCloudAssetPlan({ ...plan, signedUrl: 'https://signed.example/?token=secret' }),
  /未批准字段/,
);
const hostilePlanKey = { ...plan, [hostilePayload]: true };
assertSanitizedReject(() => validateCloudAssetPlan(hostilePlanKey), /未批准字段/);
const hostileSubjectPlan = { ...plan, subject: hostilePayload };
hostileSubjectPlan.snapshotHash = getPlanSnapshotHash(hostileSubjectPlan);
assertSanitizedReject(() => validateCloudAssetPlan(hostileSubjectPlan), /subject 无效/);
const extraAssetFieldPlan = JSON.parse(JSON.stringify(plan));
extraAssetFieldPlan.assets[0].signedUrl = 'https://signed.example/?token=secret';
assert.throws(() => validateCloudAssetPlan(extraAssetFieldPlan), /未批准字段/);
const duplicateAssetPlan = JSON.parse(JSON.stringify(plan));
duplicateAssetPlan.assets[1] = { ...duplicateAssetPlan.assets[0] };
duplicateAssetPlan.batches = buildVerificationBatches(duplicateAssetPlan.assets);
duplicateAssetPlan.snapshotHash = getPlanSnapshotHash(duplicateAssetPlan);
assert.throws(() => validateCloudAssetPlan(duplicateAssetPlan), /重复/);
const traversalPlan = JSON.parse(JSON.stringify(plan));
traversalPlan.assets[0].source = 'assets/figures/generated/topics/../../secrets/cover.png';
traversalPlan.assets[0].cloudPath = `/${traversalPlan.assets[0].source}`;
traversalPlan.assets[0].subject = 'math';
traversalPlan.assets[0].fileID = `${REMOTE_ASSET_BASE}${traversalPlan.assets[0].cloudPath}`;
traversalPlan.batches = buildVerificationBatches(traversalPlan.assets);
traversalPlan.snapshotHash = getPlanSnapshotHash(traversalPlan);
assertSanitizedReject(
  () => validateCloudAssetPlan(traversalPlan),
  /资源路径无效/,
  [traversalPlan.assets[0].source],
);
const repeatedSlashPlan = JSON.parse(JSON.stringify(plan));
repeatedSlashPlan.assets[0].source = 'assets/figures/generated/topics//g9-topic-circle/cover.png';
repeatedSlashPlan.assets[0].cloudPath = `/${repeatedSlashPlan.assets[0].source}`;
repeatedSlashPlan.assets[0].subject = 'math';
repeatedSlashPlan.assets[0].fileID = `${REMOTE_ASSET_BASE}${repeatedSlashPlan.assets[0].cloudPath}`;
repeatedSlashPlan.batches = buildVerificationBatches(repeatedSlashPlan.assets);
repeatedSlashPlan.snapshotHash = getPlanSnapshotHash(repeatedSlashPlan);
assertSanitizedReject(
  () => validateCloudAssetPlan(repeatedSlashPlan),
  /资源路径无效/,
  [repeatedSlashPlan.assets[0].source],
);
const hostileSourcePlan = JSON.parse(JSON.stringify(plan));
hostileSourcePlan.assets[0].source = hostilePayload;
hostileSourcePlan.assets[0].cloudPath = `/${hostilePayload}`;
hostileSourcePlan.assets[0].subject = 'math';
hostileSourcePlan.assets[0].fileID = `${REMOTE_ASSET_BASE}${hostileSourcePlan.assets[0].cloudPath}`;
hostileSourcePlan.batches = buildVerificationBatches(hostileSourcePlan.assets);
hostileSourcePlan.snapshotHash = getPlanSnapshotHash(hostileSourcePlan);
assertSanitizedReject(() => validateCloudAssetPlan(hostileSourcePlan), /资源路径无效/);

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
rawCloudErrorMetadata.forEach((metadata) => {
  const payload = Object.values(metadata)[0];
  assert.throws(
    () => validateCloudAssetEvidence({
      plan,
      evidence: buildEvidence({
        results: [{ ...buildEvidence().results[0], ...metadata }, ...buildEvidence().results.slice(1)],
      }),
      expectedCommit: sourceCommit,
    }),
    (error) => /证据结果\[0\].*未批准字段/.test(error.message)
      && !error.message.includes(payload)
      && !/Bearer|password|client_secret|AKIA|top-secret/i.test(error.message),
  );
});
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
const untrustedResultFileID = 'https://signed.example/asset.png?token=secret';
assert.throws(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ results: [...buildEvidence().results, {
      fileID: untrustedResultFileID,
      status: 0,
      hasTempFileURL: true,
    }] }),
    expectedCommit: sourceCommit,
  }),
  (error) => /证据结果\[2\].*未知 fileID/.test(error.message)
    && !error.message.includes(untrustedResultFileID)
    && !/token=|https:\/\//i.test(error.message),
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
assertSanitizedReject(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({ [hostilePayload]: true }),
    expectedCommit: sourceCommit,
  }),
  /未批准字段/,
);
assertSanitizedReject(
  () => validateCloudAssetEvidence({
    plan,
    evidence: buildEvidence({
      results: [{ ...buildEvidence().results[0], [hostilePayload]: true }, ...buildEvidence().results.slice(1)],
    }),
    expectedCommit: sourceCommit,
  }),
  /证据结果\[0\].*未批准字段/,
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
assert.doesNotMatch(consoleScript, /errCode|errMsg/);

const manifestFixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-remote-asset-manifest-'));
const sourceRoot = path.join(manifestFixtureRoot, 'source');
const outputRoot = path.join(manifestFixtureRoot, 'output');
const sourcePaths = [
  'assets/figures/generated/subjects/biology/topics/fixture/cover.png',
  'assets/figures/generated/templates/model-factorization.png',
];
const fixtureOptions = { sourcePaths, sourceRoot, outputRoot };

function writeFixtureFile(root, relativePath, buffer) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function fakePng(width, height, fill) {
  const buffer = Buffer.alloc(32, fill);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(buffer, 0);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

try {
  sourcePaths.forEach((source, index) => {
    writeFixtureFile(sourceRoot, source, Buffer.from(`fixture-source-${index}`));
    writeFixtureFile(outputRoot, source, fakePng(40 + index, 30 + index, index + 1));
  });
  const currentManifest = createRemoteAssetManifest(sourcePaths.map((source) => ({
    source,
    sourcePath: path.join(sourceRoot, source),
    out: path.join(outputRoot, source),
  })));
  assert.strictEqual(currentManifest.version, 2);
  assert.strictEqual(currentManifest.assetCount, 2);
  assert.strictEqual(validateRemoteAssetManifest(currentManifest), true);
  assert.strictEqual(validateCurrentRemoteAssetManifest(currentManifest, fixtureOptions), true);

  assertSanitizedReject(
    () => createRemoteAssetManifest([{
      source: sourcePaths[0],
      sourcePath: hostilePayload,
      out: path.join(outputRoot, sourcePaths[0]),
    }]),
    /资源项\[0\].*原图不可读取/,
  );
  assertSanitizedReject(
    () => createRemoteAssetManifest([{
      source: sourcePaths[0],
      sourcePath: path.join(sourceRoot, sourcePaths[0]),
      out: hostilePayload,
    }]),
    /资源项\[0\].*压缩产物不可读取/,
  );

  const crossPathManifest = JSON.parse(JSON.stringify(currentManifest));
  crossPathManifest.assets[0].cloudPath = `/${sourcePaths[1]}`;
  assert.throws(
    () => validateRemoteAssetManifest(crossPathManifest),
    /cloudPath/,
  );

  const hostileSourceManifest = JSON.parse(JSON.stringify(currentManifest));
  hostileSourceManifest.assets[0].source = hostilePayload;
  hostileSourceManifest.assets[0].cloudPath = `/${hostilePayload}`;
  assertSanitizedReject(() => validateRemoteAssetManifest(hostileSourceManifest), /资源路径无效/);
  assertSanitizedReject(
    () => validateRemoteAssetManifest({ ...currentManifest, [hostilePayload]: true }),
    /未批准字段/,
  );
  const hostileAssetKeyManifest = JSON.parse(JSON.stringify(currentManifest));
  hostileAssetKeyManifest.assets[0][hostilePayload] = true;
  assertSanitizedReject(() => validateRemoteAssetManifest(hostileAssetKeyManifest), /未批准字段/);
  [
    'assets/figures/generated/topics/../../secrets/cover.png',
    'assets/figures/generated/topics//g9-topic-circle/cover.png',
  ].forEach((source) => {
    const invalidPathManifest = JSON.parse(JSON.stringify(currentManifest));
    invalidPathManifest.assets[0].source = source;
    invalidPathManifest.assets[0].cloudPath = `/${source}`;
    assertSanitizedReject(
      () => validateRemoteAssetManifest(invalidPathManifest),
      /资源路径无效/,
      [source],
    );
  });

  const truncatedManifest = {
    ...currentManifest,
    assetCount: 1,
    assets: currentManifest.assets.slice(0, 1),
  };
  assert.throws(
    () => validateCurrentRemoteAssetManifest(truncatedManifest, fixtureOptions),
    /资源集合/,
  );

  const sourceTamperedManifest = JSON.parse(JSON.stringify(currentManifest));
  sourceTamperedManifest.assets[0].sourceSha256 = '0'.repeat(64);
  assert.throws(
    () => validateCurrentRemoteAssetManifest(sourceTamperedManifest, fixtureOptions),
    /sourceSha256/,
  );

  const outputTamperedManifest = JSON.parse(JSON.stringify(currentManifest));
  outputTamperedManifest.assets[0].sha256 = '0'.repeat(64);
  assert.throws(
    () => validateCurrentRemoteAssetManifest(outputTamperedManifest, fixtureOptions),
    /sha256/,
  );

  writeFixtureFile(sourceRoot, sourcePaths[0], Buffer.from('rewritten-source'));
  assert.throws(
    () => validateCurrentRemoteAssetManifest(currentManifest, fixtureOptions),
    /sourceSha256/,
  );
  writeFixtureFile(sourceRoot, sourcePaths[0], Buffer.from('fixture-source-0'));
  writeFixtureFile(outputRoot, sourcePaths[0], fakePng(99, 88, 9));
  assert.throws(
    () => validateCurrentRemoteAssetManifest(currentManifest, fixtureOptions),
    /sha256/,
  );
  writeFixtureFile(outputRoot, sourcePaths[0], fakePng(40, 30, 1));

  const fixturePlan = buildCloudAssetPlan({ manifest: currentManifest, sourceCommit });
  assert.strictEqual(validateStrictCloudAssetEvidence({
    manifest: currentManifest,
    evidence: buildEvidenceForPlan(fixturePlan),
    sourceCommit,
    manifestOptions: fixtureOptions,
  }), true);
} finally {
  fs.rmSync(manifestFixtureRoot, { recursive: true, force: true });
}

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
  const blockedPlanParent = path.join(cliFixtureRoot, 'blocked-plan-parent');
  fs.writeFileSync(blockedPlanParent, 'not a directory');
  const hostilePlanOutput = `${blockedPlanParent}/https://host/a?token=top-secret&signature=x/plan.json`;
  assert.throws(
    () => runCli('build-cloud-asset-deployment-plan.js', [
      '--manifest', cliManifestPath,
      '--output', hostilePlanOutput,
      '--subject', 'biology',
      '--commit', sourceCommit,
    ]),
    (error) => /FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES/.test(error.stderr)
      && /部署计划输出写入失败/.test(error.stderr)
      && !error.stderr.includes(hostilePlanOutput)
      && !/https:\/\/|token=|signature=|top-secret/i.test(error.stderr),
  );
  const buildOutput = runCli('build-cloud-asset-deployment-plan.js', [
    '--manifest', cliManifestPath,
    '--output', cliPlanPath,
    '--subject', 'biology',
    '--commit', sourceCommit,
  ]);
  assert.match(buildOutput, /cloud asset deployment plan/);
  const hostileCliArgument = '--https://host/a?token=top-secret';
  assert.throws(
    () => runCli('build-cloud-asset-deployment-plan.js', [hostileCliArgument]),
    (error) => /FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES/.test(error.stderr)
      && /未知命令行参数/.test(error.stderr)
      && !error.stderr.includes(hostileCliArgument)
      && !/https:\/\/|token=|top-secret/i.test(error.stderr),
  );

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
    (error) => /FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES/.test(error.stderr)
      && /subject 无效/.test(error.stderr)
      && !/biologgy/.test(error.stderr),
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
    (error) => /FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES/.test(error.stderr)
      && /subject 无效/.test(error.stderr)
      && !/biologgy/.test(error.stderr),
  );
} finally {
  fs.rmSync(cliFixtureRoot, { recursive: true, force: true });
}

const prepareFixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-prepare-remote-assets-'));
try {
  const blockedPrepareParent = path.join(prepareFixtureRoot, 'blocked-prepare-parent');
  fs.writeFileSync(blockedPrepareParent, 'not a directory');
  const hostilePrepareOutput = `${blockedPrepareParent}/https://host/a?token=top-secret&signature=x`;
  const prepareFailure = childProcess.spawnSync(
    process.execPath,
    [path.join(__dirname, 'prepare-remote-assets.js'), hostilePrepareOutput],
    {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
    },
  );
  const prepareFailureOutput = `${prepareFailure.stdout}${prepareFailure.stderr}`;
  assert.notStrictEqual(prepareFailure.status, 0);
  assert.match(prepareFailureOutput, /FOUND_REMOTE_ASSET_PREPARATION_ISSUES/);
  assert.doesNotMatch(prepareFailureOutput, /https:\/\/|token=|signature=|top-secret/i);
  assert.ok(!prepareFailureOutput.includes(hostilePrepareOutput));
} finally {
  fs.rmSync(prepareFixtureRoot, { recursive: true, force: true });
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

const consoleLogs = [];
vm.runInNewContext(buildConsoleVerificationScript(fullPlan), {
  wx: {
    cloud: {
      callFunction: async ({ data }) => ({
        result: {
          fileList: data.fileIDs.map((fileID, index) => ({
            fileID,
            status: 0,
            tempFileURL: `https://signed.example/asset.png?token=${encodeURIComponent(fileID)}&signature=secret`,
            errCode: index % 2 === 0 ? 'AKIAIOSFODNN7EXAMPLE' : 'ASIAIOSFODNN7EXAMPLE',
            errMsg: index % 2 === 0 ? 'password top-secret' : 'client_secret top-secret',
          })),
        },
      }),
    },
  },
  console: {
    log: (...args) => consoleLogs.push(args),
  },
  Map,
  Date,
  JSON,
  Boolean,
  Number,
  Array,
  String,
}).then(() => {
  assert.strictEqual(consoleLogs.length, 1);
  assert.strictEqual(consoleLogs[0].length, 1);
  assert.strictEqual(typeof consoleLogs[0][0], 'string');
  const loggedEvidence = consoleLogs[0][0];
  const parsedEvidence = JSON.parse(loggedEvidence);
  assert.strictEqual(parsedEvidence.results.length, fullPlan.assetCount);
  assert.deepStrictEqual(
    parsedEvidence.results.map((result) => result.fileID).sort(),
    fullPlan.assets.map((asset) => asset.fileID).sort(),
  );
  assert.deepStrictEqual(
    parsedEvidence.results.map((result) => Object.keys(result).sort()),
    parsedEvidence.results.map(() => ['fileID', 'hasTempFileURL', 'status']),
  );
  assert.strictEqual(parsedEvidence.results.every((result) => result.hasTempFileURL === true), true);
  assert.strictEqual(validateCloudAssetEvidence({
    plan: fullPlan,
    evidence: parsedEvidence,
    expectedCommit: sourceCommit,
  }), true);
  assert.doesNotMatch(loggedEvidence, /https:\/\//);
  assert.doesNotMatch(loggedEvidence, /tempFileURL/);
  assert.doesNotMatch(loggedEvidence, /token=/i);
  assert.doesNotMatch(loggedEvidence, /signature=/i);
  assert.doesNotMatch(loggedEvidence, /errCode|errMsg|AKIA|ASIA|password|client_secret|top-secret/i);
  console.log('OK cloud asset deployment contract');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
