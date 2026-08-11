# 云资源部署证据 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为所有运行时云图片建立可复现的部署与签名验证证据，并在严格发布模式中拒绝缺失、过期或跨环境的云资源证明。

**Architecture:** `scripts/cloud-asset-deployment.js` 以现有压缩 manifest 和固定云配置为唯一输入，产生稳定快照、50 项验证批次和不含临时 URL 的证据模型。两个 CLI 只读写 `dist/` 与 `.codex-output/` 产物；严格发布检查调用同一验证器，默认质量矩阵只运行其离线契约测试。

**Tech Stack:** Node.js CommonJS、`crypto`、现有资源 manifest、微信云函数 `getImageTempUrls`、微信开发者工具控制台。

## Global Constraints

- 不自动上传云存储文件、不生成体验版、不上传小程序、不创建 RC、标签或审核请求。
- 不修改 AppID、云环境 ID、稳定内容 ID、路由、本地存储 schema、用户数据或运行时搜索行为。
- 云端结果证据只保存 `fileID`、状态、时间、环境、提交和快照哈希；不得保存 `tempFileURL` 或签名参数。
- 普通质量矩阵必须能在未登录云环境中运行；只有 `--require-device-evidence` 严格模式要求实际云资源证据。
- 文字降级继续是运行时可读性保障，不等同于资源部署成功。

---

### Task 1: 云资源计划与证据领域模型

**Files:**
- Create: `scripts/cloud-asset-deployment.js`
- Test: `scripts/cloud-asset-deployment.test.js`

**Interfaces:**
- Consumes: 压缩资源 manifest `{ assets: [{ source, cloudPath, width, height, bytes, sha256 }] }` 与 `utils/asset-config.js` 的 `REMOTE_ASSET_BASE`、`CLOUD_ENV_ID`。
- Produces: `buildCloudAssetPlan({ manifest, sourceCommit, subject })`、`getPlanSnapshotHash(plan)`、`buildVerificationBatches(assets)`、`validateCloudAssetEvidence({ plan, evidence, expectedCommit })`。
- Invariants: 计划的 `fileID` 由固定云基址和 `cloudPath` 构成；批次最多 50 项；哈希不受生成时间影响；证据禁止临时 URL。

- [x] **Step 1: 写入失败的领域模型测试**

创建 `scripts/cloud-asset-deployment.test.js`，先引用尚不存在的模块并使用合成 manifest：

```js
const assert = require('assert');
const {
  buildCloudAssetPlan,
  validateCloudAssetEvidence,
} = require('./cloud-asset-deployment');

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
assert(plan.assets.every((asset) => asset.fileID.includes('cloud1-d3gm5t961d46590c3')));
assert(plan.assets.some((asset) => asset.source.endsWith('bio-unit-cells/cover.png')));
assert.throws(
  () => validateCloudAssetEvidence({ plan, evidence: { tempFileURL: 'https://secret.example/' }, expectedCommit: 'abc123' }),
  /临时 URL/,
);
console.log('OK cloud asset deployment contract');
```

- [x] **Step 2: 运行测试并确认失败**

Run: `node scripts/cloud-asset-deployment.test.js`

Expected: FAIL，错误为找不到 `./cloud-asset-deployment`。

- [x] **Step 3: 实现最小领域模型**

创建 `scripts/cloud-asset-deployment.js` 并导出：

```js
function getSubjectFromAsset(source) {}
function buildVerificationBatches(assets, batchSize = 50) {}
function buildCloudAssetPlan({ manifest, sourceCommit = null, subject = null }) {}
function getPlanSnapshotHash(plan) {}
function validateCloudAssetEvidence({ plan, evidence, expectedCommit }) {}
module.exports = {
  buildCloudAssetPlan,
  buildVerificationBatches,
  getPlanSnapshotHash,
  getSubjectFromAsset,
  validateCloudAssetEvidence,
};
```

验证器必须要求 `schemaVersion === 1`、环境/提交/快照哈希一致、结果 `fileID` 集合严格等于计划、每项 `status === 0` 且 `hasTempFileURL === true`；拒绝重复、未知、遗漏结果和任何 `tempFileURL` 键。

- [x] **Step 4: 扩展边界测试并确认通过**

补充 51 项资源分为 `50 + 1`、不同 `generatedAt` 的同一资产哈希不变、错误环境、错误提交、遗漏、重复、非零状态和临时 URL 均失败。

Run: `node scripts/cloud-asset-deployment.test.js`

Expected: `OK cloud asset deployment contract`。

- [x] **Step 5: 提交领域模型**

```bash
git add scripts/cloud-asset-deployment.js scripts/cloud-asset-deployment.test.js
git commit -m "feat(release): model cloud asset evidence"
```

### Task 2: 可执行计划与无敏感证据 CLI

**Files:**
- Create: `scripts/build-cloud-asset-deployment-plan.js`
- Create: `scripts/check-cloud-asset-deployment-evidence.js`
- Modify: `scripts/cloud-asset-deployment.js`
- Modify: `scripts/cloud-asset-deployment.test.js`

**Interfaces:**
- Consumes: `dist/remote-assets/manifest.json` 与 Task 1 的领域模型。
- Produces: `dist/cloud-asset-deployment/plan.json`、`dist/cloud-asset-deployment/verify-in-devtools.js`，后者只调用现有 `getImageTempUrls`。
- Validates: `node scripts/check-cloud-asset-deployment-evidence.js <plan> <evidence> --commit <sha>` 成功时输出已验证资产数量，失败时输出 `FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES`。

- [x] **Step 1: 写入失败的 CLI 与控制台脚本断言**

扩展领域模型测试：

```js
const { buildConsoleVerificationScript } = require('./cloud-asset-deployment');
const script = buildConsoleVerificationScript(plan);
assert.match(script, /getImageTempUrls/);
assert.match(script, /hasTempFileURL/);
assert.doesNotMatch(script, /JSON\\.stringify\\([^)]*tempFileURL/);
```

用 `child_process.execFileSync` 调用尚不存在的 CLI，断言 biology 计划包含 cells cover，验证 CLI 拒绝 `status: 1` 的证据。

- [x] **Step 2: 运行测试并确认失败**

Run: `node scripts/cloud-asset-deployment.test.js`

Expected: FAIL，提示缺少 `buildConsoleVerificationScript` 或 CLI 文件。

- [x] **Step 3: 实现 CLI 与控制台脚本**

`build-cloud-asset-deployment-plan.js` 支持：

```bash
node scripts/build-cloud-asset-deployment-plan.js \
  --manifest dist/remote-assets/manifest.json \
  --output dist/cloud-asset-deployment/plan.json \
  --subject biology \
  --commit "$(git rev-parse HEAD)"
```

它生成计划与同目录 `verify-in-devtools.js`。每批调用：

```js
wx.cloud.callFunction({ name: 'getImageTempUrls', data: { fileIDs } })
```

控制台脚本只输出 `{ fileID, status, errCode, errMsg, hasTempFileURL }`，不得输出临时 URL。验证 CLI 读取 JSON，调用 Task 1 验证器并输出：

```text
OK cloud asset deployment evidence: <count> assets verified
```

- [x] **Step 4: 运行 CLI 与测试验证**

Run:

```bash
node scripts/prepare-remote-assets.js
node scripts/build-cloud-asset-deployment-plan.js --subject biology --commit "$(git rev-parse HEAD)"
node scripts/cloud-asset-deployment.test.js
```

Expected: biology 计划包含 `bio-unit-cells/cover.png`，不含 chemistry 路径；测试通过；`dist/` 产物不进入 Git。

- [x] **Step 5: 提交 CLI**

```bash
git add scripts/cloud-asset-deployment.js scripts/cloud-asset-deployment.test.js scripts/build-cloud-asset-deployment-plan.js scripts/check-cloud-asset-deployment-evidence.js
git commit -m "feat(release): build cloud asset verification plan"
```

### Task 3: 严格发布证据门禁与质量矩阵

**Files:**
- Modify: `scripts/check-release-readiness.js`
- Modify: `scripts/check-v1.11-quality-matrix.js`
- Modify: `scripts/check-v1.11-quality-matrix.test.js`
- Modify: `scripts/check-roadmap-document-consistency.test.js`
- Modify: `scripts/cloud-asset-deployment.test.js`

**Interfaces:**
- Consumes: Task 1 验证器、实际资源 manifest、`CLOUD_ASSET_DEPLOYMENT_EVIDENCE` 和当前 Git 提交。
- Produces: 严格 `--require-device-evidence` 下的明确发布阻断；默认发布检查不要求现场云资源证据。
- Preserves: 热修复范围只在 `--require-hotfix-scope` 下执行，默认矩阵继续无云凭据可运行。

- [x] **Step 1: 写失败的发布门禁断言**

在领域模型测试中验证缺少严格 evidence 路径时抛出“云资源部署证据”错误。在质量矩阵测试中先加入：

```js
assert.ok(defaultCommands.some((item) => item.script === 'scripts/cloud-asset-deployment.test.js'));
assert.strictEqual(defaultCommands.length, 126, '默认质量矩阵必须保持 126 项');
```

同时把 `check-roadmap-document-consistency.test.js` 的 `bindingQualityCheckCount` 改为 `126`，并把三条“不得记录非 125 项”的负向正则与注入样例同步为 126；该契约仍须拒绝任何与命令实际数量不一致的路线文档。

- [x] **Step 2: 运行测试并确认失败**

Run: `node scripts/check-v1.11-quality-matrix.test.js`

Expected: FAIL，因为新契约尚未登记，默认数量仍为 125。

- [x] **Step 3: 接入严格门禁**

在 `check-release-readiness.js` 新增只在 `--require-device-evidence` 调用的 `checkCloudAssetDeploymentEvidence()`：

```js
const evidencePath = process.env.CLOUD_ASSET_DEPLOYMENT_EVIDENCE
  || '.codex-output/release-regression-v1.10.1/cloud-asset-evidence.json';
```

它必须读取现有 `dist/remote-assets/manifest.json`，通过 `execFileSync('git', ['rev-parse', 'HEAD'])` 取得提交，并调用 `validateCloudAssetEvidence`。失败只追加 `issues`，不得生成或改写证据。

在 `DEFAULT_CHECKS` 登记离线 `scripts/cloud-asset-deployment.test.js` 并将计数改为 126；不能将真实 evidence CLI 登记为默认检查。

- [x] **Step 4: 验证默认与严格路径**

Run:

```bash
node scripts/check-v1.11-quality-matrix.test.js
node scripts/check-v1.11-quality-matrix.js
node scripts/check-release-readiness.js --require-device-evidence
```

Expected: 前两条通过并显示 126 项；第三条因实体机、包体和云资源证据未提供而阻断，其中明确出现云资源部署证据提示，且不生成伪造证据。

- [x] **Step 5: 提交门禁**

```bash
git add scripts/check-release-readiness.js scripts/check-v1.11-quality-matrix.js scripts/check-v1.11-quality-matrix.test.js scripts/check-roadmap-document-consistency.test.js scripts/cloud-asset-deployment.test.js
git commit -m "test(release): require cloud asset evidence strictly"
```

### Task 4: 路线文档、最终验证与开发者工具交接

**Files:**
- Modify: `README.md`
- Modify: `docs/v1.11后续开发路线.md`
- Modify: `docs/后续开发与发布路线.md`
- Modify: `docs/v1.10发布前实体设备回归清单.md`
- Modify: `docs/superpowers/plans/2026-08-11-cloud-asset-release-evidence-v1.15.md`

**Interfaces:**
- Consumes: 已实现 CLI、严格发布门禁和 v1.14 中已发现的 biology 云图缺失。
- Produces: 精确的 biology 上传/全量签名验证步骤；不写入未发生的云端结果。
- Preserves: 体验版、实体机、弱网、上传和审核仍是独立发布前置，不因工具完成而通过。

- [ ] **Step 1: 写入真实操作说明**

将默认质量矩阵数量更新为 126，并加入如下操作顺序：

```bash
node scripts/prepare-remote-assets.js
node scripts/build-cloud-asset-deployment-plan.js --subject biology --commit "$(git rev-parse HEAD)"
# 在绑定 AppID 的开发者工具云存储面板按 plan.json 上传 biology 路径；此步骤不是脚本自动上传。
# 在开发者工具控制台运行 verify-in-devtools.js，把去除临时 URL 的输出保存为本地 evidence JSON。
CLOUD_ASSET_DEPLOYMENT_EVIDENCE=.codex-output/release-regression-v1.10.1/cloud-asset-evidence.json \
node scripts/check-cloud-asset-deployment-evidence.js \
  dist/cloud-asset-deployment/plan.json \
  "$CLOUD_ASSET_DEPLOYMENT_EVIDENCE" \
  --commit "$(git rev-parse HEAD)"
```

明确当前分支尚未上传 biology 资源，也尚未取得实体机、弱网、包体、体验版证据。

- [ ] **Step 2: 运行最终静态与 Git 验证**

Run:

```bash
node scripts/prepare-remote-assets.js
node scripts/build-cloud-asset-deployment-plan.js --subject biology --commit "$(git rev-parse HEAD)"
node scripts/check-cloud-asset-deployment-evidence.js dist/cloud-asset-deployment/plan.json /tmp/missing-cloud-evidence.json --commit "$(git rev-parse HEAD)"
node scripts/check-v1.11-quality-matrix.js
git diff --check
git status --short
```

Expected: 前两个构建成功；第三条明确失败但不产生文件；矩阵 126 项通过；`dist/` 与 `.codex-output/` 不进入暂存区。

- [ ] **Step 3: 记录真实验证状态**

在本计划末尾添加 `## Verification Record`，记录实际命令、biology 计划资产数量和严格证据缺失的预期阻断。只有云存储上传和控制台实际调用发生后才记录云端成功。

- [ ] **Step 4: 提交并推送开发分支**

```bash
git add README.md docs/v1.11后续开发路线.md docs/后续开发与发布路线.md docs/v1.10发布前实体设备回归清单.md docs/superpowers/plans/2026-08-11-cloud-asset-release-evidence-v1.15.md
git commit -m "docs(release): guide cloud asset evidence"
git push -u origin codex/cloud-asset-release-evidence-v1.15
```

Expected: 仅新增开发分支，不创建 PR、标签、RC、体验版或审核请求。

## Verification Record

- `node scripts/prepare-remote-assets.js`：通过，生成 `231` 个本地远程资源清单项到 ignored `dist/remote-assets/`。
- `node scripts/build-cloud-asset-deployment-plan.js --subject biology --commit "$(git rev-parse HEAD)"`：通过；基于 `1ff70f1bdf9fa87e8a984d57a68b4d22e8c6abe8` 生成 biology 计划，实际资产数为 `12`。
- `node scripts/check-cloud-asset-deployment-evidence.js dist/cloud-asset-deployment/plan.json /tmp/missing-cloud-evidence.json --commit "$(git rev-parse HEAD)"`：预期阻断，退出码 `1`，精确输出为 `FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES: 证据 必须为可读取的 JSON 文件`；`/tmp/missing-cloud-evidence.json` 未被创建。
- `node scripts/check-v1.11-quality-matrix.js`：首次运行在 `[122/126] 路线文档一致性契约` 因既有发布边界的连续字串被文档扩展打断而失败；恢复该既有边界并保留云资源要求后，第二次运行通过，输出 `OK v1.11 quality matrix: 126 checks`。
- `node scripts/check-roadmap-document-consistency.test.js`：在上述文档修正后通过，输出 `OK roadmap document consistency contract`。
- `git diff --check`：通过，无输出；`git status --short`：当时仅列出五份获准的文档修改，`dist/` 与 `.codex-output/` 未进入暂存区。

未执行任何云存储上传、绑定 AppID 的 DevTools 云存储面板操作、DevTools 控制台 `verify-in-devtools.js` 调用、微信开发者工具/云端调用、实体机或弱网回归、当前构建包体/体验版/小程序上传、RC、标签、PR 或审核请求。当前 `assets/figures/generated/subjects/biology/topics/bio-unit-cells/cover.png` 的云对象仍未确认；文字降级可读不构成部署成功。Task 4 复选框保持未完成，等待独立审查。
