const fs = require('fs');
const path = require('path');

const { validateCloudAssetEvidence } = require('./cloud-asset-deployment');

function usage() {
  return '用法：node scripts/check-cloud-asset-deployment-evidence.js <plan.json> <evidence.json> --commit <sha>';
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
  } catch (error) {
    throw new Error(`${label} 必须为可读取的 JSON 文件`);
  }
}

function main(args = process.argv.slice(2)) {
  const [planPath, evidencePath, ...options] = args;
  if (!planPath || !evidencePath || planPath.startsWith('--') || evidencePath.startsWith('--')) {
    throw new Error(usage());
  }
  if (options.length !== 2 || options[0] !== '--commit' || !options[1] || options[1].startsWith('--')) {
    throw new Error(usage());
  }

  const plan = readJson(planPath, '计划');
  const evidence = readJson(evidencePath, '证据');
  validateCloudAssetEvidence({ plan, evidence, expectedCommit: options[1] });
  console.log(`OK cloud asset deployment evidence: ${plan.assetCount} assets verified`);
}

try {
  main();
} catch (error) {
  console.error(`FOUND_CLOUD_ASSET_DEPLOYMENT_ISSUES: ${error.message}`);
  process.exitCode = 1;
}

module.exports = { main };
