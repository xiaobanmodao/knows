# 生物关键图解 v1.12 Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 为 36 个现有生物知识点提供可读、可校验、离线可用的结构化关键图解。

**Architecture:** 新建独立的 biology-visual-guides 数据模块，按现有知识点稳定 ID 提供图解，再由 biology-knowledge 合并到既有实体中。用纯函数契约校验源数据和 repository 运行时副本，知识点页通过 WXML/CSS 渲染四种结构，不增加新路由或位图资源。

**Tech Stack:** 微信小程序 WXML/WXSS、CommonJS、Node.js assert、现有 biology repository 与质量矩阵脚本。

## Global Constraints

- 精确覆盖现有 6 个专题、36 个 bio-k-* 知识点，每个知识点仅有 1 个图解。
- 图解只使用原创短语重组现有摘要、核心知识和原创例子；不得复制教材正文、练习、解析或插图。
- 不新增测评、任务、打卡、错题、登录、云同步、云图片或第三方依赖。
- 不改变知识点、专题、模板、云资源、路由或本地存储的稳定 ID 与版本。
- 图解必须在云封面图片失败时继续完整可读；文字不可依赖图片内小字号传达。
- type 仅为 flow、cycle、compare、hierarchy；色调仅为 green、blue、amber、slate。
- 每个图解 2 至 5 个节点，节点 label、note 非空且 label 在本图解中唯一。
- compare 中两侧都至少有一个 lane: 'left' 或 lane: 'right' 节点；hierarchy 的 depth 仅为 0、1、2。
- 现有复核元数据保持 reviewed；本批不把宏观官方来源提升为逐条 verified 证据。

---

## File Structure

- Create: packages/biology/data/biology-visual-guides.js — 36 个图解的唯一源数据、只读克隆查询函数和枚举常量。
- Modify: packages/biology/data/biology-knowledge.js — 在 defineKnowledge() 中按稳定 ID 合并图解。
- Create: scripts/biology-visual-guide-contract.js — 独立的图解 schema、覆盖率和运行时一致性校验。
- Create: scripts/check-biology-visual-guides.js — 可执行检查器，覆盖数据契约和 WXML 降级分支。
- Create: scripts/check-biology-visual-guides.test.js — 正常、缺失、非法色调、重复标签和运行时篡改的 Node 测试。
- Modify: scripts/check-biology-content.js — 明确验证知识点的图解字段。
- Modify: scripts/check-v1.11-quality-matrix.js — 将图解检查接入全量基线。
- Modify: packages/biology/pages/knowledge/index.js、index.wxml、index.wxss — 预处理并展示四种结构。

## 图解内容清单

| 专题 | 知识点 ID | 类型 | 图解关系 |
|---|---|---|---|
| 生物与细胞 | bio-k-life-features | flow | 环境刺激 → 生活活动 → 生长繁殖 → 与环境相适应 |
| 生物与细胞 | bio-k-science-observation | flow | 提出可观察问题 → 记录条件和事实 → 比较与重复 → 有范围的结论 |
| 生物与细胞 | bio-k-microscope-observation | flow | 低倍定位 → 目标居中 → 换高倍镜 → 细准焦观察 |
| 生物与细胞 | bio-k-plant-animal-cells | compare | 植物细胞与动物细胞的共同基本结构、细胞壁/叶绿体/液泡差异 |
| 生物与细胞 | bio-k-cell-life | flow | 物质交换 → 能量转换 → 遗传信息参与控制 → 生命活动 |
| 生物与细胞 | bio-k-structure-levels | hierarchy | 细胞 → 组织 → 器官 → 系统/生物体 |
| 生物多样性 | bio-k-classification-basis | flow | 稳定特征 → 比较相同与不同 → 综合证据 → 分类线索 |
| 生物多样性 | bio-k-algae-plants | compare | 藻类、苔藓、蕨类在环境、结构分化和繁殖上的差异 |
| 生物多样性 | bio-k-animal-groups | hierarchy | 动物 → 无脊椎/脊椎 → 常见脊椎动物类群 |
| 生物多样性 | bio-k-animal-behavior | compare | 先天行为与学习行为的形成基础和可观察表现 |
| 生物多样性 | bio-k-microorganisms | compare | 细菌、真菌、病毒的细胞结构和增殖依赖区别 |
| 生物多样性 | bio-k-biological-classification | hierarchy | 大分类等级 → 小分类等级 → 种 |
| 植物的生活 | bio-k-seed-germination | flow | 有活力的胚 + 水分/空气/适温 → 萌发 |
| 植物的生活 | bio-k-root-absorption | flow | 土壤水和无机盐 → 根毛 → 根内运输 → 植物各部分 |
| 植物的生活 | bio-k-stem-transport | compare | 导管的水和无机盐运输，与筛管的有机物运输 |
| 植物的生活 | bio-k-leaf-structure | hierarchy | 叶片 → 表皮/叶肉/叶脉 → 各自功能 |
| 植物的生活 | bio-k-photosynthesis | flow | 光、叶绿体、二氧化碳和水 → 有机物和氧气 |
| 植物的生活 | bio-k-respiration-growth | cycle | 有机物供能 → 细胞活动与生长 → 产生可继续交换的物质 |
| 人体健康 | bio-k-reproduction-development | flow | 生殖细胞结合 → 胚胎发育 → 出生后生长发育 |
| 人体健康 | bio-k-digestion | flow | 食物摄入 → 消化分解 → 小肠吸收 → 运输利用 |
| 人体健康 | bio-k-breathing | flow | 空气进入呼吸道 → 肺部气体交换 → 氧进入血液 → 细胞利用氧 |
| 人体健康 | bio-k-circulation | cycle | 心脏泵血 → 血管运输 → 组织交换 → 血液回流 |
| 人体健康 | bio-k-urinary | flow | 血液流经肾脏 → 形成尿液 → 暂存 → 排出废物 |
| 人体健康 | bio-k-nervous-immunity | compare | 神经调节的快速反应与免疫防御的识别和保护 |
| 生态与环境 | bio-k-environment-factors | flow | 环境因素变化 → 生物反应 → 比较条件 → 有范围的解释 |
| 生态与环境 | bio-k-species-relations | compare | 竞争、捕食、合作等关系及资源利用 |
| 生态与环境 | bio-k-ecosystem-structure | hierarchy | 生态系统 → 非生物部分/生物部分 → 生产者消费者分解者 |
| 生态与环境 | bio-k-ecosystem-function | cycle | 生产者固定能量 → 消费者利用 → 分解者分解 → 物质回到环境 |
| 生态与环境 | bio-k-biosphere | hierarchy | 生物圈 → 大气圈下层/水圈/岩石圈上层 → 适宜生命的区域 |
| 生态与环境 | bio-k-ecological-security | flow | 识别压力 → 减少污染破坏 → 保护栖息地 → 持续观察 |
| 生命延续与发展 | bio-k-biological-reproduction | compare | 有性生殖与无性生殖的亲本、遗传和后代特点 |
| 生命延续与发展 | bio-k-heredity-basics | hierarchy | 细胞核 → 染色体 → DNA → 遗传信息与性状 |
| 生命延续与发展 | bio-k-variation | compare | 可遗传变异与环境影响造成的差异 |
| 生命延续与发展 | bio-k-origin-life | flow | 提出问题 → 证据与实验 → 可检验解释 → 科学边界 |
| 生命延续与发展 | bio-k-evolution-evidence | flow | 化石/比较解剖等证据 → 比较 → 演化关系推断 |
| 生命延续与发展 | bio-k-biodiversity-conservation | flow | 多样性价值 → 识别威胁 → 保护栖息地和物种 → 公众参与 |

### Task 1: 图解数据契约与失败测试

**Files:**
- Create: scripts/biology-visual-guide-contract.js
- Create: scripts/check-biology-visual-guides.test.js

**Interfaces:**
- Consumes: knowledgeItems 与 biology repository 返回的水合知识点。
- Produces: collectBiologyVisualGuideIssues({ sourceKnowledgeItems, runtimeLayers }) => string[]。

- [ ] **Step 1: 写入失败测试，覆盖合格数据和损坏数据**

    const validGuide = {
      type: 'flow', title: '观察路径', summary: '按顺序整理可观察的关系。',
      items: [
        { label: '条件', note: '先记录观察条件', tone: 'blue' },
        { label: '结论', note: '结论不超出证据范围', tone: 'green' },
      ],
    };
    const fixture = () => ({
      sourceKnowledgeItems: [{ id: 'bio-k-fixture', visualGuide: validGuide }],
      runtimeLayers: [{
        label: '知识页',
        knowledgeItems: [{ id: 'bio-k-fixture', visualGuide: JSON.parse(JSON.stringify(validGuide)) }],
      }],
    });

    assert.deepStrictEqual(collectBiologyVisualGuideIssues(fixture()), []);

测试还要克隆 fixture，分别制造缺失图解、tone: 'red'、重复节点标签、compare 缺少右侧 lane、运行时图解摘要被篡改；每项用中文错误片段断言抛出。

- [ ] **Step 2: 运行测试，确认它因为缺少模块失败**

Run: node scripts/check-biology-visual-guides.test.js  
Expected: MODULE_NOT_FOUND，指向 biology-visual-guide-contract。

- [ ] **Step 3: 实现最小纯契约函数**

    const GUIDE_TYPES = new Set(['flow', 'cycle', 'compare', 'hierarchy']);
    const GUIDE_TONES = new Set(['green', 'blue', 'amber', 'slate']);

    function collectBiologyVisualGuideIssues({ sourceKnowledgeItems = [], runtimeLayers = [] } = {}) {
      const issues = validateSourceGuides(sourceKnowledgeItems);
      runtimeLayers.forEach((layer) => issues.push(...compareRuntimeGuideLayer(sourceKnowledgeItems, layer)));
      return issues;
    }

validateSourceGuides() 逐项校验图解存在、类型、标题、摘要、2 至 5 个节点、唯一标签、合法色调、禁止 URL/HTML、lane 和 depth 类型规则。比较函数用知识点 ID 配对，以 JSON.stringify 比较完整图解，报告缺失、未登记、归属不一致和字段不一致，且不修改输入对象。

- [ ] **Step 4: 运行测试，确认契约通过**

Run: node scripts/check-biology-visual-guides.test.js  
Expected: 正常 fixture 通过；所有故意损坏 fixture 被捕获。

- [ ] **Step 5: 提交契约和测试**

    git add scripts/biology-visual-guide-contract.js scripts/check-biology-visual-guides.test.js
    git commit -m "test(biology): add visual guide contract"

### Task 2: 独立图解数据模块与前 18 个知识点

**Files:**
- Create: packages/biology/data/biology-visual-guides.js
- Modify: scripts/check-biology-visual-guides.test.js

**Interfaces:**
- Consumes: Task 1 的类型与字段规则；现有知识点稳定 ID。
- Produces: getVisualGuideForKnowledge(knowledgeId)、visualGuidesByKnowledgeId、VISUAL_GUIDE_TYPES、VISUAL_GUIDE_TONES。

- [ ] **Step 1: 为细胞、多样性、植物三个专题写数据覆盖失败断言**

    const firstHalfIds = knowledgeItems
      .filter((item) => ['bio-unit-cells', 'bio-unit-diversity', 'bio-unit-plants'].includes(item.topicId))
      .map((item) => item.id);
    assert.deepStrictEqual(
      Object.keys(visualGuidesByKnowledgeId).filter((id) => firstHalfIds.includes(id)).sort(),
      firstHalfIds.sort(),
    );

- [ ] **Step 2: 运行测试，确认数据导出尚不存在或覆盖不完整**

Run: node scripts/check-biology-visual-guides.test.js  
Expected: 因 biology-visual-guides 模块或 18 个稳定 ID 缺失而失败。

- [ ] **Step 3: 实现只读数据模块和 18 条数据**

    function clone(value) {
      return value ? JSON.parse(JSON.stringify(value)) : null;
    }

    function getVisualGuideForKnowledge(knowledgeId) {
      return clone(visualGuidesByKnowledgeId[knowledgeId]);
    }

填入“图解内容清单”前三个专题的 18 条数据。对比型节点明确 lane: 'left' 或 lane: 'right'，层级型节点标出 depth: 0、1 或 2；每个 note 不超过 42 个汉字。外层映射用 Object.freeze，查询结果深拷贝。

- [ ] **Step 4: 运行测试，确认前 18 条已完整**

Run: node scripts/check-biology-visual-guides.test.js  
Expected: 前 18 条数据完整；测试尚不要求真实知识实体已有 visualGuide，完整实体覆盖留给 Task 3。

- [ ] **Step 5: 提交前半内容**

    git add packages/biology/data/biology-visual-guides.js scripts/check-biology-visual-guides.test.js
    git commit -m "feat(biology): add visual guides for cells plants diversity"

### Task 3: 后 18 个知识点图解数据与知识实体合并

**Files:**
- Modify: packages/biology/data/biology-visual-guides.js
- Modify: packages/biology/data/biology-knowledge.js
- Modify: scripts/check-biology-visual-guides.test.js

**Interfaces:**
- Consumes: Task 2 的 getVisualGuideForKnowledge()。
- Produces: 每个 knowledgeItems 与 repository 返回对象均含独立的 visualGuide。

- [ ] **Step 1: 写入全量覆盖和克隆语义失败测试**

    assert.strictEqual(Object.keys(visualGuidesByKnowledgeId).length, 36);
    knowledgeItems.forEach((knowledge) => assert(knowledge.visualGuide, knowledge.id + ' visual guide'));
    const guide = getVisualGuideForKnowledge('bio-k-photosynthesis');
    guide.items[0].label = '篡改';
    assert.notStrictEqual(getVisualGuideForKnowledge('bio-k-photosynthesis').items[0].label, '篡改');

- [ ] **Step 2: 运行测试，确认后 18 条和实体图解尚未覆盖**

Run: node scripts/check-biology-visual-guides.test.js  
Expected: 36 覆盖率断言和 knowledge.visualGuide 断言失败。

- [ ] **Step 3: 填入后 18 条并合并进知识数据**

在 biology-knowledge.js 顶部引入查询函数，在既有 buildKnowledge() 调用前合并：

    const { getVisualGuideForKnowledge } = require('./biology-visual-guides');

    return buildKnowledge({
      ...definition,
      visualGuide: getVisualGuideForKnowledge(definition.id),
    });

按表实现人体、生态、生命延续三个专题。只有 bio-k-respiration-growth、bio-k-circulation、bio-k-ecosystem-function 使用 cycle；不得更改既有 summary、knowledgePoints、examples、coverImage 或 review 内容。

- [ ] **Step 4: 运行图解、既有生物和 repository 检查**

Run: node scripts/check-biology-visual-guides.test.js  
Run: node scripts/check-biology-content.js  
Run: node scripts/check-biology-build-contract.test.js  
Expected: 36 条图解完整；108 条例子和 6 个受控观察统计不变。

- [ ] **Step 5: 提交后半内容和合并层**

    git add packages/biology/data/biology-visual-guides.js packages/biology/data/biology-knowledge.js scripts/check-biology-visual-guides.test.js
    git commit -m "feat(biology): cover every knowledge item with visual guides"

### Task 4: 知识点页图解渲染与响应式降级

**Files:**
- Modify: packages/biology/pages/knowledge/index.js
- Modify: packages/biology/pages/knowledge/index.wxml
- Modify: packages/biology/pages/knowledge/index.wxss
- Create: scripts/check-biology-visual-guides.js

**Interfaces:**
- Consumes: knowledge.visualGuide，结构由 Tasks 1 至 3 固定。
- Produces: prepareVisualGuide(guide)，返回带 displayIndex、isLast、isSequential、isCycle 的可渲染副本。

- [ ] **Step 1: 在图解检查器中写页面语义失败断言**

    assert(wxml.includes('wx:if="{{knowledge.visualGuide}}"'), '知识页缺少图解降级分支');
    assert(wxml.includes('visual-guide--{{knowledge.visualGuide.type}}'), '知识页未保留类型样式钩子');
    assert(pageJs.includes('function prepareVisualGuide'), '知识页未预处理图解节点');
    assert(wxss.includes('.visual-guide--compare'), '样式缺少对比图布局');

- [ ] **Step 2: 运行检查，确认当前页面尚未提供图解结构**

Run: node scripts/check-biology-visual-guides.js  
Expected: 页面语义断言失败，但不会修改生产数据。

- [ ] **Step 3: 实现页面预处理和 WXML 区块**

    function prepareVisualGuide(guide) {
      if (!guide || !Array.isArray(guide.items) || !guide.items.length) return null;
      const isSequential = guide.type === 'flow' || guide.type === 'cycle';
      return {
        ...guide,
        isSequential,
        isCycle: guide.type === 'cycle',
        items: guide.items.map((item, index, items) => ({
          ...item,
          displayIndex: index + 1,
          isLast: index === items.length - 1,
        })),
      };
    }

在 loadKnowledge() 设置 knowledge 时调用预处理函数。WXML 固定放在 .explanation-section 后、.knowledge-figure 前，使用 wx:if 保护，显示序号、标签、说明；顺序型节点非末项后显示箭头，循环型末尾显示“回到起点”的纯文本提示。

- [ ] **Step 4: 实现小屏不溢出的样式**

加入 .visual-guide、.visual-guide__items、.visual-guide__item、.visual-guide__index、.visual-guide__label、.visual-guide__note、.visual-guide__connector、.visual-guide--compare、.visual-guide--hierarchy 和四个色调规则。默认单列；compare 用最小宽度为 0 的两列弹性布局；hierarchy 左缩进不超过 36rpx。禁止固定高度、文字截断、横向滚动、背景渐变和嵌套卡片。

- [ ] **Step 5: 运行页面语义和 JavaScript 语法检查**

Run: node scripts/check-biology-visual-guides.js  
Run: node scripts/check-runtime-js-syntax.js  
Expected: 有图解和无图解路径均可解析，运行时 JS 语法通过。

- [ ] **Step 6: 提交页面渲染**

    git add packages/biology/pages/knowledge/index.js packages/biology/pages/knowledge/index.wxml packages/biology/pages/knowledge/index.wxss scripts/check-biology-visual-guides.js
    git commit -m "feat(biology): render structured visual guides"

### Task 5: 接入质量矩阵、完整回归和发布前证据

**Files:**
- Modify: scripts/check-biology-content.js
- Modify: scripts/check-v1.11-quality-matrix.js
- Modify: docs/superpowers/specs/2026-08-11-biology-visual-guides-v1.12-design.md

**Interfaces:**
- Consumes: collectBiologyVisualGuideIssues() 与 check-biology-visual-guides.js 的退出状态。
- Produces: 全量质量矩阵中可重复运行的图解检查。

- [ ] **Step 1: 为既有内容检查增加图解字段断言**

    assert(knowledge.visualGuide, knowledge.id + '.visualGuide');
    assertText(knowledge.visualGuide.title, knowledge.id + '.visualGuide.title');
    assert(Array.isArray(knowledge.visualGuide.items) && knowledge.visualGuide.items.length >= 2,
      knowledge.id + '.visualGuide.items');

脚本末尾打印 36 visual guides，使持续集成显示覆盖规模。

- [ ] **Step 2: 将专用检查接入质量矩阵**

在 DEFAULT_CHECKS 的“生物内容”前增加：

    { script: 'scripts/check-biology-visual-guides.test.js', label: '生物图解契约' },
    { script: 'scripts/check-biology-visual-guides.js', label: '生物图解内容与页面' },

保持其他检查顺序和发布分支的设备证据逻辑不变。

- [ ] **Step 3: 运行目标检查和全量矩阵**

Run: node scripts/check-biology-visual-guides.test.js  
Run: node scripts/check-biology-visual-guides.js  
Run: node scripts/check-biology-content.js  
Run: node scripts/build-content-audit.js  
Run: node scripts/check-content-audit.js --require-reviewed  
Run: node scripts/check-v1.11-quality-matrix.js  
Expected: 36 个图解，948 个现有实体不意外减少；全量矩阵全绿。若矩阵数字增加，记录真实数字。

- [ ] **Step 4: 模拟器回归并记录真实结果**

在微信开发者工具分别以 iPhone 14 Pro Max 与 Nexus 5 打开“植物细胞和动物细胞”“血液循环”“生物体的结构层次”。确认对比、循环、层级均无文字溢出；封面 URL 失败时，图解仍显示。只记录实际执行的结果。

- [ ] **Step 5: 复核差异、提交并推送**

Run: git diff --check  
Run: git status --short --branch  
Run: git log --oneline -5

    git add scripts/check-biology-content.js scripts/check-v1.11-quality-matrix.js docs/superpowers/specs/2026-08-11-biology-visual-guides-v1.12-design.md
    git commit -m "test(biology): enforce visual guide coverage"
    git push -u origin codex/biology-visual-guides-v1.12

推送后汇报分支 URL、提交 ID、精确检查结果，以及仍独立等待的 v1.10.1 实体设备回归。
