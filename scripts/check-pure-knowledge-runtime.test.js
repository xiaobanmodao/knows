const assert = require('assert');
const path = require('path');

const {
  FORBIDDEN_RUNTIME_COPY,
  collectRuntimeFiles,
  findForbiddenRuntimeCopy,
} = require('./check-pure-knowledge-runtime');

assert.ok(FORBIDDEN_RUNTIME_COPY.length >= 8);
assert.ok(findForbiddenRuntimeCopy('<button>学完自测</button>', 'fixture.wxml').some((item) => item.pattern === '学完自测'));
assert.ok(findForbiddenRuntimeCopy('页面只用于查阅知识点和方法模板。', 'fixture.wxml').length === 0);
assert.ok(findForbiddenRuntimeCopy('完成任务后观察光的反射现象。', 'fixture.wxml').length === 0);

const runtimeFiles = collectRuntimeFiles();
assert.ok(runtimeFiles.some((file) => file.endsWith(path.join('packages', 'english', 'pages', 'index', 'index.wxml'))));
assert.ok(runtimeFiles.every((file) => !file.includes(`${path.sep}data${path.sep}`)));
assert.ok(runtimeFiles.every((file) => !file.endsWith(path.join('scripts', 'check-pure-knowledge-runtime.js'))));

console.log('OK pure knowledge runtime copy contract');
