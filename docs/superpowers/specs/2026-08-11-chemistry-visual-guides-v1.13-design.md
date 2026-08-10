# 化学关键图解 v1.13 设计规格

**日期：** 2026-08-11
**分支：** `codex/chemistry-visual-guides-v1.13`
**基线：** `4d4ac8e`（v1.12 生物关键图解已完成模拟器回归）

## 目标

为现有 10 个化学专题、40 个 `chem-k-*` 知识点补充原创、文本优先的结构化关键图解。图解把学生需要反复辨认的流程、分类、比较和持续关系直接展示为可阅读的节点；即使现有云端封面图暂时加载失败，化学知识页仍能完整表达关键关系。

本批只增强纯知识查阅体验，不新增测评、学习任务、打卡、错题本、账号、云同步、云图片或新导航层级。

## 范围与非目标

### 纳入

- 40 个既有化学知识点各有 1 个 `visualGuide`，覆盖率严格为 40/40。
- 支持 `flow`、`compare`、`hierarchy` 和仅在科学关系明确时使用的 `cycle` 四种语义类型。
- 把生物 v1.12 已验证的渲染逻辑提取为主包公共组件与纯预处理工具；生物页面迁移到同一组件，保持既有页面、数据和可读性行为。
- 化学知识页在“核心知识”之后、现有封面图之前展示关键图解；封面和已有文字解释继续保留。
- 建立通用图解契约、化学覆盖检查、页面语义检查和质量矩阵入口，并保持既有生物检查兼容。

### 不纳入

- 不绘制、上传或引用新的化学位图图解；原有封面图继续只是补充媒介。
- 不修改任何知识点、专题、模板、方程式、实验、云资源、收藏、路由或本地存储的稳定 ID。
- 不复制教材正文、插图、练习、解析、外部词典或网页正文；图解只用现有已复核原创内容重新组织为短语。
- 不升级现有化学来源的复核状态，不把专题框架佐证误称为逐条知识点外部证据。
- 不处理 v1.10.1 的实体设备发布门禁；该冻结线仍独立要求 iPhone、Android 实机证据。

## 数据模型

新增 `packages/chemistry/data/chemistry-visual-guides.js`，以既有知识点稳定 ID 为键保存只读图解源数据，并通过 `getVisualGuideForKnowledge(knowledgeId)` 返回深拷贝。化学实体构建层按 ID 合并图解，调用者不能篡改源数据。

```js
{
  type: 'flow', // flow | cycle | compare | hierarchy
  title: '氧气制取与检验',
  summary: '从选用反应到收集、检验的实验关系。',
  items: [
    { label: '选择反应和装置', note: '依据反应物状态和反应条件选择。', tone: 'blue' },
    { label: '检查装置气密性', note: '装置连接后先确认密闭性。', tone: 'amber' },
    { label: '收集气体', note: '按氧气的性质选择合适方法。', tone: 'green' },
    { label: '检验并记录', note: '用规范操作确认现象并记录条件。', tone: 'slate' }
  ]
}
```

字段规则：

| 字段 | 规则 |
|---|---|
| `type` | 仅允许 `flow`、`cycle`、`compare`、`hierarchy`。 |
| `title` | 非空，面向当前知识点，最多 24 个字符。 |
| `summary` | 非空，最多 72 个字符，说明读图目的而非复述整段正文。 |
| `items` | 2 至 5 个；同一图解内 `label` 唯一。 |
| `label` | 非空，最多 32 个字符。 |
| `note` | 非空，最多 96 个字符。 |
| `tone` | 仅允许 `green`、`blue`、`amber`、`slate`；只表达视觉分组，不表达正确性等级。 |
| `lane` | 只允许 `compare` 节点使用 `left` 或 `right`，两侧均至少有一个节点。 |
| `depth` | 只允许 `hierarchy` 节点使用整数 `0`、`1`、`2`；不表达学习难度。 |

所有文本不得含 URL、HTML、教材页码、长段引文或图片地址。流程、比较、层级和循环各自只表达其对应的关系，不通过颜色、排序或箭头暗示额外结论。

## 化学语义边界

- `flow` 只表示实验、判断、观察或物质变化的阅读顺序；它不等于所有节点之间都必然发生反应。需要条件的反应必须在节点说明中保留“条件”“依据”“选择”等限定。
- `compare` 只用于同一问题下可并列比较的对象，例如导电性与用途、酸与碱的共同点和差别；实验安全规则不作为对照一侧的替代品。
- `hierarchy` 只用于整体到组成、物质到类别、方法到分支等分类关系；根节点必须位于 `depth: 0`，子项不跳级。
- `cycle` 仅用于资源利用等持续关联关系，并固定显示“这些环节持续关联，不表示单一因果链。”；不默认把末项画成导致首项的因果箭头，也不写“最后一步直接导致起点”一类表述。
- 不新增或改写化学方程式。图解引用现有现象、条件、性质和实验字段时，不能省略必要条件、单位、方向、安全限制或适用范围。
- 氧气支持燃烧但本身通常不燃烧；酸碱、金属活动性、气体检验和净化操作的表述必须与当前已通过的化学准确性检查保持一致。

## 图解覆盖清单

| 知识点 ID | 类型 | 关键关系 |
|---|---|---|
| `chem-k-lab-object-change` | flow | 物质、变化、现象与证据记录 |
| `chem-k-lab-instruments` | hierarchy | 仪器按加热、量取、夹持和观察用途分类 |
| `chem-k-lab-operations` | flow | 取用、连接、检查、加热与整理操作顺序 |
| `chem-k-lab-inquiry` | flow | 问题、假设、方案、记录与结论边界 |
| `chem-k-air-composition` | hierarchy | 空气、主要成分与空气质量关注点 |
| `chem-k-oxygen-properties` | compare | 氧气的物理性质、化学性质与用途联系 |
| `chem-k-oxygen-preparation` | flow | 反应装置、气密性、收集、检验与记录 |
| `chem-k-combustion-catalyst` | compare | 燃烧、缓慢氧化与催化剂作用条件 |
| `chem-k-water-composition` | flow | 水的组成认识、实验现象与氢气检验 |
| `chem-k-water-purification` | flow | 沉降、过滤、吸附、消毒和软化的作用边界 |
| `chem-k-dissolution-solubility` | flow | 溶解、饱和、温度影响与溶解度读图 |
| `chem-k-solution-concentration` | flow | 审题、质量分数、配制、核对与表达 |
| `chem-k-particles` | hierarchy | 物质、分子、原子、离子及其尺度关系 |
| `chem-k-atomic-structure` | hierarchy | 原子核、质子、中子、核外电子与相对质量 |
| `chem-k-elements-periodic-table` | hierarchy | 元素、元素符号、类别与周期表信息 |
| `chem-k-formula-valence` | flow | 识别化合价、确定比值、书写与检查化学式 |
| `chem-k-symbols-formulas` | compare | 元素符号、化学式、化学计量数和数字含义 |
| `chem-k-mass-conservation` | flow | 反应前、反应中、反应后与守恒解释 |
| `chem-k-equations` | flow | 写出反应、配平、标注条件、检查守恒 |
| `chem-k-stoichiometry` | flow | 读题、写方程式、列比例、计算与单位核对 |
| `chem-k-carbon-allotropes` | compare | 金刚石、石墨等碳单质的结构与性质用途 |
| `chem-k-carbon-oxides` | compare | 一氧化碳与二氧化碳的性质、危害和用途 |
| `chem-k-carbon-dioxide-lab` | flow | 制取、检验、性质验证和收集记录 |
| `chem-k-fuels-energy` | flow | 燃料使用、能量转化、排放与低碳选择 |
| `chem-k-metal-properties` | flow | 金属性质、选择材料、加工和用途判断 |
| `chem-k-metal-activity` | hierarchy | 金属活动性顺序、置换反应与应用判断 |
| `chem-k-metal-extraction` | flow | 矿石、冶炼条件、金属资源和循环利用 |
| `chem-k-metal-corrosion` | flow | 锈蚀条件、观察、防护与材料维护 |
| `chem-k-indicators-ph` | flow | 指示剂现象、pH 读数、酸碱性判断与安全 |
| `chem-k-common-acids` | hierarchy | 酸的共同性质、常见酸和反应对象 |
| `chem-k-common-bases` | hierarchy | 碱的共同性质、常见碱和使用边界 |
| `chem-k-neutralization` | flow | 酸碱作用、现象判断、产物与应用 |
| `chem-k-common-salts` | hierarchy | 常见盐、用途、可溶性与使用注意 |
| `chem-k-ion-reactions` | flow | 判断反应物、生成物条件、离子检验和结论 |
| `chem-k-fertilizers` | hierarchy | 氮磷钾肥、复合肥、施用依据和环境影响 |
| `chem-k-substance-classification` | hierarchy | 单质、化合物、氧化物、酸碱盐和转化线索 |
| `chem-k-organic-basics` | compare | 有机物、无机物和有机高分子的基本特征 |
| `chem-k-materials` | compare | 天然、合成和复合材料的性质选择 |
| `chem-k-chemical-health` | flow | 元素、营养来源、均衡摄入与健康判断 |
| `chem-k-resources-environment` | cycle | 资源利用、污染防治、回收与绿色化学的持续关联 |

## 页面、组件与兼容层

新增主包公共组件 `components/structured-visual-guide/`，只接收已经预处理的 `guide`：

- 默认单列显示编号、标签和说明；`flow` 的非末项显示方向连接符。
- `compare` 通过预处理后的 `compareColumns.left`、`compareColumns.right` 形成两个明确列容器，不能依赖稀疏数据的自动排版。
- `hierarchy` 按 `depth` 使用不超过 36rpx 的固定缩进。
- `cycle` 显示持续关系提示，不渲染从末项回到首项的因果箭头。
- 所有文字允许小屏换行；组件样式不得出现固定高度、横向滚动、文本截断、渐变背景或嵌套卡片。

新增纯函数 `utils/structured-visual-guide.js`：

```js
prepareStructuredVisualGuide(guide) => preparedGuide | null
```

它深拷贝输入，并补充 `displayIndex`、`isLast`、`isSequential`、`isCycle`、`isCompare`、`compareColumns`、`cycleHint` 等仅供界面渲染的字段。现有 `packages/biology/pages/knowledge/visual-guide.js` 保留 `prepareVisualGuide` 兼容导出，并转调此通用函数；既有生物知识点、路由和页面访问结果不变。

化学知识页的顺序固定为：标题与核心知识 → **结构化关键图解** → 现有封面图及其失败降级 → 核心解释与其他内容。缺少图解的异常数据只跳过该区块，不阻塞整页；构建期 40/40 覆盖检查会阻止正式内容遗漏。

## 校验与验收

新增通用图解契约，并通过生物、化学包装函数分别校验：

1. 每个化学知识点恰好有一个合法图解，图解与运行时 repository 水合数据逐字段一致。
2. 标题、摘要、节点、色调、`lane`、`depth`、URL/HTML 禁止项和循环因果表述符合模型规则。
3. 40 个化学图解覆盖至少一组流程、比较、层级和持续关系；循环只出现于资源与环境的明确持续关联。
4. 组件对 `null`、空节点、流程、对照、层级、循环都能返回独立可渲染数据，不与冻结源数据共享可变引用。
5. 生物原有 36 个图解继续通过旧文件名下的契约与页面检查，化学页面同时具备有图解和无图解降级分支。
6. 在 `check-v1.11-quality-matrix.js` 追加“化学图解契约”和“化学图解内容与页面”两项，矩阵从 121 项增加到 123 项，不替换或放宽已有检查。
7. 运行化学准确性、内容、构建契约、页面、资源、严格内容审计、分包边界和全量质量矩阵；主包及各分包继续满足既有源码包体限制。
8. 在微信开发者工具使用 iPhone 14 Pro Max 与 Nexus 5 模拟器分别覆盖流程、比较、层级、循环各一个化学知识点，验证长文本换行、图片失败降级、前后导航、收藏和返回栈；控制台不出现项目错误。

## 验收标准

- 40/40 个现有化学知识点显示与其核心关系一致的图解，且现有正文、方程式、实验、封面和收藏行为不回归。
- 生物和化学统一使用同一渲染组件与预处理语义，生物兼容导出仍可供既有检查使用。
- 所有图解为原创短语，未引入新外部文本、图片资源、版权来源或未复核教材内容。
- 质量矩阵输出 `OK v1.11 quality matrix: 123 checks`，并通过化学专项检查与双模拟器回归。
- 不宣称 v1.10.1 已可发布；其 iPhone、Android 实机证据和最终严格门禁仍由独立发布分支完成。

## 实施顺序

1. 先以失败测试定义通用图解契约与化学覆盖需求。
2. 建立化学图解数据模块，分两批录入 40 条原创短语并合并到既有知识实体。
3. 提取通用预处理函数和公共 WXML/WXSS 组件，迁移生物页面并接入化学页。
4. 接入化学页面检查、内容检查与质量矩阵，运行全量校验。
5. 完成两个模拟器的化学图解回归，按契约、数据、界面与验证分批提交并推送分支。
