const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pages = [
  ['english', 'unit'],
  ['english', 'topic'],
  ['english', 'knowledge'],
  ['english', 'template'],
  ['math', 'chapter'],
  ['math', 'topic'],
  ['math', 'knowledge'],
  ['math', 'template'],
  ['physics', 'chapter'],
  ['physics', 'topic'],
  ['physics', 'knowledge'],
  ['physics', 'template'],
  ['chemistry', 'topic'],
  ['chemistry', 'knowledge'],
  ['chemistry', 'template'],
  ['biology', 'topic'],
  ['biology', 'knowledge'],
  ['biology', 'template'],
];

pages.forEach(([subject, page]) => {
  const base = path.join(root, 'packages', subject, 'pages', page, `index`);
  const js = fs.readFileSync(`${base}.js`, 'utf8');
  const wxml = fs.readFileSync(`${base}.wxml`, 'utf8');
  const wxss = fs.readFileSync(`${base}.wxss`, 'utf8');
  const label = `${subject}/${page}`;

  assert(/loading:\s*true/.test(js), `${label} 必须有初始加载状态`);
  assert(/notFound:\s*''/.test(js), `${label} 必须有缺失内容状态`);
  assert(/reopen\s*\(/.test(js), `${label} 必须提供重新打开方法`);
  const idField = {
    unit: 'currentUnitId',
    chapter: 'currentChapterId',
    topic: 'currentTopicId',
    knowledge: 'currentKnowledgeId',
    template: 'currentTemplateId',
  }[page];
  assert(new RegExp(idField).test(js), `${label} 必须保存当前实体 ID`);
  const retryKeepsId = /reopen\s*\(\)[\s\S]{0,240}id\s*:/.test(js)
    || /reopen\s*\(\)[\s\S]{0,240}loadKnowledge\(\s*this\.currentKnowledgeId/.test(js);
  assert(retryKeepsId, `${label} 重试必须带回当前实体 ID`);
  assert(/try\s*\{/.test(js) && /catch\s*\(/.test(js), `${label} 必须捕获内容加载失败`);
  assert(/<view[^>]*wx:if=/.test(wxml), `${label} 必须有条件渲染的内容主体`);
  assert(/wx:elif="\{\{loading\}\}"/.test(wxml), `${label} 必须渲染加载状态`);
  assert(/notFound/.test(wxml), `${label} 必须渲染缺失状态`);
  assert(/bindtap="reopen"/.test(wxml), `${label} 必须渲染重试入口`);
  assert(/\.error-state\s*\{/.test(wxss), `${label} 必须有失败态样式`);
});

console.log('OK detail page fallback contract');
