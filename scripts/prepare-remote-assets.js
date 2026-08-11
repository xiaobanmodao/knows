const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { collectRemoteAssets } = require('./asset-inventory');
const { createRemoteAssetManifest } = require('./remote-asset-manifest');

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
    normalized = src.replace(os.sep, '/')
    is_unit_cover = (('/chemistry/topics/' in '/' + normalized) or ('/subjects/biology/topics/' in '/' + normalized)) and normalized.endswith('/cover.png')
    if is_unit_cover:
        if image.size != (1280, 900):
            raise ValueError(f'unit cover must be 1280x900: {src} is {image.size[0]}x{image.size[1]}')
        last = None
        for color_count in [256, 192, 160, 128, 96, 64, 48, 32, 24, 16, 12, 8]:
            quantized = image.quantize(colors=color_count, method=Image.Quantize.MEDIANCUT)
            quantized.save(out, 'PNG', optimize=True)
            last = os.path.getsize(out)
            if last <= limit:
                return last
        return last

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

    # Final fallback: progressively reduce the bitmap until the hard limit is met.
    # JPEG-compatible RGB is not used because project paths are PNG.
    fallback_sizes = [(560, 394), (480, 338), (400, 281), (320, 225), (240, 169)]
    fallback_colors = [24, 16, 12, 8]
    for width, height in fallback_sizes:
        candidate = image.copy()
        candidate.thumbnail((width, height), Image.Resampling.LANCZOS)
        for color_count in fallback_colors:
            quantized = candidate.quantize(colors=color_count, method=Image.Quantize.MEDIANCUT)
            quantized.save(out, 'PNG', optimize=True)
            last = os.path.getsize(out)
            if last <= limit:
                return last
    return last

oversize = []
for item in items:
    try:
        size = save_under_limit(item['source'], item['out'])
        if size > limit:
            oversize.append((item['out'], size))
    except Exception as error:
        oversize.append((item['out'], str(error)))

print(f'prepared {len(items)} remote assets')
if oversize:
    print('oversize:')
    for out, detail in oversize:
        print(detail, out)
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

const manifest = createRemoteAssetManifest(items);
const manifestPath = path.join(outRoot, 'manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`output: ${outRoot}`);
console.log(`manifest: ${manifestPath}`);
