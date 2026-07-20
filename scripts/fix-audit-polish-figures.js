const { spawnSync } = require('child_process');

const python = process.env.PYTHON || '/Users/hht/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';

const script = String.raw`
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

ROOT = Path.cwd()
W, H = 1280, 900

def font(size, bold=False):
    candidates = [
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/STHeiti Light.ttc',
        '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
    ]
    for item in candidates:
        try:
            return ImageFont.truetype(item, size)
        except Exception:
            pass
    return ImageFont.load_default()

F = font(30)
FS = font(24)
FT = font(42)
FM = font(34)

BLUE = (34, 104, 196)
GREEN = (33, 150, 117)
RED = (214, 67, 79)
ORANGE = (230, 139, 45)
GRAY = (92, 103, 115)
GRID = (226, 233, 240)
INK = (25, 36, 50)
PANEL = (245, 249, 253)

def text(draw, xy, value, fill=INK, f=FS, anchor=None):
    draw.text(xy, value, fill=fill, font=f, anchor=anchor)

def save(img, rel):
    out = ROOT / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, 'PNG', optimize=True)

def base(title, subtitle=''):
    img = Image.new('RGB', (W, H), (250, 252, 255))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 88], fill=(232, 240, 252))
    text(d, (42, 24), title, BLUE, FT)
    if subtitle:
        text(d, (42, 64), subtitle, GRAY, FS)
    return img, d

def card(d, xy, title, lines, color=BLUE):
    x, y, w, h = xy
    d.rounded_rectangle([x, y, x + w, y + h], radius=12, fill=(255, 255, 255), outline=(219, 226, 235), width=2)
    d.rectangle([x, y, x + 8, y + h], fill=color)
    text(d, (x + 24, y + 18), title, color, FM)
    yy = y + 66
    for line in lines:
        text(d, (x + 24, yy), line, INK, FS)
        yy += 36

def arrow(d, p1, p2, fill=GRAY, width=4):
    d.line([p1, p2], fill=fill, width=width)
    ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    for a in (ang + 2.55, ang - 2.55):
        d.line([p2, (p2[0] + 18 * math.cos(a), p2[1] + 18 * math.sin(a))], fill=fill, width=width)

def polynomial_area():
    img, d = base('平方差公式的面积模型', '用正长度表示 a²-b² = (a+b)(a-b)，避免把边长写成负数')
    # Left: large square side a, removed corner side b.
    x0, y0, s = 130, 170, 360
    b = 130
    d.rectangle([x0, y0, x0 + s, y0 + s], fill=(224, 239, 255), outline=BLUE, width=4)
    d.rectangle([x0 + s - b, y0, x0 + s, y0 + b], fill=(255, 235, 221), outline=ORANGE, width=4)
    d.line([x0 + s - b, y0, x0 + s - b, y0 + s], fill=BLUE, width=2)
    d.line([x0, y0 + b, x0 + s, y0 + b], fill=BLUE, width=2)
    text(d, (x0 + s // 2, y0 + s + 35), '大正方形边长 a', BLUE, FS, 'mm')
    text(d, (x0 + s - b // 2, y0 + b // 2), 'b²', ORANGE, FM, 'mm')
    text(d, (x0 + 120, y0 + 230), '剩余面积', BLUE, FM)
    text(d, (x0 + 120, y0 + 272), 'a² - b²', BLUE, FM)
    d.line([x0, y0 - 24, x0 + s, y0 - 24], fill=INK, width=3)
    text(d, (x0 + s // 2, y0 - 58), 'a', INK, FS, 'mm')
    d.line([x0 + s + 24, y0, x0 + s + 24, y0 + b], fill=ORANGE, width=3)
    text(d, (x0 + s + 58, y0 + b // 2), 'b', ORANGE, FS, 'mm')
    arrow(d, (540, 350), (660, 350), GREEN, 5)
    text(d, (600, 300), '剪拼', GREEN, FM, 'mm')
    # Right: rectangle dimensions a+b and a-b.
    rx, ry, rw, rh = 720, 245, 420, 250
    d.rectangle([rx, ry, rx + rw, ry + rh], fill=(232, 248, 241), outline=GREEN, width=4)
    d.line([rx + 210, ry, rx + 210, ry + rh], fill=GREEN, width=2)
    d.rectangle([rx, ry, rx + 210, ry + rh], fill=(232, 248, 241), outline=GREEN, width=3)
    d.rectangle([rx + 210, ry, rx + rw, ry + rh], fill=(255, 246, 219), outline=ORANGE, width=3)
    text(d, (rx + rw // 2, ry + rh + 38), 'a + b', INK, FM, 'mm')
    text(d, (rx - 48, ry + rh // 2), 'a - b', INK, FM, 'mm')
    text(d, (rx + rw // 2, ry + rh // 2 - 18), '面积不变', GREEN, FM, 'mm')
    text(d, (rx + rw // 2, ry + rh // 2 + 28), '(a+b)(a-b)', GREEN, FM, 'mm')
    card(d, (180, 660, 920, 140), '结论', ['a² - b² = (a+b)(a-b)', '所有边长都用 a、b、a-b、a+b 表示，其中 a>b>0。'], GREEN)
    save(img, 'assets/figures/generated/polynomial-area.png')

def axes(d, origin=(210, 690), sx=70, sy=50, xmax=12, ymax=10):
    ox, oy = origin
    for i in range(0, xmax + 1):
        x = ox + i * sx
        d.line([x, oy, x, oy - ymax * sy], fill=GRID, width=1)
        d.line([x, oy - 6, x, oy + 6], fill=INK, width=2)
        if i:
            text(d, (x, oy + 28), str(i), GRAY, font(18), 'mm')
    for j in range(0, ymax + 1):
        y = oy - j * sy
        d.line([ox, y, ox + xmax * sx, y], fill=GRID, width=1)
        d.line([ox - 6, y, ox + 6, y], fill=INK, width=2)
        if j:
            text(d, (ox - 28, y), str(j), GRAY, font(18), 'mm')
    arrow(d, (ox, oy), (ox + xmax * sx + 35, oy), INK, 3)
    arrow(d, (ox, oy), (ox, oy - ymax * sy - 35), INK, 3)
    text(d, (ox + xmax * sx + 58, oy + 6), 'x', INK, FS, 'mm')
    text(d, (ox - 10, oy - ymax * sy - 58), 'y', INK, FS, 'mm')
    return ox, oy, sx, sy

def plot_inverse(d, k, origin=(190, 700), sx=72, sy=45, xmax=12, ymax=12, color=BLUE):
    ox, oy, sx, sy = axes(d, origin, sx, sy, xmax, ymax)
    pts = []
    for t in [i / 10 for i in range(10, xmax * 10 + 1)]:
        y = k / t
        if y <= ymax:
            pts.append((ox + t * sx, oy - y * sy))
    if len(pts) > 1:
        d.line(pts, fill=color, width=5)
    d.polygon([(ox, oy), (ox + xmax * sx, oy), (ox + xmax * sx, oy - ymax * sy), (ox, oy - ymax * sy)], outline=GREEN)
    text(d, (ox + 240, oy - ymax * sy + 32), '实际范围：x>0，y>0，只取第一象限', GREEN, FS)
    return ox, oy, sx, sy

def inverse_card(rel, title, formula, notes, k=12, point=None):
    img, d = base('26.2 实际问题与反比例函数', title)
    ox, oy, sx, sy = plot_inverse(d, k)
    if point:
        x, y, label = point
        px, py = ox + x * sx, oy - y * sy
        d.ellipse([px - 7, py - 7, px + 7, py + 7], fill=RED)
        d.line([px, py, px, oy], fill=RED, width=2)
        d.line([ox, py, px, py], fill=RED, width=2)
        text(d, (px + 14, py - 16), label, RED, FS)
    card(d, (860, 190, 350, 250), '关系式', [formula], BLUE)
    card(d, (860, 485, 350, 250), '审题点', notes, GREEN)
    save(img, rel)

def inverse_figures():
    inverse_card(
        'assets/figures/generated/unique/ch26-inverse-function-lesson-2/cover.png',
        '乘积固定时，两个正量成反比例',
        'xy = k，y = k/x',
        ['先确定总量 k。', '再写 y=k/x。', '实际问题通常 x>0，y>0。'],
        12,
        (3, 4, '对应点')
    )
    inverse_card(
        'assets/figures/generated/unique/ch26-inverse-function-lesson-2/problem-01.png',
        '题 1：工程总量 120',
        'xy = 120，所以 y = 120/x',
        ['每名工人的日效率相同。', 'x 表示人数，y 表示天数。', 'x、y 都取正值。'],
        12,
        (3, 4, '对应点')
    )
    inverse_card(
        'assets/figures/generated/unique/ch26-inverse-function-lesson-2/problem-02.png',
        '题 2：路程 240 km',
        'vt = 240，所以 t = 240/v',
        ['v=60 时，t=240/60=4。', '速度和时间都是正数。'],
        12,
        (6, 2, '对应点')
    )
    inverse_card(
        'assets/figures/generated/unique/ch26-inverse-function-lesson-2/problem-03.png',
        '题 3：为什么只取第一象限',
        'y = k/x，且 x>0、y>0',
        ['人数、速度、时间、长度通常为正。', '第二、三、四象限没有实际意义。'],
        12,
        (4, 3, '实际点')
    )
    inverse_card(
        'assets/figures/generated/unique/ch26-inverse-function-lesson-2/problem-04.png',
        '题 4：面积为 24 的长方形',
        'xy = 24，所以 y = 24/x',
        ['x=6 时，y=24/6=4。', '长和宽都必须大于 0。'],
        12,
        (6, 2, '对应点')
    )
    inverse_card(
        'assets/figures/generated/unique/ch26-inverse-function-lesson-2/problem-05.png',
        '题 5：检查实际意义',
        '先算函数，再看范围',
        ['数学图象可能有两个分支。', '应用题常只保留正量对应部分。'],
        12,
        (5, 2.4, '保留部分')
    )

def projection_types():
    img, d = base('平行投影与中心投影', '先看投射线之间的关系，再判断投影类型')

    # Parallel projection: the rays keep the same direction.
    d.rounded_rectangle([70, 140, 610, 660], radius=20, fill=(255, 255, 255), outline=(219, 226, 235), width=3)
    text(d, (105, 175), '平行投影', BLUE, FT)
    text(d, (105, 230), '投射线互相平行', GRAY, FS)
    d.ellipse([115, 300, 195, 380], fill=(255, 219, 105), outline=ORANGE, width=3)
    d.rectangle([360, 355, 395, 565], fill=BLUE)
    d.line([100, 570, 570, 570], fill=INK, width=4)
    for offset in (0, 55, 110):
        arrow(d, (205, 290 + offset), (545, 480 + offset), ORANGE, 5)
    text(d, (105, 605), '示例：太阳光下的影子', GREEN, FS)

    # Central projection: all rays pass through one source point.
    d.rounded_rectangle([670, 140, 1210, 660], radius=20, fill=(255, 255, 255), outline=(219, 226, 235), width=3)
    text(d, (705, 175), '中心投影', RED, FT)
    text(d, (705, 230), '投射线经过同一点', GRAY, FS)
    source = (760, 330)
    d.ellipse([source[0]-12, source[1]-12, source[0]+12, source[1]+12], fill=RED)
    text(d, (735, 285), '点光源', RED, FS)
    d.rectangle([950, 365, 985, 565], fill=BLUE)
    d.line([705, 570, 1170, 570], fill=INK, width=4)
    for target in ((1130, 455), (1130, 535), (1130, 595)):
        arrow(d, source, target, ORANGE, 5)
    text(d, (705, 605), '示例：路灯下的影子', GREEN, FS)

    card(d, (170, 700, 940, 130), '判断入口', ['互相平行 -> 平行投影；经过同一点 -> 中心投影。'], GREEN)
    save(img, 'assets/figures/generated/templates/model-projection-types.png')

def data_quartiles():
    img, d = base('四分位数', '先排序，再按约定从上下两半数据中分别找中位数')
    values = [2, 4, 5, 7, 9, 10, 12, 15]
    start_x, y, box_w, gap = 110, 300, 112, 20
    centers = []
    for index, value in enumerate(values):
        x = start_x + index * (box_w + gap)
        fill = (232, 240, 252) if index < 4 else (232, 248, 241)
        outline = BLUE if index < 4 else GREEN
        d.rounded_rectangle([x, y, x + box_w, y + 104], radius=14, fill=fill, outline=outline, width=3)
        text(d, (x + box_w / 2, y + 52), str(value), INK, FT, 'mm')
        centers.append(x + box_w / 2)

    text(d, (365, 245), '下半组', BLUE, FM, 'mm')
    text(d, (893, 245), '上半组', GREEN, FM, 'mm')
    d.line([centers[1], 435, centers[2], 435], fill=BLUE, width=4)
    d.line([centers[3], 490, centers[4], 490], fill=ORANGE, width=4)
    d.line([centers[5], 435, centers[6], 435], fill=GREEN, width=4)
    text(d, ((centers[1] + centers[2]) / 2, 470), 'Q1=(4+5)/2=4.5', BLUE, FS, 'mm')
    text(d, ((centers[3] + centers[4]) / 2, 530), 'Q2=(7+9)/2=8', ORANGE, FS, 'mm')
    text(d, ((centers[5] + centers[6]) / 2, 470), 'Q3=(10+12)/2=11', GREEN, FS, 'mm')
    card(d, (150, 650, 980, 150), '本例约定', ['8 个数据分成数量相同的上下两半，再分别求两半的中位数。'], GREEN)
    save(img, 'assets/figures/generated/templates/model-data-quartiles.png')

polynomial_area()
inverse_figures()
projection_types()
data_quartiles()
print('fixed audit polish figures')
`;

const result = spawnSync(python, ['-c', script], {
  cwd: process.cwd(),
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 20,
});

process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');

if (result.status !== 0) {
  process.exit(result.status || 1);
}
