# English Template Review v1.9.9 Implementation Plan

**Goal:** 完成 6 个英语方法模板的稳定复核，使英语方法模板进入可持续审计状态，并把复核队列从 34 项收敛到 28 项。

**Architecture:** 新增英语方法模板复核元数据模块，记录稳定字段和快照哈希。英语 repository 在 `hydrateTemplate` 边界挂载复核元数据，英语内容适配器改为使用 repository 的模板实体，保证运行时、内容审计和复核队列读取同一状态。

**Scope:** 本批只复核英语方法模板，不改 42 个单元、336 个单词、84 个语法点、6 个专题或 924 条原创例句正文。

## Task 1: Define the six-template review contract

- [x] Write the failing checker first and confirm the metadata module is missing.
- [x] Record stable IDs, topic parents, snapshot hashes, source references and evidence.
- [x] Implement strict checks for parent topics, signals, steps, pitfalls, examples, figures, snapshots and clone isolation.
- [x] Run `node scripts/check-english-template-review.js` successfully.

## Task 2: Attach metadata and align the audit adapter

- [x] Attach `contentMeta` at the English template hydration boundary.
- [x] Route English template audit entities through the repository.
- [x] Add the English template checker to release readiness.
- [x] Confirm all six English template entities become verified.

## Task 3: Rebuild the queue and update documentation

- [x] Update queue expectations to 28 remaining physics templates.
- [x] Rebuild and verify the deterministic queue.
- [x] Record audit counts, queue hashes, sources and the next physics-template route.

## Task 4: Full validation and push

- [x] Run all check scripts, remote asset checks and Developer Tools package preview.
- [x] Confirm the queue is byte-for-byte deterministic and the change scope is limited; also harden the existing remote-asset compression fallback discovered by the full gate.
- [x] Commit the completed plan and push `codex/english-template-review-v1.9.9`.
