const grade7UpperWordDepth = require('./english-depth-grade7a-words');
const grade7UpperGrammarDepth = require('./english-depth-grade7a-grammar');
const grade7LowerWordDepth = require('./english-depth-grade7b-words');
const grade7LowerGrammarDepth = require('./english-depth-grade7b-grammar');
const grade8UpperWordDepth = require('./english-depth-grade8a-words');
const grade8UpperGrammarDepth = require('./english-depth-grade8a-grammar');
const grade8LowerWordDepth = require('./english-depth-grade8b-words');
const grade8LowerGrammarDepth = require('./english-depth-grade8b-grammar');
const grade9UpperWordDepth = require('./english-depth-grade9a-words');
const grade9UpperGrammarDepth = require('./english-depth-grade9a-grammar');

const wordDepth = [...grade7UpperWordDepth, ...grade7LowerWordDepth, ...grade8UpperWordDepth, ...grade8LowerWordDepth, ...grade9UpperWordDepth];
const grammarDepth = [...grade7UpperGrammarDepth, ...grade7LowerGrammarDepth, ...grade8UpperGrammarDepth, ...grade8LowerGrammarDepth, ...grade9UpperGrammarDepth];

const REFERENCE_SOURCES = {
  'cambridge-dictionary': {
    title: 'Cambridge Dictionary pronunciation and usage',
    url: 'https://dictionary.cambridge.org/pronunciation/',
  },
  'oxford-learners-dictionaries': {
    title: "Oxford Learner's Dictionaries pronunciation and usage",
    url: 'https://www.oxfordlearnersdictionaries.com/about/english/pronunciation_english.html',
  },
  'cambridge-grammar': {
    title: 'Cambridge Dictionary: English Grammar Today',
    url: 'https://dictionary.cambridge.org/grammar/british-grammar/',
  },
  'british-council-grammar': {
    title: 'British Council LearnEnglish Grammar',
    url: 'https://learnenglish.britishcouncil.org/free-resources/grammar',
  },
};

const BOOK_DEPTH_STATUS = {
  'eng-book-g7a-2024': {
    status: 'complete',
    detailVersion: 2,
    wordCount: 80,
    grammarCount: 20,
    reviewedAt: '2026-07-22',
  },
  'eng-book-g7b-2024': {
    status: 'complete',
    detailVersion: 2,
    wordCount: 64,
    grammarCount: 16,
    reviewedAt: '2026-07-22',
  },
  'eng-book-g8a-2024': {
    status: 'complete',
    detailVersion: 2,
    wordCount: 64,
    grammarCount: 16,
    reviewedAt: '2026-08-01',
  },
  'eng-book-g8b-2024': {
    status: 'complete',
    detailVersion: 2,
    wordCount: 64,
    grammarCount: 16,
    reviewedAt: '2026-08-01',
  },
  'eng-book-g9a-2025': {
    status: 'complete',
    detailVersion: 2,
    wordCount: 64,
    grammarCount: 16,
    reviewedAt: '2026-08-01',
  },
};

function indexById(items) {
  return new Map(items.map((item) => [item.id, item]));
}

const wordDepthById = indexById(wordDepth);
const grammarDepthById = indexById(grammarDepth);

function getWordDepth(id) {
  return wordDepthById.get(id) || null;
}

function getGrammarDepth(id) {
  return grammarDepthById.get(id) || null;
}

function mergeWordDepth(baseWord) {
  const detail = getWordDepth(baseWord.id);
  const legacyExample = {
    sentence: baseWord.example,
    translation: baseWord.translation,
    explanation: baseWord.usage,
  };

  if (!detail) {
    return baseWord;
  }

  return {
    ...baseWord,
    detailVersion: detail.detailVersion,
    hasDepth: true,
    phonetics: detail.phonetics,
    spellingVariants: detail.spellingVariants,
    senses: [{
      partOfSpeech: baseWord.partOfSpeech,
      meaning: baseWord.meaning,
      usage: baseWord.usage,
      ...detail.grammar,
    }],
    formItems: [{ label: '常用词形', value: baseWord.forms }],
    collocationDetails: baseWord.collocations.map((phrase, index) => ({
      phrase,
      meaning: detail.collocationMeanings[index],
      pattern: phrase,
    })),
    examples: [legacyExample, ...detail.extraExamples],
    distinctions: detail.distinctions,
    searchTerms: detail.searchTerms,
    review: detail.review,
  };
}

function mergeGrammarDepth(baseGrammar) {
  const detail = getGrammarDepth(baseGrammar.id);

  if (!detail) {
    return baseGrammar;
  }

  return {
    ...baseGrammar,
    detailVersion: detail.detailVersion,
    hasDepth: true,
    conditions: detail.conditions,
    variants: detail.variants,
    contrasts: detail.contrasts,
    visual: detail.visual,
    examples: [...baseGrammar.examples, ...detail.extraExamples],
    review: detail.review,
  };
}

module.exports = {
  REFERENCE_SOURCES,
  BOOK_DEPTH_STATUS,
  wordDepth,
  grammarDepth,
  getWordDepth,
  getGrammarDepth,
  mergeWordDepth,
  mergeGrammarDepth,
};
