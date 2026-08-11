# v1.15 云资源部署证据设计

## 背景

`prepare-remote-assets.js` 与 `check-remote-assets.js` 已能验证当前工作树中的远程资源压缩产物、尺寸、哈希和引用关系，但它们不能证明同名对象真实存在于微信云存储。v1.14 模拟器已实际发现生物封面
`assets/figures/generated/subjects/biology/topics/bio-unit-cells/cover.png`
在 `cloud1-d3gm5t961d46590c3` 缺失，并触发 `STORAGE_FILE_NONEXIST`；页面正确保留文字降级，但发布体验仍不完整。

当前清单有 231 个远程资源。继续依赖页面抽查会遗漏同类问题，直接把本地清单视为云端验证又会制造错误发布结论。

## 决策与范围

本批建立“本地资源快照 -> 开发者工具签名验证批次 -> 本地无敏感证据 -> 严格发布门禁”的闭环，复用已部署的 `getImageTempUrls` 云函数，不新增用户可见页面、内容正文、账号、学习任务或云端学习数据。

选择该方案而非直接手工上传的原因是：上传可以修复一个已知缺口，但没有可复用的全量证明；来源正文扩写则受 `math-chapters-v1.11` 缺少完整官方逐册目录阻断。此批先让资源发布状态可重复核验，再按产物精确处理缺失文件。

## 目标

1. 从 `dist/remote-assets/manifest.json` 构建确定性的云资源验证计划，明确每项本地源、云路径、预期 `cloud://` 文件 ID、尺寸、字节数、哈希与学科分组。
2. 计划按 50 个文件 ID 分批，生成可在已绑定 AppID 的微信开发者工具控制台调用 `getImageTempUrls` 的验证载荷。
3. 将控制台/云函数响应归一化为本地忽略的证据文件；证据只保留状态、时间、文件 ID、环境、计划哈希与代码提交，不保存临时 URL 或签名参数。
4. 验证器拒绝环境不一致、计划过期、覆盖不全、重复 ID、非零状态、缺少临时链接状态和未知文件；成功时才允许把全量云资源描述为已核验。
5. `check-release-readiness.js --require-device-evidence` 额外要求当前提交和当前资源快照对应的云资源证据。默认质量矩阵只验证工具与契约，不要求真实云端证据。

## 非目标

- 不自动上传任何文件、预览包、体验版或正式版本。
- 不替代实体 iPhone、Android、弱网、包体或审核证据。
- 不修改稳定内容 ID、云环境 ID、资源路径、用户数据、收藏、笔记或搜索排序。
- 不把暂时可读的文字降级写成“云图已验证”。

## 数据与接口

新增纯 Node 模块 `scripts/cloud-asset-deployment.js`，从资源 manifest 和 `utils/asset-config.js` 构造下列对象：

```js
CloudAssetPlan {
  schemaVersion: 1,
  generatedAt: string,
  sourceCommit: string | null,
  environmentId: string,
  remoteAssetBase: string,
  snapshotHash: string,
  assetCount: number,
  assets: [{
    source, cloudPath, fileID, subject,
    width, height, bytes, sha256
  }],
  batches: [{ id, fileIDs }]
}

CloudAssetEvidence {
  schemaVersion: 1,
  verifiedAt: string,
  sourceCommit: string,
  environmentId: string,
  snapshotHash: string,
  results: [{ fileID, status, errCode?, errMsg? }]
}
```

`snapshotHash` 只由稳定的资源字段生成，排除 `generatedAt` 和临时 URL。`fileID` 由受控的 `REMOTE_ASSET_BASE + cloudPath` 生成；不接受调用方提供不同云桶或不同环境的 ID。

`scripts/build-cloud-asset-deployment-plan.js` 默认输出到
`dist/cloud-asset-deployment/plan.json`，支持 `--subject biology` 生成针对性上传/核验计划。它同时输出一个仅供开发者工具控制台粘贴的批次脚本；该脚本把云函数响应打印为证据 JSON，但不会把临时 URL 作为仓库内容保存。

`scripts/check-cloud-asset-deployment-evidence.js` 接收计划与证据路径，验证两者的环境、提交、哈希和完整文件覆盖。证据应保存在 `.codex-output/release-regression-v1.10.1/cloud-asset-evidence.json`，不进入 Git。

## 发布门禁与失败处理

默认质量矩阵新增工具契约测试，不依赖已登录云环境。严格 `--require-device-evidence` 模式读取 `CLOUD_ASSET_DEPLOYMENT_EVIDENCE` 或发布工作树中的默认证据路径，并在下列任一情况阻断：

- 证据不存在或不是当前计划快照；
- 证据提交不是正在验证的 Git 提交；
- 证据环境不是 `CLOUD_ENV_ID`；
- 任一资源未返回成功状态；
- 计划没有覆盖当前资源清单。

这项门禁只增加发布结论的证据强度。普通开发和文字降级继续可用，页面不会因为证据文件不存在而改变运行时行为。

## 实际部署顺序

1. 运行 `node scripts/prepare-remote-assets.js` 和 `node scripts/build-cloud-asset-deployment-plan.js --subject biology`。
2. 在已绑定 AppID 的开发者工具云存储面板，按计划把 biology 子树上传到同名云路径；不得上传未列入计划的本地文件。
3. 使用计划生成的每批 `getImageTempUrls` 调用获取所有文件状态，保存去除临时 URL 的证据 JSON。
4. 运行证据验证器；再从生物知识页确认图像实际显示与文字降级仍正常。
5. 只有云资源证据、实体机、弱网、包体和现有严格门禁全部满足时，才讨论 RC 或体验版。

## 验收

- 231 项基线资源产生唯一的云路径、文件 ID、快照哈希和最多 50 项的批次。
- biology 范围计划只包含 biology 资源，且包含已发现缺失的 cells 封面。
- 测试覆盖空/重复资产、环境漂移、路径漂移、覆盖缺失、失败状态、临时 URL 脱敏和过期快照。
- 默认质量矩阵仍可在无云凭据环境运行；严格发布模式在无真实证据时明确阻断。
- 文档不声称执行了上传、实体机、弱网、预览、体验版或审核。
