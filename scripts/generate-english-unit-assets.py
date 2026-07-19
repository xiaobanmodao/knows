import json
import math
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


WIDTH = 1280
HEIGHT = 900
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / 'assets/figures/generated/subjects/english/units'
FONT_CJK = '/System/Library/Fonts/STHeiti Medium.ttc'
FONT_LATIN = '/System/Library/Fonts/Supplemental/Arial.ttf'
FONT_LATIN_BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'

BOOK_PALETTES = {
    'eng-book-g7a-2024': ('#087a4b', '#eaf6f0', '#ef7b45', '#172a24'),
    'eng-book-g7b-2024': ('#39724c', '#eef7ef', '#d59a2f', '#203127'),
    'eng-book-g8a-2024': ('#276a8d', '#edf6fa', '#d76b3f', '#1e3440'),
    'eng-book-g8b-2024': ('#75528f', '#f5f0f8', '#2f8d87', '#362b3d'),
    'eng-book-g9a-2025': ('#a4453f', '#fbf1ef', '#356f9b', '#3a2928'),
}

UNIT_MOTIFS = {
    'eng-unit-g7a-starter-hello': 'chat',
    'eng-unit-g7a-starter-keep-tidy': 'ownership',
    'eng-unit-g7a-starter-welcome': 'farm',
    'eng-unit-g7a-you-and-me': 'profile',
    'eng-unit-g7a-were-family': 'family',
    'eng-unit-g7a-my-school': 'school',
    'eng-unit-g7a-favourite-subject': 'books',
    'eng-unit-g7a-fun-clubs': 'clubs',
    'eng-unit-g7a-day-in-life': 'clock',
    'eng-unit-g7a-happy-birthday': 'birthday',
    'eng-unit-g7b-animal-friends': 'animals',
    'eng-unit-g7b-no-rules-no-order': 'rules',
    'eng-unit-g7b-keep-fit': 'fitness',
    'eng-unit-g7b-eat-well': 'food',
    'eng-unit-g7b-here-and-now': 'camera',
    'eng-unit-g7b-rain-or-shine': 'weather',
    'eng-unit-g7b-day-to-remember': 'timeline',
    'eng-unit-g7b-once-upon-a-time': 'story',
    'eng-unit-g8a-happy-holiday': 'travel',
    'eng-unit-g8a-home-sweet-home': 'home',
    'eng-unit-g8a-same-or-different': 'compare',
    'eng-unit-g8a-amazing-plants-animals': 'nature',
    'eng-unit-g8a-delicious-meal': 'cooking',
    'eng-unit-g8a-plan-yourself': 'calendar',
    'eng-unit-g8a-when-tomorrow-comes': 'future',
    'eng-unit-g8a-communicate': 'chat',
    'eng-unit-g8b-time-to-relax': 'relax',
    'eng-unit-g8b-stay-healthy': 'health',
    'eng-unit-g8b-growing-up': 'growth',
    'eng-unit-g8b-wonder-of-nature': 'mountain',
    'eng-unit-g8b-natures-temper': 'warning',
    'eng-unit-g8b-crossing-cultures': 'globe',
    'eng-unit-g8b-good-read': 'reading',
    'eng-unit-g8b-making-difference': 'volunteer',
    'eng-unit-g9a-changing-world': 'change',
    'eng-unit-g9a-inspiring-people': 'star',
    'eng-unit-g9a-smart-learning': 'learning',
    'eng-unit-g9a-our-memory': 'memory',
    'eng-unit-g9a-power-of-ideas': 'idea',
    'eng-unit-g9a-beyond-earth': 'space',
    'eng-unit-g9a-feel-rhythm': 'music',
    'eng-unit-g9a-more-than-game': 'sports',
}


def font(size, latin=False, bold=False):
    path = FONT_LATIN_BOLD if latin and bold else FONT_LATIN if latin else FONT_CJK
    return ImageFont.truetype(path, size)


def text_font(value, size, bold=False):
    latin = all(ord(char) < 128 for char in str(value))
    return font(size, latin=latin, bold=bold)


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def center_text(draw, box, value, value_font, fill):
    x1, y1, x2, y2 = box
    bounds = draw.textbbox((0, 0), value, font=value_font)
    text_width = bounds[2] - bounds[0]
    text_height = bounds[3] - bounds[1]
    draw.text(
        ((x1 + x2 - text_width) / 2, (y1 + y2 - text_height) / 2 - bounds[1]),
        value,
        font=value_font,
        fill=fill,
    )


def wrap_text(draw, value, value_font, max_width, max_lines=3):
    value = str(value).replace('’', "'")
    tokens = re.findall(r'\S+\s*', value) if ' ' in value else list(value)
    lines = []
    current = ''
    for token in tokens:
        if draw.textlength(token.rstrip(), font=value_font) > max_width:
            for char in token:
                candidate = current + char
                if current and draw.textlength(candidate.rstrip(), font=value_font) > max_width:
                    lines.append(current.rstrip())
                    current = char.lstrip()
                    if len(lines) == max_lines:
                        break
                else:
                    current = candidate
            if len(lines) == max_lines:
                break
            continue
        candidate = current + token
        if current and draw.textlength(candidate.rstrip(), font=value_font) > max_width:
            lines.append(current.rstrip())
            current = token.lstrip()
            if len(lines) == max_lines:
                break
        else:
            current = candidate
    if len(lines) < max_lines and current:
        lines.append(current.rstrip())
    consumed = ''.join(lines).replace(' ', '')
    source = value.replace(' ', '')
    if len(consumed) < len(source) and lines:
        lines[-1] = lines[-1].rstrip(' .,;，。；') + '…'
    return '\n'.join(lines)


def arrow(draw, start, end, fill, width=7, head=18):
    draw.line((start, end), fill=fill, width=width)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    left = (end[0] - head * math.cos(angle - math.pi / 6), end[1] - head * math.sin(angle - math.pi / 6))
    right = (end[0] - head * math.cos(angle + math.pi / 6), end[1] - head * math.sin(angle + math.pi / 6))
    draw.polygon((end, left, right), fill=fill)


def star_points(cx, cy, outer, inner, count=5):
    points = []
    for index in range(count * 2):
        radius = outer if index % 2 == 0 else inner
        angle = -math.pi / 2 + index * math.pi / count
        points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return points


def draw_person(draw, cx, cy, scale, fill, outline):
    radius = 32 * scale
    draw.ellipse((cx - radius, cy - 105 * scale - radius, cx + radius, cy - 105 * scale + radius), fill=fill, outline=outline, width=max(2, int(4 * scale)))
    rounded(draw, (cx - 58 * scale, cy - 70 * scale, cx + 58 * scale, cy + 80 * scale), int(24 * scale), fill, outline, max(2, int(4 * scale)))


def draw_book(draw, box, accent, secondary, ink):
    x1, y1, x2, y2 = box
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    draw.polygon(((cx, cy - 120), (x1 + 65, cy - 155), (x1 + 65, cy + 125), (cx, cy + 155)), fill='#ffffff', outline=ink)
    draw.polygon(((cx, cy - 120), (x2 - 65, cy - 155), (x2 - 65, cy + 125), (cx, cy + 155)), fill='#ffffff', outline=ink)
    draw.line((cx, cy - 120, cx, cy + 155), fill=accent, width=8)
    for offset in (-65, -20, 25):
        draw.line((x1 + 100, cy + offset, cx - 35, cy + offset + 18), fill=secondary, width=5)
        draw.line((cx + 35, cy + offset + 18, x2 - 100, cy + offset), fill=secondary, width=5)


def draw_motif(draw, motif, box, accent, secondary, ink):
    x1, y1, x2, y2 = box
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2

    if motif == 'chat':
        rounded(draw, (x1 + 55, y1 + 70, cx + 55, cy + 20), 30, '#ffffff', accent, 6)
        draw.polygon(((x1 + 115, cy + 20), (x1 + 105, cy + 75), (x1 + 175, cy + 20)), fill='#ffffff', outline=accent)
        rounded(draw, (cx - 35, cy - 5, x2 - 45, y2 - 75), 30, secondary, ink, 5)
        for y in (y1 + 135, y1 + 190):
            draw.line((x1 + 110, y, cx - 5, y), fill=accent, width=7)
        for y in (cy + 70, cy + 125):
            draw.line((cx + 25, y, x2 - 95, y), fill='#ffffff', width=7)
    elif motif == 'ownership':
        for index, color in enumerate((accent, secondary, '#76a7c9')):
            left = x1 + 70 + index * 145
            rounded(draw, (left, cy - 70, left + 105, cy + 85), 18, color, ink, 4)
            draw.arc((left + 18, cy - 115, left + 87, cy - 35), 180, 360, fill=ink, width=5)
        center_text(draw, (cx - 52, y1 + 45, cx + 52, y1 + 145), '?', font(70, True, True), ink)
    elif motif == 'farm':
        draw.rectangle((x1 + 70, cy - 20, cx + 45, y2 - 70), fill=secondary, outline=ink, width=5)
        draw.polygon(((x1 + 45, cy - 20), (x1 + 190, y1 + 70), (cx + 70, cy - 20)), fill=accent, outline=ink)
        draw.rectangle((x1 + 145, cy + 75, x1 + 245, y2 - 70), fill='#ffffff', outline=ink, width=4)
        draw.ellipse((x2 - 155, y1 + 60, x2 - 65, y1 + 150), fill='#f2c94c')
        draw.line((x1 + 35, y2 - 70, x2 - 35, y2 - 70), fill=ink, width=7)
    elif motif in ('profile', 'family'):
        if motif == 'profile':
            draw_person(draw, cx - 100, cy + 45, 1.15, secondary, ink)
            rounded(draw, (cx + 25, y1 + 65, x2 - 50, y2 - 70), 22, '#ffffff', accent, 5)
            for y, width in ((y1 + 135, 165), (y1 + 200, 210), (y1 + 265, 135)):
                draw.line((cx + 75, y, cx + 75 + width, y), fill=accent, width=7)
        else:
            draw_person(draw, cx, cy + 65, 1.15, secondary, ink)
            draw_person(draw, cx - 145, cy + 105, 0.85, accent, ink)
            draw_person(draw, cx + 145, cy + 105, 0.85, '#76a7c9', ink)
    elif motif == 'school':
        draw.rectangle((x1 + 70, cy - 95, x2 - 70, y2 - 70), fill='#ffffff', outline=ink, width=6)
        draw.polygon(((x1 + 40, cy - 95), (cx, y1 + 45), (x2 - 40, cy - 95)), fill=secondary, outline=ink)
        for row in range(2):
            for column in range(4):
                left = x1 + 105 + column * 95
                top = cy - 35 + row * 95
                draw.rectangle((left, top, left + 50, top + 50), fill='#bfe1ed', outline=accent, width=3)
    elif motif in ('books', 'reading', 'story'):
        draw_book(draw, box, accent, secondary, ink)
        if motif == 'story':
            draw.polygon(star_points(x2 - 105, y1 + 95, 46, 20), fill=secondary)
    elif motif == 'clubs':
        for index, (px, py, color) in enumerate(((cx - 125, cy - 85, accent), (cx + 125, cy - 85, secondary), (cx, cy + 125, '#76a7c9'))):
            draw.ellipse((px - 75, py - 75, px + 75, py + 75), fill=color, outline=ink, width=5)
            draw.polygon(star_points(px, py, 38, 17, 5 + index), fill='#ffffff')
    elif motif == 'clock':
        draw.ellipse((cx - 175, cy - 175, cx + 175, cy + 175), fill='#ffffff', outline=accent, width=10)
        for index in range(12):
            angle = index * math.pi / 6
            px = cx + 145 * math.sin(angle)
            py = cy - 145 * math.cos(angle)
            draw.ellipse((px - 6, py - 6, px + 6, py + 6), fill=ink)
        draw.line((cx, cy, cx, cy - 105), fill=ink, width=10)
        draw.line((cx, cy, cx + 95, cy + 35), fill=accent, width=10)
        draw.ellipse((cx - 12, cy - 12, cx + 12, cy + 12), fill=secondary)
    elif motif == 'birthday':
        draw.rectangle((cx - 170, cy + 10, cx + 170, cy + 145), fill=secondary, outline=ink, width=5)
        draw.rectangle((cx - 120, cy - 90, cx + 120, cy + 10), fill='#ffffff', outline=ink, width=5)
        for offset in (-70, 0, 70):
            draw.line((cx + offset, cy - 90, cx + offset, cy - 165), fill=accent, width=7)
            draw.ellipse((cx + offset - 12, cy - 195, cx + offset + 12, cy - 165), fill='#f2c94c')
    elif motif == 'animals':
        draw.ellipse((cx - 90, cy - 45, cx + 90, cy + 135), fill=secondary, outline=ink, width=5)
        for px, py in ((cx - 130, cy - 115), (cx - 45, cy - 155), (cx + 45, cy - 155), (cx + 130, cy - 115)):
            draw.ellipse((px - 42, py - 52, px + 42, py + 52), fill=accent, outline=ink, width=4)
    elif motif == 'rules':
        rounded(draw, (x1 + 85, y1 + 55, x2 - 85, y2 - 55), 24, '#ffffff', ink, 5)
        for index, color in enumerate((accent, secondary, accent)):
            y = y1 + 135 + index * 105
            draw.rectangle((x1 + 135, y - 22, x1 + 180, y + 23), outline=color, width=5)
            draw.line((x1 + 205, y, x2 - 130, y), fill=ink, width=6)
        draw.line((x1 + 140, y1 + 135, x1 + 153, y1 + 150, x1 + 180, y1 + 112), fill=accent, width=7)
    elif motif == 'fitness':
        points = [(x1 + 45, cy), (x1 + 145, cy), (x1 + 205, cy - 105), (x1 + 280, cy + 120), (x1 + 350, cy - 55), (x1 + 405, cy), (x2 - 45, cy)]
        draw.line(points, fill=accent, width=12, joint='curve')
        draw.ellipse((cx - 175, cy - 175, cx + 175, cy + 175), outline=secondary, width=7)
    elif motif in ('food', 'cooking'):
        if motif == 'food':
            draw.ellipse((cx - 165, cy - 165, cx + 165, cy + 165), fill='#ffffff', outline=accent, width=10)
            draw.ellipse((cx - 85, cy - 85, cx + 85, cy + 85), fill=secondary)
            draw.line((x1 + 70, cy - 160, x1 + 70, cy + 160), fill=ink, width=8)
            draw.line((x2 - 70, cy - 160, x2 - 70, cy + 160), fill=ink, width=8)
        else:
            rounded(draw, (cx - 180, cy - 55, cx + 180, cy + 135), 35, secondary, ink, 6)
            draw.line((cx - 120, cy - 55, cx - 80, cy - 140), fill=ink, width=8)
            draw.line((cx + 120, cy - 55, cx + 80, cy - 140), fill=ink, width=8)
            for offset in (-70, 0, 70):
                draw.arc((cx + offset - 25, y1 + 55, cx + offset + 25, cy - 70), 90, 260, fill=accent, width=6)
    elif motif == 'camera':
        rounded(draw, (x1 + 60, cy - 130, x2 - 60, cy + 145), 30, '#ffffff', ink, 7)
        draw.ellipse((cx - 105, cy - 105, cx + 105, cy + 105), outline=accent, width=10)
        draw.ellipse((cx - 52, cy - 52, cx + 52, cy + 52), fill=secondary)
        draw.rectangle((x1 + 125, cy - 185, x1 + 250, cy - 130), fill=accent)
    elif motif == 'weather':
        draw.ellipse((x1 + 70, y1 + 55, x1 + 215, y1 + 200), fill='#f2c94c')
        draw.ellipse((cx - 150, cy - 115, cx + 15, cy + 50), fill='#ffffff', outline=ink, width=4)
        draw.ellipse((cx - 25, cy - 170, cx + 170, cy + 45), fill='#ffffff', outline=ink, width=4)
        draw.rectangle((cx - 145, cy - 35, cx + 170, cy + 50), fill='#ffffff')
        for offset in (-95, 0, 95):
            draw.line((cx + offset, cy + 85, cx + offset - 28, cy + 165), fill=accent, width=8)
    elif motif == 'timeline':
        draw.line((x1 + 65, cy, x2 - 65, cy), fill=ink, width=8)
        for index, color in enumerate((accent, secondary, '#76a7c9', accent)):
            px = x1 + 95 + index * 125
            draw.ellipse((px - 26, cy - 26, px + 26, cy + 26), fill=color, outline=ink, width=4)
            draw.line((px, cy - 35, px, cy - 120 + (index % 2) * 55), fill=color, width=5)
    elif motif == 'travel':
        rounded(draw, (cx - 135, cy - 125, cx + 135, cy + 150), 25, secondary, ink, 6)
        draw.arc((cx - 70, cy - 195, cx + 70, cy - 70), 180, 360, fill=ink, width=7)
        draw.line((cx, cy - 110, cx, cy + 130), fill=accent, width=7)
        draw.ellipse((cx - 105, cy + 145, cx - 65, cy + 185), fill=ink)
        draw.ellipse((cx + 65, cy + 145, cx + 105, cy + 185), fill=ink)
    elif motif == 'home':
        draw.polygon(((x1 + 55, cy - 45), (cx, y1 + 45), (x2 - 55, cy - 45)), fill=accent, outline=ink)
        draw.rectangle((x1 + 105, cy - 45, x2 - 105, y2 - 60), fill='#ffffff', outline=ink, width=6)
        draw.rectangle((cx - 50, cy + 70, cx + 50, y2 - 60), fill=secondary, outline=ink, width=4)
    elif motif == 'compare':
        draw_person(draw, cx - 135, cy + 50, 0.95, accent, ink)
        draw_person(draw, cx + 135, cy + 50, 1.15, secondary, ink)
        center_text(draw, (cx - 55, cy - 50, cx + 55, cy + 70), '≠', font(66, True, True), ink)
    elif motif == 'nature':
        draw.line((cx, y2 - 75, cx, y1 + 85), fill=ink, width=9)
        for side in (-1, 1):
            for offset in (-110, 15, 140):
                px = cx + side * 80
                py = cy + offset
                draw.ellipse((px - 80, py - 48, px + 80, py + 48), fill=accent if side < 0 else secondary, outline=ink, width=4)
                draw.line((cx, py + 25, px, py), fill=ink, width=5)
    elif motif == 'calendar':
        rounded(draw, (x1 + 75, y1 + 65, x2 - 75, y2 - 65), 20, '#ffffff', ink, 6)
        draw.rectangle((x1 + 75, y1 + 65, x2 - 75, y1 + 150), fill=accent)
        for row in range(2):
            for column in range(3):
                left = x1 + 125 + column * 125
                top = y1 + 205 + row * 105
                draw.rectangle((left, top, left + 65, top + 60), outline=secondary, width=5)
        draw.line((x1 + 270, y1 + 335, x1 + 300, y1 + 365, x1 + 355, y1 + 300), fill=accent, width=9)
    elif motif in ('future', 'growth', 'change'):
        for index in range(4):
            left = x1 + 70 + index * 105
            top = y2 - 75 - index * 85
            draw.rectangle((left, top, left + 105, y2 - 75), fill=accent if index % 2 == 0 else secondary, outline=ink, width=4)
        arrow(draw, (x1 + 95, y2 - 105), (x2 - 60, y1 + 65), ink, 8, 22)
    elif motif == 'relax':
        draw.ellipse((cx - 85, y1 + 55, cx + 85, y1 + 225), fill='#f2c94c')
        draw.arc((x1 + 55, cy - 15, x2 - 55, y2 + 125), 180, 360, fill=accent, width=12)
        draw.line((x1 + 80, cy, x1 + 55, y2 - 45), fill=ink, width=7)
        draw.line((x2 - 80, cy, x2 - 55, y2 - 45), fill=ink, width=7)
    elif motif == 'health':
        draw.ellipse((cx - 175, cy - 175, cx + 175, cy + 175), fill='#ffffff', outline=accent, width=8)
        draw.rectangle((cx - 45, cy - 120, cx + 45, cy + 120), fill=secondary)
        draw.rectangle((cx - 120, cy - 45, cx + 120, cy + 45), fill=secondary)
    elif motif == 'mountain':
        draw.polygon(((x1 + 45, y2 - 70), (cx - 75, y1 + 85), (cx + 80, y2 - 70)), fill=accent, outline=ink)
        draw.polygon(((cx - 10, y2 - 70), (cx + 145, y1 + 150), (x2 - 45, y2 - 70)), fill=secondary, outline=ink)
        draw.polygon(((cx - 135, y1 + 165), (cx - 75, y1 + 85), (cx - 20, y1 + 175)), fill='#ffffff')
    elif motif == 'warning':
        draw.polygon(((cx, y1 + 45), (x1 + 65, y2 - 65), (x2 - 65, y2 - 65)), fill=secondary, outline=ink)
        draw.line((cx, cy - 105, cx, cy + 80), fill=ink, width=18)
        draw.ellipse((cx - 12, cy + 125, cx + 12, cy + 149), fill=ink)
    elif motif == 'globe':
        draw.ellipse((cx - 180, cy - 180, cx + 180, cy + 180), fill='#ffffff', outline=accent, width=9)
        draw.arc((cx - 90, cy - 180, cx + 90, cy + 180), 90, 270, fill=secondary, width=6)
        draw.arc((cx - 90, cy - 180, cx + 90, cy + 180), -90, 90, fill=secondary, width=6)
        draw.line((cx - 175, cy, cx + 175, cy), fill=ink, width=5)
        draw.arc((cx - 180, cy - 85, cx + 180, cy + 85), 0, 180, fill=ink, width=5)
        draw.arc((cx - 180, cy - 85, cx + 180, cy + 85), 180, 360, fill=ink, width=5)
    elif motif == 'volunteer':
        draw.polygon(((cx, cy + 115), (cx - 155, cy - 15), (cx - 125, cy - 125), (cx, cy - 55), (cx + 125, cy - 125), (cx + 155, cy - 15)), fill=secondary, outline=ink)
        draw.arc((x1 + 55, cy + 35, cx + 25, y2 - 35), 190, 350, fill=accent, width=11)
        draw.arc((cx - 25, cy + 35, x2 - 55, y2 - 35), 190, 350, fill=accent, width=11)
    elif motif == 'star':
        draw_person(draw, cx - 60, cy + 70, 1.15, secondary, ink)
        draw.polygon(star_points(cx + 145, cy - 135, 90, 40), fill=accent, outline=ink)
    elif motif == 'learning':
        rounded(draw, (x1 + 70, y1 + 75, x2 - 70, cy + 95), 18, '#ffffff', ink, 6)
        draw.rectangle((x1 + 115, y1 + 120, x2 - 115, cy + 45), fill='#bfe1ed')
        draw.polygon(((x1 + 50, cy + 105), (x2 - 50, cy + 105), (x2 - 5, y2 - 70), (x1 + 5, y2 - 70)), fill=secondary, outline=ink)
        draw_book(draw, (cx - 115, cy + 35, cx + 115, y2 - 45), accent, secondary, ink)
    elif motif == 'memory':
        nodes = ((cx, cy), (cx - 155, cy - 105), (cx + 155, cy - 105), (cx - 135, cy + 135), (cx + 135, cy + 135))
        for px, py in nodes[1:]:
            draw.line((cx, cy, px, py), fill=ink, width=6)
        for index, (px, py) in enumerate(nodes):
            radius = 62 if index == 0 else 42
            draw.ellipse((px - radius, py - radius, px + radius, py + radius), fill=accent if index % 2 == 0 else secondary, outline=ink, width=4)
    elif motif == 'idea':
        draw.ellipse((cx - 135, cy - 175, cx + 135, cy + 95), fill='#f8d66d', outline=ink, width=6)
        draw.rectangle((cx - 65, cy + 80, cx + 65, cy + 165), fill=secondary, outline=ink, width=5)
        for angle in range(0, 360, 45):
            radians = math.radians(angle)
            start = (cx + 180 * math.cos(radians), cy - 45 + 180 * math.sin(radians))
            end = (cx + 235 * math.cos(radians), cy - 45 + 235 * math.sin(radians))
            draw.line((start, end), fill=accent, width=8)
    elif motif == 'space':
        draw.ellipse((cx - 115, cy - 115, cx + 115, cy + 115), fill=secondary, outline=ink, width=5)
        draw.arc((cx - 235, cy - 90, cx + 235, cy + 90), 5, 175, fill=accent, width=10)
        draw.arc((cx - 235, cy - 90, cx + 235, cy + 90), 185, 355, fill=accent, width=10)
        for px, py in ((x1 + 95, y1 + 85), (x2 - 95, y1 + 145), (x2 - 125, y2 - 95)):
            draw.polygon(star_points(px, py, 25, 10), fill='#f2c94c')
    elif motif == 'music':
        draw.line((cx - 70, y1 + 75, cx - 70, cy + 120), fill=accent, width=12)
        draw.line((cx - 70, y1 + 75, cx + 120, y1 + 35), fill=accent, width=12)
        draw.line((cx + 120, y1 + 35, cx + 120, cy + 80), fill=accent, width=12)
        draw.ellipse((cx - 145, cy + 85, cx - 55, cy + 165), fill=secondary, outline=ink)
        draw.ellipse((cx + 45, cy + 45, cx + 135, cy + 125), fill=secondary, outline=ink)
    elif motif == 'sports':
        draw.ellipse((cx - 155, cy - 155, cx + 155, cy + 155), fill='#ffffff', outline=accent, width=9)
        draw.polygon(star_points(cx, cy, 82, 42), fill=secondary, outline=ink)
        for angle in range(0, 360, 72):
            radians = math.radians(angle)
            draw.line((cx + 82 * math.cos(radians), cy + 82 * math.sin(radians), cx + 145 * math.cos(radians), cy + 145 * math.sin(radians)), fill=ink, width=5)


def load_manifest():
    code = """
const english = require('./data/english-units');
console.log(JSON.stringify(english.units.map(unit => ({
  id: unit.id,
  title: unit.title,
  theme: unit.theme,
  bookId: unit.bookId,
  bookLabel: unit.bookLabel,
  unitLabel: unit.unitLabel,
  expressions: unit.expressions.slice(0, 2),
  words: unit.vocabulary.slice(0, 4).map(item => item.word),
  grammar: unit.grammarPoints.map(item => ({ title: item.title, structure: item.structures[0] })),
}))));
"""
    output = subprocess.check_output(['node', '-e', code], cwd=ROOT, text=True)
    return json.loads(output)


def render(unit):
    accent, pale, secondary, ink = BOOK_PALETTES[unit['bookId']]
    image = Image.new('RGB', (WIDTH, HEIGHT), pale)
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 28, HEIGHT), fill=accent)
    draw.rectangle((55, 55, 1225, 845), fill='#ffffff', outline='#dbe5e0', width=3)

    header = f"ENGLISH · {unit['bookLabel']} · {unit['unitLabel']}"
    draw.text((90, 84), header, font=text_font(header, 24, True), fill=accent)
    title_size = 48 if len(unit['title']) <= 22 else 40
    title_font = font(title_size, True, True)
    draw.multiline_text((90, 132), wrap_text(draw, unit['title'], title_font, 555, 2), font=title_font, fill=ink, spacing=7)
    theme_font = font(25)
    draw.multiline_text((92, 245), wrap_text(draw, unit['theme'], theme_font, 520, 2), font=theme_font, fill='#66756d', spacing=7)

    motif_panel = (85, 335, 650, 780)
    rounded(draw, motif_panel, 26, pale, '#d8e3dd', 3)
    draw_motif(draw, UNIT_MOTIFS[unit['id']], (120, 375, 615, 735), accent, secondary, ink)

    grammar_panel = (700, 105, 1185, 555)
    rounded(draw, grammar_panel, 24, '#f8faf9', '#d9e3de', 3)
    draw.text((735, 135), 'GRAMMAR FOCUS', font=font(22, True, True), fill=accent)
    y = 190
    for index, grammar in enumerate(unit['grammar']):
        draw.ellipse((735, y + 8, 767, y + 40), fill=accent if index == 0 else secondary)
        center_text(draw, (735, y + 8, 767, y + 40), str(index + 1), font(17, True, True), '#ffffff')
        grammar_font = font(25)
        title = wrap_text(draw, grammar['title'], grammar_font, 365, 2)
        draw.multiline_text((785, y), title, font=grammar_font, fill=ink, spacing=5)
        title_lines = title.count('\n') + 1
        structure_y = y + 38 * title_lines + 8
        structure_font = text_font(grammar['structure'], 21, True)
        structure = wrap_text(draw, grammar['structure'], structure_font, 365, 2)
        draw.multiline_text((785, structure_y), structure, font=structure_font, fill=accent, spacing=5)
        y += 170

    expression_panel = (700, 580, 1185, 780)
    rounded(draw, expression_panel, 24, accent, None)
    draw.text((735, 608), 'USE IT', font=font(21, True, True), fill='#ffffff')
    expression_font = font(27, True, True)
    expression = wrap_text(draw, unit['expressions'][0], expression_font, 410, 2)
    draw.multiline_text((735, 648), expression, font=expression_font, fill='#ffffff', spacing=6)
    words = ' · '.join(unit['words'])
    words_font = font(20, True, True)
    draw.multiline_text((735, 728), wrap_text(draw, words, words_font, 410, 2), font=words_font, fill='#dff3ea', spacing=4)

    draw.text((92, 800), f"UNIT KNOWLEDGE MAP · {unit['id'].split('eng-unit-')[-1].upper()}", font=font(18, True, True), fill='#87928c')

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT_ROOT / f"{unit['id']}.png", 'PNG', optimize=True)


def main():
    manifest = load_manifest()
    missing_motifs = [unit['id'] for unit in manifest if unit['id'] not in UNIT_MOTIFS]
    if missing_motifs:
        raise RuntimeError(f'missing unit motifs: {missing_motifs}')
    for unit in manifest:
        render(unit)
    print(f'generated {len(manifest)} english unit figures')


if __name__ == '__main__':
    main()
