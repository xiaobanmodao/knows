# Physics Template Review v1.10.0 Implementation Plan

**Goal:** 完成物理 22 个章节方法模板和 6 个专题结构化方法模板的稳定复核，使物理方法模板进入可持续审计状态并清空当前复核队列。

**Architecture:** 新增统一的物理方法模板复核元数据模块，按 `parentType` 区分章节模板和专题模板，记录稳定字段和快照哈希。物理 repository 在 `hydrateTemplate` 边界挂载复核元数据，物理内容适配器改为通过 repository 暴露两类模板，保证运行时、内容审计和复核队列读取同一状态。

**Scope:** 本批只复核方法模板，不改 22 个章节、84 个知识点、29 个实验、6 个物理专题、公式、方向规则和实验正文。

## Task 1: Define the 28-template review contract

- [x] Write the failing checker first and confirm the metadata module is missing.
- [x] Record the 22 chapter-template IDs and 6 structured-template IDs, parent references, snapshot hashes, source references and evidence.
- [x] Implement strict checks for both parent types, signals, steps, pitfalls, examples, figures, snapshots and clone isolation.
- [x] Run `node scripts/check-physics-template-review.js` successfully.

## Task 2: Attach metadata and align the audit adapter

- [x] Attach `contentMeta` at the physics template hydration boundary.
- [x] Route chapter and structured template audit entities through the repository.
- [x] Add the physics template checker to release readiness.
- [x] Confirm all 28 physics template entities become verified.

## Task 3: Empty the review queue and update documentation

- [x] Update queue expectations to zero remaining entities.
- [x] Rebuild and verify the deterministic empty queue.
- [x] Record audit counts, queue hashes, sources and the post-review maintenance route.

## Task 4: Full validation and push

- [x] Run all check scripts, `--require-reviewed`, remote asset checks and Developer Tools package preview.
- [x] Confirm the empty queue is byte-for-byte deterministic and the change scope is limited.
- [x] Commit the completed plan and push `codex/physics-template-review-v1.10.0`.
