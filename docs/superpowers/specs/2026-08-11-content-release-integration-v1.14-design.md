# v1.14 内容线与发布基线集成设计

## 1. 背景与结论

`codex/chemistry-visual-guides-v1.13` 是当前最完整的内容与质量开发线，包含 v1.7 至 v1.13 的内容生产工具、五科复核、化学与生物图解和 123 项质量矩阵。它与 `codex/release-regression-v1.10.1` 的共同基线是 `753be9db54c34d700f1d4da1d9eb1ac6a53dd5ac`。

发布回归线在共同基线之后新增了 11 个提交，包括关闭云开发用户追踪、纯知识运行文案、云资源熔断和搜索别名移动到 catalog 分包。内容线在共同基线之后新增了 219 个提交。不能直接把内容线作为发布候选，也不能把发布回归分支重置或快进到内容线，否则会遗漏发布热修复。

本设计在 `codex/content-release-integration-v1.14` 上从 `codex/release-regression-v1.10.1` 合并 `codex/chemistry-visual-guides-v1.13`，得到一个同时保留发布热修复与内容能力的集成候选。发布回归分支、v1.13 分支、版本号、标签、体验版和审核状态均不在本次修改范围内。

## 2. 目标与非目标

### 目标

1. 保留 v1.13 的内容生产工具、来源审计、五科学习内容、结构化图解和原有 123 项质量矩阵。
2. 保留 v1.10.1 的隐私、纯知识、云资源、catalog 搜索别名和发布证据热修复。
3. 用一个明确的 merge commit 记录集成关系，避免把 219 个提交逐个 rebase 到发布线上。
4. 将发布侧的云用户追踪契约与实际检查加入默认矩阵，使集成后的默认矩阵为 125 项；在不上传、不预览、不提审的前提下，通过静态发布门禁、内容门禁和分包门禁。

### 非目标

- 不进行实体 iPhone/Android 回归，不把模拟器结果记作实体机证据。
- 不创建 `v1.14` RC、Git 标签、体验版或正式发布申请。
- 不改变 `app.json`、`project.config.json` 中的 AppID、云环境、版本号或分包声明，除非 Git 的自动三方合并已保留双方一致的既有字段。
- 不解除外部资料来源跟进中的 `math-chapters-v1.11` 阻断，不把目录证据写成教材正文来源。
- 不添加测评、任务、错题、登录、同步或 AI 生成内容。

## 3. 集成方式

### 3.1 采用保留历史的三方合并

在新分支工作树执行：

```bash
git merge --no-commit --no-ff codex/chemistry-visual-guides-v1.13
```

以 `753be9...` 作为三方合并公共祖先。合并成功后只创建一个 `merge` 提交，父提交分别为当前发布回归 HEAD 和 v1.13 HEAD。这样可以在 Git 历史中完整追溯发布热修复和内容开发，而不会把已经独立审核过的内容提交重新改写。

### 3.2 已知冲突与处理规则

静态 `git merge-tree --write-tree` 预演显示仅有两个文本冲突：

| 文件 | 发布线保留内容 | 内容线保留内容 | 集成结果 |
|---|---|---|---|
| `scripts/check-release-readiness.js` | 云用户追踪隐私门禁、纯知识运行文案门禁、预览状态报告检查、发布热修复范围脚本 | 结构化内容源目录、英语目录、数学目录和开发者工具状态证据检查 | 合并两个 import 和全部独立检查函数；热修复范围检查只在 `--require-hotfix-scope` 时执行，默认产品检查不把内容集成误判为热修复越界；`--require-device-evidence` 仍严格要求工具状态报告。 |
| `scripts/check-search-semantics.js` | `SEARCH_ALIAS_GROUPS` 从 `packages/catalog/data/search-aliases` 加载 | 旧版英语单元标题别名断言 | 使用 catalog 分包路径，并保留 `Same or Different?` 与 `The Wonder of Nature` 的可检索性断言。 |

非冲突但必须复核的发布侧规则：

- `cloudfunctions/getFileUrl` 不得恢复 `traceUser: true`、openId 追踪或用户数据采集。
- 纯知识定位继续使用“查阅知识”，不得恢复学习任务、打卡、完成进度或错误的互动承诺。
- `utils/asset-config.js` 和云图片降级逻辑继续保留熔断、重试边界和完整正文后备。
- 运行时搜索别名只从 catalog 分包读取，主包不重新引入 `data/search-aliases.js`。
- `project.config.json` 的忽略清单保留对 `.superpowers` 等开发辅助目录的排除；不得混入开发者工具仅重排字段的格式化噪声。

### 3.3 热修复范围门禁的显式模式

`scripts/check-release-hotfix-scope.js` 的白名单只能验证“小范围热修复相对于发布基线的改动”，不能验证包含五科内容线的大型集成。把它无条件嵌入 `check-release-readiness.js` 会使任何经过审查的内容集成误报越界，也会诱使调用者用错误的基线绕过检查。

因此保留白名单与 `validateReleaseHotfixScope()` 的全部现有行为，并新增 `shouldRequireHotfixScope(args)`：只有 `node scripts/check-release-readiness.js --require-hotfix-scope` 才调用热修复范围脚本。`--require-device-evidence` 与热修复范围是两个独立选项；实体设备发布回归不自动等同于热修复。`scripts/check-release-hotfix-scope.test.js` 必须覆盖空参数、显式参数和无关参数三种情况。

这不是降低热修复约束：在 v1.10.x 热修复分支仍显式运行 `--require-hotfix-scope`，而通用内容分支只运行产品、隐私、分包和内容门禁。所有分支都继续运行云用户追踪与纯知识文案检查。

云用户追踪的 `scripts/check-cloud-user-trace.test.js` 与 `scripts/check-cloud-user-trace.js` 恢复为默认质量矩阵项目，因此默认总数从 v1.13 的 123 项增加到 125 项。`scripts/check-release-hotfix-scope.test.js` 是只属于显式热修复模式的契约测试，必须在质量矩阵的“所有测试脚本覆盖”断言中被具名排除；它仍由 `--require-hotfix-scope` 调用，不能静默删除或忽略。当前路线文档的实时门禁数量更新为 125，已有 v1.13 验证记录中的历史 123 项结论保持原样。

## 4. 数据、路由与包体不变量

1. 所有内容实体稳定 ID、旧别名、收藏键、笔记键和阅读位置继续基于 `subjectId:type:id`，存储 schema 保持兼容。
2. 主包不导入学科正文；数学、英语、物理、化学、生物的分包边界仍由 `scripts/check-package-boundaries.js` 约束。
3. 云图片失败时文字知识、实验、方程式、语法和图解说明必须仍可阅读；结构图解不把核心知识放在远程图片内。
4. `dist/content-audit/` 和 `.codex-output/` 是可再生本地产物，不进入提交；检查前按脚本顺序构建，不能并行依赖同一审计输出。
5. 内容源审计、内容差异、搜索索引和来源跟进报告必须由当前集成树重新生成，不得复制旧分支的产物或声称外部资料已完成导入。

## 5. 验收顺序

### 5.1 合并后静态回归

按顺序执行并保留每条命令的真实输出摘要：

```bash
node scripts/check-cloud-user-trace.test.js
node scripts/check-cloud-user-trace.js
node scripts/check-pure-knowledge-runtime.test.js
node scripts/check-pure-knowledge-runtime.js
node scripts/check-release-hotfix-scope.test.js
node scripts/build-content-audit.js
node scripts/check-content-audit.js
node scripts/build-content-review-queue.js
node scripts/check-content-review-queue.js
node scripts/check-package-boundaries.js
node scripts/check-release-readiness.js
node scripts/check-v1.11-quality-matrix.js
git diff --check
```

若 `check-v1.11-quality-matrix.js` 需要先生成来源目录、外部输入 manifest 或数学目录审计，必须只调用矩阵已经定义的构建顺序；不可和依赖同一 `dist/content-audit` 输出的单项检查并行运行。

在独立 v1.10.x 热修复分支补充执行：

```bash
node scripts/check-release-readiness.js --require-hotfix-scope
```

### 5.2 结果判定

- 默认质量矩阵必须输出 `OK v1.11 quality matrix: 125 checks`。
- 发布就绪检查必须输出 `OK release readiness checked`，默认模式不启用仅适用于热修复分支的白名单；这不等同于拥有实体机和预览包证据。
- 内容来源跟进报告可以且应继续显示 `blocked: math-chapters-v1.11`；这不阻止本次代码集成，但阻止把其描述成正式发布完成。
- `git status --short` 只能留下被明确说明的开发者工具配置格式化变化；集成提交不得包含 `dist/`、`.codex-output/`、本地设备日志或临时资源。

### 5.3 手工边界

合并后的模拟器验证只覆盖首页、五科入口、搜索别名、化学/生物图解、收藏和云图文字降级。真实 iPhone/Android、弱网、体验版上传、审核和发布仍在后续独立发布流程中执行。

## 6. 风险与回退

| 风险 | 控制方式 | 回退方式 |
|---|---|---|
| 合并改坏发布热修复 | 云用户追踪、纯知识和云资源门禁始终运行；热修复白名单只在显式模式运行 | 丢弃新集成分支；发布回归分支不受影响。 |
| 内容开发绕过分包边界 | 运行分包边界与 v1.11 质量矩阵 | 修复冲突解决或内容引入点，不修改发布分支。 |
| 生成产物导致脏工作树 | 仅允许可忽略 `dist/` 和 `.codex-output/` 产物 | 删除本地生成产物，不提交。 |
| 误以为已可发布 | 文档固定“未执行实体机、预览、上传、审核、发布” | 仅在独立发布分支补齐严格证据后再创建 RC。 |

## 7. 成功定义

完成时，新分支有一个可追溯的合并提交，静态质量与发布门禁均通过，两个冲突文件同时保留双方功能，且没有修改任何冻结发布分支或执行外部发布动作。该分支是后续内容开发和最终发布回归的共同候选基线，而不是发布结论。
