import json
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


WIDTH = 1280
HEIGHT = 900
ROOT = Path(__file__).resolve().parents[1]
FONT_CJK = '/System/Library/Fonts/STHeiti Medium.ttc'
FONT_LATIN = '/System/Library/Fonts/Supplemental/Arial.ttf'
FONT_LATIN_BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
OUTPUT_ROOT = ROOT / 'assets/figures/generated/subjects/physics/knowledge'

PALETTES = [
    ('#c34f27', '#fff6f1', '#213047'),
    ('#26708f', '#f1f8fb', '#1d3441'),
    ('#39724c', '#f1f8f3', '#243a2b'),
    ('#a45a2a', '#fff7ed', '#3d2e24'),
    ('#4f6695', '#f3f6fc', '#26334d'),
    ('#77559a', '#f7f3fb', '#382b46'),
]


def font(size, latin=False, bold=False):
    path = FONT_LATIN_BOLD if latin and bold else FONT_LATIN if latin else FONT_CJK
    return ImageFont.truetype(path, size)


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def arrow(draw, start, end, fill, width=7, head=18):
    draw.line([start, end], fill=fill, width=width)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    left = (end[0] - head * math.cos(angle - math.pi / 6), end[1] - head * math.sin(angle - math.pi / 6))
    right = (end[0] - head * math.cos(angle + math.pi / 6), end[1] - head * math.sin(angle + math.pi / 6))
    draw.polygon([end, left, right], fill=fill)


def center_text(draw, box, value, text_font, fill):
    x1, y1, x2, y2 = box
    bounds = draw.textbbox((0, 0), value, font=text_font)
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    draw.text(((x1 + x2 - width) / 2, (y1 + y2 - height) / 2 - bounds[1]), value, font=text_font, fill=fill)


def center_wrapped_text(draw, box, value, fill, max_size=28, min_size=19, max_lines=3):
    x1, y1, x2, y2 = box
    latin = all(ord(char) < 128 for char in str(value))
    for size in range(max_size, min_size - 1, -1):
        text_font = font(size, latin=latin, bold=True)
        wrapped = wrap_text(draw, value, text_font, x2 - x1 - 28, max_lines)
        bounds = draw.multiline_textbbox((0, 0), wrapped, font=text_font, spacing=6, align='center')
        width = bounds[2] - bounds[0]
        height = bounds[3] - bounds[1]
        if width <= x2 - x1 - 24 and height <= y2 - y1 - 20:
            draw.multiline_text(
                ((x1 + x2 - width) / 2, (y1 + y2 - height) / 2 - bounds[1]),
                wrapped,
                font=text_font,
                fill=fill,
                spacing=6,
                align='center',
            )
            return


def wrap_text(draw, value, text_font, max_width, max_lines=3):
    lines = []
    current = ''
    for char in str(value):
        candidate = current + char
        if current and draw.textlength(candidate, font=text_font) > max_width:
            lines.append(current)
            current = char
            if len(lines) == max_lines:
                break
        else:
            current = candidate
    if len(lines) < max_lines and current:
        lines.append(current)
    consumed = sum(len(line) for line in lines)
    if consumed < len(str(value)) and lines:
        lines[-1] = lines[-1][:-1] + '…'
    return '\n'.join(lines)


def axes(draw, origin, x_end, y_end, color):
    arrow(draw, origin, x_end, color, 5, 14)
    arrow(draw, origin, y_end, color, 5, 14)


def circuit_battery(draw, x, y, accent):
    draw.line((x, y - 35, x, y + 35), fill=accent, width=7)
    draw.line((x + 28, y - 52, x + 28, y + 52), fill=accent, width=7)


def circuit_resistor(draw, x1, y, x2, color):
    span = (x2 - x1) / 6
    points = [(x1, y)]
    for index in range(1, 6):
        points.append((x1 + span * index, y + (-30 if index % 2 else 30)))
    points.append((x2, y))
    draw.line(points, fill=color, width=7)


def draw_motif(draw, chapter_number, panel, accent, ink, variant):
    x1, y1, x2, y2 = panel
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2
    soft = '#e8eef4'
    warm = '#f4d9c9'

    if chapter_number == 1:
        origin = (x1 + 90, y2 - 90)
        axes(draw, origin, (x2 - 60, origin[1]), (origin[0], y1 + 60), ink)
        points = [(origin[0], origin[1]), (origin[0] + 140, origin[1] - 150), (origin[0] + 280, origin[1] - 150), (origin[0] + 430, origin[1] - 360)]
        draw.line(points, fill=accent, width=10, joint='curve')
        draw.text((x2 - 90, origin[1] + 15), 't', font=font(28, True, True), fill=ink)
        draw.text((origin[0] - 36, y1 + 45), 's', font=font(28, True, True), fill=ink)
    elif chapter_number == 2:
        y = cy
        points = []
        for x in range(x1 + 55, x2 - 45, 5):
            points.append((x, y + int(85 * math.sin((x - x1) / (42 + variant * 2)))))
        draw.line(points, fill=accent, width=9)
        arrow(draw, (x1 + 90, y2 - 110), (x2 - 90, y2 - 110), ink, 5, 14)
        draw.text((x1 + 70, y1 + 70), '振动', font=font(30), fill=ink)
        draw.text((x2 - 140, y1 + 70), '传播', font=font(30), fill=ink)
    elif chapter_number == 3:
        boxes = [(x1 + 55, cy - 70, x1 + 210, cy + 70), (cx - 78, cy - 70, cx + 78, cy + 70), (x2 - 210, cy - 70, x2 - 55, cy + 70)]
        for box, label, color in zip(boxes, ['固态', '液态', '气态'], ['#d9e8f6', '#d9efe8', '#f7e0cf']):
            rounded(draw, box, 22, color, accent, 4)
            center_text(draw, box, label, font(31), ink)
        arrow(draw, (boxes[0][2] + 14, cy - 25), (boxes[1][0] - 14, cy - 25), accent)
        arrow(draw, (boxes[1][2] + 14, cy - 25), (boxes[2][0] - 14, cy - 25), accent)
        arrow(draw, (boxes[2][0] - 14, cy + 35), (boxes[1][2] + 14, cy + 35), ink)
        arrow(draw, (boxes[1][0] - 14, cy + 35), (boxes[0][2] + 14, cy + 35), ink)
    elif chapter_number == 4:
        mirror_x = cx
        draw.line((mirror_x, y1 + 45, mirror_x, y2 - 45), fill=ink, width=10)
        draw.line((x1 + 70, cy, x2 - 70, cy), fill='#8b98aa', width=4)
        hit = (mirror_x, cy)
        arrow(draw, (x1 + 105, y1 + 85), hit, accent, 8)
        arrow(draw, hit, (x1 + 105, y2 - 85), '#26708f', 8)
        draw.arc((mirror_x - 120, cy - 120, mirror_x + 120, cy + 120), 145, 215, fill=accent, width=5)
    elif chapter_number == 5:
        draw.arc((cx - 65, y1 + 60, cx + 65, y2 - 60), 90, 270, fill=accent, width=9)
        draw.arc((cx - 65, y1 + 60, cx + 65, y2 - 60), -90, 90, fill=accent, width=9)
        draw.line((x1 + 55, cy, x2 - 55, cy), fill=ink, width=4)
        for fx in (cx - 145, cx + 145):
            draw.ellipse((fx - 8, cy - 8, fx + 8, cy + 8), fill=ink)
            draw.text((fx - 9, cy + 18), 'F', font=font(21, True, True), fill=ink)
        arrow(draw, (x1 + 75, cy - 150), (cx, cy - 150), accent, 7)
        arrow(draw, (cx, cy - 150), (x2 - 75, cy), accent, 7)
    elif chapter_number == 6:
        draw.line((x1 + 95, y1 + 170, cx - 20, y1 + 170), fill=ink, width=8)
        draw.polygon([(x1 + 170, y1 + 170), (x1 + 140, y1 + 220), (x1 + 200, y1 + 220)], fill=accent)
        draw.rectangle((x1 + 235, y1 + 105, x1 + 330, y1 + 170), fill=warm, outline=accent, width=4)
        cylinder = (cx + 65, y1 + 95, x2 - 75, y2 - 80)
        draw.rectangle(cylinder, outline=ink, width=7)
        water_y = cy + 40
        draw.rectangle((cylinder[0] + 7, water_y, cylinder[2] - 7, cylinder[3] - 7), fill='#cfeaf3')
        draw.rectangle((cx + 170, water_y - 105, cx + 265, water_y + 25), fill=accent)
    elif chapter_number in (7, 8):
        block = (cx - 105, cy - 75, cx + 105, cy + 75)
        rounded(draw, block, 15, soft, ink, 5)
        arrow(draw, (cx, cy - 75), (cx, y1 + 55), accent, 8)
        arrow(draw, (cx, cy + 75), (cx, y2 - 55), '#26708f', 8)
        arrow(draw, (cx + 105, cy), (x2 - 55, cy), '#39724c', 8)
        if chapter_number == 8:
            arrow(draw, (cx - 105, cy), (x1 + 55, cy), '#a45a2a', 8)
        draw.line((x1 + 50, cy + 90, x2 - 50, cy + 90), fill=ink, width=6)
    elif chapter_number == 9:
        vessel = (x1 + 120, y1 + 80, x2 - 120, y2 - 80)
        draw.line((vessel[0], vessel[1], vessel[0], vessel[3], vessel[2], vessel[3], vessel[2], vessel[1]), fill=ink, width=8)
        water_y = y1 + 210
        draw.rectangle((vessel[0] + 8, water_y, vessel[2] - 8, vessel[3] - 8), fill='#cfeaf3')
        for y, length in [(water_y + 55, 70), (water_y + 145, 105), (water_y + 235, 140)]:
            arrow(draw, (vessel[0] + 20, y), (vessel[0] + 20 + length, y), accent, 6, 14)
    elif chapter_number == 10:
        water_y = cy - 10
        draw.rectangle((x1 + 55, water_y, x2 - 55, y2 - 55), fill='#cfeaf3')
        block = (cx - 95, water_y - 55, cx + 95, water_y + 100)
        draw.rectangle(block, fill='#f3d5a9', outline=ink, width=5)
        arrow(draw, (cx, water_y + 90), (cx, y1 + 65), accent, 9)
        arrow(draw, (cx, water_y - 45), (cx, y2 - 75), '#26708f', 9)
        draw.text((cx + 18, y1 + 75), 'F浮', font=font(27), fill=accent)
        draw.text((cx + 18, y2 - 115), 'G', font=font(27, True, True), fill='#26708f')
    elif chapter_number == 11:
        draw.arc((x1 + 55, y1 + 100, x2 - 55, y2 + 220), 180, 360, fill=ink, width=9)
        ball_x = x1 + 150 + variant * 35
        ball_y = y1 + 210 - variant * 18
        draw.ellipse((ball_x - 35, ball_y - 35, ball_x + 35, ball_y + 35), fill=accent)
        arrow(draw, (ball_x + 55, ball_y), (cx + 130, cy + 110), accent, 7)
        draw.text((x1 + 80, y2 - 100), '势能', font=font(28), fill=ink)
        draw.text((x2 - 155, y2 - 100), '动能', font=font(28), fill=ink)
    elif chapter_number == 12:
        pivot = (cx, cy + 85)
        draw.polygon([(pivot[0], pivot[1] - 8), (pivot[0] - 48, pivot[1] + 75), (pivot[0] + 48, pivot[1] + 75)], fill=accent)
        draw.line((x1 + 75, cy + 25, x2 - 75, cy - 70), fill=ink, width=12)
        arrow(draw, (x1 + 150, cy - 5), (x1 + 150, y2 - 70), '#26708f', 8)
        arrow(draw, (x2 - 150, cy - 45), (x2 - 150, y1 + 70), accent, 8)
        draw.ellipse((pivot[0] - 10, pivot[1] - 10, pivot[0] + 10, pivot[1] + 10), fill=ink)
    elif chapter_number == 13:
        positions = [(x1 + 120 + (i % 4) * 135, y1 + 120 + (i // 4) * 145) for i in range(12)]
        for index, (x, y) in enumerate(positions):
            radius = 22 + (index + variant) % 8
            draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=accent if index % 2 else '#6aa6bd')
            arrow(draw, (x, y), (x + 30 - (index % 3) * 15, y - 35 + (index % 2) * 70), ink, 4, 9)
        draw.text((x1 + 85, y2 - 85), '温度升高 → 热运动更剧烈', font=font(27), fill=ink)
    elif chapter_number == 14:
        chamber = (cx - 150, y1 + 70, cx + 150, y2 - 70)
        draw.rectangle(chamber, outline=ink, width=9)
        piston_y = cy - 70 + variant * 20
        draw.rectangle((cx - 135, piston_y, cx + 135, piston_y + 35), fill=accent)
        draw.line((cx, y1 + 25, cx, piston_y), fill=ink, width=12)
        arrow(draw, (cx + 210, cy), (cx + 210, y1 + 85), accent, 8)
        for offset in (-70, 0, 70):
            draw.line((cx + offset, y2 - 95, cx + offset - 18, y2 - 145, cx + offset + 18, y2 - 190), fill='#d97b28', width=7)
    elif chapter_number in (15, 16, 17, 18):
        left, right, top, bottom = x1 + 70, x2 - 70, y1 + 95, y2 - 95
        resistor_left, resistor_right = right - 240, right - 90
        battery_x = left + 90
        series_half = 48 if chapter_number in (15, 17) else 58 if chapter_number == 18 else 0
        draw.line((left, top, battery_x, top), fill=ink, width=7)
        if series_half:
            draw.line((battery_x + 28, top, cx - series_half, top), fill=ink, width=7)
            draw.line((cx + series_half, top, right, top), fill=ink, width=7)
        else:
            draw.line((battery_x + 28, top, right, top), fill=ink, width=7)
        draw.line((right, top, right, bottom, resistor_right, bottom), fill=ink, width=7)
        draw.line((resistor_left, bottom, left, bottom, left, top), fill=ink, width=7)
        circuit_battery(draw, battery_x, top, accent)
        circuit_resistor(draw, resistor_left, bottom, resistor_right, accent)
        if chapter_number == 15:
            draw.ellipse((cx - 48, top - 48, cx + 48, top + 48), outline=accent, width=7)
            center_text(draw, (cx - 48, top - 48, cx + 48, top + 48), 'A', font(34, True, True), accent)
        elif chapter_number == 16:
            meter_x, meter_y = (resistor_left + resistor_right) // 2, bottom - 125
            draw.line((resistor_left, bottom, resistor_left, meter_y, meter_x - 48, meter_y), fill='#26708f', width=6)
            draw.line((resistor_right, bottom, resistor_right, meter_y, meter_x + 48, meter_y), fill='#26708f', width=6)
            draw.ellipse((meter_x - 48, meter_y - 48, meter_x + 48, meter_y + 48), outline='#26708f', width=7)
            center_text(draw, (meter_x - 48, meter_y - 48, meter_x + 48, meter_y + 48), 'V', font(34, True, True), '#26708f')
        elif chapter_number == 17:
            draw.ellipse((cx - 48, top - 48, cx + 48, top + 48), outline=accent, width=7)
            center_text(draw, (cx - 48, top - 48, cx + 48, top + 48), 'A', font(34, True, True), accent)
            meter_x, meter_y = (resistor_left + resistor_right) // 2, bottom - 125
            draw.line((resistor_left, bottom, resistor_left, meter_y, meter_x - 48, meter_y), fill='#26708f', width=6)
            draw.line((resistor_right, bottom, resistor_right, meter_y, meter_x + 48, meter_y), fill='#26708f', width=6)
            draw.ellipse((meter_x - 48, meter_y - 48, meter_x + 48, meter_y + 48), outline='#26708f', width=7)
            center_text(draw, (meter_x - 48, meter_y - 48, meter_x + 48, meter_y + 48), 'V', font(34, True, True), '#26708f')
        else:
            draw.ellipse((cx - 58, top - 58, cx + 58, top + 58), outline='#d5a321', width=8)
            draw.line((cx - 25, top - 20, cx + 25, top + 20), fill='#d5a321', width=6)
            draw.line((cx - 25, top + 20, cx + 25, top - 20), fill='#d5a321', width=6)
    elif chapter_number == 19:
        y_live, y_neutral = cy - 100, cy + 100
        draw.line((x1 + 70, y_live, x2 - 70, y_live), fill='#c0392b', width=8)
        draw.line((x1 + 70, y_neutral, x2 - 70, y_neutral), fill='#26708f', width=8)
        draw.text((x1 + 75, y_live - 50), 'L', font=font(28, True, True), fill='#c0392b')
        draw.text((x1 + 75, y_neutral + 15), 'N', font=font(28, True, True), fill='#26708f')
        rounded(draw, (cx - 80, y_live - 45, cx + 80, y_live + 45), 12, '#fff', ink, 5)
        draw.line((cx + 180, y_live, cx + 180, y_neutral), fill=ink, width=7)
        draw.ellipse((cx + 135, cy - 45, cx + 225, cy + 45), outline=accent, width=7)
    elif chapter_number == 20:
        if variant == 1:
            for radius in (70, 125, 180):
                draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=accent, width=6)
                arrow(draw, (cx + radius - 20, cy - 20), (cx + radius, cy), accent, 4, 10)
            draw.ellipse((cx - 36, cy - 36, cx + 36, cy + 36), outline=ink, width=6)
            draw.ellipse((cx - 9, cy - 9, cx + 9, cy + 9), fill=ink)
            draw.text((cx + 52, cy - 34), 'I', font=font(30, True, True), fill=ink)
        elif variant == 2:
            draw.rectangle((cx - 175, cy - 45, cx + 175, cy + 45), fill='#b8c2cb', outline=ink, width=5)
            for offset in range(-135, 136, 45):
                draw.arc((cx + offset - 35, cy - 95, cx + offset + 35, cy + 95), 90, 270, fill=accent, width=8)
            circuit_battery(draw, x1 + 115, cy, accent)
            draw.line((x1 + 143, cy - 52, x1 + 143, y1 + 75, cx - 170, y1 + 75, cx - 170, cy - 95), fill=ink, width=6)
            draw.line((x1 + 115, cy + 35, x1 + 115, y2 - 75, cx + 170, y2 - 75, cx + 170, cy + 95), fill=ink, width=6)
        else:
            magnet_left = (x1 + 55, cy - 115, x1 + 210, cy + 115)
            magnet_right = (x2 - 210, cy - 115, x2 - 55, cy + 115)
            draw.rectangle(magnet_left, fill='#d85a4f')
            draw.rectangle(magnet_right, fill='#4f79b8')
            center_text(draw, magnet_left, 'N', font(58, True, True), '#fff')
            center_text(draw, magnet_right, 'S', font(58, True, True), '#fff')
            for field_y in (cy - 75, cy, cy + 75):
                arrow(draw, (magnet_left[2] + 18, field_y), (magnet_right[0] - 18, field_y), accent, 5, 13)
            if variant >= 3:
                draw.ellipse((cx - 34, cy - 34, cx + 34, cy + 34), fill='#fff', outline=ink, width=6)
                if variant == 3:
                    draw.ellipse((cx - 9, cy - 9, cx + 9, cy + 9), fill=ink)
                    arrow(draw, (cx + 78, cy + 130), (cx + 78, cy - 105), ink, 7)
                    draw.text((cx + 96, cy - 120), 'F', font=font(29, True, True), fill=ink)
                else:
                    draw.line((cx - 13, cy - 13, cx + 13, cy + 13), fill=ink, width=6)
                    draw.line((cx - 13, cy + 13, cx + 13, cy - 13), fill=ink, width=6)
                    arrow(draw, (cx + 55, cy + 140), (cx + 55, cy - 115), ink, 7)
                    draw.text((cx + 73, cy - 128), 'v', font=font(29, True, True), fill=ink)
    elif chapter_number == 21:
        tower_x = x1 + 150
        draw.line((tower_x, y2 - 70, tower_x, y1 + 150), fill=ink, width=10)
        draw.line((tower_x, y1 + 150, tower_x - 65, y2 - 70), fill=ink, width=6)
        draw.line((tower_x, y1 + 150, tower_x + 65, y2 - 70), fill=ink, width=6)
        for radius in (100, 180, 260, 340):
            draw.arc((tower_x - radius, cy - radius, tower_x + radius, cy + radius), 300, 60, fill=accent, width=7)
        rounded(draw, (x2 - 220, cy - 125, x2 - 70, cy + 125), 22, '#fff', ink, 6)
    else:
        boxes = [(x1 + 55, cy - 80, x1 + 210, cy + 80), (cx - 78, cy - 80, cx + 78, cy + 80), (x2 - 210, cy - 80, x2 - 55, cy + 80)]
        labels = ['能源', '转化', '利用']
        colors = ['#f2c96d', '#95c9aa', '#89acd6']
        for box, label, color in zip(boxes, labels, colors):
            rounded(draw, box, 24, color, ink, 4)
            center_text(draw, box, label, font(30), ink)
        arrow(draw, (boxes[0][2] + 12, cy), (boxes[1][0] - 12, cy), accent)
        arrow(draw, (boxes[1][2] + 12, cy), (boxes[2][0] - 12, cy), accent)


def load_manifest():
    code = """
const p=require('./packages/physics/data/physics-curriculum');
console.log(JSON.stringify(p.chapters.flatMap(chapter => chapter.knowledgeItems.map((knowledge, index) => ({
  id: knowledge.id,
  title: knowledge.title,
  summary: knowledge.summary,
  chapterNumber: chapter.number,
  chapterTitle: chapter.title,
  chapterLabel: chapter.chapterLabel,
  formula: (knowledge.sections.find(section => section.type === 'formula') || {}).formula || '',
  points: knowledge.knowledgePoints.slice(0, 3),
  index,
})))))
"""
    output = subprocess.check_output(['node', '-e', code], cwd=ROOT, text=True)
    return json.loads(output)


def render(item):
    accent, pale, ink = PALETTES[(item['chapterNumber'] - 1) % len(PALETTES)]
    image = Image.new('RGB', (WIDTH, HEIGHT), pale)
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 28, HEIGHT), fill=accent)
    draw.rectangle((55, 55, 1225, 845), fill='#ffffff', outline='#dce4eb', width=3)

    draw.text((90, 85), f"初中物理 · {item['chapterLabel']} {item['chapterTitle']}", font=font(27), fill=accent)
    title_font = font(46 if len(item['title']) <= 12 else 39)
    draw.multiline_text((90, 145), wrap_text(draw, item['title'], title_font, 410, 2), font=title_font, fill=ink, spacing=8)
    summary_font = font(25)
    draw.multiline_text((92, 275), wrap_text(draw, item['summary'], summary_font, 395, 4), font=summary_font, fill='#5f6b7b', spacing=11)

    if item['formula']:
        formula_box = (88, 465, 485, 580)
        rounded(draw, formula_box, 18, pale, accent, 3)
        formula = str(item['formula']).split('；')[0].split('。')[0]
        center_wrapped_text(draw, formula_box, formula, ink)

    draw.text((92, 605), '核心知识', font=font(25), fill=accent)
    y = 650
    for point in item['points'][:2]:
        draw.rectangle((95, y + 10, 105, y + 20), fill=accent)
        draw.multiline_text((120, y), wrap_text(draw, point, font(21), 350, 2), font=font(21), fill='#455267', spacing=6)
        y += 75

    panel = (545, 115, 1185, 800)
    rounded(draw, panel, 28, '#fbfcfe', '#d9e1e9', 3)
    draw_motif(draw, item['chapterNumber'], (585, 170, 1145, 755), accent, ink, item['index'])
    draw.text((930, 790), f"知识图解 {item['chapterNumber']:02d}-{item['index'] + 1}", font=font(20), fill='#7a8593')

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT_ROOT / f"{item['id']}.png", 'PNG', optimize=True)


def main():
    manifest = load_manifest()
    for item in manifest:
        render(item)
    print(f'generated {len(manifest)} physics knowledge figures')


if __name__ == '__main__':
    main()
