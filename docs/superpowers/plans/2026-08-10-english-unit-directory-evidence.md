# 英语官方单元目录证据独立化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the English unit-directory quality gate compare runtime units with an independently authored official-directory record, while correcting two canonical titles and preserving legacy text search.

**Architecture:** A build-time JSON record under `docs/evidence` holds only official directory metadata and explicit evidence limits. `packages/english/data/english-source-evidence.js` loads and validates that record against local books without deriving the record from runtime data. The runtime unit builder exposes `legacyTitles`; the English search adapter indexes them, so corrected titles retain previous text-query behavior without changing stable IDs or storage keys.

**Tech Stack:** Node.js CommonJS, static JavaScript/JSON data, generated catalog search index, existing Node assertion scripts, Git.

## Global Constraints

- Preserve all existing English `unitId` values, routes, favorite/recent-reading keys, image paths, book availability and local-storage schema.
- Keep `book.status` as content availability only; use directory evidence `status` (`verified`, `partial`, `pending`) only in the build-time record.
- Evidence may contain only title/order metadata and scope declarations. It must not contain textbook body, audio, exercises, word lists, images, or external-content input fields.
- Keep nine-grade-upper content accessible. Its directory evidence must be `partial`, observing only Unit 1 and Unit 2 and listing Unit 3-8 as unverified.
- Canonical titles are `Same or Different` and `The Wonders of Nature`; prior spellings remain searchable through `legacyTitles`.
- Do not add a new quality-matrix command. Strengthen the existing English source-evidence script and test so the matrix remains at 117 checks.
- Do not change `content-source-follow-up`, `external-source` status, the release branch, cloud-resource paths, or knowledge/word/grammar bodies.

---

## File Structure

- Create: `docs/evidence/english-unit-directory-review-2026.json` - independently authored official directory observations and explicit scope limits.
- Modify: `packages/english/data/english-source-evidence.js` - load the JSON record; export the compatibility query API and validate it against local books and the source registry.
- Modify: `scripts/check-english-source-evidence.js` - report verified/partial/pending counts from the validated independent record.
- Modify: `scripts/check-english-source-evidence.test.js` - test the record contract and hostile drift cases through injected records/books.
- Modify: `scripts/check-english-accuracy.js` - apply complete-versus-partial source-note assertions based on directory evidence status.
- Modify: `packages/english/data/english-unit-builder.js` - normalize optional `legacyTitles` and include them in keywords.
- Modify: `packages/english/data/english-units-grade8.js` - correct two canonical titles and declare their old spellings.
- Modify: `packages/english/data/english-units-grade9.js` - make the public source note accurately describe partial directory evidence without changing availability.
- Modify: `scripts/subject-adapters/english.js` - emit legacy titles into unit search tokens.
- Modify: `scripts/check-search-semantics.js` - verify both old title searches resolve to the corrected units.
- Modify: `packages/catalog/data/search-index.js` - generated search index after adapter changes.
- Modify: `docs/人教版英语内容来源与编写规范.md` - correct the two titles and distinguish complete versus partial directory checks.
- Modify: `docs/v1.11后续开发路线.md` and `docs/后续开发与发布路线.md` - record the independent evidence boundary without claiming an external-content-source closure.

## Task 1: Independent Directory Record and Runtime Reconciliation

**Files:**
- Create: `docs/evidence/english-unit-directory-review-2026.json`
- Modify: `packages/english/data/english-source-evidence.js`
- Modify: `scripts/check-english-source-evidence.js`
- Modify: `scripts/check-english-source-evidence.test.js`
- Modify: `scripts/check-english-accuracy.js`
- Modify: `packages/english/data/english-units-grade8.js`
- Modify: `packages/english/data/english-units-grade9.js`

**Interfaces:**
- Consumes: `books` from `packages/english/data/english-units.js` and `getContentSource()` from `data/content-source-registry.js`.
- Produces: `DIRECTORY_REVIEW`, normalized `ENGLISH_SOURCE_EVIDENCE` items with `unitCount`, `checkEnglishSourceEvidence(options?)`, and `getEnglishSourceEvidence(bookId)` from `english-source-evidence.js`.
- `checkEnglishSourceEvidence({ review = DIRECTORY_REVIEW, localBooks = books, getSource = getContentSource } = {})` returns `true` or throws a descriptive `Error`; the optional arguments are only for deterministic contract tests.

- [ ] **Step 1: Write the failing independent-record contract tests**

Replace the self-copy assertions in `scripts/check-english-source-evidence.test.js` with assertions that require an externally authored record and the new validator API:

```js
const {
  DIRECTORY_REVIEW,
  checkEnglishSourceEvidence,
} = require('../packages/english/data/english-source-evidence');

assert.strictEqual(DIRECTORY_REVIEW.evidenceKind, 'official-unit-directory');
assert.deepStrictEqual(
  DIRECTORY_REVIEW.books.find((book) => book.bookId === 'eng-book-g9a-2025').unverifiedUnitIds,
  [
    'eng-unit-g9a-smart-learning',
    'eng-unit-g9a-our-memory',
    'eng-unit-g9a-power-of-ideas',
    'eng-unit-g9a-beyond-earth',
    'eng-unit-g9a-feel-rhythm',
    'eng-unit-g9a-more-than-game',
  ],
);
assert.throws(() => checkEnglishSourceEvidence({
  review: { ...DIRECTORY_REVIEW, books: DIRECTORY_REVIEW.books.map((book) => (
    book.bookId === 'eng-book-g8a-2024'
      ? { ...book, unitEvidence: book.unitEvidence.map((unit) => (
        unit.unitId === 'eng-unit-g8a-same-or-different'
          ? { ...unit, title: 'Same or Different?' }
          : unit
      )) }
      : book
  )) },
}), /标题漂移/);
```

Add equivalent `assert.throws()` cases for a legacy `yyptypzj` URL, a `partial` nine-grade-upper record that omits one `unverifiedUnitId`, and a pending book that contains one observed unit.

- [ ] **Step 2: Run the contract test to verify it fails**

Run: `node scripts/check-english-source-evidence.test.js`

Expected: FAIL because `DIRECTORY_REVIEW` and the options-based validation API do not exist, and the current runtime titles still use the two drifted spellings.

- [ ] **Step 3: Author the independent JSON evidence record**

Create `docs/evidence/english-unit-directory-review-2026.json` using this top-level shape:

```json
{
  "schemaVersion": 1,
  "reviewId": "english-unit-directory-review-2026",
  "reviewedAt": "2026-08-10",
  "evidenceKind": "official-unit-directory",
  "sourceKey": "pep-english-digital-resources-2025",
  "indexUrl": "https://www.pep.com.cn/zslth/yyptzy/",
  "scope": {
    "supports": ["册次", "单元标题", "单元顺序", "Starter 标记"],
    "notVerified": ["教材正文", "音频", "题目", "词表", "图片", "项目知识讲解", "外部内容导入"]
  },
  "books": []
}
```

Populate the record manually, rather than by importing or mapping `books`:

- `eng-book-g7a-2024`: `verified`, page `.../czyy/7s/`, 10 entries in order: three Starter Units then `You and Me`, `We're Family!`, `My School`, `My Favourite Subject`, `Fun Clubs`, `A Day in the Life`, `Happy Birthday!`.
- `eng-book-g7b-2024`: `verified`, page `.../czyy/7x/`, 8 entries in order: `Animal Friends`, `No Rules, No Order`, `Keep Fit`, `Eat Well`, `Here and Now`, `Rain or Shine`, `A Day to Remember`, `Once upon a Time`.
- `eng-book-g8a-2024`: `verified`, page `.../czyy/8s/`, exact entries: `eng-unit-g8a-happy-holiday` / `Happy Holiday`; `eng-unit-g8a-home-sweet-home` / `Home Sweet Home`; `eng-unit-g8a-same-or-different` / `Same or Different`; `eng-unit-g8a-amazing-plants-animals` / `Amazing Plants and Animals`; `eng-unit-g8a-delicious-meal` / `What a Delicious Meal!`; `eng-unit-g8a-plan-yourself` / `Plan for Yourself`; `eng-unit-g8a-when-tomorrow-comes` / `When Tomorrow Comes`; `eng-unit-g8a-communicate` / `Let's Communicate!`.
- `eng-book-g8b-2024`: `verified`, page `.../czyy/8x/`, exact entries: `eng-unit-g8b-time-to-relax` / `Time to Relax`; `eng-unit-g8b-stay-healthy` / `Stay Healthy`; `eng-unit-g8b-growing-up` / `Growing Up`; `eng-unit-g8b-wonder-of-nature` / `The Wonders of Nature`; `eng-unit-g8b-natures-temper` / `Nature's Temper`; `eng-unit-g8b-crossing-cultures` / `Crossing Cultures`; `eng-unit-g8b-good-read` / `A Good Read`; `eng-unit-g8b-making-difference` / `Making a Difference`.
- `eng-book-g9a-2025`: `partial`, page `.../czyy/9s/`, observed `eng-unit-g9a-changing-world` / `The Changing World` and `eng-unit-g9a-inspiring-people` / `Inspiring People`; list `eng-unit-g9a-smart-learning`, `eng-unit-g9a-our-memory`, `eng-unit-g9a-power-of-ideas`, `eng-unit-g9a-beyond-earth`, `eng-unit-g9a-feel-rhythm`, and `eng-unit-g9a-more-than-game` in `unverifiedUnitIds`.
- `eng-book-g9b-pending`: `pending`, index URL, empty `unitEvidence` and `unverifiedUnitIds`.

Use `unitEvidence` records with exactly `{ "unitId", "number", "title", "isStarter" }`. Do not add official body excerpts, captured HTML, raw media links or content-source manifest fields.

- [ ] **Step 4: Implement strict, injectable validation and preserve the compatibility API**

Refactor `packages/english/data/english-source-evidence.js` to load the JSON and implement these checks:

```js
function checkEnglishSourceEvidence({
  review = DIRECTORY_REVIEW,
  localBooks = books,
  getSource = getContentSource,
} = {}) {
  validateReviewEnvelope(review, getSource);
  validateBookCoverage(review.books, localBooks);
  validateBookRecords(review.books, localBooks);
  return true;
}

function getEnglishSourceEvidence(bookId) {
  return ENGLISH_SOURCE_EVIDENCE.find((item) => item.bookId === bookId) || null;
}
```

Build the compatibility collection once, without rewriting the JSON record:

```js
const ENGLISH_SOURCE_EVIDENCE = Object.freeze(DIRECTORY_REVIEW.books.map((item) => Object.freeze({
  ...item,
  unitCount: item.unitEvidence.length,
})));
```

`validateReviewEnvelope()` must require `schemaVersion === 1`, the declared review ID/date/evidence kind, the registered official source key, exact index URL, and the two fixed scope lists. `validateBookCoverage()` must require exactly the six local book IDs in local order. `validateBookRecords()` must reject URLs unless they are `https://www.pep.com.cn/zslth/yyptzy/` or a direct child under `https://www.pep.com.cn/zslth/yyptzy/czyy/`; it must reject `yyptypzj`, other hosts, query strings and fragments. For `verified`, it must require exact full-array equality. For `partial`, it must require observed units to form the matching local prefix and `unverifiedUnitIds` to equal the remaining local stable IDs. For `pending`, it must require a pending local book with zero local/observed/unverified units. It must also reject a partial nine-grade-upper `sourceNote` unless it states `Unit 1-2` is currently checked and the remaining units await the complete official directory.

Update `scripts/check-english-source-evidence.js` to report all three statuses, for example:

```js
console.log(`OK english source evidence: ${verified.length} verified books, ${partial.length} partial book, ${pending.length} pending book, ${observedUnitCount} units observed`);
```

- [ ] **Step 5: Correct the two canonical runtime titles and make the nine-grade-upper note truthful**

In `packages/english/data/english-units-grade8.js`, use the corrected titles before re-running the default validator:

```js
{
  id: 'eng-unit-g8a-same-or-different',
  number: 3,
  title: 'Same or Different',
  legacyTitles: ['Same or Different?'],
  theme: '人物比较与个性差异',
}
{
  id: 'eng-unit-g8b-wonder-of-nature',
  number: 4,
  title: 'The Wonders of Nature',
  legacyTitles: ['The Wonder of Nature'],
  theme: '自然奇观与探索体验',
}
```

In `packages/english/data/english-units-grade9.js`, keep `status: 'verified'` and replace `sourceNote` with this complete text:

```js
sourceNote: '当前人教社公开目录页已核对 Unit 1-2；其余现有单元保留原创讲解，等待完整官方目录复核。词汇用法、语法讲解和例句由本项目按单元主题原创整理，不作为教材逐页词表。',
```

In `scripts/check-english-accuracy.js`, load `getEnglishSourceEvidence()` and replace the unconditional verified-book source-note rule with this branch:

```js
const evidence = getEnglishSourceEvidence(book.id);
if (evidence && evidence.status === 'partial') {
  requireMatch(book.sourceNote, /公开目录页已核对 Unit 1-2/, owner, '部分目录证据必须说明当前已核对范围');
  requireMatch(book.sourceNote, /等待完整官方目录复核/, owner, '部分目录证据必须说明后续核对边界');
  rejectMatch(book.sourceNote, /单元标题和顺序已.*核对/, owner, '部分目录证据不得宣称整册目录已核对');
} else {
  requireMatch(book.sourceNote, /单元标题和顺序已.*核对/, owner, '完整目录证据必须说明标题和顺序已核对');
}
```

Keep the two existing `原创整理` and `不作为教材逐页词表` assertions after this branch for every available book.

- [ ] **Step 6: Make all Task 1 checks pass**

Run:

```bash
node scripts/check-english-source-evidence.test.js
node scripts/check-english-source-evidence.js
node scripts/check-english-accuracy.js
node scripts/check-english-units.js
```

Expected: the source-evidence test explicitly catches all tampering cases; the normal validator reports `4 verified books, 1 partial book, 1 pending book, 36 units observed`; English accuracy and unit checks retain 42 units, 336 words, 84 grammar points and 924 examples.

- [ ] **Step 7: Commit the independent directory evidence**

```bash
git add docs/evidence/english-unit-directory-review-2026.json \
  packages/english/data/english-source-evidence.js \
  packages/english/data/english-units-grade8.js \
  packages/english/data/english-units-grade9.js \
  scripts/check-english-accuracy.js \
  scripts/check-english-source-evidence.js \
  scripts/check-english-source-evidence.test.js
git commit -m "fix(english): verify unit directory independently"
```

## Task 2: Legacy Title Search Compatibility

**Files:**
- Modify: `packages/english/data/english-unit-builder.js`
- Modify: `scripts/subject-adapters/english.js`
- Modify: `scripts/check-search-semantics.js`
- Modify: `packages/catalog/data/search-index.js`

**Interfaces:**
- Consumes: optional `legacyTitles: string[]` in a unit config.
- Produces: `unit.legacyTitles` as a normalized, duplicate-free array, includes it in `unit.keywords`, and places it in the generated English unit search tokens.
- Does not change `getUnitById()` or content route signatures.

- [ ] **Step 1: Add failing end-user search assertions**

Append to `scripts/check-search-semantics.js` after the existing English spelling assertions:

```js
const oldQuestionTitle = searchAllSubjects('Same or Different?', 'english')[0];
assert.ok(oldQuestionTitle, '旧标题 Same or Different? 应保留搜索入口');
assert.strictEqual(oldQuestionTitle.refId, 'eng-unit-g8a-same-or-different');
assert.strictEqual(oldQuestionTitle.title, 'Unit 3 Same or Different');

const oldSingularTitle = searchAllSubjects('The Wonder of Nature', 'english')[0];
assert.ok(oldSingularTitle, '旧标题 The Wonder of Nature 应保留搜索入口');
assert.strictEqual(oldSingularTitle.refId, 'eng-unit-g8b-wonder-of-nature');
assert.strictEqual(oldSingularTitle.title, 'Unit 4 The Wonders of Nature');
```

- [ ] **Step 2: Run the semantic test to verify it fails**

Run: `node scripts/check-search-semantics.js`

Expected: FAIL because `legacyTitles` are not yet emitted by the builder/adapter and the generated index does not contain the previous spellings.

- [ ] **Step 3: Add normalized legacy-title propagation**

In `createUnit(config)`, create `legacyTitles` before returning the unit and use it in the public object and keywords:

```js
const legacyTitles = [...new Set((config.legacyTitles || [])
  .map((title) => String(title || '').trim())
  .filter((title) => title && title !== config.title))];

return {
  ...config,
  legacyTitles,
  keywords: [
    config.title,
    legacyTitles,
    config.theme,
    ...vocabulary.flatMap((item) => [item.word, item.meaning, ...item.collocations]),
    ...grammarPoints.map((item) => item.title),
    ...(config.keywords || []),
  ],
};
```

In the English adapter, change the unit tokens to:

```js
tokens: [unit.title, unit.legacyTitles, unit.unitLabel, unit.expressions],
```

Do not put legacy titles in the visible search-result title; they are tokens only.

- [ ] **Step 4: Rebuild the generated search index and verify behavior**

Run:

```bash
node scripts/build-search-index.js
node scripts/check-search-index.js
node scripts/check-search-semantics.js
node scripts/check-subject-content.js
```

Expected: the generated index is current, both prior spellings open their existing unit IDs, and visible titles use the two canonical spellings.

- [ ] **Step 5: Commit legacy title compatibility**

```bash
git add packages/english/data/english-unit-builder.js \
  scripts/subject-adapters/english.js \
  scripts/check-search-semantics.js \
  packages/catalog/data/search-index.js
git commit -m "fix(search): retain legacy English unit titles"
```

## Task 3: Documentation and Route-Quality Record

**Files:**
- Modify: `docs/人教版英语内容来源与编写规范.md`
- Modify: `docs/v1.11后续开发路线.md`
- Modify: `docs/后续开发与发布路线.md`
- Modify: `scripts/check-roadmap-document-consistency.test.js`

**Interfaces:**
- Consumes: the independent record’s evidence boundary and status semantics.
- Produces: truthful student/content-maintainer documentation without changing content-source intake state or quality-matrix count.

- [ ] **Step 1: Add the documentation assertions first**

Extend `scripts/check-roadmap-document-consistency.test.js` so it also reads `docs/人教版英语内容来源与编写规范.md`. Keep its three existing matrix-count assertions and add these exact documentation constraints:

```js
const englishSourcePath = path.join(root, 'docs/人教版英语内容来源与编写规范.md');
const englishSource = fs.readFileSync(englishSourcePath, 'utf8');

assert.match(englishSource, /Same or Different(?!\?)/);
assert.match(englishSource, /The Wonders of Nature/);
assert.match(englishSource, /独立官方目录证据/);
assert.match(englishSource, /九年级上册.*Unit 1-2|Unit 1-2.*九年级上册/s);
assert.doesNotMatch(englishSource, /九上全部单元标题和顺序已核对/);
assert.doesNotMatch(englishSource, /external-source/);
```

- [ ] **Step 2: Run the documentation check to verify it fails**

Run: `node scripts/check-roadmap-document-consistency.test.js`

Expected: FAIL because the current English source document still contains the old title spellings and claims five books are fully directory-verified.

- [ ] **Step 3: Update source and roadmap documents precisely**

In `docs/人教版英语内容来源与编写规范.md`:

- Replace the two old title spellings in the eight-grade lists.
- Replace the claim that all five books have fully reliable directory checks with: four books have complete current-page directory evidence, and nine-grade-upper has only Unit 1-2 current-page evidence while its remaining existing units await complete official-directory confirmation.
- Add the five direct PEP resource-page URLs under the directory cross-check section.
- State that this record verifies only directory metadata, not textbook body or an external content import.

In both v1.11 roadmap documents, describe the strengthened gate as independent official-directory evidence, keep the matrix count at 117, and preserve `math-chapters-v1.11` as the next true external-content-source blocker. Do not claim that this English directory record removes the global external-source block.

- [ ] **Step 4: Verify documentation and route status**

Run:

```bash
node scripts/check-roadmap-document-consistency.test.js
node scripts/check-english-source-evidence.js
git diff --check
```

Expected: roadmap documentation and the independent source-evidence report pass; neither document labels directory metadata as an external content source, and there are no whitespace errors.

- [ ] **Step 5: Commit the documentation record**

```bash
git add docs/人教版英语内容来源与编写规范.md \
  docs/v1.11后续开发路线.md \
  docs/后续开发与发布路线.md \
  scripts/check-roadmap-document-consistency.test.js
git commit -m "docs(english): clarify directory evidence scope"
```

## Task 4: Full Regression, Review and Delivery

**Files:**
- Verify: all Task 1-3 files and generated artifacts

**Interfaces:**
- Consumes: independent evidence validation, stable runtime data, generated search index and truthful documentation.
- Produces: a reviewed, pushed feature branch with all existing quality gates intact.

- [ ] **Step 1: Run the exact focused regression set**

Run:

```bash
node scripts/check-english-source-evidence.test.js
node scripts/check-english-source-evidence.js
node scripts/check-english-units.js
node scripts/check-english-accuracy.js
node scripts/check-english-depth.js
node scripts/check-search-index.js
node scripts/check-search-semantics.js
node scripts/check-subject-content.js
node scripts/check-roadmap-document-consistency.test.js
git diff --check
```

Expected: all commands exit zero; English totals remain `42/336/84/924`; the new source-evidence report shows `4 verified`, `1 partial`, `1 pending`, and `36 units observed`.

- [ ] **Step 2: Run the full deterministic quality matrix**

Run: `node scripts/check-v1.11-quality-matrix.js`

Expected: `OK v1.11 quality matrix: 117 checks`. The global source-follow-up status may still report the pre-existing real external-source block for `math-chapters-v1.11`; this is an expected report state, not a matrix failure.

- [ ] **Step 3: Perform source-level review**

Inspect:

```bash
git status --short
git diff e79ff81325025d26260a97b34e94071fb9877728 --check
git diff --stat e79ff81325025d26260a97b34e94071fb9877728
git log --oneline e79ff81325025d26260a97b34e94071fb9877728..HEAD
```

Confirm the diff contains no knowledge-body rewrites, no package-boundary changes, no release-branch files, no cloud uploads and no global content-source state changes.

- [ ] **Step 4: Push only the isolated feature branch**

Run:

```bash
git push -u origin codex/english-directory-evidence-v1.11
git status --short --branch
```

Expected: the branch tracks `origin/codex/english-directory-evidence-v1.11`, has no uncommitted changes, and the release branch remains untouched.
