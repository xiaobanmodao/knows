const englishContent = require('../../packages/english/data/english-content');
const englishUnits = require('../../packages/english/data/english-units');

const subjectId = 'english';

function getManifestEntities() {
  return [
    { type: 'unit', entities: englishUnits.units },
    { type: 'word', entities: englishUnits.vocabulary },
    { type: 'grammar', entities: englishUnits.grammarPoints },
    { type: 'topic', entities: englishContent.topics },
    { type: 'knowledge', entities: englishContent.knowledgeItems },
    { type: 'template', entities: englishContent.templates },
  ];
}

function buildSearchEntries(makeEntry) {
  const unitEntries = englishUnits.units.map((unit) => makeEntry({
    refId: unit.id,
    subjectId,
    type: 'unit',
    containerId: unit.bookId,
    title: `${unit.unitLabel} ${unit.title}`,
    subtitle: `英语 · ${unit.bookLabel}`,
    description: unit.theme,
    tags: [unit.theme, `${unit.vocabularyCount} 词`, `${unit.grammarCount} 语法`],
    tokens: [unit.title, unit.unitLabel, unit.expressions],
  }));
  const wordEntries = englishUnits.vocabulary.map((word) => makeEntry({
    refId: word.unitId,
    focusId: word.id,
    subjectId,
    type: 'word',
    containerId: word.unitId,
    title: word.word,
    subtitle: `英语 · ${word.bookLabel} · ${word.unitTitle}`,
    description: `${word.partOfSpeech} · ${word.meaning}。${word.usage}`,
    tags: word.collocations,
    tokens: [
      word.meaning,
      word.partOfSpeech,
      word.forms,
      word.collocations,
      word.note,
      word.searchTerms,
      word.spellingVariants && word.spellingVariants.map((item) => item.value),
      word.senses && word.senses.flatMap((item) => [item.meaning, item.countability, item.transitivity]),
      word.collocationDetails && word.collocationDetails.flatMap((item) => [item.phrase, item.meaning]),
      word.distinctions && word.distinctions.map((item) => item.target),
    ],
  }));
  const grammarEntries = englishUnits.grammarPoints.map((point) => makeEntry({
    refId: point.unitId,
    focusId: point.id,
    subjectId,
    type: 'grammar',
    containerId: point.unitId,
    title: point.title,
    subtitle: `英语 · ${point.bookLabel} · ${point.unitTitle}`,
    description: point.summary,
    tags: point.structures,
    tokens: [
      point.structures,
      point.mistakes,
      point.conditions,
      point.variants && point.variants.flatMap((item) => [item.label, item.structure]),
      point.contrasts && point.contrasts.map((item) => item.target),
    ],
  }));
  const topicEntries = englishContent.topics.map((topic) => makeEntry({
    refId: topic.id,
    subjectId,
    type: 'topic',
    containerId: topic.id,
    title: topic.title,
    subtitle: `英语 · ${topic.gradeText || '专题知识'}`,
    description: topic.summary,
    tags: topic.keywords,
    tokens: [topic.signals, topic.checkpoints && topic.checkpoints.map((item) => item.title)],
  }));
  const knowledgeEntries = englishContent.knowledgeItems.map((knowledge) => {
    const topic = englishContent.topics.find((item) => item.id === knowledge.topicId);
    return makeEntry({
      refId: knowledge.id,
      subjectId,
      type: 'knowledge',
      containerId: knowledge.topicId,
      title: knowledge.title,
      subtitle: `英语 · ${topic ? topic.title : '专题知识'}`,
      description: knowledge.summary,
      tags: knowledge.tags,
      tokens: [knowledge.keywords, knowledge.knowledgePoints],
    });
  });
  const templateEntries = englishContent.templates.map((template) => makeEntry({
    refId: template.id,
    subjectId,
    type: 'template',
    containerId: (template.topicIds || [])[0] || '',
    title: template.name,
    subtitle: `英语 · ${template.category}`,
    description: template.summary,
    tags: template.keywords,
    tokens: [template.cues, template.steps],
  }));

  return [...unitEntries, ...wordEntries, ...grammarEntries, ...topicEntries, ...knowledgeEntries, ...templateEntries];
}

function buildReferenceEntries() {
  return [];
}

function validate() {}

module.exports = {
  subjectId,
  getManifestEntities,
  buildSearchEntries,
  buildReferenceEntries,
  validate,
};
