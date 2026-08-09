# Math Container Review v1.9.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为数学复核队列完成第一批七年级 10 个稳定章节容器的真实来源登记与字段一致性校验，保持未复核内容明确可见。

**Architecture:** 新增独立的章节容器复核记录模块，只登记 `ch01-rational` 至 `ch10-statistics`。数学 repository 仅为这 10 个章节挂载 `contentMeta`，复核检查器把记录中的标题和官方小节与当前 repository 快照逐项比较；其余章节不挂载复核元数据，继续进入 v1.9.1 复核队列。

**Tech Stack:** Node.js CommonJS、现有数学 repository、Node `assert`、静态 JS 数据、现有内容审计与发布检查。

## Global Constraints

- 稳定章节 ID、lessonId、专题 ID、旧别名、收藏和最近浏览目标保持不变。
- 复核只确认稳定容器边界、标题、官方小节和父级关系，不宣称历史章序等于新版教材逐册原始章序。
- 每个已复核章节必须有两条教育部/人教社官方来源、复核日期、复核范围和三项证据说明。
- 未复核章节不得因共享默认元数据变为 `verified`，不得修改 `needs-official-volume-map` 目录状态。
- 不复制教材正文、题目、解析或插图；本批不修改知识点正文、题型模板或页面布局。
- 不改变本地存储版本、云资源路径、发布版本和生物学实体设备门禁。

### Task 1: Define the review contract and record the first batch

**Files:**
- Create: `packages/math/data/chapter-review-meta.js`
- Create: `scripts/check-math-container-review.js`
- Test: `scripts/check-math-container-review.js`

**Interfaces:**
- Export `REVIEWED_MATH_CHAPTER_IDS` as the exact 10-item ordered list.
- Export `CHAPTER_REVIEW_RECORDS` with `reviewedAt`, `checkedTitle`, `checkedSections`, `reviewScope`, `evidence` and official `sourceRefs`.
- Export `getChapterReviewMeta(chapterId)` returning a cloned `contentMeta` object for reviewed IDs and `null` for all other IDs.
- Export `checkMathContainerReview()` returning `true` or throwing an actionable error.

- [ ] **Step 1: Write the failing checker first**

Require the exact 10 stable IDs, a record for every ID, and a repository match for title and `officialSections`:

```js
const assert = require('assert');
const math = require('../packages/math/repository');
const {
  REVIEWED_MATH_CHAPTER_IDS,
  CHAPTER_REVIEW_RECORDS,
  getChapterReviewMeta,
} = require('../packages/math/data/chapter-review-meta');

const expectedIds = [
  'ch01-rational', 'ch02-expression', 'ch03-linear-equation', 'ch04-basic-geometry',
  'ch05-parallel', 'ch06-real', 'ch07-coordinate', 'ch08-system',
  'ch09-inequality', 'ch10-statistics',
];

function checkMathContainerReview() {
  assert.deepStrictEqual(REVIEWED_MATH_CHAPTER_IDS, expectedIds);
  assert.deepStrictEqual(Object.keys(CHAPTER_REVIEW_RECORDS), expectedIds);
  const chapters = new Map(math.getAllChapters().map((chapter) => [chapter.id, chapter]));
  expectedIds.forEach((id) => {
    const chapter = chapters.get(id);
    const record = CHAPTER_REVIEW_RECORDS[id];
    assert.ok(chapter, `章节不存在：${id}`);
    assert.strictEqual(record.checkedTitle, chapter.title, `${id} 标题复核不一致`);
    assert.deepStrictEqual(record.checkedSections, chapter.officialSections, `${id} 小节复核不一致`);
    assert.strictEqual(getChapterReviewMeta(id).reviewScope, 'stable-container');
  });
  return true;
}

checkMathContainerReview();
console.log(`OK math container review: ${expectedIds.length} chapters`);
```

- [ ] **Step 2: Run the checker and confirm the intended failure**

Run `node scripts/check-math-container-review.js`.

Expected: FAIL because `chapter-review-meta.js` does not exist yet.

- [ ] **Step 3: Implement the 10 review records and cloned lookup**

Use the exact chapter data already present in `packages/math/data/math-curriculum.js`; each record must include these source records:

```js
sourceRefs: [
  { key: 'moe-math-curriculum-2022', title: '义务教育数学课程标准（2022年版）', url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582346895190.pdf' },
  { key: 'pep-math-new-textbook-2024', title: '人教版义务教育数学（七至九年级）新教材介绍', url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202408/t20240826_1994351.html' },
],
```

Use `getContentReviewMeta('math', ...)` as the base, add `reviewScope: 'stable-container'`, `checkedTitle`, `checkedSections`, and three evidence strings, and return a fresh copy from `getChapterReviewMeta()` so callers cannot mutate the source records.

- [ ] **Step 4: Expand the checker beyond the red contract**

Reject missing dates, non-official hosts, duplicate source keys, missing evidence, unknown IDs, mismatched title/sections, and a non-null lookup for an unreviewed chapter. Confirm the 10 hydrated chapters expose `contentMeta.status === 'verified'` and all other 19 chapters do not expose chapter-level review metadata.

- [ ] **Step 5: Run the focused checker**

Run `node scripts/check-math-container-review.js`; expected: PASS with 10 chapters.

- [ ] **Step 6: Commit the record and checker**

```bash
git add packages/math/data/chapter-review-meta.js scripts/check-math-container-review.js
git commit -m "feat(math): review first ten chapter containers"
```

### Task 2: Attach reviewed metadata without widening the review scope

**Files:**
- Modify: `packages/math/repository.js`
- Modify: `scripts/content-audit.js`
- Modify: `scripts/check-release-readiness.js`

**Interfaces:**
- `getChapterById()` attaches `contentMeta: getChapterReviewMeta(chapter.id)` only when the lookup returns a record.
- `scripts/check-release-readiness.js` executes `scripts/check-math-container-review.js` and reports the last three failure lines.
- `scripts/content-audit.js` recognizes `pep-math-new-textbook-2024` as an allowed official source key.

- [ ] **Step 1: Add the failing runtime assertions**

Extend the checker to assert that the first 10 hydrated chapters are verified and `ch11-triangle` remains untracked at the chapter level. Run it and observe failure before repository integration.

- [ ] **Step 2: Attach the lookup at the chapter boundary**

Import `getChapterReviewMeta` and add the conditional `contentMeta` field to the object returned by `getChapterById()`. Do not change `buildLessonKnowledge()`; lesson metadata is already independently verified.

- [ ] **Step 3: Add the source key and release gate**

Register `pep-math-new-textbook-2024` in `KNOWN_SOURCE_KEYS`, require the checker script in release readiness, and run it as a child process like the existing audit tools.

- [ ] **Step 4: Run focused runtime and audit checks**

Run:

```bash
node scripts/check-math-container-review.js
node scripts/build-content-audit.js
node scripts/check-content-audit.js
```

Expected: 10 math chapter entities become `verified`; all remaining untracked entities stay in the report.

- [ ] **Step 5: Commit the runtime gate**

```bash
git add packages/math/repository.js scripts/content-audit.js scripts/check-release-readiness.js
git commit -m "chore(audit): gate reviewed math containers"
```

### Task 3: Rebuild the queue and document the review boundary

**Files:**
- Create: `docs/v1.9.3数学章节容器复核实施记录.md`
- Modify: `README.md`
- Modify: `docs/后续开发与发布路线.md`
- Modify: `docs/新版教材目录对照与迁移规则.md`

**Interfaces:**
- The generated queue reports 130 remaining entities, with the first 10 math chapters removed and all other untracked entities preserved.
- Documentation records the exact 10 IDs, source links, report change, and the fact that the v1.9.2 curriculum audit remains open for volume mapping.

- [ ] **Step 1: Run queue generation before documentation**

Run `node scripts/build-content-review-queue.js` and record the generated counts and source hash; do not hand-edit generated JSON.

- [ ] **Step 2: Add concise release commands and route section**

Document `node scripts/check-math-container-review.js`, explain the 10/130 split, and add v1.9.3 to the development route. Keep the v1.8 physical gate and v1.9.2 `needs-official-volume-map` boundary visible.

- [ ] **Step 3: Run documentation and queue checks**

Run:

```bash
node scripts/build-content-review-queue.js
node scripts/check-content-review-queue.js
node scripts/check-release-readiness.js
git diff --check
```

- [ ] **Step 4: Commit the handoff**

```bash
git add README.md docs/后续开发与发布路线.md docs/新版教材目录对照与迁移规则.md docs/v1.9.3数学章节容器复核实施记录.md
git commit -m "docs(v1.9.3): record math container review batch"
```

### Task 4: Full validation and push

**Files:**
- Modify: `docs/superpowers/plans/2026-08-10-math-review-v1.9.3.md`

- [ ] **Step 1: Run the complete check matrix**

Run every `scripts/check-*.js`, excluding only the package-size checker’s legacy default input, then run `node scripts/check-package-sizes.js .codex-output/v1.9.2-math-audit-packages-preview.json`, `git diff --check`, and the developer-tools preview if the package report is missing.

- [ ] **Step 2: Confirm queue determinism**

Run `node scripts/build-content-review-queue.js` twice and compare the generated file SHA-256 values.

- [ ] **Step 3: Review the final diff**

Confirm no math content IDs changed, no non-target chapter became verified, no task/measurement field was introduced, and no main package source imports the review queue JSON.

- [ ] **Step 4: Commit the completed plan and push**

```bash
git add docs/superpowers/plans/2026-08-10-math-review-v1.9.3.md
git commit -m "docs(v1.9.3): close math container review plan"
git push -u origin codex/math-review-v1.9.3
```
