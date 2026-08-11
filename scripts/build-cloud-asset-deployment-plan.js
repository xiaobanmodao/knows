const fs = require('fs');
const path = require('path');

const {
  buildCloudAssetPlan,
  buildConsoleVerificationScript,
} = require('./cloud-asset-deployment');

function readOption(args, name, defaultValue = undefined) {
  const index = args.indexOf(name);
  if (index < 0) return defaultValue;
  if (!args[index + 1] || args[index + 1].startsWith('--')) {
    throw new Error(`${name} 必须提供值`);
  }
  return args[index + 1];
}

function assertKnownArguments(args) {
  const known = new Set(['--manifest', '--output', '--subject', '--commit']);
  args.forEach((argument) => {
    if (argument.startsWith('--') && !known.has(argument)) throw new Error(`未知参数：${argument}`);
  });
}

function readManifest(manifestPath) {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error('manifest 必须为可读取的 JSON 文件');
  }
}

function main(args = process.argv.slice(2)) {
  assertKnownArguments(args);
  const manifestPath = path.resolve(readOption(args, '--manifest', 'dist/remote-assets/manifest.json'));
  const outputPath = path.resolve(readOption(args, '--output', 'dist/cloud-asset-deployment/plan.json'));
  const sourceCommit = readOption(args, '--commit');
  if (!sourceCommit) throw new Error('--commit 必须提供值');

  const plan = buildCloudAssetPlan({
    manifest: readManifest(manifestPath),
    sourceCommit,
    subject: readOption(args, '--subject', null),
  });
  const verifyScriptPath = path.join(path.dirname(outputPath), 'verify-in-devtools.js');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  fs.writeFileSync(verifyScriptPath, buildConsoleVerificationScript(plan), 'utf8');
  console.log(`OK cloud asset deployment plan: ${plan.assetCount} assets written to ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(`FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES: ${error.message}`);
  process.exitCode = 1;
}

module.exports = { main };
