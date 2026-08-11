# v1.14 内容线与发布基线集成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在隔离分支中把截至 `7339c30` 的 v1.13 内容质量线合并到 `4377e97` 的 v1.10.1 发布回归基线，同时保留发布热修复、把默认质量矩阵扩展为 125 项，并且不执行任何发布动作。

**Architecture:** 分支从 `codex/release-regression-v1.10.1` 出发，先将“热修复文件范围”从通用产品检查切换为显式模式，再以一个保留双亲历史的 merge commit 引入 v1.13。冲突只在发布检查和搜索语义脚本处理；矩阵与实时路线文档在 merge commit 之后的独立提交中完成，实际模拟器验证记录再使用独立文档提交，避免修改冻结发布分支。

**Tech Stack:** 微信小程序 JavaScript、Node.js 内置 `assert`/`fs`/`child_process`、Git 三方合并、现有 Developer Tools 项目。

## Global Constraints

- 工作树固定为 `/Users/hht/Desktop/knows/.worktrees/content-release-integration-v1.14`，分支固定为 `codex/content-release-integration-v1.14`。
- 合并源固定为 `codex/chemistry-visual-guides-v1.13` 的 `7339c30`；发布基线固定为 `codex/release-regression-v1.10.1` 的 `4377e97`。
- 不修改、重置、合并或推送 `codex/release-regression-v1.10.1`、`codex/chemistry-visual-guides-v1.13` 或任何热修复分支。
- 不执行体验版预览、上传、审核、正式发布、二维码真机调试或版本/备案/AppID 改动。
- 继续禁止 `traceUser: true`、openId 用户追踪、测评任务、学完自测、打卡、错题本、登录和云同步。
- `dist/`、`.codex-output/`、设备日志、截图和开发者工具格式化噪声不得提交。
- 内容来源跟进的 `blocked: math-chapters-v1.11` 是准确状态，不能通过修改文案、伪造来源或删除门禁来清除。

---

### Task 1: 将热修复范围门禁改为显式模式

**Files:**
- Modify: `scripts/check-release-hotfix-scope.js`
- Modify: `scripts/check-release-hotfix-scope.test.js`
- Modify: `scripts/check-release-readiness.js`

**Interfaces:**
- Produces: `shouldRequireHotfixScope(args = process.argv.slice(2)): boolean`。
- Consumes: `scripts/check-release-readiness.js` 的 CLI 参数。
- Preserves: `validateReleaseHotfixScope(changedFiles)`、`ALLOWED_HOTFIX_FILES`、`--base` 和 `RELEASE_HOTFIX_BASE` 的现有热修复行为。

- [x] **Step 1: 为显式模式写入失败断言**

在 `scripts/check-release-hotfix-scope.test.js` 的导入中加入 `shouldRequireHotfixScope`，并在现有 allowlist fixture 之前写入：

```js
assert.strictEqual(shouldRequireHotfixScope([]), false);
assert.strictEqual(shouldRequireHotfixScope(['--require-device-evidence']), false);
assert.strictEqual(shouldRequireHotfixScope(['--require-hotfix-scope']), true);
assert.strictEqual(
  shouldRequireHotfixScope(['--require-device-evidence', '--require-hotfix-scope']),
  true,
);
```

同时读取 `scripts/check-release-readiness.js`，断言 `checkReleaseHotfixScopeTooling` 含有 `shouldRequireHotfixScope(process.argv.slice(2))`，且该函数在 false 时直接返回。

- [x] **Step 2: 运行失败测试**

Run: `node scripts/check-release-hotfix-scope.test.js`

Expected: 失败并指出 `shouldRequireHotfixScope is not a function` 或缺少显式模式源码标记；不得因为 allowlist fixture 变化失败。

- [x] **Step 3: 实现唯一的选项解析函数和运行时门控**

在 `scripts/check-release-hotfix-scope.js` 的 `readBaseRef` 之前添加并导出：

```js
function shouldRequireHotfixScope(args = process.argv.slice(2)) {
  return args.includes('--require-hotfix-scope');
}
```

在 `scripts/check-release-readiness.js` 顶部增加：

```js
const { shouldRequireHotfixScope } = require('./check-release-hotfix-scope');
```

并把 `checkReleaseHotfixScopeTooling()` 的第一段固定为：

```js
function checkReleaseHotfixScopeTooling() {
  if (!shouldRequireHotfixScope(process.argv.slice(2))) {
    return;
  }

  const scripts = [
    'scripts/check-release-hotfix-scope.test.js',
    'scripts/check-release-hotfix-scope.js',
  ];
  // 保留现有 assertFile、execFileSync 和 issues 收集逻辑。
}
```

不要把 `--require-device-evidence` 当成热修复模式，不要更改 allowlist，也不要删除独立热修复检查脚本。

- [x] **Step 4: 验证默认与显式分支行为**

Run:

```bash
node scripts/check-release-hotfix-scope.test.js
node scripts/check-release-readiness.js
node scripts/check-release-hotfix-scope.js --base HEAD
```

Expected: 三条均通过；第一个契约测试证明显式参数会启用范围门禁，默认发布检查不执行范围白名单，最后一条直接检查脚本在零差异范围内保持可用。当前集成分支已经含有规格与计划文件，不在此分支执行 `check-release-readiness.js --require-hotfix-scope` 并期待通过；该严格命令只在独立热修复分支运行。

- [x] **Step 5: 提交热修复模式边界**

```bash
git add scripts/check-release-hotfix-scope.js scripts/check-release-hotfix-scope.test.js scripts/check-release-readiness.js
git commit -m "fix(release): scope hotfix validation explicitly"
```

### Task 2: 三方合并 v1.13 并用失败断言约束冲突解决

**Files:**
- Modify by merge: 全部 v1.13 内容、来源、图解、路由、资源、检查和文档文件。
- Resolve: `scripts/check-release-readiness.js`
- Resolve: `scripts/check-search-semantics.js`
- Modify: `scripts/check-v1.11-quality-matrix.test.js`

**Interfaces:**
- Consumes: `codex/chemistry-visual-guides-v1.13`、Task 1 的 `shouldRequireHotfixScope()` 和 v1.10.1 发布热修复脚本。
- Produces: 第二父提交为 `7339c30` 的 Git merge commit；所有 v1.13 模块可由当前工作树加载。
- Preserves: `checkCloudPrivacyTooling()`、`checkPureKnowledgeRuntimeTooling()`、`checkReleasePackageEvidenceTooling()`、`checkReleaseToolStateEvidence()`、catalog 分包别名路径。

- [x] **Step 1: 启动无提交三方合并并确认冲突范围**

Run:

```bash
git merge --no-commit --no-ff codex/chemistry-visual-guides-v1.13
git diff --name-only --diff-filter=U
```

Expected: `scripts/check-release-readiness.js` 和 `scripts/check-search-semantics.js` 是冲突文件。若出现其他冲突，运行 `git merge --abort`，记录新冲突文件与三方基线，不进行猜测式解决。

- [x] **Step 2: 先写联合发布检查的失败断言**

在合并状态中把 `scripts/check-v1.11-quality-matrix.test.js` 加入以下源文件断言；先保留 `check-release-readiness.js` 的发布侧版本，因此该测试必须失败：

```js
const readinessSource = fs.readFileSync(
  path.resolve(__dirname, 'check-release-readiness.js'),
  'utf8',
);
[
  'checkCloudPrivacyTooling();',
  'checkPureKnowledgeRuntimeTooling();',
  'checkEnglishCurriculumMapTooling();',
  'checkReleaseToolStateEvidence();',
  'content-source-catalog.js',
].forEach((marker) => {
  assert.ok(readinessSource.includes(marker), `集成发布检查缺少 ${marker}`);
});
assert.ok(
  /function checkReleaseHotfixScopeTooling\(\)\s*\{[\s\S]*shouldRequireHotfixScope\(process\.argv\.slice\(2\)\)/.test(readinessSource),
  '发布检查必须只在显式参数下执行热修复范围门禁',
);
```

Run: `node scripts/check-v1.11-quality-matrix.test.js`

Expected: 失败并明确指出缺少内容线的 `checkEnglishCurriculumMapTooling()`、`checkReleaseToolStateEvidence()` 或 `content-source-catalog.js` 标记，而不是因未解决冲突标记导致语法错误。

- [x] **Step 3: 解决 `check-release-readiness.js` 冲突并保留双方门禁**

以内容线的 `resolveRepoPath()`、结构化内容源目录、数学 `math-volume-map.test.js`、英语目录和工具状态逻辑为基础，同时保留发布侧的以下内容：

```js
const {
  describePreviewStatus,
  getPreviewStatusPath,
  readPreviewStatus,
} = require('./check-release-package-evidence');
const { validateReleaseToolStateEvidence } = require('./release-tool-state-evidence');
const { shouldRequireHotfixScope } = require('./check-release-hotfix-scope');
```

最终调用顺序必须包含：

```js
checkCloudFunction();
checkCloudPrivacyTooling();
checkReleaseHotfixScopeTooling();
checkContentAuditTooling();
checkPureKnowledgeRuntimeTooling();
checkContentReviewQueueTooling();
checkMathCurriculumAuditTooling();
checkEnglishCurriculumMapTooling();
// 保留其后的数学、英语、物理复核、发布证据、包体、工具状态和资源检查。
```

`checkReleaseHotfixScopeTooling()` 必须使用 Task 1 的早退；`checkReleasePackageEvidenceTooling()` 必须保留预览状态文件的 `describePreviewStatus` 检查；`checkReleaseToolStateEvidence()` 必须仅在 `--require-device-evidence` 时读取报告。

对可能被内容线删除的下列文件运行 `git diff --cached --diff-filter=D -- <file>`；若任何一个显示删除，使用 `git checkout HEAD -- <file>` 恢复发布侧版本并重新 stage：

```text
scripts/check-cloud-user-trace.js
scripts/check-cloud-user-trace.test.js
scripts/check-pure-knowledge-runtime.js
scripts/check-pure-knowledge-runtime.test.js
scripts/check-release-hotfix-scope.js
scripts/check-release-hotfix-scope.test.js
```

- [x] **Step 4: 解决搜索语义冲突**

`scripts/check-search-semantics.js` 的最终开头固定为：

```js
const assert = require('assert');
const { SEARCH_ALIAS_GROUPS } = require('../packages/catalog/data/search-aliases');
```

保留内容线末尾的四条断言：

```js
const oldQuestionTitle = searchAllSubjects('Same or Different?', 'english')[0];
assert.strictEqual(oldQuestionTitle.refId, 'eng-unit-g8a-same-or-different');
assert.strictEqual(oldQuestionTitle.title, 'Unit 3 Same or Different');
const oldSingularTitle = searchAllSubjects('The Wonder of Nature', 'english')[0];
assert.strictEqual(oldSingularTitle.refId, 'eng-unit-g8b-wonder-of-nature');
assert.strictEqual(oldSingularTitle.title, 'Unit 4 The Wonders of Nature');
```

不得恢复 `../data/search-aliases`，不得丢弃任何原有公式、化学或英语词形搜索检查。

- [x] **Step 5: 运行冲突解决的最小回归**

Run:

```bash
git diff --name-only --diff-filter=U
node scripts/check-release-hotfix-scope.test.js
node scripts/check-search-semantics.js
node scripts/check-v1.11-quality-matrix.test.js
node scripts/check-release-readiness.js
```

Expected: 未解决冲突列表为空；热修复范围、搜索语义和默认发布检查通过；矩阵契约此时只能因为 Task 3 尚未注册的 `check-cloud-user-trace.test.js` 与 `check-release-hotfix-scope.test.js` 而失败，不能有其他失败。默认发布检查不再把内容集成视为热修复范围违规，不运行完整矩阵。

- [x] **Step 6: 创建内容线 merge commit**

Run:

```bash
git diff --check
git status --short
git add -A
git reset -- dist .codex-output project.private.config.json
git commit -m "merge: integrate v1.13 content quality stack"
git log --oneline --parents -1
```

Expected: 提交具有两个父提交，第二父提交为 `7339c30`。若 `git reset --` 报路径未匹配，先确认这些生成目录未被暂存，再继续；不得创建空占位文件。

### Task 3: 把发布隐私检查纳入默认矩阵并同步实时路线

**Files:**
- Modify: `scripts/check-v1.11-quality-matrix.js`
- Modify: `scripts/check-v1.11-quality-matrix.test.js`
- Modify: `scripts/check-roadmap-document-consistency.test.js`
- Modify: `docs/v1.11后续开发路线.md`
- Modify: `docs/后续开发与发布路线.md`

**Interfaces:**
- Consumes: 合并后恢复的 `scripts/check-cloud-user-trace.test.js` 与 `scripts/check-cloud-user-trace.js`。
- Produces: 默认质量矩阵 125 项；热修复范围测试明确不属于默认内容矩阵。
- Preserves: 历史 v1.13 验证记录中的 `123 checks` 文案，不做全局数字替换。

- [x] **Step 1: 扩展矩阵契约的失败断言**

在 `scripts/check-v1.11-quality-matrix.test.js` 增加：

```js
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-cloud-user-trace.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-cloud-user-trace.js'));
assert.strictEqual(defaultCommands.length, 125, '默认质量矩阵必须保持 125 项');

const nonDefaultTestScripts = new Set([
  'scripts/check-release-hotfix-scope.test.js',
]);
assert.deepStrictEqual(
  testScripts.filter((script) => !matrixScripts.has(script) && !nonDefaultTestScripts.has(script)),
  [],
  '除显式热修复模式测试外，scripts 目录中的契约测试必须全部纳入默认质量矩阵',
);
```

替换原来的“所有测试脚本”断言，不要保留两份冲突的 coverage 断言。

- [x] **Step 2: 运行矩阵契约确认失败**

Run: `node scripts/check-v1.11-quality-matrix.test.js`

Expected: 失败并指出云用户追踪脚本尚未加入默认矩阵或总数仍为 123。

- [x] **Step 3: 把两项隐私检查加入默认矩阵**

在 `DEFAULT_CHECKS` 中、`check-privacy-interfaces` 之前插入：

```js
{ script: 'scripts/check-cloud-user-trace.test.js', label: '云开发用户追踪契约' },
{ script: 'scripts/check-cloud-user-trace.js', label: '云开发用户追踪隐私审计' },
```

不要把 `scripts/check-release-hotfix-scope.test.js` 加入 `DEFAULT_CHECKS`，它由 `--require-hotfix-scope` 运行。更新矩阵契约中的全部 123 计数为 125，仅限当前实时矩阵断言。

- [x] **Step 4: 同步路线数量与检查名称**

在 `scripts/check-roadmap-document-consistency.test.js` 中把绑定数量更新为 `125`，要求两个路线文档同时出现：

```text
云开发用户追踪契约
云开发用户追踪隐私审计
```

在 `docs/v1.11后续开发路线.md` 与 `docs/后续开发与发布路线.md` 的“当前/默认质量矩阵”段落把实时计数从 123 改为 125，并加入上述两项名称。不得修改历史实施记录和 v1.13 的验证结果。

- [x] **Step 5: 验证 125 项契约与文档一致性**

Run:

```bash
node scripts/check-v1.11-quality-matrix.test.js
node scripts/check-roadmap-document-consistency.test.js
node scripts/check-cloud-user-trace.test.js
node scripts/check-cloud-user-trace.js
```

Expected: 全部通过；矩阵契约明确要求 125 项，路线文档和可执行命令数量一致。

- [x] **Step 6: 提交质量矩阵和路线同步**

```bash
git add scripts/check-v1.11-quality-matrix.js scripts/check-v1.11-quality-matrix.test.js scripts/check-roadmap-document-consistency.test.js docs/v1.11后续开发路线.md docs/后续开发与发布路线.md
git commit -m "test(quality): restore release privacy gates"
```

### Task 4: 执行全量静态校验并审计集成历史

**Files:**
- Inspect: Task 2 的 merge commit、Task 3 的质量矩阵提交和当前可再生产物。
- Do not stage: `dist/`、`.codex-output/`、`project.private.config.json`、设备日志、截图或开发者工具单纯字段重排。

**Interfaces:**
- Consumes: 合并后的五学科内容、所有检查工具、125 项质量矩阵。
- Produces: 当前集成树的静态验证证据；不新增业务代码提交。
- Preserves: `codex/release-regression-v1.10.1` 的工作树和引用不变。

- [x] **Step 1: 串行生成依赖审计产物**

Run in this exact order:

```bash
node scripts/build-content-audit.js
node scripts/check-content-audit.js
node scripts/build-content-review-queue.js
node scripts/check-content-review-queue.js
node scripts/build-content-source-catalog.js
node scripts/check-content-source-catalog.js
```

Expected: 当前集成树的审计、复核队列和来源目录均从源码重新生成；不要并行这些命令。

- [x] **Step 2: 运行发布与内容专项门禁**

Run:

```bash
node scripts/check-cloud-user-trace.test.js
node scripts/check-cloud-user-trace.js
node scripts/check-pure-knowledge-runtime.test.js
node scripts/check-pure-knowledge-runtime.js
node scripts/check-package-boundaries.js
node scripts/check-release-readiness.js
node scripts/check-v1.11-quality-matrix.js
git diff --check
```

Expected: 默认矩阵最后输出 `OK v1.11 quality matrix: 125 checks`；内容来源跟进仍可报告 `blocked: math-chapters-v1.11`；不运行 `--require-device-evidence`，也不把默认检查解释成正式发布通过。

- [x] **Step 3: 审核集成历史与工作树范围**

Run:

```bash
git status --short
git diff --check
git status --short
git log --format='%H %P %s' --first-parent --grep='^merge: integrate v1.13 content quality stack$' -1
git diff --name-only codex/release-regression-v1.10.1...HEAD
```

Expected: 精确主题查询返回一个 merge 记录，且其第二父提交为 `7339c30`；最近历史仍包含 `test(quality): restore release privacy gates`。`git status --short` 只允许显示被忽略的可再生产物，不能有暂存的生成文件、设备日志或开发者工具格式化噪声。

### Task 5: 模拟器回归、记录证据并推送集成分支

**Files:**
- Modify: `docs/superpowers/plans/2026-08-11-content-release-integration-v1.14.md`
- Optionally modify: `docs/superpowers/specs/2026-08-11-content-release-integration-v1.14-design.md` only to correct an actually observed boundary.

**Interfaces:**
- Consumes: 完整 merge commit、当前绑定 AppID 的微信开发者工具项目实例。
- Produces: 实际模拟器记录、已推送的 `codex/content-release-integration-v1.14`。
- Preserves: 未执行实体设备、体验版、上传、审核和发布的事实。

- [ ] **Step 1: 在微信开发者工具执行模拟器回归**

从绑定 `wxb10a8a067e2709e9` 的项目实例打开本工作树，分别使用 iPhone 14 Pro Max 与 Nexus 5 模拟器。两台都验证：

1. 首页进入五个学科，确认首屏无空白与入口错误。
2. 搜索 `Same or Different?` 与 `The Wonder of Nature`，确认均进入对应英语单元。
3. 搜索 `质量守恒定律`，确认化学知识入口可打开；进入 `chem-k-oxygen-preparation` 和 `chem-k-resources-environment`，确认流程与持续关系图解可读。
4. 进入生物代表知识点，确认公共图解组件仍显示；收藏后从收藏页重新打开一次。
5. 断开或让一个云图地址加载失败，确认仍显示完整文字降级，不出现空白内容区。
6. 记录控制台项目错误；若通过“已有项目直接打开”遗漏 AppID 并出现 `appid missing`，关闭该实例，从绑定 AppID 的项目入口重开，不把它作为项目错误结论。

不扫描真机调试二维码、不上传、不生成体验版。

- [ ] **Step 2: 写入真实验证记录**

在本计划末尾增加 `## Verification Record`，记录实际命令末行、两个模拟器、访问页面、控制台结果、云图降级结果与未执行动作。只写已发生的事实；若某台模拟器未完成，明确写为未完成并保留该项，不用推断补齐。

- [ ] **Step 3: 提交验证文档并推送**

Run:

```bash
git diff --check
git status --short
git log --oneline --parents -3
```

提交实际记录：

```bash
git add docs/superpowers/plans/2026-08-11-content-release-integration-v1.14.md docs/superpowers/specs/2026-08-11-content-release-integration-v1.14-design.md
git commit -m "docs(integration): record v1.14 regression"
git push -u origin codex/content-release-integration-v1.14
```

Expected: 远端仅新增集成分支；不创建 PR、标签、RC、体验版或审核请求。

## Verification Record

在 Task 5 完成后写入实际静态检查、模拟器和推送结果。实体机、弱网、预览、上传、审核和正式发布若未执行，必须保留为未执行状态。
