const ASSET_ROOT = '/assets/figures/generated/subjects/physics';

function lab(title, goal, apparatus, steps, phenomenon, conclusion, errors, safety) {
  return { title, goal, apparatus, steps, phenomenon, conclusion, errors, safety };
}

function k(id, title, summary, formula, points, mistakes, examples, experiment) {
  return { id, title, summary, formula, points, mistakes, examples, experiment };
}

function buildProblem(chapterId, knowledgeId, example, index) {
  const [stem, answer, analysis] = example;
  return {
    id: `${chapterId}-${knowledgeId}-problem-${index + 1}`,
    title: ['基础判断', '规律应用', '综合分析'][index] || `示例 ${index + 1}`,
    difficulty: ['基础', '提升', '综合'][index] || '综合',
    stem,
    answer,
    analysis,
    steps: [
      '提取题目中的对象、条件和物理量。',
      '调用本知识点的核心规律进行判断或计算。',
      '结合单位、方向和生活常识复核结论。',
    ],
    image: '',
  };
}

function buildKnowledge(chapter, item) {
  const sections = [
    { type: 'text', title: '通俗理解', content: item.summary },
    { type: 'list', title: '核心知识', items: item.points },
  ];

  if (item.formula) {
    sections.push({
      type: 'formula',
      title: '公式与规律',
      formula: item.formula,
      description: '代入前先统一国际单位，并明确每个物理量对应同一对象和同一过程。',
    });
  }

  if (item.experiment) {
    sections.push({
      type: 'experiment',
      ...item.experiment,
      apparatusText: item.experiment.apparatus.join('、'),
      errorsText: item.experiment.errors.join('；'),
    });
  }

  sections.push({ type: 'tip', title: '易错提醒', content: item.mistakes.join('；') });

  return {
    id: item.id,
    subjectId: 'physics',
    chapterId: chapter.id,
    topicId: chapter.topicId,
    containerId: chapter.id,
    title: item.title,
    summary: item.summary,
    tags: [...new Set([...(item.keywords || []), ...chapter.keywords])].slice(0, 4),
    keywords: [...new Set([item.title, item.formula, ...item.points, ...chapter.keywords].filter(Boolean))],
    knowledgePoints: item.points,
    mistakeChecklist: item.mistakes,
    sections,
    template: {
      id: chapter.method.id,
      name: chapter.method.name,
      whenToUse: chapter.method.summary,
      steps: chapter.method.steps,
    },
    problems: item.examples.map((example, index) => buildProblem(chapter.id, item.id, example, index)),
    coverImage: `${ASSET_ROOT}/knowledge/${item.id}.png`,
    figureCaption: `${item.title}：${chapter.figureCaption}`,
  };
}

function createChapter(config) {
  const chapter = {
    ...config,
    subjectId: 'physics',
    type: 'chapter',
    chapterLabel: `第${config.number}章`,
  };
  const knowledgeItems = config.knowledge.map((item) => buildKnowledge(chapter, item));
  const template = {
    ...config.method,
    subjectId: 'physics',
    chapterIds: [config.id],
    topicIds: [config.topicId],
    containerId: config.id,
    category: config.method.category || '物理方法',
    keywords: [...new Set([...config.keywords, ...(config.method.keywords || [])])],
    cues: config.method.cues || config.signals,
    pitfalls: config.method.pitfalls,
    figure: `${ASSET_ROOT}/diagrams/${config.visualId}.png`,
    examples: knowledgeItems.slice(0, 3).map((item) => ({
      id: `${config.method.id}-${item.id}`,
      title: `${item.title}示例`,
      stem: item.problems[0].stem,
      steps: item.problems[0].steps,
      summary: item.problems[0].analysis,
    })),
  };

  return {
    ...chapter,
    knowledgeItems,
    knowledgeIds: knowledgeItems.map((item) => item.id),
    knowledgeCount: knowledgeItems.length,
    exampleCount: knowledgeItems.reduce((sum, item) => sum + item.problems.length, 0),
    template,
    templates: [template],
    templateIds: [template.id],
    coverImage: `${ASSET_ROOT}/topics/${config.visualId}/cover.png`,
    diagramImage: `${ASSET_ROOT}/diagrams/${config.visualId}.png`,
  };
}

function createBook(config) {
  const chapters = config.chapters.map((chapter) => ({
    ...chapter,
    bookId: config.id,
    bookLabel: config.label,
    gradeId: config.gradeId,
    semester: config.semester,
  }));

  return {
    ...config,
    chapters,
    chapterCount: chapters.length,
    knowledgeCount: chapters.reduce((sum, chapter) => sum + chapter.knowledgeCount, 0),
    exampleCount: chapters.reduce((sum, chapter) => sum + chapter.exampleCount, 0),
    templateCount: chapters.length,
  };
}

module.exports = { createBook, createChapter, k, lab };
