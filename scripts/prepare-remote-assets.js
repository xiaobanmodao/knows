const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { collectRemoteAssets } = require('./asset-inventory');

const outRoot = process.argv[2] || 'dist/remote-assets';
const python = process.env.PYTHON || '/Users/hht/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';

const items = collectRemoteAssets().map((source) => ({
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

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  assetCount: items.length,
  assets: items.map((item) => {
    const buffer = fs.readFileSync(item.out);
    return {
      source: item.source,
      cloudPath: `/${item.source}`,
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
      bytes: buffer.length,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    };
  }),
};
const manifestPath = path.join(outRoot, 'manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`output: ${outRoot}`);
console.log(`manifest: ${manifestPath}`);
