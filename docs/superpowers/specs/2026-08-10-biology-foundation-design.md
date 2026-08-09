# v1.8 生物学基础包设计

## 目标

在现有多学科分包底座上增加人教版义务教育生物学基础包，面向七至八年级学生提供可直接查阅的六单元知识内容。首期不加入测评、学习任务、错题、打卡、登录或云同步。

## 内容边界

内容依据教育部《义务教育生物学课程标准（2022年版）》和人教版《义务教育教科书 生物学（七～八年级）新教材介绍》核对。新版教材包括六个单元，对应课标前六个学习主题；“生物学与社会·跨学科实践”融入六个单元，不另建空白导航层。

六个稳定单元容器：

1. 生物和细胞
2. 多种多样的生物
3. 植物的生活
4. 人体生理与健康
5. 生物与环境
6. 生命的延续和发展

首期规模：6 个专题容器、36 个知识点、6 个方法模板、108 条原创情境例子、6 个安全观察/实验说明、6 张专题封面和 6 张结构图。单元标题和知识点 ID 使用独立稳定 ID，不把章节序号作为主键。

教材照片与官方页面只用于核对课程边界，不复制课文、题目、解析、实验插图或教材原始版式。所有解释、例子和图示原创改写；涉及显微镜、人体、微生物、遗传和野外观察的内容明确给出适龄安全边界。

## 数据架构

新增 `packages/biology/` 分包，沿用现有结构化学科接口：

- `getSubjectHome()` 返回生物学科元数据和六个单元专题。
- `getTopicById(subjectId, topicId)` 返回单元及其知识点、模板摘要。
- `getKnowledgeById(subjectId, knowledgeId)` 返回完整知识卡片。
- `getTemplateById(subjectId, templateId)` 返回方法模板。
- `getKnowledgeContext()`、`getRelatedKnowledge()` 和 `getKnowledgeNavigation()` 复用现有知识页行为。

每个专题结构固定包含 `id`、`subjectId`、`unitLabel`、`title`、`gradeBands`、`summary`、`keywords`、`signals`、`checkpoints`、`coverImage`、`diagramImage`、`knowledgeIds`、`templateIds` 和 `knowledgeItems`。不增加 `objective`、`practiceFlow`、`finishCriteria` 等任务型字段。

每个知识点包含 `id`、`subjectId`、`topicId`、`title`、`summary`、`explanation`、`points`、`pattern`、`mistakes`、`examples`、`coverImage`，必要时附一段结构化 `experiment`，字段只描述观察目的、器材、步骤、现象、结论、误差和安全提醒。

## 集成方式

- `data/subject-manifest.js` 注册 `biology`，状态仅在数据、页面、资源和校验全部完成后设为 `active`。
- `app.json` 新增普通分包 `packages/biology`，不配置 `preloadRule`。
- `scripts/subject-adapters/biology.js` 为搜索索引、参考索引、内容 schema 提供统一适配器。
- 搜索支持单元、知识点和模板，不把长解释和完整实验正文塞入轻量 tokens。
- 参考索引首期注册 `experiment`，每个实验只索引标题、目的、现象和结论，点击后通过 `focusId` 回到知识页。
- 首页、搜索、收藏、最近浏览和“我的”继续通过 subject registry 和统一路由动态识别生物学，不添加单独的三科/四科分支。

## 资源与失败处理

新增资源放在 `assets/figures/generated/subjects/biology/`：每个单元一张 `1280×900` PNG 封面和一张 `1200×760` PNG 结构图。资源全部进入 inventory 和远程压缩清单，运行时云图片失败时保留完整文字。

图示主题覆盖细胞结构层次、生物分类树、植物生命周期、人体系统协同、生态系统关系和遗传变异链。图内核心文字不依赖小字号图片传递，页面文字卡片保留完整解释。

## 验收标准

- 生物学分包包含六个可打开单元、36 个可打开知识点、6 个可打开模板。
- 六个单元各有至少 6 个知识点、4 个题干/阅读信号、4 个检查点和 18 条原创例子。
- 搜索“细胞膜、光合作用、消化系统、生态系统、遗传和变异、生物多样性”均命中 `biology`。
- 生物学实验/观察可通过参考索引打开知识页焦点；图片失败不造成空白卡片。
- 所有生物学 ID 与现有四科全局唯一，旧数学/英语/物理/化学链接和收藏不回归。
- 生物学分包小于 `1 MiB`，主包仍小于 `700 KiB`，开发者工具控制台无项目错误。
- 不创建 RC，不上传体验版，实体设备回归仍作为正式发布前置。
