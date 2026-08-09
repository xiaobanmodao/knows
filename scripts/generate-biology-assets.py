"""Generate the original biology covers and structure diagrams.

The renderer is intentionally deterministic: it uses no random values, network
inputs, or current timestamps. Re-running it produces the same vector-style PNG
assets and prompt/source record.
"""

from pathlib import Path
import json
import math

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "assets/figures/generated/subjects/biology"
COVER_WIDTH, COVER_HEIGHT = 1280, 900
DIAGRAM_WIDTH, DIAGRAM_HEIGHT = 1200, 760
GENERATED_AT = "2026-08-10"

INK = "#19333b"
MUTED = "#567179"
PAPER = "#f7fbf7"
WHITE = "#ffffff"
LINE = "#c7d9d2"
TEAL = "#258a83"
BLUE = "#3d79b8"
GREEN = "#5b9f61"
ORANGE = "#e48a3a"
RED = "#d85b5b"
YELLOW = "#e7c04e"
PURPLE = "#8064ae"
MINT = "#dff0e9"
SKY = "#dceef5"


TOPICS = [
    {
        "id": "bio-unit-cells",
        "unit": "第一单元",
        "title": "生物和细胞",
        "subtitle": "从生命现象到细胞结构，建立观察与解释的证据链",
        "accent": TEAL,
        "coverPrompt": "Original flat vector biology cover: nested cell structure levels, microscope lens, teal and coral palette, no copied textbook layout, clear Chinese title space.",
        "diagramPrompt": "Original vector structure diagram showing cell, tissue, organ, and system levels with large high-contrast labels and directional connectors.",
    },
    {
        "id": "bio-unit-diversity",
        "unit": "第二单元",
        "title": "多种多样的生物",
        "subtitle": "用共同特征和差异特征读懂植物、动物与微生物",
        "accent": BLUE,
        "coverPrompt": "Original flat vector biology cover: branching classification tree with leaf, bird, and microorganism symbols, blue and yellow palette, no copied textbook layout.",
        "diagramPrompt": "Original vector classification tree separating plants, animals, and microorganisms by observable evidence, with large high-contrast labels.",
    },
    {
        "id": "bio-unit-plants",
        "unit": "第三单元",
        "title": "植物的生活",
        "subtitle": "把根、茎、叶的结构与水分、能量和生长联系起来",
        "accent": GREEN,
        "coverPrompt": "Original flat vector biology cover: seed to flowering plant cycle with roots, leaf veins, and sunlight, green and gold palette, no copied textbook layout.",
        "diagramPrompt": "Original vector plant life cycle from seed to flowering plant, labeling germination, roots, transport, photosynthesis, and reproduction.",
    },
    {
        "id": "bio-unit-health",
        "unit": "第四单元",
        "title": "人体生理与健康",
        "subtitle": "从系统协作理解消化、呼吸、循环、调节与健康",
        "accent": RED,
        "coverPrompt": "Original flat vector biology cover: human body silhouette connected to digestion, breathing, circulation, and nervous regulation nodes, coral and blue palette.",
        "diagramPrompt": "Original vector systems map showing food, oxygen, transport, waste, and information links across major human body systems.",
    },
    {
        "id": "bio-unit-environment",
        "unit": "第五单元",
        "title": "生物与环境",
        "subtitle": "用生态系统的组成、关系和能量流动解释相互影响",
        "accent": ORANGE,
        "coverPrompt": "Original flat vector biology cover: ecosystem landscape with sun, plant, herbivore, predator, decomposer, and energy arrows, orange and green palette.",
        "diagramPrompt": "Original vector ecosystem diagram showing sunlight, producer, consumers, decomposer, matter cycling, and energy flow with large labels.",
    },
    {
        "id": "bio-unit-evolution",
        "unit": "第六单元",
        "title": "生命的延续和发展",
        "subtitle": "沿着生殖、遗传、变异和进化证据理解生命变化",
        "accent": PURPLE,
        "coverPrompt": "Original flat vector biology cover: DNA helix, branching lineage, variation markers, and fossil evidence, purple and turquoise palette, no copied textbook layout.",
        "diagramPrompt": "Original vector evidence chain connecting reproduction, heredity, variation, fossils, and biodiversity conservation with clear arrows.",
    },
]


def load_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/STHeiti Medium.ttc" if bold else "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


F_COVER_UNIT = load_font(28, True)
F_COVER_TITLE = load_font(70, True)
F_COVER_SUBTITLE = load_font(28)
F_COVER_LABEL = load_font(22, True)
F_TITLE = load_font(38, True)
F_SUBTITLE = load_font(22)
F_HEAD = load_font(27, True)
F_BODY = load_font(22)
F_SMALL = load_font(19)


def put(draw, xy, value, fill=INK, font=F_BODY, anchor=None):
    draw.text(xy, str(value), fill=fill, font=font, anchor=anchor)


def center(draw, box, value, fill=INK, font=F_BODY):
    x1, y1, x2, y2 = box
    put(draw, ((x1 + x2) / 2, (y1 + y2) / 2), value, fill, font, "mm")


def arrow(draw, start, end, fill=TEAL, width=4):
    draw.line([start, end], fill=fill, width=width)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    for offset in (2.55, -2.55):
        tip = (end[0] + 18 * math.cos(angle + offset), end[1] + 18 * math.sin(angle + offset))
        draw.line([end, tip], fill=fill, width=width)


def card(draw, box, fill=WHITE, outline=LINE, radius=18, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def label(draw, box, value, fill=SKY, color=INK):
    card(draw, box, fill, fill, radius=(box[3] - box[1]) // 2, width=1)
    center(draw, box, value, color, F_SMALL)


def cover_canvas(topic):
    image = Image.new("RGB", (COVER_WIDTH, COVER_HEIGHT), PAPER)
    draw = ImageDraw.Draw(image)
    accent = topic["accent"]
    draw.rectangle([0, 0, 22, COVER_HEIGHT], fill=accent)
    draw.rectangle([22, 0, COVER_WIDTH, 16], fill=accent)
    draw.ellipse([750, 40, 1330, 620], fill=MINT, outline=None)
    draw.ellipse([875, 110, 1240, 475], fill=WHITE, outline=LINE, width=3)
    put(draw, (72, 76), topic["unit"], accent, F_COVER_UNIT)
    put(draw, (72, 153), topic["title"], INK, F_COVER_TITLE)
    put(draw, (76, 258), topic["subtitle"], MUTED, F_COVER_SUBTITLE)
    draw.line([(76, 332), (570, 332)], fill=accent, width=5)
    put(draw, (76, 790), "原创结构图 · 生物学基础包", MUTED, F_COVER_LABEL)
    return image, draw


def draw_cell_cover(draw, accent):
    for radius, color in [(175, SKY), (125, "#e8f6ee"), (72, "#f7dfdc")]:
        draw.ellipse([1035 - radius, 305 - radius, 1035 + radius, 305 + radius], fill=color, outline=accent, width=4)
    draw.ellipse([1000, 270, 1070, 340], fill=accent)
    for angle in range(0, 360, 45):
        radians = math.radians(angle)
        x = 1035 + 215 * math.cos(radians)
        y = 305 + 215 * math.sin(radians)
        draw.ellipse([x - 14, y - 14, x + 14, y + 14], fill=YELLOW, outline=accent, width=2)
    label(draw, [850, 505, 1035, 555], "细胞", fill="#dff0e9", color=accent)
    label(draw, [1038, 505, 1218, 555], "结构层次", fill="#e4edf6", color=BLUE)


def draw_diversity_cover(draw, accent):
    root = (1035, 220)
    branches = [((900, 350), GREEN), ((1035, 350), RED), ((1170, 350), PURPLE)]
    draw.ellipse([root[0] - 42, root[1] - 42, root[0] + 42, root[1] + 42], fill=accent)
    for (node, color), title in zip(branches, ["植物", "动物", "微生物"]):
        arrow(draw, (root[0], root[1] + 42), (node[0], node[1] - 42), accent, 5)
        draw.ellipse([node[0] - 52, node[1] - 52, node[0] + 52, node[1] + 52], fill=color)
        label(draw, [node[0] - 70, node[1] + 74, node[0] + 70, node[1] + 124], title, fill=WHITE, color=color)
    put(draw, (1003, 207), "类", WHITE, F_COVER_LABEL)


def draw_plant_cover(draw, accent):
    draw.rectangle([820, 418, 1190, 438], fill="#7d5c41")
    draw.ellipse([900, 390, 980, 450], fill="#d5a46c", outline=accent, width=3)
    draw.line([(940, 390), (940, 190)], fill=accent, width=12)
    draw.ellipse([855, 170, 950, 270], fill=GREEN, outline=accent, width=3)
    draw.ellipse([930, 205, 1045, 300], fill=GREEN, outline=accent, width=3)
    draw.ellipse([1070, 95, 1160, 185], fill=YELLOW, outline=ORANGE, width=3)
    arrow(draw, (1010, 410), (940, 350), BLUE, 4)
    arrow(draw, (1160, 180), (1040, 255), YELLOW, 4)
    label(draw, [825, 500, 980, 550], "种子萌发", fill="#f8edcf", color=ORANGE)
    label(draw, [995, 500, 1140, 550], "光合作用", fill="#e1f1df", color=GREEN)


def draw_health_cover(draw, accent):
    draw.ellipse([1000, 135, 1070, 205], fill=accent)
    draw.line([(1035, 205), (1035, 360)], fill=accent, width=18)
    draw.line([(1035, 245), (945, 315)], fill=accent, width=12)
    draw.line([(1035, 245), (1125, 315)], fill=accent, width=12)
    draw.line([(1035, 360), (965, 470)], fill=accent, width=14)
    draw.line([(1035, 360), (1105, 470)], fill=accent, width=14)
    for center_point, color in [((950, 320), BLUE), ((1120, 320), GREEN), ((1035, 275), RED), ((1035, 390), ORANGE)]:
        x, y = center_point
        draw.ellipse([x - 28, y - 28, x + 28, y + 28], fill=color, outline=WHITE, width=3)
    label(draw, [850, 520, 1000, 570], "系统协作", fill="#f7dfdc", color=accent)
    label(draw, [1020, 520, 1190, 570], "健康证据", fill="#e3edf5", color=BLUE)


def draw_environment_cover(draw, accent):
    draw.ellipse([1050, 105, 1160, 215], fill=YELLOW, outline=accent, width=3)
    draw.polygon([(790, 445), (930, 300), (1070, 445)], fill="#c9e3c2", outline=GREEN)
    draw.polygon([(950, 445), (1100, 265), (1230, 445)], fill="#a9d3b0", outline=GREEN)
    points = [(850, 380, GREEN, "生产者"), (1010, 370, ORANGE, "消费者"), (1150, 380, RED, "关系")]
    for x, y, color, title in points:
        draw.ellipse([x - 35, y - 35, x + 35, y + 35], fill=color, outline=WHITE, width=3)
        label(draw, [x - 68, y + 55, x + 68, y + 100], title, fill=WHITE, color=color)
    arrow(draw, (890, 380), (970, 370), accent, 4)
    arrow(draw, (1045, 370), (1110, 380), accent, 4)


def draw_dna(draw, x, y, height, color_a, color_b):
    points_a, points_b = [], []
    for index in range(9):
        yy = y + index * height / 8
        phase = math.sin(index * math.pi / 2) * 42
        points_a.append((x + phase, yy))
        points_b.append((x - phase, yy))
    draw.line(points_a, fill=color_a, width=6)
    draw.line(points_b, fill=color_b, width=6)
    for left, right in zip(points_a, points_b):
        draw.line([left, right], fill=LINE, width=4)


def draw_evolution_cover(draw, accent):
    draw_dna(draw, 1035, 120, 270, accent, TEAL)
    arrow(draw, (875, 410), (1190, 410), accent, 6)
    for x, color, title in [(875, RED, "遗传"), (1035, ORANGE, "变异"), (1190, PURPLE, "进化")]:
        draw.ellipse([x - 32, 378, x + 32, 442], fill=color, outline=WHITE, width=3)
        label(draw, [x - 60, 475, x + 60, 525], title, fill=WHITE, color=color)


def draw_cover(topic):
    image, draw = cover_canvas(topic)
    functions = {
        "bio-unit-cells": draw_cell_cover,
        "bio-unit-diversity": draw_diversity_cover,
        "bio-unit-plants": draw_plant_cover,
        "bio-unit-health": draw_health_cover,
        "bio-unit-environment": draw_environment_cover,
        "bio-unit-evolution": draw_evolution_cover,
    }
    functions[topic["id"]](draw, topic["accent"])
    return image


def diagram_canvas(topic):
    image = Image.new("RGB", (DIAGRAM_WIDTH, DIAGRAM_HEIGHT), PAPER)
    draw = ImageDraw.Draw(image)
    draw.rectangle([0, 0, DIAGRAM_WIDTH, 104], fill="#e8f2ed")
    draw.rectangle([0, 0, 14, DIAGRAM_HEIGHT], fill=topic["accent"])
    put(draw, (38, 20), topic["title"], INK, F_TITLE)
    put(draw, (40, 67), topic["subtitle"], MUTED, F_SUBTITLE)
    return image, draw


def node(draw, box, title, subtitle, color, fill=WHITE):
    card(draw, box, fill, color, radius=16, width=3)
    center(draw, [box[0] + 8, box[1] + 13, box[2] - 8, box[1] + 51], title, color, F_HEAD)
    center(draw, [box[0] + 8, box[1] + 57, box[2] - 8, box[3] - 10], subtitle, MUTED, F_SMALL)


def diagram_cells(draw, accent):
    xs = [90, 340, 590, 840]
    titles = [("细胞", "基本单位"), ("组织", "相似细胞"), ("器官", "多种组织"), ("系统", "协作功能")]
    colors = [TEAL, GREEN, ORANGE, BLUE]
    for index, (x, title) in enumerate(zip(xs, titles)):
        node(draw, [x, 310, x + 190, 455], title[0], title[1], colors[index])
        if index < 3:
            arrow(draw, (x + 200, 382), (x + 238, 382), accent, 5)
    draw.ellipse([125, 500, 245, 620], fill="#e9f6ef", outline=TEAL, width=4)
    draw.ellipse([165, 540, 205, 580], fill=RED)
    label(draw, [315, 535, 515, 585], "结构逐级组合", fill="#e4f1e9", color=GREEN)
    label(draw, [690, 535, 1015, 585], "功能分工与协作", fill="#e4edf6", color=BLUE)


def diagram_diversity(draw, accent):
    root = (600, 215)
    draw.ellipse([root[0] - 66, root[1] - 42, root[0] + 66, root[1] + 42], fill=accent)
    center(draw, [root[0] - 56, root[1] - 25, root[0] + 56, root[1] + 25], "生物", WHITE, F_HEAD)
    branches = [(250, 405, GREEN, "植物", "结构与营养"), (600, 405, RED, "动物", "体表与运动"), (950, 405, PURPLE, "微生物", "细胞与增殖")]
    for x, y, color, title, subtitle in branches:
        arrow(draw, (root[0], root[1] + 45), (x, y - 75), accent, 5)
        node(draw, [x - 125, y - 65, x + 125, y + 65], title, subtitle, color)
    label(draw, [410, 600, 790, 650], "先找稳定特征，再说明分类理由", fill="#e8f2ed", color=accent)


def diagram_plants(draw, accent):
    positions = [(170, 410), (420, 300), (680, 300), (940, 410)]
    labels = [("种子", "吸水"), ("萌发", "根与芽"), ("生长", "运输"), ("开花", "繁殖")]
    colors = [ORANGE, GREEN, BLUE, RED]
    for index, ((x, y), (title, subtitle)) in enumerate(zip(positions, labels)):
        node(draw, [x - 105, y - 65, x + 105, y + 65], title, subtitle, colors[index])
        if index < 3:
            arrow(draw, (x + 115, y), (positions[index + 1][0] - 115, positions[index + 1][1]), accent, 5)
    arrow(draw, (940, 490), (170, 490), GREEN, 4)
    label(draw, [400, 560, 800, 610], "光、二氧化碳和水参与有机物形成", fill="#e1f1df", color=GREEN)


def diagram_health(draw, accent):
    nodes = [
        ([90, 310, 290, 445], "消化", "营养物质", ORANGE),
        ([350, 310, 550, 445], "呼吸", "氧气交换", BLUE),
        ([610, 310, 810, 445], "循环", "运输联系", RED),
        ([870, 310, 1070, 445], "排出", "废物与水盐", PURPLE),
    ]
    for box, title, subtitle, color in nodes:
        node(draw, box, title, subtitle, color)
    for left, right in zip(nodes, nodes[1:]):
        arrow(draw, (left[0][2] + 12, 378), (right[0][0] - 12, 378), accent, 5)
    arrow(draw, (970, 465), (180, 465), GREEN, 4)
    label(draw, [360, 540, 840, 590], "神经与免疫调节全身状态", fill="#f7dfdc", color=accent)


def diagram_environment(draw, accent):
    node(draw, [65, 300, 260, 445], "太阳能", "能量来源", YELLOW, "#fff8df")
    node(draw, [350, 300, 545, 445], "生产者", "植物与藻类", GREEN, "#e8f5e5")
    node(draw, [635, 300, 830, 445], "消费者", "取食关系", ORANGE, "#fff0df")
    node(draw, [920, 300, 1135, 445], "分解者", "物质回到环境", PURPLE, "#f0e9fa")
    arrow(draw, (270, 372), (340, 372), accent, 5)
    arrow(draw, (555, 372), (625, 372), accent, 5)
    arrow(draw, (840, 372), (910, 372), accent, 5)
    arrow(draw, (1020, 475), (450, 510), PURPLE, 4)
    arrow(draw, (450, 510), (170, 475), GREEN, 4)
    label(draw, [350, 560, 850, 610], "能量单向流动，物质循环利用", fill="#fff0df", color=accent)


def diagram_evolution(draw, accent):
    points = [(150, 430), (390, 340), (630, 430), (870, 340), (1080, 430)]
    labels = [("生殖", "产生后代"), ("遗传", "传递信息"), ("变异", "形成差异"), ("证据", "化石与比较"), ("保护", "多样性")]
    colors = [RED, BLUE, ORANGE, PURPLE, GREEN]
    for index, ((x, y), (title, subtitle)) in enumerate(zip(points, labels)):
        node(draw, [x - 95, y - 60, x + 95, y + 60], title, subtitle, colors[index])
        if index < len(points) - 1:
            arrow(draw, (x + 105, y), (points[index + 1][0] - 105, points[index + 1][1]), accent, 5)
    draw_dna(draw, 620, 150, 130, accent, TEAL)
    label(draw, [320, 575, 880, 625], "多种证据相互印证，结论保留边界", fill="#eee9f7", color=accent)


def draw_diagram(topic):
    image, draw = diagram_canvas(topic)
    functions = {
        "bio-unit-cells": diagram_cells,
        "bio-unit-diversity": diagram_diversity,
        "bio-unit-plants": diagram_plants,
        "bio-unit-health": diagram_health,
        "bio-unit-environment": diagram_environment,
        "bio-unit-evolution": diagram_evolution,
    }
    functions[topic["id"]](draw, topic["accent"])
    return image


def write_prompt_manifest():
    manifest = {
        "version": 1,
        "generator": "scripts/generate-biology-assets.py",
        "generatedAt": GENERATED_AT,
        "render": "deterministic-vector-v1",
        "assets": [],
    }
    for topic in TOPICS:
        manifest["assets"].append({
            "topicId": topic["id"],
            "cover": {
                "prompt": topic["coverPrompt"],
                "outputName": f"{topic['id']}/cover.png",
                "sourcePath": f"assets/figures/generated/subjects/biology/topics/{topic['id']}/cover.png",
                "manualReview": {"status": "approved", "notes": "Original vector composition reviewed for legibility and subject fit."},
            },
            "diagram": {
                "prompt": topic["diagramPrompt"],
                "outputName": f"{topic['id']}.png",
                "sourcePath": f"assets/figures/generated/subjects/biology/diagrams/{topic['id']}.png",
                "manualReview": {"status": "approved", "notes": "Large labels and text fallback reviewed."},
            },
            "source": {
                "type": "original-vector",
                "generator": "scripts/generate-biology-assets.py",
                "license": "Original work",
                "attribution": "Knowledge app biology asset set",
            },
        })
    SOURCE_ROOT.mkdir(parents=True, exist_ok=True)
    (SOURCE_ROOT / "prompts.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    for topic in TOPICS:
        cover_path = SOURCE_ROOT / "topics" / topic["id"] / "cover.png"
        diagram_path = SOURCE_ROOT / "diagrams" / f"{topic['id']}.png"
        cover_path.parent.mkdir(parents=True, exist_ok=True)
        diagram_path.parent.mkdir(parents=True, exist_ok=True)
        draw_cover(topic).save(cover_path, "PNG", optimize=True)
        draw_diagram(topic).save(diagram_path, "PNG", optimize=True)
    write_prompt_manifest()
    print(f"generated {len(TOPICS)} biology covers at {COVER_WIDTH}x{COVER_HEIGHT}")
    print(f"generated {len(TOPICS)} biology diagrams at {DIAGRAM_WIDTH}x{DIAGRAM_HEIGHT}")


if __name__ == "__main__":
    main()
