function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildWord(unitId, entry, index) {
  const [
    word,
    partOfSpeech,
    meaning,
    usage,
    forms,
    collocations,
    example,
    translation,
    note,
  ] = entry;

  return {
    id: `${unitId}-word-${slugify(word) || index + 1}`,
    word,
    partOfSpeech,
    meaning,
    usage,
    forms: forms || '通常不发生词形变化。',
    collocations: Array.isArray(collocations) ? collocations : [collocations].filter(Boolean),
    example,
    translation,
    note,
  };
}

function grammar(id, title, summary, structures, examples, mistakes) {
  return {
    id,
    title,
    summary,
    structures,
    examples: examples.map(([sentence, translation, explanation]) => ({
      sentence,
      translation,
      explanation,
    })),
    mistakes,
  };
}

function createUnit(config) {
  const vocabulary = config.vocabulary.map((entry, index) => buildWord(config.id, entry, index));
  const grammarPoints = config.grammar.map((item) => ({
    ...item,
    id: `${config.id}-grammar-${item.id}`,
  }));

  return {
    ...config,
    subjectId: 'english',
    type: 'unit',
    unitLabel: config.isStarter ? `Starter Unit ${config.number}` : `Unit ${config.number}`,
    coverImage: config.coverImage || `/assets/figures/generated/subjects/english/units/${config.id}.png`,
    figureCaption: config.figureCaption || `${config.title}：${config.theme}与单元核心语法图解。`,
    vocabulary,
    vocabularyCount: vocabulary.length,
    grammarPoints,
    grammarCount: grammarPoints.length,
    keywords: [
      config.title,
      config.theme,
      ...vocabulary.flatMap((item) => [item.word, item.meaning, ...item.collocations]),
      ...grammarPoints.map((item) => item.title),
      ...(config.keywords || []),
    ],
  };
}

function createBook(config) {
  const units = (config.units || []).map((item) => ({
    ...item,
    bookId: config.id,
    gradeId: config.gradeId,
    semester: config.semester,
    bookLabel: config.label,
    edition: config.edition,
  }));

  return {
    ...config,
    units,
    unitCount: units.length,
    vocabularyCount: units.reduce((sum, unit) => sum + unit.vocabularyCount, 0),
    grammarCount: units.reduce((sum, unit) => sum + unit.grammarCount, 0),
  };
}

module.exports = {
  createBook,
  createUnit,
  grammar,
};
