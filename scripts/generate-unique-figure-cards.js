const { spawnSync } = require('child_process');
const math = require('../utils/math');

const chapters = math.getAllChapters();
const items = [];

function localPath(path) {
  return path.replace(/^\//, '').split('?')[0];
}

chapters.forEach((chapter) => {
  chapter.knowledgeItems.forEach((knowledge) => {
    items.push({
      kind: 'knowledge',
      chapter: chapter.title,
      title: knowledge.title,
      subtitle: knowledge.summary,
      source: localPath(knowledge.sourceImage || knowledge.coverImage),
      out: localPath(knowledge.coverImage),
    });

    knowledge.problems.forEach((problem) => {
      items.push({
        kind: 'problem',
        chapter: chapter.title,
        title: `${knowledge.title} · ${problem.title}`,
        subtitle: problem.stem,
        source: localPath(problem.sourceImage || knowledge.sourceImage || knowledge.coverImage),
        out: localPath(problem.image),
      });
    });
  });
});

const python = process.env.PYTHON || '/Users/hht/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const script = `
import json, os, sys, textwrap
from PIL import Image, ImageDraw, ImageFont, ImageFilter

items = json.load(sys.stdin)
font_candidates = [
    '/System/Library/Fonts/Hiragino Sans GB.ttc',
    '/System/Library/Fonts/STHeiti Medium.ttc',
    '/System/Library/Fonts/HelveticaNeue.ttc',
]
font_path = next((p for p in font_candidates if os.path.exists(p)), None)

def font(size):
    return ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default()

title_font = font(38)
sub_font = font(24)
meta_font = font(20)

def wrap_text(text, width):
    text = str(text or '').replace('\\n', ' ')
    lines = []
    current = ''
    for ch in text:
        candidate = current + ch
        if len(candidate.encode('utf-8')) > width:
            if current:
                lines.append(current)
            current = ch
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines[:3]

for item in items:
    source_path = item['source']
    out_path = item['out']
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    if os.path.exists(source_path):
        src = Image.open(source_path).convert('RGB')
    else:
        src = Image.new('RGB', (1600, 900), '#f8fafc')

    src.thumbnail((980, 560), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (1280, 900), '#f8fafc')
    draw = ImageDraw.Draw(canvas)

    draw.rounded_rectangle((34, 34, 1246, 866), radius=34, fill='white', outline='#dbe5f3', width=3)
    image_x = (1280 - src.width) // 2
    canvas.paste(src, (image_x, 78))

    overlay_top = 650
    draw.rounded_rectangle((70, overlay_top, 1210, 838), radius=22, fill='#ffffff', outline='#e2e8f0', width=2)
    badge = '知识点' if item['kind'] == 'knowledge' else '题目配图'
    badge_fill = '#1d4ed8' if item['kind'] == 'knowledge' else '#b45309'
    draw.rounded_rectangle((92, overlay_top + 18, 190, overlay_top + 52), radius=17, fill=badge_fill)
    draw.text((112, overlay_top + 23), badge, font=meta_font, fill='white')
    draw.text((212, overlay_top + 17), item['chapter'], font=meta_font, fill='#64748b')
    draw.text((92, overlay_top + 58), item['title'][:42], font=title_font, fill='#17233f')

    y = overlay_top + 102
    for line in wrap_text(item.get('subtitle', ''), 92):
        draw.text((92, y), line, font=sub_font, fill='#475569')
        y += 32

    canvas.save(out_path, 'PNG', optimize=True)
`;

const result = spawnSync(python, ['-c', script], {
  input: JSON.stringify(items),
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 10,
});

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status || 1);
}

console.log(`generated ${items.length} unique figure cards`);
