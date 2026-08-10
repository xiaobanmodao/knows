const fs = require('fs');
const path = require('path');

const TRACE_USER_TRUE_PATTERN = /\btraceUser\s*:\s*true\b/g;

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function scanCloudUserTrace(rootDir) {
  const appPath = path.join(rootDir, 'app.js');
  const errors = new Set();
  const traceUserFiles = {};

  if (!fs.existsSync(appPath)) {
    errors.add('app-js-missing');
    return {
      status: 'failed',
      traceUserCalls: 0,
      traceUserFiles,
      errors: [...errors],
    };
  }

  const source = fs.readFileSync(appPath, 'utf8');
  const traceUserCalls = countMatches(source, TRACE_USER_TRUE_PATTERN);
  if (traceUserCalls) {
    traceUserFiles['app.js'] = traceUserCalls;
    errors.add('cloud-user-trace-forbidden');
  }

  return {
    status: errors.size ? 'failed' : 'passed',
    traceUserCalls,
    traceUserFiles,
    errors: [...errors],
  };
}

function main() {
  const report = scanCloudUserTrace(path.resolve(__dirname, '..'));
  if (report.status === 'passed') {
    console.log(`OK cloud user trace: ${report.traceUserCalls} traceUser:true calls`);
    return;
  }
  console.error(`BLOCKED cloud user trace: ${report.errors.join(', ')}`);
  process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  scanCloudUserTrace,
};
