const math = require('../packages/math/repository');
const englishUnits = require('../packages/english/data/english-units');
const englishContent = require('../packages/english/data/english-content');
const physicsCurriculum = require('../packages/physics/data/physics-curriculum');
const physicsContent = require('../packages/physics/data/physics-content');

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

if (mathKnowledge.length !== 89) issues.push(`数学知识点数量应为 89，当前为 ${mathKnowledge.length}`);
if (englishUnits.units.length !== 42) issues.push(`英语单元数量应为 42，当前为 ${englishUnits.units.length}`);
if (englishUnits.vocabulary.length !== 336) issues.push(`英语单词数量应为 336，当前为 ${englishUnits.vocabulary.length}`);
if (englishUnits.grammarPoints.length !== 84) issues.push(`英语语法数量应为 84，当前为 ${englishUnits.grammarPoints.length}`);
if (physicsCurriculum.knowledgeItems.length !== 84) issues.push(`物理知识点数量应为 84，当前为 ${physicsCurriculum.knowledgeItems.length}`);

if (issues.length) {
  console.log('FOUND_CONTENT_REVIEW_META_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK review metadata checked for ${mathKnowledge.length} math lessons, ${englishUnits.units.length} English units, ${englishUnits.vocabulary.length} words, ${englishUnits.grammarPoints.length} grammar points and ${physicsCurriculum.knowledgeItems.length} physics points`);
