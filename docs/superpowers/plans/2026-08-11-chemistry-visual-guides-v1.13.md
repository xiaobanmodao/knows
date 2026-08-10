# 化学关键图解 v1.13 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 40 个现有化学知识点提供原创、可校验、图片失效时仍可完整阅读的结构化关键图解，并将生物的同类渲染收敛到公共组件。

**Architecture:** 化学图解独立存放在以稳定知识点 ID 为键的数据模块中，再在化学知识聚合层合并为深拷贝字段。通用契约和纯预处理函数放在主包，公共 WXML/WXSS 组件负责四种布局；生物保留原有兼容导出并迁移到这个组件，化学页只增加图解区块。

**Tech Stack:** 微信小程序 WXML/WXSS、CommonJS、Node.js assert、现有 chemistry/biology repository、现有 v1.11 质量矩阵。

## Global Constraints

- 精确覆盖 10 个专题下的 40 个既有 `chem-k-*` 知识点，每个知识点仅有一个图解。
- 图解只用现有已复核的原创摘要、核心知识、方程式条件和实验字段重新组织为短语；不复制教材正文、习题、解析、插图或网页文字。
- 不新增测评、任务、打卡、错题、账号、云同步、云图片、图片资源、新路由或第三方依赖。
- 不改变知识点、专题、模板、方程式、实验、云资源、收藏、路由、本地存储的稳定 ID 或版本。
- 图解必须在云封面加载失败时仍完整可读；小屏文字必须可换行，不能依赖图片内的小字号文本。
- 图解 `type` 仅为 `flow`、`cycle`、`compare`、`hierarchy`；节点 `tone` 仅为 `green`、`blue`、`amber`、`slate`。
- 每个图解有 2 至 5 个节点；`title`、`summary`、`label`、`note` 分别不超过 24、72、32、96 个字符，且 `label` 在同一图解中唯一。
- `compare` 的节点均有 `lane: 'left' | 'right'`，且两侧均非空；其他类型不得有 `lane`。 `hierarchy` 的节点均有 `depth: 0 | 1 | 2`，其他类型不得有 `depth`。
- `flow` 不得省略必要反应条件或暗示普遍必然反应；`cycle` 只能表示明确的持续关联，并固定显示“这些环节持续关联，不表示单一因果链。”。
- 图解不得含 URL、HTML、教材页码或长段引用；现有化学内容复核状态保持 `verified`。
- 公共组件必须接收 `readingPreferences` 并使用现有阅读显示规则；不得因组件化而失去字号或行距设置。
- 不更新冻结的 v1.10.1 发布分支；iPhone、Android 实机证据仍由该独立分支完成。

---

## File Structure

- Create: `scripts/structured-visual-guide-contract.js` — 与学科无关的图解 schema、覆盖和运行时一致性校验。
- Create: `scripts/chemistry-visual-guide-contract.js` — 化学命名包装函数，保持调用者不接触通用实现细节。
- Modify: `scripts/biology-visual-guide-contract.js` — 复用通用契约并保留 `collectBiologyVisualGuideIssues` 导出。
- Create: `scripts/check-chemistry-visual-guides.test.js` — 化学图解契约、数据覆盖、克隆和 repository 一致性测试。
- Create: `packages/chemistry/data/chemistry-visual-guides.js` — 40 条图解的唯一源数据和只读克隆查询函数。
- Modify: `packages/chemistry/data/chemistry-knowledge.js` — 按稳定 ID 为运行时知识实体合并图解。
- Modify: `scripts/check-chemistry-content.js` — 将 40/40 图解覆盖和 runtime 一致性列为化学内容门禁。
- Create: `utils/structured-visual-guide.js` — 纯渲染数据预处理，深拷贝并构造对比列与循环提示。
- Create: `components/structured-visual-guide/index.js`、`index.json`、`index.wxml`、`index.wxss` — 公共图解渲染组件。
- Modify: `packages/biology/pages/knowledge/visual-guide.js` — 保留旧函数名的兼容包装。
- Modify: `packages/biology/pages/knowledge/index.json`、`index.wxml`、`index.wxss` — 改用公共组件而不改变生物数据和页面顺序。
- Modify: `scripts/check-biology-visual-guides.js` — 将页面/样式断言指向公共组件并保留生物兼容检查。
- Modify: `packages/chemistry/pages/knowledge/index.js`、`index.json`、`index.wxml` — 在既有图像降级之前接入公共组件。
- Create: `scripts/check-chemistry-visual-guides.js` — 化学页位置、组件注册、降级和响应式语义检查。
- Modify: `scripts/check-v1.11-quality-matrix.js`、`scripts/check-v1.11-quality-matrix.test.js` — 将两个化学图解检查纳入默认 123 项矩阵。
- Modify: `docs/superpowers/specs/2026-08-11-chemistry-visual-guides-v1.13-design.md` — 补充公共组件承接阅读偏好的已核对实现细节。

## Task 1: 通用图解契约与化学失败测试

**Files:**
- Create: `scripts/structured-visual-guide-contract.js`
- Create: `scripts/chemistry-visual-guide-contract.js`
- Modify: `scripts/biology-visual-guide-contract.js`
- Create: `scripts/check-chemistry-visual-guides.test.js`

**Interfaces:**
- Consumes: `sourceKnowledgeItems: Array<{ id: string, visualGuide: object }>` 与 `runtimeLayers: Array<{ label: string, knowledgeItems: Array }>`。
- Produces: `collectStructuredVisualGuideIssues({ subjectLabel, sourceKnowledgeItems, runtimeLayers }): string[]`。
- Produces: `collectChemistryVisualGuideIssues({ sourceKnowledgeItems, runtimeLayers }): string[]`。
- Preserves: `collectBiologyVisualGuideIssues({ sourceKnowledgeItems, runtimeLayers }): string[]`。

- [x] **Step 1: 写入化学契约的失败测试**

创建 `scripts/check-chemistry-visual-guides.test.js`，先只依赖尚不存在的化学包装模块：

```js
const assert = require('assert');
const { collectChemistryVisualGuideIssues } = require('./chemistry-visual-guide-contract');

const guide = {
  type: 'flow',
  title: '实验阅读顺序',
  summary: '用顺序区分操作、观察与结论。',
  items: [
    { label: '操作条件', note: '先确认题目给出的条件。', tone: 'blue' },
    { label: '观察记录', note: '记录可直接看到的现象。', tone: 'green' },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixture() {
  return {
    sourceKnowledgeItems: [{ id: 'chem-k-fixture', visualGuide: clone(guide) }],
    runtimeLayers: [{
      label: 'repository',
      knowledgeItems: [{ id: 'chem-k-fixture', visualGuide: clone(guide) }],
    }],
  };
}

assert.deepStrictEqual(collectChemistryVisualGuideIssues(fixture()), []);

const invalidTone = fixture();
invalidTone.sourceKnowledgeItems[0].visualGuide.items[0].tone = 'red';
invalidTone.runtimeLayers[0].knowledgeItems[0].visualGuide.items[0].tone = 'red';
assert.throws(
  () => assert.deepStrictEqual(collectChemistryVisualGuideIssues(invalidTone), []),
  /色调/,
);
```

- [x] **Step 2: 运行失败测试并确认失败原因**

Run: `node scripts/check-chemistry-visual-guides.test.js`

Expected: 因 `chemistry-visual-guide-contract` 不存在而出现 `MODULE_NOT_FOUND`，而不是测试语法错误。

- [x] **Step 3: 实现最小通用 schema 校验与学科包装**

在 `scripts/structured-visual-guide-contract.js` 实现：

```js
function collectStructuredVisualGuideIssues({
  subjectLabel = '知识',
  sourceKnowledgeItems = [],
  runtimeLayers = [],
} = {}) {
  const issues = validateSourceGuides(subjectLabel, sourceKnowledgeItems);
  (Array.isArray(runtimeLayers) ? runtimeLayers : []).forEach((layer) => {
    issues.push(...compareRuntimeGuideLayer(subjectLabel, sourceKnowledgeItems, layer));
  });
  return issues;
}

module.exports = { collectStructuredVisualGuideIssues };
```

复用现有生物契约中的合法类型、色调、文本长度、URL/HTML、`lane`、`depth`、循环末尾到起点因果用语、源数据 ID 唯一性和 runtime 完整 JSON 一致性规则。校验函数不得修改输入数组或对象。

在 `scripts/chemistry-visual-guide-contract.js` 实现：

```js
const { collectStructuredVisualGuideIssues } = require('./structured-visual-guide-contract');

function collectChemistryVisualGuideIssues(options = {}) {
  return collectStructuredVisualGuideIssues({ ...options, subjectLabel: '化学' });
}

module.exports = { collectChemistryVisualGuideIssues };
```

把 `scripts/biology-visual-guide-contract.js` 改成同样的兼容包装，固定 `subjectLabel: '生物'`，导出名保持不变。

- [x] **Step 4: 扩展失败测试覆盖模型边界**

在同一测试中为下列情况分别构造独立 fixture，并用中文错误片段断言：

```js
const compareWithoutRight = {
  type: 'compare',
  title: '两类物质比较',
  summary: '比较两类物质的特征。',
  items: [
    { label: '左侧项目', note: '左列内容。', tone: 'blue', lane: 'left' },
    { label: '无右列', note: '必须归入右列。', tone: 'green' },
  ],
};
const hierarchyDepthThree = {
  type: 'hierarchy',
  title: '物质层级',
  summary: '按类别整理物质。',
  items: [
    { label: '物质', note: '最上层类别。', tone: 'slate', depth: 0 },
    { label: '错误层级', note: '层级只允许到第二层。', tone: 'amber', depth: 3 },
  ],
};
const falseCycle = {
  type: 'cycle',
  title: '资源关系',
  summary: '最后一个环节直接导致第一个环节开始。',
  items: [
    { label: '资源使用', note: '按照需要使用资源。', tone: 'blue' },
    { label: '回收处理', note: '减少对环境的影响。', tone: 'green' },
  ],
};
```

同时断言普通 `flow` 节点含 `lane`、普通 `flow` 节点含 `depth`、重复标签、超过 `title` 长度、URL、runtime 摘要被单独篡改时都返回问题。

- [x] **Step 5: 运行契约与生物回归**

Run: `node scripts/check-chemistry-visual-guides.test.js`

Expected: 正常 fixture 通过，所有故意损坏的 fixture 被捕获。

Run: `node scripts/check-biology-visual-guides.test.js`

Expected: 既有 36 条生物图解契约仍通过，兼容导出不变。

- [x] **Step 6: 提交契约底座**

```bash
git add scripts/structured-visual-guide-contract.js scripts/chemistry-visual-guide-contract.js scripts/biology-visual-guide-contract.js scripts/check-chemistry-visual-guides.test.js
git commit -m "test(chemistry): define visual guide contract"
```

## Task 2: 化学基础知识前 20 条图解数据

**Files:**
- Create: `packages/chemistry/data/chemistry-visual-guides.js`
- Modify: `scripts/check-chemistry-visual-guides.test.js`

**Interfaces:**
- Produces: `visualGuidesByKnowledgeId`、`VISUAL_GUIDE_TYPES`、`VISUAL_GUIDE_TONES`、`getVisualGuideForKnowledge(knowledgeId)`。
- Consumes: 已有 `chem-k-*` 稳定 ID；本任务不改动 `chemistry-knowledge.js`。

- [x] **Step 1: 写入前 20 条覆盖的失败断言**

向 `scripts/check-chemistry-visual-guides.test.js` 增加：

```js
const {
  getVisualGuideForKnowledge,
  visualGuidesByKnowledgeId,
} = require('../packages/chemistry/data/chemistry-visual-guides');

const foundationIds = [
  'chem-k-lab-object-change', 'chem-k-lab-instruments', 'chem-k-lab-operations',
  'chem-k-lab-inquiry', 'chem-k-air-composition', 'chem-k-oxygen-properties',
  'chem-k-oxygen-preparation', 'chem-k-combustion-catalyst', 'chem-k-water-composition',
  'chem-k-water-purification', 'chem-k-dissolution-solubility',
  'chem-k-solution-concentration', 'chem-k-particles', 'chem-k-atomic-structure',
  'chem-k-elements-periodic-table', 'chem-k-formula-valence',
  'chem-k-symbols-formulas', 'chem-k-mass-conservation', 'chem-k-equations',
  'chem-k-stoichiometry',
].sort();

assert.deepStrictEqual(Object.keys(visualGuidesByKnowledgeId).sort(), foundationIds);
assert.strictEqual(getVisualGuideForKnowledge('chem-k-unknown'), null);
```

- [x] **Step 2: 运行测试并确认数据模块尚不存在**

Run: `node scripts/check-chemistry-visual-guides.test.js`

Expected: 因 `packages/chemistry/data/chemistry-visual-guides.js` 不存在而失败。

- [x] **Step 3: 实现不可变映射与前 20 条原创图解**

模块的查询函数必须深拷贝：

```js
function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : null;
}

function getVisualGuideForKnowledge(knowledgeId) {
  return clone(visualGuidesByKnowledgeId[knowledgeId]);
}
```

按下表填入精确数据。每个分号后的短句分别是节点 `label` 与 `note`，节点按照表中顺序写入，色调从 `blue`、`green`、`amber`、`slate` 循环使用；`compare` 前两项为左列、后两项为右列，使用对应 `lane`；`hierarchy` 第一项为 `depth: 0`，后续项为 `depth: 1` 或 `depth: 2`。

| ID | type / title | 节点（label；note） |
|---|---|---|
| `chem-k-lab-object-change` | flow / 化学变化的观察 | 研究物质；关注组成、性质和变化；记录现象；区分颜色、气体、沉淀等现象；提出解释；解释要由证据支持；复核条件；结论说明适用范围 |
| `chem-k-lab-instruments` | hierarchy / 常用仪器用途 | 常用仪器；按实验任务选择；加热仪器；酒精灯等用于规范加热；量取仪器；量筒读数时视线与液面相平；夹持与观察；按器材用途规范操作 |
| `chem-k-lab-operations` | flow / 基本实验操作 | 识别药品标签；先确认名称和危险提示；连接装置；按实验要求连接并检查；检查气密性；加热或制气前确认装置密闭；整理记录；按教师要求处理器材和废弃物 |
| `chem-k-lab-inquiry` | flow / 探究证据链 | 提出问题；问题应能通过观察或实验回答；作出假设；假设要能被证据检验；设计方案；控制条件并记录操作；得出结论；结论不超出记录范围 |
| `chem-k-air-composition` | hierarchy / 空气组成线索 | 空气；多种气体组成的混合物；主要成分；氮气和氧气所占体积分数较大；少量成分；稀有气体、二氧化碳和水蒸气等；空气质量；污染物会影响健康和环境 |
| `chem-k-oxygen-properties` | hierarchy / 氧气性质与用途 | 氧气；由性质认识用途和安全；物理性质；通常为无色无味气体；化学性质；能支持燃烧但通常不燃烧；用途和安全；供给呼吸和助燃需符合条件 |
| `chem-k-oxygen-preparation` | flow / 氧气制取与检验 | 选择反应和装置；依据反应物状态和条件选择；检查气密性；装置连接后先确认密闭性；收集气体；按氧气性质选择合适方法；检验记录；用规范操作确认现象 |
| `chem-k-combustion-catalyst` | hierarchy / 氧化与催化条件 | 氧化与速率；认识反应条件和速率变化；燃烧；可燃物与氧气接触并达到着火点；缓慢氧化；进行缓慢但仍有能量变化；催化剂；改变反应速率而反应前后质量和化学性质不变 |
| `chem-k-water-composition` | flow / 水组成的证据 | 观察电解现象；在规范装置中收集气体；比较气体体积；两种气体体积比提供组成线索；检验氢气；按规范方法确认可燃性；形成结论；水由氢、氧元素组成 |
| `chem-k-water-purification` | flow / 水净化方法边界 | 沉降；除去较大不溶性杂质；过滤；分离不溶于水的固体；吸附和消毒；改善色味或杀灭部分微生物；硬水软化；降低可溶性钙镁化合物影响 |
| `chem-k-dissolution-solubility` | flow / 溶解与饱和判断 | 认识溶液；溶质均匀分散在溶剂中；达到饱和；一定温度下不能再溶解该溶质；读溶解度；注意温度和溶剂质量条件；判断变化；升降温或蒸发会改变状态 |
| `chem-k-solution-concentration` | flow / 质量分数计算 | 明确已知量；区分溶质、溶液和溶剂质量；列出质量分数；溶质质量除以溶液质量；按步骤配制；称量、溶解和转移要规范；核对表达；结果通常用百分数和条件说明 |
| `chem-k-particles` | hierarchy / 微粒认识物质 | 物质；由微观粒子构成；分子；保持物质化学性质的一种微粒；原子；化学变化中的基本微粒；离子；带电的原子或原子团 |
| `chem-k-atomic-structure` | hierarchy / 原子结构信息 | 原子；由原子核和核外电子构成；原子核；由质子和中子构成；核外电子；在核外一定区域运动；相对原子质量；主要由质子和中子质量决定 |
| `chem-k-elements-periodic-table` | hierarchy / 元素与周期表 | 元素；质子数相同的一类原子；元素符号；用规定符号表示元素；元素类别；金属、非金属和稀有气体等；周期表信息；按原子序数排列并显示规律 |
| `chem-k-formula-valence` | flow / 化学式书写检查 | 确定元素或原子团；先识别组成成分；查用化合价；正负化合价代数和为零；写出最简比；下标表示原子个数比；复核读法；检查符号、括号和下标 |
| `chem-k-symbols-formulas` | hierarchy / 化学符号含义 | 化学用语；用符号和数字表达物质信息；元素符号；表示元素或一个原子；化学式；表示物质及其组成；数字含义；前系数与右下角数字表示的对象不同 |
| `chem-k-mass-conservation` | flow / 质量守恒的解释 | 明确反应体系；比较同一封闭体系前后质量；观察反应；记录生成物和反应物变化；从原子看守恒；原子种类和数目反应前后不变；解释差异；气体逸出或进入会影响称量结果 |
| `chem-k-equations` | flow / 方程式书写步骤 | 写出反应物和生成物；依据事实写出化学式；配平原子数；只改变化学计量数；标明条件和状态；按现有规范注明必要信息；检查守恒；元素种类和数目两侧一致 |
| `chem-k-stoichiometry` | flow / 方程式计算路径 | 审清问题；确定求量和已知量；写正确方程式；先配平并确认条件；列质量比例；系数对应物质的量比例并转为质量关系；核对单位；结果与已知量和问法对应 |

- [x] **Step 4: 运行前半数据测试并验证克隆行为**

在测试中追加：

```js
const first = getVisualGuideForKnowledge('chem-k-oxygen-preparation');
const second = getVisualGuideForKnowledge('chem-k-oxygen-preparation');
assert.notStrictEqual(first, second);
assert.notStrictEqual(first.items, second.items);
first.items[0].label = '篡改';
assert.strictEqual(second.items[0].label, '选择反应和装置');
```

Run: `node scripts/check-chemistry-visual-guides.test.js`

Expected: 契约和 20 条前半数据均通过；此阶段测试不要求化学知识实体已合并图解。

- [x] **Step 5: 提交基础图解数据**

```bash
git add packages/chemistry/data/chemistry-visual-guides.js scripts/check-chemistry-visual-guides.test.js
git commit -m "feat(chemistry): add foundation visual guides"
```

## Task 3: 后 20 条图解与知识实体合并

**Files:**
- Modify: `packages/chemistry/data/chemistry-visual-guides.js`
- Modify: `packages/chemistry/data/chemistry-knowledge.js`
- Modify: `scripts/check-chemistry-visual-guides.test.js`
- Modify: `scripts/check-chemistry-content.js`

**Interfaces:**
- Consumes: Task 2 的 `getVisualGuideForKnowledge(knowledgeId)`。
- Produces: `knowledgeItems` 和 `repository.getKnowledgeById(id)` 都拥有独立 `visualGuide` 深拷贝。

- [x] **Step 1: 写入全量 40/40 与运行时覆盖的失败测试**

在 `scripts/check-chemistry-visual-guides.test.js` 引入：

```js
const { knowledgeItems } = require('../packages/chemistry/data/chemistry-knowledge');
const repository = require('../packages/chemistry/repository');

assert.strictEqual(Object.keys(visualGuidesByKnowledgeId).length, 40);
assert.strictEqual(knowledgeItems.length, 40);
knowledgeItems.forEach((knowledge) => {
  assert(knowledge.visualGuide, knowledge.id + ' must have a visual guide');
  assert.notStrictEqual(
    knowledge.visualGuide,
    getVisualGuideForKnowledge(knowledge.id),
    knowledge.id + ' guide must be cloned',
  );
});
assert.deepStrictEqual(
  collectChemistryVisualGuideIssues({
    sourceKnowledgeItems: knowledgeItems,
    runtimeLayers: [{
      label: 'repository',
      knowledgeItems: knowledgeItems.map((knowledge) => repository.getKnowledgeById(knowledge.id)),
    }],
  }),
  [],
);
```

- [x] **Step 2: 运行测试并确认后半数据和实体合并尚未完成**

Run: `node scripts/check-chemistry-visual-guides.test.js`

Expected: 40 条覆盖率或 `knowledge.visualGuide` 断言失败；失败不能来自既有方程式或实验检查。

- [x] **Step 3: 补齐后 20 条原创图解**

按下表填入 `chemistry-visual-guides.js`。每个分号后的短句分别是节点 `label` 与 `note`，色调继续在四种允许值之间循环。所有 `compare` 使用前两项 `left`、后两项 `right`；所有 `hierarchy` 使用第一个节点 `depth: 0`，其余节点使用 `depth: 1` 或 `depth: 2`。

| ID | type / title | 节点（label；note） |
|---|---|---|
| `chem-k-carbon-allotropes` | compare / 碳单质的差异 | 金刚石结构；碳原子排列方式不同；金刚石性质；硬度大且不导电；石墨结构；层状排列使层间容易滑动；石墨性质；质软且能导电并有润滑性 |
| `chem-k-carbon-oxides` | compare / 两种碳的氧化物 | 一氧化碳性质；有毒且有可燃性和还原性；一氧化碳安全；密闭或通风不良处需防中毒；二氧化碳性质；通常不燃烧也不支持燃烧；二氧化碳用途；可用于灭火等适当场景 |
| `chem-k-carbon-dioxide-lab` | flow / 二氧化碳制取检验 | 选择药品装置；按现有实验方案准备；检查气密性；制气前确认装置连接；收集气体；依据性质选择收集方法；检验记录；用石灰水等规范方法判断现象 |
| `chem-k-fuels-energy` | flow / 燃料与低碳选择 | 使用燃料；燃烧释放可利用能量；关注排放；不完全燃烧和污染物需要控制；提高利用效率；减少无效能量损失；选择低碳方式；结合具体情境节约资源 |
| `chem-k-metal-properties` | flow / 金属性质到用途 | 识别性质；光泽、导电、导热和延展性等；匹配用途；根据用途选择关键性质；考虑环境；强度、耐腐蚀和成本也会影响选择；规范回收；金属资源应合理循环利用 |
| `chem-k-metal-activity` | hierarchy / 金属活动性判断 | 金属活动性顺序；反映金属失电子能力相对强弱；与酸反应；排在氢前的金属通常能置换酸中的氢；置换反应；较活泼金属可置换较不活泼金属盐溶液中的金属；条件边界；结合金属和溶液的具体条件判断 |
| `chem-k-metal-extraction` | flow / 金属资源与冶炼 | 认识矿石；多数金属以化合物形式存在；选择冶炼方法；依据金属活动性和化合物性质；得到金属；过程要符合工艺和安全条件；循环利用；回收可减少资源消耗和污染 |
| `chem-k-metal-corrosion` | flow / 锈蚀与防护 | 观察锈蚀条件；铁与氧气和水共同作用易生锈；隔绝条件；涂油、刷漆或镀层可减慢锈蚀；选择材料；合金和防护层适合不同环境；维护检查；及时修补破损防护层 |
| `chem-k-indicators-ph` | flow / 指示剂与 pH 判断 | 使用指示剂；用颜色变化初步判断酸碱性；读取 pH；按规范比色或读数；作出判断；pH 小于 7 通常显酸性；安全处理；未知溶液不品尝不直接闻气味 |
| `chem-k-common-acids` | hierarchy / 酸的共同性质 | 酸；溶液中能电离出氢离子；与指示剂；使某些指示剂显示特定颜色；与活泼金属；在条件适当时生成氢气和盐；与碱和金属氧化物；可发生中和或生成盐和水 |
| `chem-k-common-bases` | hierarchy / 碱的共同性质 | 碱；溶液中能电离出氢氧根离子；与指示剂；使某些指示剂显示特定颜色；与酸；发生中和生成盐和水；使用边界；强碱具有腐蚀性需按规范防护 |
| `chem-k-neutralization` | flow / 中和反应判断 | 确认酸碱；从指示剂或 pH 等证据判断；发生中和；酸与碱反应生成盐和水；观察变化；现象取决于反应物和指示剂；联系应用；调节土壤或处理酸碱废液需遵守条件 |
| `chem-k-common-salts` | hierarchy / 常见盐及用途 | 盐；由金属离子或铵根离子与酸根离子构成；常见盐；氯化钠、碳酸钠、碳酸钙等；用途判断；用途取决于性质和实际条件；安全使用；化学品按标签和规范使用 |
| `chem-k-ion-reactions` | flow / 复分解与离子检验 | 判断反应物；先识别溶液中的离子；检查生成条件；生成沉淀、气体或水时可能反应；选择检验；使用特征反应和规范现象；得出结论；结论要对应观察证据 |
| `chem-k-fertilizers` | hierarchy / 化学肥料分类 | 化学肥料；为植物提供一种或多种营养元素；氮肥；主要补充氮元素；磷肥和钾肥；分别主要补充磷、钾元素；合理施用；依据土壤和作物需要避免过量 |
| `chem-k-substance-classification` | hierarchy / 物质分类线索 | 物质；先按组成是否固定分类；混合物；由多种物质组成；纯净物；组成固定可继续分类；纯净物再分类；单质、化合物和酸碱盐等按特征判断 |
| `chem-k-organic-basics` | hierarchy / 有机物与高分子 | 含碳化合物；分类要看组成和特征；有机物；多数含碳元素的化合物；无机物；有些含碳化合物不属于有机物；有机高分子；相对分子质量很大的一类有机物 |
| `chem-k-materials` | hierarchy / 材料分类与选择 | 材料；根据来源、组成和用途选择；天然材料；来自自然界并经加工使用；合成材料；通过化学方法制得；复合材料；结合多种材料优点 |
| `chem-k-chemical-health` | flow / 元素营养与健康 | 认识元素作用；人体需要多种元素维持生命活动；获取营养；食物提供不同营养元素；保持均衡；不能用单一食物替代合理膳食；科学判断；不以化学名词替代健康建议 |
| `chem-k-resources-environment` | cycle / 绿色化学持续关系 | 资源利用；按需要节约使用原料和能源；污染预防；优先从源头减少有害排放；回收处理；分类回收并规范处置废弃物；改进选择；在设计和使用中持续降低环境负担 |

- [x] **Step 4: 在聚合层合并深拷贝图解**

把 `packages/chemistry/data/chemistry-knowledge.js` 的知识数组改为：

```js
const { getVisualGuideForKnowledge } = require('./chemistry-visual-guides');

const baseKnowledgeItems = [...foundationKnowledge, ...applicationKnowledge];
const knowledgeItems = baseKnowledgeItems.map((knowledge) => ({
  ...knowledge,
  visualGuide: getVisualGuideForKnowledge(knowledge.id),
}));
```

保留 `foundationKnowledge`、`applicationKnowledge`、`getRawChemistrySections`、实验和方程式导出；不得修改知识点正文、示例、实验、方程式或 `contentMeta`。

- [x] **Step 5: 把图解覆盖写入化学内容门禁**

在 `scripts/check-chemistry-content.js` 顶部引入：

```js
const { collectChemistryVisualGuideIssues } = require('./chemistry-visual-guide-contract');
const chemistryRepository = require('../packages/chemistry/repository');
```

在已有 40 个知识点断言之后增加：

```js
assert.strictEqual(
  Object.keys(require('../packages/chemistry/data/chemistry-visual-guides').visualGuidesByKnowledgeId).length,
  knowledgeItems.length,
  'chemistry visual guide coverage',
);
assert.deepStrictEqual(
  collectChemistryVisualGuideIssues({
    sourceKnowledgeItems: knowledgeItems,
    runtimeLayers: [{
      label: 'repository',
      knowledgeItems: knowledgeItems.map((item) => chemistryRepository.getKnowledgeById(item.id)),
    }],
  }),
  [],
  'chemistry visual guides',
);
```

在 `check-chemistry-visual-guides.test.js` 断言唯一 `cycle` ID 为 `chem-k-resources-environment`，并至少各有一条 `flow`、`compare`、`hierarchy`。

- [x] **Step 6: 运行完整化学数据与准确性检查**

Run: `node scripts/check-chemistry-visual-guides.test.js`

Expected: 40 条源数据、40 条知识实体和 40 条 repository 实体完全一致，且克隆测试通过。

Run: `node scripts/check-chemistry-content.js`

Expected: 输出仍为 10 个专题、40 个知识点、12 个模板、8 个实验和 28 个方程式，并包含图解覆盖。

Run: `node scripts/check-chemistry-accuracy.js`

Expected: 方程式、条件、实验安全和既有准确性断言继续通过。

- [x] **Step 7: 提交全量化学图解数据**

```bash
git add packages/chemistry/data/chemistry-visual-guides.js packages/chemistry/data/chemistry-knowledge.js scripts/check-chemistry-visual-guides.test.js scripts/check-chemistry-content.js
git commit -m "feat(chemistry): cover all knowledge with visual guides"
```

## Task 4: 公共组件、纯预处理与生物兼容迁移

**Files:**
- Create: `utils/structured-visual-guide.js`
- Create: `components/structured-visual-guide/index.js`
- Create: `components/structured-visual-guide/index.json`
- Create: `components/structured-visual-guide/index.wxml`
- Create: `components/structured-visual-guide/index.wxss`
- Modify: `packages/biology/pages/knowledge/visual-guide.js`
- Modify: `packages/biology/pages/knowledge/index.json`
- Modify: `packages/biology/pages/knowledge/index.wxml`
- Modify: `packages/biology/pages/knowledge/index.wxss`
- Modify: `scripts/check-biology-visual-guides.js`

**Interfaces:**
- Produces: `prepareStructuredVisualGuide(guide): object | null`。
- Produces: component properties `guide: Object` and `readingPreferences: Object`。
- Preserves: `prepareVisualGuide(guide): object | null` from the biology page compatibility file.

- [x] **Step 1: 先把生物页面检查改为公共组件语义**

在 `scripts/check-biology-visual-guides.js` 把视觉标记路径从生物页面 CSS/WXML 改为：

```js
const componentDir = path.join(rootDir, 'components/structured-visual-guide');
const componentJs = fs.readFileSync(path.join(componentDir, 'index.js'), 'utf8');
const componentWxml = fs.readFileSync(path.join(componentDir, 'index.wxml'), 'utf8');
const componentWxss = fs.readFileSync(path.join(componentDir, 'index.wxss'), 'utf8');
const pageJson = fs.readFileSync(path.join(pageDir, 'index.json'), 'utf8');

assert(pageJson.includes('structured-visual-guide'), '生物页必须注册公共图解组件');
assert(wxml.includes('<structured-visual-guide guide="{{knowledge.visualGuide}}"'), '生物页必须传入图解');
assert(componentJs.includes('readingPreferences'), '公共图解组件必须接收阅读偏好');
assert(componentWxml.includes('wx:if="{{guide}}"'), '公共图解组件必须保护空图解');
assert(componentWxml.includes('guide.compareColumns.left'), '公共图解组件必须渲染左列');
assert(componentWxml.includes('guide.compareColumns.right'), '公共图解组件必须渲染右列');
assert(componentWxml.includes('guide.isSequential'), '公共图解组件必须渲染流程连接');
assert(componentWxml.includes('guide.isCycle'), '公共图解组件必须渲染循环提示');
```

保留现有的深拷贝、两个 compare 列容器、无固定高度、无横向滚动、无文字截断、无渐变的断言，但将 CSS selector 从 `.visual-guide` 改为 `.structured-visual-guide`。

- [x] **Step 2: 运行检查并确认缺失公共组件导致失败**

Run: `node scripts/check-biology-visual-guides.js`

Expected: 因 `components/structured-visual-guide/index.js` 不存在或生物页面尚未注册组件而失败。

- [x] **Step 3: 实现纯预处理函数与生物兼容包装**

创建 `utils/structured-visual-guide.js`：

```js
const CYCLE_HINT = '这些环节持续关联，不表示单一因果链。';

function cloneValue(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function prepareStructuredVisualGuide(guide) {
  if (!guide || !Array.isArray(guide.items) || !guide.items.length) return null;
  const items = guide.items.map((item, index, sourceItems) => ({
    ...cloneValue(item),
    displayIndex: index + 1,
    isLast: index === sourceItems.length - 1,
  }));
  const prepared = {
    ...cloneValue(guide),
    items,
    isSequential: guide.type === 'flow',
    isCycle: guide.type === 'cycle',
    isCompare: guide.type === 'compare',
    cycleHint: guide.type === 'cycle' ? CYCLE_HINT : '',
  };
  if (prepared.isCompare) {
    prepared.compareColumns = { left: [], right: [] };
    items.forEach((item) => {
      if (item.lane === 'left' || item.lane === 'right') {
        prepared.compareColumns[item.lane].push(item);
      }
    });
  }
  return prepared;
}

module.exports = { CYCLE_HINT, prepareStructuredVisualGuide };
```

把 `packages/biology/pages/knowledge/visual-guide.js` 改为：

```js
const { prepareStructuredVisualGuide } = require('../../../../utils/structured-visual-guide');

function prepareVisualGuide(guide) {
  return prepareStructuredVisualGuide(guide);
}

module.exports = { prepareVisualGuide };
```

此函数在未通过构建期契约的 compare 数据上不得抛出；只处理完整的合法数据，异常数据由页面 `wx:if` 跳过和构建期门禁阻断。

- [x] **Step 4: 实现公共组件**

创建 `components/structured-visual-guide/index.json`：

```json
{ "component": true }
```

创建 `index.js`，沿用 `content-block` 的阅读设置模式：

```js
const {
  DEFAULT_READING_PREFERENCES,
  buildReadingDisplayClass,
} = require('../../utils/reading-preferences');

Component({
  properties: {
    guide: { type: Object, value: null },
    readingPreferences: {
      type: Object,
      value: DEFAULT_READING_PREFERENCES,
      observer(value) {
        this.setData({ readingDisplayClass: buildReadingDisplayClass(value) });
      },
    },
  },
  data: {
    readingDisplayClass: buildReadingDisplayClass(DEFAULT_READING_PREFERENCES),
  },
});
```

创建 `index.wxml`，根节点使用 `class="structured-visual-guide structured-visual-guide--{{guide.type}} {{readingDisplayClass}}"`，并完整保留：

- `guide.isCompare` 时两个独立 `.structured-visual-guide__compare-column`，左列只循环 `guide.compareColumns.left`，右列只循环 `guide.compareColumns.right`。
- 非 compare 时循环 `guide.items`；只在 `guide.isSequential && !item.isLast` 显示 `↓`。
- `guide.isCycle` 时显示 `guide.cycleHint`。
- 节点显示 `displayIndex`、`label`、`note`；说明使用 `reading-copy--23 reading-leading--170`。

创建 `index.wxss`，从生物页迁移原有图解样式，替换选择器前缀为 `.structured-visual-guide`，并增加：

```css
@import "../../styles/reading-display.wxss";

.structured-visual-guide {
  margin-top: 34rpx;
  padding: 22rpx 0;
  border-top: 1rpx solid #dce4df;
  border-bottom: 1rpx solid #dce4df;
}
.structured-visual-guide__compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  column-gap: 20rpx;
  margin-top: 18rpx;
}
.structured-visual-guide__compare-column {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12rpx;
}
```

不得使用 `height`、`min-height`、`max-height`、`overflow-x`、`text-overflow`、`-webkit-line-clamp` 或任何渐变。层级缩进最大为 36rpx，组件内部不创建卡片容器。

- [x] **Step 5: 迁移生物知识页**

在 `packages/biology/pages/knowledge/index.json` 注册：

```json
"structured-visual-guide": "/components/structured-visual-guide/index"
```

用下列组件替换原有完整 `.visual-guide` WXML 区块，位置保持在概念说明之后、封面之前：

```xml
<structured-visual-guide
  guide="{{knowledge.visualGuide}}"
  reading-preferences="{{readingPreferences}}"
/>
```

从 `packages/biology/pages/knowledge/index.wxss` 删除只属于 `.visual-guide` 的规则；其他样式和概念说明、封面、示例、观察、安全、笔记区域不变。

- [x] **Step 6: 运行生物图解和阅读显示回归**

Run: `node scripts/check-biology-visual-guides.test.js`

Expected: `prepareVisualGuide` 仍深拷贝并输出原有 compareColumns、序号和循环提示。

Run: `node scripts/check-biology-visual-guides.js`

Expected: 36 条生物图解、公共组件结构和响应式限制全部通过。

Run: `node scripts/check-reading-display.js`

Expected: 原有阅读显示设置检查通过。

- [x] **Step 7: 提交公共渲染底座**

```bash
git add utils/structured-visual-guide.js components/structured-visual-guide packages/biology/pages/knowledge scripts/check-biology-visual-guides.js
git commit -m "refactor(content): share structured visual guide renderer"
```

## Task 5: 化学知识页集成与质量矩阵登记

**Files:**
- Modify: `packages/chemistry/pages/knowledge/index.js`
- Modify: `packages/chemistry/pages/knowledge/index.json`
- Modify: `packages/chemistry/pages/knowledge/index.wxml`
- Create: `scripts/check-chemistry-visual-guides.js`
- Modify: `scripts/check-v1.11-quality-matrix.js`
- Modify: `scripts/check-v1.11-quality-matrix.test.js`

**Interfaces:**
- Consumes: `prepareStructuredVisualGuide(knowledge.visualGuide)`、公共 `structured-visual-guide` 组件、40 条化学图解。
- Produces: 化学页的 `knowledge.visualGuide` 预处理副本；默认矩阵新增两条化学图解检查。

- [x] **Step 1: 写入化学页面语义检查**

创建 `scripts/check-chemistry-visual-guides.js`，先读取化学页面 JS、WXML、JSON 和公共组件，包含以下断言：

```js
assert(pageJs.includes("require('../../../../utils/structured-visual-guide')"), '化学页必须预处理图解');
assert(pageJs.includes('prepareStructuredVisualGuide(knowledge.visualGuide)'), '化学页必须生成渲染副本');
assert(pageJson.includes('structured-visual-guide'), '化学页必须注册公共图解组件');
assert(wxml.includes('<structured-visual-guide'), '化学页必须渲染公共图解组件');
assert(wxml.includes('guide="{{knowledge.visualGuide}}"'), '化学页必须传入预处理图解');
assert(wxml.includes('reading-preferences="{{readingPreferences}}"'), '化学图解必须承接阅读设置');
assert(
  wxml.indexOf('<structured-visual-guide') < wxml.indexOf('class="knowledge-figure'),
  '化学图解必须在云封面图之前显示',
);
assert(componentWxml.includes('wx:if="{{guide}}"'), '公共图解组件必须提供空数据降级');
```

同时检查 `knowledge-figure__fallback` 文案仍存在，确保图像失败时的既有文字降级没有删除。

- [x] **Step 2: 运行页面检查并确认当前化学页未接入图解**

Run: `node scripts/check-chemistry-visual-guides.js`

Expected: 因化学页没有导入预处理函数、没有组件注册或没有 WXML 区块而失败。

- [x] **Step 3: 接入化学页**

在 `packages/chemistry/pages/knowledge/index.js` 顶部引入：

```js
const { prepareStructuredVisualGuide } = require('../../../../utils/structured-visual-guide');
```

在 `loadKnowledge` 中，`splitKnowledgeSections` 后计算：

```js
const visualGuide = prepareStructuredVisualGuide(knowledge.visualGuide);
```

并在首次 `setData` 的 `knowledge` 对象中加入：

```js
visualGuide,
```

在 `packages/chemistry/pages/knowledge/index.json` 添加公共组件注册。在核心知识区块之后、`<view wx:if="{{knowledge.hasCoverImage}}" class="knowledge-figure ...">` 之前添加：

```xml
<structured-visual-guide
  guide="{{knowledge.visualGuide}}"
  reading-preferences="{{readingPreferences}}"
/>
```

不要改变封面获取、`coverImageLoadFailed`、实验/方程式 focus、收藏、笔记、相邻导航或详情展开状态。

- [x] **Step 4: 将两项新检查写入质量矩阵**

先在 `scripts/check-v1.11-quality-matrix.test.js` 添加：

```js
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-chemistry-visual-guides.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-chemistry-visual-guides.js'));
assert.strictEqual(defaultCommands.length, 123, '默认质量矩阵必须保持 123 项');
```

此时运行测试应因默认数组仍是 121 项而失败。随后在 `scripts/check-v1.11-quality-matrix.js` 的化学内容检查附近插入：

```js
{ script: 'scripts/check-chemistry-visual-guides.test.js', label: '化学图解契约' },
{ script: 'scripts/check-chemistry-visual-guides.js', label: '化学图解内容与页面' },
```

不得移除、替换或重新排序现有检查。契约测试会自动被“scripts 目录所有 .test.js 均纳入矩阵”的断言覆盖。

- [x] **Step 5: 运行页面、矩阵契约和专项检查**

Run: `node scripts/check-chemistry-visual-guides.js`

Expected: 化学页在封面前显示结构化图解，公共组件和图片失败降级均可被静态检查确认。

Run: `node scripts/check-v1.11-quality-matrix.test.js`

Expected: 默认检查数量为 123，两个化学图解脚本均已登记。

Run: `node scripts/check-chemistry-pages.js`

Expected: 既有化学专题、知识页、模板页和内容块语义继续通过。

- [x] **Step 6: 提交页面和矩阵接入**

```bash
git add packages/chemistry/pages/knowledge scripts/check-chemistry-visual-guides.js scripts/check-v1.11-quality-matrix.js scripts/check-v1.11-quality-matrix.test.js
git commit -m "feat(chemistry): render structured visual guides"
```

## Task 6: 全量校验、差异审计与模拟器回归

**Files:**
- Modify: `docs/superpowers/specs/2026-08-11-chemistry-visual-guides-v1.13-design.md`
- Modify: `docs/superpowers/plans/2026-08-11-chemistry-visual-guides-v1.13.md`

**Interfaces:**
- Consumes: Tasks 1 至 5 的内容、组件与质量矩阵。
- Produces: 可复现的验证证据和 v1.13 分支提交；不创建 RC、标签或正式发布申请。

- [x] **Step 1: 运行分层 Node 校验**

Run in order:

```bash
node scripts/check-chemistry-visual-guides.test.js
node scripts/check-chemistry-visual-guides.js
node scripts/check-chemistry-content.js
node scripts/check-chemistry-accuracy.js
node scripts/check-chemistry-build-contract.test.js
node scripts/check-chemistry-pages.js
node scripts/check-chemistry-assets.js
node scripts/check-biology-visual-guides.test.js
node scripts/check-biology-visual-guides.js
node scripts/check-reading-display.js
node scripts/build-content-audit.js
node scripts/check-content-audit.js --require-reviewed
node scripts/check-package-boundaries.js
```

Expected: 40 条化学图解、36 条生物图解、既有 28 个方程式和 8 个实验均通过；严格内容审计、分包边界和阅读显示没有回归。

- [x] **Step 2: 构建内容差异并运行全量矩阵**

Run:

```bash
node scripts/check-content-diff.js
node scripts/check-v1.11-quality-matrix.js
```

Expected: 内容差异只包含本批图解字段、公共组件和检查脚本的可解释修改；全量输出为 `OK v1.11 quality matrix: 123 checks`。若内容来源跟进检查报告数学外部目录仍被阻塞，保留该状态，不修改来源门禁或伪造证据。

- [x] **Step 3: 在微信开发者工具完成两种模拟器回归**

打开本工作树项目 `/Users/hht/Desktop/knows/.worktrees/chemistry-visual-guides-v1.13`，分别切换至 iPhone 14 Pro Max 与 Nexus 5。两台都执行：

1. 从化学首页进入 `chem-k-oxygen-preparation`，确认流程箭头、操作条件和云封面失败文字降级同时可见。
2. 搜索或进入 `chem-k-carbon-oxides`，确认一氧化碳/二氧化碳左右列不重叠、长文字换行。
3. 进入 `chem-k-substance-classification`，确认层级缩进不超过屏幕、节点不裁切。
4. 进入 `chem-k-resources-environment`，确认显示持续关系提示而没有“末项导致首项”的箭头。
5. 调整阅读显示为较大字体和舒展行距，确认图解文字随设置变化。
6. 收藏一个图解页、打开相邻知识点、返回化学页再进入收藏，确认收藏、返回栈和页面导航正常。
7. 查看开发者工具控制台，记录项目错误为 0；已知远程封面未配置时只接受已有 `STORAGE_FILE_NONEXIST` 降级警告，不能接受页面异常或脚本错误。

把实际完成的设备、页面、结果和云图降级状态写入本计划末尾的“验证记录”小节。此记录只能描述实际执行的模拟器结果，不替代 v1.10.1 的实体设备证据。

- [ ] **Step 4: 审核差异、提交验证文档并推送**

Run:

```bash
git diff --check
git status --short
git log --oneline -6
```

确认只有本分支的规格、计划、图解数据、公共组件、两科学习页和检查脚本被修改。随后：

```bash
git add docs/superpowers/specs/2026-08-11-chemistry-visual-guides-v1.13-design.md docs/superpowers/plans/2026-08-11-chemistry-visual-guides-v1.13.md
git commit -m "docs(chemistry): record visual guide regression"
git push -u origin codex/chemistry-visual-guides-v1.13
```

## Verification Record

### 2026-08-11

**Node 与构建校验**

- `node scripts/check-v1.11-quality-matrix.js` 以默认顺序完整通过，末行输出为 `OK v1.11 quality matrix: 123 checks`。
- 矩阵中的化学专项检查确认 5 个主题、10 个专题、40 个知识点、12 个方法、8 个实验和 28 个方程式；化学图解契约与页面语义检查均通过。生物 36 个图解的兼容检查继续通过。
- 严格内容审计、分包边界、阅读显示、内容路由、搜索索引、内容差异和图片降级检查均由同一轮矩阵通过。内容差异报告为 `+115 ~833 -0`，无删除项；内容来源跟进仍如实保持 `blocked`，下一批仍是 `math-chapters-v1.11`。
- 路线文档一致性与矩阵契约均通过，确认默认门禁已从 121 项同步为 123 项并登记两项化学图解检查。

**模拟器回归**

- iPhone 14 Pro Max：从化学目录实际打开了 `chem-k-oxygen-preparation`、`chem-k-carbon-oxides`、`chem-k-substance-classification` 和 `chem-k-resources-environment`；流程、对照、层级、持续关系文案均可读。大字与舒展行距能够应用到图解；收藏开关和返回栈正常。已加载正确 AppID 的原始项目实例中未出现页面脚本错误，仅见开发者工具的预加载、性能和 `reportRealtimeAction` 提示。
- Nexus 5：再次覆盖上述四类图解，确认流程节点、对照两侧、层级节点和固定提示“这些环节持续关联，不表示单一因果链。”均未裁切。大字与舒展行距可用；相邻知识点、收藏夹重新打开和取消收藏均正常。云封面未加载时显示“图示暂未加载，完整文字知识仍可继续阅读”，页面没有空白内容区。
- Nexus 5 的“已有项目直接打开”入口没有把已有 AppID 传入开发者工具运行参数，控制台出现 `webapi_getwxaasyncsecinfo:fail appid missing`。`project.config.json` 中的 `wxb10a8a067e2709e9` 未被修改；这是一条开发者工具重新打开项目时的框架环境错误，不是页面源码异常。本次不把该实例记为“控制台零错误”证据。

**未执行的动作**

- 未进行 iPhone 或 Android 实体机回归、体验版预览、上传、RC/标签创建、审核提交或正式发布。
- 因而 v1.10.1 的实体设备证据与严格发布门禁仍由独立发布分支负责，本分支不宣称可发布。
