const math = require('../utils/math');

const chapters = math.getAllChapters();
const studyMap = math.getMathStudyMap();
const issues = [];
const grade8ChapterIds = new Set([
  'ch11-triangle',
  'ch12-congruent',
  'ch13-symmetry',
  'ch14-polynomial',
  'ch15-fraction',
  'ch16-radical',
  'ch17-pythagorean',
  'ch18-parallelogram',
  'ch19-linear-function',
  'ch20-data-analysis',
]);

function includesPlaceholder(text) {
  return /本章常见模型|第一步应如何列式求解|对应的核心量满足题设条件/.test(text || '');
}

chapters.forEach((chapter) => {
  const stemOwner = new Map();

  if (grade8ChapterIds.has(chapter.id)) {
    const guide = chapter.topicGuide;

    if (!guide) {
      issues.push(`${chapter.title}: 缺少八年级专题小包`);
    } else {
      if (!guide.objective || guide.objective.length < 20) {
        issues.push(`${chapter.title}: 专题学习目标过短或缺失`);
      }

      ['checkpoints', 'signals', 'practiceFlow', 'finishCriteria'].forEach((field) => {
        if (!Array.isArray(guide[field]) || guide[field].length < 4) {
          issues.push(`${chapter.title}: 专题字段 ${field} 至少需要 4 项`);
        }
      });
    }
  }

  chapter.knowledgeItems.forEach((lesson) => {
    if (!lesson.summary || lesson.summary.length < 12) {
      issues.push(`${chapter.title} / ${lesson.title}: 摘要过短`);
    }

    if (!lesson.sections.some((section) => section.title === '通俗理解')) {
      issues.push(`${chapter.title} / ${lesson.title}: 缺少“通俗理解”`);
    }

    lesson.problems.forEach((problem) => {
      if (includesPlaceholder(problem.stem) || includesPlaceholder(problem.answer)) {
        issues.push(`${chapter.title} / ${lesson.title}: 仍有占位式题目 -> ${problem.title}`);
      }

      if (stemOwner.has(problem.stem)) {
        issues.push(`${chapter.title}: 题干重复 -> ${lesson.title} 与 ${stemOwner.get(problem.stem)}`);
      } else {
        stemOwner.set(problem.stem, lesson.title);
      }
    });
  });
});

if (!studyMap || studyMap.gradeCount !== 3) {
  issues.push('数学学习地图应包含七、八、九年级 3 个大包');
}

if (!studyMap || studyMap.grade8TopicCount !== 10) {
  issues.push('八年级学习地图应包含 10 个专题小包');
}

if (issues.length) {
  console.log('FOUND_ISSUES');
  issues.forEach((item) => console.log(item));
  process.exit(1);
}

console.log(`OK ${chapters.length} chapters checked`);
