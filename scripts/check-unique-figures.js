const fs = require('fs');
const crypto = require('crypto');
const math = require('../utils/math');
const english = require('../data/english-content');
const englishUnits = require('../data/english-units');
const physics = require('../data/physics-content');
const physicsCurriculum = require('../data/physics-curriculum');

const chapters = math.getAllChapters();
const studyMap = math.getMathStudyMap();
const issues = [];
const ownerByImage = new Map();
const ownerByHash = new Map();
const EXPECTED_WIDTH = 1280;
const EXPECTED_HEIGHT = 900;

function readPngSize(localPath) {
  const buffer = fs.readFileSync(localPath);
  const isPng = buffer.length >= 24
    && buffer.toString('ascii', 1, 4) === 'PNG'
    && buffer.toString('ascii', 12, 16) === 'IHDR';

  if (!isPng) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function assertImage(owner, image) {
  if (!image) {
    issues.push(`${owner}: 缺少图片`);
    return;
  }

  if (!/\.png($|\?)/.test(image)) {
    issues.push(`${owner}: 不是 PNG 生图资源 -> ${image}`);
  }

  const localPath = image
    .replace(/^cloud:\/\/[^/]+\//, '')
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/^\//, '')
    .split('?')[0];
  if (!fs.existsSync(localPath)) {
    issues.push(`${owner}: 图片文件不存在 -> ${image}`);
  } else {
    const buffer = fs.readFileSync(localPath);
    const size = readPngSize(localPath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    if (!size) {
      issues.push(`${owner}: PNG 文件头异常 -> ${image}`);
    } else if (size.width !== EXPECTED_WIDTH || size.height !== EXPECTED_HEIGHT) {
      issues.push(`${owner}: 图片尺寸应为 ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}，实际为 ${size.width}x${size.height} -> ${image}`);
    }

    if (ownerByHash.has(hash)) {
      issues.push(`${owner}: 图片内容与 ${ownerByHash.get(hash)} 完全重复 -> ${image}`);
    } else {
      ownerByHash.set(hash, owner);
    }
  }

  if (ownerByImage.has(image)) {
    issues.push(`${owner}: 图片与 ${ownerByImage.get(image)} 共用 -> ${image}`);
  } else {
    ownerByImage.set(image, owner);
  }
}

chapters.forEach((chapter) => {
  chapter.knowledgeItems.forEach((knowledge) => {
    assertImage(`知识点 ${chapter.title}/${knowledge.title}`, knowledge.coverImage);

    knowledge.problems.forEach((problem) => {
      assertImage(`题目 ${chapter.title}/${knowledge.title}/${problem.title}`, problem.image);
    });
  });
});

studyMap.topicGroups.forEach((group) => {
  group.topics
    .filter((topic) => topic.coverImage)
    .forEach((topic) => assertImage(`专题封面 ${group.title}/${topic.title}`, topic.coverImage));
});

math.getAllTemplates()
  .filter((template) => /\/generated\/templates\//.test(template.figure))
  .forEach((template) => assertImage(`数学模板 ${template.name}`, template.figure));

physicsCurriculum.chapters.forEach((chapter) => {
  chapter.knowledgeItems.forEach((knowledge) => {
    assertImage(`物理知识点 ${chapter.title}/${knowledge.title}`, knowledge.coverImage);
  });
});

englishUnits.units.forEach((unit) => {
  assertImage(`英语单元 ${unit.bookLabel}/${unit.unitLabel} ${unit.title}`, unit.coverImage);
});

[english, physics].forEach((content) => {
  content.topics.forEach((topic) => {
    assertImage(`${content.subject.name}专题封面 ${topic.title}`, topic.coverImage);
    assertImage(`${content.subject.name}专题图示 ${topic.title}`, topic.diagramImage);
  });
});

if (issues.length) {
  console.log('FOUND_FIGURE_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK ${ownerByImage.size} unique knowledge/problem figures checked`);
