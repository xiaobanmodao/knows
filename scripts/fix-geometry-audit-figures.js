const { spawnSync } = require('child_process');

const python = process.env.PYTHON || '/Users/hht/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';

const script = String.raw`
from PIL import Image, ImageDraw, ImageFont
import math, os

W, H = 1280, 900
BG = '#f8fafc'
INK = '#1f2937'
MUTED = '#64748b'
BLUE = '#2563eb'
RED = '#ef4444'
GREEN = '#059669'
ORANGE = '#f97316'
PURPLE = '#7c3aed'
PANEL = '#ffffff'
PANEL_BORDER = '#d8e2f1'

FONT_PATHS = [
    '/System/Library/Fonts/PingFang.ttc',
    '/System/Library/Fonts/STHeiti Light.ttc',
    '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
]

def font(size):
    for path in FONT_PATHS:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()

F_TITLE = font(48)
F_SUB = font(26)
F_BODY = font(25)
F_SMALL = font(21)
F_LABEL = font(30)
F_MATH = font(34)

def ensure(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def card(title, subtitle):
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 104], fill='#eaf3ff')
    d.text((58, 28), title, fill=INK, font=F_TITLE)
    d.text((58, 74), subtitle, fill=MUTED, font=F_SUB)
    return im, d

def save(im, path):
    ensure(path)
    im.save(path, 'PNG', optimize=True)

def line(d, a, b, fill=BLUE, width=5):
    d.line([a, b], fill=fill, width=width)

def point(d, p, label=None, fill=INK, dx=10, dy=-28):
    x, y = p
    d.ellipse([x-7, y-7, x+7, y+7], fill=fill)
    if label:
        d.text((x+dx, y+dy), label, fill=INK, font=F_LABEL)

def arrow_line(d, a, b, fill=BLUE, width=4):
    line(d, a, b, fill, width)
    ax, ay = a
    bx, by = b
    ang = math.atan2(by-ay, bx-ax)
    for theta in (ang + math.pi - 0.42, ang + math.pi + 0.42):
        d.line([b, (bx + 18*math.cos(theta), by + 18*math.sin(theta))], fill=fill, width=width)
    for theta in (ang - 0.42, ang + 0.42):
        d.line([a, (ax + 18*math.cos(theta), ay + 18*math.sin(theta))], fill=fill, width=width)

def note(d, xy, title, lines, color=GREEN, w=360, h=170):
    x, y = xy
    d.rounded_rectangle([x, y, x+w, y+h], radius=16, fill=PANEL, outline=PANEL_BORDER, width=3)
    d.rectangle([x, y, x+12, y+h], fill=color)
    d.text((x+30, y+24), title, fill=color, font=F_MATH)
    yy = y + 75
    for s in lines:
        d.text((x+30, yy), s, fill=INK, font=F_BODY)
        yy += 36

def angle_arc(d, center, radius, start_deg, end_deg, fill=RED, width=4):
    x, y = center
    d.arc([x-radius, y-radius, x+radius, y+radius], start=start_deg, end=end_deg, fill=fill, width=width)

def tick(d, p, q, color=RED, n=1):
    mx, my = (p[0]+q[0])/2, (p[1]+q[1])/2
    dx, dy = q[0]-p[0], q[1]-p[1]
    length = math.hypot(dx, dy)
    if not length:
        return
    nx, ny = -dy/length, dx/length
    for i in range(n):
        off = (i - (n-1)/2) * 12
        cx, cy = mx + off*dx/length, my + off*dy/length
        d.line([(cx-13*nx, cy-13*ny), (cx+13*nx, cy+13*ny)], fill=color, width=4)

def right_mark(d, p, size=28, orient='ul', color=RED):
    x, y = p
    if orient == 'ul':
        pts = [(x, y-size), (x+size, y-size), (x+size, y)]
    elif orient == 'ur':
        pts = [(x, y-size), (x-size, y-size), (x-size, y)]
    else:
        pts = [(x, y), (x+size, y), (x+size, y-size)]
    d.line(pts, fill=color, width=3)

def parallel_diagram(path, title, subtitle, headline, bottom, mode):
    im, d = card(title, subtitle)
    A, B = (280, 325), (940, 325)
    C, Dp = (280, 570), (940, 570)
    E, F = (575, 640), (705, 250)
    arrow_line(d, A, B, BLUE, 5)
    arrow_line(d, C, Dp, BLUE, 5)
    arrow_line(d, E, F, RED, 5)
    d.text((240, 295), 'AB', fill=INK, font=F_SMALL)
    d.text((950, 545), 'CD', fill=INK, font=F_SMALL)
    d.text((715, 232), 'EF', fill=INK, font=F_SMALL)
    d.text((595, 345), '∠1', fill=RED, font=F_BODY)
    d.text((520, 520), '∠2', fill=BLUE, font=F_BODY)
    angle_arc(d, (640, 325), 52, 178, 244, RED, 4)
    angle_arc(d, (600, 570), 52, 300, 358, BLUE, 4)
    if mode == 'same':
        d.text((710, 402), '∠1 = ∠2 = 58°', fill=INK, font=F_MATH)
    elif mode == 'supplement':
        d.text((700, 402), '125° + 55° = 180°', fill=INK, font=F_MATH)
        d.text((590, 345), '125°', fill=RED, font=F_BODY)
        d.text((500, 520), '55°', fill=BLUE, font=F_BODY)
    elif mode == 'property':
        d.text((710, 402), 'AB∥CD  ⇒  ∠1=∠2', fill=INK, font=F_MATH)
    else:
        d.text((710, 402), '先找角位关系', fill=INK, font=F_MATH)
    note(d, (760, 612), '结论', [headline, bottom], GREEN, 390, 150)
    save(im, path)

def triangle_bisector(path):
    im, d = card('题 3：角平分线', 'AD 平分 ∠A，图中必须画出射线 AD')
    A, B, C, Dp = (260, 690), (650, 190), (1020, 690), (640, 690)
    line(d, A, B, BLUE, 5); line(d, B, C, BLUE, 5); line(d, C, A, BLUE, 5)
    line(d, A, Dp, PURPLE, 5)
    point(d, A, 'A', dx=-10, dy=-35); point(d, B, 'B'); point(d, C, 'C'); point(d, Dp, 'D', dx=-5, dy=12)
    angle_arc(d, A, 72, 305, 333, RED, 4)
    angle_arc(d, A, 105, 333, 360, PURPLE, 4)
    d.text((346, 620), '25°', fill=RED, font=F_BODY)
    d.text((430, 665), '25°', fill=PURPLE, font=F_BODY)
    d.text((470, 720), 'AD 平分 ∠A', fill=INK, font=F_MATH)
    note(d, (780, 180), '结论', ['∠BAD = ∠CAD', '∠CAD = 25°'], PURPLE, 380, 165)
    save(im, path)

def isosceles_top40(path):
    im, d = card('题 2：顶角 40°', 'AB=AC，顶角在 A，两个底角相等')
    A, B, C = (640, 175), (305, 710), (975, 710)
    line(d, A, B, BLUE, 5); line(d, A, C, BLUE, 5); line(d, B, C, BLUE, 5)
    tick(d, A, B, RED); tick(d, A, C, RED)
    point(d, A, 'A'); point(d, B, 'B', dx=-35, dy=-10); point(d, C, 'C')
    angle_arc(d, A, 70, 58, 122, ORANGE, 5)
    angle_arc(d, B, 60, 300, 354, BLUE, 5)
    angle_arc(d, C, 60, 186, 240, BLUE, 5)
    d.text((608, 238), '40°', fill=ORANGE, font=F_MATH)
    d.text((310, 662), '70°', fill=BLUE, font=F_MATH)
    d.text((915, 662), '70°', fill=BLUE, font=F_MATH)
    note(d, (780, 190), '结论', ['∠B=∠C', '=(180°-40°)÷2=70°'], GREEN, 410, 170)
    save(im, path)

def trig_problem(path, title, formula, labels, note_lines):
    im, d = card(title, '参考角 A、对边、邻边、斜边要和题干一致')
    A, C, B = (210, 655), (690, 655), (690, 295)
    line(d, A, C, BLUE, 6); line(d, C, B, BLUE, 6); line(d, A, B, BLUE, 6)
    point(d, A, 'A', RED); point(d, B, 'B', RED); point(d, C, 'C', RED)
    right_mark(d, C, 38, 'ur', INK)
    angle_arc(d, A, 92, 310, 348, ORANGE, 5)
    d.text((245, 610), '∠A', fill=ORANGE, font=F_BODY)
    d.text((430, 690), labels['base'], fill=INK, font=F_MATH)
    d.text((710, 455), labels['height'], fill=INK, font=F_MATH)
    d.text((420, 440), labels['hyp'], fill=INK, font=F_MATH)
    d.rounded_rectangle([760, 245, 1160, 580], radius=18, fill='#fff7ed', outline='#fed7aa', width=3)
    d.text((790, 300), formula, fill=INK, font=F_MATH)
    yy = 360
    for s in note_lines:
        d.text((790, yy), s, fill=MUTED, font=F_BODY)
        yy += 42
    save(im, path)

def ladder_problem(path):
    im, d = card('题 4：梯子靠墙', '10 m 梯子与地面成 60°，求墙上高度 h')
    A, C, B = (230, 670), (790, 670), (790, 185)
    line(d, (170, 670), (900, 670), INK, 5)
    line(d, (790, 670), (790, 145), INK, 5)
    line(d, A, B, BLUE, 7)
    point(d, A, 'A', RED); point(d, B, 'B', RED); point(d, C, 'C', RED)
    right_mark(d, C, 38, 'ur', INK)
    angle_arc(d, A, 95, 300, 360, ORANGE, 5)
    d.text((335, 625), '60°', fill=ORANGE, font=F_MATH)
    d.text((455, 395), '梯子 AB=10 m', fill=BLUE, font=F_MATH)
    d.text((815, 395), 'h', fill=RED, font=F_MATH)
    d.text((395, 705), '地面', fill=MUTED, font=F_BODY)
    d.text((820, 210), '墙面', fill=MUTED, font=F_BODY)
    d.rounded_rectangle([825, 245, 1180, 560], radius=18, fill='#fff7ed', outline='#fed7aa', width=3)
    d.text((855, 300), 'h = 10·sin60°', fill=INK, font=F_MATH)
    d.text((855, 355), '= 5√3 m', fill=INK, font=F_MATH)
    d.text((855, 420), '高度是 60° 的对边。', fill=MUTED, font=F_BODY)
    save(im, path)

def main():
    for lesson in ('ch05-parallel-lesson-2', 'ch05-parallel-lesson-3'):
        title = '5.2 平行线及其判定' if lesson.endswith('lesson-2') else '5.3 平行线的性质'
        subtitle = '同位角、内错角、同旁内角与两直线平行'
        base = f'assets/figures/generated/unique/{lesson}'
        parallel_diagram(f'{base}/cover.png', title, subtitle, '内错角相等', '两直线平行', 'same')
        parallel_diagram(f'{base}/problem-01.png', title, subtitle, 'AB∥CD', '∠2=∠1=58°', 'property')
        parallel_diagram(f'{base}/problem-02.png', title, subtitle, '∠1=∠2', '所以 AB∥CD', 'same')
        parallel_diagram(f'{base}/problem-03.png', title, subtitle, '同旁内角互补', 'x=55°', 'supplement')
        parallel_diagram(f'{base}/problem-04.png', title, subtitle, '先找角位关系', '再判断模型结构', 'hint')
        parallel_diagram(f'{base}/problem-05.png', title, subtitle, '角关系成立', '再进入证明', 'hint')

    triangle_bisector('assets/figures/generated/unique/ch11-triangle-lesson-1/problem-03.png')
    isosceles_top40('assets/figures/generated/unique/ch13-symmetry-lesson-3/problem-02.png')
    trig_problem(
        'assets/figures/generated/unique/ch28-trigonometry-lesson-1/problem-02.png',
        '28.1 锐角三角函数',
        'x / 10 = 3 / 5',
        {'base': '邻边 8', 'height': '对边 x=6', 'hyp': '斜边 10'},
        ['sinA = 对边 / 斜边', 'A 的对边 x=6。'],
    )
    trig_problem(
        'assets/figures/generated/unique/ch28-trigonometry-lesson-1/problem-04.png',
        '28.1 锐角三角函数',
        'x / 8 = 3 / 4',
        {'base': '邻边 8', 'height': '对边 x=6', 'hyp': '斜边 10'},
        ['tanA = 对边 / 邻边', 'A 的对边 x=6。'],
    )
    ladder_problem('assets/figures/generated/unique/ch28-trigonometry-lesson-2/problem-04.png')

main()
`;

const result = spawnSync(python, ['-c', script], {
  cwd: process.cwd(),
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 10,
});

process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log('fixed geometry audit figures');
