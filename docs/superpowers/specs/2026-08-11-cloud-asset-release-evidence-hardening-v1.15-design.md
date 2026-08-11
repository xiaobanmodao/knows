# 云资源部署证据加固设计

**状态：** 已由最终审查发现的可复现问题驱动；按既有授权继续实施。

## 背景

`v1.15` 已建立云图片计划、无临时 URL 的验证证据与严格发布门禁。最终审查确认四项边界还不够严：忽略目录中的资源清单可陈旧或截断、外部计划可以自洽却不规范、biology 子集证明不能满足全量严格门禁、历史数学资源没有学科归属。

本加固只修复这些发布证据边界。它不上传云存储、不调用开发者工具、不创建体验版或审核请求，也不改变 AppID、云环境 ID、运行时图片降级、稳定内容 ID、路由、本地存储或用户数据。

## 目标

1. 严格门禁拒绝任何不匹配当前项目资源清单的 manifest，至少覆盖缺失、额外、重复、路径不一致、源文件哈希不一致和压缩产物哈希不一致。
2. 计划和证据只接受由固定云基址、规范资源路径和当前已知学科归属推导的 `fileID`；不得接受签名 URL、其他云桶、跨学科路径或任意附加字段。
3. biology 子集计划只用于定位和补传已知风险资源；严格发布证明始终使用覆盖全部运行时资源的全量计划。
4. 所有拒绝路径保持脱敏，不回显不可信 `fileID`、URL、签名参数或 JSON 解析原文。
5. 测试覆盖真实执行的 DevTools 脚本输出、规范计划、当前 manifest 校验、全量/子集不兼容和严格门禁的受控成功/失败边界。

## 方案比较

### 方案 A：严格门禁每次重跑压缩脚本

门禁在临时目录重新压缩全部图片，再与现有 manifest 比较。它能验证压缩产物，但严格检查耗时长，依赖本机 Python/Pillow，并让本应只读的门禁产生大量临时输出。

### 方案 B：当前资源清单校验与规范计划验证

在 `prepare-remote-assets.js` 中为每项记录原图 `sourceSha256`，在严格门禁中重新读取当前原图和现有压缩产物，验证其与 manifest 的源路径、云路径、尺寸、字节数和哈希一致。计划再单独校验所有字段、学科归属与固定 `fileID`。这能阻断陈旧、截断、篡改或跨桶的输入，不增加云端动作，也不依赖重跑压缩。

### 方案 C：仅修正文档

只把 biology 与全量命令写清楚，无法阻断恶意或错误 manifest 和非规范计划，不能满足严格发布门禁要求。

选择方案 B：它保持严格检查本地、确定、无云凭据，同时把真正的信任边界放到可测试的纯函数中。

## 架构

新增 `scripts/remote-asset-manifest.js` 作为资源清单唯一契约层。

- `getSubjectFromAsset(source)` 识别 `subjects/<subject>/`、直接学科目录和历史数学 `topics/`、`templates/` 路径。当前 231 项资源必须全部归属到数学、英语、物理、化学或生物之一。
- `createRemoteAssetManifest(items)` 由压缩产物路径创建 version `2` manifest；每项记录 `source`、`cloudPath`、尺寸、字节数、压缩产物 `sha256` 与原图 `sourceSha256`。
- `validateRemoteAssetManifest(manifest)` 检查固定字段、类型、规范相对路径、唯一性、`cloudPath === '/' + source`、哈希格式与已知学科。
- `validateCurrentRemoteAssetManifest(manifest, options)` 在上层结构校验后，比较 `collectRemoteAssets()` 的完整集合、重新计算原图哈希，并重算本地 `dist/remote-assets/<source>` 的压缩产物哈希。测试可注入临时 source/output 根目录和资源列表。

`scripts/cloud-asset-deployment.js` 使用该层，不再展开任意 manifest 字段。计划项固定为 `source`、`cloudPath`、`subject`、尺寸、字节数、两个哈希与根据 `REMOTE_ASSET_BASE` 推导的 `fileID`。`validateCloudAssetPlan(plan)` 被 `buildConsoleVerificationScript()` 和 `validateCloudAssetEvidence()` 共用，拒绝任何额外字段、非规范路径、跨学科内容、非固定云基址和重复项。证据拒绝时只报告结果序号或固定说明。

严格 `check-release-readiness.js --require-device-evidence` 先用 `validateCurrentRemoteAssetManifest()` 校验现有 manifest，再以 `subject: null` 构造全量 canonical plan，最后校验 evidence。默认模式不读该 evidence，也不运行云端操作。

## 人工流程

1. 先生成 `biology-plan.json`，在已绑定 AppID 的开发者工具云存储面板补传 biology 路径。此计划不是发布证明。
2. 重新准备资源并生成不带 `--subject` 的 `release-plan.json`。同目录生成的 `verify-in-devtools.js` 必须在开发者工具控制台运行，输出保存为本地、去除临时 URL 的全量 evidence JSON。
3. 用 `release-plan.json` 运行 evidence CLI，再运行严格发布门禁。只有全量快照匹配时云资源证明才通过；实体机、弱网、包体、体验版与审核仍是独立前置。

当前不执行以上任何云端或开发者工具动作。biology `bio-unit-cells/cover.png` 仍是待人工确认的云对象，文字降级不构成部署成功。

## 测试与验收

- 231 项当前资源都能归属到已知学科，数学历史路径计入 math；`--subject math` 生成非空计划。
- current manifest 校验拒绝缺失/额外资源、错误 `cloudPath`、错误源哈希、错误压缩产物哈希和不规范字段。
- signed URL、其他云基址、跨学科路径、重复 `fileID` 和敏感错误回显均被拒绝。
- DevTools 脚本在模拟 `wx.cloud.callFunction` 下只输出符合 evidence schema 的一个 JSON 对象，不包含临时 URL或签名参数。
- biology 子集和全量计划的快照不同，子集 evidence 被严格门禁拒绝；受控全量 evidence 通过云资源子门禁。
- 默认矩阵仍无云凭据、无需现场 evidence；完整矩阵与严格缺失证据阻断均继续可复现。

## 非目标

- 不自动上传、不批量重传云资源，不验证云端对象的内容哈希，也不把 URL 可签名性误写成字节级部署证明。
- 不新建用户数据、登录、测评、云同步、内容后台或发布审核流程。
