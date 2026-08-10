const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const subjects = ['english', 'physics', 'chemistry', 'biology'];

function readSubjectIndex(subject, extension) {
  return fs.readFileSync(
    path.join(root, 'packages', subject, 'pages', 'index', `index.${extension}`),
    'utf8',
  );
}

subjects.forEach((subject) => {
  const js = readSubjectIndex(subject, 'js');
  const wxml = readSubjectIndex(subject, 'wxml');
  const wxss = readSubjectIndex(subject, 'wxss');

  assert(/loading:\s*true/.test(js), `${subject} 首页必须有初始加载状态`);
  assert(/notFound:\s*''/.test(js), `${subject} 首页必须有缺失内容状态`);
  assert(/reopen\s*\(/.test(js), `${subject} 首页必须提供重新打开方法`);
  assert(/try\s*\{/.test(js) && /catch\s*\(/.test(js), `${subject} 首页必须捕获内容加载失败`);
  assert(/wx:(?:if|elif)="\{\{loading/.test(wxml), `${subject} 首页必须渲染加载状态`);
  assert(/wx:elif="\{\{notFound\}\}"/.test(wxml), `${subject} 首页必须渲染缺失内容状态`);
  assert(/bindtap="reopen"/.test(wxml), `${subject} 首页必须渲染重试入口`);
  assert(/\.error-state\s*\{/.test(wxss), `${subject} 首页必须有失败态样式`);
});

const mathJs = readSubjectIndex('math', 'js');
const mathWxml = readSubjectIndex('math', 'wxml');
const mathWxss = readSubjectIndex('math', 'wxss');

assert(/loading:\s*true/.test(mathJs), 'math 首页必须有初始加载状态');
assert(/notFound:\s*''/.test(mathJs), 'math 首页必须有缺失内容状态');
assert(/reopen\s*\(/.test(mathJs), 'math 首页必须提供重新打开方法');
assert(/try\s*\{/.test(mathJs) && /catch\s*\(/.test(mathJs), 'math 首页必须捕获内容加载失败');
assert(/wx:if="\{\{!loading && !notFound\}\}"/.test(mathWxml), 'math 首页必须在内容就绪后渲染主体');
assert(/wx:elif="\{\{loading\}\}"/.test(mathWxml), 'math 首页必须渲染加载状态');
assert(/wx:elif="\{\{notFound\}\}"/.test(mathWxml), 'math 首页必须渲染缺失内容状态');
assert(/bindtap="reopen"/.test(mathWxml), 'math 首页必须渲染重试入口');
assert(/\.error-state\s*\{/.test(mathWxss), 'math 首页必须有失败态样式');

console.log('OK subject index fallback contract');
