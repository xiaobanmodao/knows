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

function assertStructuredVisualGuideMarkup(markup) {
  const withoutComments = markup.replace(/<!--[\s\S]*?-->/g, '');
  const guideNodes = [...withoutComments.matchAll(/<structured-visual-guide\b[^>]*\/>/g)];
  assert.strictEqual(guideNodes.length, 1, '化学页必须恰有一个真实的自闭合图解组件');

  const [guideNode] = guideNodes;
  assert(/\bguide\s*=\s*"\{\{knowledge\.visualGuide\}\}"/.test(guideNode[0]), '化学页必须传入预处理图解');
  assert(/\breading-preferences\s*=\s*"\{\{readingPreferences\}\}"/.test(guideNode[0]), '化学图解必须承接阅读设置');

  const figureNode = /<view\b[^>]*\bclass\s*=\s*"[^"]*\bknowledge-figure\b[^"]*"[^>]*>/.exec(withoutComments);
  assert(figureNode, '化学页必须保留云封面图');
  assert(guideNode.index < figureNode.index, '化学图解必须在云封面图之前显示');
}

const MISSING_GUIDE_WXML = '<view class="knowledge-figure"></view>';
const COMMENT_SPOOFED_MISPLACED_WXML = `
<!-- <structured-visual-guide guide="{{knowledge.visualGuide}}" reading-preferences="{{readingPreferences}}" /> -->
<view class="knowledge-figure"></view>
<structured-visual-guide guide="{{knowledge.visualGuide}}" reading-preferences="{{readingPreferences}}" />
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
