const path = require('path');
const { spawnSync } = require('child_process');

const python = process.env.PYTHON
  || '/Users/hht/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const script = path.join(__dirname, 'generate-chemistry-assets.py');
const result = spawnSync(python, [script, ...process.argv.slice(2)], {
  cwd: path.resolve(__dirname, '..'),
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 10,
});

process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
if (result.status !== 0) process.exit(result.status || 1);
