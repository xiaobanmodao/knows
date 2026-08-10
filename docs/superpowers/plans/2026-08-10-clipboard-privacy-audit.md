# 剪贴板隐私接口审计实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** 为知识通建立构建期剪贴板隐私接口审计，确保运行时只在用户主动操作后写入剪贴板，不读取剪贴板内容。

**Architecture:** 新增独立 Node.js 审计器扫描运行时 JavaScript，并用固定调用点清单校验接口边界。审计器不进入小程序主包、不改变页面代码；质量矩阵同时运行真实源码检查和契约测试，隐私说明单独记录平台填写口径。

**Tech Stack:** Node.js CommonJS、Node 内置 \`fs\`/\`path\`/\`assert\`、现有 \`scripts/check-v1.11-quality-matrix.js\`。

## Global Constraints

- 保留当前复制功能和用户交互，不改运行时行为。
- 允许的接口只有用户主动点击后触发的 \`wx.setClipboardData\`。
- 明确禁止 \`wx.getClipboardData\`，不读取、不后台访问、不上传剪贴板内容。
- 当前运行时 \`wx.setClipboardData\` 调用数为 8，全部属于登记文件。
- 不升级本地存储版本，不改变稳定 ID、路由、分包或云资源路径。
- 报告只服务构建审计，不进入小程序主包，不上传任何剪贴板内容。
- 质量矩阵新增隐私接口检查后，默认检查数量从 90 增加到 92。

---

### Task 1: 实现剪贴板接口审计器和失败测试

**Files:**
- Create: \`scripts/check-privacy-interfaces.test.js\`
- Create: \`scripts/check-privacy-interfaces.js\`

**Interfaces:**
- Produces \`scanPrivacyInterfaces(rootDir, options?)\`，返回 \`{ status, clipboard: { readCalls, writeCalls, writesByFile, allowedFiles }, errors }\`。
- Produces \`PRIVACY_INTERFACE_POLICY\`，包含 7 个登记文件和各文件允许的写入次数。
- CLI \`node scripts/check-privacy-interfaces.js\` 扫描当前仓库并在通过时输出一行 \`OK privacy interfaces: Clipboard write-only, 8 writes, 0 reads\`；失败时输出错误并以非零状态退出。

- [ ] **Step 1: 写红灯测试，覆盖真实仓库和三个违规场景**

在 \`scripts/check-privacy-interfaces.test.js\` 中使用 \`fs.mkdtempSync\` 创建临时目录，调用尚不存在的 \`scanPrivacyInterfaces\`。测试必须包含：

\`\`\`js
const report = scanPrivacyInterfaces(repoRoot);
assert.strictEqual(report.status, 'passed');
assert.strictEqual(report.clipboard.readCalls, 0);
assert.strictEqual(report.clipboard.writeCalls, 8);
assert.strictEqual(report.errors.length, 0);
\`\`\`

以及三个临时夹具：

\`\`\`js
assert.ok(scanPrivacyInterfaces(fixtureWith('wx.getClipboardData({});')).errors.includes('clipboard-read-forbidden'));
assert.ok(scanPrivacyInterfaces(fixtureWith('wx.setClipboardData({ data: "x" });'), ['pages/unregistered.js']).errors.includes('clipboard-write-file-not-registered'));
assert.ok(scanPrivacyInterfaces(fixtureWith(''), ['components/content-block/index.js']).errors.includes('registered-file-call-count-mismatch'));
\`\`\`

夹具必须通过 \`options.files\` 指定相对路径，避免测试扫描真实仓库以外的文件。每个测试都要删除临时目录。

- [ ] **Step 2: 运行测试确认按预期失败**

Run: \`node scripts/check-privacy-interfaces.test.js\`

Expected: FAIL，因为 \`scripts/check-privacy-interfaces.js\` 尚不存在；失败原因必须是模块缺失或导出缺失，而不是测试语法错误。

- [ ] **Step 3: 写最小审计器**

在 \`scripts/check-privacy-interfaces.js\` 中实现：

\`\`\`js
const PRIVACY_INTERFACE_POLICY = Object.freeze({
  'components/content-block/index.js': { purpose: '复制单个知识内容块', writes: 1 },
  'pages/profile/index.js': { purpose: '复制备份文本和备案查询地址', writes: 2 },
  'packages/math/pages/knowledge/index.js': { purpose: '复制数学知识核心内容', writes: 1 },
  'packages/english/pages/knowledge/index.js': { purpose: '复制英语知识核心内容', writes: 1 },
  'packages/physics/pages/knowledge/index.js': { purpose: '复制物理知识核心内容', writes: 1 },
  'packages/chemistry/pages/knowledge/index.js': { purpose: '复制化学核心知识', writes: 1 },
  'packages/biology/pages/knowledge/index.js': { purpose: '复制生物核心知识', writes: 1 },
});
\`\`\`

\`scanPrivacyInterfaces(rootDir, { files } = {})\` 在未提供 \`files\` 时读取 \`app.js\`、\`pages\`、\`packages\`、\`components\` 和 \`utils\` 下的 \`.js\` 文件，排除 \`.test.js\`、\`dist\`、\`node_modules\` 和生成的 \`packages/catalog/data\`。对每个文件统计：

- \`wx.getClipboardData\\s*\\(\`：产生 \`clipboard-read-forbidden\`；
- \`wx.setClipboardData\\s*\\(\`：统计到 \`writesByFile\`；
- 未登记文件有写调用：产生 \`clipboard-write-file-not-registered\`；
- 登记文件的实际次数和 \`PRIVACY_INTERFACE_POLICY[file].writes\` 不一致：产生 \`registered-file-call-count-mismatch\`；
- 登记文件在扫描中缺少预期写调用：同样产生 \`registered-file-call-count-mismatch\`。

状态为 \`passed\` 当且仅当错误为空。CLI 使用 \`process.exitCode = 1\`，不抛出未处理异常。

- [ ] **Step 4: 运行测试确认变绿**

Run: \`node scripts/check-privacy-interfaces.test.js\`

Expected: 输出 \`OK privacy interface contract\` 并以状态码 0 结束；同时运行 \`node scripts/check-privacy-interfaces.js\`，输出 8 次写入、0 次读取。

- [ ] **Step 5: 提交独立审计器主题**

\`\`\`bash
git add scripts/check-privacy-interfaces.js scripts/check-privacy-interfaces.test.js
git commit -m "test(privacy): audit clipboard interface usage"
\`\`\`

### Task 2: 接入质量矩阵并同步规格文档

**Files:**
- Modify: \`scripts/check-v1.11-quality-matrix.js\`
- Modify: \`scripts/check-v1.11-quality-matrix.test.js\`
- Modify: \`docs/v1.11后续开发路线.md\`
- Modify: \`docs/superpowers/specs/2026-08-10-clipboard-privacy-audit-design.md\`

**Interfaces:**
- Quality matrix runs both \`scripts/check-privacy-interfaces.test.js\` and \`scripts/check-privacy-interfaces.js\`.
- Matrix contract continues to require every \`scripts/*.test.js\` to be registered.

- [ ] **Step 1: 先增加矩阵契约断言**

在 \`scripts/check-v1.11-quality-matrix.test.js\` 增加：

\`\`\`js
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-privacy-interfaces.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-privacy-interfaces.js'));
\`\`\`

Run: \`node scripts/check-v1.11-quality-matrix.test.js\`

Expected: FAIL，直到两个检查项加入 \`DEFAULT_CHECKS\`。

- [ ] **Step 2: 在默认检查序列加入两个检查项**

在纯知识运行层检查之后加入：

\`\`\`js
{ script: 'scripts/check-privacy-interfaces.test.js', label: '隐私接口契约' },
{ script: 'scripts/check-privacy-interfaces.js', label: '隐私接口审计' },
\`\`\`

不改变严格发布检查的逻辑，只让默认矩阵从 90 项变为 92 项。

- [ ] **Step 3: 更新路线文档的检查数量和隐私设计状态**

将 \`docs/v1.11后续开发路线.md\` 中的 \`90 项\` 和 \`90/90\` 更新为 \`92 项\` 和 \`92/92\`，并在质量矩阵描述中加入“隐私接口审计”。将设计文档状态从“准备按 TDD 实现”改为“已实现并接入 v1.11 质量矩阵”。

- [ ] **Step 4: 运行矩阵契约和隐私审计**

Run:

\`\`\`bash
node scripts/check-v1.11-quality-matrix.test.js
node scripts/check-privacy-interfaces.test.js
node scripts/check-privacy-interfaces.js
\`\`\`

Expected: 三个命令均以状态码 0 结束，隐私审计显示 8 次写入、0 次读取。

- [ ] **Step 5: 提交矩阵接入主题**

\`\`\`bash
git add scripts/check-v1.11-quality-matrix.js scripts/check-v1.11-quality-matrix.test.js docs/v1.11后续开发路线.md docs/superpowers/specs/2026-08-10-clipboard-privacy-audit-design.md
git commit -m "build(quality): enforce clipboard privacy audit"
\`\`\`

### Task 3: 全量回归和推送

**Files:**
- Verify only: \`scripts/check-v1.11-quality-matrix.js\`
- Verify only: \`docs/v1.11开发者工具规格核对记录.md\`

- [ ] **Step 1: 运行全量质量矩阵**

Run: \`node scripts/check-v1.11-quality-matrix.js\`

Expected: \`OK v1.11 quality matrix: 92 checks\`；第 51 项仍可报告内容源外部资料 \`blocked\`，这不是隐私审计失败。

- [ ] **Step 2: 运行代码格式和工作树检查**

\`\`\`bash
git diff --check
git status --short --branch
\`\`\`

Expected: \`git diff --check\` 无输出，路线分支只有已提交内容且与 origin 同步前等待推送。

- [ ] **Step 3: 推送当前路线分支**

\`\`\`bash
git push origin codex/roadmap-v1.11
\`\`\`

Expected: 远程分支更新成功，推送后 \`git status --short --branch\` 显示工作树干净。

## 完成检查

- [ ] \`wx.getClipboardData\` 为 0；
- [ ] \`wx.setClipboardData\` 为 8 且全部在登记文件；
- [ ] 隐私说明没有声称读取、保存或上传剪贴板内容；
- [ ] 质量矩阵为 \`92/92\`，外部发布阻塞仍单独保留；
- [ ] 设计文档、实现提交和路线文档均已推送。
