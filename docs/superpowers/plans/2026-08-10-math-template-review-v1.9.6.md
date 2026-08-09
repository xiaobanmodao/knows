# Math Template Review v1.9.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 36 个数学方法模板的稳定 ID、章节父级、适用条件、步骤、易错边界、运行时示例与图示入口复核，使模板进入可持续审计状态。

**Architecture:** 新增独立 `template-review-meta.js` 保存 36 个模板的复核记录和内容快照哈希。数学 repository 在模板 hydration 边界挂载复核元数据，内容审计因此能区分已复核模板与剩余英语/物理队列。检查器从当前 `templateLibrary` 和运行时 `getAllTemplates()` 读取真实结构，拒绝父级漂移、字段缺失、图示失效、示例空洞和非官方来源。

**Tech Stack:** Node.js CommonJS、现有数学 `templateLibrary`、Node `crypto`/`assert`、内容审计与复核队列脚本、现有远程资源清单。

## Global Constraints

- 36 个模板的稳定 ID、名称、章节父级、搜索入口、旧链接和收藏目标保持不变。
- 本批只复核模板契约和来源；仅允许补正检查器发现的字段缺口，不修改数学知识正文、模板方法步骤、例题结论、存储版本或发布版本。
- 每个模板必须登记标题、分类、关联章节、关键词、触发信号、步骤、易错点、运行时示例数量、图示入口、复核日期、两条官方来源和三项证据。
- 共享图示必须记录为共享图示，不得声称每个模板拥有独立原创插图；运行时失败仍必须保留文字内容。
- `ch19-linear-function`、`ch20-data-analysis` 的模板记录只确认当前稳定容器关系，不替代新版逐册目录映射。
- 数学章节和专题已复核；英语 12 项、物理 34 项继续保留在队列，不因共享校验代码被误标为已复核。

---

### Task 1: Define the 36-template review contract

**Files:**
- Create: `packages/math/data/template-review-meta.js`
- Create: `scripts/check-math-template-review.js`
- Test: `scripts/check-math-template-review.js`

**Interfaces:**
- Export `REVIEWED_MATH_TEMPLATE_IDS` in the exact `templateLibrary` order.
- Export `TEMPLATE_REVIEW_RECORDS` keyed by template ID with `checkedTitle`, `checkedCategory`, `checkedChapterIds`, `snapshotHash`, `runtimeExampleCount`, `figureSource`, `reviewBatch`, `scopeNote`, `sourceRefs` and evidence metadata.
- Export `buildTemplateReviewSnapshot(template, runtimeTemplate)` returning `{ value, hash }`.
- Export `getTemplateReviewMeta(templateId)` returning a cloned verified metadata object or `null` for an unknown template.
- Export `checkMathTemplateReview()` and make the checker executable with `node scripts/check-math-template-review.js`.

- [x] **Step 1: Write the failing checker first**

Require the exact 36 IDs, records, parent chapters and metadata before adding the module:

```js
const expectedIds = templateLibrary.map((item) => item.id);
assert.strictEqual(expectedIds.length, 36);
assert.deepStrictEqual(REVIEWED_MATH_TEMPLATE_IDS, expectedIds);
assert.deepStrictEqual(Object.keys(TEMPLATE_REVIEW_RECORDS), expectedIds);
```

Run `node scripts/check-math-template-review.js`; it must fail before the review module exists.

- [x] **Step 2: Generate read-only snapshot candidates**

Use the source template and hydrated runtime template to print, but not directly write, the hash inputs:

```bash
node - <<'NODE'
const crypto = require('crypto');
const math = require('./packages/math/repository');
const { templateLibrary } = require('./packages/math/data/math-curriculum');
for (const template of templateLibrary) {
  const runtime = math.getTemplateById('math', template.id);
  const value = {
    id: template.id,
    name: template.name,
    category: template.category,
    relatedChapters: template.relatedChapters,
    keywords: template.keywords,
    summary: template.summary,
    cues: template.cues,
    steps: template.steps,
    pitfalls: template.pitfalls,
    examples: runtime.examples,
    figure: runtime.figure,
  };
  console.log(template.id, crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'));
}
NODE
```

Review that every template has at least three cues, four steps, two pitfalls, one runtime example, one figure path, and an existing parent chapter before recording hashes.

- [x] **Step 3: Implement cloned records and source boundaries**

Record all 36 titles, categories and `relatedChapters` from the current repository. Use the official math curriculum and PEP textbook links already used by the chapter/topic review. Set `reviewBatch: 'v1.9.6'`, `reviewScope: 'stable-method-template'`, and `reviewedAt: '2026-08-10'`. Set `figureSource` to `dedicated-asset` for the 13 `templates/` images and `shared-generated-asset` for the remaining mapped figures. Add the stable-container scope note to templates linked to chapters 19 or 20.

- [x] **Step 4: Implement strict template checks**

The checker must reject duplicate/unknown IDs, title/category/chapter mismatch, snapshot drift, missing parents, fewer than 3 cues, fewer than 4 steps, fewer than 2 pitfalls, missing runtime examples, empty runtime figure, missing source keys, non-official hosts, invalid dates, missing evidence, uncloneable arrays, and any non-target template returning review metadata. It must verify every runtime `getTemplateById('math', id)` exposes `contentMeta.status === 'verified'` after Task 2.

- [x] **Step 5: Run the focused checker**

Run `node scripts/check-math-template-review.js`; expected result: `OK math template review: 36 templates`.

- [x] **Step 6: Commit the review contract**

```bash
git add packages/math/data/template-review-meta.js scripts/check-math-template-review.js
git commit -m "feat(math): review method templates"
```

### Task 2: Attach metadata and add the release gate

**Files:**
- Modify: `packages/math/repository.js`
- Modify: `scripts/check-release-readiness.js`

**Interfaces:**
- `enrichTemplate(template)` conditionally attaches `contentMeta: getTemplateReviewMeta(template.id)` while preserving the existing resolved `figure` and `examples` fields.
- Release readiness runs `scripts/check-math-template-review.js` after the math topic review gate.

- [x] **Step 1: Add the failing runtime assertion**

Extend the focused checker to assert that all 36 `getTemplateById('math', id)` results expose verified metadata and that `getTemplateReviewMeta('unknown-template') === null`.

- [x] **Step 2: Attach metadata at the hydration boundary**

Import `getTemplateReviewMeta` and spread it only when present in `enrichTemplate`. Apart from the single `model-midpoint` field-completeness correction recorded in the review document, do not alter `templateLibrary`, example fallback selection, figure resolution, search ranking, or storage keys.

- [x] **Step 3: Add the release gate**

Require and execute the focused checker from `check-release-readiness.js`, preserving the existing chapter, topic, curriculum and content-audit gates.

- [x] **Step 4: Run focused integration checks**

Run:

```bash
node scripts/check-math-template-review.js
node scripts/build-content-audit.js
node scripts/check-content-audit.js
node scripts/check-release-readiness.js
```

Expected: 36 math template entities become verified; English and physics queue counts remain unchanged.

- [x] **Step 5: Commit runtime integration**

```bash
git add packages/math/repository.js scripts/check-release-readiness.js
git commit -m "chore(audit): gate reviewed math templates"
```

### Task 3: Rebuild the queue and document the boundary

**Files:**
- Modify: `scripts/check-content-review-queue.js`
- Modify: `README.md`
- Modify: `docs/后续开发与发布路线.md`
- Modify: `docs/新版教材目录对照与迁移规则.md`
- Create: `docs/v1.9.6数学方法模板复核实施记录.md`

**Interfaces:**
- Queue becomes 46 items: English 12 and physics 34; no `math:chapter`, `math:topic` or `math:template` entries remain.
- Documentation records 36/36 math templates reviewed, 948 total entities, 902 reviewed and 46 queued, with the 46-item queue hash and source hash recorded.
- Docs explicitly preserve the fact that this is a stable-method-template review, not a textbook chapter-order rewrite.

- [x] **Step 1: Add the failing queue expectations**

Update `check-content-review-queue.js` to expect `queued === 46`, subject totals `{ english: 12, math: 0, physics: 34 }`, `math:template === undefined`, `math:chapter === undefined`, `math:topic === undefined`, and priority totals `{ 1: 12, 2: 34 }`. Run the checker before rebuilding to observe the expected old-report failure.

- [x] **Step 2: Rebuild and validate the queue**

Run the content-audit and queue builders/checkers. Confirm the first queue item is an English topic, all 36 math templates are absent from the queue, and the 46 remaining entries are exactly English/physics entities.

- [x] **Step 3: Update docs and record hashes**

Record the current entity totals, queue totals, queue `sourceHash`, queue file SHA-256, official source links, template figure-source boundary and the next route: English/physics container reviews.

- [x] **Step 4: Run docs/release checks and commit**

```bash
node scripts/build-content-review-queue.js
node scripts/check-content-review-queue.js
node scripts/check-math-curriculum-audit.js
node scripts/check-release-readiness.js
git diff --check
git add scripts/check-content-review-queue.js README.md docs/后续开发与发布路线.md docs/新版教材目录对照与迁移规则.md docs/v1.9.6数学方法模板复核实施记录.md
git commit -m "docs(v1.9.6): close math template review"
```

### Task 4: Full validation and push

**Files:**
- Modify: `docs/superpowers/plans/2026-08-10-math-template-review-v1.9.6.md`

- [x] **Step 1: Run the complete check matrix**

Run every `scripts/check-*.js` except the package-size check's legacy default input, run `node scripts/prepare-remote-assets.js`, validate the fresh Developer Tools preview report explicitly, run all audit builders/checkers and `git diff --check`.

- [x] **Step 2: Confirm queue determinism**

Generate the queue twice and compare SHA-256 byte-for-byte. The two hashes must match.

- [x] **Step 3: Confirm the final scope**

Confirm only template review data, the single documented template field correction, template hydration, queue expectations, docs and plan changed; no knowledge bodies, topic records, images, storage schemas or release versions changed.

- [ ] **Step 4: Commit the completed plan and push**

```bash
git add docs/superpowers/plans/2026-08-10-math-template-review-v1.9.6.md
git commit -m "docs(v1.9.6): record math template review plan completion"
git push -u origin codex/math-template-review-v1.9.6
```
