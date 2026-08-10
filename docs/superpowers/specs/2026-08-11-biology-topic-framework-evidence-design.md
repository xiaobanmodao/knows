# 生物专题官方框架佐证设计

## 背景与决定

`v1.11` 已有物理和化学专题的 `official-framework-support` 构建期佐证。生物当前包含 6 个稳定单元、36 个知识点、6 个方法模板、108 个原创例子和 6 条观察记录，已通过结构、资源和观察构建契约，但缺少与现有单元容器对应的独立框架佐证。

本批采用“独立官方框架佐证记录”。它只把现有原创单元的稳定快照、来源观察和内部领域标签交叉校验，不导入教材内容，也不把单元视作教材章、节或册次映射。

不采用两种替代方案：

1. 直接建立教材章、节或册次映射：人教社公开介绍可支持六个单元的宏观框架，却不是逐条内容来源和逐章映射输入；把它扩展成章序会越过当前可验证范围。
2. 仅沿用高风险字段检查：可保持当前内容正确性，但无法在专题标题、来源键或容器结构变化时自动提示重新复核。

## 官方来源与边界

本批只使用已登记的官方来源：

1. 教育部《义务教育生物学课程标准（2022年版）》作为课程框架基线。
2. 人教社《人教版义务教育生物学（七～八年级）新教材介绍》作为教材单元框架观察。该公开介绍说明教材包括六个单元、对应课程标准前六个学习主题，并概述六个单元的宏观内容。

来源注册表的第二条标题改为上述官方页面标题；生物运行时 `review.sourceRefs` 继续保留既有显示别名，不能因本批构建期佐证被改写。

这两项资料只支持“项目原创专题与官方公开课程、教材单元框架的宏观领域相容”。记录必须固定排除：`教材逐章标题`、`教材章节顺序`、`教材册次映射`、`教材正文与原始插图`。它不是 `external-source` 输入，不改变内容源跟进报告的 `blocked` 状态，不解除数学逐册目录门禁，也不解除发布真机证据门禁。

## 数据与校验设计

新增 `docs/evidence/biology-topic-framework-review-2026.json`：

```json
{
  "schemaVersion": 1,
  "reviewId": "biology-topic-framework-support-2026-v1",
  "reviewedAt": "2026-08-11",
  "evidenceKind": "official-framework-support",
  "scope": { "supports": [], "notVerified": [] },
  "sources": [{ "key": "...", "title": "...", "url": "...", "role": "...", "observation": "..." }],
  "topics": [{ "id": "...", "title": "...", "reviewSnapshotHash": "...", "frameworkDomains": ["..."] }]
}
```

记录只覆盖当前顺序的 6 个稳定单元：生物和细胞、多种多样的生物、植物的生活、人体生理与健康、生物与环境、生命的延续和发展。`frameworkDomains` 是项目内部的简短标签，分别为 `life/cells`、`organism diversity/classification`、`plant life/processes`、`human physiology/health`、`organism/environment`、`continuity/evolution`，不得被写成教材章节名称。

新增 `scripts/check-biology-topic-framework-evidence.js` 与 Node `assert` 契约测试。它从现有 `biology-topics`、`content-review-meta` 和来源注册表只读加载数据，公开接口为：

```js
checkBiologyTopicFrameworkEvidence({ evidencePath } = {})
// => { topicCount: 6, sourceKeys: [...], evidenceKind: 'official-framework-support' }
```

校验器必须：

1. 将缺失、损坏 JSON 包装为“生物专题官方框架佐证记录读取失败”。
2. 严格校验根、范围、来源和专题字段，递归拒绝教材映射、外部输入、正文和资源字段。
3. 校验两条来源的键、规范标题、URL、官方域名、角色和观察文本；运行时 `review.sourceRefs` 则锁定来源键集合和规范 URL，但允许既有显示标题别名。
4. 固定专题 ID 的完整顺序，校验标题、非空内部领域标签和基于稳定容器投影的 SHA-256 快照。
5. 不写入或改变生物 `review`、知识正文、观察说明、图示、稳定 ID、分包、存储、页面路由或云资源。

快照投影仅包含当前专题容器的 `id`、`unitLabel`、`title`、`summary`、`gradeBands`、`keywords`、`knowledgeIds`、`templateIds`、`coverImage` 和 `diagramImage`；证据 JSON 只存哈希，不存图片或知识正文。

## 质量门禁与验收

默认质量矩阵新增生物专题佐证契约，数量由 `118` 更新为 `119`。路线文档和高风险复核记录必须把它描述为补充框架佐证，而不是章序、外部资料接入或发布解锁依据。

验收要求：

- 6 个专题都有唯一、可复算的快照和固定内部领域标签。
- 来源记录、专题顺序、来源键或运行时来源 URL 漂移时都会失败。
- 在 JSON 中加入教材章序、正文、外部输入或资源路径字段会失败。
- 默认记录通过并输出 `OK biology topic framework evidence: 6 topics`。
- 全量质量矩阵为 119 项，生物内容、资源、观察构建、严格内容审计和发布准备检查继续通过。
- 本批不改变小程序运行时数据和用户可见学习内容。
