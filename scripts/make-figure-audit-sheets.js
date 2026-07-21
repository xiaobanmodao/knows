const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const math = require('../packages/math/repository');

const outDir = process.argv[2] || '.tmp-quicklook/all-figure-sheets';
const python = process.env.PYTHON || '/Users/hht/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';

function localPath(assetPath) {
  return String(assetPath || '')
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^cloud:\/\/[^/]+/, '')
    .replace(/^\//, '');
}

function add(items, type, chapter, knowledge, problem, image) {
  const local = localPath(image);
  if (!local || !local.startsWith('assets/') || !fs.existsSync(local)) {
    return;
  }
  items.push({
    type,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    knowledgeTitle: knowledge ? knowledge.title : '',
    problemTitle: problem ? problem.title : '',
    stem: problem ? problem.stem : '',
    answer: problem ? problem.answer : '',
    image: local,
  });
}

const items = [];

math.getAllChapters().forEach((chapter) => {
  add(items, 'chapter', chapter, null, null, chapter.chapterFigure && chapter.chapterFigure.image);
  chapter.knowledgeItems.forEach((knowledge) => {
    add(items, 'knowledge', chapter, knowledge, null, knowledge.coverImage);
    knowledge.problems.forEach((problem) => {
      add(items, 'problem', chapter, knowledge, problem, problem.image);
    });
  });
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'figure-audit.json'), JSON.stringify(items, null, 2));
fs.writeFileSync(
  path.join(outDir, 'figure-audit.tsv'),
  items.map((item, index) => [
    index + 1,
    item.type,
    item.chapterId,
    item.chapterTitle,
    item.knowledgeTitle,
    item.problemTitle,
    item.stem,
    item.answer,
    item.image,
  ].map((value) => String(value || '').replace(/\t|\n/g, ' ')).join('\t')).join('\n'),
);

const script = String.raw`
import json, math, os, sys, textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(sys.argv[1])
out_dir = Path(sys.argv[2])
items = json.load(sys.stdin)
out_dir.mkdir(parents=True, exist_ok=True)

try:
    font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 16)
    small = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 13)
except Exception:
    font = ImageFont.load_default()
    small = ImageFont.load_default()

cols = 2
thumb_w, thumb_h = 420, 295
label_h = 112
per_sheet = 12

def wrap_text(text, width=32, lines=4):
    text = (text or '').replace('\n', ' ')
    chunks = textwrap.wrap(text, width=width)
    return chunks[:lines]

for sheet_index in range(math.ceil(len(items) / per_sheet)):
    chunk = items[sheet_index * per_sheet:(sheet_index + 1) * per_sheet]
    rows = math.ceil(len(chunk) / cols)
    sheet = Image.new('RGB', (cols * thumb_w, rows * (thumb_h + label_h)), 'white')
    draw = ImageDraw.Draw(sheet)
    for i, item in enumerate(chunk):
        col = i % cols
        row = i // cols
        x0 = col * thumb_w
        y0 = row * (thumb_h + label_h)
        image_path = root / item['image']
        im = Image.open(image_path).convert('RGB')
        im.thumbnail((thumb_w - 20, thumb_h - 16), Image.Resampling.LANCZOS)
        sheet.paste(im, (x0 + (thumb_w - im.width) // 2, y0 + 8))
        draw.rectangle([x0, y0, x0 + thumb_w - 1, y0 + thumb_h + label_h - 1], outline=(220, 225, 232))
        label_y = y0 + thumb_h + 6
        title = f"{sheet_index * per_sheet + i + 1}. {item['type']} | {item['chapterTitle']} | {item['knowledgeTitle']}"
        draw.text((x0 + 8, label_y), title[:46], fill=(20, 28, 38), font=font)
        label_y += 23
        if item.get('problemTitle'):
            draw.text((x0 + 8, label_y), item['problemTitle'][:44], fill=(41, 82, 148), font=small)
            label_y += 20
        for line in wrap_text(item.get('stem') or item.get('image') or '', 38, 3):
            draw.text((x0 + 8, label_y), line, fill=(45, 48, 54), font=small)
            label_y += 18
    sheet.save(out_dir / f'figure-audit-sheet-{sheet_index + 1:02d}.jpg', quality=92)

print(f'wrote {len(items)} items into {math.ceil(len(items) / per_sheet)} sheets')
`;

const result = spawnSync(python, ['-c', script, process.cwd(), outDir], {
  input: JSON.stringify(items),
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 20,
});

process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');

if (result.status !== 0) {
  process.exit(result.status || 1);
}
