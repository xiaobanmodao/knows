# Math Container Review v1.9.4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成剩余 19 个数学稳定章节容器的真实来源登记，使 29 个数学章节全部具备可验证的容器级复核记录。

**Architecture:** 在 v1.9.3 的 `chapter-review-meta.js` 中追加 `ch11-triangle` 至 `ch29-projection` 的逐项快照，不复制复核模块。检查器扩展为 29 章全量契约，并对 `ch19-linear-function`、`ch20-data-analysis` 明确保留 `stable-container-only` 边界；repository 继续只为已登记章节挂载 `contentMeta`。

**Tech Stack:** Node.js CommonJS、现有数学 repository、Node `assert`、静态 JS 数据、内容审计与复核队列工具。

## Global Constraints

- 29 个稳定章节 ID、lessonId、专题 ID、旧别名、收藏和最近浏览目标保持不变。
- 章节复核只确认稳定容器标题、小节和课程范围，不把当前历史显示顺序宣称为新版教材逐册原始章序。
- `ch19-linear-function` 和 `ch20-data-analysis` 的新版结构差异仍由 v1.9.2 报告管理，不得以章节复核状态覆盖 `pending-section-mapping` 或 `needs-official-volume-map`。
- 每个新增记录必须包含两条教育部/人教社官方来源、复核日期、`stable-container` 范围、标题/小节快照和三项证据。
- 未进入本批的专题、方法模板、英语和物理实体继续保持 `untracked`；不写入假来源，不复制教材正文、题目、解析或插图。
- 不改变本地存储版本、云资源路径、发布版本和生物学实体设备发布门禁。

### Task 1: Extend the chapter review records and contract

**Files:**
- Modify: `packages/math/data/chapter-review-meta.js`
- Modify: `scripts/check-math-container-review.js`

**Interfaces:**
- `REVIEWED_MATH_CHAPTER_IDS` becomes the exact stable order of all 29 chapter IDs.
- `CHAPTER_REVIEW_RECORDS` retains the first 10 v1.9.3 records and adds 19 v1.9.4 records.
- `getChapterReviewMeta(chapterId)` continues returning cloned metadata and `null` for unknown IDs.

- [ ] **Step 1: Write the failing all-29 assertion**

Update the checker’s expected list to include these IDs before adding records:

```js
const EXPECTED_IDS = [
  'ch01-rational', 'ch02-expression', 'ch03-linear-equation', 'ch04-basic-geometry',
  'ch05-parallel', 'ch06-real', 'ch07-coordinate', 'ch08-system', 'ch09-inequality',
  'ch10-statistics', 'ch11-triangle', 'ch12-congruent', 'ch13-symmetry',
  'ch14-polynomial', 'ch15-fraction', 'ch16-radical', 'ch17-pythagorean',
  'ch18-parallelogram', 'ch19-linear-function', 'ch20-data-analysis',
  'ch21-quadratic-equation', 'ch22-quadratic-function', 'ch23-rotation',
  'ch24-circle', 'ch25-probability', 'ch26-inverse-function', 'ch27-similarity',
  'ch28-trigonometry', 'ch29-projection',
];
```

Run `node scripts/check-math-container-review.js`; expected: FAIL because the record module still contains only the first 10 IDs.

- [ ] **Step 2: Add the 19 exact repository snapshots**

Add records with these titles and section arrays, copied from the current math repository and not inferred from a third-party chapter list:

```js
{
  'ch11-triangle': ['11.1 与三角形有关的线段', '11.2 与三角形有关的角', '11.3 多边形及其内角和'],
  'ch12-congruent': ['12.1 全等三角形', '12.2 三角形全等的判定', '12.3 角的平分线的性质'],
  'ch13-symmetry': ['13.1 轴对称', '13.2 画轴对称图形', '13.3 等腰三角形', '13.4 课题学习 最短路径问题'],
  'ch14-polynomial': ['14.1 整式的乘法', '14.2 乘法公式', '14.3 因式分解'],
  'ch15-fraction': ['15.1 分式', '15.2 分式的运算', '15.3 分式方程'],
  'ch16-radical': ['16.1 二次根式', '16.2 二次根式的乘除', '16.3 二次根式的加减'],
  'ch17-pythagorean': ['17.1 勾股定理', '17.2 勾股定理的逆定理'],
  'ch18-parallelogram': ['18.1 平行四边形', '18.2 特殊的平行四边形'],
  'ch19-linear-function': ['19.1 函数', '19.2 一次函数', '19.3 课题学习 选择方案'],
  'ch20-data-analysis': ['20.1 数据的集中趋势', '20.2 数据的波动程度', '20.3 课题学习 体质健康测试中的数据分析'],
  'ch21-quadratic-equation': ['21.1 一元二次方程', '21.2 解一元二次方程', '21.3 实际问题与一元二次方程'],
  'ch22-quadratic-function': ['22.1 二次函数的图象和性质', '22.2 二次函数与一元二次方程', '22.3 实际问题与二次函数'],
  'ch23-rotation': ['23.1 图形的旋转', '23.2 中心对称', '23.3 课题学习 图案设计'],
  'ch24-circle': ['24.1 圆的有关性质', '24.2 点和圆、直线和圆的位置关系', '24.3 正多边形和圆', '24.4 弧长和扇形面积'],
  'ch25-probability': ['25.1 随机事件与概率', '25.2 用列举法求概率', '25.3 用频率估计概率'],
  'ch26-inverse-function': ['26.1 反比例函数', '26.2 实际问题与反比例函数'],
  'ch27-similarity': ['27.1 图形的相似', '27.2 相似三角形', '27.3 位似'],
  'ch28-trigonometry': ['28.1 锐角三角函数', '28.2 解直角三角形'],
  'ch29-projection': ['29.1 投影', '29.2 三视图', '29.3 课题学习 制作立体模型'],
}
```

Each record uses `reviewBatch: 'v1.9.4'`; `ch19` and `ch20` additionally use `scopeNote: '仅复核稳定容器，不替代新版逐册目录映射'`.

- [ ] **Step 3: Expand the checker for batch and boundary assertions**

Require 29 records, exactly 10 records with `reviewBatch === 'v1.9.3'`, exactly 19 records with `reviewBatch === 'v1.9.4'`, and the special scope note on `ch19`/`ch20`. Keep all source, date, title, section, clone-isolation, official-host and unreviewed-ID checks.

- [ ] **Step 4: Run the focused checker**

Run `node scripts/check-math-container-review.js`; expected: PASS with 29 chapters and 19 v1.9.4 records.

- [ ] **Step 5: Commit the data batch**

```bash
git add packages/math/data/chapter-review-meta.js scripts/check-math-container-review.js
git commit -m "feat(math): review remaining chapter containers"
```

### Task 2: Update the queue contract and current-state documentation

**Files:**
- Modify: `scripts/check-content-review-queue.js`
- Modify: `README.md`
- Modify: `docs/后续开发与发布路线.md`
- Modify: `docs/新版教材目录对照与迁移规则.md`
- Create: `docs/v1.9.4数学章节容器复核实施记录.md`

**Interfaces:**
- The queue becomes 111 items: math 65, English 12, physics 34; no `math:chapter` items remain.
- The v1.9.2 curriculum audit output remains unchanged and continues to report its open volume-map question.

- [ ] **Step 1: Add the failing queue expectation**

Update the queue checker to expect `queued === 111`, `bySubject === { english: 12, math: 65, physics: 34 }`, `byType.math:chapter === 0`, and priority totals `{ 1: 41, 2: 70 }`. Run it before rebuilding and confirm the old generated queue fails the new contract.

- [ ] **Step 2: Rebuild and validate the queue**

Run `node scripts/build-content-audit.js`, `node scripts/build-content-review-queue.js`, and both checkers. Confirm the 19 math chapter keys are absent and the first remaining queue item is `math:topic:g7-topic-basic-geometry`.

- [ ] **Step 3: Record the new current state**

Document the 29/29 reviewed math chapters, 111 remaining queue items, queue SHA-256, package size, and the fact that topics/templates still remain untracked. Add a v1.9.4 route section without rewriting historical v1.9.1/v1.9.3 statistics.

- [ ] **Step 4: Run documentation and release checks**

Run:

```bash
node scripts/check-math-container-review.js
node scripts/check-content-review-queue.js
node scripts/check-math-curriculum-audit.js
node scripts/check-release-readiness.js
git diff --check
```

- [ ] **Step 5: Commit the queue and handoff**

```bash
git add scripts/check-content-review-queue.js README.md docs/后续开发与发布路线.md docs/新版教材目录对照与迁移规则.md docs/v1.9.4数学章节容器复核实施记录.md
git commit -m "docs(v1.9.4): close math chapter container review"
```

### Task 3: Full validation and push

**Files:**
- Modify: `docs/superpowers/plans/2026-08-10-math-review-v1.9.4.md`

- [ ] **Step 1: Run the complete check matrix**

Run every `scripts/check-*.js`, the current developer-tools package-size checker with this worktree’s preview report, `node scripts/prepare-remote-assets.js`, `git diff --check`, and the existing content/audit builders. Expected: no runtime content IDs change and the math package remains below 1MB.

- [ ] **Step 2: Confirm queue determinism**

Run `node scripts/build-content-review-queue.js` twice and compare the generated file SHA-256 values; both must be identical.

- [ ] **Step 3: Review the final scope**

Confirm only the remaining chapter review records, queue expectations, docs and plan changed; no topics, templates, knowledge bodies, figures, storage schemas or release versions changed.

- [ ] **Step 4: Commit the completed plan and push**

```bash
git add docs/superpowers/plans/2026-08-10-math-review-v1.9.4.md
git commit -m "docs(v1.9.4): record math review plan completion"
git push -u origin codex/math-review-v1.9.4
```
