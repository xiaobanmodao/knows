from pathlib import Path
from math import cos, pi, sin

from PIL import Image, ImageDraw, ImageFont


WIDTH = 1280
HEIGHT = 900
ROOT = Path(__file__).resolve().parents[1]
FONT_CJK = '/System/Library/Fonts/STHeiti Medium.ttc'
FONT_LATIN = '/System/Library/Fonts/Supplemental/Arial.ttf'
FONT_LATIN_BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'


def font(size, latin=False, bold=False):
    path = FONT_LATIN_BOLD if latin and bold else FONT_LATIN if latin else FONT_CJK
    return ImageFont.truetype(path, size)


def save(image, relative_path):
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, 'PNG', optimize=True)


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def arrow(draw, start, end, fill, width=8, head=18):
    draw.line([start, end], fill=fill, width=width)
    angle = __import__('math').atan2(end[1] - start[1], end[0] - start[0])
    left = (end[0] - head * cos(angle - pi / 6), end[1] - head * sin(angle - pi / 6))
    right = (end[0] - head * cos(angle + pi / 6), end[1] - head * sin(angle + pi / 6))
    draw.polygon([end, left, right], fill=fill)


def text_center(draw, box, value, text_font, fill):
    x1, y1, x2, y2 = box
    bounds = draw.textbbox((0, 0), value, font=text_font)
    tw = bounds[2] - bounds[0]
    th = bounds[3] - bounds[1]
    draw.text(((x1 + x2 - tw) / 2, (y1 + y2 - th) / 2 - bounds[1]), value, font=text_font, fill=fill)


def base_canvas(accent, pale):
    image = Image.new('RGB', (WIDTH, HEIGHT), pale)
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 34, HEIGHT), fill=accent)
    draw.ellipse((1030, -210, 1390, 150), fill='#ffffff')
    draw.ellipse((-160, 710, 160, 1030), fill='#ffffff')
    return image, draw


def axes(draw, origin=(820, 650), x_end=(1160, 650), y_end=(820, 260), color='#334155'):
    arrow(draw, origin, x_end, color, width=5, head=14)
    arrow(draw, origin, y_end, color, width=5, head=14)


def motif_math(draw, key, accent, panel):
    x1, y1, x2, y2 = panel
    ink = '#24324a'
    if key == 'quadratic-equation':
        rounded(draw, (x1 + 60, y1 + 110, x2 - 60, y1 + 260), 28, '#ffffff', accent, 4)
        text_center(draw, (x1 + 60, y1 + 110, x2 - 60, y1 + 260), 'ax² + bx + c = 0', font(52, latin=True, bold=True), ink)
        arrow(draw, (x1 + 145, y1 + 340), (x1 + 145, y1 + 470), accent, 8)
        arrow(draw, (x2 - 145, y1 + 340), (x2 - 145, y1 + 470), accent, 8)
        text_center(draw, (x1 + 60, y1 + 470, x1 + 245, y1 + 570), 'x1', font(46, latin=True, bold=True), ink)
        text_center(draw, (x2 - 245, y1 + 470, x2 - 60, y1 + 570), 'x2', font(46, latin=True, bold=True), ink)
    elif key == 'quadratic-function':
        origin = (int((x1 + x2) / 2), y2 - 90)
        axes(draw, origin, (x2 - 55, origin[1]), (origin[0], y1 + 65), ink)
        points = []
        for t in range(-180, 181, 5):
            points.append((origin[0] + t, origin[1] - int((t * t) / 150)))
        draw.line(points, fill=accent, width=10)
        draw.ellipse((origin[0] - 9, origin[1] - 9, origin[0] + 9, origin[1] + 9), fill='#e84a5f')
    elif key == 'rotation':
        cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
        tri1 = [(cx - 170, cy + 120), (cx - 35, cy + 120), (cx - 170, cy - 80)]
        tri2 = [(cx - 90, cy - 160), (cx - 90, cy - 25), (cx + 110, cy - 160)]
        draw.polygon(tri1, outline=ink, fill='#d9e8ff')
        draw.line(tri1 + [tri1[0]], fill=ink, width=6)
        draw.polygon(tri2, outline=accent, fill='#fff0d7')
        draw.line(tri2 + [tri2[0]], fill=accent, width=6)
        draw.arc((cx - 130, cy - 110, cx + 110, cy + 130), 210, 320, fill=accent, width=10)
        arrow(draw, (cx + 73, cy - 47), (cx + 98, cy - 80), accent, 7, 16)
        draw.ellipse((cx - 9, cy - 9, cx + 9, cy + 9), fill='#e84a5f')
    elif key == 'circle':
        cx, cy, radius = int((x1 + x2) / 2), int((y1 + y2) / 2), 210
        draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=accent, width=10)
        draw.line((cx - radius, cy, cx + radius, cy), fill=ink, width=6)
        draw.line((cx, cy, cx + 155, cy - 140), fill=ink, width=6)
        draw.line((cx + radius, cy - 220, cx + radius, cy + 220), fill='#e84a5f', width=7)
        draw.rectangle((cx + radius - 34, cy - 34, cx + radius, cy), outline=ink, width=4)
        draw.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=ink)
    elif key == 'probability':
        root = (int((x1 + x2) / 2), y1 + 95)
        level1 = [(x1 + 155, y1 + 285), (x2 - 155, y1 + 285)]
        level2 = [(x1 + 75, y1 + 500), (x1 + 245, y1 + 500), (x2 - 245, y1 + 500), (x2 - 75, y1 + 500)]
        for node in level1:
            draw.line((root, node), fill=ink, width=6)
        for index, node in enumerate(level1):
            for child in level2[index * 2:index * 2 + 2]:
                draw.line((node, child), fill=accent, width=6)
        for idx, node in enumerate([root] + level1 + level2):
            r = 34 if idx < 3 else 27
            draw.ellipse((node[0] - r, node[1] - r, node[0] + r, node[1] + r), fill='#ffffff', outline=accent, width=5)
    elif key == 'inverse-function':
        origin = (int((x1 + x2) / 2), int((y1 + y2) / 2))
        axes(draw, origin, (x2 - 50, origin[1]), (origin[0], y1 + 50), ink)
        arrow(draw, origin, (x1 + 50, origin[1]), ink, width=5, head=14)
        arrow(draw, origin, (origin[0], y2 - 50), ink, width=5, head=14)
        branch1, branch2 = [], []
        for t in range(45, 250, 4):
            v = int(10000 / t)
            branch1.append((origin[0] + t, origin[1] - v))
            branch2.append((origin[0] - t, origin[1] + v))
        draw.line(branch1, fill=accent, width=9)
        draw.line(branch2, fill=accent, width=9)
    elif key == 'similarity':
        tri1 = [(x1 + 70, y2 - 100), (x1 + 330, y2 - 100), (x1 + 70, y1 + 190)]
        tri2 = [(x2 - 300, y2 - 100), (x2 - 70, y2 - 100), (x2 - 300, y1 + 250)]
        draw.polygon(tri1, fill='#d9e8ff', outline=accent)
        draw.line(tri1 + [tri1[0]], fill=accent, width=8)
        draw.polygon(tri2, fill='#fff0d7', outline='#d16a25')
        draw.line(tri2 + [tri2[0]], fill='#d16a25', width=8)
        text_center(draw, (x1 + 315, y1 + 260, x2 - 285, y2 - 150), '∽', font(72, latin=True, bold=True), ink)
    elif key == 'trigonometry':
        a = (x1 + 95, y2 - 100)
        b = (x2 - 75, y2 - 100)
        c = (x1 + 95, y1 + 120)
        draw.polygon([a, b, c], fill='#e7f6ef')
        draw.line([a, b, c, a], fill=ink, width=8)
        draw.rectangle((a[0], a[1] - 42, a[0] + 42, a[1]), outline=accent, width=5)
        draw.arc((b[0] - 130, b[1] - 130, b[0] + 10, b[1] + 10), 185, 225, fill='#e84a5f', width=7)
        draw.text((b[0] - 125, b[1] - 90), 'θ', font=font(44, latin=True, bold=True), fill='#e84a5f')
    elif key == 'projection':
        cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2) - 70
        front = [(cx - 120, cy - 80), (cx + 80, cy - 80), (cx + 80, cy + 120), (cx - 120, cy + 120)]
        back = [(p[0] + 90, p[1] - 80) for p in front]
        draw.line(front + [front[0]], fill=accent, width=8)
        draw.line(back + [back[0]], fill=ink, width=7)
        for p, q in zip(front, back):
            draw.line((p, q), fill=ink, width=6)
        for offset, label in [(-250, '主'), (0, '俯'), (250, '左')]:
            rounded(draw, (cx + offset - 55, y2 - 105, cx + offset + 55, y2 - 25), 12, '#ffffff', accent, 4)
            text_center(draw, (cx + offset - 55, y2 - 105, cx + offset + 55, y2 - 25), label, font(32), ink)


def motif_english(draw, key, accent, panel):
    x1, y1, x2, y2 = panel
    ink = '#203b35'
    if key == 'vocabulary':
        center = ((x1 + x2) // 2, (y1 + y2) // 2)
        nodes = [(x1 + 110, y1 + 125), (x2 - 110, y1 + 125), (x1 + 110, y2 - 125), (x2 - 110, y2 - 125)]
        labels = ['root', 'prefix', 'context', 'phrase']
        for node, label in zip(nodes, labels):
            draw.line((center, node), fill=accent, width=6)
            rounded(draw, (node[0] - 75, node[1] - 34, node[0] + 75, node[1] + 34), 18, '#ffffff', accent, 4)
            text_center(draw, (node[0] - 75, node[1] - 34, node[0] + 75, node[1] + 34), label, font(25, latin=True, bold=True), ink)
        draw.ellipse((center[0] - 68, center[1] - 68, center[0] + 68, center[1] + 68), fill=accent)
        text_center(draw, (center[0] - 68, center[1] - 68, center[0] + 68, center[1] + 68), 'WORD', font(27, latin=True, bold=True), '#ffffff')
    elif key == 'sentence':
        labels = [('S', '#d9efe5'), ('V', '#ffe9cc'), ('O', '#dce9ff')]
        left = x1 + 60
        for index, (label, color) in enumerate(labels):
            box = (left + index * 190, y1 + 220, left + index * 190 + 150, y1 + 370)
            rounded(draw, box, 24, color, accent, 5)
            text_center(draw, box, label, font(58, latin=True, bold=True), ink)
            if index < 2:
                arrow(draw, (box[2] + 10, (box[1] + box[3]) // 2), (box[2] + 45, (box[1] + box[3]) // 2), accent, 6, 12)
        draw.text((x1 + 100, y1 + 450), 'Subject  +  Verb  +  Object', font=font(28, latin=True, bold=True), fill=ink)
    elif key == 'tense':
        y = (y1 + y2) // 2
        arrow(draw, (x1 + 70, y), (x2 - 70, y), ink, 7, 18)
        for x, label, color in [(x1 + 150, 'PAST', '#dce9ff'), ((x1 + x2)//2, 'NOW', '#d9efe5'), (x2 - 150, 'FUTURE', '#ffe9cc')]:
            draw.line((x, y - 70, x, y + 70), fill=accent, width=6)
            rounded(draw, (x - 70, y - 155, x + 70, y - 92), 16, color)
            text_center(draw, (x - 70, y - 155, x + 70, y - 92), label, font(22, latin=True, bold=True), ink)
    elif key == 'grammar':
        root = ((x1 + x2)//2, y1 + 90)
        nodes = [(x1 + 135, y1 + 285), ((x1 + x2)//2, y1 + 285), (x2 - 135, y1 + 285)]
        labels = ['modal', 'clause', 'non-finite']
        for node, label in zip(nodes, labels):
            draw.line((root, node), fill=accent, width=6)
            rounded(draw, (node[0] - 95, node[1] - 38, node[0] + 95, node[1] + 38), 18, '#ffffff', accent, 4)
            text_center(draw, (node[0] - 95, node[1] - 38, node[0] + 95, node[1] + 38), label, font(21, latin=True, bold=True), ink)
        rounded(draw, (root[0] - 90, root[1] - 40, root[0] + 90, root[1] + 40), 20, '#d9efe5', accent, 5)
        text_center(draw, (root[0] - 90, root[1] - 40, root[0] + 90, root[1] + 40), 'GRAMMAR', font(23, latin=True, bold=True), ink)
    elif key == 'reading':
        rounded(draw, (x1 + 100, y1 + 60, x2 - 100, y2 - 60), 28, '#ffffff', '#b9d4c7', 4)
        widths = [380, 430, 330, 410, 280]
        for index, width in enumerate(widths):
            y = y1 + 135 + index * 75
            color = accent if index in (0, 3) else '#c9d4d0'
            draw.rounded_rectangle((x1 + 155, y, x1 + 155 + width, y + 24), radius=12, fill=color)
        draw.ellipse((x2 - 260, y2 - 260, x2 - 105, y2 - 105), outline='#d16a25', width=10)
        draw.line((x2 - 145, y2 - 145, x2 - 70, y2 - 70), fill='#d16a25', width=12)
    elif key == 'writing':
        for index, (label, color) in enumerate([('PLAN', '#dce9ff'), ('DRAFT', '#d9efe5'), ('CHECK', '#ffe9cc')]):
            y = y1 + 95 + index * 160
            rounded(draw, (x1 + 90, y, x2 - 90, y + 105), 24, color, accent, 4)
            draw.ellipse((x1 + 120, y + 25, x1 + 175, y + 80), fill=accent)
            text_center(draw, (x1 + 120, y + 25, x1 + 175, y + 80), str(index + 1), font(24, latin=True, bold=True), '#ffffff')
            draw.text((x1 + 210, y + 31), label, font=font(30, latin=True, bold=True), fill=ink)


def motif_physics(draw, key, accent, panel):
    x1, y1, x2, y2 = panel
    ink = '#283447'
    if key == 'motion-sound':
        origin = (x1 + 110, y2 - 100)
        axes(draw, origin, (x2 - 90, origin[1]), (origin[0], y1 + 90), ink)
        points = [(origin[0], origin[1]), (origin[0] + 155, origin[1] - 170), (origin[0] + 300, origin[1] - 170), (origin[0] + 440, origin[1] - 355)]
        draw.line(points, fill=accent, width=10)
        for p in points:
            draw.ellipse((p[0] - 8, p[1] - 8, p[0] + 8, p[1] + 8), fill='#d94f3d')
        for radius in (30, 55, 80):
            draw.arc((x2 - 190 - radius, y1 + 40 - radius, x2 - 190 + radius, y1 + 40 + radius), 300, 60, fill='#d16a25', width=6)
    elif key == 'light':
        mirror_x = (x1 + x2) // 2
        draw.line((mirror_x, y1 + 70, mirror_x, y2 - 70), fill=ink, width=12)
        for y in range(y1 + 90, y2 - 60, 35):
            draw.line((mirror_x, y, mirror_x + 28, y - 18), fill='#8893a4', width=4)
        point = (mirror_x, (y1 + y2)//2)
        arrow(draw, (x1 + 90, y1 + 110), point, accent, 8, 18)
        arrow(draw, point, (x1 + 90, y2 - 110), '#d94f3d', 8, 18)
        draw.line((mirror_x - 230, point[1], mirror_x + 90, point[1]), fill='#8390a2', width=4)
        draw.text((mirror_x + 30, point[1] + 16), 'normal', font=font(20, latin=True), fill=ink)
    elif key == 'matter':
        draw.line((x1 + 80, y1 + 180, x1 + 330, y1 + 180), fill=ink, width=10)
        draw.line((x1 + 205, y1 + 180, x1 + 205, y2 - 120), fill=ink, width=8)
        draw.line((x1 + 100, y2 - 120, x1 + 310, y2 - 120), fill=ink, width=8)
        draw.ellipse((x1 + 145, y1 + 105, x1 + 265, y1 + 225), fill='#dce9ff', outline=accent, width=5)
        bx1, by1, bx2, by2 = x2 - 250, y1 + 100, x2 - 100, y2 - 95
        rounded(draw, (bx1, by1, bx2, by2), 22, '#ffffff', ink, 6)
        draw.rectangle((bx1 + 12, by2 - 180, bx2 - 12, by2 - 12), fill='#a8d7ef')
        for y in range(by1 + 40, by2 - 20, 45):
            draw.line((bx1, y, bx1 + 28, y), fill=ink, width=3)
    elif key == 'force':
        cx, cy = (x1 + x2)//2, (y1 + y2)//2
        rounded(draw, (cx - 120, cy - 80, cx + 120, cy + 80), 18, '#dce9ff', ink, 6)
        draw.line((x1 + 80, cy + 82, x2 - 80, cy + 82), fill=ink, width=8)
        arrow(draw, (cx, cy - 80), (cx, y1 + 70), accent, 8, 18)
        arrow(draw, (cx, cy + 80), (cx, y2 - 55), '#d94f3d', 8, 18)
        arrow(draw, (cx + 120, cy), (x2 - 60, cy), '#d16a25', 8, 18)
        arrow(draw, (cx - 120, cy), (x1 + 60, cy), '#69778d', 8, 18)
        draw.text((cx + 18, y1 + 72), 'N', font=font(28, latin=True, bold=True), fill=accent)
        draw.text((cx + 18, y2 - 105), 'G', font=font(28, latin=True, bold=True), fill='#d94f3d')
    elif key == 'energy':
        boxes = [(x1 + 65, y1 + 200, x1 + 225, y1 + 330), ((x1+x2)//2 - 80, y1 + 200, (x1+x2)//2 + 80, y1 + 330), (x2 - 225, y1 + 200, x2 - 65, y1 + 330)]
        labels = ['INPUT', 'WORK', 'OUTPUT']
        colors = ['#ffe3c7', '#dce9ff', '#d9efe5']
        for box, label, color in zip(boxes, labels, colors):
            rounded(draw, box, 26, color, accent, 5)
            text_center(draw, box, label, font(22, latin=True, bold=True), ink)
        arrow(draw, (boxes[0][2] + 12, (boxes[0][1]+boxes[0][3])//2), (boxes[1][0]-12, (boxes[1][1]+boxes[1][3])//2), accent, 8, 18)
        arrow(draw, (boxes[1][2] + 12, (boxes[1][1]+boxes[1][3])//2), (boxes[2][0]-12, (boxes[2][1]+boxes[2][3])//2), accent, 8, 18)
        arrow(draw, ((x1+x2)//2, boxes[1][3] + 10), ((x1+x2)//2, y2 - 90), '#d94f3d', 7, 16)
        draw.text(((x1+x2)//2 + 18, y2 - 155), 'loss', font=font(22, latin=True), fill='#d94f3d')
    elif key == 'electricity':
        left, right, top, bottom = x1 + 80, x2 - 80, y1 + 120, y2 - 120
        draw.line((left, top, right, top, right, bottom, left, bottom, left, top), fill=ink, width=8)
        draw.line((left + 90, top - 35, left + 90, top + 35), fill=accent, width=8)
        draw.line((left + 125, top - 55, left + 125, top + 55), fill=accent, width=8)
        draw.ellipse(((left+right)//2 - 48, top - 48, (left+right)//2 + 48, top + 48), outline='#d94f3d', width=7, fill='#ffffff')
        text_center(draw, ((left+right)//2 - 48, top - 48, (left+right)//2 + 48, top + 48), 'A', font(34, latin=True, bold=True), '#d94f3d')
        draw.line((right - 170, bottom - 42, right - 140, bottom + 42, right - 110, bottom - 42, right - 80, bottom + 42, right - 50, bottom - 42), fill=accent, width=8)
        arrow(draw, (left + 170, bottom), (left + 280, bottom), '#d16a25', 7, 16)


def draw_cover(relative_path, subject, title, subtitle, key, index):
    palettes = {
        'math': [('#1b62d1', '#edf4ff'), ('#0c7b68', '#eaf8f4'), ('#c85f27', '#fff3e8')],
        'english': [('#087a4b', '#ecf8f2'), ('#bc5c24', '#fff3ea'), ('#3367a8', '#edf4fc')],
        'physics': [('#c14e24', '#fff2e9'), ('#286a8a', '#edf7fb'), ('#536a33', '#f1f7e9')],
    }
    accent, pale = palettes[subject][index % len(palettes[subject])]
    image, draw = base_canvas(accent, pale)
    draw.text((90, 90), {'math': '初中数学', 'english': '初中英语', 'physics': '初中物理'}[subject], font=font(28), fill=accent)
    draw.text((90, 165), title, font=font(64), fill='#17233f')
    draw.multiline_text((92, 275), subtitle, font=font(29), fill='#5a667a', spacing=14)
    rounded(draw, (85, 650, 450, 720), 22, accent)
    text_center(draw, (85, 650, 450, 720), '专题知识 · 方法与图解', font(25), '#ffffff')
    panel = (560, 105, 1200, 790)
    rounded(draw, panel, 42, '#ffffff', '#dce4ee', 3)
    {'math': motif_math, 'english': motif_english, 'physics': motif_physics}[subject](draw, key, accent, panel)
    save(image, relative_path)


def draw_diagram(relative_path, subject, title, key, index):
    accents = {'english': ['#087a4b', '#bc5c24', '#3367a8'], 'physics': ['#c14e24', '#286a8a', '#536a33'], 'math': ['#1b62d1', '#0c7b68', '#c85f27']}
    pales = {'english': '#f2faf6', 'physics': '#fff7f1', 'math': '#f2f6fd'}
    accent = accents[subject][index % 3]
    image, draw = base_canvas(accent, pales[subject])
    draw.text((85, 65), title, font=font(48), fill='#17233f')
    draw.text((88, 135), '结构示意 · 先读图，再回到文字与步骤', font=font(25), fill='#687489')
    panel = (85, 210, 1195, 825)
    rounded(draw, panel, 38, '#ffffff', '#dce4ee', 3)
    inner = (245, 235, 1035, 800)
    {'math': motif_math, 'english': motif_english, 'physics': motif_physics}[subject](draw, key, accent, inner)
    save(image, relative_path)


math_topics = [
    ('g9-topic-quadratic-equation', '一元二次方程', '按结构选择解法\n判断根，再回到实际情境', 'quadratic-equation'),
    ('g9-topic-quadratic-function', '二次函数', '从顶点、对称轴与开口\n读懂抛物线', 'quadratic-function'),
    ('g9-topic-rotation', '旋转', '锁定中心、方向和角度\n追踪对应点', 'rotation'),
    ('g9-topic-circle', '圆', '连接弦、弧、角与切线\n形成性质网络', 'circle'),
    ('g9-topic-probability', '概率', '完整列举样本空间\n再计算有利结果', 'probability'),
    ('g9-topic-inverse-function', '反比例函数', '理解乘积不变量\n读懂双曲线', 'inverse-function'),
    ('g9-topic-similarity', '相似', '写对对应关系\n用比例连接图形', 'similarity'),
    ('g9-topic-trigonometry', '锐角三角函数', '选定参考角\n分清对边、邻边和斜边', 'trigonometry'),
    ('g9-topic-projection', '投影与视图', '对应长、宽、高\n从平面还原空间', 'projection'),
]

english_topics = [
    ('eng-topic-vocabulary', '词汇与构词', '词形、搭配与语境\n三条路径共同判断', 'vocabulary'),
    ('eng-topic-sentence', '句子结构', '先找主干\n再补充修饰成分', 'sentence'),
    ('eng-topic-tense', '时态与语态', '时间、动作状态与主被动\n共同决定谓语', 'tense'),
    ('eng-topic-grammar', '语法难点', '把复杂语法拆成\n清晰的结构分支', 'grammar'),
    ('eng-topic-reading', '阅读与完形', '定位证据、识别结构\n再作判断', 'reading'),
    ('eng-topic-writing', '英语写作', '审题、列纲、成段、修改\n逐步完成表达', 'writing'),
]

physics_topics = [
    ('phy-topic-motion-sound', '运动与声音', '用图像描述运动\n用振动解释声音', 'motion-sound'),
    ('phy-topic-light', '光现象与成像', '以法线为基准\n规范画出传播方向', 'light'),
    ('phy-topic-matter', '热现象与物质测量', '从现象到数据\n规范完成测量', 'matter'),
    ('phy-topic-force', '力与流体', '隔离研究对象\n画清每一个力', 'force'),
    ('phy-topic-energy', '功与能量', '追踪输入、输出与损耗\n理解能量转化', 'energy'),
    ('phy-topic-electricity', '电学与电磁现象', '先识别连接\n再分析电流和电压', 'electricity'),
]

math_templates = [
    ('model-number-line-distance', '数轴距离模型', 'number-line'),
    ('model-expression-structure', '整式结构化简', 'expression'),
    ('model-linear-equation-scenario', '一元一次方程建模', 'equation'),
    ('model-line-angle-calculation', '线段与角计算', 'line-angle'),
    ('model-root-estimation', '根式估算比较', 'root'),
    ('model-coordinate-translation', '坐标平移模型', 'coordinate'),
    ('model-system-elimination', '方程组消元', 'system'),
    ('model-survey-chart', '调查与频数图表', 'survey'),
    ('model-factorization', '因式分解三步法', 'factor'),
    ('model-fraction-equation', '分式方程建模', 'fraction'),
    ('model-radical-operation', '二次根式运算', 'radical'),
    ('model-statistic-selection', '统计量选择', 'statistics'),
    ('model-probability-listing', '列表与树状图概率', 'probability'),
]


def draw_template_motif(draw, key, accent, panel):
    x1, y1, x2, y2 = panel
    ink = '#25344b'
    if key == 'number-line':
        y = (y1 + y2)//2
        arrow(draw, (x1 + 40, y), (x2 - 40, y), ink, 7, 17)
        for value in range(-4, 6):
            x = x1 + 100 + (value + 4) * 68
            draw.line((x, y - 18, x, y + 18), fill=ink, width=4)
            draw.text((x - 15, y + 28), str(value), font=font(20, latin=True), fill=ink)
        a, b = x1 + 168, x1 + 712
        draw.ellipse((a-10,y-10,a+10,y+10),fill=accent)
        draw.ellipse((b-10,y-10,b+10,y+10),fill='#d94f3d')
        draw.arc((a, y-100, b, y+30), 180, 360, fill=accent, width=7)
    elif key == 'expression':
        labels = ['3x', '-(2x', '- x', '+ 4)']
        colors = ['#dce9ff', '#ffe6ca', '#d9efe5', '#f6dcec']
        left = x1 + 35
        for i,(label,color) in enumerate(zip(labels,colors)):
            box=(left+i*170,y1+180,left+i*170+145,y1+300)
            rounded(draw,box,20,color,accent,4)
            text_center(draw,box,label,font(27,latin=True,bold=True),ink)
        arrow(draw,(x1+270,y1+380),(x2-270,y1+380),accent,7,16)
        text_center(draw,(x1+250,y1+410,x2-250,y1+510),'2x - 4',font(42,latin=True,bold=True),ink)
    elif key == 'equation':
        draw.line((x1+100,y1+180,x2-100,y1+180),fill=ink,width=9)
        draw.line(((x1+x2)//2,y1+180,(x1+x2)//2,y2-80),fill=ink,width=8)
        draw.line((x1+250,y2-80,x2-250,y2-80),fill=ink,width=8)
        text_center(draw,(x1+90,y1+220,(x1+x2)//2-30,y1+380),'0.8x',font(48,latin=True,bold=True),accent)
        text_center(draw,((x1+x2)//2+30,y1+220,x2-90,y1+380),'120',font(48,latin=True,bold=True),'#d94f3d')
    elif key == 'line-angle':
        o=((x1+x2)//2,y2-100)
        draw.line((x1+70,o[1],x2-70,o[1]),fill=ink,width=8)
        draw.line((o[0],o[1],x1+220,y1+70),fill=accent,width=8)
        draw.line((o[0],o[1],x2-220,y1+70),fill='#d94f3d',width=8)
        draw.arc((o[0]-210,o[1]-215,o[0]+5,o[1]+5),200,270,fill=accent,width=7)
        draw.arc((o[0]-5,o[1]-215,o[0]+210,o[1]+5),270,340,fill='#d94f3d',width=7)
    elif key == 'root':
        draw.text((x1+100,y1+95),'16 < 20 < 25',font=font(44,latin=True,bold=True),fill=ink)
        arrow(draw,(x1+170,y1+245),(x2-170,y1+245),accent,7,16)
        draw.text((x1+165,y1+300),'4 < √20 < 5',font=font(46,latin=True,bold=True),fill='#d16a25')
    elif key == 'coordinate':
        origin=((x1+x2)//2,y2-90)
        axes(draw,origin,(x2-60,origin[1]),(origin[0],y1+60),ink)
        p=(origin[0]-140,origin[1]-180); q=(origin[0]+140,origin[1]-250)
        draw.ellipse((p[0]-12,p[1]-12,p[0]+12,p[1]+12),fill=accent)
        arrow(draw,p,q,'#d94f3d',8,18)
        draw.ellipse((q[0]-12,q[1]-12,q[0]+12,q[1]+12),fill='#d94f3d')
    elif key == 'system':
        origin=((x1+x2)//2,(y1+y2)//2+80)
        axes(draw,origin,(x2-60,origin[1]),(origin[0],y1+60),ink)
        draw.line((x1+100,y2-100,x2-100,y1+100),fill=accent,width=9)
        draw.line((x1+130,y1+120,x2-130,y2-110),fill='#d94f3d',width=9)
        draw.ellipse((origin[0]-10,origin[1]-10,origin[0]+10,origin[1]+10),fill=ink)
    elif key == 'survey':
        base=y2-90
        heights=[150,290,210,370,250]
        for i,h in enumerate(heights):
            x=x1+100+i*125
            rounded(draw,(x,base-h,x+78,base),10,[accent,'#d16a25','#5476b5'][i%3])
        draw.line((x1+70,base,x2-70,base),fill=ink,width=7)
    elif key == 'factor':
        rounded(draw,(x1+80,y1+80,x2-80,y2-80),24,'#eaf2ff',accent,6)
        mid=(x1+x2)//2
        draw.line((mid,y1+80,mid,y2-80),fill=accent,width=6)
        draw.text((x1+140,y1+160),'x² - 4',font=font(42,latin=True,bold=True),fill=ink)
        draw.text((x1+120,y1+320),'(x-2)(x+2)',font=font(36,latin=True,bold=True),fill='#d16a25')
    elif key == 'fraction':
        text_center(draw,(x1+60,y1+100,x1+300,y1+250),'1 / x',font(43,latin=True,bold=True),accent)
        text_center(draw,(x2-300,y1+100,x2-60,y1+250),'1 / (x+2)',font(37,latin=True,bold=True),'#d94f3d')
        arrow(draw,(x1+260,y1+310),(x2-260,y1+310),ink,7,18)
        text_center(draw,(x1+240,y1+350,x2-240,y1+500),'合作效率',font(36),ink)
    elif key == 'radical':
        text_center(draw,(x1+70,y1+90,x2-70,y1+220),'√12 + √27',font(48,latin=True,bold=True),ink)
        arrow(draw,((x1+x2)//2,y1+240),((x1+x2)//2,y1+350),accent,8,18)
        text_center(draw,(x1+70,y1+370,x2-70,y1+520),'2√3 + 3√3 = 5√3',font(43,latin=True,bold=True),'#d16a25')
    elif key == 'statistics':
        values=[2,3,3,4,4,4,5,18]
        base=y2-100
        for i,v in enumerate(values):
            x=x1+70+i*80
            h=min(v*20,320)
            rounded(draw,(x,base-h,x+48,base),8,accent if v<10 else '#d94f3d')
        draw.line((x1+45,base,x2-45,base),fill=ink,width=6)
        draw.text((x2-165,y1+95),'极端值',font=font(28),fill='#d94f3d')
    elif key == 'probability':
        motif_math(draw,'probability',accent,panel)


def draw_template(relative_path, title, key, index):
    accent=['#1b62d1','#0c7b68','#c85f27'][index%3]
    image,draw=base_canvas(accent,'#f4f7fb')
    draw.text((85,65),title,font=font(48),fill='#17233f')
    draw.text((88,135),'专属样题图 · 识别结构后再列关系',font=font(25),fill='#687489')
    panel=(100,220,1180,820)
    rounded(draw,panel,38,'#ffffff','#dce4ee',3)
    draw_template_motif(draw,key,accent,(220,240,1060,795))
    save(image,relative_path)


def main():
    for index, (topic_id, title, subtitle, key) in enumerate(math_topics):
        draw_cover(f'assets/figures/generated/topics/{topic_id}/cover.png', 'math', title, subtitle, key, index)
    for index, (topic_id, title, subtitle, key) in enumerate(english_topics):
        draw_cover(f'assets/figures/generated/subjects/english/topics/{topic_id}/cover.png', 'english', title, subtitle, key, index)
        draw_diagram(f'assets/figures/generated/subjects/english/diagrams/{topic_id}.png', 'english', f'{title}结构图', key, index)
    for index, (topic_id, title, subtitle, key) in enumerate(physics_topics):
        draw_cover(f'assets/figures/generated/subjects/physics/topics/{topic_id}/cover.png', 'physics', title, subtitle, key, index)
        draw_diagram(f'assets/figures/generated/subjects/physics/diagrams/{topic_id}.png', 'physics', f'{title}示意图', key, index)
    for index, (template_id, title, key) in enumerate(math_templates):
        draw_template(f'assets/figures/generated/templates/{template_id}.png', title, key, index)
    print(f'generated {len(math_topics) + len(english_topics) * 2 + len(physics_topics) * 2 + len(math_templates)} v1.2 assets')


if __name__ == '__main__':
    main()
