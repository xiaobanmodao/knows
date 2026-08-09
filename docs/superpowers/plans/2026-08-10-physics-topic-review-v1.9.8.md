# Physics Topic Review v1.9.8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 6 个物理综合专题的稳定 ID、章节/知识点/方法引用、实验与图示入口和官方来源复核，使物理专题进入可持续审计状态。

**Architecture:** 新增物理专题复核元数据模块，记录 6 个专题的稳定字段和快照哈希。物理 repository 在 `hydrateTopic` 边界挂载复核元数据，物理内容适配器改为使用 repository 的专题实体，保证运行时、内容审计和复核队列读取同一状态。物理章节、84 个知识点、22 个章节模板和 6 个专题模板正文不做批量改写。

**Tech Stack:** Node.js CommonJS、现有 `physics-content`、物理 repository、Node `crypto`/`assert`、内容审计和复核队列脚本。

## Global Constraints

- 6 个物理专题稳定 ID、标题、年级范围、知识点 ID、方法模板 ID、搜索入口和旧链接保持不变。
- 每个专题必须登记 3 个知识点、1 个方法模板、4 个检查点、封面、独立物理结构图、摘要、关键词、题干信号、复核日期、两条官方来源和三项证据。
- 本批只复核专题容器，不改变物理 22 个章节、84 个知识点、29 个实验、22 个章节方法模板或 6 个专题方法模板正文。
- 物理图示继续检查方向、符号、单位、连线和文字降级，不复制教材插图。
- 英语方法模板 6 项和物理方法模板 28 项继续保留在复核队列，不因共享检查器被误标为已复核。

---

### Task 1: Define the six-topic review contract

**Files:**
- Create: `packages/physics/data/topic-review-meta.js`
- Create: `scripts/check-physics-topic-review.js`
- Test: `scripts/check-physics-topic-review.js`

**Interfaces:**
- Export `REVIEWED_PHYSICS_TOPIC_IDS` in the exact `physicsContent.topics` order.
- Export `TOPIC_REVIEW_RECORDS` keyed by topic ID with title, grade bands, knowledge IDs, template IDs and snapshot hash.
- Export `buildPhysicsTopicReviewSnapshot(topic)` returning `{ value, hash }`.
- Export `getPhysicsTopicReviewMeta(topicId)` returning a cloned verified metadata object or `null`.
- Export `checkPhysicsTopicReview()` and make the checker executable.

- [x] **Step 1: Write the failing checker first**

Require the exact six IDs and records before the metadata module exists:

```js
const expectedIds = [
  'phy-topic-motion-sound', 'phy-topic-light', 'phy-topic-matter',
  'phy-topic-force', 'phy-topic-energy', 'phy-topic-electricity',
];
assert.deepStrictEqual(REVIEWED_PHYSICS_TOPIC_IDS, expectedIds);
assert.deepStrictEqual(Object.keys(TOPIC_REVIEW_RECORDS), expectedIds);
```

Run `node scripts/check-physics-topic-review.js`; it must fail because the metadata module does not exist.

- [x] **Step 2: Generate read-only snapshot candidates**

Hash stable topic fields, not cloud-signed URLs:

```bash
node - <<'NODE'
const crypto = require('crypto');
const { topics } = require('./packages/physics/data/physics-content');
for (const topic of topics) {
  const value = {
    id: topic.id,
    title: topic.title,
    gradeBands: topic.gradeBands,
    knowledgeIds: topic.knowledgeIds,
    templateIds: topic.templateIds,
    summary: topic.summary,
    keywords: topic.keywords,
    signals: topic.signals,
    checkpoints: topic.checkpoints.map((item) => ({ title: item.title, method: item.method })),
    diagramCaption: topic.diagramCaption,
    coverImage: topic.coverImage,
    diagramImage: topic.diagramImage,
    knowledgeCount: topic.knowledgeCount,
    templateCount: topic.templates.length,
    exampleCount: topic.exampleCount,
  };
  console.log(topic.id, crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'));
}
NODE
```

Confirm every topic has 3 knowledge IDs, 1 template ID, 4 checkpoints, a cover, a diagram, 3 knowledge items and 9 examples before recording hashes.

- [x] **Step 3: Implement cloned records and official sources**

Record all six titles, grade bands, knowledge IDs, template IDs and current hashes. Use `reviewBatch: 'v1.9.8'`, `reviewScope: 'stable-topic-container'`, `reviewedAt: '2026-08-10'`, the official curriculum source `moe-physics-2022` and PEP source `pep-physics-public`. Evidence must cover parent references, formula/experiment/figure entry points, and source/manual review registration.

- [x] **Step 4: Implement strict physics checks**

Reject duplicate/unknown IDs, title/grade/reference drift, missing knowledge or template parents, missing summary/keywords/signals/checkpoints, missing visual references, snapshot drift, invalid dates, non-official hosts, missing evidence, and metadata clone leakage. Verify each knowledge item has 3 examples and each runtime topic has `contentMeta.status === 'verified'`.

- [x] **Step 5: Run the focused checker**

Run `node scripts/check-physics-topic-review.js`; expected: `OK physics topic review: 6 topics`.

- [x] **Step 6: Commit the topic contract**

```bash
git add packages/physics/data/topic-review-meta.js scripts/check-physics-topic-review.js
git commit -m "feat(physics): review topic containers"
```

### Task 2: Attach metadata and align the audit adapter

**Files:**
- Modify: `packages/physics/repository.js`
- Modify: `scripts/subject-adapters/physics.js`
- Modify: `scripts/check-release-readiness.js`

**Interfaces:**
- `hydrateTopic(topic)` conditionally attaches `contentMeta: getPhysicsTopicReviewMeta(topic.id)` and preserves resolved cover/diagram URLs.
- The physics subject adapter exposes topics through the repository so content audit sees the same metadata as runtime.
- Release readiness executes `scripts/check-physics-topic-review.js` after existing math and English review gates.

- [x] **Step 1: Add the failing runtime and audit assertions**

Extend the checker to assert all six runtime topics are verified and all six `physics:topic` audit entities are verified; unknown topics return `null`.

- [x] **Step 2: Attach metadata at the topic hydration boundary**

Import the lookup and spread it only when present. Do not alter physics chapter, knowledge, formula, experiment or template hydration.

- [x] **Step 3: Route audit topics through repository**

Replace the physics adapter's direct `physicsContent.topics` topic entities with `physicsContent.topics.map((topic) => physicsRepository.getTopicById('physics', topic.id))`. Keep search entry text sourced from the existing static data.

- [x] **Step 4: Add the release gate and run focused integration checks**

```bash
node scripts/check-physics-topic-review.js
node scripts/build-content-audit.js
node scripts/check-content-audit.js
node scripts/check-release-readiness.js
```

Expected: 6 physics topic entities become verified; the queue falls from 40 to 34.

- [x] **Step 5: Commit runtime and audit integration**

```bash
git add packages/physics/repository.js scripts/subject-adapters/physics.js scripts/check-release-readiness.js
git commit -m "chore(audit): gate reviewed physics topics"
```

### Task 3: Rebuild the queue and document the boundary

**Files:**
- Modify: `scripts/check-content-review-queue.js`
- Modify: `README.md`
- Modify: `docs/后续开发与发布路线.md`
- Modify: `docs/新版教材目录对照与迁移规则.md`
- Create: `docs/v1.9.8物理专题容器复核实施记录.md`

**Interfaces:**
- Queue becomes 34 items: English templates 6 and physics templates 28; no `physics:topic` entries remain.
- Documentation records 948 total entities, 914 reviewed and 34 queued.

- [x] **Step 1: Add the failing queue expectations**

Update `check-content-review-queue.js` to expect `queued === 34`, subject totals `{ english: 6, math: 0, physics: 28 }`, `physics:topic === undefined`, and priority totals `{ 1: 0, 2: 34 }`. Run before rebuilding to observe the old-report failure.

- [x] **Step 2: Rebuild and validate the queue**

Run content-audit and queue builders/checkers. Confirm all six physics topics are absent and only English/physics templates remain.

- [x] **Step 3: Update docs and record hashes**

Record counts, queue source hash, queue file SHA-256, official source links and the next route: English/physics method template review.

- [x] **Step 4: Run docs/release checks and commit**

```bash
node scripts/build-content-review-queue.js
node scripts/check-content-review-queue.js
node scripts/check-release-readiness.js
git diff --check
git add scripts/check-content-review-queue.js README.md docs/后续开发与发布路线.md docs/新版教材目录对照与迁移规则.md docs/v1.9.8物理专题容器复核实施记录.md
git commit -m "docs(v1.9.8): close physics topic review"
```

### Task 4: Full validation and push

**Files:**
- Modify: `docs/superpowers/plans/2026-08-10-physics-topic-review-v1.9.8.md`

- [x] **Step 1: Run the complete check matrix**

Run all `scripts/check-*.js` except the package-size check's legacy default input, validate the current Developer Tools preview report, rebuild/check remote assets, all audit builders/checkers and `git diff --check`.

- [x] **Step 2: Confirm queue determinism**

Generate the queue twice and compare SHA-256 byte-for-byte.

- [x] **Step 3: Confirm final scope**

Confirm only physics topic review data, topic hydration, the physics audit adapter, queue expectations, docs and plan changed; no physics chapter/knowledge/template content, English content, images, storage schemas or release versions changed.

- [x] **Step 4: Commit the completed plan and push**

```bash
git add docs/superpowers/plans/2026-08-10-physics-topic-review-v1.9.8.md
git commit -m "docs(v1.9.8): record physics topic review plan completion"
git push -u origin codex/physics-topic-review-v1.9.8
```
