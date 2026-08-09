const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'assets/figures/generated/subjects/biology');
const remoteRoot = path.join(root, 'dist/remote-assets');
const promptsPath = path.join(sourceRoot, 'prompts.json');
const remoteManifestPath = path.join(remoteRoot, 'manifest.json');
const sizeLimit = 200 * 1024;

const { topics } = require('../packages/biology/data/biology-topics');
const { collectRemoteAssets, localPath } = require('./asset-inventory');

const issues = [];

function relativeSource(value) {
  return localPath(value).split('?')[0];
}

function expectedCoverPath(topicId) {
  return `assets/figures/generated/subjects/biology/topics/${topicId}/cover.png`;
}

function expectedDiagramPath(topicId) {
  return `assets/figures/generated/subjects/biology/diagrams/${topicId}.png`;
}

function readPng(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    issues.push(`${relativePath}: file does not exist`);
    return null;
  }

  const buffer = fs.readFileSync(absolutePath);
  const validHeader = buffer.length >= 24
    && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    && buffer.toString('ascii', 12, 16) === 'IHDR';
  if (!validHeader) {
    issues.push(`${relativePath}: invalid PNG header`);
    return null;
  }

  return {
    buffer,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    hash: crypto.createHash('sha256').update(buffer).digest('hex'),
  };
}

function listPngFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.png'))
    .map((entry) => path.relative(root, path.join(directory, entry.name)));
}

function promptField(entry, ...keys) {
  const key = keys.find((candidate) => entry[candidate] !== undefined);
  return key ? entry[key] : undefined;
}

function checkPromptManifest() {
  if (!fs.existsSync(promptsPath)) {
    issues.push('assets/figures/generated/subjects/biology/prompts.json: prompt/source record missing');
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
  } catch (error) {
    issues.push(`assets/figures/generated/subjects/biology/prompts.json: invalid JSON (${error.message})`);
    return;
  }

  if (manifest.version !== 1) issues.push('biology prompts: version must be 1');
  if (manifest.generator !== 'scripts/generate-biology-assets.py') {
    issues.push('biology prompts: generator record is invalid');
  }

  const entries = Array.isArray(manifest.assets) ? manifest.assets : [];
  const byTopic = new Map();
  entries.forEach((entry, index) => {
    const topicId = promptField(entry, 'topicId', 'id');
    if (!topicId) {
      issues.push(`biology prompts[${index}]: missing topicId`);
      return;
    }
    if (byTopic.has(topicId)) issues.push(`biology prompts: duplicate topicId ${topicId}`);
    byTopic.set(topicId, entry);
  });

  topics.forEach((topic) => {
    const entry = byTopic.get(topic.id);
    if (!entry) {
      issues.push(`biology prompts: missing topic record ${topic.id}`);
      return;
    }

    ['cover', 'diagram'].forEach((kind) => {
      const record = entry[kind];
      const expected = kind === 'cover' ? expectedCoverPath(topic.id) : expectedDiagramPath(topic.id);
      const sourcePath = relativeSource(record && promptField(record, 'sourcePath', 'path'));
      const prompt = promptField(record || {}, 'prompt', 'exactPrompt');
      const outputName = promptField(record || {}, 'outputName', 'modelOutputName', 'modelOutput');
      const review = promptField(record || {}, 'manualReview', 'review');
      const reviewStatus = typeof review === 'object' && review
        ? promptField(review, 'status', 'result')
        : promptField(record || {}, 'manualReviewStatus', 'reviewStatus');
      if (!record) issues.push(`biology prompts ${topic.id}: missing ${kind} record`);
      if (!String(prompt || '').trim()) issues.push(`biology prompts ${topic.id}: missing ${kind} prompt`);
      if (!String(outputName || '').trim()) issues.push(`biology prompts ${topic.id}: missing ${kind} output name`);
      if (sourcePath !== expected) issues.push(`biology prompts ${topic.id}: ${kind} sourcePath does not match`);
      if (!['approved', 'passed', 'reviewed'].includes(String(reviewStatus || '').toLowerCase())) {
        issues.push(`biology prompts ${topic.id}: ${kind} manual review is not approved`);
      }
    });

    const source = entry.source;
    if (!source || source.type !== 'original-vector' || source.license !== 'Original work') {
      issues.push(`biology prompts ${topic.id}: original source record is incomplete`);
    }
  });

  entries.forEach((entry) => {
    if (!topics.some((topic) => topic.id === entry.topicId)) {
      issues.push(`biology prompts: unknown topic ${entry.topicId}`);
    }
  });
  if (entries.length !== topics.length) {
    issues.push(`biology prompts: expected ${topics.length} records, found ${entries.length}`);
  }
}

function checkDataReferences(expectedAssets) {
  topics.forEach((topic) => {
    const cover = relativeSource(topic.coverImage);
    const diagram = relativeSource(topic.diagramImage);
    const expectedCover = expectedCoverPath(topic.id);
    const expectedDiagram = expectedDiagramPath(topic.id);
    if (cover !== expectedCover) issues.push(`${topic.id}: coverImage must be /${expectedCover}`);
    if (diagram !== expectedDiagram) issues.push(`${topic.id}: diagramImage must be /${expectedDiagram}`);
    expectedAssets.add(expectedCover);
    expectedAssets.add(expectedDiagram);
  });
}

function checkSourceImages(expectedAssets) {
  const hashes = new Map();
  const coverPaths = topics.map((topic) => expectedCoverPath(topic.id));
  const diagramPaths = topics.map((topic) => expectedDiagramPath(topic.id));
  [...coverPaths, ...diagramPaths].forEach((source) => {
    const png = readPng(source);
    if (!png) return;
    const expectedWidth = coverPaths.includes(source) ? 1280 : 1200;
    const expectedHeight = coverPaths.includes(source) ? 900 : 760;
    if (png.width !== expectedWidth || png.height !== expectedHeight) {
      issues.push(`${source}: expected ${expectedWidth}x${expectedHeight}, found ${png.width}x${png.height}`);
    }
    if (hashes.has(png.hash)) issues.push(`${source}: duplicate content with ${hashes.get(png.hash)}`);
    else hashes.set(png.hash, source);
  });

  const topicDirectory = path.join(sourceRoot, 'topics');
  const diagramDirectory = path.join(sourceRoot, 'diagrams');
  listPngFiles(topicDirectory).forEach((source) => {
    if (!coverPaths.includes(source)) issues.push(`${source}: unregistered biology cover`);
  });
  listPngFiles(diagramDirectory).forEach((source) => {
    if (!diagramPaths.includes(source)) issues.push(`${source}: unregistered biology diagram`);
  });
  expectedAssets.forEach((source) => {
    if (!fs.existsSync(path.join(root, source))) issues.push(`${source}: referenced asset is missing`);
  });
}

function checkInventory(expectedAssets) {
  const inventory = new Set(collectRemoteAssets());
  expectedAssets.forEach((source) => {
    if (!inventory.has(source)) issues.push(`${source}: missing from asset inventory`);
  });
}

function checkRemoteOutputs(expectedAssets) {
  if (!fs.existsSync(remoteManifestPath)) {
    issues.push('dist/remote-assets/manifest.json: remote manifest missing');
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(remoteManifestPath, 'utf8'));
  } catch (error) {
    issues.push(`dist/remote-assets/manifest.json: invalid JSON (${error.message})`);
    return;
  }
  const records = new Map((manifest.assets || []).map((record) => [record.source, record]));
  expectedAssets.forEach((source) => {
    const record = records.get(source);
    const output = path.join(remoteRoot, source);
    if (!record) {
      issues.push(`${source}: missing remote manifest record`);
      return;
    }
    if (!fs.existsSync(output)) {
      issues.push(`${source}: missing compressed remote output`);
      return;
    }
    const png = readPng(path.relative(root, output));
    if (!png) return;
    if (png.buffer.length > sizeLimit) issues.push(`${source}: remote output exceeds 200 KiB`);
    if (source.includes('/topics/') && (png.width !== 1280 || png.height !== 900)) {
      issues.push(`${source}: remote cover must remain 1280x900, found ${png.width}x${png.height}`);
    }
    if (source.includes('/diagrams/') && (png.width > 960 || png.height > 675)) {
      issues.push(`${source}: remote diagram exceeds the remote dimension budget`);
    }
    if (record.width !== png.width || record.height !== png.height
      || record.bytes !== png.buffer.length || record.sha256 !== png.hash) {
      issues.push(`${source}: remote manifest record does not match output`);
    }
  });
}

const expectedAssets = new Set();
checkPromptManifest();
checkDataReferences(expectedAssets);
checkSourceImages(expectedAssets);
checkInventory(expectedAssets);
checkRemoteOutputs(expectedAssets);

if (issues.length) {
  console.log('FOUND_BIOLOGY_ASSET_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK biology assets: ${topics.length} covers, ${topics.length} diagrams, prompt/source records, inventory and remote outputs checked`);
