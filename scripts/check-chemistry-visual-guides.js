const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pageDir = path.join(rootDir, 'packages/chemistry/pages/knowledge');
const componentDir = path.join(rootDir, 'components/structured-visual-guide');
const pageJs = fs.readFileSync(path.join(pageDir, 'index.js'), 'utf8');
const pageJson = fs.readFileSync(path.join(pageDir, 'index.json'), 'utf8');
const wxml = fs.readFileSync(path.join(pageDir, 'index.wxml'), 'utf8');
const componentWxml = fs.readFileSync(path.join(componentDir, 'index.wxml'), 'utf8');

function isTagNameStart(character) {
  return typeof character === 'string' && /[A-Za-z_:]/.test(character);
}

function isTagNameCharacter(character) {
  return typeof character === 'string' && /[A-Za-z0-9_.:-]/.test(character);
}

function scanWxmlTags(source) {
  const tags = [];
  let index = 0;

  while (index < source.length) {
    if (source.startsWith('<!--', index)) {
      index += 4;
      while (index < source.length && !source.startsWith('-->', index)) index += 1;
      index += 3;
      continue;
    }

    if (source[index] !== '<' || !isTagNameStart(source[index + 1])) {
      index += 1;
      continue;
    }

    const start = index;
    let nameEnd = index + 1;
    while (nameEnd < source.length && isTagNameCharacter(source[nameEnd])) nameEnd += 1;

    let tagEnd = nameEnd;
    let quote = '';
    while (tagEnd < source.length) {
      const character = source[tagEnd];
      if (quote) {
        if (character === quote) quote = '';
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        break;
      }
      tagEnd += 1;
    }
    if (tagEnd === source.length) break;

    const attributes = {};
    let attributeIndex = nameEnd;
    while (attributeIndex < tagEnd) {
      while (/\s/.test(source[attributeIndex])) attributeIndex += 1;
      if (source[attributeIndex] === '/') {
        attributeIndex += 1;
        continue;
      }
      if (!isTagNameStart(source[attributeIndex])) {
        attributeIndex += 1;
        continue;
      }

      const attributeStart = attributeIndex;
      while (attributeIndex < tagEnd && isTagNameCharacter(source[attributeIndex])) attributeIndex += 1;
      const attributeName = source.slice(attributeStart, attributeIndex);
      while (/\s/.test(source[attributeIndex])) attributeIndex += 1;
      if (source[attributeIndex] !== '=') continue;

      attributeIndex += 1;
      while (/\s/.test(source[attributeIndex])) attributeIndex += 1;
      const attributeQuote = source[attributeIndex];
      if (attributeQuote !== '"' && attributeQuote !== "'") continue;

      attributeIndex += 1;
      const valueStart = attributeIndex;
      while (attributeIndex < tagEnd && source[attributeIndex] !== attributeQuote) attributeIndex += 1;
      if (attributeIndex >= tagEnd) continue;
      attributes[attributeName] = source.slice(valueStart, attributeIndex);
      attributeIndex += 1;
    }

    const raw = source.slice(start, tagEnd + 1);
    tags.push({
      name: source.slice(index + 1, nameEnd),
      start,
      end: tagEnd + 1,
      raw,
      selfClosing: raw.slice(0, -1).trimEnd().endsWith('/'),
      attributes,
    });
    index = tagEnd + 1;
  }

  return tags;
}

function assertStructuredVisualGuideMarkup(markup) {
  const tags = scanWxmlTags(markup);
  const guideNodes = tags.filter((tag) => (
    tag.name === 'structured-visual-guide' && tag.selfClosing
  ));
  assert.strictEqual(guideNodes.length, 1, '化学页必须恰有一个真实的自闭合图解组件');

  const [guideNode] = guideNodes;
  assert.strictEqual(guideNode.attributes.guide, '{{knowledge.visualGuide}}', '化学页必须传入预处理图解');
  assert.strictEqual(guideNode.attributes['reading-preferences'], '{{readingPreferences}}', '化学图解必须承接阅读设置');

  const figureNodes = tags.filter((tag) => (
    tag.name === 'view'
    && tag.attributes['wx:if'] === '{{knowledge.hasCoverImage}}'
    && (tag.attributes.class || '').split(/\s+/).includes('knowledge-figure')
  ));
  assert.strictEqual(figureNodes.length, 1, '化学页必须恰有一个真实的云封面图');
  assert(guideNode.start < figureNodes[0].start, '化学图解必须在云封面图之前显示');
}

const MISSING_GUIDE_WXML = '<view class="knowledge-figure"></view>';
const COMMENT_SPOOFED_MISPLACED_WXML = `
<!-- <structured-visual-guide guide="{{knowledge.visualGuide}}" reading-preferences="{{readingPreferences}}" /> -->
<view wx:if="{{knowledge.hasCoverImage}}" class="knowledge-figure"></view>
<structured-visual-guide guide="{{knowledge.visualGuide}}" reading-preferences="{{readingPreferences}}" />
`;
const ATTRIBUTE_SPOOFED_MISPLACED_WXML = `
<view data-guide='<structured-visual-guide guide="{{knowledge.visualGuide}}" reading-preferences="{{readingPreferences}}" />'></view>
<view wx:if="{{knowledge.hasCoverImage}}" class="knowledge-figure"></view>
<structured-visual-guide guide="{{knowledge.visualGuide}}" reading-preferences="{{readingPreferences}}" />
`;
const ESCAPED_TEXT_MISPLACED_WXML = `
&lt;structured-visual-guide guide="{{knowledge.visualGuide}}" reading-preferences="{{readingPreferences}}" /&gt;
<view wx:if="{{knowledge.hasCoverImage}}" class="knowledge-figure"></view>
<structured-visual-guide guide="{{knowledge.visualGuide}}" reading-preferences="{{readingPreferences}}" />
`;
const SINGLE_QUOTED_COVER_MISPLACED_WXML = `
<view wx:if='{{knowledge.hasCoverImage}}' class='knowledge-figure'></view>
<structured-visual-guide guide="{{knowledge.visualGuide}}" reading-preferences="{{readingPreferences}}" />
<view class="knowledge-figure"></view>
`;

try {
  assert(pageJs.includes("require('../../../../utils/structured-visual-guide')"), '化学页必须预处理图解');
  assert(pageJs.includes('prepareStructuredVisualGuide(knowledge.visualGuide)'), '化学页必须生成渲染副本');
  assert(pageJson.includes('structured-visual-guide'), '化学页必须注册公共图解组件');
  assert.throws(
    () => assertStructuredVisualGuideMarkup(MISSING_GUIDE_WXML),
    /化学页必须恰有一个真实的自闭合图解组件/,
    '缺失真实图解节点必须被拒绝',
  );
  assert.throws(
    () => assertStructuredVisualGuideMarkup(COMMENT_SPOOFED_MISPLACED_WXML),
    /化学图解必须在云封面图之前显示/,
    '注释伪造的图解不能掩盖封面后的真实节点',
  );
  assert.throws(
    () => assertStructuredVisualGuideMarkup(ATTRIBUTE_SPOOFED_MISPLACED_WXML),
    /化学图解必须在云封面图之前显示/,
    '属性中的伪造图解不能掩盖封面后的真实节点',
  );
  assert.throws(
    () => assertStructuredVisualGuideMarkup(ESCAPED_TEXT_MISPLACED_WXML),
    /化学图解必须在云封面图之前显示/,
    '转义文本不能掩盖封面后的真实节点',
  );
  assert.throws(
    () => assertStructuredVisualGuideMarkup(SINGLE_QUOTED_COVER_MISPLACED_WXML),
    /化学图解必须在云封面图之前显示/,
    '真实单引号封面必须优先于后续的诱饵图像容器',
  );
  assert.doesNotThrow(
    () => assertStructuredVisualGuideMarkup(wxml),
    '实际化学 WXML 必须通过图解节点语义检查',
  );
  assert(componentWxml.includes('wx:if="{{guide}}"'), '公共图解组件必须提供空数据降级');
  assert(wxml.includes('knowledge-figure__fallback'), '封面图加载失败时的文字降级必须保留');

  console.log('OK chemistry visual guide page semantics');
} catch (error) {
  console.error(`FOUND_CHEMISTRY_VISUAL_GUIDE_PAGE_ISSUE\n${error.message}`);
  process.exitCode = 1;
}
