# Math Topic Review v1.9.5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 29 个数学专题容器的真实来源登记、父级引用核对和核心字段漂移检测，使数学专题进入可持续复核状态。

**Architecture:** 新增 `topic-review-meta.js` 保存 29 个专题的稳定 ID、标题、年级、章节映射和复核时的核心字段哈希。数学 repository 在专题 hydration 边界挂载该元数据；检查器将专题与当前 `topicPackages` 对照，并验证章节父级存在、哈希一致、来源可信和新版目录边界。专题正文和方法模板不做改写。

**Tech Stack:** Node.js CommonJS、现有数学 `topicPackages`、Node `crypto`/`assert`、内容审计和复核队列脚本。

## Global Constraints

- 29 个专题 ID、章节 ID、知识点 ID、旧链接和收藏目标保持不变。
- 每个专题必须记录标题、年级、`chapterIds`、摘要/重点/信号/检查点核心字段哈希、复核日期、两条官方来源和三项证据。
- `ch19`/`ch20` 对应专题只复核稳定专题容器及当前章节引用，不解除新版函数拆分、数据分析新增内容和逐册章序的待核对状态。
- 未复核的英语/物理专题、数学方法模板不得因共享默认元数据变为已复核。
- 不复制教材正文、题目、解析或插图；不修改知识点内容、模板内容、存储版本或发布版本。

### Task 1: Define the 29-topic review contract

**Files:**
- Create: `packages/math/data/topic-review-meta.js`
- Create: `scripts/check-math-topic-review.js`
- Test: `scripts/check-math-topic-review.js`

**Interfaces:**
- Export `REVIEWED_MATH_TOPIC_IDS` in the exact `topicPackages` order.
- Export `TOPIC_REVIEW_RECORDS` with `checkedTitle`, `checkedGradeId`, `checkedChapterIds`, `snapshotHash`, `reviewBatch`, `scopeNote`, `sourceRefs` and evidence metadata.
- Export `getTopicReviewMeta(topicId)` returning a cloned verified metadata object or `null` for unknown topics.
- Export `buildTopicReviewSnapshot(topic)` and `checkMathTopicReview()`.

- [x] **Step 1: Write the failing checker first**

Require all 29 IDs and records before creating the module:

```js
const expectedIds = [
  'g7-topic-rational', 'g7-topic-expression', 'g7-topic-linear-equation',
  'g7-topic-basic-geometry', 'g7-topic-parallel', 'g7-topic-real-number',
  'g7-topic-coordinate', 'g7-topic-system', 'g7-topic-inequality',
  'g7-topic-statistics', 'g8-topic-triangle', 'g8-topic-congruent',
  'g8-topic-symmetry', 'g8-topic-polynomial', 'g8-topic-fraction',
  'g8-topic-radical', 'g8-topic-pythagorean', 'g8-topic-parallelogram',
  'g8-topic-linear-function', 'g8-topic-data-analysis', 'g9-topic-quadratic-equation',
  'g9-topic-quadratic-function', 'g9-topic-rotation', 'g9-topic-circle',
  'g9-topic-probability', 'g9-topic-inverse-function', 'g9-topic-similarity',
  'g9-topic-trigonometry', 'g9-topic-projection',
];
assert.deepStrictEqual(REVIEWED_MATH_TOPIC_IDS, expectedIds);
assert.deepStrictEqual(Object.keys(TOPIC_REVIEW_RECORDS), expectedIds);
```

Run `node scripts/check-math-topic-review.js`; expected: FAIL because the topic review module does not exist.

- [x] **Step 2: Generate the current snapshot candidates for review**

Use this read-only command to print the exact hash inputs from the current `topicPackages`; do not write the output directly into source files:

```bash
node - <<'NODE'
const crypto = require('crypto');
const { topicPackages } = require('./packages/math/data/math-topic-guides');
for (const topic of topicPackages) {
  const snapshot = {
    title: topic.title,
    gradeId: topic.gradeId,
    chapterIds: topic.chapterIds,
    summary: topic.summary,
    focus: topic.focus,
    signals: topic.signals,
    checkpointTitles: (topic.checkpoints || []).map((item) => item.title),
  };
  console.log(topic.id, crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'));
}
NODE
```

Review that every topic has a non-empty summary, at least 3 focus items, at least 3 signals, at least 4 checkpoints, and a chapter parent before recording the hashes.

- [x] **Step 3: Implement the records and cloned lookup**

Record all 29 titles, grade IDs and chapter IDs from the current repository. Use the same official source references as chapter review, with `reviewBatch: 'v1.9.5'` and `reviewScope: 'stable-topic-container'`. For `g8-topic-linear-function` and `g8-topic-data-analysis`, add `scopeNote: '仅复核稳定专题与当前章节映射，不替代新版逐册目录映射'`.

- [x] **Step 4: Implement the checker**

The checker must reject duplicate/unknown IDs, missing parents, title/grade/chapter mismatch, snapshot hash drift, missing source keys, non-official hosts, missing evidence, invalid dates, missing focus/signals/checkpoints, non-cloned arrays, and any non-target topic returning review metadata. Confirm exactly 29 topics are verified and no method template changes are involved.

- [x] **Step 5: Run the focused checker**

Run `node scripts/check-math-topic-review.js`; expected: PASS with 29 topics.

- [x] **Step 6: Commit the topic records**

```bash
git add packages/math/data/topic-review-meta.js scripts/check-math-topic-review.js
git commit -m "feat(math): review all topic containers"
```

### Task 2: Attach topic metadata and update audit gates

**Files:**
- Modify: `packages/math/repository.js`
- Modify: `scripts/check-release-readiness.js`

**Interfaces:**
- `hydrateGradeTopic(topic)` attaches `contentMeta: getTopicReviewMeta(topic.id)` only for the 29 reviewed math topics.
- Release readiness runs `scripts/check-math-topic-review.js` and reports concise failures.

- [x] **Step 1: Add the failing hydration assertions**

Extend the checker to assert every `getTopicById('math', id)` returns `contentMeta.status === 'verified'`, while `getTopicReviewMeta('unknown-topic')` returns `null`.

- [x] **Step 2: Attach metadata at topic hydration**

Import `getTopicReviewMeta` and conditionally spread the result in `hydrateGradeTopic`. Do not alter chapter hydration or knowledge/template builders.

- [x] **Step 3: Add the release gate**

Require the checker file in `check-release-readiness.js`, execute it as a child process, and preserve existing math curriculum and chapter review gates.

- [x] **Step 4: Run focused audit checks**

Run:

```bash
node scripts/check-math-topic-review.js
node scripts/build-content-audit.js
node scripts/check-content-audit.js
node scripts/check-release-readiness.js
```

Expected: 29 math topic entities become verified; the queue remains 82 items until the queue checker is updated in Task 3.

- [x] **Step 5: Commit runtime integration**

```bash
git add packages/math/repository.js scripts/check-release-readiness.js
git commit -m "chore(audit): gate reviewed math topics"
```

### Task 3: Rebuild the queue and document current scope

**Files:**
- Modify: `scripts/check-content-review-queue.js`
- Modify: `README.md`
- Modify: `docs/后续开发与发布路线.md`
- Modify: `docs/新版教材目录对照与迁移规则.md`
- Create: `docs/v1.9.5数学专题容器复核实施记录.md`

**Interfaces:**
- Queue becomes 82 items: math templates 36, English 12, physics 34; no `math:chapter` or `math:topic` entries remain.
- Documentation records 29/29 reviewed math topics and preserves all historical batch statistics.

- [x] **Step 1: Add the failing queue expectations**

Update `check-content-review-queue.js` to expect `queued === 82`, subject totals `{ english: 12, math: 36, physics: 34 }`, `math:topic === undefined`, and priority totals `{ 1: 12, 2: 70 }`. Run it before rebuilding to observe the expected old-report failure.

- [x] **Step 2: Rebuild and validate the queue**

Run the content audit and queue builders/checkers. Confirm the first queue item is `math:template:*`, no math chapters/topics remain, and the 36 math templates are still untracked.

- [x] **Step 3: Update docs and record hashes**

Record current entity counts, queue counts, queue source hash, file hash, official source links, the stable-topic boundary, and the next route: math templates before English/physics templates.

- [x] **Step 4: Run docs/release checks and commit**

```bash
node scripts/build-content-review-queue.js
node scripts/check-content-review-queue.js
node scripts/check-math-curriculum-audit.js
node scripts/check-release-readiness.js
git diff --check
git add scripts/check-content-review-queue.js README.md docs/后续开发与发布路线.md docs/新版教材目录对照与迁移规则.md docs/v1.9.5数学专题容器复核实施记录.md
git commit -m "docs(v1.9.5): close math topic review"
```

### Task 4: Full validation and push

**Files:**
- Modify: `docs/superpowers/plans/2026-08-10-math-topic-review-v1.9.5.md`

- [x] **Step 1: Run the complete check matrix**

Run every `scripts/check-*.js`, `node scripts/prepare-remote-assets.js`, the current Developer Tools preview package-size check, all audit builders/checkers and `git diff --check`.

- [x] **Step 2: Confirm queue determinism**

Generate the queue twice and compare SHA-256 byte-for-byte.

- [x] **Step 3: Review the final scope**

Confirm only topic review data, topic hydration, queue expectations, docs and plan changed; no knowledge bodies, templates, figures, storage schemas or release versions changed.

- [x] **Step 4: Commit the completed plan and push**

```bash
git add docs/superpowers/plans/2026-08-10-math-topic-review-v1.9.5.md
git commit -m "docs(v1.9.5): record math topic review plan completion"
git push -u origin codex/math-topic-review-v1.9.5
```
