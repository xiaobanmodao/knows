const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pageDir = path.join(rootDir, 'packages/biology/pages/knowledge');
const visualGuidePath = path.join(pageDir, 'visual-guide.js');
const pageJs = fs.readFileSync(path.join(pageDir, 'index.js'), 'utf8');
const wxml = fs.readFileSync(path.join(pageDir, 'index.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(pageDir, 'index.wxss'), 'utf8');
const CYCLE_HINT = '这些环节持续关联，不表示单一因果链。';

function freezeGuide(guide) {
  guide.items.forEach((item) => Object.freeze(item));
  Object.freeze(guide.items);
  return Object.freeze(guide);
}

function createGuide(type, items) {
  return {
    type,
    title: `${type} 图解`,
    summary: `${type} 摘要`,
    items,
  };
}

function labels(items) {
  return items.map((item) => item.label);
}

function getGuideMarkup(source) {
  const start = source.indexOf('<view wx:if="{{knowledge.visualGuide}}" class="visual-guide');
  const end = source.indexOf('<view wx:if="{{knowledge.hasCoverImage}}" class="knowledge-figure');
  assert(start >= 0 && end > start, '知识页缺少受保护的完整图解区块');
  return source.slice(start, end);
}

function getCssRule(styles, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = styles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert(match, `缺少图解样式选择器 ${selector}`);
  return match[1];
}

function hasDeclaration(rule, property, value) {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|;)\\s*${escapedProperty}\\s*:\\s*${escapedValue}\\s*(?:;|$)`).test(rule);
}

function assertPrepareVisualGuide(prepareVisualGuide) {
  assert.strictEqual(prepareVisualGuide(null), null, 'null 图解必须跳过');
  assert.strictEqual(prepareVisualGuide({}), null, '缺少 items 的图解必须跳过');
  assert.strictEqual(prepareVisualGuide({ items: [] }), null, '空 items 图解必须跳过');

  const source = freezeGuide(createGuide('flow', [
    { label: '起点', note: '第一项', tone: 'blue' },
    { label: '终点', note: '第二项', tone: 'green' },
  ]));
  const snapshot = JSON.stringify(source);
  const prepared = prepareVisualGuide(source);
  assert.strictEqual(JSON.stringify(source), snapshot, '预处理不得改动冻结输入');
  assert.notStrictEqual(prepared, source, '图解必须返回新对象');
  assert.notStrictEqual(prepared.items, source.items, '节点数组必须深拷贝');
  assert.notStrictEqual(prepared.items[0], source.items[0], '节点对象必须深拷贝');
  assert.deepStrictEqual(prepared.items.map((item) => [item.displayIndex, item.isLast]), [[1, false], [2, true]]);
  assert.strictEqual(prepared.isSequential, true, 'flow 必须启用相邻连接符');
  assert.strictEqual(prepared.isCycle, false, 'flow 不能被识别为 cycle');

  const cycle = prepareVisualGuide(createGuide('cycle', [
    { label: '环节一', note: '持续关联', tone: 'blue' },
    { label: '环节二', note: '持续关联', tone: 'green' },
  ]));
  assert.strictEqual(cycle.isSequential, false, 'cycle 不能启用相邻因果连接符');
  assert.strictEqual(cycle.isCycle, true, 'cycle 必须保留类型标记');
  assert.strictEqual(cycle.cycleHint, CYCLE_HINT, 'cycle 必须使用固定关联提示');

  const compareThreeTwo = prepareVisualGuide(createGuide('compare', [
    { label: '左一', note: '左一说明', tone: 'blue', lane: 'left' },
    { label: '左二', note: '左二说明', tone: 'green', lane: 'left' },
    { label: '左三', note: '左三说明', tone: 'amber', lane: 'left' },
    { label: '右一', note: '右一说明', tone: 'slate', lane: 'right' },
    { label: '右二', note: '右二说明', tone: 'blue', lane: 'right' },
  ]));
  assert.strictEqual(compareThreeTwo.isCompare, true, 'compare 必须保留类型标记');
  assert.deepStrictEqual(labels(compareThreeTwo.compareColumns.left), ['左一', '左二', '左三']);
  assert.deepStrictEqual(labels(compareThreeTwo.compareColumns.right), ['右一', '右二']);
  assert.strictEqual(compareThreeTwo.compareColumns.left[0].displayIndex, 1, '3+2 左列必须从第一项开始');
  assert.strictEqual(compareThreeTwo.compareColumns.right[0].displayIndex, 4, '3+2 右列必须从第一项开始');

  const compareTwoTwo = prepareVisualGuide(createGuide('compare', [
    { label: '左甲', note: '左甲说明', tone: 'blue', lane: 'left' },
    { label: '左乙', note: '左乙说明', tone: 'green', lane: 'left' },
    { label: '右甲', note: '右甲说明', tone: 'amber', lane: 'right' },
    { label: '右乙', note: '右乙说明', tone: 'slate', lane: 'right' },
  ]));
  assert.deepStrictEqual(labels(compareTwoTwo.compareColumns.left), ['左甲', '左乙']);
  assert.deepStrictEqual(labels(compareTwoTwo.compareColumns.right), ['右甲', '右乙']);
  assert.strictEqual(compareTwoTwo.compareColumns.left[0].displayIndex, 1, '2+2 左列必须从第一项开始');
  assert.strictEqual(compareTwoTwo.compareColumns.right[0].displayIndex, 3, '2+2 右列必须从第一项开始');
}

function assertGuideMarkupAndStyles() {
  const guideMarkup = getGuideMarkup(wxml);
  const explanationIndex = wxml.indexOf('<view class="explanation-section');
  const figureIndex = wxml.indexOf('<view wx:if="{{knowledge.hasCoverImage}}" class="knowledge-figure');
  assert(explanationIndex >= 0 && explanationIndex < wxml.indexOf(guideMarkup), '图解必须位于概念说明之后');
  assert(figureIndex > wxml.indexOf(guideMarkup), '图解必须位于专题封面之前');
  assert(guideMarkup.includes('visual-guide--{{knowledge.visualGuide.type}}'), '图解根节点缺少类型样式钩子');
  assert(!/class="[^"]*\bcard\b/.test(guideMarkup), '图解区块不能嵌套卡片');

  const compareStart = guideMarkup.indexOf('<block wx:if="{{knowledge.visualGuide.isCompare}}">');
  const nonCompareStart = guideMarkup.indexOf('<block wx:else>');
  assert(compareStart >= 0 && nonCompareStart > compareStart, 'compare 必须与普通列表使用独立分支');
  const compareMarkup = guideMarkup.slice(compareStart, nonCompareStart);
  const nonCompareMarkup = guideMarkup.slice(nonCompareStart);
  assert(/class="visual-guide__compare"/.test(compareMarkup), 'compare 必须使用独立两列容器');
  assert.strictEqual((compareMarkup.match(/class="visual-guide__compare-column"/g) || []).length, 2, 'compare 必须有两个列容器');
  assert(/class="visual-guide__compare-column"[^>]*>[\s\S]*wx:for="\{\{knowledge\.visualGuide\.compareColumns\.left\}\}"/.test(compareMarkup), 'compare 左列必须显式循环 left');
  assert(/class="visual-guide__compare-column"[^>]*>[\s\S]*wx:for="\{\{knowledge\.visualGuide\.compareColumns\.right\}\}"/.test(compareMarkup), 'compare 右列必须显式循环 right');
  assert(!compareMarkup.includes('visual-guide__connector'), 'compare 区块不能渲染连接符');
  assert((guideMarkup.match(/class="visual-guide__connector"/g) || []).length === 1, '连接符只能在普通列表中出现一次');
  assert(/wx:if="\{\{knowledge\.visualGuide\.isSequential && !item\.isLast\}\}" class="visual-guide__connector"/.test(nonCompareMarkup), '普通列表连接符必须只受 flow 相邻节点条件控制');
  assert(/wx:if="\{\{knowledge\.visualGuide\.isCycle\}\}" class="visual-guide__cycle-hint">\{\{knowledge\.visualGuide\.cycleHint\}\}/.test(guideMarkup), 'cycle 必须显示固定关联提示');
  assert(!guideMarkup.includes('回到起点'), 'cycle 图解不得暗示回到起点');
  assert(!guideMarkup.includes('visual-guide__item--{{item.lane}}'), 'compare 不能依赖 lane 的节点网格定位');

  const itemRule = getCssRule(wxss, '.visual-guide__item');
  const bodyRule = getCssRule(wxss, '.visual-guide__body');
  const compareRule = getCssRule(wxss, '.visual-guide__compare');
  const compareColumnRule = getCssRule(wxss, '.visual-guide__compare-column');
  assert(hasDeclaration(itemRule, 'min-width', '0'), '图解节点必须可收缩');
  assert(hasDeclaration(bodyRule, 'min-width', '0'), '图解节点正文必须可收缩');
  assert(hasDeclaration(compareColumnRule, 'min-width', '0'), 'compare 列必须可收缩');
  assert(hasDeclaration(compareRule, 'display', 'grid'), 'compare 容器必须使用两列 grid');
  assert(hasDeclaration(compareRule, 'grid-template-columns', 'repeat(2, minmax(0, 1fr))'), 'compare 必须使用可收缩两列');
  assert(!/\.visual-guide--compare\s+\.visual-guide__items\s*\{/.test(wxss), 'compare 不能依赖稀疏节点 grid');
  assert(!/\.visual-guide__item--(?:left|right)\s*\{[\s\S]*?grid-column\s*:/.test(wxss), 'compare 不能依赖 lane 的 grid-column 排列');
  assert(hasDeclaration(getCssRule(wxss, '.visual-guide--hierarchy .visual-guide__item--depth-1'), 'padding-left', '18rpx'));
  assert(hasDeclaration(getCssRule(wxss, '.visual-guide--hierarchy .visual-guide__item--depth-2'), 'padding-left', '36rpx'));

  const guideRules = wxss.match(/\.visual-guide[^\{]*\{[^}]*\}/g) || [];
  guideRules.forEach((rule) => {
    assert(!/(?:^|;)\s*(?:height|min-height|max-height)\s*:/m.test(rule), '图解样式不能使用固定高度');
    assert(!/(?:^|;)\s*overflow-x\s*:/m.test(rule), '图解样式不能横向滚动');
    assert(!/(?:^|;)\s*(?:text-overflow|-webkit-line-clamp)\s*:/m.test(rule), '图解文字不能截断');
    assert(!/(?:linear|radial)-gradient\s*\(/.test(rule), '图解样式不能使用渐变');
  });
}

function main() {
  assert(fs.existsSync(visualGuidePath), '知识页缺少可测试的 visual-guide 模块');
  const { prepareVisualGuide } = require(visualGuidePath);
  assert.strictEqual(typeof prepareVisualGuide, 'function', 'visual-guide 模块必须导出 prepareVisualGuide');
  assert(/require\(['"]\.\/visual-guide['"]\)/.test(pageJs), '知识页必须使用 visual-guide 预处理模块');
  assertPrepareVisualGuide(prepareVisualGuide);
  assertGuideMarkupAndStyles();
  console.log('OK biology visual guide page semantics');
}

try {
  main();
} catch (error) {
  console.error(`FOUND_BIOLOGY_VISUAL_GUIDE_PAGE_ISSUE\n${error.message}`);
  process.exitCode = 1;
}
