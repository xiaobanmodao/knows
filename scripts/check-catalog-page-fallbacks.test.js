const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pages = ['search', 'reference-index'];

pages.forEach((page) => {
  const base = path.join(root, 'packages', 'catalog', 'pages', page, 'index');
  const js = fs.readFileSync(`${base}.js`, 'utf8');
  const wxml = fs.readFileSync(`${base}.wxml`, 'utf8');
  const wxss = fs.readFileSync(`${base}.wxss`, 'utf8');

  assert(/loading:\s*true/.test(js), `${page} 必须有初始加载状态`);
  assert(/notFound:\s*''/.test(js), `${page} 必须有加载失败状态`);
  assert(/onLoad\(options = \{\}\)/.test(js), `${page} 必须兼容无路由参数打开`);
  assert(/reopen\s*\(/.test(js), `${page} 必须提供重新打开方法`);
  assert(/try\s*\{/.test(js) && /catch\s*\(/.test(js), `${page} 必须捕获本地索引加载失败`);
  assert(/wx:if="\{\{!loading && !notFound\}\}"/.test(wxml), `${page} 必须在内容就绪后渲染主体`);
  assert(/wx:elif="\{\{loading\}\}"/.test(wxml), `${page} 必须渲染加载状态`);
  assert(/wx:elif="\{\{notFound\}\}"/.test(wxml), `${page} 必须渲染加载失败状态`);
  assert(/bindtap="reopen"/.test(wxml), `${page} 必须渲染重试入口`);
  assert(/<empty-state/.test(wxml), `${page} 必须保留无结果状态`);
  assert(/\.error-state\s*\{/.test(wxss), `${page} 必须有失败态样式`);
});

console.log('OK catalog page fallback contract');
