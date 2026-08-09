# Math Curriculum Audit v1.9.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将人教社公开确认的数学新版结构变化和当前 29 个稳定章节容器之间的差异固化为机器可校验报告，不在官方逐册目录未完整核对前重排运行时内容。

**Architecture:** 新增独立的数学目录基线模块，保存来源、已确认变化、当前稳定容器和待人工核对项。审计脚本读取基线与数学 repository，生成 `dist/content-audit/math-curriculum-diff.json`；报告只描述差异和风险，不修改章节、专题、知识点、收藏或旧链接。发布检查实际生成并校验该报告。

**Tech Stack:** Node.js CommonJS、现有数学 repository、Node `assert`、`crypto`、JSON。

## Global Constraints

- 保持 `ch01` 至 `ch29` 及所有 `lessonId`、旧别名、专题 ID、收藏和最近浏览目标不变。
- 教育部课程标准和人教社新版介绍只用于确定课程范围和已公开结构变化，不复制教材正文、题目、解析或插图。
- 官方逐册完整目录未可靠公开前，不猜测新版章号、册次或显示顺序。
- 报告必须区分 `confirmed-change`、`stable-container` 和 `needs-official-volume-map`，不把尚未核对的内容标记为已复核。
- 报告只写入 `dist/content-audit/`，不进入主包或任何普通分包。
- v1.8 实体设备 A1-A10 门禁仍独立于本审计，不因报告通过而创建 RC。

### Task 1: Define the curriculum baseline contract

**Files:**
- Create: `packages/math/data/math-curriculum-baseline.js`
- Create: `scripts/check-math-curriculum-audit.js`
- Test: `scripts/check-math-curriculum-audit.js`

**Interfaces:**
- Exports `MATH_CURRICULUM_BASELINE` with `schemaVersion`, `sources`, `stableContainerPolicy`, `confirmedChanges` and `volumeReviewStatus`.
- `checkMathCurriculumAudit(report)` rejects unknown stable IDs, untrusted source URLs, duplicate mappings, guessed official volume maps and missing confirmed-change evidence.

- [ ] **Step 1: Write the failing contract assertions**

Require the baseline to contain the three official sources, `schemaVersion: 1`, 29 stable container IDs, confirmed entries for function splitting and data-analysis additions, and a `needs-official-volume-map` status for unverified volume mappings.

- [ ] **Step 2: Run the checker before implementation**

Run:

```bash
node scripts/check-math-curriculum-audit.js
```

Expected: FAIL because the baseline module and audit report do not exist yet.

- [ ] **Step 3: Implement the baseline module**

Use the official Education Ministry curriculum PDF, official 2024 teaching-book catalog, and PEP mathematics new-textbook introduction. Record the known changes as evidence-backed mappings, while leaving the full volume map explicitly unverified.

- [ ] **Step 4: Run the focused baseline check**

Run `node scripts/check-math-curriculum-audit.js`; it should now fail only because the generated diff report is absent.

- [ ] **Step 5: Commit**

```bash
git add packages/math/data/math-curriculum-baseline.js scripts/check-math-curriculum-audit.js
git commit -m "feat(math): define new curriculum audit baseline"
```

### Task 2: Generate the deterministic curriculum diff

**Files:**
- Create: `scripts/math-curriculum-audit.js`
- Create: `scripts/build-math-curriculum-audit.js`
- Modify: `scripts/check-math-curriculum-audit.js`

**Interfaces:**
- `collectMathCurriculumAudit()` returns `{ schemaVersion, baselineVersion, sourceHash, current, confirmedChanges, openQuestions }`.
- `current` records all 29 stable chapters, their titles, stages and official section labels from the repository.
- `confirmedChanges` contains only evidence-backed mappings and their current implementation status.

- [ ] **Step 1: Add failing report expectations**

Require `current.chapterCount === 29`, no missing stable IDs, a 64-character `sourceHash`, one function-split record, one data-analysis-additions record, and no `openQuestions` item claiming a guessed volume or chapter number.

- [ ] **Step 2: Run the checker to verify the expected failure**

Run `node scripts/check-math-curriculum-audit.js`; expected failure is the missing generated report.

- [ ] **Step 3: Implement the collector and report writer**

Compare the stable repository records with the explicit baseline mappings. Use stable sorting and two-space JSON with a trailing newline. Report the current state of `ch19-linear-function` and `ch20-data-analysis` without mutating either record.

- [ ] **Step 4: Run focused generation and validation**

```bash
node scripts/build-math-curriculum-audit.js
node scripts/check-math-curriculum-audit.js
```

Expected: a deterministic report with 29 stable chapters and explicit open questions for official volume-by-volume confirmation.

- [ ] **Step 5: Commit**

```bash
git add scripts/math-curriculum-audit.js scripts/build-math-curriculum-audit.js scripts/check-math-curriculum-audit.js
git commit -m "feat(math): generate curriculum difference report"
```

### Task 3: Integrate the audit into release checks and documentation

**Files:**
- Modify: `scripts/check-release-readiness.js`
- Modify: `README.md`
- Modify: `docs/新版教材目录对照与迁移规则.md`
- Modify: `docs/数学目录与模型来源说明.md`

**Interfaces:**
- Release readiness runs the math audit builder/checker and fails on stale or missing output.
- Documentation states the confirmed changes, stable-container policy and the boundary against guessed new chapter order.

- [ ] **Step 1: Add release integration assertions**

Require the three math audit scripts and output path under `dist/content-audit/`.

- [ ] **Step 2: Run targeted release checks**

Run `node scripts/check-release-readiness.js`; expected failure is the missing math audit scripts until Task 2 is complete.

- [ ] **Step 3: Implement actual builder/checker execution**

Reuse the existing child-process execution pattern used by the v1.9 audit and v1.9.1 review queue. Keep error output concise and actionable.

- [ ] **Step 4: Update the two math source documents**

Record the PEP-confirmed function split and data-analysis additions, and explicitly state that full volume ordering remains open until official detailed directories are available.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-release-readiness.js README.md docs/新版教材目录对照与迁移规则.md docs/数学目录与模型来源说明.md
git commit -m "docs(math): gate curriculum audit before remapping"
```

### Task 4: Full validation and handoff

**Files:**
- Create: `docs/v1.9.2数学新版目录审计实施记录.md`
- Modify: `docs/后续开发与发布路线.md`

- [ ] **Step 1: Run the complete existing check matrix**

Run every `scripts/check-*.js`, both math audit commands, `git diff --check`, remote asset preparation/checks and current preview package-size validation. Expected: no runtime package changes and no failures.

- [ ] **Step 2: Verify determinism**

Generate the math report twice and compare SHA-256 byte-for-byte.

- [ ] **Step 3: Record confirmed and open items**

Document the 29 stable containers, confirmed changes, current report hash, official sources and the fact that no chapter display order was changed.

- [ ] **Step 4: Request independent review**

Review all task commits against this plan. Resolve P1/P2 findings before pushing.

- [ ] **Step 5: Commit and push**

```bash
git add docs/v1.9.2数学新版目录审计实施记录.md docs/后续开发与发布路线.md docs/superpowers/plans/2026-08-10-math-curriculum-audit-v1.9.2.md
git commit -m "docs(v1.9.2): record math curriculum audit handoff"
git push -u origin codex/math-curriculum-audit-v1.9.2
```
