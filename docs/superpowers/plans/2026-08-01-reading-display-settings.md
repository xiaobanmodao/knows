# Reading Display Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent local font-size, line-spacing, and instructional-image-width controls to all three subject knowledge pages and the profile page without changing existing content IDs or cloud data.

**Architecture:** A pure `utils/reading-preferences.js` module owns the preference schema, normalization, labels, and CSS-class mapping; `utils/storage.js` owns persistence and atomic restore; a controlled main-package component renders the setting sheet. Math, English, and physics knowledge pages consume the same normalized preference object and shared semantic reading styles, while the existing backup format adds an optional backward-compatible field.

**Tech Stack:** WeChat Mini Program JavaScript, WXML, WXSS, synchronous local storage, CommonJS, Node.js repository check scripts, WeChat Developer Tools simulators.

## Global Constraints

- Settings affect only math, English, and physics knowledge pages; chapter, topic, unit, template, search, and index pages remain unchanged.
- The persisted schema is exactly `{ version: 1, fontSize, lineHeight, imageWidth }`.
- Allowed values are `small | standard | large`, `compact | standard | relaxed`, and `narrow | medium | full`.
- The default combination is `standard / standard / full` and must preserve the current knowledge-page appearance.
- Image widths are exactly `72%`, `86%`, and `100%`, remain centered, preserve aspect ratio, and never crop.
- Content storage schema remains version `4`; backup format remains version `1`.
- Old backups without `readingPreferences` preserve the device's current preferences.
- No account, cloud sync, arbitrary slider, font family, color theme, or generated content is added.
- Main package remains below `700 KiB`; each subject subpackage remains below `1 MiB`.
- Every production change follows a demonstrated red-green test cycle.

---

## File Map

**Create**

- `utils/reading-preferences.js`: pure schema normalization, labels, summary, and style-class generation.
- `components/reading-settings/index.js`: controlled setting-sheet behavior and events.
- `components/reading-settings/index.json`: component declaration.
- `components/reading-settings/index.wxml`: bottom sheet with three segmented controls.
- `components/reading-settings/index.wxss`: sheet, overlay, controls, and responsive layout.
- `styles/reading-display.wxss`: shared semantic font, line-height, and image-width modifiers.
- `scripts/check-reading-display.js`: executable data, component, page-contract, and style checks.
- `docs/v1.6阅读显示设置实施记录.md`: verified scope, commands, simulator results, and residual device checks.

**Modify**

- `utils/storage.js`: local preference reads/writes plus snapshot and atomic rollback coverage.
- `utils/local-backup.js`: optional preference normalization and merge semantics.
- `app.js`: application-level preference API used by pages.
- `scripts/check-local-backup.js`: new/old backup and rollback assertions.
- `components/content-block/index.js`: normalized preference property and local class state.
- `components/content-block/index.wxml`: component-local reading classes and semantic text tokens.
- `components/content-block/index.wxss`: import shared reading modifiers.
- `packages/math/pages/knowledge/index.{js,json,wxml,wxss}`: setting entry, state, handlers, text tokens, image tokens, component registration.
- `packages/english/pages/knowledge/index.{js,json,wxml,wxss}`: same contract using English repository behavior.
- `packages/physics/pages/knowledge/index.{js,json,wxml,wxss}`: same contract while preserving physics-specific experiment anchors.
- `pages/profile/index.{js,json,wxml,wxss}`: persistent setting summary and shared sheet entry.
- `README.md`: add the new check command and current development item.

---

### Task 1: Pure Reading Preference Contract

**Files:**
- Create: `scripts/check-reading-display.js`
- Create: `utils/reading-preferences.js`

**Interfaces:**
- Produces: `DEFAULT_READING_PREFERENCES: Readonly<ReadingPreferences>`
- Produces: `normalizeReadingPreferences(value): ReadingPreferences`
- Produces: `buildReadingDisplayClass(value): string`
- Produces: `formatReadingPreferenceSummary(value): string`
- `ReadingPreferences` is `{ version: 1, fontSize: string, lineHeight: string, imageWidth: string }`.

- [ ] **Step 1: Write the failing pure-data checks**

Create `scripts/check-reading-display.js` with this initial body:

```js
const {
  DEFAULT_READING_PREFERENCES,
  buildReadingDisplayClass,
  formatReadingPreferenceSummary,
  normalizeReadingPreferences,
} = require('../utils/reading-preferences');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const defaults = normalizeReadingPreferences();
assert(JSON.stringify(defaults) === JSON.stringify({
  version: 1,
  fontSize: 'standard',
  lineHeight: 'standard',
  imageWidth: 'full',
}), '缺失设置应回退到完整默认值');

const custom = normalizeReadingPreferences({
  version: 1,
  fontSize: 'large',
  lineHeight: 'relaxed',
  imageWidth: 'medium',
  unknown: 'ignored',
});
assert(custom.fontSize === 'large' && custom.lineHeight === 'relaxed' && custom.imageWidth === 'medium', '合法档位应保留');
assert(!Object.prototype.hasOwnProperty.call(custom, 'unknown'), '未知字段不应进入规范结构');

const invalid = normalizeReadingPreferences({
  version: 99,
  fontSize: 'huge',
  lineHeight: null,
  imageWidth: 72,
});
assert(JSON.stringify(invalid) === JSON.stringify(defaults), '非法值应逐字段回退');

const classes = buildReadingDisplayClass(custom);
assert(classes === 'reading-font--large reading-line--relaxed reading-image--medium', '样式类映射错误');
assert(formatReadingPreferenceSummary(custom) === '大字 · 舒展 · 适中图片', '偏好摘要错误');

defaults.fontSize = 'large';
assert(DEFAULT_READING_PREFERENCES.fontSize === 'standard', '调用方不应修改共享默认值');

console.log('OK reading preference normalization, classes and labels checked');
```

- [ ] **Step 2: Run the check and verify the missing-module failure**

Run: `node scripts/check-reading-display.js`

Expected: FAIL with `Cannot find module '../utils/reading-preferences'`.

- [ ] **Step 3: Implement the pure preference module**

Create `utils/reading-preferences.js` with fixed sets and fresh-object returns:

```js
const DEFAULT_READING_PREFERENCES = Object.freeze({
  version: 1,
  fontSize: 'standard',
  lineHeight: 'standard',
  imageWidth: 'full',
});

const FONT_SIZES = new Set(['small', 'standard', 'large']);
const LINE_HEIGHTS = new Set(['compact', 'standard', 'relaxed']);
const IMAGE_WIDTHS = new Set(['narrow', 'medium', 'full']);
const LABELS = {
  fontSize: { small: '小字', standard: '标准字', large: '大字' },
  lineHeight: { compact: '紧凑', standard: '标准', relaxed: '舒展' },
  imageWidth: { narrow: '窄图', medium: '适中图片', full: '全宽图片' },
};

function normalizeReadingPreferences(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    version: 1,
    fontSize: source.version === 1 && FONT_SIZES.has(source.fontSize) ? source.fontSize : 'standard',
    lineHeight: source.version === 1 && LINE_HEIGHTS.has(source.lineHeight) ? source.lineHeight : 'standard',
    imageWidth: source.version === 1 && IMAGE_WIDTHS.has(source.imageWidth) ? source.imageWidth : 'full',
  };
}

function buildReadingDisplayClass(value) {
  const preferences = normalizeReadingPreferences(value);
  return `reading-font--${preferences.fontSize} reading-line--${preferences.lineHeight} reading-image--${preferences.imageWidth}`;
}

function formatReadingPreferenceSummary(value) {
  const preferences = normalizeReadingPreferences(value);
  return [
    LABELS.fontSize[preferences.fontSize],
    LABELS.lineHeight[preferences.lineHeight],
    LABELS.imageWidth[preferences.imageWidth],
  ].join(' · ');
}

module.exports = {
  DEFAULT_READING_PREFERENCES,
  FONT_SIZES,
  LINE_HEIGHTS,
  IMAGE_WIDTHS,
  LABELS,
  normalizeReadingPreferences,
  buildReadingDisplayClass,
  formatReadingPreferenceSummary,
};
```

- [ ] **Step 4: Run the pure-data check and verify it passes**

Run: `node scripts/check-reading-display.js`

Expected: PASS and print an `OK` line after adding one at the end of the script.

- [ ] **Step 5: Commit the pure contract**

```bash
git add utils/reading-preferences.js scripts/check-reading-display.js
git commit -m "feat(reading): define display preference contract"
```

---

### Task 2: Local Persistence and App API

**Files:**
- Modify: `scripts/check-reading-display.js`
- Modify: `utils/storage.js`
- Modify: `app.js`

**Interfaces:**
- Consumes: `normalizeReadingPreferences(value)` from Task 1.
- Produces: `storage.getReadingPreferences(): ReadingPreferences`
- Produces: `storage.setReadingPreferences(value): { preferences: ReadingPreferences, saved: boolean }`
- Produces: `storage.resetReadingPreferences(): { preferences: ReadingPreferences, saved: boolean }`
- Produces matching wrappers on the application instance.

- [ ] **Step 1: Add failing storage and app assertions**

At the top of `scripts/check-reading-display.js`, install a memory-backed `wx` mock before requiring `utils/storage.js`:

```js
const memory = new Map();
let failWrites = false;
global.wx = {
  getStorageSync(key) {
    return memory.get(key);
  },
  setStorageSync(key, value) {
    if (failWrites) throw new Error('mock storage full');
    memory.set(key, value);
  },
};

const storage = require('../utils/storage');

assert(storage.getReadingPreferences().fontSize === 'standard', '空存储应返回默认阅读设置');
let writeResult = storage.setReadingPreferences({
  version: 1,
  fontSize: 'large',
  lineHeight: 'relaxed',
  imageWidth: 'medium',
});
assert(writeResult.saved && storage.getReadingPreferences().fontSize === 'large', '阅读设置应持久化');

memory.set('knows_reading_preferences', { version: 1, fontSize: 'wrong' });
assert(storage.getReadingPreferences().fontSize === 'standard', '损坏字段应归一化');

failWrites = true;
writeResult = storage.setReadingPreferences({ version: 1, fontSize: 'small' });
failWrites = false;
assert(!writeResult.saved && writeResult.preferences.fontSize === 'small', '保存失败应返回会话偏好和失败状态');
```

Capture the `App` configuration and assert the three wrappers exist and delegate to storage:

```js
let appConfig;
global.App = (config) => {
  appConfig = config;
};
require('../app');
assert(typeof appConfig.getReadingPreferences === 'function', 'App 缺少阅读设置读取接口');
assert(typeof appConfig.setReadingPreferences === 'function', 'App 缺少阅读设置保存接口');
assert(typeof appConfig.resetReadingPreferences === 'function', 'App 缺少阅读设置重置接口');
assert(appConfig.getReadingPreferences().fontSize === storage.getReadingPreferences().fontSize, 'App 读取接口未委托 storage');
```

- [ ] **Step 2: Run the check and verify the API failure**

Run: `node scripts/check-reading-display.js`

Expected: FAIL because `getReadingPreferences` or `setReadingPreferences` is not defined.

- [ ] **Step 3: Add persistence without changing content schema version**

In `utils/storage.js`:

```js
const {
  DEFAULT_READING_PREFERENCES,
  normalizeReadingPreferences,
} = require('./reading-preferences');
const READING_PREFERENCES_KEY = 'knows_reading_preferences';

function getReadingPreferences() {
  return normalizeReadingPreferences(read(READING_PREFERENCES_KEY, DEFAULT_READING_PREFERENCES));
}

function setReadingPreferences(value) {
  const preferences = normalizeReadingPreferences(value);
  try {
    wx.setStorageSync(READING_PREFERENCES_KEY, preferences);
    return { preferences, saved: true };
  } catch (error) {
    return { preferences, saved: false };
  }
}

function resetReadingPreferences() {
  return setReadingPreferences(DEFAULT_READING_PREFERENCES);
}
```

Export the functions. Do not increment `CURRENT_CONTENT_SCHEMA_VERSION`.

Add delegating methods with the same names to `app.js`. Do not cache preferences in `globalData`; pages re-read on `onShow` so profile changes synchronize naturally.

- [ ] **Step 4: Run focused checks**

Run: `node scripts/check-reading-display.js`

Run: `node scripts/check-content-migration.js`

Expected: both PASS; content storage version remains `4`.

- [ ] **Step 5: Commit persistence**

```bash
git add utils/storage.js app.js scripts/check-reading-display.js
git commit -m "feat(storage): persist reading display settings"
```

---

### Task 3: Backward-Compatible Backup and Atomic Restore

**Files:**
- Modify: `scripts/check-local-backup.js`
- Modify: `utils/local-backup.js`
- Modify: `utils/storage.js`

**Interfaces:**
- Consumes: `normalizeReadingPreferences(value)` from Task 1.
- `normalizeSnapshot(snapshot)` returns `readingPreferences: ReadingPreferences | null`.
- `createBackup(snapshot)` always writes a complete `readingPreferences` object.
- `mergeSnapshots(current, incoming)` uses incoming preferences when present and current preferences when absent.
- `replaceLocalData(snapshot)` preserves current preferences when `snapshot.readingPreferences` is null and includes the setting in rollback.

- [ ] **Step 1: Add failing new-backup, old-backup, merge, replace, and rollback cases**

Extend the in-memory setup in `scripts/check-local-backup.js` with:

```js
['knows_reading_preferences', {
  version: 1,
  fontSize: 'standard',
  lineHeight: 'compact',
  imageWidth: 'full',
}],
```

Add `readingPreferences` to `source`, then assert:

```js
if (parsed.data.readingPreferences.fontSize !== 'large') {
  throw new Error('新备份应包含阅读显示设置');
}
if (created.backupVersion !== 1) {
  throw new Error('增加可选设置不应升级备份格式');
}
```

Construct a checksum-valid old backup by removing `data.readingPreferences` and recomputing the existing FNV-1a checksum with this test-only helper:

```js
function checksumText(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function refreshChecksum(value) {
  value.checksum = checksumText(JSON.stringify({
    format: value.format,
    backupVersion: value.backupVersion,
    contentSchemaVersion: value.contentSchemaVersion,
    createdAt: value.createdAt,
    appVersion: value.appVersion,
    data: value.data,
  }));
}

const oldBackup = JSON.parse(text);
delete oldBackup.data.readingPreferences;
refreshChecksum(oldBackup);
const oldParsed = backup.parseBackupText(JSON.stringify(oldBackup));
if (oldParsed.data.readingPreferences !== null) {
  throw new Error('旧备份缺少阅读设置时应保留缺失状态');
}
```

Add merge assertions:

```js
const currentPreferences = { version: 1, fontSize: 'small', lineHeight: 'compact', imageWidth: 'narrow' };
const mergedOld = backup.mergeSnapshots(
  { ...current, readingPreferences: currentPreferences },
  oldParsed.data,
);
if (mergedOld.readingPreferences.fontSize !== 'small') {
  throw new Error('旧备份不应重置当前阅读设置');
}

const mergedNew = backup.mergeSnapshots(
  { ...current, readingPreferences: currentPreferences },
  parsed.data,
);
if (mergedNew.readingPreferences.fontSize !== 'large') {
  throw new Error('新备份应恢复备份中的阅读设置');
}
```

After `replaceLocalData`, assert `storage.getReadingPreferences()` equals the incoming setting. Set the existing `failKey` mock to `knows_content_schema_version`, which is written after `knows_reading_preferences`, then assert `JSON.stringify(storage.getLocalDataSnapshot())` equals the pre-failure snapshot so preferences and all existing fields roll back together.

- [ ] **Step 2: Run the backup check and verify it fails**

Run: `node scripts/check-local-backup.js`

Expected: FAIL because backup data has no `readingPreferences` semantics.

- [ ] **Step 3: Implement optional normalization and deterministic merge**

In `utils/local-backup.js`, import `DEFAULT_READING_PREFERENCES` and `normalizeReadingPreferences`.

In `normalizeSnapshot`, preserve absence:

```js
const hasReadingPreferences = Object.prototype.hasOwnProperty.call(source, 'readingPreferences')
  && source.readingPreferences !== null;

return {
  // existing fields
  readingPreferences: hasReadingPreferences
    ? normalizeReadingPreferences(source.readingPreferences)
    : null,
};
```

In `createBackup`, replace a null normalized value with a fresh normalized default before calculating counts and checksum. In `mergeSnapshots`, choose:

```js
readingPreferences: incoming.readingPreferences
  || current.readingPreferences
  || DEFAULT_READING_PREFERENCES,
```

In `utils/storage.js`, include `readingPreferences` in `getLocalDataSnapshot`. In `replaceLocalData`, resolve `nextReadingPreferences` to the incoming normalized value when present or the current value when absent, then include `READING_PREFERENCES_KEY` in both write and rollback entry lists.

- [ ] **Step 4: Verify backup and persistence behavior**

Run: `node scripts/check-local-backup.js`

Run: `node scripts/check-reading-display.js`

Expected: both PASS, including old-backup preservation and rollback assertions.

- [ ] **Step 5: Commit backup compatibility**

```bash
git add utils/local-backup.js utils/storage.js scripts/check-local-backup.js
git commit -m "feat(backup): include reading display preferences"
```

---

### Task 4: Controlled Reading Settings Component and Shared Style Tokens

**Files:**
- Create: `components/reading-settings/index.js`
- Create: `components/reading-settings/index.json`
- Create: `components/reading-settings/index.wxml`
- Create: `components/reading-settings/index.wxss`
- Create: `styles/reading-display.wxss`
- Modify: `scripts/check-reading-display.js`
- Modify: `components/content-block/index.js`
- Modify: `components/content-block/index.wxml`
- Modify: `components/content-block/index.wxss`

**Interfaces:**
- Component properties: `visible: boolean`, `preferences: ReadingPreferences`.
- Component events: `change` with `{ preferences }`, `reset`, and `close`.
- `content-block` gains a `readingPreferences` property and computes `readingDisplayClass`.
- Shared semantic classes use `reading-copy--NN`, `reading-leading--NNN`, and `reading-image` tokens.

- [ ] **Step 1: Add failing component and style-contract checks**

Extend `scripts/check-reading-display.js` to require all four component files and `styles/reading-display.wxss`. Assert:

```js
const componentWxml = read('components/reading-settings/index.wxml');
const componentWxss = read('components/reading-settings/index.wxss');
const sharedWxss = read('styles/reading-display.wxss');
assert(componentWxml.includes('bindtap="selectOption"'), '设置面板缺少分段选项事件');
assert(componentWxml.includes('bindtap="resetPreferences"'), '设置面板缺少恢复默认入口');
assert(componentWxss.includes('min-height: 88rpx'), '设置控件点击高度不足');
assert(sharedWxss.includes('.reading-image--narrow .reading-image'), '缺少窄图档位');
assert(sharedWxss.includes('width: 72%'), '窄图宽度必须为 72%');
assert(sharedWxss.includes('width: 86%'), '适中图片宽度必须为 86%');
assert(sharedWxss.includes('width: 100%'), '全宽图片必须为 100%');
```

Mock `global.Component`, require `components/reading-settings/index.js`, invoke `selectOption`, and assert the emitted event contains a complete normalized preference object. Invoke reset and close and assert the event names.

Assert `content-block` declares `readingPreferences`, applies `readingDisplayClass` at its root, imports the shared WXSS, and gives these elements semantic font/leading tokens: `content-block__text`, `formula-box__formula`, `formula-box__desc`, `formula-rule`, `reasoning-line`, `steps-box__text`, `list-box__text`, `table-box__cell`, `example-box__sentence`, `example-box__translation`, `example-box__row`, `experiment-box__row`, and `experiment-step`.

- [ ] **Step 2: Run the check and verify missing component/style failures**

Run: `node scripts/check-reading-display.js`

Expected: FAIL on the first missing component file or contract.

- [ ] **Step 3: Implement the controlled component**

Use fixed option groups in `components/reading-settings/index.js`:

```js
const {
  DEFAULT_READING_PREFERENCES,
  LABELS,
  normalizeReadingPreferences,
} = require('../../utils/reading-preferences');

const OPTION_GROUPS = [
  { id: 'fontSize', title: '字号', values: ['small', 'standard', 'large'] },
  { id: 'lineHeight', title: '行距', values: ['compact', 'standard', 'relaxed'] },
  { id: 'imageWidth', title: '图片宽度', values: ['narrow', 'medium', 'full'] },
];

function buildGroups(preferences) {
  const value = normalizeReadingPreferences(preferences);
  return OPTION_GROUPS.map((group) => ({
    ...group,
    items: group.values.map((id) => ({
      id,
      label: LABELS[group.id][id],
      selected: value[group.id] === id,
    })),
  }));
}
```

The component observer rebuilds groups when `preferences` changes. `selectOption` validates the field by finding it in `OPTION_GROUPS`, merges the selected value into the current complete object, and emits `change`. It never calls storage APIs.

Build a bottom sheet with a full-screen mask, a compact header, three segmented rows, a reset text command, and a familiar close symbol. Use `catchtap` on the sheet body and `bindtap` on the mask so mask closure never triggers from inside. Do not add instructional paragraphs.

- [ ] **Step 4: Add deterministic shared reading tokens**

In `styles/reading-display.wxss`, define all explicit font-size, line-height, and image-width token overrides used by knowledge pages and `content-block`:

```css
.reading-font--small .reading-copy--23 { font-size: 21rpx; }
.reading-font--large .reading-copy--23 { font-size: 27rpx; }
.reading-font--small .reading-copy--24 { font-size: 22rpx; }
.reading-font--large .reading-copy--24 { font-size: 28rpx; }
.reading-font--small .reading-copy--25 { font-size: 23rpx; }
.reading-font--large .reading-copy--25 { font-size: 29rpx; }
.reading-font--small .reading-copy--26 { font-size: 24rpx; }
.reading-font--large .reading-copy--26 { font-size: 30rpx; }
.reading-font--small .reading-copy--27 { font-size: 25rpx; }
.reading-font--large .reading-copy--27 { font-size: 31rpx; }
.reading-font--small .reading-copy--28 { font-size: 26rpx; }
.reading-font--large .reading-copy--28 { font-size: 32rpx; }

.reading-line--compact .reading-leading--155 { line-height: 1.45; }
.reading-line--relaxed .reading-leading--155 { line-height: 1.75; }
.reading-line--compact .reading-leading--160 { line-height: 1.45; }
.reading-line--relaxed .reading-leading--160 { line-height: 1.8; }
.reading-line--compact .reading-leading--170 { line-height: 1.5; }
.reading-line--relaxed .reading-leading--170 { line-height: 1.9; }
.reading-line--compact .reading-leading--175 { line-height: 1.55; }
.reading-line--relaxed .reading-leading--175 { line-height: 1.95; }
.reading-line--compact .reading-leading--180 { line-height: 1.6; }
.reading-line--relaxed .reading-leading--180 { line-height: 2; }
.reading-line--compact .reading-leading--185 { line-height: 1.65; }
.reading-line--relaxed .reading-leading--185 { line-height: 2.05; }
.reading-line--compact .reading-leading--190 { line-height: 1.7; }
.reading-line--relaxed .reading-leading--190 { line-height: 2.1; }

.reading-image--narrow .reading-image { width: 72%; }
.reading-image--medium .reading-image { width: 86%; }
.reading-image--full .reading-image { width: 100%; }
.reading-image { display: block; max-width: 100%; margin-right: auto; margin-left: auto; }
```

Use only the listed font and line tokens on affected WXML. Standard mode adds no overrides, preserving existing declarations exactly. Do not use viewport-scaled font sizes, negative letter spacing, or `!important`.

- [ ] **Step 5: Connect `content-block` within its style-isolated boundary**

Add a normalized `readingPreferences` property and observer to `components/content-block/index.js`. Apply `readingDisplayClass` on the root element and import `../../styles/reading-display.wxss` from its WXSS. Add semantic token classes to actual reading text only; keep copy buttons and section headings fixed.

- [ ] **Step 6: Run focused component checks**

Run: `node scripts/check-reading-display.js`

Run: `node scripts/check-release-readiness.js`

Expected: both PASS; release readiness confirms all declared component files exist and declare `component: true`.

- [ ] **Step 7: Commit the common UI layer**

```bash
git add components/reading-settings components/content-block styles/reading-display.wxss scripts/check-reading-display.js
git commit -m "feat(reading): add shared display controls"
```

---

### Task 5: Math, English, and Physics Knowledge Page Integration

**Files:**
- Modify: `scripts/check-reading-display.js`
- Modify: `packages/math/pages/knowledge/index.js`
- Modify: `packages/math/pages/knowledge/index.json`
- Modify: `packages/math/pages/knowledge/index.wxml`
- Modify: `packages/math/pages/knowledge/index.wxss`
- Modify: `packages/english/pages/knowledge/index.js`
- Modify: `packages/english/pages/knowledge/index.json`
- Modify: `packages/english/pages/knowledge/index.wxml`
- Modify: `packages/english/pages/knowledge/index.wxss`
- Modify: `packages/physics/pages/knowledge/index.js`
- Modify: `packages/physics/pages/knowledge/index.json`
- Modify: `packages/physics/pages/knowledge/index.wxml`
- Modify: `packages/physics/pages/knowledge/index.wxss`

**Interfaces:**
- Consumes app methods from Task 2 and the component from Task 4.
- Every knowledge page holds `readingPreferences`, `readingDisplayClass`, and `readingSettingsVisible`.
- Every page implements `syncReadingPreferences`, `openReadingSettings`, `closeReadingSettings`, `changeReadingPreferences`, and `resetReadingPreferences`.

- [ ] **Step 1: Add failing three-page contract checks**

For each subject page, have `scripts/check-reading-display.js` assert:

```js
assert(json.usingComponents['reading-settings'] === '/components/reading-settings/index', `${subject} 未注册阅读设置组件`);
assert(wxml.includes('Aa 阅读'), `${subject} 缺少阅读设置入口`);
assert(wxml.includes('readingDisplayClass'), `${subject} 页面根节点缺少显示类`);
assert(wxml.includes('reading-preferences="{{readingPreferences}}"'), `${subject} 未向 content-block 传入偏好`);
assert(wxml.includes('<reading-settings'), `${subject} 缺少设置面板实例`);
assert(wxss.includes('@import "../../../../styles/reading-display.wxss"'), `${subject} 未导入共享阅读样式`);
assert(js.includes('syncReadingPreferences()'), `${subject} 未在 onShow 同步设置`);
```

Assert image tokens are attached to both cover and problem images and fixed controls do not receive `reading-copy` classes.

- [ ] **Step 2: Run the check and verify all three pages fail the new contract**

Run: `node scripts/check-reading-display.js`

Expected: FAIL on the math page's missing component registration.

- [ ] **Step 3: Add identical normalized state and handlers to each page**

Each page imports:

```js
const {
  DEFAULT_READING_PREFERENCES,
  buildReadingDisplayClass,
} = require('../../../../utils/reading-preferences');
```

Initialize data with a fresh preference object and class string. Call `syncReadingPreferences()` during `onLoad` before loading content and during every `onShow` before favorite synchronization.

Use these handler semantics:

```js
syncReadingPreferences() {
  const preferences = getApp().getReadingPreferences();
  const readingDisplayClass = buildReadingDisplayClass(preferences);
  if (readingDisplayClass !== this.data.readingDisplayClass) {
    this.setData({ readingPreferences: preferences, readingDisplayClass });
  }
},

changeReadingPreferences(event) {
  const result = getApp().setReadingPreferences(event.detail.preferences);
  this.setData({
    readingPreferences: result.preferences,
    readingDisplayClass: buildReadingDisplayClass(result.preferences),
  });
  if (!result.saved) wx.showToast({ title: '设置未保存', icon: 'none' });
},
```

`resetReadingPreferences` uses the app reset method and applies the same failure behavior. Opening and closing only changes `readingSettingsVisible`; it must not mutate `currentScrollTop`, `detailsExpanded`, `templateExpanded`, expanded problems, or notes.

- [ ] **Step 4: Add page markup and semantic tokens**

- Append `{{readingDisplayClass}}` to the root `page-shell`.
- Add an action group in `knowledge-hero__meta` containing `Aa 阅读` and the existing favorite command.
- Pass `reading-preferences="{{readingPreferences}}"` to every essential and detail `content-block` instance.
- Add semantic size/leading classes only to summary, core concept text, figure caption, mistake text, note textarea, method description/steps, problem stem/answer/analysis, and problem steps.
- Add `reading-image` to knowledge and problem image elements.
- Place one controlled `reading-settings` instance after the page content so the sheet is not clipped by cards.
- Import the shared WXSS file in each subject page and add only page-specific action-layout rules locally.

Preserve the physics page's experiment-specific anchor and navigation behavior; do not replace the physics JavaScript file with the math copy.

- [ ] **Step 5: Run page and release checks**

Run: `node scripts/check-reading-display.js`

Run: `node scripts/check-release-readiness.js`

Run: `node scripts/check-package-boundaries.js`

Expected: all PASS; no subpackage cross-import is introduced.

- [ ] **Step 6: Commit all three readers together**

```bash
git add packages/math/pages/knowledge packages/english/pages/knowledge packages/physics/pages/knowledge scripts/check-reading-display.js
git commit -m "feat(reading): apply settings to three subject readers"
```

---

### Task 6: Profile Entry and Cross-Page Synchronization

**Files:**
- Modify: `scripts/check-reading-display.js`
- Modify: `pages/profile/index.js`
- Modify: `pages/profile/index.json`
- Modify: `pages/profile/index.wxml`
- Modify: `pages/profile/index.wxss`

**Interfaces:**
- Consumes app preference methods and `formatReadingPreferenceSummary`.
- Profile data adds `readingPreferences`, `readingPreferenceSummary`, and `readingSettingsVisible`.
- Profile uses the same event names as the knowledge pages.

- [ ] **Step 1: Add failing profile contract and synchronization checks**

Extend `scripts/check-reading-display.js` to assert the profile page:

- Registers `/components/reading-settings/index`.
- Displays a “阅读显示” row and the formatted current summary.
- Contains one controlled setting component.
- Implements open, close, change, reset, and `onShow` synchronization.
- Does not define its own option arrays or local normalization function.

- [ ] **Step 2: Run the focused check and verify the profile failure**

Run: `node scripts/check-reading-display.js`

Expected: FAIL because profile has no reading-setting registration.

- [ ] **Step 3: Implement the profile entry**

Import `DEFAULT_READING_PREFERENCES` and `formatReadingPreferenceSummary`. Add one unframed settings row immediately before the existing “本地数据” section, with:

- `Aa` visual marker.
- “阅读显示” title.
- Current summary such as `标准字 · 标准 · 全宽图片`.
- Familiar right chevron.

Reuse the shared component and exactly the same save-failure toast as readers. Start `onShow` with this synchronization before rebuilding note data and local snapshot counts, without clearing note query/filter state:

```js
const readingPreferences = getApp().getReadingPreferences();
this.setData({
  readingPreferences,
  readingPreferenceSummary: formatReadingPreferenceSummary(readingPreferences),
});
```

- [ ] **Step 4: Verify profile and backup flows**

Run: `node scripts/check-reading-display.js`

Run: `node scripts/check-local-backup.js`

Run: `node scripts/check-note-filters.js`

Expected: all PASS; profile note behavior and backup counts remain unchanged.

- [ ] **Step 5: Commit the profile entry**

```bash
git add pages/profile scripts/check-reading-display.js
git commit -m "feat(profile): expose reading display settings"
```

---

### Task 7: Full Verification, Simulator QA, Documentation, and Push

**Files:**
- Create: `docs/v1.6阅读显示设置实施记录.md`
- Modify: `README.md`
- Modify only if fresh evidence requires it: `.codex-output/v1.4-packages-preview.json`

**Interfaces:**
- No new runtime interface.
- Produces repository evidence for feature behavior, package limits, and remaining physical-device checks.

- [ ] **Step 1: Add the focused check to project documentation**

Add `node scripts/check-reading-display.js` beside the existing note and backup checks in `README.md`. Add “阅读显示设置” after local backup in the current v1.6 development sequence.

- [ ] **Step 2: Run the complete automated check suite**

Run each command independently and stop on the first failure:

```bash
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
node scripts/check-release-readiness.js
```

Expected: every command exits `0` with no project issue.

- [ ] **Step 3: Compile and inspect both target simulators**

In WeChat Developer Tools, compile the current project and verify the following on iPhone 14 Pro Max and Nexus 5:

1. Open one representative math, English, and physics knowledge point.
2. Open `Aa 阅读`; select every option in all three controls.
3. Confirm standard/standard/full matches the pre-change layout.
4. Confirm Chinese paragraphs, English IPA/long words, formulas, units, tables, and experiment rows do not overflow.
5. Confirm 72%, 86%, and 100% images remain centered, uncropped, and stable when cloud images fail.
6. Change settings from “我的”, return to an existing knowledge page, and confirm `onShow` synchronization.
7. Restore defaults and restart the mini program; confirm persistence.
8. Export a new backup, restore it, and confirm settings return.
9. Restore a pre-feature backup and confirm current settings remain unchanged.
10. Confirm favorite, notes, folding, problem expansion, next/previous navigation, and continue-reading position still work.

Expected: Developer Tools console has zero project errors and no incoherent overlap.

- [ ] **Step 4: Refresh package-size evidence**

Generate a fresh Developer Tools preview package report when the IDE service port is enabled, then run:

Run: `node scripts/check-package-sizes.js`

Expected: main `< 700 KiB`; English, math, and physics each `< 1 MiB`.

If the service port is unavailable, run the repository's conservative package boundary/size estimate, record the limitation explicitly, and do not claim precise preview-package sizes.

- [ ] **Step 5: Write the implementation record from actual evidence**

Create `docs/v1.6阅读显示设置实施记录.md` with:

- Implemented files and user-visible behavior.
- Preference and backup compatibility contracts.
- Exact automated command results.
- Simulator model results and console status.
- Fresh package sizes or the explicit service-port limitation.
- Any remaining physical iPhone/Android checks; do not mark them complete without device evidence.

- [ ] **Step 6: Verify the final diff before committing**

Run: `git diff --check`

Run: `git status --short`

Run: `git diff --stat HEAD~5`

Expected: no whitespace errors, no generated source assets, no unrelated files, and only intended documentation remains uncommitted at this step.

- [ ] **Step 7: Commit documentation**

```bash
git add README.md docs/v1.6阅读显示设置实施记录.md
git commit -m "docs: record reading display verification"
```

- [ ] **Step 8: Re-run focused and release gates after the final commit**

Run: `node scripts/check-reading-display.js`

Run: `node scripts/check-local-backup.js`

Run: `node scripts/check-release-readiness.js`

Run: `git status --short --branch`

Expected: all checks pass and the worktree is clean.

- [ ] **Step 9: Push the branch**

Run: `git push origin codex/reference-indexes-v1.6`

Expected: the remote branch advances through all reading-display commits without rewriting history.
