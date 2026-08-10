# 英语官方单元目录证据独立化设计

## 目标

为现有英语单元目录建立独立、可复核的官方目录证据，使构建期检查能够发现本地标题、顺序或 Starter 标记与人教社公开目录不一致的情况。该工作只核对册次、单元标题、单元顺序和 Starter 标记；不复制教材正文、音频、词表、习题、解析或插图，也不把当前项目内容伪装成外部内容来源。

本设计经用户的持续授权确认：需要确认的内容可由项目代为确认，因此采用下文推荐方案，不等待额外的范围确认。

## 已确认事实

- 现有 `packages/english/data/english-source-evidence.js` 从运行时 `books` 直接生成 `unitEvidence`。它只能证明本地数据与自身一致，不能发现官方目录漂移。
- 人教社当前数字配套资源页显示八年级上册 Unit 3 为 `Same or Different`，八年级下册 Unit 4 为 `The Wonders of Nature`。
- 当前人教社九年级上册资源页直接公开了 Unit 1 `The Changing World` 和 Unit 2 `Inspiring People`；该页当前不能作为 Unit 3 至 Unit 8 的完整目录证据。
- 九年级上册现有项目内容必须继续可读，不能因为目录证据部分缺失而被错误地隐藏。`book.status` 因而继续只表示内容是否可进入，不能复用为目录证据状态。

官方入口：

- <https://www.pep.com.cn/zslth/yyptzy/czyy/7s/>
- <https://www.pep.com.cn/zslth/yyptzy/czyy/7x/>
- <https://www.pep.com.cn/zslth/yyptzy/czyy/8s/>
- <https://www.pep.com.cn/zslth/yyptzy/czyy/8x/>
- <https://www.pep.com.cn/zslth/yyptzy/czyy/9s/>

## 方案比较

1. **独立目录证据记录，保留内容可用状态（采用）**：人工维护官方页面观察结果，检查器将其与本地稳定 ID 对照。完整公开的册次标为 `verified`，九上标为 `partial`，九下保持 `pending`。它能准确表达证据边界，并保留已有内容入口。
2. **只改两处标题**：改动最小，但仍让证据模块从本地数据回填，下一次拼写或顺序漂移无法自动发现，因此不采用。
3. **把九上后六个单元改为不可用**：证据表面上更保守，却会把已有原创内容从学生入口移除，且混淆内容可用性与目录资料完整度，因此不采用。

## 数据与兼容设计

新增构建期记录 `docs/evidence/english-unit-directory-review-2026.json`，它是人工复核证据，不是运行时数据、云资源清单或 `external-source` 输入。文件固定包含：

- `schemaVersion`、`reviewId`、`reviewedAt`、`evidenceKind: "official-unit-directory"`；
- 一个已登记的官方 `sourceKey`、规范资源入口和人教社册次资源 URL；
- 每册的稳定 `bookId`、目录证据 `status`、可观察单元数组和明确的未核实单元 ID；
- 每个观察单元的 `unitId`、`number`、`title` 和 `isStarter`，但不保存任何教材正文或页面片段；
- 固定的范围声明，明确不核对教材正文、音频、题目、词表、图片、知识讲解和项目内容的逐页对应关系。

目录证据状态的语义固定如下：

| 状态 | 规则 |
| --- | --- |
| `verified` | 观察数组必须按本地顺序完整覆盖该册全部单元，并逐项匹配稳定 ID、编号、标题和 Starter 标记。 |
| `partial` | 观察数组只保存官方页面当前可见且已核对的单元；本地其余单元必须完整列在 `unverifiedUnitIds`，不得将其宣称为已核实。 |
| `pending` | 对应本地册次必须是不可用且零单元，观察数组与未核实数组均为空。 |

当前预期为：七上、七下、八上、八下为 `verified`；九上为 `partial`，仅观察 Unit 1 和 Unit 2，Unit 3 至 Unit 8 明确列为未核实；九下为 `pending`。

`packages/english/data/english-source-evidence.js` 改为读取这份独立记录并提供既有查询接口，不再从 `books` 生成标题证据。既有脚本名称和质量矩阵位置保持不变，因此质量矩阵仍为 117 项；变化发生在已有英语来源证据门禁的强度，而不是新增重复检查项。

## 标题修正与搜索兼容

运行时稳定 ID、路由、收藏、最近阅读、图片路径和本地存储键一律不变。仅修正两个规范标题：

- `eng-unit-g8a-same-or-different` 使用 `Same or Different`；旧写法 `Same or Different?` 作为 `legacyTitles` 保留。
- `eng-unit-g8b-wonder-of-nature` 使用 `The Wonders of Nature`；旧写法 `The Wonder of Nature` 作为 `legacyTitles` 保留。

单元构建器将 `legacyTitles` 纳入单元关键词；英语搜索适配器把它们写入搜索索引 token。这样旧文本搜索仍能抵达相同稳定单元，搜索结果与页面标题则显示修正后的规范写法。不会新增标题到 ID 的路由迁移，因为旧链接始终使用稳定 `unitId`。

九上运行时 `status` 保持 `verified`，以保证内容可访问；其 `sourceNote` 改为准确说明“公开目录页当前已核对 Unit 1-2，其余单元内容保留，等待完整官方目录复核”。八上、八下、文档中的目录基线同步使用修正后的规范标题。

## 校验与失败处理

现有 `check-english-source-evidence` 脚本和契约测试改为验证独立 JSON 记录，而不是检查本地对象的自复制结果。检查必须拒绝：

- 非人教社 HTTPS URL、旧的 `yyptypzj` 路径或未登记来源键；
- 重复或遗漏的册次、单元 ID，以及不合法的证据状态；
- `verified` 册次的标题、编号、顺序或 Starter 标记漂移；
- `partial` 册次把未观察单元标为已核实、漏列未核实 ID，或与本地已观察单元不一致；
- `pending` 册次包含猜测单元；
- 证据文件中出现教材正文、音频、试题、词表或外部内容导入字段；
- 九上仍使用“全部单元标题和顺序已核对”这一不准确表述。

校验完全离线运行，不在默认质量矩阵中请求网络。官方页面访问波动时，处理方式是人工重新核对页面并更新证据记录；不得降低检查规则、把部分证据扩写成完整证据，或改变真实内容源接入的 `blocked` 状态。

## 验收

- 独立 JSON 中的标题列表不由运行时 `books` 映射或生成。
- 42 个既有单元、336 个单词、84 个语法点和 924 条原创例句的规模不变。
- 八上、八下规范标题显示正确；两种旧写法仍能被搜索索引命中并打开原稳定单元。
- 九上只将 Unit 1-2 标作当前官方目录页已核实，项目内容仍可进入；九下继续无空单元。
- 英语专项、搜索索引、内容来源、路线文档和全量 v1.11 质量矩阵通过，矩阵数量仍为 117。
- 本批不修改 `content-source-follow-up`、外部资料状态、发布分支、云资源路径、收藏迁移或任何知识正文。
