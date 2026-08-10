# v1.7 多学科扩展底座与化学基础包设计

## 1. 目标

在不破坏数学、英语、物理现有内容和本地记录的前提下，把当前仅支持三科的分包、路由、搜索、参考索引、备份和校验逻辑改造成可声明式扩展的学科底座，并以初中化学作为第一个新增学科完成端到端验证。

本阶段交付一个可独立使用的化学知识包，不建立空白学科入口，不加入测评、任务、打卡、错题、登录、云同步或 AI 问答。

## 2. 版本与分支

- 开发分支：`codex/chemistry-foundation-v1.7`
- 开发版本：`1.7.0-dev.1`
- 基线提交：`9eec489`
- `codex/reference-indexes-v1.6` 保持冻结，只接收其自身发布所需修复。
- 化学内容和扩科底座不反向混入 v1.6 审核版本。

## 3. 内容依据与边界

### 3.1 来源基线

内容结构以以下官方资料为依据：

1. 教育部《义务教育课程方案和课程标准（2022年版）》：<https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html>
2. 教育部 2024 年义务教育国家课程教学用书目录：<https://www.moe.gov.cn/srcsite/A26/s8001/202408/W020240805496325238752.pdf>
3. 人教版第十二套义务教育教材介绍：<https://www.pep.com.cn/xw/zt/hd/12/>
4. 人教版义务教育化学新教材培训说明：<https://www.pep.com.cn/rjdt/rjdt/202405/t20240517_1992181.shtml>

新版九年级化学的最终公开章序未完成可靠核对前，不把章号或册次序号作为稳定 ID，也不声称当前内容与某一未公开目录逐章同步。旧版公开目录只可作为内容覆盖审计参考，不能作为新版教材映射的唯一依据。

### 3.2 化学组织原则

一级结构采用课程标准的五个学习主题：

1. 科学探究与化学实验
2. 物质的性质与应用
3. 物质的组成与结构
4. 物质的化学变化
5. 化学与社会·跨学科实践

学生实际浏览使用十个知识专题，每个专题归属于一个课标主题。后续获得可靠的新教材目录后，只新增 `textbookMappings`，不修改专题、知识点、实验和方法的稳定 ID。

### 3.3 原创与安全边界

- 不复制教材课文、例题、习题、解析、实验插图或词典式成段释义。
- 概念解释、例子、实验说明和图示均原创整理。
- 实验内容必须包含安全事项；涉及加热、腐蚀性物质、可燃气体和未知气体闻气味时使用规范表述。
- 不提供脱离学校实验室和教师指导的危险操作指引。
- 所有方程式需复核反应物、生成物、配平、条件、状态和现象，不以生成图片中的文字承载方程式。

## 4. 总体架构

### 4.1 两层注册

扩科底座分为运行时轻量注册和构建时内容适配两层。

**运行时学科清单**继续位于 `data/subject-manifest.js`，只保存首页和路由需要的轻量元数据：

```js
{
  id,
  name,
  shortName,
  description,
  gradeBands,
  theme,
  status,
  packageRoot,
  packagePages,
  routes,
  contentTypes,
  referenceKinds,
  counts,
  packageLabel
}
```

约束：

- `status: "active"` 才进入学生可见的首页、搜索筛选和“我的”页统计。
- `status: "building"` 可供构建脚本校验，但不得形成可点击空入口。
- `routes` 是 `subjectId + type` 到分包页面的唯一运行时来源。
- `getSubjectRegistry()` 默认只返回 active 学科；构建脚本通过显式参数读取包含 building 在内的全部声明。
- `counts` 是计数的唯一数据源；`getSubjectRegistry()` 和 `getSubjectMeta()` 同时展开现有 `chapterCount`、`knowledgeCount` 等兼容字段，现有首页和“我的”页无需一次性重写。
- 兼容导出 `SUBJECT_LABELS`、`SUBJECT_MANIFEST`、`getSubjectRegistry()` 和 `getSubjectMeta()`，避免现有页面破坏性改造。

**构建时内容适配器**新增到 `scripts/subject-adapters/`。每个适配器只负责把该学科的完整静态数据转换为统一构建接口：

```js
{
  subjectId,
  getManifestEntities(),
  buildSearchEntries(makeEntry),
  buildReferenceEntries(),
  validate()
}
```

`scripts/subject-adapters/index.js` 是唯一显式聚合点。搜索索引、参考索引、内容差异清单和通用 schema 校验遍历适配器，不再各自导入三科全文数据。

### 4.2 分包边界

新增普通分包 `packages/chemistry/`：

```text
packages/chemistry/
  data/
    chemistry-themes.js
    chemistry-topics.js
    chemistry-knowledge.js
    chemistry-templates.js
    chemistry-review-meta.js
  pages/
    index/
    topic/
    knowledge/
    template/
  repository.js
```

化学不建立未经确认的“教材章节页”。分包只配置 4 个真实页面，分包校验依据学科清单中的 `packagePages` 检查，不再假定所有学科都必须有 5 个页面。

主包继续保留首页、搜索、参考索引、收藏、我的、公共组件和轻量索引。主包不得 `require()` 任何学科全文数据；分包之间不得交叉引用。

### 4.3 运行时查询接口

化学 repository 与现有学科保持相同核心接口：

```js
getSubjectHome()
getTopicById(topicId)
getKnowledgeById(knowledgeId)
getTemplateById(templateId)
getKnowledgeContext(knowledge)
getKnowledgeNavigation(knowledgeId)
getRelatedKnowledge(knowledge, limit)
```

页面只依赖本分包 repository 和主包公共工具。所有不存在的 ID 返回 `null`，页面显示明确的“内容不存在/重新打开”状态，不显示空白页。

## 5. 化学内容模型

### 5.1 课标主题

```js
ChemistryTheme {
  id,
  subjectId: "chemistry",
  title,
  summary,
  topicIds
}
```

共 5 个主题，ID 使用语义名称，不包含教材章号。

### 5.2 知识专题

```js
ChemistryTopic {
  id,
  subjectId: "chemistry",
  themeId,
  title,
  gradeBands: ["九年级"],
  summary,
  objective,
  keywords,
  knowledgeIds,
  templateIds,
  coverImage,
  textbookMappings
}
```

首批 10 个专题：

1. 走进化学与实验安全
2. 空气、氧气与燃烧
3. 水与溶液
4. 分子、原子、离子与元素
5. 化学用语与质量守恒
6. 碳及其化合物与燃料
7. 金属与金属材料
8. 常见的酸和碱
9. 盐、化肥与常见离子反应
10. 化学材料、资源与环境

专题页只呈现知识地图、核心概念和方法入口，不出现“学完自测”“输出任务”“闯关”“掌握度”等学习任务字段。

### 5.3 知识点

```js
ChemistryKnowledge {
  id,
  subjectId: "chemistry",
  topicId,
  title,
  summary,
  tags,
  keywords,
  knowledgePoints,
  sections,
  templateIds,
  relatedIds,
  coverImage,
  review
}
```

首批至少 40 个知识点，每个专题至少 4 个。每个知识点至少包含：

- 一段不依赖图片的核心解释；
- 3 条以上关键知识；
- 概念适用条件或判断边界；
- 至少 1 个原创情境示例；
- 相关方程式、实验、物质性质或安全事项中至少一种；
- 2 个以上有效关联知识点；
- 内容复核状态与来源键。

以下课标责任必须由既有稳定 ID 明确承载：

- `chem-k-lab-object-change`：化学研究对象、实验探究与模型建构方法、化学发展及化学与技术社会环境的联系；
- `chem-k-lab-inquiry`：提出问题、形成假设、设计方案、获取证据、解释结论、交流反思、科学态度与实验责任；
- `chem-k-substance-classification`：化合、分解、置换、复分解四种基本反应类型及其初步应用；
- `chem-k-resources-environment`：跨学科方案的需求、设计、评价和改进，科学伦理、法律规范以及化学品、食品和药品安全意识。

内容上限固定在义务教育“初步、简单、常见”范围：不写物质的量与摩尔浓度、离子方程式与溶液平衡、pH 对数和滴定、电子排布与周期律推导、电极反应与电势、焓变和速率机理、官能团与有机反应机理、复杂冶金流程。氢气、一氧化碳、原子结构、元素周期表、碳材料、金属冶炼、pH、离子反应和有机物条目必须分别声明对应上限。

不生成需要用户作答的题目。现有 `problems` 数据结构不用于化学知识点，例子统一使用 `example` 内容块。

### 5.4 内容块

公共 `content-block` 保留现有类型，并新增：

```js
EquationBlock {
  type: "equation",
  equationId,
  title,
  equation,
  condition,
  phenomenon,
  interpretation,
  ratioNote
}

SafetyBlock {
  type: "safety",
  title,
  risks,
  rules,
  emergencyNote
}

ComparisonBlock {
  type: "comparison",
  title,
  columns,
  rows
}
```

化学实验继续复用 `experiment` 七段结构：目的、器材、步骤、现象、结论、误差、安全。方程式使用可复制文本和结构化字段显示，不放进位图。

### 5.5 方法模板

```js
ChemistryTemplate {
  id,
  subjectId: "chemistry",
  topicIds,
  name,
  category,
  summary,
  keywords,
  cues,
  steps,
  pitfalls,
  examples,
  figure
}
```

首批至少 12 个方法模板，覆盖：实验观察与描述、仪器选择和读数、气体制取装置、气体收集与检验、化合价与化学式、方程式书写和配平、质量守恒推理、方程式计算、溶解度曲线、溶质质量分数、溶液配制与稀释、变量控制与实验方案评价。

方法模板是知识方法说明，不是测评任务。示例给出完整过程，不要求用户提交答案。

## 6. 实验、方程式与图片

### 6.1 实验覆盖

首批至少包含并独立索引以下 8 项课程标准实验：

1. 粗盐中难溶性杂质的去除
2. 氧气的实验室制取与性质
3. 二氧化碳的实验室制取与性质
4. 常见金属的物理性质和化学性质
5. 常见酸、碱的化学性质
6. 一定溶质质量分数的氯化钠溶液的配制
7. 水的组成及变化探究
8. 燃烧条件的探究

实验数量由 `experimentId` 去重统计；同一实验可在相关知识点引用，但参考索引只保留一个主入口。

### 6.2 方程式参考索引

参考索引新增 `equation` 类型。每条方程式索引包含：

```js
{
  kind: "equation",
  subjectId: "chemistry",
  refId,
  containerId,
  focusId: equationId,
  title,
  primary: equation,
  secondary: conditionOrPhenomenon,
  tags,
  tokens
}
```

点击方程式或实验后进入对应知识点，并滚动到 `equation-<id>` 或 `experiment-<id>`。首批至少收录 24 条不重复的核心方程式。

### 6.3 图片规范

- 10 张专题封面，统一 `1280 x 900`，压缩后单张不超过 `200KB`。
- 至少 10 张独立结构图，优先覆盖实验装置、微粒模型、溶解度曲线、金属活动性、酸碱与 pH、反应前后粒子关系。
- 封面和结构图使用原创或生成资源，上传云存储，原图不进入运行主包。
- 实验装置、导管位置、加热方向、电极、箭头、状态符号和标签必须人工复核。
- 核心结论、方程式、单位和安全提示必须同时以文字呈现；图片失败不影响阅读。

## 7. 路由、存储与兼容

### 7.1 路由

`utils/content-routes.js` 从学科清单生成可用路由，不再维护三科 `PACKAGE_ROUTES` 常量。新增化学路径：

- `/packages/chemistry/pages/index/index`
- `/packages/chemistry/pages/topic/index?id=<topicId>`
- `/packages/chemistry/pages/knowledge/index?id=<knowledgeId>`
- `/packages/chemistry/pages/template/index?id=<templateId>`

未知 `subjectId` 继续按数学兼容，已注册但不支持的 `type` 回到该学科首页，不误开其他学科知识页。

### 7.2 本地数据

- 收藏、最近浏览、继续阅读、阅读位置、笔记和标签继续使用 `subjectId:type:id`。
- `subjectId: "chemistry"` 由学科清单自动成为合法值。
- 本地内容 schema 保持版本 `4`，备份格式保持版本 `1`；新增合法枚举不需要迁移旧记录。
- 旧备份恢复后，数学、英语、物理记录数量和目标 ID 必须不变。
- 化学知识页复用阅读显示设置、笔记、收藏和阅读位置能力。

## 8. 搜索、参考索引与差异报告

### 8.1 搜索

构建时适配器生成化学专题、知识点和方法模板索引。关键词覆盖：中文名称、常见别名、化学式、物质名称、现象、实验器材、条件和方法名称，不收录大段正文。

验收关键词至少包括：

- 质量守恒定律
- 化学方程式配平
- 氧气制取
- 二氧化碳检验
- 溶质质量分数
- 金属活动性顺序
- pH
- 中和反应
- 粗盐提纯
- 燃烧条件

首页与搜索的学科筛选从 active 学科清单生成；化学正式开放前不得出现在可点击筛选中。

### 8.2 参考索引

参考索引元数据由构建结果生成，不再在运行时代码硬编码“公式属于数学/物理、实验属于物理”。新增化学后：

- `formula`：数学、物理；
- `word`、`grammar`：英语；
- `experiment`：物理、化学；
- `equation`：化学。

### 8.3 内容差异

内容清单生成器遍历学科适配器，化学实体以 `chemistry:<type>:<id>` 进入差异报告。首次加入预期全部为新增，不允许修改或删除三科既有实体。

## 9. 错误与降级

- 分包下载或导航失败时保留当前页面，关闭 loading，并提供重试。
- 数据 ID 不存在时显示明确提示和返回学科首页操作。
- 云图片签名或加载失败时隐藏图片区域，完整文字继续显示。
- 单个相关知识引用失效时不阻断页面，但构建校验必须失败。
- 生成搜索或参考索引时发现重复 key、无效引用、未知类型或未注册学科，构建立即失败。
- 方程式、实验和安全字段不完整时内容校验失败，不允许以空字段上线。

## 10. 测试与验收

### 10.1 底座校验

- 运行时学科清单和构建时适配器的 subject ID 一致。
- 所有 active 学科的路由、分包配置和页面数量与声明一致。
- 主包不引用任何分包全文数据，分包之间无交叉引用。
- 搜索、参考索引、内容清单和 schema 校验通过统一适配器覆盖四科。
- 现有三科搜索实体数、参考索引实体和稳定 ID 不发生意外变化。

### 10.2 化学内容校验

- 5 个课标主题、10 个专题、至少 40 个知识点、12 个方法模板。
- 每个专题至少 4 个知识点，每个知识点字段完整并有有效上下文。
- 至少 8 个独立实验、24 条不重复核心方程式。
- ID 全局唯一，主题、专题、知识点、模板、实验和方程式引用有效。
- 每条方程式完成式子、配平、条件、现象/解释字段校验。
- 每个实验完成七段结构与安全字段校验。
- 不出现 `checkpoint`、`finishCriteria`、`outputTask`、`quiz` 等测评或任务字段。
- 所有图片引用进入云资源清单，封面尺寸和体积达标，图片失败降级可读。

### 10.3 回归

- 运行现有发布、三科内容、准确性、补深、图片、迁移、搜索、索引、路由、备份、笔记、阅读显示和分包边界检查。
- 新增化学内容检查、化学准确性检查和四科学科统计检查。
- iPhone 14 Pro Max 与 Nexus 5 模拟器验证：首页化学入口、专题、知识点、方法、方程式直达、实验直达、搜索、收藏、笔记、阅读设置、返回栈和图片降级。
- 微信开发者工具控制台保持零项目错误。
- 主包压缩后继续小于 `700KiB`，化学分包小于 `1MB`，其他分包不增长或只因公共兼容字段产生可解释变化。

## 11. 提交边界

按以下可独立回滚的批次提交：

1. 设计与实施计划。
2. 学科能力注册表、构建适配器和兼容测试。
3. 化学数据模型、repository 和内容校验。
4. 5 主题、10 专题、40 知识点、12 方法、8 实验、24 方程式。
5. 化学页面、公共内容块、路由和本地能力接入。
6. 搜索、参考索引、差异报告和资源清单。
7. 图片、完整回归和实施记录。

每一批提交前运行其直接检查；最后一批运行完整检查矩阵。开发完成后推送功能分支，不创建 RC 标签，实体机回归通过后再决定 `1.7.0-rc.1`。

## 12. 后续学科顺序

### v1.8 生物学

以人教版新教材官方六单元为稳定一级结构：生物和细胞、多种多样的生物、植物的生活、人体生理与健康、生物与环境、遗传与进化。优先建设细胞结构图、分类关系图、人体系统图、生态系统图和实验观察说明。

官方依据：<https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202409/t20240914_1995532.html>

### v1.9 地理

等待七上、八上重组后的完整可靠目录核对，再建设地图阅读、地球与地图、世界地理、中国地理、区域发展和地理实践。地图必须使用合法、准确的底图和审图合规资源，不把生成式图片用于行政区划或国界表达。

官方依据：<https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202409/t20240918_1995544.html>

### v2.0 语文与历史

语文和历史采用独立内容模型。语文侧重字词、文体、阅读方法、写作知识和名著导读；历史侧重时序、事件、人物、制度和因果关系。两科版权与史实复核成本明显高于理科，不复用化学的公式/实验模型，也不与生物、地理同一批上线。

道德与法治涉及政策时效和审核风险，放在稳定来源、内容复核流程和更新机制建立之后。

## 13. 明确不做

- 不猜测九年级化学新版教材章序。
- 不建立生物、地理、语文、历史的空入口。
- 不一次性把所有学科全文塞入主包。
- 不把学科全文迁移到云数据库或内容后台。
- 不加入测评、练习提交、自动评分、错题、学习进度或账号系统。
- 不改动现有三科稳定 ID、云资源路径和本地存储键。
