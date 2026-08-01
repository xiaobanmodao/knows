const math = require('../packages/math/repository');
const { chapterCatalog } = require('../packages/math/data/math-curriculum');
const {
  CONNECTIONS,
  LESSON_DEPTH_SOURCE,
  MATH_LESSON_DEPTH,
} = require('../packages/math/data/details/math-lesson-depth');
const { getStableLessonId } = require('../utils/content-ids');

const issues = [];
const lessons = math.getAllChapters().flatMap((chapter) => chapter.knowledgeItems);
const lessonIds = new Set(lessons.map((item) => item.id));
const officialPairs = new Set(chapterCatalog.flatMap((chapter) => (
  chapter.officialSections.map((title) => `${chapter.id}:${title}`)
)));

function issue(owner, message) {
  issues.push(`${owner}: ${message}`);
}

function requireText(owner, value, field) {
  if (!String(value || '').trim()) issue(owner, `缺少 ${field}`);
}

function requireToken(owner, value, token) {
  if (!JSON.stringify(value || '').includes(token)) issue(owner, `缺少准确表述“${token}”`);
}

if (LESSON_DEPTH_SOURCE.length !== 89 || Object.keys(MATH_LESSON_DEPTH).length !== 89) {
  issue('详情规模', `应为 89/89，当前 ${LESSON_DEPTH_SOURCE.length}/${Object.keys(MATH_LESSON_DEPTH).length}`);
}

const relationTexts = new Set();
const whyTexts = new Set();
const sourceIds = new Set();

LESSON_DEPTH_SOURCE.forEach(([chapterId, title, condition, relation, why, connectionKey]) => {
  const owner = `${chapterId}/${title}`;
  const id = getStableLessonId(chapterId, title);
  if (!officialPairs.has(`${chapterId}:${title}`)) issue(owner, '没有映射到实际教材小节');
  if (sourceIds.has(id)) issue(owner, `稳定 ID 重复 ${id}`);
  sourceIds.add(id);
  [condition, relation, why].forEach((value, index) => requireText(owner, value, ['必要条件', '推导关系', '成立原因'][index]));
  if (!CONNECTIONS[connectionKey]) issue(owner, `跨学科联系键无效 ${connectionKey}`);
  if (relationTexts.has(relation)) issue(owner, '推导关系与其他小节重复');
  if (whyTexts.has(why)) issue(owner, '成立原因与其他小节重复');
  relationTexts.add(relation);
  whyTexts.add(why);
});

lessons.forEach((lesson) => {
  const owner = `${lesson.id}/${lesson.title}`;
  const detail = lesson.mathDetail;
  const section = (lesson.sections || []).find((item) => item.type === 'reasoning');

  if (!detail || detail.detailVersion !== 2) issue(owner, '缺少 detailVersion=2 的数学详情');
  if (!detail || detail.lessonId !== lesson.id) issue(owner, '详情 lessonId 与运行时稳定 ID 不一致');
  if (!detail || !Array.isArray(detail.conditions) || detail.conditions.length !== 2) issue(owner, '成立条件应为章节边界和小节条件两项');
  if (!detail || !Array.isArray(detail.derivations) || detail.derivations.length !== 1) issue(owner, '应有一条独立推导链');
  if (!detail || !Array.isArray(detail.whyItWorks) || detail.whyItWorks.length !== 1) issue(owner, '应有一条独立成立原因');
  if (!detail || !Array.isArray(detail.connections) || detail.connections.length !== 1) issue(owner, '应有一条跨学科联系');
  if (!detail || !Array.isArray(detail.searchTerms) || detail.searchTerms.length < 4) issue(owner, '搜索词至少包含成立原因入口和跨学科关键词');
  if (!detail || !detail.review || detail.review.status !== 'verified') issue(owner, '详情复核状态无效');
  if (!detail || !Array.isArray(detail.review.sourceKeys) || detail.review.sourceKeys.length < 3) issue(owner, '详情复核来源不足');
  if (!section) issue(owner, '推导与联系未进入知识页内容块');

  (detail && detail.derivations || []).forEach((derivation) => {
    requireText(owner, derivation.title, '推导标题');
    requireText(owner, derivation.conclusion, '推导结论');
    if (!Array.isArray(derivation.steps) || derivation.steps.length < 2) issue(owner, '推导步骤至少两步');
  });

  (detail && detail.connections || []).forEach((connection) => {
    ['key', 'title', 'description'].forEach((field) => requireText(owner, connection[field], `跨学科联系.${field}`));
    if (!Array.isArray(connection.keywords) || connection.keywords.length < 3) issue(owner, '跨学科联系关键词不足');
  });

  if (section && JSON.stringify(section.conditions) !== JSON.stringify(detail.conditions)) issue(owner, '页面成立条件与详情数据不一致');
  if (section && JSON.stringify(section.derivations) !== JSON.stringify(detail.derivations)) issue(owner, '页面推导链与详情数据不一致');
});

Object.keys(MATH_LESSON_DEPTH).forEach((id) => {
  if (!lessonIds.has(id)) issue('详情映射', `存在失效稳定 ID ${id}`);
});

[
  ['有理数减法的逆运算依据', '1.3 有理数的加减法', '相反数相加为 0'],
  ['移项来自等式性质', '3.2 解一元一次方程（一）——合并同类项与移项', '两边同时消去'],
  ['平行线判定方向', '5.2 平行线及其判定', '排除了相交'],
  ['不等号反向原因', '9.1 不等式', '数轴方向翻转'],
  ['多边形内角和分割', '11.3 多边形及其内角和', 'n-2 个三角形'],
  ['SSA 判定边界', '12.2 三角形全等的判定', 'SSA 通常'],
  ['分式方程增根', '15.3 分式方程', '增根'],
  ['勾股定理面积证明', '17.1 勾股定理', '两种拼法'],
  ['方差为何平方', '20.2 数据的波动程度', '消除正负抵消'],
  ['二次函数最值边界', '22.3 实际问题与二次函数', '现实可行域'],
  ['频率不单调', '25.3 用频率估计概率', '不会单调'],
  ['三角函数来自相似', '28.1 锐角三角函数', 'AA 相似'],
  ['三视图尺寸对应', '29.2 三视图', '长对正'],
].forEach(([label, title, token]) => {
  const lesson = lessons.find((item) => item.title === title);
  if (!lesson) issue(label, `缺少小节 ${title}`);
  else requireToken(label, lesson.mathDetail, token);
});

if (issues.length) {
  console.log('FOUND_MATH_DEPTH_ISSUES');
  issues.forEach((item) => console.log(item));
  process.exit(1);
}

console.log(`OK ${lessons.length} math details, ${relationTexts.size} unique derivations, ${whyTexts.size} unique reasons and ${Object.keys(CONNECTIONS).length} cross-subject links checked`);
