const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const math = require('../utils/math');

const outRoot = process.argv[2] || 'dist/remote-assets';
const python = process.env.PYTHON || '/Users/hht/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';

function localPath(assetPath) {
  return String(assetPath || '')
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^cloud:\/\/[^/]+/, '')
    .replace(/^\//, '');
}

function addAsset(set, assetPath) {
  const value = localPath(assetPath);
  if (value && value.startsWith('assets/') && fs.existsSync(value)) {
    set.add(value);
  }
}

const assets = new Set();

math.getAllChapters().forEach((chapter) => {
  addAsset(assets, chapter.chapterFigure && chapter.chapterFigure.image);
  chapter.knowledgeItems.forEach((knowledge) => {
    addAsset(assets, knowledge.coverImage);
    addAsset(assets, knowledge.sourceImage);
    knowledge.problems.forEach((problem) => {
      addAsset(assets, problem.image);
      addAsset(assets, problem.sourceImage);
    });
  });
});

math.getFeaturedTemplates().forEach((template) => addAsset(assets, template.figure));

const items = [...assets].sort().map((source) => ({
  source,
  out: path.join(outRoot, source),
}));

const script = `
import json, os, sys
from PIL import Image

items = json.load(sys.stdin)
limit = 200 * 1024

def save_under_limit(src, out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    image = Image.open(src).convert('RGB')
    sizes = [(960, 675), (840, 591), (720, 506), (640, 450)]
    colors = [160, 128, 96, 64, 48, 32]

    last = None
    for size in sizes:
        candidate = image.copy()
        candidate.thumbnail(size, Image.Resampling.LANCZOS)
        for color_count in colors:
            quantized = candidate.quantize(colors=color_count, method=Image.Quantize.MEDIANCUT)
            quantized.save(out, 'PNG', optimize=True)
            if os.path.getsize(out) <= limit:
                return os.path.getsize(out)
            last = os.path.getsize(out)

    # Final fallback: JPEG-compatible RGB is not used because project paths are PNG.
    candidate = image.copy()
    candidate.thumbnail((560, 394), Image.Resampling.LANCZOS)
    quantized = candidate.quantize(colors=24, method=Image.Quantize.MEDIANCUT)
    quantized.save(out, 'PNG', optimize=True)
    return os.path.getsize(out)

oversize = []
for item in items:
    size = save_under_limit(item['source'], item['out'])
    if size > limit:
        oversize.append((item['out'], size))

print(f'prepared {len(items)} remote assets')
if oversize:
    print('oversize:')
    for out, size in oversize:
        print(size, out)
    sys.exit(2)
`;

const result = spawnSync(python, ['-c', script], {
  input: JSON.stringify(items),
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 20,
});

process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log(`output: ${outRoot}`);
