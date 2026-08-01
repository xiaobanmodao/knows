# v1.7 多学科扩展底座与化学基础包实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把知识通从三科硬编码改造成可声明式扩展的多学科架构，并交付一个具备完整浏览、搜索、参考索引、收藏、笔记、阅读设置和云图降级能力的初中化学知识包。

**Architecture:** 主包中的 `data/subject-manifest.js` 保存轻量运行时能力，构建脚本通过 `scripts/subject-adapters/` 读取各分包全文数据。化学以五个课标主题和十个知识专题组织，不使用未经核准的教材章号作为 ID；完整数据与四个页面留在 `packages/chemistry/` 普通分包。

**Tech Stack:** 微信小程序原生 WXML/WXSS/JavaScript、CommonJS 静态数据模块、Node.js 构建检查、微信云存储、PNG 云资源。

## Global Constraints

- Development branch is exactly `codex/chemistry-foundation-v1.7`; baseline is `9eec489`; development version is `1.7.0-dev.1`.
- Keep `codex/reference-indexes-v1.6` unchanged; do not merge chemistry code into the v1.6 review build.
- Preserve every existing math, English, and physics stable ID, storage key, cloud path, and user record target.
- Main package must not require any full subject data; subject packages must not require each other.
- Local content schema remains version `4`; backup format remains version `1`.
- Chemistry remains hidden until all content, routes, indexes, assets, and package checks pass in the same commit.
- Chemistry content contains no quiz, checkpoint, finish criteria, output task, answer submission, score, progress, login, or cloud sync.
- Chemistry totals at activation are exactly 5 curriculum themes, 10 topics, 40 knowledge items, 12 method templates, and at least 8 unique experiments and 24 unique equations.
- Every chemistry knowledge item contains at least three knowledge points, one original worked example, one boundary/condition statement, two valid related IDs, and verified review metadata.
- Every chemistry experiment uses purpose, apparatus, steps, phenomenon, conclusion, errors, and safety; every equation contains equation, condition, phenomenon or interpretation, and a unique `equationId`.
- `chem-k-lab-object-change` owns chemistry's research object, experimental/model methods, development, and chemistry-technology-society-environment connections; `chem-k-lab-inquiry` owns the inquiry cycle, evidence, reflection, scientific attitude, and responsibility.
- `chem-k-substance-classification` explicitly covers synthesis, decomposition, displacement, and double-displacement reaction types; `chem-k-resources-environment` explicitly covers need-design-evaluate-improve engineering flow, scientific ethics, legal norms, and chemical/food/medicine safety awareness.
- Keep hydrogen, carbon monoxide, atomic structure, periodic-table, carbon-material, metal-extraction, pH, ion-reaction, and organic-content explanations at the junior-high “initial, simple, common” boundary; exclude mole concentration, ionic equations/equilibria, logarithmic pH/titration, electron configurations, electrochemistry, thermochemistry/kinetics, organic mechanisms, and complex metallurgy.
- Topic cover sources are exactly `1280 x 900`; compressed cloud files are no larger than `200KB`; text remains complete when every image fails.
- Main package compressed target remains below `700KiB`; chemistry package target is below `1MB`.
- Do not claim an unverified 2026 PEP chemistry chapter order; future textbook alignment is additive `textbookMappings` only.

---

## File Map

- `data/subject-manifest.js`: lightweight runtime registry, routes, types, reference capabilities, counts, and backward-compatible count aliases.
- `utils/content-routes.js`: derives runtime routes from the manifest.
- `utils/local-backup.js`: validates subject IDs from the manifest without a hard-coded three-subject set.
- `utils/note-filter.js`: builds subject filters from active manifest entries.
- `scripts/subject-adapters/*.js`: one build adapter per subject.
- `scripts/search-index-builder.js`: combines adapter-provided search entries.
- `scripts/reference-index-builder.js`: combines adapter-provided reference entries and generated kind metadata.
- `scripts/content-manifest.js`: combines adapter-provided manifest entities.
- `packages/chemistry/data/*.js`: curriculum themes, topics, knowledge, templates, and review metadata.
- `packages/chemistry/repository.js`: package-local query and navigation API.
- `packages/chemistry/pages/**`: subject, topic, knowledge, and method pages.
- `components/content-block/**`: shared equation, safety, and comparison renderers.
- `assets/figures/generated/chemistry/**`: original chemistry cover and diagram sources.
- `scripts/check-chemistry-*.js`: structural, accuracy, and page checks.

## Canonical Chemistry IDs

### Themes

```text
chem-theme-inquiry       科学探究与化学实验
chem-theme-properties    物质的性质与应用
chem-theme-structure     物质的组成与结构
chem-theme-change        物质的化学变化
chem-theme-society       化学与社会·跨学科实践
```

### Topics And Knowledge

```text
chem-topic-lab
  chem-k-lab-object-change       化学研究对象与物质变化
  chem-k-lab-instruments         常用仪器及用途
  chem-k-lab-operations          药品取用、加热和连接装置
  chem-k-lab-inquiry             科学探究与实验记录

chem-topic-air-oxygen
  chem-k-air-composition         空气的组成与空气质量
  chem-k-oxygen-properties       氧气的性质与用途
  chem-k-oxygen-preparation      氧气的实验室制取
  chem-k-combustion-catalyst     燃烧、缓慢氧化与催化剂

chem-topic-water-solution
  chem-k-water-composition       水的组成与氢气
  chem-k-water-purification      水的净化与硬水软化
  chem-k-dissolution-solubility  溶解、饱和溶液与溶解度
  chem-k-solution-concentration  溶质质量分数与溶液配制

chem-topic-particles-elements
  chem-k-particles               分子、原子与离子
  chem-k-atomic-structure        原子结构与相对原子质量
  chem-k-elements-periodic-table 元素与元素周期表
  chem-k-formula-valence         化合价与化学式

chem-topic-language-conservation
  chem-k-symbols-formulas        化学符号、式量与数字含义
  chem-k-mass-conservation       质量守恒定律
  chem-k-equations               化学方程式的书写与配平
  chem-k-stoichiometry           根据化学方程式计算

chem-topic-carbon-fuels
  chem-k-carbon-allotropes       碳单质的多样性
  chem-k-carbon-oxides           一氧化碳与二氧化碳
  chem-k-carbon-dioxide-lab      二氧化碳的制取、检验与用途
  chem-k-fuels-energy            燃料、能量与低碳生活

chem-topic-metals
  chem-k-metal-properties        金属的物理性质与用途
  chem-k-metal-activity          金属活动性顺序及应用
  chem-k-metal-extraction        金属资源与冶炼
  chem-k-metal-corrosion         金属锈蚀与防护

chem-topic-acids-bases
  chem-k-indicators-ph           酸碱指示剂与 pH
  chem-k-common-acids            常见酸的性质
  chem-k-common-bases            常见碱的性质
  chem-k-neutralization          中和反应及应用

chem-topic-salts-fertilizers
  chem-k-common-salts            常见盐及其用途
  chem-k-ion-reactions           复分解反应与常见离子检验
  chem-k-fertilizers             化学肥料的种类与合理使用
  chem-k-substance-classification 物质分类与物质间转化

chem-topic-materials-environment
  chem-k-organic-basics          有机物与有机高分子
  chem-k-materials               天然材料、合成材料与复合材料
  chem-k-chemical-health         化学元素、营养与人体健康
  chem-k-resources-environment   资源利用、污染防治与绿色化学
```

### Templates

```text
chem-tpl-observation          实验现象观察与规范描述
chem-tpl-instrument-reading   仪器选择、量取与读数
chem-tpl-gas-apparatus        气体发生装置选择
chem-tpl-gas-collection-test  气体收集、检验与验满
chem-tpl-valence-formula      根据化合价书写化学式
chem-tpl-equation-balancing   化学方程式书写与配平
chem-tpl-mass-conservation    质量守恒的微观解释
chem-tpl-stoichiometry        化学方程式计算
chem-tpl-solubility-curve     溶解度曲线读取
chem-tpl-mass-fraction        溶质质量分数计算
chem-tpl-solution-preparation 一定质量分数溶液配制
chem-tpl-experiment-design    控制变量与实验方案评价
```

### Experiments

```text
chem-exp-coarse-salt              粗盐中难溶性杂质的去除
chem-exp-oxygen                  氧气的实验室制取与性质
chem-exp-carbon-dioxide           二氧化碳的实验室制取与性质
chem-exp-metals                   常见金属的物理性质和化学性质
chem-exp-acids-bases              常见酸、碱的化学性质
chem-exp-sodium-chloride-solution 一定溶质质量分数的氯化钠溶液的配制
chem-exp-water-composition        水的组成及变化探究
chem-exp-combustion-conditions    燃烧条件的探究
```

---

### Task 1: Runtime Subject Capability Registry

**Files:**
- Modify: `data/subject-manifest.js`
- Modify: `utils/content-routes.js`
- Modify: `utils/local-backup.js`
- Modify: `utils/note-filter.js`
- Create: `scripts/check-subject-registry.js`
- Modify: `scripts/check-content-routes.js`
- Modify: `scripts/check-local-backup.js`
- Modify: `scripts/check-note-filters.js`

**Interfaces:**
- Produces: `getSubjectRegistry({ includeBuilding = false })`, `getSubjectMeta(subjectId, { includeBuilding = false })`, `getSubjectIds(options)`, `getSubjectRoutes(subjectId, options)`.
- Preserves: `SUBJECT_LABELS`, `SUBJECT_MANIFEST`, `FEATURED_MATH_CHAPTERS`, top-level `chapterCount`, `unitCount`, `knowledgeCount`, and other existing count aliases returned by getters.

- [ ] **Step 1: Write the failing registry check**

Create assertions that every subject has unique `id`, `packageRoot`, nonempty `packagePages`, exact route keys matching `contentTypes`, and nonnegative integer `counts`; assert `getSubjectRegistry()` excludes a synthetic building record while `{ includeBuilding: true }` includes it. Assert all compatibility count aliases equal the corresponding `counts` value.

```js
assert.deepStrictEqual(
  getSubjectRegistry().map((item) => item.id),
  ['math', 'english', 'physics'],
);
getSubjectRegistry({ includeBuilding: true }).forEach((subject) => {
  assert.strictEqual(subject.knowledgeCount, subject.counts.knowledge || 0);
  assert.deepStrictEqual(Object.keys(subject.routes).sort(), [...subject.contentTypes].sort());
});
```

- [ ] **Step 2: Run the new check and verify failure**

Run: `node scripts/check-subject-registry.js`

Expected: FAIL because current manifest has no `counts`, `routes`, `packagePages`, or `contentTypes`.

- [ ] **Step 3: Add the lightweight registry fields**

For math, English, and physics, move numeric values into `counts`, add the currently configured package pages, route map, content types, and reference kinds. Add a hydration helper with these exact compatibility aliases:

```js
const COUNT_ALIASES = {
  book: 'bookCount',
  chapter: 'chapterCount',
  unit: 'unitCount',
  topic: 'topicCount',
  knowledge: 'knowledgeCount',
  template: 'templateCount',
  vocabulary: 'vocabularyCount',
  grammar: 'grammarCount',
  example: 'exampleCount',
  experiment: 'experimentCount',
};
```

`getSubjectRegistry()` returns cloned and hydrated active records. `getSubjectRegistry({ includeBuilding: true })` returns all hydrated records. `getSubjectMeta()` falls back to math only when the requested record is absent from the selected visibility set.

- [ ] **Step 4: Derive routes and local legal subject IDs**

Replace `PACKAGE_ROUTES` with a derived export built from active manifest records. Build backup validation and note subject filters from `getSubjectIds()`. Do not change content schema version or backup version.

- [ ] **Step 5: Run focused compatibility checks**

Run:

```bash
node scripts/check-subject-registry.js
node scripts/check-content-routes.js
node scripts/check-local-backup.js
node scripts/check-note-filters.js
```

Expected: all PASS; existing math, English, and physics routes are byte-for-byte identical.

- [ ] **Step 6: Commit the runtime registry**

```bash
git add data/subject-manifest.js utils/content-routes.js utils/local-backup.js utils/note-filter.js scripts/check-subject-registry.js scripts/check-content-routes.js scripts/check-local-backup.js scripts/check-note-filters.js
git commit -m "refactor(subjects): centralize runtime capabilities"
```

### Task 2: Build-Time Subject Adapters

**Files:**
- Create: `scripts/subject-adapters/math.js`
- Create: `scripts/subject-adapters/english.js`
- Create: `scripts/subject-adapters/physics.js`
- Create: `scripts/subject-adapters/index.js`
- Create: `scripts/check-subject-adapters.js`
- Modify: `scripts/search-index-builder.js`
- Modify: `scripts/reference-index-builder.js`
- Modify: `scripts/content-manifest.js`
- Regenerate: `data/search-index.js`
- Regenerate: `data/reference-index.js`

**Interfaces:**
- Each adapter exports exactly `subjectId`, `getManifestEntities()`, `buildSearchEntries(makeEntry)`, `buildReferenceEntries()`, and `validate()`.
- `getManifestEntities()` returns `{ type, entities }[]`.
- `buildSearchEntries()` returns canonical search entries after using the provided `makeEntry` helper.
- `buildReferenceEntries()` returns expanded reference records, not compressed generated rows.

- [ ] **Step 1: Capture current generated hashes and counts**

Run:

```bash
node -e "const s=require('./data/search-index');const r=require('./data/reference-index');console.log(s.SEARCH_INDEX_META.sourceHash,s.SEARCH_INDEX_META.entryCount,r.REFERENCE_INDEX_META.sourceHash,r.REFERENCE_INDEX_META.entryCount)"
```

Store the four printed values in the implementation report. They are the post-refactor equality oracle.

- [ ] **Step 2: Write the failing adapter check**

Assert adapter subject IDs equal `getSubjectIds({ includeBuilding: true })` for subjects with `status !== 'building'`, every adapter method exists, search keys are unique, manifest entity IDs are nonempty, and reference records use declared kinds.

```js
const REQUIRED = ['getManifestEntities', 'buildSearchEntries', 'buildReferenceEntries', 'validate'];
adapters.forEach((adapter) => REQUIRED.forEach((name) => {
  assert.strictEqual(typeof adapter[name], 'function', `${adapter.subjectId}.${name}`);
}));
```

- [ ] **Step 3: Run the check and verify failure**

Run: `node scripts/check-subject-adapters.js`

Expected: FAIL because `scripts/subject-adapters/index.js` does not exist.

- [ ] **Step 4: Extract the three adapters without changing data semantics**

Move each subject-specific block from `search-index-builder.js`, `reference-index-builder.js`, and `content-manifest.js` into its adapter. Keep entry order math, English, physics and keep all title, subtitle, token, container, and focus rules unchanged.

`scripts/subject-adapters/index.js` exports this exact ordered array:

```js
module.exports = [
  require('./math'),
  require('./english'),
  require('./physics'),
];
```

- [ ] **Step 5: Make builders iterate adapters**

`buildSearchIndex()` flattens `adapter.buildSearchEntries(makeEntry)`. `buildReferenceIndex()` flattens `adapter.buildReferenceEntries()`. `buildContentManifest()` calls `addEntities()` for every `{ type, entities }` group. Subject codes come from the active manifest; kind codes and per-kind subject metadata come from declared `referenceKinds` plus materialized records while retaining the current three-subject order. English word and grammar counts continue to come from manifest vocabulary/grammar counts and their rows continue to be reused from the search index, so 420 duplicate rows are not added to `data/reference-index.js`.

- [ ] **Step 6: Rebuild indexes and prove no semantic change**

Run:

```bash
node scripts/build-search-index.js
node scripts/build-reference-index.js
node scripts/check-subject-adapters.js
node scripts/check-search-index.js
node scripts/check-reference-index.js
node scripts/check-content-diff.js
```

Expected: all PASS; the four hash/count values equal Step 1.

- [ ] **Step 7: Commit the build adapters**

```bash
git add scripts/subject-adapters scripts/check-subject-adapters.js scripts/search-index-builder.js scripts/reference-index-builder.js scripts/content-manifest.js data/search-index.js data/reference-index.js
git commit -m "refactor(build): add subject content adapters"
```

### Task 3: Chemistry Themes, Topics, Templates, And First 20 Knowledge Items

**Files:**
- Create: `packages/chemistry/data/content-review-meta.js`
- Create: `packages/chemistry/data/chemistry-builders.js`
- Create: `packages/chemistry/data/chemistry-themes.js`
- Create: `packages/chemistry/data/chemistry-topics.js`
- Create: `packages/chemistry/data/chemistry-templates.js`
- Create: `packages/chemistry/data/chemistry-knowledge-foundations.js`
- Create: `packages/chemistry/data/chemistry-knowledge.js`
- Create: `scripts/check-chemistry-foundations.js`

**Interfaces:**
- `chemistry-themes.js` exports `themes` with the 5 canonical theme IDs.
- `chemistry-topics.js` exports `topics` with the 10 canonical topic IDs and exact knowledge/template references.
- `chemistry-templates.js` exports `templates` with the 12 canonical template IDs.
- `chemistry-knowledge-foundations.js` exports the first 20 knowledge items, from `chem-k-lab-object-change` through `chem-k-stoichiometry`.
- Builders add `subjectId: 'chemistry'` and cloned verified `contentMeta` to every entity.

- [ ] **Step 1: Write the failing foundation content check**

Assert 5 themes, 10 topics, 12 templates, and 20 foundation knowledge items; assert exact canonical IDs; reject fields named `checkpoint`, `checkpoints`, `finishCriteria`, `outputTask`, `quiz`, `problems`, `score`, or `progress` recursively.

```js
assert.strictEqual(themes.length, 5);
assert.strictEqual(topics.length, 10);
assert.strictEqual(templates.length, 12);
assert.strictEqual(foundationKnowledge.length, 20);
```

- [ ] **Step 2: Run the check and verify failure**

Run: `node scripts/check-chemistry-foundations.js`

Expected: FAIL because the chemistry data modules do not exist.

- [ ] **Step 3: Implement review metadata and builders**

Use `status: 'verified'`, `reviewedAt: '2026-08-01'`, and source keys `moe-chemistry-2022`, `moe-textbook-catalog-2024`, and `pep-chemistry-training-2024`. The builder must reject missing `id`, `title`, or parent ID during module load.

- [ ] **Step 4: Author all five themes and ten topic shells**

Use the canonical IDs and titles above. Assign `gradeBands: ['九年级']`, stable semantic `themeId`, four exact `knowledgeIds`, one or more exact `templateIds`, a nonempty objective, keywords, and `textbookMappings: []`.

- [ ] **Step 5: Author all twelve method templates**

Each template contains nonempty `summary`, at least three `keywords`, at least two `cues`, at least four ordered `steps`, at least two `pitfalls`, one fully worked original example, and a cloud figure path under `/assets/figures/generated/chemistry/templates/<templateId>.png`.

- [ ] **Step 6: Author the first twenty knowledge items**

Write the exact first five topics from the canonical list. Every item contains `summary`, `tags`, `keywords`, at least three `knowledgePoints`, sections, template IDs, two related IDs, cover image, and review metadata. Include these four foundation experiments exactly once as primary sections:

```text
chem-exp-oxygen
chem-exp-sodium-chloride-solution
chem-exp-water-composition
chem-exp-combustion-conditions
```

Include at least ten unique equation blocks. Equations use plain searchable formula text such as `2H2O2 -> 2H2O + O2↑`; Unicode decoration may be added only as a separate display field.

Apply the curriculum responsibility and junior-high boundary rules from Global Constraints verbatim. In particular, do not let the first five topics drift into hydrogen-energy engineering, electron configurations, periodic-law derivation, ionic equations, mole concentration, limiting reagents, or yield calculations.

- [ ] **Step 7: Run the foundation check**

Run: `node scripts/check-chemistry-foundations.js`

Expected: PASS with `5 themes, 10 topics, 12 templates, 20 foundation knowledge items`.

- [ ] **Step 8: Commit the foundation data**

```bash
git add packages/chemistry/data scripts/check-chemistry-foundations.js
git commit -m "feat(chemistry): add curriculum foundation data"
```

### Task 4: Remaining 20 Chemistry Knowledge Items And Accuracy Gates

**Files:**
- Create: `packages/chemistry/data/chemistry-knowledge-applications.js`
- Modify: `packages/chemistry/data/chemistry-knowledge.js`
- Create: `scripts/check-chemistry-content.js`
- Create: `scripts/check-chemistry-accuracy.js`
- Modify: `scripts/check-content-review-meta.js`
- Modify: `scripts/check-content-schema.js`

**Interfaces:**
- `chemistry-knowledge.js` exports one ordered `knowledgeItems` array of exactly 40 entries.
- `getChemistryExperiments()` returns unique experiment sections by `experimentId`.
- `getChemistryEquations()` returns unique equation sections by `equationId`.

- [ ] **Step 1: Write the failing complete-content check**

Assert exact counts, all topic references, two-way related references, section type fields, no forbidden task fields, and unique IDs. Assert every topic has four knowledge items and every knowledge item has at least one `example` section.

- [ ] **Step 2: Write the failing accuracy check**

The check must parse ASCII chemical formulas, verify equation-side element counts for at least 24 equations, and assert required condition/phenomenon/interpretation fields. Add exact expected equations for these anchors:

```js
const EXPECTED = {
  'chem-eq-hydrogen-peroxide': '2H2O2 -> 2H2O + O2↑',
  'chem-eq-water-electrolysis': '2H2O -> 2H2↑ + O2↑',
  'chem-eq-carbon-dioxide-limewater': 'CO2 + Ca(OH)2 -> CaCO3↓ + H2O',
  'chem-eq-zinc-hydrochloric': 'Zn + 2HCl -> ZnCl2 + H2↑',
  'chem-eq-neutralization': 'HCl + NaOH -> NaCl + H2O',
};
```

The parser handles element symbols, integer coefficients, parentheses, and ignores `↑`, `↓`, aqueous/state labels, and spaces.

- [ ] **Step 3: Run both checks and verify failure**

Run:

```bash
node scripts/check-chemistry-content.js
node scripts/check-chemistry-accuracy.js
```

Expected: FAIL because only 20 knowledge items and four primary experiments exist.

- [ ] **Step 4: Author the remaining twenty knowledge items**

Write the exact final five topics from `chem-k-carbon-allotropes` through `chem-k-resources-environment`. Include these four experiments exactly once as primary sections:

```text
chem-exp-carbon-dioxide
chem-exp-metals
chem-exp-acids-bases
chem-exp-coarse-salt
```

Add enough unique balanced equation blocks to reach at least 24 total. Cover combustion, oxygen preparation, water electrolysis, carbon oxides, carbon dioxide and limewater, carbonate and acid, metal and oxygen, metal and acid, metal displacement, metal oxide and acid, neutralization, basic oxide and water, carbonate and acid, hydroxide precipitation, and chloride precipitation.

Apply the curriculum responsibility and junior-high boundary rules from Global Constraints verbatim. Carbon monoxide stays within incomplete combustion, toxicity, and a limited common-property comparison; pH remains qualitative; ion reactions remain phenomenon-led common tests without ionic equations; organic content excludes functional groups, isomerism, naming, and polymerization mechanisms; metallurgy excludes electrochemical and industrial-process calculations.

- [ ] **Step 5: Add schema and review-meta coverage**

Extend generic checks through the adapter boundary or a chemistry-local import without allowing the main runtime package to import chemistry data. Require valid `contentMeta` on all chemistry topics, knowledge items, and templates.

- [ ] **Step 6: Run chemistry and generic data checks**

Run:

```bash
node scripts/check-chemistry-foundations.js
node scripts/check-chemistry-content.js
node scripts/check-chemistry-accuracy.js
node scripts/check-content-review-meta.js
node scripts/check-content-schema.js
```

Expected: all PASS; output reports 5/10/40/12, 8 experiments, and at least 24 balanced equations.

- [ ] **Step 7: Commit the complete chemistry data**

```bash
git add packages/chemistry/data scripts/check-chemistry-content.js scripts/check-chemistry-accuracy.js scripts/check-content-review-meta.js scripts/check-content-schema.js
git commit -m "feat(chemistry): complete core knowledge content"
```

### Task 5: Chemistry Repository, Pages, And Shared Chemical Blocks

**Files:**
- Create: `packages/chemistry/repository.js`
- Create: `packages/chemistry/pages/index/index.js`
- Create: `packages/chemistry/pages/index/index.json`
- Create: `packages/chemistry/pages/index/index.wxml`
- Create: `packages/chemistry/pages/index/index.wxss`
- Create: `packages/chemistry/pages/topic/index.js`
- Create: `packages/chemistry/pages/topic/index.json`
- Create: `packages/chemistry/pages/topic/index.wxml`
- Create: `packages/chemistry/pages/topic/index.wxss`
- Create: `packages/chemistry/pages/knowledge/index.js`
- Create: `packages/chemistry/pages/knowledge/index.json`
- Create: `packages/chemistry/pages/knowledge/index.wxml`
- Create: `packages/chemistry/pages/knowledge/index.wxss`
- Create: `packages/chemistry/pages/template/index.js`
- Create: `packages/chemistry/pages/template/index.json`
- Create: `packages/chemistry/pages/template/index.wxml`
- Create: `packages/chemistry/pages/template/index.wxss`
- Modify: `components/content-block/index.js`
- Modify: `components/content-block/index.wxml`
- Modify: `components/content-block/index.wxss`
- Create: `scripts/check-chemistry-pages.js`

**Interfaces:**
- Repository exports the seven query/navigation functions defined in the design.
- Chemistry knowledge page accepts `id`, `focusType`, `focusId`, and `restore`.
- Equation anchors are exactly `equation-<equationId>`; experiment anchors are exactly `experiment-<experimentId>`.

- [ ] **Step 1: Write failing repository and page checks**

Assert all canonical IDs resolve, missing IDs return `null`, navigation covers all 40 items in topic order, related results exclude self, page JSON files register `content-block` and `reading-settings`, and WXML contains both equation and experiment anchor bindings.

- [ ] **Step 2: Run the page check and verify failure**

Run: `node scripts/check-chemistry-pages.js`

Expected: FAIL because repository and pages do not exist.

- [ ] **Step 3: Implement repository queries**

Build maps once at module load. `getSubjectHome()` returns cloned themes with resolved topics and actual counts. Context is `{ id, type: 'topic', title }`. Related order is explicit `relatedIds` first, then same-topic items, limited by the requested count.

- [ ] **Step 4: Implement the subject and topic pages**

Subject page groups ten topic rows under five theme bands and displays actual knowledge/template counts. Topic page shows objective, knowledge list, and method list. Neither page renders task language or empty cards.

- [ ] **Step 5: Implement the knowledge page**

Reuse reading settings, cloud image signing/fallback, favorites, recents, notes, reading position, related content, adjacent navigation, and core-content clipboard behavior. On `focusType: 'equation'` or `focusType: 'experiment'`, expand details and call `wx.pageScrollTo()` with the exact anchor after `setData()`.

- [ ] **Step 6: Implement the method page**

Render cues, ordered steps, pitfalls, fully worked example, and cloud figure fallback. The method page is read-only and stores favorite/recent entries as type `template`.

- [ ] **Step 7: Add chemical content blocks**

`equation` displays equation, condition, phenomenon, interpretation, and ratio note. `safety` displays risks, rules, and emergency note with a restrained warning color. `comparison` renders columns and rows with horizontal overflow rather than squeezing text. Copy text includes every visible field.

- [ ] **Step 8: Run focused checks**

Run:

```bash
node scripts/check-chemistry-pages.js
node scripts/check-reading-display.js
node scripts/check-note-filters.js
```

Expected: all PASS.

- [ ] **Step 9: Commit repository and pages**

```bash
git add packages/chemistry/repository.js packages/chemistry/pages components/content-block scripts/check-chemistry-pages.js
git commit -m "feat(chemistry): add knowledge browsing pages"
```

### Task 6: Activate Chemistry In Packages, Routes, Search, Reference Index, And Storage

**Files:**
- Modify: `data/subject-manifest.js`
- Modify: `app.json`
- Create: `scripts/subject-adapters/chemistry.js`
- Modify: `scripts/subject-adapters/index.js`
- Modify: `pages/reference-index/index.js`
- Modify: `utils/reference-index.js`
- Modify: `scripts/check-subject-registry.js`
- Modify: `scripts/check-subject-adapters.js`
- Modify: `scripts/check-content-routes.js`
- Modify: `scripts/check-local-backup.js`
- Modify: `scripts/check-note-filters.js`
- Modify: `scripts/check-package-boundaries.js`
- Modify: `scripts/check-search-index.js`
- Modify: `scripts/check-search-semantics.js`
- Modify: `scripts/check-reference-index.js`
- Modify: `scripts/check-subject-content.js`
- Regenerate: `data/search-index.js`
- Regenerate: `data/reference-index.js`

**Interfaces:**
- Chemistry runtime routes: subject, topic, knowledge, template.
- Chemistry search types: topic, knowledge, template.
- Chemistry reference kinds: experiment, equation.
- Reference generated module exposes per-kind subject IDs derived from manifest capabilities plus materialized records so runtime has no hard-coded subject lists.

- [ ] **Step 1: Add failing four-subject integration assertions**

Assert active IDs are `math`, `english`, `physics`, `chemistry`; app.json has a normal chemistry package with exactly four pages; backup accepts chemistry and still defaults unknown IDs to math; search terms find chemistry; reference kinds contain chemistry experiment and equation records.

- [ ] **Step 2: Run integration checks and verify failure**

Run:

```bash
node scripts/check-subject-registry.js
node scripts/check-package-boundaries.js
node scripts/check-search-index.js
node scripts/check-reference-index.js
```

Expected: FAIL because chemistry is not active or indexed.

- [ ] **Step 3: Add the active manifest record and subpackage**

Use `id: 'chemistry'`, `status: 'active'`, `gradeBands: ['九年级']`, `packagePages` matching the four created pages, `contentTypes: ['subject', 'topic', 'knowledge', 'template']`, `referenceKinds: ['experiment', 'equation']`, and exact final counts.

- [ ] **Step 4: Add the chemistry build adapter**

Manifest entities include themes, topics, knowledge, and templates. Search entries include topic/knowledge/template records with formulas, substances, phenomena, experiment names, and aliases in tokens. Reference entries deduplicate eight experiments and all equations using canonical IDs.

- [ ] **Step 5: Make reference UI metadata generated**

Generate kind metadata with exact titles `公式`, `单词`, `语法`, `实验`, `方程式`, counts, and subject IDs declared by the manifest and verified against materialized records. Keep English words and grammar backed by search-index rows. `openEntry()` routes equation and experiment focus IDs into chemistry knowledge pages.

- [ ] **Step 6: Rebuild global indexes**

Run:

```bash
node scripts/build-search-index.js
node scripts/build-reference-index.js
node scripts/check-content-diff.js
```

Do not run `scripts/build-content-baseline.js`: it overwrites the historical v1.3 fixture. `check-content-diff.js` writes the current comparison to `dist/content-audit/content-diff.json` without changing the baseline.

- [ ] **Step 7: Verify required search terms**

Search checks must find chemistry for `质量守恒定律`, `化学方程式配平`, `氧气制取`, `二氧化碳检验`, `溶质质量分数`, `金属活动性顺序`, `pH`, `中和反应`, `粗盐提纯`, and `燃烧条件`. Existing probes `手拉手模型`, `被动语态`, `定语从句`, `阅读主旨`, `受力分析`, `浮力`, and `欧姆定律` remain correct.

- [ ] **Step 8: Run all integration checks**

Run:

```bash
node scripts/check-subject-registry.js
node scripts/check-subject-adapters.js
node scripts/check-content-routes.js
node scripts/check-local-backup.js
node scripts/check-note-filters.js
node scripts/check-package-boundaries.js
node scripts/check-search-index.js
node scripts/check-search-semantics.js
node scripts/check-reference-index.js
node scripts/check-subject-content.js
node scripts/check-content-diff.js
```

Expected: all PASS and no existing three-subject entity is deleted or modified solely by adapter ordering.

- [ ] **Step 9: Commit activation and indexes**

```bash
git add data/subject-manifest.js app.json scripts/subject-adapters/chemistry.js scripts/subject-adapters/index.js pages/reference-index/index.js utils/reference-index.js scripts/check-*.js data/search-index.js data/reference-index.js
git commit -m "feat(subjects): activate chemistry across the app"
```

### Task 7: Chemistry Covers, Diagrams, And Cloud Resource Inventory

**Files:**
- Modify: `.gitignore`
- Create: `assets/figures/generated/chemistry/prompts.json`
- Create: `assets/figures/generated/chemistry/topics/<topicId>/cover.png` for all 10 topics
- Create: `assets/figures/generated/chemistry/diagrams/*.png` for at least 10 diagrams
- Create: `assets/figures/generated/chemistry/templates/*.png` for all 12 templates
- Modify: chemistry data image paths where required
- Modify: `scripts/asset-inventory.js`
- Modify: `scripts/prepare-remote-assets.js`
- Modify: `scripts/check-remote-assets.js`
- Modify: `scripts/check-unique-figures.js`
- Create: `scripts/check-chemistry-assets.js`

**Interfaces:**
- Source cover path: `assets/figures/generated/chemistry/topics/<topicId>/cover.png`.
- Cloud path: `/assets/figures/generated/chemistry/topics/<topicId>/cover.png`.
- Runtime path uses the existing `REMOTE_ASSET_BASE` resolver; no local source asset is required at runtime.

- [ ] **Step 1: Write failing chemistry asset checks**

Add `!assets/figures/generated/chemistry/` and `!assets/figures/generated/chemistry/**` below the generated-assets ignore rule. Assert ten unique cover files at exactly `1280 x 900`, at least ten nonduplicate diagrams, twelve template figures, valid PNG headers, no duplicate SHA-256 values within chemistry, complete asset inventory coverage, and every cloud output at or below `200KB`.

- [ ] **Step 2: Run the asset check and verify failure**

Run: `node scripts/check-chemistry-assets.js`

Expected: FAIL listing all missing chemistry assets.

- [ ] **Step 3: Create and record cover prompts**

Use ImageGen to create ten text-free educational covers with distinct compositions. Keep laboratory apparatus scientifically plausible and avoid tiny labels. Record each exact prompt, model output name, final source path, generation date, and manual review status in `prompts.json`.

- [ ] **Step 4: Create accurate diagrams and template figures**

Produce original diagrams for oxygen preparation, carbon dioxide preparation, water electrolysis, particle conservation, solubility curve, metal activity, corrosion conditions, pH scale, acid-base neutralization, and material lifecycle. Use programmatic/vector construction for symbols, arrows, apparatus labels, and quantitative plots; rasterize final PNGs. Add twelve compact method figures that do not carry the only copy of any conclusion.

- [ ] **Step 5: Preserve chemistry cover dimensions during compression**

Special-case chemistry topic covers in `prepare-remote-assets.js`: try `(1280, 900)` with decreasing palette sizes before any lower resolution. Fail instead of silently downsizing a chemistry cover below `1280 x 900`.

- [ ] **Step 6: Build and validate remote resources**

Run:

```bash
node scripts/prepare-remote-assets.js
node scripts/check-chemistry-assets.js
node scripts/check-remote-assets.js
node scripts/check-unique-figures.js
node scripts/check-cloud-assets-runtime.js
```

Expected: all PASS.

- [ ] **Step 7: Upload chemistry cloud assets**

In the signed-in WeChat Developer Tools cloud storage panel, upload the chemistry subtree from `dist/remote-assets/assets/figures/generated/chemistry/` to `/assets/figures/generated/chemistry/`. Verify temporary URLs for one cover, one diagram, and one template; then run the established remote verification path for every chemistry manifest record.

- [ ] **Step 8: Commit assets and inventory changes**

```bash
git add .gitignore assets/figures/generated/chemistry packages/chemistry/data scripts/asset-inventory.js scripts/prepare-remote-assets.js scripts/check-remote-assets.js scripts/check-unique-figures.js scripts/check-chemistry-assets.js
git commit -m "feat(chemistry): add original visual resources"
```

### Task 8: Full Regression, Simulator QA, Documentation, And Push

**Files:**
- Modify: `README.md`
- Modify: `docs/后续开发与发布路线.md`
- Create: `docs/v1.7化学基础包实施记录.md`

**Interfaces:**
- Documentation records actual counts, commands, package sizes, simulator results, cloud verification, residual physical-device work, and exact commit range.

- [ ] **Step 1: Add the new checks to README**

List `check-subject-registry`, `check-subject-adapters`, `check-chemistry-foundations`, `check-chemistry-content`, `check-chemistry-accuracy`, `check-chemistry-pages`, and `check-chemistry-assets` beside existing release checks.

- [ ] **Step 2: Run the complete automated matrix**

Run every script below and preserve output in the implementation report:

```bash
node scripts/check-subject-registry.js
node scripts/check-subject-adapters.js
node scripts/check-chemistry-foundations.js
node scripts/check-chemistry-content.js
node scripts/check-chemistry-accuracy.js
node scripts/check-chemistry-pages.js
node scripts/check-chemistry-assets.js
node scripts/check-reading-display.js
node scripts/check-note-filters.js
node scripts/check-local-backup.js
node scripts/check-english-units.js
node scripts/check-english-accuracy.js
node scripts/check-english-depth.js
node scripts/check-physics-curriculum.js
node scripts/check-physics-accuracy.js
node scripts/check-physics-depth.js
node scripts/check-subject-content.js
node scripts/check-math-content.js
node scripts/check-math-accuracy.js
node scripts/check-math-depth.js
node scripts/check-unique-figures.js
node scripts/check-content-migration.js
node scripts/check-content-review-meta.js
node scripts/check-search-experience.js
node scripts/check-search-index.js
node scripts/check-search-semantics.js
node scripts/check-reference-index.js
node scripts/check-content-routes.js
node scripts/check-package-boundaries.js
node scripts/check-content-schema.js
node scripts/check-content-diff.js
node scripts/check-cloud-assets-runtime.js
node scripts/check-remote-assets.js
node scripts/check-package-sizes.js
node scripts/check-release-readiness.js
```

Expected: every command exits 0.

- [ ] **Step 3: Inspect package sizes**

Record main, math, English, physics, and chemistry sizes. Main must be below `700KiB`; chemistry must be below `1MB`; explain any change to the three existing subpackages.

- [ ] **Step 4: Run Nexus 5 simulator QA**

Verify home entry, all ten topic links, one knowledge item from each topic, all twelve methods, equation and experiment reference direct links, search terms, favorite, note, reading settings, back stack, and image failure fallback. Console contains no project error.

- [ ] **Step 5: Run iPhone 14 Pro Max simulator QA**

Repeat navigation, reference direct links, long equation wrapping, comparison horizontal scrolling, 1280x900 cover framing, note editing, and reading settings. Confirm no overlap and no project console error.

- [ ] **Step 6: Write the implementation record and roadmap update**

Record verified official sources, data counts, cloud asset counts, check results, simulator devices, package sizes, known external warnings, and physical-device tests still required before RC. Set the next route to v1.8 biology using its official six-unit framework, while continuing accuracy maintenance for math, English, physics, and chemistry.

- [ ] **Step 7: Commit documentation**

```bash
git add README.md docs/后续开发与发布路线.md docs/v1.7化学基础包实施记录.md
git commit -m "docs: record v1.7 chemistry verification"
```

- [ ] **Step 8: Final diff and clean-worktree check**

Run:

```bash
git diff --check 9eec489..HEAD
git status --short
git log --oneline 9eec489..HEAD
```

Expected: diff check exits 0; worktree is clean; commit list contains design, registry, adapters, chemistry content, pages, integration, assets, and documentation commits.

- [ ] **Step 9: Push the feature branch**

```bash
git push -u origin codex/chemistry-foundation-v1.7
```

Expected: remote branch is created or updated successfully. Do not create an RC tag.
