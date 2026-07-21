const { getContentReviewMeta } = require('./content-review-meta');

function buildProblem(example, index) {
  return {
    id: example.id,
    title: example.title || ['基础示例', '提升示例', '综合示例'][index] || `示例 ${index + 1}`,
    difficulty: example.difficulty || (index === 0 ? '基础' : index === 1 ? '提升' : '综合'),
    stem: example.stem,
    answer: example.answer,
    analysis: example.analysis,
    steps: example.steps || [],
    image: example.image || '',
  };
}

function buildKnowledge(subject, topic, item, topicTemplate) {
  const examples = (item.examples || []).map(buildProblem);
  const sections = [
    {
      type: 'text',
      title: '通俗理解',
      content: item.explanation,
    },
    {
      type: 'list',
      title: '核心知识',
      items: item.points,
    },
  ];

  if (item.pattern) {
    sections.push({
      type: 'formula',
      title: item.patternTitle || '关键表达',
      formula: item.pattern,
      description: item.patternDescription || '先理解各部分含义，再代入具体情境。',
    });
  }

  if (subject.id === 'english' && examples[0]) {
    sections.push({
      type: 'example',
      title: '例句拆解',
      sentence: examples[0].stem,
      translation: examples[0].answer,
      focus: item.pattern || item.points[0],
      note: examples[0].analysis,
    });
  }

  if (item.experiment) {
    sections.push({
      type: 'experiment',
      title: item.experiment.title,
      goal: item.experiment.goal,
      apparatus: item.experiment.apparatus,
      apparatusText: item.experiment.apparatus.join('、'),
      steps: item.experiment.steps,
      phenomenon: item.experiment.phenomenon,
      conclusion: item.experiment.conclusion,
      errors: item.experiment.errors,
      errorsText: item.experiment.errors.join('；'),
      safety: item.experiment.safety,
    });
  }

  sections.push({
    type: 'tip',
    title: '易错提醒',
    content: item.mistakes.join('；'),
  });

  return {
    id: item.id,
    subjectId: subject.id,
    topicId: topic.id,
    containerId: topic.id,
    title: item.title,
    summary: item.summary,
    tags: item.tags || topic.keywords.slice(0, 3),
    keywords: [...new Set([item.title, ...topic.keywords, ...(item.keywords || [])])],
    knowledgePoints: item.points,
    mistakeChecklist: item.mistakes,
    sections,
    template: {
      id: topicTemplate.id,
      name: topicTemplate.name,
      whenToUse: topicTemplate.summary,
      steps: topicTemplate.steps,
    },
    problems: examples,
    coverImage: topic.diagramImage,
    figureCaption: item.figureCaption || topic.diagramCaption,
    contentMeta: getContentReviewMeta(subject.id),
  };
}

function buildTopic(subject, topic) {
  const template = {
    ...topic.template,
    subjectId: subject.id,
    topicIds: [topic.id],
    relatedTopicIds: [topic.id],
    figure: topic.diagramImage,
    examples: topic.knowledge.map((item) => {
      const example = item.examples[0];
      return {
        id: `${topic.template.id}-${item.id}`,
        title: `${item.title}示例`,
        stem: example.stem,
        steps: example.steps,
        summary: example.analysis,
      };
    }),
  };
  const knowledgeItems = topic.knowledge.map((item) => buildKnowledge(subject, topic, item, template));

  return {
    ...topic,
    subjectId: subject.id,
    label: topic.label,
    checkpointCount: topic.checkpoints.length,
    knowledgeIds: knowledgeItems.map((item) => item.id),
    templateIds: [template.id],
    knowledgeItems,
    templates: [template],
    knowledgeCount: knowledgeItems.length,
    exampleCount: knowledgeItems.reduce((sum, item) => sum + item.problems.length, 0),
  };
}

function buildSubjectContent(config) {
  const topics = config.topics.map((topic) => buildTopic(config.subject, topic));
  const knowledgeItems = topics.flatMap((topic) => topic.knowledgeItems);
  const templates = topics.flatMap((topic) => topic.templates);

  return {
    subject: {
      ...config.subject,
      topicCount: topics.length,
      knowledgeCount: knowledgeItems.length,
      templateCount: templates.length,
      exampleCount: knowledgeItems.reduce((sum, item) => sum + item.problems.length, 0),
    },
    topics,
    knowledgeItems,
    templates,
  };
}

module.exports = {
  buildSubjectContent,
};
