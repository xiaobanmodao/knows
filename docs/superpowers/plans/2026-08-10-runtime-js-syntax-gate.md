# 运行时 JavaScript 语法门禁 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在默认 v1.11 质量矩阵中验证所有实际小程序运行时 JavaScript 文件的 Node 语法可解析性。

**Architecture:** 新检查器只枚举 `app.js` 和运行时根目录，逐文件调用当前 Node 的 `--check`，不加载或执行小程序模块。测试使用真实解析器和临时目录夹具验证成功、失败和排除边界；质量矩阵和路线文档通过既有长度派生契约同步数量。

**Tech Stack:** Node.js CommonJS、Node `child_process.spawnSync`、Node `assert`、现有 v1.11 质量矩阵。

## Global Constraints

- 仅扫描 `app.js`、`pages/`、`components/`、`utils/`、`data/` 与 `packages/` 中的 `.js` 文件。
- 跳过 `*.test.js`，不扫描 `scripts/`、`docs/`、`dist/`、`cloudfunctions/` 或 `.codex-output/`。
- 不新增 npm 依赖，不执行页面代码，不修改稳定 ID、存储、内容、分包路径或发布版本。
- 新增检查必须进入默认矩阵；两份当前路线文档的计数必须与 `getCheckCommands(false).length` 一致。

---

### Task 1: 建立语法检查器的失败契约

**Files:**
- Create: `scripts/check-runtime-js-syntax.test.js`
- Create later: `scripts/check-runtime-js-syntax.js`

**Interfaces:**
- Consumes: Node `--check` 和临时目录中的运行时文件。
- Produces: 测试期望 `getRuntimeJavaScriptFiles(rootDir)` 返回排序后的相对路径；`checkRuntimeJavaScriptSyntax(rootDir)` 返回 `{ status, files, failures }`。

- [x] **Step 1: Write the failing test**

```js
const { getRuntimeJavaScriptFiles, checkRuntimeJavaScriptSyntax } = require('./check-runtime-js-syntax');

const files = getRuntimeJavaScriptFiles(fixtureRoot);
assert.deepStrictEqual(files, ['app.js', 'packages/math/pages/index.js']);

const report = checkRuntimeJavaScriptSyntax(fixtureRoot);
assert.strictEqual(report.status, 'failed');
assert.deepStrictEqual(report.failures.map((item) => item.file), ['packages/math/pages/index.js']);
```

夹具还创建 `scripts/broken.js`、`dist/broken.js` 与 `pages/ignored.test.js`，它们不能出现在 `files` 中。

- [x] **Step 2: Run test to verify it fails**

Run: `node scripts/check-runtime-js-syntax.test.js`

Expected: FAIL with `Cannot find module './check-runtime-js-syntax'`.

- [x] **Step 3: Commit test-only change**

```bash
git add scripts/check-runtime-js-syntax.test.js
git commit -m "test(build): define runtime syntax gate"
```

### Task 2: 实现运行时语法检查器

**Files:**
- Create: `scripts/check-runtime-js-syntax.js`
- Modify: `scripts/check-runtime-js-syntax.test.js`

**Interfaces:**
- Consumes: 运行时根目录和当前 Node 可执行文件。
- Produces: `getRuntimeJavaScriptFiles(rootDir)` 与 `checkRuntimeJavaScriptSyntax(rootDir)`；CLI 成功时打印检查数量，失败时按相对路径列出错误并退出非零。

- [x] **Step 1: Write minimal implementation**

```js
const result = spawnSync(process.execPath, ['--check', absolutePath], { encoding: 'utf8' });
if (result.status !== 0 || result.error) {
  failures.push({ file: relativePath, output: `${result.stdout || ''}${result.stderr || ''}`.trim() });
}
```

递归枚举固定运行时根目录，路径以 `/` 分隔并排序；不存在的可选目录返回空列表。

- [x] **Step 2: Run test to verify it passes**

Run: `node scripts/check-runtime-js-syntax.test.js`

Expected: PASS with `OK runtime JavaScript syntax contract`.

- [x] **Step 3: Run current-project check**

Run: `node scripts/check-runtime-js-syntax.js`

Expected: PASS with a positive runtime file count and no failed relative path.

- [x] **Step 4: Commit implementation**

```bash
git add scripts/check-runtime-js-syntax.js scripts/check-runtime-js-syntax.test.js
git commit -m "test(build): check runtime JavaScript syntax"
```

### Task 3: 接入矩阵并同步路线文档

**Files:**
- Modify: `scripts/check-v1.11-quality-matrix.js`
- Modify: `scripts/check-v1.11-quality-matrix.test.js`
- Modify: `docs/v1.11后续开发路线.md`
- Modify: `docs/后续开发与发布路线.md`

**Interfaces:**
- Consumes: `scripts/check-runtime-js-syntax.js`。
- Produces: 默认矩阵多出“运行时 JavaScript 语法契约”和“运行时 JavaScript 语法”两项检查；两份当前路线文档显示 `115`。

- [x] **Step 1: Write the failing matrix contract**

```js
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-runtime-js-syntax.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-runtime-js-syntax.js'));
```

- [x] **Step 2: Run test to verify it fails**

Run: `node scripts/check-v1.11-quality-matrix.test.js`

Expected: FAIL because the new commands are absent from `DEFAULT_CHECKS`.

- [x] **Step 3: Add the two matrix entries and update derived count prose**

Place the contract and runtime check after `运行时分包依赖`; replace the two current-route count values with `115`.

- [x] **Step 4: Run focused verification**

Run: `node scripts/check-v1.11-quality-matrix.test.js && node scripts/check-roadmap-document-consistency.test.js && node scripts/check-runtime-js-syntax.js`

Expected: all commands pass and both documents match the 115-command matrix.

- [x] **Step 5: Run full verification and commit**

Run: `node scripts/check-v1.11-quality-matrix.js`

Expected: `OK v1.11 quality matrix: 115 checks`.

```bash
git add scripts/check-v1.11-quality-matrix.js scripts/check-v1.11-quality-matrix.test.js docs/v1.11后续开发路线.md docs/后续开发与发布路线.md
git commit -m "test(build): enforce runtime syntax in quality matrix"
```
