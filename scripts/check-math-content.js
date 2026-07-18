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

if (!studyMap || studyMap.topicCount !== 20) {
  issues.push('v1.1 数学学习地图应包含七、八年级共 20 个专题小包');
}

const expectedTopicCounts = {
  grade7: 10,
  grade8: 10,
  grade9: 0,
};

(studyMap.topicGroups || []).forEach((group) => {
  if (group.topicCount !== expectedTopicCounts[group.gradeId]) {
    issues.push(`${group.title}: 专题数量应为 ${expectedTopicCounts[group.gradeId]}`);
  }

  group.topics.forEach((topic) => {
    if (!topic.id || !topic.gradeId || !topic.title || !topic.chapterIds.length) {
      issues.push(`${group.title}: 专题基础字段不完整 -> ${topic.title || topic.id || '未命名专题'}`);
    }

    if (!topic.objective || topic.objective.length < 20) {
      issues.push(`${group.title}/${topic.title}: 学习目标过短或缺失`);
    }

    ['focus', 'signals', 'checkpoints', 'practiceFlow', 'finishCriteria'].forEach((field) => {
      if (!Array.isArray(topic[field]) || topic[field].length < 4) {
        issues.push(`${group.title}/${topic.title}: ${field} 至少需要 4 项`);
      }
    });

    topic.chapterIds.forEach((chapterId) => {
      if (!chapters.some((chapter) => chapter.id === chapterId)) {
        issues.push(`${group.title}/${topic.title}: 章节映射不存在 -> ${chapterId}`);
      }
    });

    if (topic.gradeId === 'grade7' && !topic.coverImage) {
      issues.push(`${group.title}/${topic.title}: 缺少独立专题封面`);
    }
  });
});

const generatedKnowledgeIds = new Set();

chapters.forEach((chapter) => {
  chapter.knowledgeItems.forEach((knowledge) => {
    if (generatedKnowledgeIds.has(knowledge.id)) {
      issues.push(`知识点稳定 ID 重复 -> ${knowledge.id}`);
    }

    generatedKnowledgeIds.add(knowledge.id);
    (knowledge.legacyIds || []).forEach((legacyId) => {
      const resolved = math.resolveKnowledgeId(legacyId);
      if (resolved !== knowledge.id) {
        issues.push(`${chapter.title}/${knowledge.title}: 旧 ID 未解析到当前知识点 -> ${legacyId}`);
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
