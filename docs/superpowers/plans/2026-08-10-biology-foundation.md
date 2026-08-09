# v1.8 生物学基础包 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有多学科普通分包底座中交付六单元、36 个知识点、6 个模板的生物学纯知识查阅包。

**Architecture:** 生物学独立放在 `packages/biology`，以六个稳定专题容器承载知识点和模板；repository、subject adapter、统一路由和公共页面模式与现有物理/化学分包一致。完整正文只进入生物学分包，主包只保留注册元数据和轻量搜索/参考索引。

**Tech Stack:** 微信小程序 WXML/WXSS/JavaScript、Node.js 构建期校验、PNG 原创资源、现有云资源 inventory 和 Developer Tools CLI。

## Global Constraints

- 纯知识查阅定位，不加入测评、任务、错题、打卡、登录或云同步。
- 六个单元对应新版人教版生物学六单元；跨学科实践融入知识说明，不建立空白入口。
- 不复制教材课文、题目、解析、实验插图或原始版式；解释、例子和图示原创改写。
- 单元封面为 `1280×900` PNG；结构图为 `1200×760` PNG；每个云端压缩资源不超过 `200 KiB`。
- 主包小于 `700 KiB`；每个普通分包小于 `1 MiB`；不配置 `preloadRule`。
- 生物学完成校验前保持入口不可见或 `status: building`；完成后才改为 `active`。
- 本地记录 schema 保持现有版本，不上传用户收藏、笔记或阅读记录。

### Task 1: 固化生物学数据契约和分支基线

**Files:**
- Create: `docs/superpowers/specs/2026-08-10-biology-foundation-design.md`
- Create: `docs/superpowers/plans/2026-08-10-biology-foundation.md`
- Create: `docs/v1.8生物学基础包实施记录.md`
- Test: `git diff --check`

**Interfaces:**
- Produces the content counts, stable ID prefix `bio-`, six unit IDs, and source/版权 boundary used by later tasks.

- [ ] **Step 1: Write the design and plan documents**

Record the six unit names, 36 knowledge-point floor, 6 templates, 108 examples, resource sizes, failure fallback and official source URLs. Do not add implementation code in this task.

- [ ] **Step 2: Run document checks**

Run: `git diff --check`
Expected: no output and exit code 0.

- [ ] **Step 3: Commit the baseline documents**

```bash
git add docs/superpowers/specs/2026-08-10-biology-foundation-design.md \
  docs/superpowers/plans/2026-08-10-biology-foundation.md \
  docs/v1.8生物学基础包实施记录.md
git commit -m "docs(v1.8): define biology foundation package"
```

### Task 2: Build the biology content repository

**Files:**
- Create: `packages/biology/data/biology-builders.js`
- Create: `packages/biology/data/biology-topics.js`
- Create: `packages/biology/data/biology-knowledge.js`
- Create: `packages/biology/data/biology-templates.js`
- Create: `packages/biology/repository.js`
- Create: `packages/biology/content-routes.js`
- Test: `scripts/check-biology-content.js`

**Interfaces:**
- `repository.js` exports `getSubjectHome`, `getTopicById`, `getKnowledgeById`, `getTemplateById`, `getKnowledgeContext`, `getRelatedKnowledge`, `getKnowledgeNavigation`.
- Every content ID starts with `bio-`; every example ID starts with `bio-ex-`; every template ID starts with `bio-tpl-`.

- [ ] **Step 1: Add failing count and relationship checks**

Create `scripts/check-biology-content.js` with assertions for 6 topics, 36 knowledge items, 6 templates, 108 examples, six unique unit IDs, parent references, and absence of task fields.

- [ ] **Step 2: Run the failing check**

Run: `node scripts/check-biology-content.js`
Expected: fail because the biology repository does not exist yet.

- [ ] **Step 3: Add explicit biology content**

Implement six topics, each with six knowledge points:

```js
{
  id: 'bio-unit-cells',
  subjectId: 'biology',
  unitLabel: '第一单元',
  title: '生物和细胞',
  gradeBands: ['七年级'],
  keywords: ['生物特征', '细胞', '显微镜', '组织器官'],
  knowledgeIds: ['bio-k-life-features', 'bio-k-science-observation', ...],
  templateIds: ['bio-tpl-evidence-chain']
}
```

Use these knowledge groups: 生物和细胞（生物特征、科学观察与探究、显微镜与观察、植物/动物细胞、细胞生活、结构层次）；多种多样的生物（分类依据、藻类与植物、动物类群、动物运动与行为、微生物、生物分类）；植物的生活（种子萌发、根吸收水和无机盐、茎运输、叶的结构、光合作用、呼吸作用与生长）；人体生理与健康（生殖与发育、消化、呼吸、循环、泌尿、神经与免疫）；生物与环境（环境因素、种间关系、生态系统结构、生态系统功能、生物圈、生态安全）；生命的延续和发展（生物生殖、遗传基础、变异、生命起源、进化证据、生物多样性保护）。每条知识包含原创解释、关键点、易错提醒和三个具体情境例子；六个知识点补充结构化安全观察说明。

- [ ] **Step 4: Implement repository normalization and navigation**

Follow `packages/physics/repository.js`: hydrate asset paths, return defensive arrays, locate knowledge first by ID, and derive context/neighbors from the owning unit.

- [ ] **Step 5: Run the content check**

Run: `node scripts/check-biology-content.js`
Expected: `OK biology: 6 units, 36 knowledge items, 6 templates, 108 examples`.

- [ ] **Step 6: Commit**

```bash
git add packages/biology scripts/check-biology-content.js
git commit -m "feat(biology): add six-unit knowledge repository"
```

### Task 3: Register the subject and pages

**Files:**
- Modify: `data/subject-manifest.js`
- Modify: `app.json`
- Create: `packages/biology/pages/index/index.{js,json,wxml,wxss}`
- Create: `packages/biology/pages/topic/index.{js,json,wxml,wxss}`
- Create: `packages/biology/pages/knowledge/index.{js,json,wxml,wxss}`
- Create: `packages/biology/pages/template/index.{js,json,wxml,wxss}`
- Modify: `utils/subjects.js` only if an explicit capability list requires it
- Test: `scripts/check-subject-registry.js`, `scripts/check-content-routes.js`

**Interfaces:**
- Registry entry uses `id: 'biology'`, `packageRoot: 'packages/biology'`, routes under `/packages/biology/pages/...`, counts `{ unit: 6, topic: 6, knowledge: 36, template: 6, example: 108 }`, `status: 'active'` only after Task 2 passes.

- [ ] **Step 1: Add registry and app subpackage**

Add the biology metadata and ordinary subpackage pages. Keep `preloadRule` absent and preserve the five existing package entries.

- [ ] **Step 2: Build pages from the existing chemistry/physics lifecycle**

Use `getTempFileURLMap`, `applyTempFileURL`, `isCloudFile`, `onUnload` token invalidation and text-safe image failure behavior. Topic cards show unit label and knowledge count; knowledge pages show explanation, points, examples and observation section; template page shows steps and pitfalls.

- [ ] **Step 3: Run route and registry checks**

Run: `node scripts/check-subject-registry.js && node scripts/check-content-routes.js`
Expected: active package registry includes biology and all old routes still pass.

- [ ] **Step 4: Commit**

```bash
git add data/subject-manifest.js app.json packages/biology utils/subjects.js scripts/check-subject-registry.js scripts/check-content-routes.js
git commit -m "feat(biology): register subject package and pages"
```

### Task 4: Add search/reference adapters and dynamic counts

**Files:**
- Create: `scripts/subject-adapters/biology.js`
- Modify: `scripts/subject-adapters/index.js`
- Modify: `scripts/check-subject-content.js`
- Modify: `scripts/check-content-schema.js` only where adapter registration is required
- Modify: `scripts/check-content-review-meta.js` for biology review metadata
- Create: `packages/biology/data/content-review-meta.js`
- Modify: `data/subject-manifest.js` reference kinds/counts if needed
- Test: `scripts/check-search-index.js`, `scripts/check-reference-index.js`, `scripts/check-student-copy.js`

**Interfaces:**
- Adapter exposes the same builder contract as other subjects: `subjectId`, `buildSearchEntries(makeEntry)`, `buildReferenceEntries()`, `getManifestEntities()` and `validate()`.

- [ ] **Step 1: Add adapter tests for biology search anchors**

Extend the search/content check to require hits for `细胞膜`, `光合作用`, `消化系统`, `生态系统`, `遗传和变异`, `生物多样性`, all with `subjectId === 'biology'`.

- [ ] **Step 2: Implement compact search and experiment references**

Index topic, knowledge and template titles plus short aliases/keywords. Register six observation references with keys `biology:experiment:<id>` and route them to knowledge `focusId`; do not put full explanations or long example text into `tokens`.

- [ ] **Step 3: Add review metadata and schema registration**

Every topic, knowledge item, template and observation record gets `review: { status: 'reviewed', reviewedAt: '2026-08-10', sourceKeys: [...] }` or is covered by the package metadata builder; invalid/missing status fails the check.

- [ ] **Step 4: Run index and content checks**

Run: `node scripts/build-search-index.js && node scripts/build-reference-index.js && node scripts/check-search-index.js && node scripts/check-reference-index.js && node scripts/check-subject-content.js`
Expected: search/reference hashes match generated files and all five subjects pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/subject-adapters packages/biology/data data/subject-manifest.js scripts/check-*.js packages/catalog/data
git commit -m "feat(biology): index knowledge and observation references"
```

### Task 5: Generate original biology visuals and remote inventory

**Files:**
- Create: `scripts/generate-biology-assets.py`
- Create: `assets/figures/generated/subjects/biology/prompts.json`
- Create: `assets/figures/generated/subjects/biology/topics/*/cover.png`
- Create: `assets/figures/generated/subjects/biology/diagrams/*.png`
- Modify: `scripts/check-unique-figures.js`
- Create: `scripts/check-biology-assets.js`
- Modify: `scripts/asset-inventory.js` only if its discovery rules need biology
- Test: `node scripts/check-biology-assets.js`, `node scripts/check-unique-figures.js`, `node scripts/prepare-remote-assets.js`, `node scripts/check-remote-assets.js`

**Interfaces:**
- Data references `/assets/figures/generated/subjects/biology/topics/<topicId>/cover.png` and `/assets/figures/generated/subjects/biology/diagrams/<topicId>.png`.

- [ ] **Step 1: Add asset checker and failing inventory assertions**

Require six covers, six diagrams, dimensions, unique hashes, prompt/source records, inventory membership and remote output records.

- [ ] **Step 2: Generate six original diagrams**

Use reproducible vector-style PNG generation with large labels and high-contrast colors for: cell structure levels, classification tree, plant life cycle, human systems, ecosystem food/energy flow, heredity-to-evolution chain. Keep text duplicated in page content.

- [ ] **Step 3: Run asset pipeline**

Run: `node scripts/prepare-remote-assets.js` then `node scripts/check-biology-assets.js && node scripts/check-remote-assets.js`.
Expected: all biology assets are in the remote manifest, no duplicate hashes, all compressed files under 200 KiB.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-biology-assets.py scripts/check-biology-assets.js scripts/check-unique-figures.js assets/figures/generated/subjects/biology
git commit -m "feat(biology): add original unit covers and structure diagrams"
```

### Task 6: Full validation and Developer Tools regression

**Files:**
- Modify: `docs/v1.8生物学基础包实施记录.md`
- Create: `.codex-output/v1.8-biology-packages-preview.json` through Developer Tools preview
- Create: `.codex-output/simulator-v18-biology/` screenshots
- Test: all current `scripts/check-*.js` plus biology checks

**Interfaces:**
- No production API changes; this task proves registry, content, assets, search, reference, migration, package boundaries, package sizes and runtime navigation.

- [ ] **Step 1: Run all content and package checks**

Run the existing v1.7 matrix plus `check-biology-content.js`, `check-biology-assets.js`, and fresh generated-index checks. Expected: zero failures.

- [ ] **Step 2: Generate exact Developer Tools preview**

Run the official preview CLI and record main/biology package sizes. Expected: main `<700 KiB`, catalog/math/english/physics/chemistry/biology each `<1 MiB`.

- [ ] **Step 3: Exercise both simulator models**

On iPhone 14 Pro Max and Nexus 5 open home, biology subject page, each representative unit, a knowledge page, search for `光合作用`, and an experiment focus. Capture screenshots and filter console for project errors.

- [ ] **Step 4: Update implementation record**

Record sources, counts, hashes, package sizes, screenshot paths, console result and the fact that physical devices remain pending. Do not write an RC tag or upload an experience build.

- [ ] **Step 5: Commit and push**

```bash
git add docs/v1.8生物学基础包实施记录.md
git commit -m "docs(v1.8): record biology package validation"
git push -u origin codex/biology-foundation-v1.8
```

## Verification Matrix

- `node scripts/check-biology-content.js`
- `node scripts/check-biology-assets.js`
- `node scripts/check-subject-registry.js`
- `node scripts/check-subject-content.js`
- `node scripts/check-search-index.js`
- `node scripts/check-reference-index.js`
- `node scripts/check-content-schema.js`
- `node scripts/check-content-routes.js`
- `node scripts/check-package-boundaries.js`
- `node scripts/check-package-sizes.js <fresh-preview-report>`
- `node scripts/check-unique-figures.js`
- `node scripts/check-remote-assets.js`
