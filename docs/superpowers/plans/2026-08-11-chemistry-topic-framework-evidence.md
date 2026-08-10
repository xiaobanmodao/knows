# Chemistry Topic Framework Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 10 个化学原创专题建立可验证的官方框架佐证记录，同时严格保持非逐章映射、非外部正文导入的证据边界。

**Architecture:** 新增一个构建期 JSON 证据记录和一个独立 Node 校验器。校验器从现有化学专题数据生成稳定快照，并与内容来源注册表、复核元数据和固定范围声明交叉验证；它不进入小程序运行时分包。

**Tech Stack:** Node.js 内置 `assert`、`crypto`、`fs`、`path`，现有静态 JavaScript 内容数据与质量矩阵。

## Global Constraints

- 只处理构建期证据元数据；不改页面、知识正文、方程式、实验、稳定 ID、云资源路径、本地存储或发布版本。
- 来源仅可使用 `moe-chemistry-2022`、`moe-textbook-catalog-2024`、`pep-chemistry-training-2024` 三个已登记官方来源。
- `evidenceKind` 必须为 `official-framework-support`；不得声称教材逐章标题、章节顺序、册次映射、正文或原始插图得到验证。
- 每一步先写可观察的失败测试，再添加最小实现；提交按“规格、校验器、记录与矩阵”分批进行。

---

### Task 1: Define the chemistry framework-evidence checker contract

**Files:**
- Create: `scripts/check-chemistry-topic-framework-evidence.test.js`
- Create: `scripts/check-chemistry-topic-framework-evidence.js`

**Interfaces:**
- Consumes: `packages/chemistry/data/chemistry-topics.js`, `packages/chemistry/data/content-review-meta.js`, `data/content-source-registry.js`.
- Produces: `checkChemistryTopicFrameworkEvidence({ evidencePath })`, `DEFAULT_EVIDENCE_PATH`, `EVIDENCE_KIND`, `REVIEW_ID`.

- [ ] **Step 1: Write the failing test**

Create an assert test importing `checkChemistryTopicFrameworkEvidence`. Pass a unique missing file path and assert that it throws an error matching `化学专题官方框架佐证记录读取失败`. Also run the default CLI and assert that it initially exits nonzero because the default JSON has not been created.

```js
assert.throws(
  () => checkChemistryTopicFrameworkEvidence({ evidencePath }),
  /化学专题官方框架佐证记录读取失败/,
);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-chemistry-topic-framework-evidence.test.js`

Expected: Node fails because the checker module does not exist.

- [ ] **Step 3: Write the minimal checker**

Implement only JSON reading, error wrapping and a public function. Use `fs.readFileSync` and `JSON.parse`; export the function and execute it in CLI mode. Do not add evidence data yet.

```js
function checkChemistryTopicFrameworkEvidence({ evidencePath = DEFAULT_EVIDENCE_PATH } = {}) {
  return validateEvidence(readEvidence(path.resolve(evidencePath)));
}
```

- [ ] **Step 4: Run the test to verify the targeted failure behavior passes**

Run: `node scripts/check-chemistry-topic-framework-evidence.test.js`

Expected: missing-file assertion passes; default CLI remains red until Task 2 supplies the record.

- [ ] **Step 5: Commit the contract foundation**

```bash
git add scripts/check-chemistry-topic-framework-evidence.js scripts/check-chemistry-topic-framework-evidence.test.js
git commit -m "test(chemistry): define framework evidence contract"
```

### Task 2: Validate stable topics, sources and evidence boundaries

**Files:**
- Modify: `scripts/check-chemistry-topic-framework-evidence.js`
- Modify: `scripts/check-chemistry-topic-framework-evidence.test.js`

**Interfaces:**
- Consumes: `getContentSource`, `isAllowedContentSourceUrl`, `topics`, `getChemistryContentMeta`.
- Produces: a return value `{ topicCount: 10, sourceKeys, evidenceKind: 'official-framework-support' }` and CLI success message `OK chemistry topic framework evidence: 10 topics`.

- [ ] **Step 1: Extend the failing test with one invalid record**

Write a temporary JSON record containing a prohibited `chapterOrder` field. Assert that the checker throws `不得包含教材映射、内容输入或外部来源字段`. Add an assertion that changing a record source URL away from the registry URL fails.

```js
assert.throws(
  () => checkChemistryTopicFrameworkEvidence({ evidencePath: invalidPath }),
  /不得包含教材映射、内容输入或外部来源字段/,
);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-chemistry-topic-framework-evidence.test.js`

Expected: test fails because the checker does not yet reject prohibited fields or source drift.

- [ ] **Step 3: Implement strict schema and snapshot validation**

Implement exact allowed field sets for root, scope, sources and topics. Require the three source keys, expected role/observation strings, four `notVerified` exclusions, 10 topics in existing data order, verified `contentMeta`, and SHA-256 snapshots of the approved container projection. Reject `chapter*`, `volume*`, `lesson*`, `sourceKind`, `input*`, `content*`, `body`, `resource*` and `asset*` keys recursively.

- [ ] **Step 4: Run the test to verify it passes except for the still-missing default record**

Run: `node scripts/check-chemistry-topic-framework-evidence.test.js`

Expected: malformed-record assertions pass; default CLI assertion remains red until Task 3.

- [ ] **Step 5: Commit the validator behavior**

```bash
git add scripts/check-chemistry-topic-framework-evidence.js scripts/check-chemistry-topic-framework-evidence.test.js
git commit -m "feat(chemistry): validate topic framework evidence"
```

### Task 3: Add the bounded official evidence record

**Files:**
- Create: `docs/evidence/chemistry-topic-framework-review-2026.json`
- Modify: `scripts/check-chemistry-topic-framework-evidence.test.js`

**Interfaces:**
- Consumes: the checker from Tasks 1-2 and the current 10-topic data order.
- Produces: default evidence record that passes all schema, source and snapshot checks.

- [ ] **Step 1: Extend the test to require a green default run**

Spawn `node scripts/check-chemistry-topic-framework-evidence.js`, require exit status `0`, match `OK chemistry topic framework evidence: 10 topics`, and assert its returned values have the expected evidence kind and source-key list.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-chemistry-topic-framework-evidence.test.js`

Expected: failure because `docs/evidence/chemistry-topic-framework-review-2026.json` does not exist.

- [ ] **Step 3: Add the evidence record**

Add the 2026-08-11 record with three official sources, exact scope text, the four exclusions and one `frameworkDomains` list per current chemistry topic. Compute each `reviewSnapshotHash` using the checker projection; do not insert textbook chapter numbers, chapter titles or source-content text.

- [ ] **Step 4: Run focused checks**

Run:

```bash
node scripts/check-chemistry-topic-framework-evidence.test.js
node scripts/check-chemistry-topic-framework-evidence.js
node scripts/check-chemistry-accuracy.js
node scripts/check-chemistry-biology-high-risk-batches.js --report dist/content-audit/chemistry-biology-high-risk-batches.json
```

Expected: all commands exit 0, and the new CLI reports 10 topics.

- [ ] **Step 5: Commit the evidence data**

```bash
git add docs/evidence/chemistry-topic-framework-review-2026.json scripts/check-chemistry-topic-framework-evidence.test.js
git commit -m "chore(chemistry): record topic framework evidence"
```

### Task 4: Integrate the quality gate and documentation

**Files:**
- Modify: `scripts/check-v1.11-quality-matrix.js`
- Modify: `scripts/check-v1.11-quality-matrix.test.js`
- Modify: `docs/v1.11五科学科高风险字段复核记录.md`
- Modify: `docs/v1.11后续开发路线.md`
- Modify: `docs/superpowers/plans/2026-08-11-chemistry-topic-framework-evidence.md`

**Interfaces:**
- Consumes: `scripts/check-chemistry-topic-framework-evidence.test.js`.
- Produces: default matrix length `118` and documentation that preserves the external-source and release blockers.

- [ ] **Step 1: Extend the matrix contract test first**

Require `scripts/check-chemistry-topic-framework-evidence.test.js` in `DEFAULT_CHECKS` and update the expected default count to `118`.

- [ ] **Step 2: Run the matrix contract to verify it fails**

Run: `node scripts/check-v1.11-quality-matrix.test.js`

Expected: assertion failure because the new command is absent from `DEFAULT_CHECKS`.

- [ ] **Step 3: Register the command and update documentation**

Add the chemistry evidence contract adjacent to the existing physics framework contract. Update both Chinese v1.11 records to say it is a supplementary framework check, not a chapter map, external source, or release-unblocking claim. Mark this plan’s checkboxes as complete with actual command results.

- [ ] **Step 4: Run full verification**

Run:

```bash
node scripts/check-v1.11-quality-matrix.test.js
node scripts/check-v1.11-quality-matrix.js
node scripts/check-content-audit.js --require-reviewed
node scripts/check-release-readiness.js
git diff --check
```

Expected: matrix reports `OK v1.11 quality matrix: 118 checks`; content audit and release readiness pass; diff check has no output.

- [ ] **Step 5: Commit and push the integrated batch**

```bash
git add scripts/check-v1.11-quality-matrix.js scripts/check-v1.11-quality-matrix.test.js docs/v1.11五科学科高风险字段复核记录.md docs/v1.11后续开发路线.md docs/superpowers/specs/2026-08-11-chemistry-topic-framework-evidence-design.md docs/superpowers/plans/2026-08-11-chemistry-topic-framework-evidence.md
git commit -m "chore(quality): register chemistry framework evidence"
git push -u origin codex/chemistry-topic-framework-evidence-v1.11
```

## Plan Self-Review

- Spec coverage: Tasks 1-3 implement the bounded evidence record and all source/snapshot checks; Task 4 adds the global quality gate and truthful route records.
- No placeholders: every task names exact paths, public interfaces, test commands and expected red/green result.
- Type consistency: the checker export, evidence path, evidence kind and CLI message use the same names across all tasks.
- Scope: no task migrates data format, modifies runtime pages or claims external source intake is complete.
