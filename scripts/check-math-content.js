const math = require('../utils/math');

const chapters = math.getAllChapters();
const issues = [];

function includesPlaceholder(text) {
  return /本章常见模型|第一步应如何列式求解|对应的核心量满足题设条件/.test(text || '');
}

chapters.forEach((chapter) => {
  const stemOwner = new Map();

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

if (issues.length) {
  console.log('FOUND_ISSUES');
  issues.forEach((item) => console.log(item));
  process.exit(1);
}

console.log(`OK ${chapters.length} chapters checked`);
