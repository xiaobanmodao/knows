# Physics Topic Framework Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 6 个物理原创专题建立可验证的官方课程框架佐证记录，同时严格保留非逐章映射、非外部内容导入的证据边界。

**Architecture:** 在 `docs/evidence/` 保存一份人工复核 JSON。新增只读 Node 检查器将该记录与物理专题数据、专题复核快照和来源注册表交叉验证，再将检查器接入 v1.11 质量矩阵。

**Tech Stack:** Node.js CommonJS、`assert`、现有 `physics-content`、`topic-review-meta`、`content-source-registry` 和质量矩阵脚本。

## Global Constraints

- 不修改物理 22 个章节、84 个知识点、29 个实验、方法模板、图片、稳定 ID、路由、收藏或任何用户可见正文。
- 本批只佐证原创专题与官方公开课程框架相容；不得声称核对教材逐章标题、章序、册次映射、教材正文、原题或教材插图。
- 仅使用 `moe-physics-2022` 和 `pep-physics-public` 的注册官方 HTTPS URL。
- 不创建 `external-source` manifest、不导出现有内容源输入文件、不改变 `content-source-follow-up`、路线状态或真实外部资料门禁。
- 新增文件仅服务构建期质量检查，不进入小程序主包或普通分包。

---

### Task 1: Define the framework-evidence checker contract

**Files:**
- Create: `scripts/check-physics-topic-framework-evidence.test.js`
- Create: `scripts/check-physics-topic-framework-evidence.js`

**Interfaces:**
- `checkPhysicsTopicFrameworkEvidence(options?)` returns `{ topicCount, sourceKeys, evidenceKind }` when the record is valid.
- The executable checker prints `OK physics topic framework evidence: 6 topics`.
- The checker consumes `docs/evidence/physics-topic-framework-review-2026.json`, current `physics-content`, `topic-review-meta` and the source registry only.

- [ ] **Step 1: Write the failing test**

Create a Node `assert` test that spawns the checker, requires exit status `0`, and asserts the six-topic success line. Add a direct assertion that `checkPhysicsTopicFrameworkEvidence()` returns `topicCount: 6`, `evidenceKind: 'official-framework-support'`, and sorted keys `['moe-physics-2022', 'pep-physics-public']`.

- [ ] **Step 2: Run the test before implementation**

Run: `node scripts/check-physics-topic-framework-evidence.test.js`

Expected: FAIL because the checker and the evidence record do not exist.

- [ ] **Step 3: Implement the minimal checker**

Read the JSON with `fs.readFileSync`/`JSON.parse`. Use `topics` from `packages/physics/data/physics-content`, `getPhysicsTopicReviewMeta` from `packages/physics/data/topic-review-meta`, and `getContentSource`/`isAllowedContentSourceUrl` from `data/content-source-registry`. Require the exact review ID and evidence kind, two registered official sources, four explicit exclusions, six matching topic IDs/titles, one nonempty domain list per topic and identical current review snapshot hashes. Reject fields that claim chapter title, chapter order or volume mapping.

- [ ] **Step 4: Run the focused test again**

Run: `node scripts/check-physics-topic-framework-evidence.test.js`

Expected: it remains red until Task 2 creates a valid record; do not weaken the checker to accept absent evidence.

### Task 2: Create the bounded official framework record

**Files:**
- Create: `docs/evidence/physics-topic-framework-review-2026.json`

**Interfaces:**
- The record exposes `schemaVersion`, `reviewId`, `reviewedAt`, `evidenceKind`, `scope`, `sources` and `topics`.
- Each topic record is `{ id, title, reviewSnapshotHash, frameworkDomains }`; no chapter, volume, lesson, body or source-input fields are allowed.

- [ ] **Step 1: Record the source boundary**

Set `reviewId` to `physics-topic-framework-support-2026-v1`, `reviewedAt` to `2026-08-10`, and `evidenceKind` to `official-framework-support`. Set `scope.notVerified` to the exact four exclusions: `教材逐章标题`, `教材章节顺序`, `教材册次映射`, `教材正文与原始插图`.

- [ ] **Step 2: Record official observations without overclaiming**

Use the registered Ministry of Education course-standard notice as the curriculum baseline. Use the registered PEP new-textbook introduction for the observation that the edition has 22 chapters and uses the broad progression of sound/light/heat, force/mechanics, and energy/electromagnetism. Do not record a textbook chapter number, title, order or volume assignment for any topic.

- [ ] **Step 3: Record six topic mappings**

Copy the current six topic IDs, titles and `snapshotHash` values from `topic-review-meta`. Use only broad domain labels derived from the original topic grouping: movement/sound, light/imaging, heat/matter measurement, force/fluid, work/energy and electricity/electromagnetism.

- [ ] **Step 4: Verify the green cycle**

Run:

```bash
node scripts/check-physics-topic-framework-evidence.test.js
node scripts/check-physics-topic-framework-evidence.js
```

Expected: both commands pass and the checker reports six topics.

### Task 3: Keep the record under the quality gate

**Files:**
- Modify: `scripts/check-v1.11-quality-matrix.js`
- Modify: `scripts/check-v1.11-quality-matrix.test.js`
- Modify: `docs/v1.11五科学科高风险字段复核记录.md`
- Modify: `docs/v1.11后续开发路线.md`

**Interfaces:**
- The default matrix runs `scripts/check-physics-topic-framework-evidence.test.js`.
- The matrix contract test proves that command is registered.
- Documentation explains that this is supplementary framework evidence and does not change the 23-batch external intake state or `math-chapters-v1.11` blocker.

- [ ] **Step 1: Add the matrix assertion first**

Extend `check-v1.11-quality-matrix.test.js` to require a command whose script is `scripts/check-physics-topic-framework-evidence.test.js`. Run it before the matrix list changes; expect a clear assertion failure about the missing command.

- [ ] **Step 2: Register the checker**

Add the test checker beside existing physics review checks. Do not add it to runtime routing, package manifests or release tool state.

- [ ] **Step 3: Update the source review record**

Document that the physics topic framework record is an official-reference supplement, not an `external-source` batch. State that global follow-up still has no real external batch and `math-chapters-v1.11` remains blocked pending a complete current official directory.

- [ ] **Step 4: Run focused checks**

Run:

```bash
node scripts/check-v1.11-quality-matrix.test.js
node scripts/check-physics-topic-framework-evidence.test.js
node scripts/check-roadmap-document-consistency.test.js
```

Expected: all pass.

### Task 4: Review, full validation, and commit

**Files:**
- Modify: `docs/superpowers/plans/2026-08-10-physics-topic-framework-evidence.md`

- [ ] **Step 1: Run full validation**

Run:

```bash
node scripts/check-v1.11-quality-matrix.js
node scripts/check-physics-topic-framework-evidence.js
git diff --check
```

- [ ] **Step 2: Review final scope**

Confirm `git diff --name-only` contains only the evidence record, checker/test, matrix registration and related documentation. Confirm no `packages/*/data`, `pages/`, `app.*`, source runtime modules, images, global input manifest, follow-up report or release version files changed.

- [ ] **Step 3: Mark plan steps complete and commit**

Update every completed checkbox in this plan, then commit the focused change:

```bash
git add docs/evidence scripts/check-physics-topic-framework-evidence.js scripts/check-physics-topic-framework-evidence.test.js scripts/check-v1.11-quality-matrix.js scripts/check-v1.11-quality-matrix.test.js docs/v1.11五科学科高风险字段复核记录.md docs/v1.11后续开发路线.md docs/superpowers/specs/2026-08-10-physics-topic-framework-evidence-design.md docs/superpowers/plans/2026-08-10-physics-topic-framework-evidence.md
git commit -m "chore(physics): verify topic framework evidence"
git push origin codex/roadmap-v1.11
```
