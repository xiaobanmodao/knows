# Physics Topic Framework External Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 6 个物理原创专题提供可验证的官方课程框架来源快照，同时严格保留“非教材逐章映射”的证据边界。

**Architecture:** 复用现有内容源输入和外部 manifest 工具；在 `docs/evidence/` 保存无正文输入快照、来源 manifest 和人工范围记录。新增一个只读检查器将三份文件与当前物理专题目录相互核对，并把该检查加入 v1.11 质量矩阵。

**Tech Stack:** Node.js CommonJS、`assert`、现有 `content-source-input`、`content-source-input-batches`、`content-source-registry`、JSON 审计文件。

## Global Constraints

- 不修改物理 22 个章节、84 个知识点、29 个实验、方法模板、图片、稳定 ID、路由、收藏或任何用户可见正文。
- 本批仅核对原创专题与官方课程框架相容；不得声称核对教材逐章标题、章序、册次映射、教材正文、原题或教材插图。
- 外部来源只允许 `moe-physics-2022` 和 `pep-physics-public` 的注册官方 HTTPS URL。
- 快照 `sourceVersion` 必须是 `physics-topic-framework-review-2026-v1`，不得使用当前目录版本 `v1.11-current`。
- 所有新增文件只服务构建期质量检查，不进入小程序主包或普通分包。

---

### Task 1: Define the evidence checker contract

**Files:**
- Create: `scripts/check-physics-topic-framework-evidence.test.js`
- Create: `scripts/check-physics-topic-framework-evidence.js`

**Interfaces:**
- `checkPhysicsTopicFrameworkEvidence(options?)` returns `{ topicCount, inputHash, sourceKeys }` when all evidence boundaries hold.
- The executable checker prints `OK physics topic framework evidence: 6 topics`.
- The checker consumes the three exact `docs/evidence/physics-topic-framework-*-2026.json` files and performs a strict generic input-batch audit.

- [ ] **Step 1: Write the failing test**

Create a Node `assert` test that spawns `check-physics-topic-framework-evidence.js`, requires exit status `0`, and asserts its output contains the six-topic success line. Add a second direct assertion that `checkPhysicsTopicFrameworkEvidence()` returns `topicCount: 6` and the two official source keys in sorted order.

- [ ] **Step 2: Run the test before implementation**

Run: `node scripts/check-physics-topic-framework-evidence.test.js`

Expected: fail because the checker and evidence files do not exist.

- [ ] **Step 3: Implement the minimal checker**

Load the evidence record, input snapshot and manifest via `fs.readFileSync`/`JSON.parse`; use `normalizeSourceInput`, `normalizeBatchManifest`, `buildContentSourceCatalog`, `buildContentSourceInputBatchAudit`, `getContentSource` and `isAllowedContentSourceUrl`. Require the exact review ID, six topic IDs/titles, both official sources, the explicit non-mapping exclusions, and a passing generic batch audit with `requireExternalSource: true` and `requireReviewed: true`.

- [ ] **Step 4: Run the focused test again**

Run: `node scripts/check-physics-topic-framework-evidence.test.js`

Expected: it remains red until Task 2 creates valid immutable evidence files; do not weaken the test or checker to make missing data pass.

### Task 2: Create immutable evidence artifacts

**Files:**
- Create: `docs/evidence/physics-topic-framework-review-2026.json`
- Create: `docs/evidence/physics-topic-framework-source-input-2026.json`
- Create: `docs/evidence/physics-topic-framework-source-manifest-2026.json`

**Interfaces:**
- The human record exposes `reviewId`, `reviewedAt`, `scope.verified`, `scope.notVerified`, two official `sources`, and six `{ id, title, frameworkDomains }` topic records.
- The input snapshot is generated from the current `physics-topics-v1.11` metadata batch with the exact external review version.
- The manifest has one `external-source` batch, points at the input snapshot using a relative path, and carries a truthful scope note.

- [ ] **Step 1: Create the human review record**

Record the six stable topic IDs and titles in input sort order. Set `scope.notVerified` to the exact four exclusions: `教材逐章标题`, `教材章节顺序`, `教材册次映射`, `教材正文与原始插图`. Record source observations only at the broad framework level: 22-chapter/grade-volume structure and the sound/light/heat, force/mechanics, energy/electromagnetism sequence.

- [ ] **Step 2: Generate the source input snapshot**

Run:

```bash
node scripts/build-content-source-input.js --from-current --batch physics-topics-v1.11 --source-version physics-topic-framework-review-2026-v1 --output docs/evidence/physics-topic-framework-source-input-2026.json
```

Do not hand-edit the generated entity hashes, counts, review source keys or input hash.

- [ ] **Step 3: Generate the external manifest**

Run:

```bash
node scripts/build-content-source-external-manifest.js \
  --batch physics-topics-v1.11 \
  --input docs/evidence/physics-topic-framework-source-input-2026.json \
  --manifest docs/evidence/physics-topic-framework-source-manifest-2026.json \
  --source-version physics-topic-framework-review-2026-v1 \
  --source-key moe-physics-2022 \
  --source-key pep-physics-public \
  --source-url https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html \
  --source-url https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202409/t20240925_1995627.html \
  --reviewed-at 2026-08-10 \
  --note '仅核对原创物理专题与官方课程框架的相容性；不核对教材逐章标题、章节顺序或册次映射。'
```

- [ ] **Step 4: Verify the green cycle**

Run:

```bash
node scripts/check-physics-topic-framework-evidence.test.js
node scripts/check-content-source-input-batches.js docs/evidence/physics-topic-framework-source-manifest-2026.json --require-no-diff --require-external-source --require-reviewed
```

Expected: both commands pass and report six entities with `+0 ~0 -0`.

### Task 3: Keep the evidence under the quality gate

**Files:**
- Modify: `scripts/check-v1.11-quality-matrix.js`
- Modify: `scripts/check-v1.11-quality-matrix.test.js`
- Modify: `docs/v1.11五科学科高风险字段复核记录.md`
- Modify: `docs/v1.11后续开发路线.md`

**Interfaces:**
- The default v1.11 matrix runs `scripts/check-physics-topic-framework-evidence.test.js`.
- Matrix contract test proves the evidence checker is registered.
- Documentation describes the achieved scope and preserves the global follow-up and math directory blockers.

- [ ] **Step 1: Add the matrix assertion first**

Extend `check-v1.11-quality-matrix.test.js` to require a command whose script is `scripts/check-physics-topic-framework-evidence.test.js`. Run it before the matrix is changed; expect a clear assertion failure about the missing command.

- [ ] **Step 2: Register the checker**

Add the new test checker to the default quality command list beside the existing content-source and physics review checks. Do not add it to runtime routing or package scripts.

- [ ] **Step 3: Update the source review record**

Document that one standalone external framework-review manifest now passes for the six topics, while the aggregate follow-up report still treats the remaining 23-batch intake state independently. State that `math-chapters-v1.11` remains blocked until a complete current official directory is available.

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
- Modify: `docs/superpowers/plans/2026-08-10-physics-topic-framework-external-source.md`

- [ ] **Step 1: Run full validation**

Run:

```bash
node scripts/check-v1.11-quality-matrix.js
node scripts/check-content-source-input-batches.js docs/evidence/physics-topic-framework-source-manifest-2026.json --require-no-diff --require-external-source --require-reviewed
git diff --check
```

- [ ] **Step 2: Review final scope**

Confirm `git diff --name-only` contains only evidence, checker/test, matrix registration and related documentation. Confirm no `packages/*/data`, `pages/`, `app.*`, source runtime modules, images or release version files changed.

- [ ] **Step 3: Mark plan steps complete and commit**

Update every completed checkbox in this plan, then commit the focused change:

```bash
git add docs/evidence scripts/check-physics-topic-framework-evidence.js scripts/check-physics-topic-framework-evidence.test.js scripts/check-v1.11-quality-matrix.js scripts/check-v1.11-quality-matrix.test.js docs/v1.11五科学科高风险字段复核记录.md docs/v1.11后续开发路线.md docs/superpowers/specs/2026-08-10-physics-topic-framework-external-source-design.md docs/superpowers/plans/2026-08-10-physics-topic-framework-external-source.md
git commit -m "chore(physics): audit topic framework sources"
git push origin codex/roadmap-v1.11
```
