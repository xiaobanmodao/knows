const path = require('path');

const {
  DEFAULT_SOURCE_VERSION,
  buildCurrentSourceInputManifest,
} = require('./content-source-input-manifest');

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const outputDirectory = getOption('--output-dir') || 'dist/content-audit/content-source-input-batches';
  const manifestPath = getOption('--manifest') || path.join(outputDirectory, 'manifest.json');
  const result = buildCurrentSourceInputManifest({
    outputDirectory,
    manifestPath,
    sourceVersion: getOption('--source-version') || DEFAULT_SOURCE_VERSION,
  });
  console.log(`OK wrote ${result.files.length} current source inputs`);
  console.log(`Manifest: ${result.manifestPath}`);
  console.log(`Output: ${result.outputDirectory}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
