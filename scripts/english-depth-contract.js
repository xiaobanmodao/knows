const {
  wordDepth,
  grammarDepth,
} = require('../packages/english/data/details');

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function collectEnglishDepthContractIssues(english) {
  const issues = [];
  const words = english && english.vocabulary || [];
  const grammarPoints = english && english.grammarPoints || [];
  const wordsById = new Map(words.map((item) => [item.id, item]));
  const grammarById = new Map(grammarPoints.map((item) => [item.id, item]));
  const depthWordIds = new Set(wordDepth.map((item) => item.id));
  const depthGrammarIds = new Set(grammarDepth.map((item) => item.id));

  wordDepth.forEach((detail) => {
    const word = wordsById.get(detail.id);
    const owner = `单词补深/${detail.id}`;
    if (!word) {
      issues.push(`${owner}: 运行时缺少单词`);
      return;
    }

    if (word.detailVersion !== detail.detailVersion || word.hasDepth !== true) {
      issues.push(`${owner}: 运行时补深版本未同步`);
    }
    ['phonetics', 'spellingVariants', 'distinctions', 'searchTerms', 'review'].forEach((field) => {
      if (!same(word[field], detail[field])) issues.push(`${owner}: 运行时${field}未同步`);
    });

    const expectedSense = [{
      partOfSpeech: word.partOfSpeech,
      meaning: word.meaning,
      usage: word.usage,
      ...(detail.grammar || {}),
    }];
    if (!same(word.senses, expectedSense)) issues.push(`${owner}: 运行时词义分项未同步`);

    const expectedForms = [{ label: '常用词形', value: word.forms }];
    if (!same(word.formItems, expectedForms)) issues.push(`${owner}: 运行时词形未同步`);

    const expectedCollocations = (word.collocations || []).map((phrase, index) => ({
      phrase,
      meaning: detail.collocationMeanings && detail.collocationMeanings[index],
      pattern: phrase,
    }));
    if (!same(word.collocationDetails, expectedCollocations)) issues.push(`${owner}: 运行时搭配未同步`);

    const expectedLegacyExample = {
      sentence: word.example,
      translation: word.translation,
      explanation: word.usage,
    };
    if (!same(word.examples && word.examples[0], expectedLegacyExample)) {
      issues.push(`${owner}: 运行时基础例句未同步`);
    }
    if (!same((word.examples || []).slice(1), detail.extraExamples)) {
      issues.push(`${owner}: 运行时补深例句未同步`);
    }
  });

  grammarDepth.forEach((detail) => {
    const grammar = grammarById.get(detail.id);
    const owner = `语法补深/${detail.id}`;
    if (!grammar) {
      issues.push(`${owner}: 运行时缺少语法点`);
      return;
    }

    if (grammar.detailVersion !== detail.detailVersion || grammar.hasDepth !== true) {
      issues.push(`${owner}: 运行时补深版本未同步`);
    }
    ['conditions', 'variants', 'contrasts', 'visual', 'review'].forEach((field) => {
      if (!same(grammar[field], detail[field])) issues.push(`${owner}: 运行时${field}未同步`);
    });
    const extraExamples = detail.extraExamples || [];
    const runtimeExtraExamples = extraExamples.length ? grammar.examples.slice(-extraExamples.length) : [];
    if (extraExamples.length > grammar.examples.length || !same(runtimeExtraExamples, extraExamples)) {
      issues.push(`${owner}: 运行时补深例句未同步`);
    }
  });

  words.filter((word) => word.hasDepth && !depthWordIds.has(word.id)).forEach((word) => {
    issues.push(`单词补深/${word.id}: 运行时存在未登记的补深实体`);
  });
  grammarPoints.filter((grammar) => grammar.hasDepth && !depthGrammarIds.has(grammar.id)).forEach((grammar) => {
    issues.push(`语法补深/${grammar.id}: 运行时存在未登记的补深实体`);
  });

  return issues;
}

module.exports = {
  collectEnglishDepthContractIssues,
};
