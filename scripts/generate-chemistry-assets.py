from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
import sys

ROOT = Path(__file__).resolve().parents[1]
DIAGRAM_DIR = ROOT / 'assets/figures/generated/chemistry/diagrams'
TEMPLATE_DIR = ROOT / 'assets/figures/generated/chemistry/templates'
DW, DH = 1200, 760
TW, TH = 960, 600

INK = '#17243a'
MUTED = '#526174'
LINE = '#d9e3e1'
PAPER = '#f7faf9'
WHITE = '#ffffff'
BLUE = '#2468b2'
TEAL = '#23806c'
GREEN = '#3a8f63'
ORANGE = '#e28a2d'
RED = '#c94f5c'
YELLOW = '#f2c94c'
PURPLE = '#7858a6'
WATER = '#d9eff8'
GLASS = '#d7e7e8'


def font(size, bold=False):
    candidates = [
        '/System/Library/Fonts/STHeiti Medium.ttc' if bold else '/System/Library/Fonts/STHeiti Light.ttc',
        '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


F_TITLE = font(38, True)
F_SUBTITLE = font(22)
F_HEAD = font(27, True)
F_BODY = font(22)
F_SMALL = font(18)
F_FORMULA = font(26, True)
T_TITLE = font(31, True)
T_HEAD = font(22, True)
T_BODY = font(18)


def text(draw, xy, value, fill=INK, f=F_BODY, anchor=None):
    draw.text(xy, str(value), fill=fill, font=f, anchor=anchor)


def centered(draw, box, value, fill=INK, f=F_BODY):
    x1, y1, x2, y2 = box
    text(draw, ((x1 + x2) / 2, (y1 + y2) / 2), value, fill, f, 'mm')


def arrow(draw, start, end, fill=TEAL, width=4):
    draw.line([start, end], fill=fill, width=width)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    for offset in (2.55, -2.55):
        tip = (end[0] + 17 * math.cos(angle + offset), end[1] + 17 * math.sin(angle + offset))
        draw.line([end, tip], fill=fill, width=width)


def panel(draw, box, fill=WHITE, outline=LINE, radius=16, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def diagram_canvas(title, subtitle):
    image = Image.new('RGB', (DW, DH), PAPER)
    draw = ImageDraw.Draw(image)
    draw.rectangle([0, 0, DW, 104], fill='#e7f1ee')
    draw.rectangle([0, 0, 14, DH], fill=TEAL)
    text(draw, (38, 20), title, INK, F_TITLE)
    text(draw, (40, 67), subtitle, MUTED, F_SUBTITLE)
    return image, draw


def template_canvas(title, subtitle):
    image = Image.new('RGB', (TW, TH), '#f8fafb')
    draw = ImageDraw.Draw(image)
    draw.rectangle([0, 0, TW, 82], fill='#e8f1ee')
    draw.rectangle([0, 0, 11, TH], fill=TEAL)
    text(draw, (30, 15), title, INK, T_TITLE)
    text(draw, (31, 52), subtitle, MUTED, T_BODY)
    return image, draw


def save(image, directory, name):
    directory.mkdir(parents=True, exist_ok=True)
    output = directory / f'{name}.png'
    image.save(output, 'PNG', optimize=True)
    return output


def pill(draw, box, label, fill='#e5f2ee', color=TEAL, f=F_SMALL):
    draw.rounded_rectangle(box, radius=(box[3] - box[1]) // 2, fill=fill, outline=color, width=2)
    centered(draw, box, label, color, f)


def flask(draw, center, scale=1.0, liquid=YELLOW, label=''):
    cx, cy = center
    neck_w = 34 * scale
    neck_h = 78 * scale
    body_w = 150 * scale
    body_h = 120 * scale
    top = cy - body_h / 2 - neck_h
    draw.rectangle([cx - neck_w / 2, top, cx + neck_w / 2, cy - body_h / 2], fill=WHITE, outline=TEAL, width=3)
    points = [
        (cx - neck_w / 2, cy - body_h / 2),
        (cx - body_w / 2, cy + body_h / 2),
        (cx + body_w / 2, cy + body_h / 2),
        (cx + neck_w / 2, cy - body_h / 2),
    ]
    draw.polygon(points, fill=WHITE, outline=TEAL)
    liquid_y = cy + body_h * 0.12
    draw.polygon([
        (cx - body_w * 0.34, liquid_y),
        (cx - body_w / 2, cy + body_h / 2),
        (cx + body_w / 2, cy + body_h / 2),
        (cx + body_w * 0.34, liquid_y),
    ], fill=liquid)
    draw.line(points + [points[0]], fill=TEAL, width=3)
    if label:
        text(draw, (cx, cy + body_h / 2 + 24), label, MUTED, F_SMALL, 'mm')


def gas_jar(draw, box, fill=None, label='', inverted=False):
    x1, y1, x2, y2 = box
    draw.rectangle(box, fill=fill or '#fbfdfd')
    if inverted:
        draw.line([(x1, y2), (x1, y1), (x2, y1), (x2, y2)], fill=BLUE, width=4)
        draw.line([(x1 - 8, y2), (x2 + 8, y2)], fill=BLUE, width=4)
    else:
        draw.line([(x1, y1), (x1, y2), (x2, y2), (x2, y1)], fill=BLUE, width=4)
        draw.line([(x1 - 8, y1), (x2 + 8, y1)], fill=BLUE, width=4)
    if label:
        text(draw, ((x1 + x2) / 2, y2 + 23), label, MUTED, F_SMALL, 'mm')


def draw_laboratory_cycle():
    image, draw = diagram_canvas('实验观察与证据链', '风险识别贯穿准备、观察、记录与解释全过程')
    stages = [
        ('1', '准备', '识别风险\n检查装置'),
        ('2', '观察', '先看事实\n不靠近闻气味'),
        ('3', '记录', '条件·现象\n数据·异常'),
        ('4', '解释', '证据支持\n说明边界'),
    ]
    colors = [BLUE, ORANGE, PURPLE, GREEN]
    for index, (number, heading, body) in enumerate(stages):
        x = 62 + index * 282
        panel(draw, [x, 190, x + 225, 485], WHITE, colors[index], 18, 3)
        draw.ellipse([x + 76, 220, x + 149, 293], fill=colors[index])
        centered(draw, [x + 76, 220, x + 149, 293], number, WHITE, F_HEAD)
        text(draw, (x + 112, 330), heading, colors[index], F_HEAD, 'mm')
        for line_index, line in enumerate(body.split('\n')):
            text(draw, (x + 112, 390 + line_index * 34), line, MUTED, F_BODY, 'mm')
        if index < len(stages) - 1:
            arrow(draw, (x + 228, 338), (x + 275, 338), TEAL, 4)
    panel(draw, [90, 560, 1110, 680], '#fff7e8', '#efc46e', 18, 2)
    text(draw, (120, 585), '安全底线', ORANGE, F_HEAD)
    text(draw, (120, 630), '护目镜 · 规范取用 · 未知物不尝、不直接闻 · 异常立即停止并报告教师', INK, F_BODY)
    return save(image, DIAGRAM_DIR, 'laboratory-observation-cycle')


def draw_oxygen_preparation():
    image, draw = diagram_canvas('氧气的实验室制取', '过氧化氢溶液 + 二氧化锰；常温发生，排水收集')
    flask(draw, (330, 430), 1.2, '#dceefa', '发生瓶')
    draw.rectangle([303, 155, 357, 315], fill=WHITE, outline=ORANGE, width=3)
    draw.polygon([(303, 155), (357, 155), (347, 130), (313, 130)], fill=WHITE, outline=ORANGE)
    draw.line([(330, 315), (330, 432)], fill=ORANGE, width=5)
    draw.ellipse([323, 245, 337, 259], fill=ORANGE)
    text(draw, (225, 132), '过氧化氢溶液', ORANGE, F_BODY)
    text(draw, (240, 475), '二氧化锰', PURPLE, F_SMALL)
    for x in (286, 310, 334, 358):
        draw.ellipse([x, 440, x + 12, 452], fill=PURPLE)
    draw.line([(390, 370), (510, 370), (510, 520), (665, 520)], fill=TEAL, width=6)
    arrow(draw, (430, 370), (485, 370), TEAL, 4)
    text(draw, (455, 340), 'O2', TEAL, F_FORMULA, 'mm')
    draw.rectangle([575, 390, 1045, 615], fill=WATER, outline=BLUE, width=3)
    gas_jar(draw, [760, 245, 930, 545], '#f7fbfc', '倒置集气瓶', inverted=True)
    draw.line([(665, 520), (665, 460), (845, 460), (845, 535)], fill=TEAL, width=6)
    arrow(draw, (845, 515), (845, 470), TEAL, 4)
    for y in (420, 385, 350):
        draw.ellipse([835, y, 855, y + 20], outline=BLUE, width=3)
    text(draw, (600, 585), '水槽', BLUE, F_BODY)
    pill(draw, [55, 620, 470, 675], '先检查气密性，再装药品', '#fff3dc', ORANGE, F_BODY)
    panel(draw, [515, 620, 1135, 700], WHITE, LINE, 14, 2)
    text(draw, (825, 651), '2H2O2  ->  2H2O + O2', INK, F_FORMULA, 'mm')
    text(draw, (825, 682), '条件：二氧化锰作催化剂', PURPLE, F_SMALL, 'mm')
    return save(image, DIAGRAM_DIR, 'oxygen-preparation')


def draw_carbon_dioxide_preparation():
    image, draw = diagram_canvas('二氧化碳的实验室制取', '大理石 + 稀盐酸；长颈漏斗下端浸入液面形成液封')
    flask(draw, (305, 430), 1.25, '#e7eff5', '发生瓶')
    draw.line([(285, 155), (285, 490)], fill=ORANGE, width=6)
    draw.ellipse([259, 126, 311, 170], fill=WHITE, outline=ORANGE, width=3)
    text(draw, (130, 145), '稀盐酸', ORANGE, F_BODY)
    text(draw, (205, 468), '大理石', MUTED, F_SMALL)
    for x in (260, 294, 328, 360):
        draw.ellipse([x, 455, x + 22, 474], fill='#b8bec5', outline=MUTED)
    arrow(draw, (370, 418), (370, 365), BLUE, 3)
    text(draw, (205, 532), '漏斗下端低于液面', RED, F_SMALL)
    draw.line([(380, 352), (515, 352), (515, 515), (775, 515)], fill=TEAL, width=6)
    arrow(draw, (435, 352), (490, 352), TEAL, 4)
    text(draw, (452, 320), 'CO2', TEAL, F_FORMULA, 'mm')
    gas_jar(draw, [720, 245, 900, 565], '#fbfdfd', '正放集气瓶')
    draw.line([(775, 515), (810, 515), (810, 285)], fill=TEAL, width=6)
    arrow(draw, (810, 360), (810, 305), TEAL, 4)
    for y in (310, 360, 410):
        arrow(draw, (835, y), (890, y), '#9aa8b4', 3)
    text(draw, (935, 345), '空气从瓶口排出', MUTED, F_SMALL)
    panel(draw, [925, 470, 1135, 625], '#f5fbf7', '#a9d4bc', 14, 2)
    text(draw, (1030, 500), '检验', GREEN, F_HEAD, 'mm')
    text(draw, (1030, 545), '通入澄清石灰水', MUTED, F_SMALL, 'mm')
    text(draw, (1030, 582), '石灰水变浑浊', INK, F_SMALL, 'mm')
    pill(draw, [65, 635, 540, 690], '装药品前检查气密性 · 教师指导', '#fff3dc', ORANGE, F_BODY)
    return save(image, DIAGRAM_DIR, 'carbon-dioxide-preparation')


def draw_water_electrolysis():
    image, draw = diagram_canvas('水的电解', '直流电源：负极产生氢气，正极产生氧气，体积比约 2:1')
    draw.rectangle([235, 465, 965, 625], fill=WATER, outline=BLUE, width=3)
    for x, gas_bottom, label, gas, color in [
        (390, 385, '负极 (-)', 'H2 约 2 份', BLUE),
        (710, 280, '正极 (+)', 'O2 约 1 份', RED),
    ]:
        top = 175
        draw.rectangle([x - 78, top, x + 78, 555], fill='#f8fcfd')
        draw.rectangle([x - 74, gas_bottom, x + 74, 555], fill=WATER)
        draw.line([(x - 78, 555), (x - 78, top), (x + 78, top), (x + 78, 555)], fill=color, width=4)
        draw.line([(x - 87, 555), (x + 87, 555)], fill=color, width=4)
        text(draw, (x, top + 48), gas, color, F_HEAD, 'mm')
        draw.line([(x, 550), (x, 620)], fill=color, width=6)
        text(draw, (x, 590), label, color, F_BODY, 'mm')
        for bubble_y in range(gas_bottom + 22, 515, 48):
            draw.ellipse([x - 10, bubble_y, x + 10, bubble_y + 20], outline=color, width=3)
    panel(draw, [70, 635, 1130, 710], WHITE, LINE, 12, 2)
    text(draw, (180, 672), '直流电源', INK, F_HEAD, 'mm')
    text(draw, (510, 672), '2H2O -> 2H2 + O2', TEAL, F_FORMULA, 'mm')
    text(draw, (920, 657), '少量电解质增强导电性', MUTED, F_SMALL, 'mm')
    text(draw, (920, 686), '实验由教师指导', RED, F_SMALL, 'mm')
    return save(image, DIAGRAM_DIR, 'water-electrolysis')


def draw_particle_model():
    image, draw = diagram_canvas('物质三态的微粒模型', '微粒始终运动；图中只比较排列与间隔，不代表真实大小')
    states = [
        ('固体', BLUE, '排列紧密、较有序\n在固定位置附近振动'),
        ('液体', TEAL, '排列紧密、较无序\n微粒可相互移动'),
        ('气体', ORANGE, '间隔较大\n运动范围更大'),
    ]
    for index, (name, color, note) in enumerate(states):
        x = 70 + index * 380
        panel(draw, [x, 165, x + 320, 610], WHITE, color, 18, 3)
        text(draw, (x + 160, 205), name, color, F_HEAD, 'mm')
        if index == 0:
            points = [(x + 75 + col * 58, 300 + row * 58) for row in range(4) for col in range(4)]
        elif index == 1:
            points = [(x + 68 + col * 62 + (row % 2) * 18, 315 + row * 55) for row in range(4) for col in range(4)]
        else:
            points = [(x + 65, 305), (x + 245, 285), (x + 140, 390), (x + 260, 465), (x + 75, 500), (x + 200, 555)]
        for px, py in points:
            draw.ellipse([px - 14, py - 14, px + 14, py + 14], fill=color, outline=INK, width=2)
        for line_index, line in enumerate(note.split('\n')):
            text(draw, (x + 160, 655 + line_index * 28), line, MUTED, F_SMALL, 'mm')
    return save(image, DIAGRAM_DIR, 'particle-model')


def molecule(draw, center, atoms, scale=1.0):
    cx, cy = center
    positions = {
        'H2': [(-26, 0, BLUE, 'H'), (26, 0, BLUE, 'H')],
        'O2': [(-28, 0, RED, 'O'), (28, 0, RED, 'O')],
        'H2O': [(-36, 20, BLUE, 'H'), (0, -12, RED, 'O'), (36, 20, BLUE, 'H')],
    }[atoms]
    for dx, dy, color, label in positions:
        r = 24 * scale
        draw.ellipse([cx + dx * scale - r, cy + dy * scale - r, cx + dx * scale + r, cy + dy * scale + r], fill=color, outline=INK, width=2)
        text(draw, (cx + dx * scale, cy + dy * scale), label, WHITE, font(int(18 * scale), True), 'mm')


def draw_particle_conservation():
    image, draw = diagram_canvas('化学反应中的原子守恒', '以氢气和氧气生成水为例：原子重新组合，种类和数目不变')
    panel(draw, [60, 175, 500, 570], WHITE, BLUE, 18, 3)
    panel(draw, [700, 175, 1140, 570], WHITE, GREEN, 18, 3)
    text(draw, (280, 220), '反应前', BLUE, F_HEAD, 'mm')
    text(draw, (920, 220), '反应后', GREEN, F_HEAD, 'mm')
    molecule(draw, (175, 335), 'H2', 1.0)
    molecule(draw, (365, 335), 'H2', 1.0)
    molecule(draw, (280, 470), 'O2', 1.0)
    molecule(draw, (825, 365), 'H2O', 1.0)
    molecule(draw, (1015, 365), 'H2O', 1.0)
    arrow(draw, (525, 370), (675, 370), TEAL, 7)
    text(draw, (600, 328), '点燃', ORANGE, F_BODY, 'mm')
    text(draw, (600, 420), '2H2 + O2 -> 2H2O', INK, F_FORMULA, 'mm')
    panel(draw, [175, 615, 1025, 700], '#edf7f3', '#a9d4bc', 14, 2)
    text(draw, (600, 646), '反应前后：H 原子 4 个，O 原子 2 个；分子种类发生改变。', TEAL, F_BODY, 'mm')
    return save(image, DIAGRAM_DIR, 'particle-conservation')


def draw_solubility_curve():
    image, draw = diagram_canvas('溶解度曲线', '纵轴单位：g 溶质 / 100 g 水；曲线上的点表示该温度下的饱和状态')
    ox, oy = 170, 650
    x_end, y_top = 1020, 160
    for index in range(0, 9):
        x = ox + index * 100
        draw.line([(x, oy), (x, y_top)], fill='#e4e9eb', width=1)
        text(draw, (x, oy + 28), index * 10, MUTED, F_SMALL, 'mm')
    for index in range(0, 7):
        y = oy - index * 75
        draw.line([(ox, y), (x_end, y)], fill='#e4e9eb', width=1)
        text(draw, (ox - 38, y), index * 20, MUTED, F_SMALL, 'mm')
    arrow(draw, (ox, oy), (1065, oy), INK, 3)
    arrow(draw, (ox, oy), (ox, 125), INK, 3)
    text(draw, (1080, oy + 2), '温度 / °C', INK, F_BODY, 'lm')
    text(draw, (48, 135), '溶解度', INK, F_BODY)
    text(draw, (38, 170), 'g / 100 g 水', MUTED, F_SMALL)
    curve_a = [(ox + t * 10, oy - (18 + 0.012 * t * t) * 3.75) for t in range(0, 81, 2)]
    curve_b = [(ox + t * 10, oy - (32 + 0.42 * t) * 3.75) for t in range(0, 81, 2)]
    draw.line(curve_a, fill=RED, width=6)
    draw.line(curve_b, fill=BLUE, width=6)
    text(draw, (905, 210), '物质 A', RED, F_HEAD)
    text(draw, (905, 355), '物质 B', BLUE, F_HEAD)
    point_x = ox + 40 * 10
    point_y = oy - (18 + 0.012 * 40 * 40) * 3.75
    draw.ellipse([point_x - 8, point_y - 8, point_x + 8, point_y + 8], fill=RED)
    draw.line([(point_x, point_y), (point_x, oy)], fill=ORANGE, width=2)
    draw.line([(ox, point_y), (point_x, point_y)], fill=ORANGE, width=2)
    pill(draw, [740, 605, 1120, 660], '读点：先温度，再向上找曲线', '#fff4e5', ORANGE, F_SMALL)
    return save(image, DIAGRAM_DIR, 'solubility-curve')


def draw_metal_activity():
    image, draw = diagram_canvas('常见金属活动性顺序', '由左向右活动性逐渐减弱；实验比较必须选择安全、可行的常见反应')
    metals = ['K', 'Ca', 'Na', 'Mg', 'Al', 'Zn', 'Fe', 'Sn', 'Pb', '(H)', 'Cu', 'Hg', 'Ag', 'Pt', 'Au']
    x0, y = 62, 330
    cell_w = 71
    for index, metal in enumerate(metals):
        x = x0 + index * cell_w
        color = RED if index < 5 else (ORANGE if index < 10 else BLUE)
        panel(draw, [x, y, x + 58, y + 72], WHITE, color, 10, 2)
        centered(draw, [x, y, x + 58, y + 72], metal, color, F_HEAD if len(metal) < 3 else F_BODY)
    arrow(draw, (80, 235), (1110, 235), TEAL, 5)
    text(draw, (80, 190), '活动性较强', RED, F_HEAD)
    text(draw, (1110, 190), '活动性较弱', BLUE, F_HEAD, 'rm')
    draw.line([(x0 + 9 * cell_w + 29, 415), (x0 + 9 * cell_w + 29, 525)], fill=PURPLE, width=4)
    text(draw, (x0 + 9 * cell_w + 29, 555), '氢的位置', PURPLE, F_BODY, 'mm')
    panel(draw, [95, 585, 1105, 685], '#f2f7fb', '#bdd2e5', 14, 2)
    text(draw, (600, 615), '氢前的常见金属通常能与稀盐酸或稀硫酸反应放出氢气；', INK, F_BODY, 'mm')
    text(draw, (600, 654), '金属与盐溶液能否反应还要结合金属种类、盐的可溶性和实验条件。', MUTED, F_SMALL, 'mm')
    return save(image, DIAGRAM_DIR, 'metal-activity')


def draw_corrosion_conditions():
    image, draw = diagram_canvas('铁锈蚀条件的对照实验', '只改变水或氧气条件；其他条件尽量相同')
    cases = [
        ('干燥空气', '干燥剂', False, '缺少水'),
        ('水 + 空气', '水', True, '同时有水和氧气'),
        ('煮沸水 + 油层', '隔绝氧气', False, '缺少氧气'),
    ]
    for index, (heading, liquid_label, rust, note) in enumerate(cases):
        x = 105 + index * 360
        text(draw, (x + 120, 160), heading, INK, F_HEAD, 'mm')
        draw.rounded_rectangle([x + 30, 220, x + 210, 570], radius=24, fill='#fbfdfd', outline=BLUE, width=4)
        if index == 0:
            draw.rectangle([x + 35, 480, x + 205, 565], fill='#f3ede0')
        else:
            draw.rectangle([x + 35, 400, x + 205, 565], fill=WATER)
        if index == 2:
            draw.rectangle([x + 35, 380, x + 205, 410], fill='#f3d987')
            text(draw, (x + 230, 392), '油层', ORANGE, F_SMALL)
        draw.line([(x + 80, 275), (x + 160, 500)], fill='#7b8792', width=14)
        if rust:
            for dx, dy in [(105, 340), (125, 380), (145, 430), (115, 470)]:
                draw.ellipse([x + dx - 12, dy - 10, x + dx + 12, dy + 10], fill='#a95b35')
        text(draw, (x + 120, 605), liquid_label, BLUE if index else MUTED, F_BODY, 'mm')
        pill(draw, [x + 28, 645, x + 212, 693], '生锈' if rust else '基本不锈', '#fff0e6' if rust else '#edf7f3', RED if rust else GREEN, F_SMALL)
        text(draw, (x + 245, 505), note, MUTED, F_SMALL)
    return save(image, DIAGRAM_DIR, 'corrosion-conditions')


def draw_ph_scale():
    image, draw = diagram_canvas('pH 与溶液酸碱性', '常温水溶液的定性认识；不展开对数定义')
    x0, y, cell = 120, 330, 64
    colors = ['#c83f4f', '#d9544f', '#e66b46', '#ed8742', '#f2a541', '#f2c04a', '#ead65d', '#73b86a', '#69b6a7', '#56a9bb', '#4b94c3', '#4b7fc1', '#5e68b2', '#7159a4', '#824d97']
    for value in range(15):
        x = x0 + value * cell
        draw.rectangle([x, y, x + cell, y + 82], fill=colors[value], outline=WHITE, width=2)
        centered(draw, [x, y, x + cell, y + 82], value, WHITE, F_HEAD)
    arrow(draw, (x0 + 6.5 * cell, 250), (x0, 250), RED, 4)
    arrow(draw, (x0 + 7.5 * cell, 250), (x0 + 14 * cell, 250), BLUE, 4)
    text(draw, (x0, 205), '酸性增强', RED, F_HEAD)
    text(draw, (x0 + 14 * cell, 205), '碱性增强', BLUE, F_HEAD, 'rm')
    text(draw, (x0 + 7 * cell, 455), '中性', GREEN, F_HEAD, 'mm')
    panel(draw, [110, 520, 1090, 670], WHITE, LINE, 14, 2)
    text(draw, (145, 550), '规范测量', TEAL, F_HEAD)
    text(draw, (145, 598), '用洁净玻璃棒蘸取待测液，滴在 pH 试纸上，立即与标准比色卡比较。', INK, F_BODY)
    text(draw, (145, 638), '不可把试纸直接伸入待测液，也不可先用水润湿试纸。', RED, F_SMALL)
    return save(image, DIAGRAM_DIR, 'ph-scale')


def draw_neutralization():
    image, draw = diagram_canvas('盐酸与氢氧化钠的中和', 'HCl + NaOH -> NaCl + H2O；宏观证据与方程式相互印证')
    panel(draw, [70, 175, 360, 540], WHITE, RED, 18, 3)
    panel(draw, [455, 175, 745, 540], WHITE, BLUE, 18, 3)
    panel(draw, [840, 175, 1130, 540], WHITE, GREEN, 18, 3)
    text(draw, (215, 220), '盐酸', RED, F_HEAD, 'mm')
    text(draw, (600, 220), '氢氧化钠', BLUE, F_HEAD, 'mm')
    text(draw, (985, 220), '恰好反应后', GREEN, F_HEAD, 'mm')
    for cx, cy, label, color in [(170, 335, 'H', RED), (265, 410, 'Cl', PURPLE), (555, 335, 'Na', BLUE), (650, 410, 'OH', TEAL)]:
        draw.ellipse([cx - 36, cy - 36, cx + 36, cy + 36], fill=color, outline=INK, width=2)
        text(draw, (cx, cy), label, WHITE, F_BODY, 'mm')
    for cx, cy, label, color in [(935, 330, 'NaCl', BLUE), (1035, 415, 'H2O', TEAL)]:
        draw.ellipse([cx - 52, cy - 38, cx + 52, cy + 38], fill=color, outline=INK, width=2)
        text(draw, (cx, cy), label, WHITE, F_BODY, 'mm')
    arrow(draw, (365, 355), (445, 355), ORANGE, 5)
    arrow(draw, (750, 355), (830, 355), ORANGE, 5)
    text(draw, (600, 590), '酸 + 碱  ->  盐 + 水', INK, F_FORMULA, 'mm')
    text(draw, (600, 638), '指示剂颜色变化或 pH 变化可帮助判断反应进程；操作由教师指导。', MUTED, F_SMALL, 'mm')
    return save(image, DIAGRAM_DIR, 'acid-base-neutralization')


def draw_ion_test_evidence():
    image, draw = diagram_canvas('常见离子检验的证据链', '先分样、排除干扰，再选择可溶试剂；白色沉淀不是脱离条件的唯一结论')
    branches = [
        ('检验 Cl-', '稀硝酸酸化', '加入 AgNO3 溶液', '白色沉淀', RED),
        ('检验 SO4^2-', '稀盐酸酸化', '加入 BaCl2 溶液', '白色沉淀', BLUE),
        ('检验 CO3^2-', '加入稀盐酸', '气体通入石灰水', '石灰水浑浊', GREEN),
    ]
    panel(draw, [430, 140, 770, 220], '#edf7f3', '#a9d4bc', 14, 2)
    centered(draw, [430, 140, 770, 220], '待测液分成三份', TEAL, F_HEAD)
    for index, (heading, step1, step2, evidence, color) in enumerate(branches):
        x = 55 + index * 385
        arrow(draw, (600, 220), (x + 165, 285), color, 4)
        panel(draw, [x, 290, x + 330, 650], WHITE, color, 16, 3)
        text(draw, (x + 165, 330), heading, color, F_HEAD, 'mm')
        pill(draw, [x + 35, 385, x + 295, 435], step1, '#f6f8fa', color, F_SMALL)
        arrow(draw, (x + 165, 442), (x + 165, 485), color, 3)
        pill(draw, [x + 35, 495, x + 295, 545], step2, '#f6f8fa', color, F_SMALL)
        arrow(draw, (x + 165, 552), (x + 165, 592), color, 3)
        text(draw, (x + 165, 620), evidence, INK, F_BODY, 'mm')
    text(draw, (600, 700), '同一现象可能有多种来源，必须结合试剂、预处理和对照排除干扰。', RED, F_SMALL, 'mm')
    return save(image, DIAGRAM_DIR, 'ion-test-evidence')


def draw_material_lifecycle():
    image, draw = diagram_canvas('材料全生命周期', '需求—设计—评价—改进贯穿原料、制造、使用、回收与安全处置')
    nodes = [
        (600, 175, '需求与设计', BLUE),
        (900, 310, '制造与运输', ORANGE),
        (820, 560, '使用与维护', PURPLE),
        (380, 610, '分类回收', GREEN),
        (210, 350, '原料与资源', TEAL),
    ]
    for index, (x, y, label, color) in enumerate(nodes):
        nx, ny, _, _ = nodes[(index + 1) % len(nodes)]
        dx, dy = nx - x, ny - y
        length = math.hypot(dx, dy)
        start = (x + dx / length * 95, y + dy / length * 45)
        end = (nx - dx / length * 95, ny - dy / length * 45)
        arrow(draw, start, end, '#7d9990', 5)
    for x, y, label, color in nodes:
        panel(draw, [x - 120, y - 52, x + 120, y + 52], WHITE, color, 18, 3)
        centered(draw, [x - 120, y - 52, x + 120, y + 52], label, color, F_HEAD)
    panel(draw, [465, 330, 735, 485], '#edf7f3', '#9ccab7', 18, 3)
    centered(draw, [465, 350, 735, 395], '评价与改进', TEAL, F_HEAD)
    text(draw, (600, 430), '性能 · 安全 · 成本', MUTED, F_SMALL, 'mm')
    text(draw, (600, 460), '资源 · 环境 · 法规', MUTED, F_SMALL, 'mm')
    text(draw, (600, 710), '无法再利用的材料进入合规、安全处置，不随意焚烧或丢弃。', RED, F_SMALL, 'mm')
    return save(image, DIAGRAM_DIR, 'material-lifecycle')


def template_steps(name, title, subtitle, steps, colors=None):
    image, draw = template_canvas(title, subtitle)
    colors = colors or [BLUE, TEAL, ORANGE, GREEN]
    count = len(steps)
    gap = 18
    left = 38
    width = (TW - left * 2 - gap * (count - 1)) / count
    for index, (heading, body) in enumerate(steps):
        x = left + index * (width + gap)
        color = colors[index % len(colors)]
        panel(draw, [x, 155, x + width, 455], WHITE, color, 14, 2)
        draw.ellipse([x + width / 2 - 24, 180, x + width / 2 + 24, 228], fill=color)
        centered(draw, [x + width / 2 - 24, 180, x + width / 2 + 24, 228], index + 1, WHITE, T_HEAD)
        text(draw, (x + width / 2, 270), heading, color, T_HEAD, 'mm')
        lines = body.split('\n')
        for line_index, line in enumerate(lines):
            text(draw, (x + width / 2, 325 + line_index * 31), line, MUTED, T_BODY, 'mm')
        if index < count - 1:
            arrow(draw, (x + width + 3, 305), (x + width + gap - 3, 305), TEAL, 3)
    pill(draw, [140, 505, 820, 555], name, '#edf7f3', TEAL, T_BODY)
    return image


def draw_template_observation():
    image = template_steps('事实与解释分开写', '实验现象观察与规范描述', '按时间顺序建立可复核证据', [
        ('反应前', '颜色·状态\n装置条件'),
        ('反应中', '气泡·沉淀\n发光·变色'),
        ('反应后', '剩余物\n最终状态'),
        ('解释', '对照检验\n说明边界'),
    ])
    return save(image, TEMPLATE_DIR, 'chem-tpl-observation')


def draw_template_instrument():
    image, draw = template_canvas('仪器选择、量取与读数', '量筒放平，视线与凹液面最低处相平')
    draw.rounded_rectangle([120, 140, 360, 510], radius=18, fill=WHITE, outline=BLUE, width=4)
    for y in range(180, 485, 32):
        draw.line([(315, y), (350, y)], fill=MUTED, width=2)
    draw.rectangle([125, 330, 355, 505], fill=WATER)
    draw.arc([125, 310, 355, 355], 0, 180, fill=BLUE, width=4)
    draw.line([(50, 334), (460, 334)], fill=RED, width=3)
    arrow(draw, (65, 334), (115, 334), RED, 3)
    text(draw, (90, 300), '视线', RED, T_HEAD, 'mm')
    text(draw, (240, 545), '凹液面最低处', BLUE, T_HEAD, 'mm')
    steps = [('量程', '覆盖待测值'), ('分度值', '决定精度'), ('视线', '保持水平'), ('记录', '数值 + 单位')]
    for index, (heading, body) in enumerate(steps):
        y = 145 + index * 100
        pill(draw, [535, y, 680, y + 50], heading, '#edf7f3', TEAL, T_HEAD)
        text(draw, (715, y + 25), body, MUTED, T_BODY, 'lm')
    return save(image, TEMPLATE_DIR, 'chem-tpl-instrument-reading')


def draw_template_gas_apparatus():
    image = template_steps('选择理由来自反应条件', '气体发生装置选择', '先看状态与条件，再看控速需求', [
        ('反应物', '固体 / 液体'),
        ('条件', '常温 / 加热'),
        ('控速', '能否分次加液'),
        ('装配', '密闭导气\n先检气密性'),
    ])
    return save(image, TEMPLATE_DIR, 'chem-tpl-gas-apparatus')


def draw_template_gas_collection():
    image = template_steps('检验在瓶内，验满在瓶口', '气体收集、检验与验满', '溶解性、密度和特征反应共同决定方法', [
        ('水中性质', '难溶且不反应\n可用排水法'),
        ('空气密度', '向上或向下\n排空气'),
        ('检验', '少量气体\n特征现象'),
        ('验满', '瓶口操作\n位置不同'),
    ])
    return save(image, TEMPLATE_DIR, 'chem-tpl-gas-collection-test')


def draw_template_valence():
    image, draw = template_canvas('根据化合价书写化学式', '正负化合价代数和为零，下标取最简整数比')
    panel(draw, [85, 150, 300, 410], WHITE, BLUE, 16, 3)
    panel(draw, [365, 150, 580, 410], WHITE, RED, 16, 3)
    text(draw, (192, 225), 'Al', BLUE, font(55, True), 'mm')
    text(draw, (472, 225), 'O', RED, font(55, True), 'mm')
    text(draw, (192, 310), '+3', BLUE, T_TITLE, 'mm')
    text(draw, (472, 310), '-2', RED, T_TITLE, 'mm')
    arrow(draw, (610, 280), (720, 280), TEAL, 5)
    panel(draw, [745, 180, 885, 375], '#edf7f3', TEAL, 16, 3)
    text(draw, (815, 245), 'Al2O3', TEAL, T_TITLE, 'mm')
    text(draw, (815, 315), '2×3 = 3×2', MUTED, T_BODY, 'mm')
    pill(draw, [180, 475, 780, 530], '核对：2×(+3) + 3×(-2) = 0', '#fff4e5', ORANGE, T_HEAD)
    return save(image, TEMPLATE_DIR, 'chem-tpl-valence-formula')


def draw_template_balancing():
    image, draw = template_canvas('化学方程式书写与配平', '只改化学计量数，不改化学式下标')
    equations = [
        ('写式', 'Mg + O2 -> MgO'),
        ('配平', '2Mg + O2 -> 2MgO'),
        ('条件', '点燃'),
        ('核对', 'Mg: 2=2  O: 2=2'),
    ]
    for index, (heading, equation) in enumerate(equations):
        y = 125 + index * 105
        pill(draw, [70, y, 205, y + 55], heading, '#edf7f3', TEAL, T_HEAD)
        panel(draw, [235, y - 5, 875, y + 65], WHITE, LINE, 12, 2)
        text(draw, (555, y + 29), equation, INK if index != 1 else BLUE, T_HEAD, 'mm')
        if index < 3:
            arrow(draw, (555, y + 70), (555, y + 95), ORANGE, 3)
    return save(image, TEMPLATE_DIR, 'chem-tpl-equation-balancing')


def draw_template_mass_conservation():
    image, draw = template_canvas('质量守恒的微观解释', '先确定体系边界，再核对每种原子')
    panel(draw, [55, 145, 390, 430], WHITE, BLUE, 16, 3)
    panel(draw, [570, 145, 905, 430], WHITE, GREEN, 16, 3)
    text(draw, (222, 185), '反应前', BLUE, T_HEAD, 'mm')
    text(draw, (737, 185), '反应后', GREEN, T_HEAD, 'mm')
    for x, y, color in [(130, 280, BLUE), (210, 330, BLUE), (295, 270, RED), (650, 285, BLUE), (730, 330, RED), (815, 275, BLUE)]:
        draw.ellipse([x - 24, y - 24, x + 24, y + 24], fill=color, outline=INK, width=2)
    arrow(draw, (420, 290), (540, 290), TEAL, 5)
    text(draw, (480, 245), '重组', ORANGE, T_HEAD, 'mm')
    pill(draw, [145, 475, 815, 530], '原子种类不变 · 原子数目不变 · 总质量不变', '#edf7f3', TEAL, T_HEAD)
    return save(image, TEMPLATE_DIR, 'chem-tpl-mass-conservation')


def draw_template_stoichiometry():
    image = template_steps('最后检查单位与数量级', '化学方程式计算', '使用已配平方程式建立单步质量比例', [
        ('方程式', '写正确\n并配平'),
        ('质量关系', '计量数 ×\n相对质量'),
        ('列比例', '已知量\n对应未知量'),
        ('求解', '数值 + 单位\n检验合理性'),
    ])
    return save(image, TEMPLATE_DIR, 'chem-tpl-stoichiometry')


def draw_template_solubility():
    image, draw = template_canvas('溶解度曲线读取与结晶判断', '横轴温度，纵轴 g 溶质 / 100 g 水')
    ox, oy = 125, 495
    arrow(draw, (ox, oy), (590, oy), INK, 3)
    arrow(draw, (ox, oy), (ox, 130), INK, 3)
    points = [(125 + x, 455 - 0.0012 * x * x) for x in range(0, 430, 6)]
    draw.line(points, fill=BLUE, width=5)
    draw.ellipse([380, 310, 394, 324], fill=RED)
    draw.line([(387, 317), (387, oy)], fill=ORANGE, width=2)
    text(draw, (360, 525), '温度 / °C', MUTED, T_BODY)
    text(draw, (38, 120), '溶解度', MUTED, T_BODY)
    steps = [('定温度', '从横轴出发'), ('找曲线', '垂直向上'), ('读数值', '水平向左'), ('判状态', '曲线上为饱和')]
    for index, (heading, body) in enumerate(steps):
        y = 130 + index * 92
        pill(draw, [650, y, 780, y + 47], heading, '#edf7f3', TEAL, T_BODY)
        text(draw, (810, y + 23), body, MUTED, T_BODY, 'lm')
    return save(image, TEMPLATE_DIR, 'chem-tpl-solubility-curve')


def draw_template_mass_fraction():
    image, draw = template_canvas('溶质质量分数计算', '溶液质量 = 溶质质量 + 溶剂质量')
    draw.rectangle([95, 195, 845, 295], fill='#dceef8', outline=BLUE, width=3)
    draw.rectangle([95, 195, 320, 295], fill=ORANGE, outline=ORANGE, width=3)
    centered(draw, [95, 195, 320, 295], '溶质', WHITE, T_HEAD)
    centered(draw, [320, 195, 845, 295], '溶剂', BLUE, T_HEAD)
    text(draw, (470, 365), '溶质质量分数', TEAL, T_HEAD, 'mm')
    text(draw, (470, 420), '= 溶质质量 / 溶液质量 × 100%', INK, T_TITLE, 'mm')
    pill(draw, [165, 500, 795, 552], '分母是溶液总质量，不是溶剂质量', '#fff3dc', ORANGE, T_HEAD)
    return save(image, TEMPLATE_DIR, 'chem-tpl-mass-fraction')


def draw_template_solution_preparation():
    image = template_steps('转移时不得洒失溶质或溶液', '一定溶质质量分数溶液的配制', '计算、称量、量取、溶解、装瓶贴签', [
        ('计算', '溶质质量\n水的体积'),
        ('称量量取', '天平称固体\n量筒量水'),
        ('溶解', '烧杯搅拌\n完全溶解'),
        ('装瓶', '写名称\n写质量分数'),
    ])
    return save(image, TEMPLATE_DIR, 'chem-tpl-solution-preparation')


def draw_template_experiment_design():
    image = template_steps('结论只在证据范围内成立', '变量控制与实验方案设计', '问题、变量、证据与结论形成闭环', [
        ('问题', '明确研究对象\n提出假设'),
        ('变量', '单一自变量\n控制其他条件'),
        ('证据', '观察记录\n设置对照'),
        ('评价', '解释结论\n误差与改进'),
    ])
    return save(image, TEMPLATE_DIR, 'chem-tpl-experiment-design')


def main():
    diagram_generators = {
        'laboratory-observation-cycle': draw_laboratory_cycle,
        'oxygen-preparation': draw_oxygen_preparation,
        'carbon-dioxide-preparation': draw_carbon_dioxide_preparation,
        'water-electrolysis': draw_water_electrolysis,
        'particle-model': draw_particle_model,
        'particle-conservation': draw_particle_conservation,
        'solubility-curve': draw_solubility_curve,
        'metal-activity': draw_metal_activity,
        'corrosion-conditions': draw_corrosion_conditions,
        'ph-scale': draw_ph_scale,
        'acid-base-neutralization': draw_neutralization,
        'ion-test-evidence': draw_ion_test_evidence,
        'material-lifecycle': draw_material_lifecycle,
    }
    template_generators = {
        'chem-tpl-observation': draw_template_observation,
        'chem-tpl-instrument-reading': draw_template_instrument,
        'chem-tpl-gas-apparatus': draw_template_gas_apparatus,
        'chem-tpl-gas-collection-test': draw_template_gas_collection,
        'chem-tpl-valence-formula': draw_template_valence,
        'chem-tpl-equation-balancing': draw_template_balancing,
        'chem-tpl-mass-conservation': draw_template_mass_conservation,
        'chem-tpl-stoichiometry': draw_template_stoichiometry,
        'chem-tpl-solubility-curve': draw_template_solubility,
        'chem-tpl-mass-fraction': draw_template_mass_fraction,
        'chem-tpl-solution-preparation': draw_template_solution_preparation,
        'chem-tpl-experiment-design': draw_template_experiment_design,
    }
    requested = set(sys.argv[1:])
    available = set(diagram_generators) | set(template_generators)
    unknown = requested - available
    if unknown:
        raise SystemExit(f"unknown chemistry asset target(s): {', '.join(sorted(unknown))}")

    diagram_outputs = [
        generate() for name, generate in diagram_generators.items()
        if not requested or name in requested
    ]
    template_outputs = [
        generate() for name, generate in template_generators.items()
        if not requested or name in requested
    ]
    print(f'generated {len(diagram_outputs)} chemistry diagrams at {DW}x{DH}')
    print(f'generated {len(template_outputs)} chemistry template figures at {TW}x{TH}')


if __name__ == '__main__':
    main()
