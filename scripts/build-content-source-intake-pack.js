const fs = require('fs');
const path = require('path');

const { buildContentSourceIntakePack } = require('./content-source-intake-pack');

const DEFAULT_INPUT_PATH = 'dist/content-audit/content-source-follow-up.json';
const DEFAULT_OUTPUT_PATH = 'dist/content-audit/content-source-intake-pack.json';

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`内容源跟进报告读取失败：${filePath}：${error.message}`);
  }
}

function main() {
  const inputPath = process.argv[2] && !process.argv[2].startsWith('--')
    ? process.argv[2]
    : DEFAULT_INPUT_PATH;
  const outputPath = getOption('--report') || DEFAULT_OUTPUT_PATH;
  const pack = buildContentSourceIntakePack({
    followUpReport: readJson(inputPath),
  });
  const absoluteOutputPath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  fs.writeFileSync(absoluteOutputPath, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
  console.log(`OK content source intake pack: ${absoluteOutputPath}; ${pack.entries.length} batches`);
}

try {
  main();
} catch (error) {
  console.error(`FOUND_CONTENT_SOURCE_INTAKE_PACK_ISSUE\n${error.message}`);
  process.exitCode = 1;
}
