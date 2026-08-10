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
const RESPONSIVE_SELECTORS = Object.freeze([
  '.visual-guide__item',
  '.visual-guide__body',
  '.visual-guide__compare',
  '.visual-guide__compare-column',
]);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach((item) => deepFreeze(item));
  return Object.freeze(value);
}

function isContainer(value) {
  return Array.isArray(value) || (value && Object.getPrototypeOf(value) === Object.prototype);
}

function assertNoSharedContainers(source, prepared, path = 'guide') {
  if (!isContainer(source)) return;
  assert(isContainer(prepared), `${path} 必须保留对象或数组结构`);
  assert.notStrictEqual(prepared, source, `${path} 不能与输入共享引用`);
  Object.keys(source).forEach((key) => {
    assertNoSharedContainers(source[key], prepared[key], `${path}.${key}`);
  });
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

function findMatchingView(source, openingIndex) {
  const openingTag = source.slice(openingIndex).match(/^<view\b[^>]*>/);
  assert(openingTag, 'compare 列容器缺少 view 开始标签');

  const viewTags = /<\/?view\b[^>]*>/g;
  viewTags.lastIndex = openingIndex;
  let depth = 0;
  let tagMatch;
  while ((tagMatch = viewTags.exec(source))) {
    if (tagMatch[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) {
        return {
          start: openingIndex,
          openingEnd: openingIndex + openingTag[0].length,
          closingStart: tagMatch.index,
          end: viewTags.lastIndex,
          body: source.slice(openingIndex + openingTag[0].length, tagMatch.index),
        };
      }
    } else {
      depth += 1;
    }
  }

  assert.fail('compare 列容器缺少对应的 view 结束标签');
}

function findViewsByClass(source, className) {
  const classPattern = /<view\b[^>]*\bclass="([^"]*)"[^>]*>/g;
  const views = [];
  let match;
  while ((match = classPattern.exec(source))) {
    if (match[1].split(/\s+/).includes(className)) {
      views.push(findMatchingView(source, match.index));
    }
  }
  return views;
}

function getCssRule(styles, selector) {
  const exactRule = new RegExp(`(^|\\n)[\\t ]*${escapeRegex(selector)}[\\t ]*\\{([^}]*)\\}`, 'm');
  const match = styles.match(exactRule);
  assert(match, `缺少图解样式选择器 ${selector}`);
  return match[2];
}

function hasDeclaration(rule, property, value) {
  return new RegExp(`(?:^|;)\\s*${escapeRegex(property)}\\s*:\\s*${escapeRegex(value)}\\s*(?:;|$)`).test(rule);
}

function prefixCssRule(styles, selector) {
  const exactRule = new RegExp(`(^|\\n)([\\t ]*)${escapeRegex(selector)}(?=[\\t ]*\\{)`, 'm');
  assert(exactRule.test(styles), `缺少可变异样式选择器 ${selector}`);
  return styles.replace(exactRule, (_, lineStart, indent) => `${lineStart}${indent}.dead ${selector}`);
}

function countLoop(markup, collection) {
  const loop = `wx:for="{{knowledge.visualGuide.compareColumns.${collection}}}"`;
  return markup.split(loop).length - 1;
}

function assertCompareColumnStructure(compareMarkup) {
  const columns = findViewsByClass(compareMarkup, 'visual-guide__compare-column');
  assert.strictEqual(columns.length, 2, 'compare 必须有两个列容器');
  const [leftColumn, rightColumn] = columns;
  assert.strictEqual(countLoop(compareMarkup, 'left'), 1, 'compare 左列循环只能出现一次');
  assert.strictEqual(countLoop(compareMarkup, 'right'), 1, 'compare 右列循环只能出现一次');
  assert.strictEqual(countLoop(leftColumn.body, 'left'), 1, 'compare 左列循环必须在第一个列容器内');
  assert.strictEqual(countLoop(leftColumn.body, 'right'), 0, 'compare 右列循环不能出现在第一个列容器内');
  assert.strictEqual(countLoop(rightColumn.body, 'left'), 0, 'compare 左列循环不能出现在第二个列容器内');
  assert.strictEqual(countLoop(rightColumn.body, 'right'), 1, 'compare 右列循环必须在第二个列容器内');
}

function moveCompareLoopsOutsideColumns(compareMarkup) {
  const leftLoop = 'wx:for="{{knowledge.visualGuide.compareColumns.left}}"';
  const rightLoop = 'wx:for="{{knowledge.visualGuide.compareColumns.right}}"';
  const withoutColumnLoops = compareMarkup
    .replace(leftLoop, 'data-removed-for="left"')
    .replace(rightLoop, 'data-removed-for="right"');
  const compareContainer = findViewsByClass(withoutColumnLoops, 'visual-guide__compare')[0];
  const movedLoops = `<view ${leftLoop}></view><view ${rightLoop}></view>`;
  return [
    withoutColumnLoops.slice(0, compareContainer.end),
    movedLoops,
    withoutColumnLoops.slice(compareContainer.end),
  ].join('');
}

function getVisualGuideRules(styles) {
  const rules = [];
  const rulePattern = /(^|\n)([^{}\n]+)\{([^}]*)\}/g;
  let match;
  while ((match = rulePattern.exec(styles))) {
    const selector = match[2].trim();
    if (selector.includes('.visual-guide')) {
      rules.push({ selector, body: match[3] });
    }
  }
  return rules;
}

function ruleBodyHasProperty(body, property) {
  const propertyPattern = new RegExp(`^\\s*${escapeRegex(property)}\\s*:`);
  return body.split(';').some((declaration) => propertyPattern.test(declaration));
}

function assertGuideStylesAvoidResponsiveTraps(styles) {
  const guideRules = getVisualGuideRules(styles);
  assert(guideRules.length > 0, '缺少图解样式规则');
  guideRules.forEach(({ body }) => {
    assert(!['height', 'min-height', 'max-height'].some((property) => ruleBodyHasProperty(body, property)), '图解样式不能使用固定高度');
    assert(!ruleBodyHasProperty(body, 'overflow-x'), '图解样式不能横向滚动');
    assert(!['text-overflow', '-webkit-line-clamp'].some((property) => ruleBodyHasProperty(body, property)), '图解文字不能截断');
    assert(!/(?:linear|radial)-gradient\s*\(/.test(body), '图解样式不能使用渐变');
  });
}

function assertForbiddenStyleProbes(styles) {
  const probes = [
    ['height: 100rpx;', '图解样式不能使用固定高度'],
    ['overflow-x: auto;', '图解样式不能横向滚动'],
    ['text-overflow: ellipsis;', '图解文字不能截断'],
    ['-webkit-line-clamp: 2;', '图解文字不能截断'],
  ];
  probes.forEach(([declaration, message]) => {
    const mutatedStyles = `${styles}\n.visual-guide__probe { ${declaration} }`;
    assert.throws(() => assertGuideStylesAvoidResponsiveTraps(mutatedStyles), new RegExp(message));
  });
}

function assertPrepareVisualGuide(prepareVisualGuide) {
  assert.strictEqual(prepareVisualGuide(null), null, 'null 图解必须跳过');
  assert.strictEqual(prepareVisualGuide({}), null, '缺少 items 的图解必须跳过');
  assert.strictEqual(prepareVisualGuide({ items: [] }), null, '空 items 图解必须跳过');

  const source = deepFreeze(createGuide('flow', [
    {
      label: '起点',
      note: '第一项',
      tone: 'blue',
      meta: { labels: ['原始'], details: { source: '原始' } },
    },
    { label: '终点', note: '第二项', tone: 'green' },
  ]));
  const snapshot = JSON.stringify(source);
  const prepared = prepareVisualGuide(source);
  const aliasedPrepared = prepareVisualGuide(source);
  aliasedPrepared.items[0].meta.details = source.items[0].meta.details;
  assert.strictEqual(JSON.stringify(source), snapshot, '预处理不得改动冻结输入');
  assert.notStrictEqual(prepared, source, '图解必须返回新对象');
  assert.notStrictEqual(prepared.items, source.items, '节点数组必须深拷贝');
  assert.notStrictEqual(prepared.items[0], source.items[0], '节点对象必须深拷贝');
  assert.notStrictEqual(prepared.items[0].meta, source.items[0].meta, '节点嵌套对象必须深拷贝');
  assert.notStrictEqual(prepared.items[0].meta.labels, source.items[0].meta.labels, '节点嵌套数组必须深拷贝');
  assert.notStrictEqual(prepared.items[0].meta.details, source.items[0].meta.details, '节点深层对象必须深拷贝');
  assertNoSharedContainers(source, prepared);
  assert.throws(
    () => assertNoSharedContainers(source, aliasedPrepared),
    /guide\.items\.0\.meta\.details 不能与输入共享引用/,
    '深层对象别名必须被检查器拒绝',
  );
  prepared.items[0].meta.labels.push('输出');
  prepared.items[0].meta.details.source = '输出';
  assert.strictEqual(prepared.items[0].meta.details.source, '输出', '输出深层值必须可以被修改');
  assert.strictEqual(source.items[0].meta.details.source, '原始', '源 guide 的深层值必须保持原始');
  assert.strictEqual(JSON.stringify(source), snapshot, '修改输出深层值不得改动冻结输入');
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

function assertGuideMarkupAndStyles(markup, styles) {
  const guideMarkup = getGuideMarkup(markup);
  const explanationIndex = markup.indexOf('<view class="explanation-section');
  const figureIndex = markup.indexOf('<view wx:if="{{knowledge.hasCoverImage}}" class="knowledge-figure');
  assert(explanationIndex >= 0 && explanationIndex < markup.indexOf(guideMarkup), '图解必须位于概念说明之后');
  assert(figureIndex > markup.indexOf(guideMarkup), '图解必须位于专题封面之前');
  assert(guideMarkup.includes('visual-guide--{{knowledge.visualGuide.type}}'), '图解根节点缺少类型样式钩子');
  assert(!/class="[^"]*\bcard\b/.test(guideMarkup), '图解区块不能嵌套卡片');

  const compareStart = guideMarkup.indexOf('<block wx:if="{{knowledge.visualGuide.isCompare}}">');
  const nonCompareStart = guideMarkup.indexOf('<block wx:else>');
  assert(compareStart >= 0 && nonCompareStart > compareStart, 'compare 必须与普通列表使用独立分支');
  const compareMarkup = guideMarkup.slice(compareStart, nonCompareStart);
  const nonCompareMarkup = guideMarkup.slice(nonCompareStart);
  assert(findViewsByClass(compareMarkup, 'visual-guide__compare').length === 1, 'compare 必须使用独立两列容器');
  assertCompareColumnStructure(compareMarkup);
  assert.throws(
    () => assertCompareColumnStructure(moveCompareLoopsOutsideColumns(compareMarkup)),
    /compare (?:左列|右列)循环必须在第[一二]个列容器内/,
    '循环移出列容器必须被拒绝',
  );
  assert(!compareMarkup.includes('visual-guide__connector'), 'compare 区块不能渲染连接符');
  assert.strictEqual((guideMarkup.match(/class="visual-guide__connector"/g) || []).length, 1, '连接符只能在普通列表中出现一次');
  assert(/wx:if="\{\{knowledge\.visualGuide\.isSequential && !item\.isLast\}\}" class="visual-guide__connector"/.test(nonCompareMarkup), '普通列表连接符必须只受 flow 相邻节点条件控制');
  assert(/wx:if="\{\{knowledge\.visualGuide\.isCycle\}\}" class="visual-guide__cycle-hint">\{\{knowledge\.visualGuide\.cycleHint\}\}/.test(guideMarkup), 'cycle 必须显示固定关联提示');
  assert(!guideMarkup.includes('回到起点'), 'cycle 图解不得暗示回到起点');
  assert(!guideMarkup.includes('visual-guide__item--{{item.lane}}'), 'compare 不能依赖 lane 的节点网格定位');

  const rules = Object.fromEntries(RESPONSIVE_SELECTORS.map((selector) => [selector, getCssRule(styles, selector)]));
  assert(hasDeclaration(rules['.visual-guide__item'], 'min-width', '0'), '图解节点必须可收缩');
  assert(hasDeclaration(rules['.visual-guide__body'], 'min-width', '0'), '图解节点正文必须可收缩');
  assert(hasDeclaration(rules['.visual-guide__compare-column'], 'min-width', '0'), 'compare 列必须可收缩');
  assert(hasDeclaration(rules['.visual-guide__compare'], 'display', 'grid'), 'compare 容器必须使用两列 grid');
  assert(hasDeclaration(rules['.visual-guide__compare'], 'grid-template-columns', 'repeat(2, minmax(0, 1fr))'), 'compare 必须使用可收缩两列');
  RESPONSIVE_SELECTORS.forEach((selector) => {
    assert.throws(() => getCssRule(prefixCssRule(styles, selector), selector), /缺少图解样式选择器/, `无效祖先前缀必须使 ${selector} 失效`);
  });
  assert(!/\.visual-guide--compare\s+\.visual-guide__items\s*\{/.test(styles), 'compare 不能依赖稀疏节点 grid');
  assert(!/\.visual-guide__item--(?:left|right)\s*\{[\s\S]*?grid-column\s*:/.test(styles), 'compare 不能依赖 lane 的 grid-column 排列');
  assert(hasDeclaration(getCssRule(styles, '.visual-guide--hierarchy .visual-guide__item--depth-1'), 'padding-left', '18rpx'));
  assert(hasDeclaration(getCssRule(styles, '.visual-guide--hierarchy .visual-guide__item--depth-2'), 'padding-left', '36rpx'));
  assertGuideStylesAvoidResponsiveTraps(styles);
  assertForbiddenStyleProbes(styles);
}

function main() {
  assert(fs.existsSync(visualGuidePath), '知识页缺少可测试的 visual-guide 模块');
  const { prepareVisualGuide } = require(visualGuidePath);
  assert.strictEqual(typeof prepareVisualGuide, 'function', 'visual-guide 模块必须导出 prepareVisualGuide');
  assert(/require\(['"]\.\/visual-guide['"]\)/.test(pageJs), '知识页必须使用 visual-guide 预处理模块');
  assertPrepareVisualGuide(prepareVisualGuide);
  assertGuideMarkupAndStyles(wxml, wxss);
  console.log('OK biology visual guide page semantics');
}

try {
  main();
} catch (error) {
  console.error(`FOUND_BIOLOGY_VISUAL_GUIDE_PAGE_ISSUE\n${error.message}`);
  process.exitCode = 1;
}
