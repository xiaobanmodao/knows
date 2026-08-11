# 云资源部署证据加固 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让严格发布门禁只接受当前资源、固定云基址和全量快照对应的脱敏云资源证据。

**Architecture:** `scripts/remote-asset-manifest.js` 负责 version 2 manifest 的创建、结构校验、当前资源校验和学科归属。`scripts/cloud-asset-deployment.js` 只从该 canonical 结构生成或验证计划，严格门禁在读取 evidence 前校验当前 manifest 并构造全量计划。biology 计划保留为人工补传清单，全量计划才是发布证明。

**Tech Stack:** Node.js CommonJS、`crypto`、`fs`、`vm`、现有 `asset-inventory`、本地 `dist/remote-assets` 产物。

## Global Constraints

- 不自动上传云存储文件、不调用微信开发者工具、不生成体验版、不上传小程序、不创建 RC、标签、PR 或审核请求。
- 不修改 AppID、云环境 ID、稳定内容 ID、路由、本地存储 schema、用户数据或运行时搜索行为。
- 证据和计划中不得保存或输出 `tempFileURL`、签名 URL、签名参数、凭据或不可信 `fileID` 回显。
- 默认质量矩阵必须保持无需云凭据和现场 evidence；只有 `--require-device-evidence` 要求全量云资源 evidence。
- `bio-unit-cells/cover.png`、实体机、弱网、包体、体验版和审核证据当前均未完成；文字降级不等于部署成功。
- 不新增单独的 `*.test.js` 文件，继续扩展已在默认质量矩阵登记的 `scripts/cloud-asset-deployment.test.js`，质量矩阵数量保持 126。

---

### Task 1: 当前资源 manifest 与 canonical 计划契约

**Files:**
- Create: `scripts/remote-asset-manifest.js`
- Modify: `scripts/prepare-remote-assets.js`
- Modify: `scripts/cloud-asset-deployment.js`
- Modify: `scripts/cloud-asset-deployment.test.js`

**Interfaces:**
- Produces `getSubjectFromAsset(source)`, `createRemoteAssetManifest(items)`, `validateRemoteAssetManifest(manifest)`, `validateCurrentRemoteAssetManifest(manifest, options)` from `remote-asset-manifest.js`.
- `validateCurrentRemoteAssetManifest` accepts `{ sourcePaths, sourceRoot, outputRoot }` only for fixture injection; production defaults are `collectRemoteAssets()`, repository root and `dist/remote-assets`.
- Produces `validateCloudAssetPlan(plan)` and `validateStrictCloudAssetEvidence({ manifest, evidence, sourceCommit, manifestOptions })` from `cloud-asset-deployment.js`.
- A canonical v2 asset has exactly `source`, `cloudPath`, `width`, `height`, `bytes`, `sha256`, `sourceSha256`; a canonical plan asset additionally has exactly `subject` and `fileID`.

- [x] **Step 1: 写入失败的 canonical 契约测试**

在 `scripts/cloud-asset-deployment.test.js` 先引用尚不存在的 manifest 函数和计划验证器，并添加以下行为断言：

```js
const {
  getSubjectFromAsset,
  validateCurrentRemoteAssetManifest,
  validateRemoteAssetManifest,
} = require('./remote-asset-manifest');
const { validateCloudAssetPlan } = require('./cloud-asset-deployment');

assert.strictEqual(getSubjectFromAsset('assets/figures/generated/topics/g9-topic-circle/cover.png'), 'math');
assert.strictEqual(getSubjectFromAsset('assets/figures/generated/templates/model-factorization.png'), 'math');
assert.throws(
  () => validateCloudAssetPlan(forgedSignedUrlPlan),
  /fileID/,
);
assert.throws(
  () => validateRemoteAssetManifest(crossPathManifest),
  /cloudPath/,
);
assert.throws(
  () => validateCurrentRemoteAssetManifest(truncatedManifest, fixtureOptions),
  /资源集合/,
);
```

使用临时 source/output 根目录和两个小文件构造 `fixtureOptions`；断言源哈希或压缩产物哈希任一被改写都会失败。把现有合成 manifest 增加 `sourceSha256`，并断言 `buildCloudAssetPlan({ subject: 'math' })` 对历史数学路径不为空。

使用 `vm` 运行 `buildConsoleVerificationScript(fullPlan)`，模拟 `wx.cloud.callFunction` 返回含真实样式 `tempFileURL` 与安全错误字段的 `fileList`。捕获 `console.log` 后断言仅有一个 JSON 字符串、结果含 `hasTempFileURL: true`、不含 `https://`、`tempFileURL`、`token=` 或 `signature=`。

- [x] **Step 2: 运行测试并确认失败**

Run: `node scripts/cloud-asset-deployment.test.js`

Expected: FAIL，错误为缺少 `./remote-asset-manifest` 或 `validateCloudAssetPlan`，或现有计划接受伪造 signed URL。

- [x] **Step 3: 实现最小 canonical 层**

创建 `scripts/remote-asset-manifest.js`：

```js
function getSubjectFromAsset(source) {}
function createRemoteAssetManifest(items) {}
function validateRemoteAssetManifest(manifest) {}
function validateCurrentRemoteAssetManifest(manifest, options = {}) {}
module.exports = {
  createRemoteAssetManifest,
  getSubjectFromAsset,
  validateCurrentRemoteAssetManifest,
  validateRemoteAssetManifest,
};
```

`getSubjectFromAsset` 必须把 `assets/figures/generated/topics/` 和 `assets/figures/generated/templates/` 归为 `math`，并拒绝未知路径。manifest 根对象只允许 `version`、`generatedAt`、`assetCount`、`assets`，version 固定 `2`；每项只允许七个 canonical 字段，`cloudPath` 必须严格等于 `/${source}`，两个 SHA-256 均为 64 位十六进制。`validateCurrentRemoteAssetManifest` 不能信任 manifest 的集合，必须比较完整 source 集合、重新计算原图哈希并重算当前压缩产物哈希。

修改 `prepare-remote-assets.js`，改用 `createRemoteAssetManifest(items)` 生成 version 2 manifest 和 `sourceSha256`。

修改 `cloud-asset-deployment.js`：不再展开 `...asset`；只从 canonical manifest 复制允许字段，写入 `subject` 和由 `REMOTE_ASSET_BASE + cloudPath` 推导的 `fileID`。新增 `validateCloudAssetPlan(plan)`，它拒绝额外字段、非 canonical `fileID`、未知/跨学科资源、重复值和不规范批次。`buildConsoleVerificationScript()` 与 `validateCloudAssetEvidence()` 必须先调用它。所有 evidence result 拒绝信息按结果索引报告，不拼接不可信 fileID 或 JSON 解析内容。`validateStrictCloudAssetEvidence()` 必须先调用 current manifest 校验，再构造 `subject: null` 的全量 plan 并验证 evidence。

- [x] **Step 4: 运行契约与资源校验**

Run:

```bash
node scripts/cloud-asset-deployment.test.js
node scripts/prepare-remote-assets.js
node scripts/check-remote-assets.js
```

Expected: cloud 契约通过；准备出的 manifest 为 version 2、231 项且五科学科均可归属；远程资源检查通过。

- [x] **Step 5: 提交 canonical 层**

```bash
git add scripts/remote-asset-manifest.js scripts/prepare-remote-assets.js scripts/cloud-asset-deployment.js scripts/cloud-asset-deployment.test.js
git commit -m "fix(release): canonicalize cloud asset plans"
```

### Task 2: 严格全量门禁与人工交接一致性

**Files:**
- Modify: `scripts/check-release-readiness.js`
- Modify: `scripts/cloud-asset-deployment.test.js`
- Modify: `README.md`
- Modify: `docs/v1.11后续开发路线.md`
- Modify: `docs/后续开发与发布路线.md`
- Modify: `docs/v1.10发布前实体设备回归清单.md`
- Modify: `docs/superpowers/plans/2026-08-11-cloud-asset-release-evidence-v1.15.md`

**Interfaces:**
- Consumes Task 1 `validateStrictCloudAssetEvidence({ manifest, evidence, sourceCommit })`.
- Strict release continues to use `CLOUD_ASSET_DEPLOYMENT_EVIDENCE`, but it accepts only full plan evidence derived from all current assets.
- Targeted biology plan output is `dist/cloud-asset-deployment/biology-plan.json`; full proof output is `dist/cloud-asset-deployment/release-plan.json`; each builder invocation writes the adjacent `verify-in-devtools.js` for that exact plan.

- [x] **Step 1: 写入失败的严格门禁与全量流程测试**

扩展 `scripts/cloud-asset-deployment.test.js`，生成同一 current manifest 的 biology 与 full plan。断言它们的 `assetCount` 和 `snapshotHash` 不同；把 biology evidence 传给 `validateStrictCloudAssetEvidence()` 时必须因快照不一致失败；把完整 fake success evidence 传入时必须通过云资源子门禁。

构造截断 current manifest、错误 `sourceSha256` 与错误压缩 `sha256`，确认 `validateStrictCloudAssetEvidence()` 都在 evidence 对比前拒绝。通过 `child_process.spawnSync` 调用严格 release readiness 时，使用当前 full evidence 临时文件并断言输出不含 `云资源部署证据`；随后以 biology evidence 调用并断言输出含该问题。其他实体机、包体和工具状态问题允许继续存在。

- [x] **Step 2: 运行测试并确认失败**

Run: `node scripts/cloud-asset-deployment.test.js`

Expected: FAIL，因为现有严格门禁直接构造全量计划却没有 current manifest 校验，且未对 biology/full evidence 区分。

- [x] **Step 3: 接入严格门禁并修正文档**

在 `check-release-readiness.js` 的严格路径中，解析 manifest/evidence 后调用 `validateStrictCloudAssetEvidence()`；manifest JSON 失败只追加固定脱敏 issue，不拼接 parser message。它不得生成 evidence 或调用云端。

把四份操作文档统一为两个明确阶段：

```bash
# 仅用于定位与手动补传 biology 路径，不是严格发布证明。
node scripts/prepare-remote-assets.js
node scripts/build-cloud-asset-deployment-plan.js \
  --subject biology \
  --output dist/cloud-asset-deployment/biology-plan.json \
  --commit "$(git rev-parse HEAD)"

# 所有运行时云资源的严格发布证明。
node scripts/prepare-remote-assets.js
node scripts/build-cloud-asset-deployment-plan.js \
  --output dist/cloud-asset-deployment/release-plan.json \
  --commit "$(git rev-parse HEAD)"
# 在绑定 AppID 的开发者工具控制台运行 dist/cloud-asset-deployment/verify-in-devtools.js。
export CLOUD_ASSET_DEPLOYMENT_EVIDENCE=.codex-output/release-regression-v1.10.1/cloud-asset-evidence.json
node scripts/check-cloud-asset-deployment-evidence.js \
  dist/cloud-asset-deployment/release-plan.json \
  "$CLOUD_ASSET_DEPLOYMENT_EVIDENCE" \
  --commit "$(git rev-parse HEAD)"
node scripts/check-release-readiness.js --require-device-evidence
```

明确 `verify-in-devtools.js` 会被第二次 full-plan 生成覆盖，必须在第二阶段重新粘贴；不将任何当前本地 fake evidence 写成云端成功。更新现有 Verification Record，只补充实际执行的本地加固检查与未执行外部动作。

- [x] **Step 4: 运行严格边界与文档契约**

Run:

```bash
node scripts/cloud-asset-deployment.test.js
node scripts/check-roadmap-document-consistency.test.js
node scripts/check-v1.11-quality-matrix.test.js
git diff --check
```

Expected: 所有命令通过；full evidence 子门禁可通过、biology evidence 被严格 cloud 子门禁拒绝；默认矩阵仍为 126 项且不需要现场 evidence。

- [x] **Step 5: 提交严格流程**

```bash
git add scripts/check-release-readiness.js scripts/cloud-asset-deployment.test.js README.md docs/v1.11后续开发路线.md docs/后续开发与发布路线.md docs/v1.10发布前实体设备回归清单.md docs/superpowers/plans/2026-08-11-cloud-asset-release-evidence-v1.15.md
git commit -m "fix(release): require canonical full cloud evidence"
```

### Task 3: 最终静态验证与原计划交接更新

**Files:**
- Modify: `docs/superpowers/plans/2026-08-11-cloud-asset-release-evidence-v1.15.md`
- Modify: `docs/superpowers/plans/2026-08-11-cloud-asset-release-evidence-hardening-v1.15.md`

**Interfaces:**
- Uses the current full `release-plan.json` only as an ignored local artifact; no real evidence JSON is generated.
- Preserves the existing Task 4 push step as pending until all final review gates pass.

- [x] **Step 1: 生成当前 full plan 并确认缺失证据阻断**

Run:

```bash
node scripts/prepare-remote-assets.js
node scripts/build-cloud-asset-deployment-plan.js --output dist/cloud-asset-deployment/release-plan.json --commit "$(git rev-parse HEAD)"
node scripts/check-cloud-asset-deployment-evidence.js dist/cloud-asset-deployment/release-plan.json /tmp/missing-cloud-evidence.json --commit "$(git rev-parse HEAD)"
node scripts/check-release-readiness.js --require-device-evidence
```

Expected: full plan 为 231 项；前一条 evidence CLI 和严格 release 都以缺失 evidence 阻断，且不创建 `/tmp/missing-cloud-evidence.json` 或 `.codex-output` evidence。

- [x] **Step 2: 运行完整质量矩阵与 Git 验证**

Run:

```bash
node scripts/check-v1.11-quality-matrix.js
git diff --check
git status --short
```

Expected: 输出 `OK v1.11 quality matrix: 126 checks`；仅 ignored `dist/` 产物变化，不出现未提交文件。

- [x] **Step 3: 记录真实加固状态并提交**

在原 v1.15 计划的 Verification Record 中记录实际 full-plan 数量、缺失证据阻断和未执行的外部动作。只在本加固计划三个任务全部通过独立审查后标记其复选框；不要标记原计划中“推送开发分支”完成。

```bash
git add docs/superpowers/plans/2026-08-11-cloud-asset-release-evidence-v1.15.md docs/superpowers/plans/2026-08-11-cloud-asset-release-evidence-hardening-v1.15.md
git commit -m "docs(release): record hardened cloud evidence checks"
```

### Task 4: 终审缺口修复

**Files:**
- Modify: `scripts/asset-inventory.js`
- Create: `scripts/cloud-asset-source-commit.js`
- Modify: `scripts/prepare-remote-assets.js`
- Modify: `scripts/check-release-readiness.js`
- Modify: `scripts/check-v1.11-quality-matrix.js`
- Modify: `scripts/check-v1.11-quality-matrix.test.js`
- Modify: `scripts/cloud-asset-deployment.test.js`
- Modify: `docs/superpowers/specs/2026-08-11-cloud-asset-release-evidence-v1.15-design.md`
- Modify: `docs/superpowers/plans/2026-08-11-cloud-asset-release-evidence-v1.15.md`

**Goal:** 处理终审发现的资源集合、Git 提交绑定、测试隔离和证据字段说明缺口，不扩大到没有本地原图的历史 cloud-only 存量核验。

- [x] **Step 1: 锁定 source-managed 资源范围**

先收集全部运行时图片引用，再以稳定数量与指纹区分 231 项本地 source-managed 资源和 570 条历史 cloud-only 引用；本地原图缺失必须阻断，不能再由 `existsSync` 静默缩减清单。

- [x] **Step 2: 绑定当前 Git 输入并隔离测试产物**

严格门禁必须要求资源数据、资源选择器、云配置和所有 source-managed 原图均与当前 Git 提交一致；截断 manifest 测试只能使用临时副本。不可创建的输出目录必须在启动图像处理器前失败。

- [x] **Step 3: 统一脱敏文档并复核**

证据结果固定为 `{ fileID, status, hasTempFileURL }`。运行针对性契约、完整质量矩阵和独立终审；只有通过终审后才标记本任务，原计划的推送步骤继续保持未完成。
