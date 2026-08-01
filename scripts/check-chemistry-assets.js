const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'assets/figures/generated/chemistry');
const remoteRoot = path.join(root, 'dist/remote-assets');
const promptsPath = path.join(sourceRoot, 'prompts.json');
const remoteManifestPath = path.join(remoteRoot, 'manifest.json');
const sizeLimit = 200 * 1024;

const { topics } = require('../packages/chemistry/data/chemistry-topics');
const { templates } = require('../packages/chemistry/data/chemistry-templates');
const { collectRemoteAssets, localPath } = require('./asset-inventory');

const requiredDiagramNames = [
  'laboratory-observation-cycle',
  'oxygen-preparation',
  'carbon-dioxide-preparation',
  'water-electrolysis',
  'particle-model',
  'particle-conservation',
  'solubility-curve',
  'metal-activity',
  'corrosion-conditions',
  'ph-scale',
  'acid-base-neutralization',
  'ion-test-evidence',
  'material-lifecycle',
];

const issues = [];

function relativeSource(value) {
  return localPath(value).split('?')[0];
}

function expectedCoverPath(topicId) {
  return `assets/figures/generated/chemistry/topics/${topicId}/cover.png`;
}

function expectedDiagramPath(name) {
  return `assets/figures/generated/chemistry/diagrams/${name}.png`;
}

function expectedTemplatePath(templateId) {
  return `assets/figures/generated/chemistry/templates/${templateId}.png`;
}

function readPng(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    issues.push(`${relativePath}: 文件不存在`);
    return null;
  }

  const buffer = fs.readFileSync(absolutePath);
  const validHeader = buffer.length >= 24
    && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    && buffer.toString('ascii', 12, 16) === 'IHDR';
  if (!validHeader) {
    issues.push(`${relativePath}: PNG 文件头无效`);
    return null;
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (!width || !height) {
    issues.push(`${relativePath}: PNG 尺寸无效 ${width}x${height}`);
  }

  return {
    buffer,
    width,
    height,
    hash: crypto.createHash('sha256').update(buffer).digest('hex'),
  };
}

function listPngFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.png'))
    .map((entry) => path.join(directory, entry.name));
}

function readPromptEntries() {
  if (!fs.existsSync(promptsPath)) {
    issues.push('assets/figures/generated/chemistry/prompts.json: 提示词清单不存在');
    return [];
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
  } catch (error) {
    issues.push(`assets/figures/generated/chemistry/prompts.json: JSON 无效 (${error.message})`);
    return [];
  }

  const entries = Array.isArray(manifest)
    ? manifest
    : (manifest.covers || manifest.topics || manifest.prompts || []);
  if (!Array.isArray(entries)) {
    issues.push('assets/figures/generated/chemistry/prompts.json: 缺少 covers 数组');
    return [];
  }
  return entries;
}

function promptField(entry, ...keys) {
  const key = keys.find((candidate) => entry[candidate] !== undefined);
  return key ? entry[key] : undefined;
}

function checkPromptManifest() {
  const entries = readPromptEntries();
  const byTopic = new Map();

  entries.forEach((entry, index) => {
    const topicId = promptField(entry, 'topicId', 'id');
    if (!topicId) {
      issues.push(`prompts[${index}]: 缺少 topicId`);
      return;
    }
    if (byTopic.has(topicId)) issues.push(`prompts: topicId 重复 ${topicId}`);
    byTopic.set(topicId, entry);
  });

  topics.forEach((topic) => {
    const entry = byTopic.get(topic.id);
    if (!entry) {
      issues.push(`prompts: 缺少专题记录 ${topic.id}`);
      return;
    }

    const prompt = promptField(entry, 'prompt', 'exactPrompt');
    const outputName = promptField(entry, 'outputName', 'modelOutputName', 'modelOutput');
    const sourcePath = relativeSource(promptField(entry, 'sourcePath', 'finalSourcePath', 'path'));
    const generatedAt = promptField(entry, 'generatedAt', 'generationDate');
    const review = promptField(entry, 'manualReview', 'review');
    const reviewStatus = typeof review === 'object' && review
      ? promptField(review, 'status', 'result')
      : promptField(entry, 'manualReviewStatus', 'reviewStatus');

    if (!String(prompt || '').trim()) issues.push(`prompts ${topic.id}: 缺少完整 prompt`);
    if (!String(outputName || '').trim()) issues.push(`prompts ${topic.id}: 缺少模型输出名`);
    if (sourcePath !== expectedCoverPath(topic.id)) issues.push(`prompts ${topic.id}: sourcePath 不匹配`);
    if (!/^\d{4}-\d{2}-\d{2}/.test(String(generatedAt || ''))) issues.push(`prompts ${topic.id}: 生成日期无效`);
    if (!['approved', 'passed', 'reviewed'].includes(String(reviewStatus || '').toLowerCase())) {
      issues.push(`prompts ${topic.id}: manual review 未通过`);
    }
  });

  entries.forEach((entry) => {
    const topicId = promptField(entry, 'topicId', 'id');
    if (!topics.some((topic) => topic.id === topicId)) issues.push(`prompts: 含未知专题 ${topicId}`);
  });
  if (entries.length !== topics.length) issues.push(`prompts: 应有 ${topics.length} 条，实际 ${entries.length} 条`);
}

function checkDataReferences(expectedAssets) {
  topics.forEach((topic) => {
    const coverPath = relativeSource(topic.coverImage);
    const expectedCover = expectedCoverPath(topic.id);
    if (coverPath !== expectedCover) issues.push(`${topic.id}: coverImage 应为 /${expectedCover}`);
    expectedAssets.add(expectedCover);

    if (!Array.isArray(topic.diagramImages) || !topic.diagramImages.length) {
      issues.push(`${topic.id}: 缺少 diagramImages`);
      return;
    }
    topic.diagramImages.forEach((diagram, index) => {
      const source = relativeSource(diagram && diagram.image);
      if (!source.startsWith('assets/figures/generated/chemistry/diagrams/')) {
        issues.push(`${topic.id}.diagramImages[${index}]: 图片路径无效`);
      }
      if (!String(diagram && diagram.title || '').trim()) issues.push(`${topic.id}.diagramImages[${index}]: 缺少标题`);
      if (!String(diagram && diagram.caption || '').trim()) issues.push(`${topic.id}.diagramImages[${index}]: 缺少文字降级说明`);
      if (source) expectedAssets.add(source);
    });
  });

  templates.forEach((template) => {
    const source = relativeSource(template.figure);
    const expected = expectedTemplatePath(template.id);
    if (source !== expected) issues.push(`${template.id}: figure 应为 /${expected}`);
    expectedAssets.add(expected);
  });
}

function checkSourceImages(expectedAssets) {
  const hashes = new Map();
  const coverPaths = topics.map((topic) => expectedCoverPath(topic.id));
  const diagramPaths = requiredDiagramNames.map(expectedDiagramPath);
  const templatePaths = templates.map((template) => expectedTemplatePath(template.id));
  const declaredChemistryPngs = [...expectedAssets];

  if (topics.length !== 10) issues.push(`化学专题应为 10 个，实际 ${topics.length} 个`);
  if (templates.length !== 12) issues.push(`化学方法应为 12 个，实际 ${templates.length} 个`);

  const diagramDirectory = path.join(sourceRoot, 'diagrams');
  const templateDirectory = path.join(sourceRoot, 'templates');
  const diskDiagrams = listPngFiles(diagramDirectory);
  const diskTemplates = listPngFiles(templateDirectory);
  if (diskDiagrams.length < 10) issues.push(`化学图示至少 10 张，实际 ${diskDiagrams.length} 张`);
  if (diskTemplates.length !== 12) issues.push(`化学方法图必须正好 12 张，实际 ${diskTemplates.length} 张`);

  requiredDiagramNames.forEach((name) => {
    const source = expectedDiagramPath(name);
    if (!expectedAssets.has(source)) issues.push(`${source}: 未被专题数据引用`);
  });

  [...new Set([...coverPaths, ...diagramPaths, ...templatePaths, ...declaredChemistryPngs])].forEach((source) => {
    const png = readPng(source);
    if (!png) return;
    if (coverPaths.includes(source) && (png.width !== 1280 || png.height !== 900)) {
      issues.push(`${source}: 封面必须为 1280x900，实际 ${png.width}x${png.height}`);
    }
    if (hashes.has(png.hash)) {
      issues.push(`${source}: 内容与 ${hashes.get(png.hash)} 重复`);
    } else {
      hashes.set(png.hash, source);
    }
  });

  const referencedDiagrams = new Set(declaredChemistryPngs.filter((source) => source.includes('/diagrams/')));
  diskDiagrams.forEach((absolutePath) => {
    const source = path.relative(root, absolutePath);
    if (!referencedDiagrams.has(source)) issues.push(`${source}: 图示存在但未被专题数据引用`);
  });
  diskTemplates.forEach((absolutePath) => {
    const source = path.relative(root, absolutePath);
    if (!templatePaths.includes(source)) issues.push(`${source}: 方法图没有对应模板`);
  });
}

function checkInventory(expectedAssets) {
  const inventory = new Set(collectRemoteAssets());
  expectedAssets.forEach((source) => {
    if (!inventory.has(source)) issues.push(`${source}: 未进入资源 inventory`);
  });
}

function checkRemoteOutputs(expectedAssets, sourceComplete) {
  if (!sourceComplete) return;
  if (!fs.existsSync(remoteManifestPath)) {
    issues.push('dist/remote-assets/manifest.json: 云资源清单不存在');
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(remoteManifestPath, 'utf8'));
  } catch (error) {
    issues.push(`dist/remote-assets/manifest.json: JSON 无效 (${error.message})`);
    return;
  }
  const records = new Map((manifest.assets || []).map((record) => [record.source, record]));

  expectedAssets.forEach((source) => {
    const record = records.get(source);
    const output = path.join(remoteRoot, source);
    if (!record) {
      issues.push(`${source}: 缺少云资源清单记录`);
      return;
    }
    if (!fs.existsSync(output)) {
      issues.push(`${source}: 缺少云端压缩输出`);
      return;
    }

    const png = readPng(path.relative(root, output));
    if (!png) return;
    if (png.buffer.length > sizeLimit) issues.push(`${source}: 云端输出超过 200KB`);
    if (source.includes('/chemistry/topics/') && (png.width !== 1280 || png.height !== 900)) {
      issues.push(`${source}: 云端封面必须保持 1280x900，实际 ${png.width}x${png.height}`);
    }
    if (record.width !== png.width || record.height !== png.height || record.bytes !== png.buffer.length || record.sha256 !== png.hash) {
      issues.push(`${source}: 云资源清单与输出不一致`);
    }
  });
}

checkPromptManifest();
const expectedAssets = new Set();
checkDataReferences(expectedAssets);
checkSourceImages(expectedAssets);
checkInventory(expectedAssets);

const sourceComplete = [...expectedAssets].every((source) => fs.existsSync(path.join(root, source)))
  && fs.existsSync(promptsPath);
checkRemoteOutputs(expectedAssets, sourceComplete);

if (issues.length) {
  console.log('FOUND_CHEMISTRY_ASSET_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK chemistry assets: ${topics.length} covers, ${requiredDiagramNames.length} diagrams, ${templates.length} template figures, inventory and cloud outputs checked`);
