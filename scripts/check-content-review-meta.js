const math = require('../packages/math/repository');
const englishUnits = require('../packages/english/data/english-units');
const englishContent = require('../packages/english/data/english-content');
const physicsCurriculum = require('../packages/physics/data/physics-curriculum');
const physicsContent = require('../packages/physics/data/physics-content');
const { themes: chemistryThemes } = require('../packages/chemistry/data/chemistry-themes');
const { topics: chemistryTopics } = require('../packages/chemistry/data/chemistry-topics');
const { templates: chemistryTemplates } = require('../packages/chemistry/data/chemistry-templates');
const { knowledgeItems: chemistryKnowledge } = require('../packages/chemistry/data/chemistry-knowledge');
const { topics: biologyTopics } = require('../packages/biology/data/biology-topics');
const { knowledgeItems: biologyKnowledge } = require('../packages/biology/data/biology-knowledge');
const { templates: biologyTemplates } = require('../packages/biology/data/biology-templates');

const issues = [];

function checkMeta(item, label, subjectId) {
  const meta = item && item.contentMeta;

  if (!meta) {
    issues.push(`${label}: 缺少 contentMeta`);
    return;
  }

  if (meta.status !== 'verified' || meta.statusLabel !== '已复核') {
    issues.push(`${label}: 复核状态无效`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.reviewedAt || '')) {
    issues.push(`${label}: reviewedAt 应为 YYYY-MM-DD`);
  }

  if (!meta.sourceLabel || !meta.sourceLabel.includes('课程标准')) {
    issues.push(`${label}: 缺少课程标准来源说明`);
  }

  if (!Array.isArray(meta.sourceRefs) || meta.sourceRefs.length < 2) {
    issues.push(`${label}: sourceRefs 至少包含课程标准和教材资料`);
  } else {
    meta.sourceRefs.forEach((source, index) => {
      if (!source.title || !/^https:\/\/(www\.)?(moe\.gov\.cn|pep\.com\.cn)\//.test(source.url || '')) {
        issues.push(`${label}: 第 ${index + 1} 条来源不是教育部或人教社官方链接`);
      }
    });
  }

  const sourceText = JSON.stringify(meta);
  if (subjectId === 'math' && !sourceText.includes('数学')) issues.push(`${label}: 数学来源标识缺失`);
  if (subjectId === 'english' && !sourceText.includes('英语')) issues.push(`${label}: 英语来源标识缺失`);
  if (subjectId === 'physics' && !sourceText.includes('物理')) issues.push(`${label}: 物理来源标识缺失`);
  if (subjectId === 'chemistry' && !sourceText.includes('化学')) issues.push(`${label}: 化学来源标识缺失`);
}

function checkBiologyReview(item, label) {
  const review = item && item.review;
  if (!review) {
    issues.push(`${label}: 缺少 review`);
    return;
  }
  if (review.status !== 'reviewed') issues.push(`${label}: review.status 必须为 reviewed`);
  if (review.reviewedAt !== '2026-08-10') issues.push(`${label}: review.reviewedAt 必须为 2026-08-10`);
  if (!Array.isArray(review.sourceKeys) || review.sourceKeys.length < 2) {
    issues.push(`${label}: review.sourceKeys 至少包含两条来源`);
  }
}

const mathKnowledge = math.getAllChapters().flatMap((chapter) => chapter.knowledgeItems);
mathKnowledge.forEach((item) => checkMeta(item, `数学/${item.title}`, 'math'));

englishUnits.units.forEach((unit) => {
  checkMeta(unit, `英语单元/${unit.bookLabel}/${unit.unitLabel}`, 'english');
  unit.vocabulary.forEach((word) => checkMeta(word, `英语单词/${unit.id}/${word.word}`, 'english'));
  unit.grammarPoints.forEach((point) => checkMeta(point, `英语语法/${unit.id}/${point.title}`, 'english'));
});

englishContent.knowledgeItems.forEach((item) => checkMeta(item, `英语专题/${item.title}`, 'english'));
physicsCurriculum.knowledgeItems.forEach((item) => checkMeta(item, `物理章节/${item.title}`, 'physics'));
physicsContent.knowledgeItems.forEach((item) => checkMeta(item, `物理专题/${item.title}`, 'physics'));
chemistryThemes.forEach((item) => checkMeta(item, `化学主题/${item.title}`, 'chemistry'));
chemistryTopics.forEach((item) => checkMeta(item, `化学专题/${item.title}`, 'chemistry'));
chemistryTemplates.forEach((item) => checkMeta(item, `化学方法/${item.title}`, 'chemistry'));
chemistryKnowledge.forEach((item) => checkMeta(item, `化学知识/${item.title}`, 'chemistry'));
biologyTopics.forEach((item) => checkBiologyReview(item, `生物专题/${item.title}`));
biologyKnowledge.forEach((item) => {
  checkBiologyReview(item, `生物知识/${item.title}`);
  if (item.safetyObservation) checkBiologyReview(item.safetyObservation, `生物观察/${item.safetyObservation.id || item.title}`);
});
biologyTemplates.forEach((item) => checkBiologyReview(item, `生物方法/${item.title}`));

if (mathKnowledge.length !== 89) issues.push(`数学知识点数量应为 89，当前为 ${mathKnowledge.length}`);
if (englishUnits.units.length !== 42) issues.push(`英语单元数量应为 42，当前为 ${englishUnits.units.length}`);
if (englishUnits.vocabulary.length !== 336) issues.push(`英语单词数量应为 336，当前为 ${englishUnits.vocabulary.length}`);
if (englishUnits.grammarPoints.length !== 84) issues.push(`英语语法数量应为 84，当前为 ${englishUnits.grammarPoints.length}`);
if (physicsCurriculum.knowledgeItems.length !== 84) issues.push(`物理知识点数量应为 84，当前为 ${physicsCurriculum.knowledgeItems.length}`);
if (chemistryThemes.length !== 5) issues.push(`化学课标主题数量应为 5，当前为 ${chemistryThemes.length}`);
if (chemistryTopics.length !== 10) issues.push(`化学专题数量应为 10，当前为 ${chemistryTopics.length}`);
if (chemistryKnowledge.length !== 40) issues.push(`化学知识点数量应为 40，当前为 ${chemistryKnowledge.length}`);
if (chemistryTemplates.length !== 12) issues.push(`化学方法数量应为 12，当前为 ${chemistryTemplates.length}`);
if (biologyTopics.length !== 6) issues.push(`生物专题数量应为 6，当前为 ${biologyTopics.length}`);
if (biologyKnowledge.length !== 36) issues.push(`生物知识点数量应为 36，当前为 ${biologyKnowledge.length}`);
if (biologyTemplates.length !== 6) issues.push(`生物方法数量应为 6，当前为 ${biologyTemplates.length}`);
if (biologyKnowledge.filter((item) => item.safetyObservation).length !== 6) {
  issues.push('生物受控观察数量应为 6');
}

if (issues.length) {
  console.log('FOUND_CONTENT_REVIEW_META_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(
  `OK review metadata checked for ${mathKnowledge.length} math lessons, ${englishUnits.units.length} English units, `
    + `${englishUnits.vocabulary.length} words, ${englishUnits.grammarPoints.length} grammar points, `
    + `${physicsCurriculum.knowledgeItems.length} physics points, ${chemistryKnowledge.length} chemistry points, `
    + `${biologyKnowledge.length} biology points and ${biologyTemplates.length} biology templates`,
);
