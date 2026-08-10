# 本地备份文件隐私接口审计实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扩展现有隐私接口审计，登记本地备份文件的用户主动选择和转发接口，不改变备份运行时行为。

**Architecture:** 继续使用 scripts/check-privacy-interfaces.js 单一审计入口，在现有 Clipboard 报告旁新增 file 报告。策略按 API 登记用途、文件和预期次数；契约测试覆盖真实工作树和临时违规夹具。质量矩阵不新增检查项，数量保持 92。

**Tech Stack:** Node.js CommonJS、Node 内置 fs/path/assert、现有 v1.11 质量矩阵。

## Global Constraints

- 保留当前备份功能和用户交互，不改运行时行为。
- wx.chooseMessageFile 只能由用户主动选择备份文件触发，wx.shareFileMessage 只能由用户主动发起备份转发触发。
- 不后台选择文件、不读取未选择的文件、不自动上传、不向用户未选择的对象发送文件。
- 文件接口只登记 utils/local-backup-file.js，chooseMessageFile 和 shareFileMessage 各 1 次。
- Clipboard 原有 8 次写入、0 次读取检查保持通过。
- 不升级本地存储版本，不改变稳定 ID、路由、分包、备份格式或云资源路径。
- v1.11 质量矩阵默认检查数量保持 92，只扩展现有隐私审计的覆盖范围。

---

### Task 1: 扩展隐私审计策略和 TDD 契约

**Files:**
- Modify: scripts/check-privacy-interfaces.test.js
- Modify: scripts/check-privacy-interfaces.js

**Interfaces:**
- Produces FILE_INTERFACE_POLICY，登记 wx.chooseMessageFile 和 wx.shareFileMessage 的用途、文件和预期次数。
- Extends scanPrivacyInterfaces(rootDir, options?) with report.file = { calls, callsByApi, callsByFile, allowedFiles }。
- Existing report.clipboard shape and error codes remain compatible。

- [ ] **Step 1: 写新增文件接口红灯测试**

在现有契约测试中增加真实仓库断言：

    assert.strictEqual(report.file.calls, 2);
    assert.deepStrictEqual(report.file.callsByApi, {
      'wx.chooseMessageFile': 1,
      'wx.shareFileMessage': 1,
    });
    assert.deepStrictEqual(report.file.callsByFile, {
      'utils/local-backup-file.js': 2,
    });
    assert.deepStrictEqual(report.file.allowedFiles, ['utils/local-backup-file.js']);

增加三个临时夹具：

    assert.ok(scanPrivacyInterfaces(fixtureRoot, { files: ['pages/unregistered.js'] })
      .errors.includes('file-api-file-not-registered'));
    assert.ok(scanPrivacyInterfaces(fixtureRoot, { files: ['utils/local-backup-file.js'] })
      .errors.includes('file-api-call-count-mismatch'));
    assert.ok(scanPrivacyInterfaces(fixtureRootWithSaveFile, { files: ['pages/unregistered.js'] })
      .errors.includes('file-api-not-registered'));

夹具分别写入 wx.chooseMessageFile({});、空的 utils/local-backup-file.js 和未登记的 wx.saveFile({});。临时目录在 finally 中删除。

- [ ] **Step 2: 运行测试确认新增断言失败**

Run: node scripts/check-privacy-interfaces.test.js

Expected: FAIL 在 report.file 不存在或文件接口断言处；既有 Clipboard 断言不得先失败。

- [ ] **Step 3: 写最小文件接口策略和扫描逻辑**

在 scripts/check-privacy-interfaces.js 增加：

    const FILE_INTERFACE_POLICY = Object.freeze({
      'wx.chooseMessageFile': {
        file: 'utils/local-backup-file.js',
        purpose: '用户主动选择备份文件并在本机恢复',
        calls: 1,
      },
      'wx.shareFileMessage': {
        file: 'utils/local-backup-file.js',
        purpose: '用户主动转发本地备份文件',
        calls: 1,
      },
    });

同时定义已知文件接口模式：

    const FILE_INTERFACE_PATTERNS = Object.freeze([
      'wx.chooseMessageFile',
      'wx.shareFileMessage',
      'wx.saveFile',
      'wx.openDocument',
    ]);

扫描每个运行时文件时，对每个已知模式统计调用次数。策略 API 出现在错误文件时加入 file-api-file-not-registered；次数变化或缺失时加入 file-api-call-count-mismatch；未登记的已知模式只要出现就加入 file-api-not-registered。报告按 API 名称排序，calls 是所有文件接口调用总数，状态仍只由 errors.length === 0 决定。Clipboard 的 CLI 输出和错误码保持不变；通过时在同一行追加 2 file interface calls。

- [ ] **Step 4: 运行新增契约确认变绿**

Run: node scripts/check-privacy-interfaces.test.js && node scripts/check-privacy-interfaces.js

Expected: 契约输出通过；CLI 显示 Clipboard 8 writes/0 reads 和 2 file interface calls。

- [ ] **Step 5: 提交文件接口审计主题**

    git add scripts/check-privacy-interfaces.js scripts/check-privacy-interfaces.test.js
    git commit -m 'test(privacy): audit backup file interfaces'

### Task 2: 更新隐私说明和发布核对记录

**Files:**
- Modify: docs/superpowers/specs/2026-08-10-file-privacy-audit-design.md
- Modify: docs/v1.11开发者工具规格核对记录.md
- Modify: docs/v1.11后续开发路线.md

**Interfaces:**
- Documentation records the exact user-triggered file behavior and does not claim automatic upload.
- Route status continues to treat AppID and external catalog blockers independently from privacy audit.

- [ ] **Step 1: 更新设计状态和平台填写口径**

将设计文档状态改为“已实现并接入 v1.11 隐私审计”，保留以下口径：

    用于在用户主动选择知识通备份文件后，在本机读取并校验该文件以恢复收藏、笔记和阅读记录；以及在用户主动选择导出备份并确认转发后，通过微信文件转发功能发送用户选择的本地备份文件。应用不会在后台选择或读取文件，不会自动上传文件，也不会向用户未选择的对象发送文件。

- [ ] **Step 2: 更新双工作树证据**

在 docs/v1.11开发者工具规格核对记录.md 的隐私接口表新增 chooseMessageFile 和 shareFileMessage 两行，分别记录路线工作树和冻结发布工作树均为 1 次，错误为 0，并说明静态审计不替代微信平台检测。

- [ ] **Step 3: 更新路线质量描述**

在 docs/v1.11后续开发路线.md 的质量矩阵描述中，将“剪贴板只写入、零读取和固定调用点审计”改为“剪贴板和本地备份文件接口审计”，保持 92/92。

- [ ] **Step 4: 运行文档和静态检查**

    git diff --check
    node scripts/check-privacy-interfaces.test.js
    node scripts/check-privacy-interfaces.js

Expected: 全部状态码为 0，审计报告为 Clipboard 8 writes/0 reads、文件接口 2 calls。

- [ ] **Step 5: 提交文档主题**

    git add docs/superpowers/specs/2026-08-10-file-privacy-audit-design.md docs/v1.11开发者工具规格核对记录.md docs/v1.11后续开发路线.md
    git commit -m 'docs(privacy): document backup file interfaces'

### Task 3: 双工作树回归、全量门禁和推送

**Files:**
- Verify: scripts/check-privacy-interfaces.js
- Verify: scripts/check-v1.11-quality-matrix.js
- Verify: codex/release-regression-v1.10.1

- [ ] **Step 1: 扫描两个工作树**

使用 scanPrivacyInterfaces 分别扫描当前路线工作树和 /Users/hht/Desktop/knows/.worktrees/release-regression-v1.10.1。Expected: 两个工作树均为 Clipboard 8/0、文件接口 2、错误 0。

- [ ] **Step 2: 运行完整 v1.11 质量矩阵**

Run: node scripts/check-v1.11-quality-matrix.js

Expected: OK v1.11 quality matrix: 92 checks；内容源外部资料仍可独立报告 blocked。

- [ ] **Step 3: 检查工作树和发布分支**

    git diff --check
    git status --short --branch
    git -C /Users/hht/Desktop/knows/.worktrees/release-regression-v1.10.1 status --short --branch

Expected: 两个工作树均干净，发布分支不包含路线分支的新审计代码。

- [ ] **Step 4: 推送路线分支**

    git push origin codex/roadmap-v1.11

Expected: 远程更新成功，路线分支与 origin 同步。

## 完成检查

- [ ] wx.chooseMessageFile 和 wx.shareFileMessage 各为 1 次；
- [ ] 两个文件接口只出现在 utils/local-backup-file.js；
- [ ] Clipboard 保持 8 次写入、0 次读取；
- [ ] 隐私说明明确“用户主动选择/转发”，没有写成自动上传；
- [ ] 质量矩阵保持 92/92；
- [ ] AppID 41002 和数学官方目录缺口仍被单独记录。
