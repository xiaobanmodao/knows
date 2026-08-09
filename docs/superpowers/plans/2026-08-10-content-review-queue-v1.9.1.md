# Content Review Queue v1.9.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将五科内容审计中 140 个 `untracked` 实体生成确定性、可排序、可执行的人工复核队列，不修改内容复核状态，不改变小程序运行时。

**Architecture:** 复用 `scripts/content-audit.js` 的统一实体采集器，仅筛选 `reviewed.status === "untracked"`。队列生成器按学科、类型、稳定 ID 排序，为每项提供父级、搜索键、来源候选和复核证据要求；构建产物写入 `dist/content-audit/content-review-queue.json`，由独立校验器检查完整覆盖和确定性。发布准备脚本实际构建并校验审计报告与复核队列。

**Tech Stack:** Node.js CommonJS、现有静态 JS 数据、Node `assert`、`crypto`、JSON。

## Global Constraints

- 保持五科稳定内容 ID、旧链接、收藏、最近浏览、笔记和搜索索引不变。
- 不把 `untracked` 自动改成 `verified` 或 `reviewed`，不伪造人工复核、来源或日期。
- 不新增测评、任务、错题、登录、云同步或运行时网络请求。
- 队列必须确定性生成，不写入当前时间、绝对路径或随机值。
- 队列只写入 `dist/content-audit/`，不进入主包或任何普通分包。
- v1.8 实体设备 A1-A10 门禁保持独立；队列通过不等于可以创建 `1.8.0-rc.1`。

### Task 1: Expose the shared audit entity collection

**Files:**
- Modify: `scripts/content-audit.js`
- Test: `scripts/check-content-review-queue.js`

**Interfaces:**
- `content-audit.js` exports `collectAuditEntities()` returning normalized, stable-sorted entities with `subjectId`, `type`, `id`, `title`, `parentId` and `reviewed`.
- Existing `collectContentAudit()` and `checkAuditReport()` behavior remains unchanged.

- [x] **Step 1: Write the failing queue contract assertion**

Add a test import for `collectAuditEntities` and assert the queue can obtain the current `untracked` entity set. Before the export exists, the test must fail with a missing function or incomplete queue module.

- [x] **Step 2: Run the checker before implementation**

Run:

```bash
node scripts/check-content-review-queue.js
```

Expected: FAIL because the queue collector/checker has not been implemented.

- [x] **Step 3: Export the existing normalized collector**

Rename the private `collectEntities` export or add the alias `collectAuditEntities` without duplicating data loading. Keep its existing stable sort and return shape.

- [x] **Step 4: Run the focused contract check**

Run `node scripts/check-content-review-queue.js`; it may still fail on the missing generated report, but it must no longer fail because the shared collector is absent.

- [x] **Step 5: Commit**

```bash
git add scripts/content-audit.js scripts/check-content-review-queue.js
git commit -m "feat(audit): expose review queue entity collector"
```

### Task 2: Build and validate the review queue

**Files:**
- Create: `scripts/content-review-queue.js`
- Create: `scripts/build-content-review-queue.js`
- Create: `scripts/check-content-review-queue.js`
- Test: `scripts/check-content-review-queue.js`

**Interfaces:**
- `collectContentReviewQueue()` returns `{ schemaVersion, sourceVersion, status, totals, sourceHash, items }`.
- Each item returns `{ key, subjectId, type, id, title, parentId, status, priority, priorityReason, searchKey, sourceCandidates, evidence }`.
- `checkContentReviewQueue(report)` rejects missing untracked entities, reviewed entities, duplicate keys, unstable order, invalid priorities, invalid counts and invalid hashes.

- [x] **Step 1: Add failing report expectations**

Extend `check-content-review-queue.js` to require `schemaVersion: 1`, `status: "review-queue"`, `totals.queued === 140`, `items.length === 140`, subject totals `math: 94`, `english: 12`, `physics: 34`, and a 64-character `sourceHash`.

- [x] **Step 2: Run the checker to verify the expected failure**

Run `node scripts/check-content-review-queue.js`; expected failure is the missing collector or report contract, not a syntax error.

- [x] **Step 3: Implement the deterministic queue builder**

Filter only `untracked` entities. Assign priority `1` to `chapter`, `unit`, `theme` and `topic`, and priority `2` to `template` and `structured-template`. Use explicit subject source policies and evidence requirements; keep them as review instructions, not claimed sources. Normalize structured search types by removing the `structured-` prefix.

- [x] **Step 4: Implement the generated report writer**

Write `dist/content-audit/content-review-queue.json` with two-space JSON and a trailing newline. Run `checkContentReviewQueue()` before writing.

- [x] **Step 5: Run focused generation and validation**

```bash
node scripts/build-content-review-queue.js
node scripts/check-content-review-queue.js
```

Expected: 140 queue items, no reviewed item, and stable subject/type/priority counts.

- [x] **Step 6: Commit**

```bash
git add scripts/content-review-queue.js scripts/build-content-review-queue.js scripts/check-content-review-queue.js
git commit -m "feat(audit): generate deterministic review queue"
```

### Task 3: Integrate the queue into release verification

**Files:**
- Modify: `scripts/check-release-readiness.js`
- Modify: `README.md`
- Test: `scripts/check-release-readiness.js`, `scripts/check-content-review-queue.js`

**Interfaces:**
- `check-release-readiness.js` runs the queue builder and checker after the content audit builder/checker.
- README lists the queue commands beside the audit commands and states that the queue exposes quality debt rather than approving it.

- [x] **Step 1: Add a failing release integration assertion**

Require all three queue scripts and the `dist/content-audit/content-review-queue.json` output path in the release checker.

- [x] **Step 2: Run targeted release checks**

Run `node scripts/check-release-readiness.js`; expected failure is the missing queue scripts until Task 2 is implemented.

- [x] **Step 3: Implement actual builder/checker execution**

Reuse the existing child-process helper pattern used for the content audit. Capture the last three lines of a failed child process in the release issue output; do not silently pass when the report is absent or stale.

- [x] **Step 4: Update release documentation**

Add:

```bash
node scripts/build-content-review-queue.js
node scripts/check-content-review-queue.js
```

Explain that `untracked` remains visible and that physical-device A1-A10 is still a separate release gate.

- [x] **Step 5: Commit**

```bash
git add scripts/check-release-readiness.js README.md
git commit -m "docs(audit): gate review queue in release checks"
```

### Task 4: Record handoff and verify determinism

**Files:**
- Modify: `docs/后续开发与发布路线.md`
- Create: `docs/v1.9.1复核队列实施记录.md`

**Interfaces:**
- The implementation record documents the queue schema, current 140-item breakdown, commands, deterministic hash and next review order.
- The route document points to v1.9.1 and keeps the v1.8 physical-device gate explicit.

- [x] **Step 1: Run the complete existing check matrix**

Run every `scripts/check-*.js`, the audit builder/checker, the queue builder/checker, `git diff --check` and package-size validation. Expected: no failures and no runtime package changes.

- [x] **Step 2: Verify queue determinism**

Run the queue builder twice, compare SHA-256 byte-for-byte, and assert the item keys are identical.

- [x] **Step 3: Record the review order**

Document priority 1 containers before priority 2 templates, list each subject count, and state that no item was promoted automatically.

- [x] **Step 4: Request independent review**

Review all task commits against this plan; resolve P1/P2 findings before pushing.

- [x] **Step 5: Commit and push**

```bash
git add docs/superpowers/plans/2026-08-10-content-review-queue-v1.9.1.md docs/v1.9.1复核队列实施记录.md docs/后续开发与发布路线.md
git commit -m "docs(v1.9.1): record review queue handoff"
git push -u origin codex/content-review-queue-v1.9.1
```
