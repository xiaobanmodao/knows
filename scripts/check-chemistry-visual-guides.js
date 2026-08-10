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

try {
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
  assert(wxml.includes('knowledge-figure__fallback'), '封面图加载失败时的文字降级必须保留');

  console.log('OK chemistry visual guide page semantics');
} catch (error) {
  console.error(`FOUND_CHEMISTRY_VISUAL_GUIDE_PAGE_ISSUE\n${error.message}`);
  process.exitCode = 1;
}
