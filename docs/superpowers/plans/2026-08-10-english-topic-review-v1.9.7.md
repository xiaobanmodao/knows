# English Topic Review v1.9.7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 6 个英语能力专题的稳定 ID、知识点/方法引用、内容字段快照和官方来源复核，使英语专题进入可持续审计状态。

**Architecture:** 新增英语专题复核元数据模块，记录 6 个专题的稳定字段和快照哈希。英语 repository 在 `hydrateTopic` 边界挂载专题复核元数据，检查器同时读取静态专题和运行时专题，验证知识点、方法模板、封面/结构图和搜索入口不漂移。英语单元、单词、语法和知识正文不做批量改写。

**Tech Stack:** Node.js CommonJS、现有 `english-content`、英语 repository、Node `crypto`/`assert`、内容审计和复核队列脚本。

## Global Constraints

- 6 个英语专题稳定 ID、标题、知识点 ID、方法模板 ID、搜索入口和旧链接保持不变。
- 每个专题必须登记标题、适用年级、知识点引用、模板引用、摘要、关键词、题干信号、4 条检查点、封面、结构图、复核日期、两条官方来源和三项证据。
- 本批只复核专题容器，不改变 42 个单元、336 个单词、84 个语法点或 924 条例句。
- 不复制人教版课文、听力材料、题目、解析或插图；现有原创资源只登记引用，不重新命名云路径。
- 物理 6 个专题、22 个方法模板和 6 个结构化方法继续保留在复核队列，不因共享检查器被误标为已复核。

---

### Task 1: Define the six-topic review contract

**Files:**
- Create: `packages/english/data/topic-review-meta.js`
- Create: `scripts/check-english-topic-review.js`
- Test: `scripts/check-english-topic-review.js`

**Interfaces:**
- Export `REVIEWED_ENGLISH_TOPIC_IDS` in the exact `englishContent.topics` order.
- Export `TOPIC_REVIEW_RECORDS` keyed by topic ID with title, grade bands, knowledge IDs, template IDs and snapshot hash.
- Export `buildEnglishTopicReviewSnapshot(topic)` returning `{ value, hash }`.
- Export `getEnglishTopicReviewMeta(topicId)` returning a cloned verified metadata object or `null`.
- Export `checkEnglishTopicReview()` and make the checker executable.

- [x] **Step 1: Write the failing checker first**

Require the exact six IDs and records before the metadata module exists:

```js
const expectedIds = [
  'eng-topic-vocabulary', 'eng-topic-sentence', 'eng-topic-tense',
  'eng-topic-grammar', 'eng-topic-reading', 'eng-topic-writing',
];
assert.deepStrictEqual(REVIEWED_ENGLISH_TOPIC_IDS, expectedIds);
assert.deepStrictEqual(Object.keys(TOPIC_REVIEW_RECORDS), expectedIds);
```

Run `node scripts/check-english-topic-review.js`; it must fail because the metadata module does not exist.

- [x] **Step 2: Generate read-only snapshot candidates**

Hash the stable topic fields, not cloud-signed runtime URLs:

```bash
node - <<'NODE'
const crypto = require('crypto');
const { topics } = require('./packages/english/data/english-content');
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

Record all six titles, grade bands, knowledge IDs, template IDs and current snapshot hashes. Use `reviewBatch: 'v1.9.7'`, `reviewScope: 'stable-topic-container'`, `reviewedAt: '2026-08-10'`, the official Ministry of Education curriculum page and the PEP new English textbook page. Evidence must cover parent references, topic fields/search entry, and source/manual review registration.

- [x] **Step 4: Implement strict topic checks**

Reject duplicate/unknown IDs, title/grade/reference drift, missing knowledge or template parents, missing summary/keywords/signals/checkpoints, missing asset references, snapshot drift, invalid dates, non-official hosts, missing evidence, and metadata clone leakage. Verify every runtime topic has `contentMeta.status === 'verified'`; unknown topics return `null`.

- [x] **Step 5: Run the focused checker**

Run `node scripts/check-english-topic-review.js`; expected: `OK English topic review: 6 topics`.

- [x] **Step 6: Commit the topic contract**

```bash
git add packages/english/data/topic-review-meta.js scripts/check-english-topic-review.js
git commit -m "feat(english): review topic containers"
```

### Task 2: Attach metadata and add the release gate

**Files:**
- Modify: `packages/english/repository.js`
- Modify: `scripts/subject-adapters/english.js`
- Modify: `scripts/content-audit.js`
- Modify: `scripts/check-release-readiness.js`

**Interfaces:**
- `hydrateTopic(topic)` conditionally attaches `contentMeta: getEnglishTopicReviewMeta(topic.id)` and preserves resolved cover/diagram URLs.
- Release readiness executes `scripts/check-english-topic-review.js` after the existing math review gates.

- [x] **Step 1: Add the failing runtime assertion**

Extend the focused checker to assert all six `getTopicById('english', id)` results contain verified metadata and that `getEnglishTopicReviewMeta('unknown-topic') === null`.

- [x] **Step 2: Attach metadata at the topic hydration boundary**

Import the lookup and spread it only when present. Do not alter unit, word, grammar, knowledge or template hydration.

- [x] **Step 3: Add the release gate**

Require and execute the focused checker from `check-release-readiness.js`, preserving existing queue and math gates.

- [x] **Step 4: Run focused integration checks**

```bash
node scripts/check-english-topic-review.js
node scripts/build-content-audit.js
node scripts/check-content-audit.js
node scripts/check-release-readiness.js
```

Expected: 6 English topic entities become verified; the queue falls from 46 to 40.

- [x] **Step 5: Commit runtime integration**

```bash
git add packages/english/repository.js scripts/check-release-readiness.js
git commit -m "chore(audit): gate reviewed English topics"
```

### Task 3: Rebuild the queue and document the boundary

**Files:**
- Modify: `scripts/check-content-review-queue.js`
- Modify: `README.md`
- Modify: `docs/后续开发与发布路线.md`
- Modify: `docs/新版教材目录对照与迁移规则.md`
- Create: `docs/v1.9.7英语专题容器复核实施记录.md`

**Interfaces:**
- Queue becomes 40 items: English 6 and physics 34; no `english:topic` entries remain.
- Documentation records 948 total entities, 908 reviewed and 40 queued.

- [x] **Step 1: Add the failing queue expectations**

Update `check-content-review-queue.js` to expect `queued === 40`, subject totals `{ english: 6, math: 0, physics: 34 }`, `english:topic === undefined`, and priority totals `{ 1: 6, 2: 34 }`. Run before rebuilding to observe the old-report failure.

- [x] **Step 2: Rebuild and validate the queue**

Run the content-audit and queue builders/checkers. Confirm the first queue item is a physics topic and all six English topics are absent.

- [x] **Step 3: Update docs and record hashes**

Record the current counts, queue source hash, queue file SHA-256, official source links and next route: physics topic containers.

- [x] **Step 4: Run docs/release checks and commit**

```bash
node scripts/build-content-review-queue.js
node scripts/check-content-review-queue.js
node scripts/check-release-readiness.js
git diff --check
git add scripts/check-content-review-queue.js README.md docs/后续开发与发布路线.md docs/新版教材目录对照与迁移规则.md docs/v1.9.7英语专题容器复核实施记录.md
git commit -m "docs(v1.9.7): close English topic review"
```

### Task 4: Full validation and push

**Files:**
- Modify: `docs/superpowers/plans/2026-08-10-english-topic-review-v1.9.7.md`

- [x] **Step 1: Run the complete check matrix**

Run all `scripts/check-*.js` except the package-size check's legacy default input, validate the current Developer Tools preview report, rebuild/check remote assets, all audit builders/checkers and `git diff --check`.

- [x] **Step 2: Confirm queue determinism**

Generate the queue twice and compare SHA-256 byte-for-byte.

- [x] **Step 3: Confirm final scope**

Confirm only English topic review data, topic hydration, audit adapter/source whitelist, queue expectations, docs and plan changed; no English word/grammar content, physics content, images, storage schemas or release versions changed.

- [ ] **Step 4: Commit the completed plan and push**

```bash
git add docs/superpowers/plans/2026-08-10-english-topic-review-v1.9.7.md
git commit -m "docs(v1.9.7): record English topic review plan completion"
git push -u origin codex/english-topic-review-v1.9.7
```
