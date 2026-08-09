# Content Audit v1.9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一个可重复运行的五科学科内容审计报告，统一输出内容规模、复核来源、示例/实验、资源引用和内容差异，提升后续内容生产效率而不改变小程序运行时。

**Architecture:** 新增 `scripts/content-audit.js` 作为唯一数据采集层，复用现有五科静态数据、subject registry、content manifest、搜索和参考索引构建结果。`build-content-audit.js` 只负责生成确定性的 `dist/content-audit/content-audit.json`；`check-content-audit.js` 负责校验报告结构、数量、复核状态、来源域名、差异摘要和禁止任务字段。报告不进入 `app.json`、分包或主包。

**Tech Stack:** Node.js CommonJS、现有静态 JS 数据仓库、`crypto`、JSON、Node `assert` 风格脚本。

## Global Constraints

- 保持五科稳定内容 ID、旧链接、收藏、最近浏览、笔记和搜索索引不变。
- 不新增测评、任务、错题、登录、云同步或运行时网络请求。
- 报告必须确定性生成，不写入当前时间、机器路径或随机值。
- 所有来源只接受教育部或人教社官方 HTTPS 链接，生物学 `review` 元数据继续兼容现有字段。
- 报告只写入 `dist/content-audit/`，不进入主包和任何普通分包。
- v1.8 发布分支继续冻结；本计划只在 `codex/content-audit-v1.9` 分支实施。

### Task 1: Define the audit data contract

**Files:**
- Create: `scripts/content-audit.js`
- Create: `scripts/check-content-audit.js`
- Test: `scripts/check-content-audit.js`

**Interfaces:**
- Produces `collectContentAudit()` returning `{ schemaVersion, subjects, totals, contentDiff, search, references }`.
- Each subject row returns `{ id, name, status, counts, reviewed, examples, experiments, assets, issues }`.
- `check-content-audit.js` exits non-zero for missing required fields, duplicate IDs, invalid counts, unverified sources, forbidden task fields or incomplete references.

- [ ] **Step 1: Write the failing contract assertions**

Add assertions for five subjects, deterministic `schemaVersion: 1`, required subject keys, total counts, and the absence of task fields `practiceFlow`, `finishCriteria`, `outputTask`, `selfCheck` and `learningPath` in audited entities. Keep legitimate content-boundary fields such as chemistry topic `objective` auditable but allowed.

- [ ] **Step 2: Run the checker before implementation**

Run:

```bash
node scripts/check-content-audit.js
```

Expected: FAIL because `scripts/content-audit.js` and the report contract do not exist yet.

- [ ] **Step 3: Implement the shared collector**

Load the existing data modules once, normalize each entity to `{ subjectId, type, id, title, parentId, reviewed, exampleCount, experimentCount, assetRefs, sourceRefs }`, and use a stable sort by `subjectId`, `type`, and `id`. Do not hash timestamps or absolute paths.

- [ ] **Step 4: Run the checker against in-memory data**

Run:

```bash
node scripts/check-content-audit.js
```

Expected: PASS for the collector contract and all five subject rows.

- [ ] **Step 5: Commit**

```bash
git add scripts/content-audit.js scripts/check-content-audit.js
git commit -m "feat(audit): define five-subject content contract"
```

### Task 2: Generate the deterministic audit report

**Files:**
- Create: `scripts/build-content-audit.js`
- Modify: `scripts/content-audit.js`
- Test: `scripts/check-content-audit.js`

**Interfaces:**
- `build-content-audit.js` writes `dist/content-audit/content-audit.json`.
- Report `contentDiff` reuses `scripts/content-manifest.js` and the existing v1.3 baseline without embedding full changed entity bodies.
- Report `search` records the generated entry count and source hash; `references` records the reference count and source hash.

- [ ] **Step 1: Add report generation test expectations**

Extend the checker to require `contentDiff.added`, `contentDiff.modified`, `contentDiff.removed`, `search.entryCount`, `search.sourceHash`, `references.entryCount`, and `references.sourceHash`.

- [ ] **Step 2: Run the checker to verify the new expectations fail**

Run `node scripts/check-content-audit.js`; expected failure: the generated report is missing.

- [ ] **Step 3: Implement deterministic report generation**

Use `fs.mkdirSync(..., { recursive: true })`, serialize with two-space indentation and a trailing newline, and derive all numbers from the current source modules. Include per-subject counts for chapters/units/themes/topics/knowledge/templates/words/grammar/examples/experiments where available, using `0` only for non-applicable types.

- [ ] **Step 4: Run generation and validation**

Run:

```bash
node scripts/build-content-audit.js
node scripts/check-content-audit.js
```

Expected: both commands pass and `dist/content-audit/content-audit.json` is created.

- [ ] **Step 5: Commit**

```bash
git add scripts/content-audit.js scripts/build-content-audit.js scripts/check-content-audit.js
git commit -m "feat(audit): generate deterministic content report"
```

### Task 3: Integrate audit checks into release verification

**Files:**
- Modify: `scripts/check-release-readiness.js`
- Modify: `README.md`
- Test: `scripts/check-content-audit.js`, `scripts/check-release-readiness.js`

**Interfaces:**
- Release readiness checks that the audit script exists and its output is reproducible, but does not make physical-device status pass automatically.
- README lists the two audit commands beside the existing release checks.

- [ ] **Step 1: Add a release-readiness assertion**

Require `scripts/build-content-audit.js` and `scripts/check-content-audit.js`, and verify the report path stays under `dist/content-audit/`.

- [ ] **Step 2: Run targeted checks**

Run `node scripts/check-release-readiness.js` and `node scripts/check-content-audit.js`; expected PASS.

- [ ] **Step 3: Update release documentation**

Add the audit commands and explain that a green content audit does not replace the v1.8 A1-A10 physical-device gate.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-release-readiness.js README.md
git commit -m "docs(audit): add content audit to release checks"
```

### Task 4: Full validation and handoff

**Files:**
- Modify: `docs/后续开发与发布路线.md`
- Create: `docs/v1.9内容审计工具实施记录.md`

- [ ] **Step 1: Run the complete existing check matrix**

Run every `scripts/check-*.js`, the audit generator/checker, `git diff --check`, and package-size validation from the v1.8 preview report. Expected: no failures and no runtime package changes.

- [ ] **Step 2: Verify determinism**

Run `node scripts/build-content-audit.js`, hash the report, run it again, and assert the two hashes match byte-for-byte.

- [ ] **Step 3: Record the report contents and release boundary**

Document five subjects, current counts, generated report path, hashes, commands, and the fact that physical-device A1-A10 remains a separate v1.8 gate.

- [ ] **Step 4: Request independent review**

Review the task commits against this plan; findings must be resolved before pushing.

- [ ] **Step 5: Commit and push**

```bash
git add docs/v1.9内容审计工具实施记录.md docs/后续开发与发布路线.md
git commit -m "docs(v1.9): record content audit handoff"
git push -u origin codex/content-audit-v1.9
```
