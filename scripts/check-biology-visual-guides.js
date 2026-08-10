const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pageDir = path.join(rootDir, 'packages/biology/pages/knowledge');
const pageJs = fs.readFileSync(path.join(pageDir, 'index.js'), 'utf8');
const wxml = fs.readFileSync(path.join(pageDir, 'index.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(pageDir, 'index.wxss'), 'utf8');

function assertGuideStylesAvoidResponsiveTraps(styles) {
  const guideStyles = styles.slice(styles.indexOf('.visual-guide'));
  assert(!/\.visual-guide[^\{]*\{[^}]*?(?:^|[;{\s])(?:height|min-height|max-height)\s*:/sm.test(guideStyles), '图解样式不能使用固定高度');
  assert(!/\.visual-guide[^\{]*\{[^}]*\boverflow-x\s*:/s.test(guideStyles), '图解样式不能横向滚动');
  assert(!/\.visual-guide[^\{]*\{[^}]*\b(?:text-overflow|-webkit-line-clamp)\s*:/s.test(guideStyles), '图解文字不能截断');
  assert(!/\.visual-guide[^\{]*\{[^}]*\b(?:linear|radial)-gradient\s*\(/s.test(guideStyles), '图解样式不能使用渐变');
}

function main() {
  assert(wxml.includes('wx:if="{{knowledge.visualGuide}}"'), '知识页缺少图解降级分支');
  assert(wxml.includes('visual-guide--{{knowledge.visualGuide.type}}'), '知识页未保留类型样式钩子');
  assert(pageJs.includes('function prepareVisualGuide'), '知识页未预处理图解节点');
  assert(wxss.includes('.visual-guide--compare'), '样式缺少对比图布局');

  assert(wxml.indexOf('visual-guide') > wxml.indexOf('explanation-section'), '图解必须位于概念说明之后');
  assert(wxml.indexOf('visual-guide') < wxml.indexOf('knowledge-figure'), '图解必须位于专题封面之前');
  assert(wxml.includes('item.displayIndex'), '图解节点必须显示序号');
  assert(wxml.includes('knowledge.visualGuide.isSequential && !item.isLast'), '只有 flow 的相邻节点可以显示方向箭头');
  assert(wxml.includes('knowledge.visualGuide.cycleHint'), 'cycle 图解必须显示关联提示');
  assert(!wxml.includes('回到起点'), 'cycle 图解不得暗示回到起点');
  assert(!pageJs.includes("guide.type === 'cycle' && !item.isLast"), 'cycle 图解不得渲染节点间因果箭头');
  const guideMarkup = wxml.slice(wxml.indexOf('visual-guide'), wxml.indexOf('knowledge-figure'));
  assert(!/class="[^"]*\bcard\b/.test(guideMarkup), '图解区块不能嵌套卡片');
  assert(wxss.includes('min-width: 0'), '对比图窄屏布局必须允许内容收缩换行');
  assert(/\.visual-guide--hierarchy[\s\S]*?padding-left:\s*(?:0|1[0-9]|2[0-9]|3[0-6])rpx/.test(wxss), 'hierarchy 缩进不得超过 36rpx');
  assertGuideStylesAvoidResponsiveTraps(wxss);

  console.log('OK biology visual guide page semantics');
}

try {
  main();
} catch (error) {
  console.error(`FOUND_BIOLOGY_VISUAL_GUIDE_PAGE_ISSUE\n${error.message}`);
  process.exitCode = 1;
}
