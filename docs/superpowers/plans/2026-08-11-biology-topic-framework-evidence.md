# Biology Topic Framework Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 6 个现有生物原创单元建立可验证的官方框架佐证记录，同时严格保持非逐章映射、非外部正文导入的证据边界。

**Architecture:** 新增一个构建期 JSON 证据记录和独立 Node 校验器。校验器只读现有生物专题、复核元数据和来源注册表，生成稳定容器快照并验证来源、范围、顺序和运行时来源引用；它不进入小程序分包。

**Tech Stack:** Node.js 内置 `assert`、`crypto`、`fs`、`path`，现有静态 JavaScript 内容数据、来源注册表和 v1.11 质量矩阵。

## Global Constraints

- 只处理构建期证据和来源注册表规范标题；不改生物页面、知识正文、观察说明、稳定 ID、云资源路径、本地存储或发布版本。
- 来源仅可使用 `moe-biology-curriculum-2022` 和 `pep-compulsory-biology-textbook` 两个已登记官方来源。
- `evidenceKind` 必须为 `official-framework-support`；不得声称教材逐章标题、章节顺序、册次映射、正文或原始插图得到验证。
- 生物运行时 `review.sourceRefs` 保持既有显示标题别名；校验器只要求其来源键集合和 URL 与注册表一致。
- 每一步先写可观察的失败测试，再添加最小实现；提交按“规格、校验器、记录与矩阵”分批进行。

---

### Task 1: Define the biology framework-evidence checker contract

**Files:**
- Create: `scripts/check-biology-topic-framework-evidence.test.js`
- Create: `scripts/check-biology-topic-framework-evidence.js`

**Interfaces:**
- Consumes: `packages/biology/data/biology-topics.js`, `packages/biology/data/content-review-meta.js`, `data/content-source-registry.js`.
- Produces: `checkBiologyTopicFrameworkEvidence({ evidencePath })`, `DEFAULT_EVIDENCE_PATH`, `EVIDENCE_KIND`, `REVIEW_ID`.

- [ ] **Step 1: Write the failing test**

Create an assert test importing `checkBiologyTopicFrameworkEvidence`. Pass a unique missing file path and assert it throws `生物专题官方框架佐证记录读取失败`. The default CLI must initially exit nonzero because the evidence JSON does not exist.

```js
assert.throws(
  () => checkBiologyTopicFrameworkEvidence({ evidencePath }),
  /生物专题官方框架佐证记录读取失败/,
);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-biology-topic-framework-evidence.test.js`

Expected: Node fails because the checker module does not exist.

- [ ] **Step 3: Write the minimal checker**

Implement only safe JSON reading, error wrapping and a public function. Use `fs.readFileSync` and `JSON.parse`; export the function and execute it in CLI mode. Do not add evidence data yet.

```js
function checkBiologyTopicFrameworkEvidence({ evidencePath = DEFAULT_EVIDENCE_PATH } = {}) {
  return validateEvidence(readEvidence(path.resolve(evidencePath)));
}
```

- [ ] **Step 4: Run the test to verify targeted behavior**

Run: `node scripts/check-biology-topic-framework-evidence.test.js`

Expected: missing-file assertion passes; default CLI remains red until Task 3 supplies the record.

- [ ] **Step 5: Commit the contract foundation**

```bash
git add scripts/check-biology-topic-framework-evidence.js scripts/check-biology-topic-framework-evidence.test.js
git commit -m "test(biology): define framework evidence contract"
```

### Task 2: Validate sources, runtime review metadata and topic boundaries

**Files:**
- Modify: `data/content-source-registry.js`
- Modify: `scripts/check-biology-topic-framework-evidence.js`
- Modify: `scripts/check-biology-topic-framework-evidence.test.js`

**Interfaces:**
- Consumes: `getContentSource`, `isAllowedContentSourceUrl`, `topics`, `getBiologyReview`.
- Produces: validation of the two exact source keys, title/URL/role/observation records, six ordered topic IDs, runtime review source refs and SHA-256 container snapshots.

- [ ] **Step 1: Extend the failing test with boundary cases**

Require public `EVIDENCE_KIND === 'official-framework-support'` and `REVIEW_ID === 'biology-topic-framework-support-2026-v1'`. Assert that the source registry canonical title is `人教版义务教育生物学（七～八年级）新教材介绍`. Add temporary evidence with a prohibited `chapterOrder` field and assert it fails. Add runtime mutations that replace one `review.sourceRefs` key with `moe-physics-2022`, and separately append `?drift=1` to a valid biology source URL; both must fail.

```js
assert.throws(
  () => checkBiologyTopicFrameworkEvidence(),
  /复核来源键不完整/,
);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-biology-topic-framework-evidence.test.js`

Expected: source title and strict validation assertions fail because the minimal checker does not implement them.

- [ ] **Step 3: Implement strict schema and snapshot validation**

Update only `data/content-source-registry.js` so `pep-compulsory-biology-textbook` uses the official page title. Require exactly these source contracts:

```js
[
  ['moe-biology-curriculum-2022', 'curriculum-baseline', '作为义务教育生物学课程标准的官方基线，用于宏观课程框架观察。'],
  ['pep-compulsory-biology-textbook', 'textbook-unit-framework-summary', '公开介绍说明教材包括六个单元、对应课程标准前六个学习主题，并概述六个单元的宏观内容。'],
]
```

Require root/scope/source/topic allowed fields, the four fixed `notVerified` exclusions, the two source keys and URL/domain checks, exact runtime `review.sourceRefs` key set and URL per key, and the stable source review status `reviewed`. Reject recursively named `chapter*`, `volume*`, `lesson*`, `mapping`, `sourceKind`, `input*`, `manifest`, `body`, `resource*`, `asset*`, `image*`, `figure*` and `content*` fields.

Build the SHA-256 snapshot only from `id`, `unitLabel`, `title`, `summary`, `gradeBands`, `keywords`, `knowledgeIds`, `templateIds`, `coverImage` and `diagramImage`.

- [ ] **Step 4: Run the test to verify malformed-record checks pass**

Run: `node scripts/check-biology-topic-framework-evidence.test.js`

Expected: missing-file, runtime-review and malformed-record assertions pass; default CLI remains red until Task 3.

- [ ] **Step 5: Commit validator behavior**

```bash
git add data/content-source-registry.js scripts/check-biology-topic-framework-evidence.js scripts/check-biology-topic-framework-evidence.test.js
git commit -m "feat(biology): validate topic framework evidence"
```

### Task 3: Add the bounded official evidence record

**Files:**
- Create: `docs/evidence/biology-topic-framework-review-2026.json`
- Modify: `scripts/check-biology-topic-framework-evidence.test.js`

**Interfaces:**
- Consumes: current biology topics in data order and the checker from Tasks 1-2.
- Produces: a passing default record for 6 topics and CLI success text `OK biology topic framework evidence: 6 topics`.

- [ ] **Step 1: Extend the test for a green default record and order drift**

Spawn the default CLI, require status `0`, match its success message and assert its returned source keys. Create a complete temporary record from current topics, then swap its first two `topics` entries and require `专题佐证 ID 或顺序漂移`.

```js
assert.throws(
  () => checkBiologyTopicFrameworkEvidence({ evidencePath: reorderedEvidencePath }),
  /专题佐证 ID 或顺序漂移/,
);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-biology-topic-framework-evidence.test.js`

Expected: failure because `docs/evidence/biology-topic-framework-review-2026.json` does not exist.

- [ ] **Step 3: Add the evidence record**

Add the `2026-08-11` record with scope supports:

```js
[
  '现有原创生物专题与官方公开课程、教材单元框架的宏观领域相容。',
  '专题稳定标识、标题与内部复核快照可追溯。',
]
```

Use the two source contracts from Task 2 and current-topic order. Use the exact internal domains `life/cells`, `organism diversity/classification`, `plant life/processes`, `human physiology/health`, `organism/environment`, `continuity/evolution`. Compute each `reviewSnapshotHash` with the checker projection; do not store textbook chapter numbers, content text or asset paths.

- [ ] **Step 4: Run focused checks**

Run:

```bash
node scripts/check-biology-topic-framework-evidence.test.js
node scripts/check-biology-topic-framework-evidence.js
node scripts/prepare-remote-assets.js
node scripts/check-biology-content.js
node scripts/check-biology-assets.js
node scripts/check-biology-build-contract.test.js
node scripts/check-chemistry-biology-high-risk-batches.js --report dist/content-audit/chemistry-biology-high-risk-batches.json
```

Expected: all commands exit `0`; the new CLI reports six topics and no runtime biology data changes appear in `git diff`.

- [ ] **Step 5: Commit evidence data**

```bash
git add docs/evidence/biology-topic-framework-review-2026.json scripts/check-biology-topic-framework-evidence.test.js
git commit -m "chore(biology): record topic framework evidence"
```

### Task 4: Integrate the quality gate and route documentation

**Files:**
- Modify: `scripts/check-v1.11-quality-matrix.js`
- Modify: `scripts/check-v1.11-quality-matrix.test.js`
- Modify: `scripts/check-roadmap-document-consistency.test.js`
- Modify: `docs/v1.11五科学科高风险字段复核记录.md`
- Modify: `docs/v1.11后续开发路线.md`
- Modify: `docs/后续开发与发布路线.md`
- Modify: `docs/superpowers/plans/2026-08-11-biology-topic-framework-evidence.md`

**Interfaces:**
- Consumes: `scripts/check-biology-topic-framework-evidence.test.js`.
- Produces: default matrix length `119` and docs that retain external-source and release blockers.

- [ ] **Step 1: Extend matrix and roadmap consistency tests first**

Require `scripts/check-biology-topic-framework-evidence.test.js` in `DEFAULT_CHECKS`; set expected matrix count to `119`. Update route consistency test binding and its reverse fixtures so both documents must state `119` and a false `118` count fails.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node scripts/check-v1.11-quality-matrix.test.js
node scripts/check-roadmap-document-consistency.test.js
```

Expected: count/command assertions fail because the biology command and `119` documentation are absent.

- [ ] **Step 3: Register the command and update documentation**

Register the biology check adjacent to chemistry. State in both v1.11 records that six biology topics receive only supplementary `official-framework-support`, not chapter order, external input or release unblocking. Update current matrix totals to `119` in both route documents and preserve `content-source-follow-up: blocked` plus AppID/device evidence blockers.

- [ ] **Step 4: Run full verification**

Run:

```bash
node scripts/check-v1.11-quality-matrix.test.js
node scripts/check-roadmap-document-consistency.test.js
node scripts/check-v1.11-quality-matrix.js
node scripts/check-content-audit.js --require-reviewed
node scripts/check-release-readiness.js
git diff --check
```

Expected: matrix reports `OK v1.11 quality matrix: 119 checks`; content audit and release readiness pass; diff check has no output.

- [ ] **Step 5: Commit and push the integrated batch**

```bash
git add scripts/check-v1.11-quality-matrix.js scripts/check-v1.11-quality-matrix.test.js scripts/check-roadmap-document-consistency.test.js docs/v1.11五科学科高风险字段复核记录.md docs/v1.11后续开发路线.md docs/后续开发与发布路线.md docs/superpowers/plans/2026-08-11-biology-topic-framework-evidence.md
git commit -m "chore(quality): register biology framework evidence"
git push -u origin codex/biology-topic-framework-evidence-v1.11
```

## Plan Self-Review

- Spec coverage: Tasks 1-3 implement the bounded source/record contract; Task 4 adds the global quality gate and truthful route records.
- No placeholders: every task specifies fields, expected strings, files and test commands.
- Type consistency: the checker API, evidence path, evidence kind, source IDs and success text stay identical across tasks.
- Scope: no task alters learner-facing biology data, content-source intake status, release evidence or normal runtime package code.
