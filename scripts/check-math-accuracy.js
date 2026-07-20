const math = require('../utils/math');
const { knowledgeList: legacyKnowledgeList } = require('../data/math-data');
const { chapterCatalog, templateLibrary } = require('../data/math-curriculum');
const { lessonFactsMap } = require('../data/math-lesson-facts');
const { lessonFormulaMap } = require('../data/math-lesson-formulas');

const issues = [];
const chapters = math.getAllChapters();
const lessons = chapters.flatMap((chapter) => chapter.knowledgeItems);
const problems = lessons.flatMap((lesson) => lesson.problems || []);
const officialTitles = chapterCatalog.flatMap((chapter) => chapter.officialSections);

function issue(owner, message) {
  issues.push(`${owner}: ${message}`);
}

function combinedText(value) {
  return JSON.stringify(value || '');
}

function requireTokens(owner, value, tokens) {
  const content = combinedText(value);
  tokens.forEach((token) => {
    if (!content.includes(token)) issue(owner, `缺少成立条件或准确表述“${token}”`);
  });
}

function forbidTokens(owner, value, tokens) {
  const content = combinedText(value);
  tokens.forEach((token) => {
    if (content.includes(token)) issue(owner, `仍包含已废弃或不严谨表述“${token}”`);
  });
}

function getLesson(title) {
  const lesson = lessons.find((item) => item.title === title);
  if (!lesson) issue('章节知识', `缺少待复核小节“${title}”`);
  return lesson || {};
}

function getFormula(title) {
  const formula = (getLesson(title).sections || []).find((section) => section.type === 'formula');
  if (!formula) issue(title, '缺少关键公式与结论');
  return formula || {};
}

function getProblem(title, stemToken) {
  const problem = (getLesson(title).problems || []).find((item) => item.stem.includes(stemToken));
  if (!problem) issue(title, `缺少待复核例题“${stemToken}”`);
  return problem || {};
}

function getTemplate(id) {
  const template = templateLibrary.find((item) => item.id === id);
  if (!template) issue('题型模板', `缺少待复核模板 ${id}`);
  return template || {};
}

if (chapters.length !== 29) issue('内容规模', `章节数应为 29，当前为 ${chapters.length}`);
if (lessons.length !== 89) issue('内容规模', `教材小节数应为 89，当前为 ${lessons.length}`);
if (problems.length !== 445) issue('内容规模', `原创示例数应为 445，当前为 ${problems.length}`);
if (legacyKnowledgeList.length !== 36) issue('兼容内容', `旧链接知识数应为 36，当前为 ${legacyKnowledgeList.length}`);

const titleSet = new Set(officialTitles);
if (titleSet.size !== officialTitles.length) issue('目录', '教材小节标题存在重复');
if (Object.keys(lessonFactsMap).length !== officialTitles.length) {
  issue('知识事实', `应逐节覆盖 ${officialTitles.length} 节，当前为 ${Object.keys(lessonFactsMap).length}`);
}
if (Object.keys(lessonFormulaMap).length !== officialTitles.length) {
  issue('公式结论', `应逐节覆盖 ${officialTitles.length} 节，当前为 ${Object.keys(lessonFormulaMap).length}`);
}

officialTitles.forEach((title) => {
  if (!lessonFactsMap[title]) issue(title, '缺少独立知识事实');
  if (!lessonFormulaMap[title]) issue(title, '缺少独立公式或结论');
});

Object.keys(lessonFactsMap).forEach((title) => {
  if (!titleSet.has(title)) issue(title, '知识事实未映射到实际教材小节');
});
Object.keys(lessonFormulaMap).forEach((title) => {
  if (!titleSet.has(title)) issue(title, '公式结论未映射到实际教材小节');
});

const lessonIds = new Set();
lessons.forEach((lesson) => {
  if (lessonIds.has(lesson.id)) issue(lesson.title, `稳定 ID 重复：${lesson.id}`);
  lessonIds.add(lesson.id);

  if (!Array.isArray(lesson.knowledgePoints) || lesson.knowledgePoints.length < 3) {
    issue(lesson.title, '具体知识点至少应有 3 条');
  }
  if (!Array.isArray(lesson.problems) || lesson.problems.length !== 5) {
    issue(lesson.title, `原创示例应为 5 道，当前为 ${(lesson.problems || []).length}`);
  }

  const expected = lessonFormulaMap[lesson.title];
  const runtimeFormula = (lesson.sections || []).find((section) => section.type === 'formula');
  if (!runtimeFormula || runtimeFormula.formula !== expected?.formula) {
    issue(lesson.title, '运行时公式与逐节公式映射不一致');
  }
  if (!runtimeFormula || !runtimeFormula.description.includes(expected?.description || '__missing__')) {
    issue(lesson.title, '运行时公式说明与逐节公式映射不一致');
  }

  (lesson.problems || []).forEach((problem, index) => {
    const owner = `${lesson.title}/例题${index + 1}`;
    ['stem', 'answer', 'analysis'].forEach((field) => {
      if (!String(problem[field] || '').trim()) issue(owner, `缺少 ${field}`);
    });
  });
});

const allRuntimeContent = {
  chapters,
  legacyKnowledgeList,
  lessonFactsMap,
  lessonFormulaMap,
  templateLibrary,
  studyMap: math.getMathStudyMap(),
};

forbidTokens('数学运行内容', allRuntimeContent, [
  '平面图形与立体图形的区别在于是否具有厚度',
  '未知数次数都是 1',
  '常用口决',
  '端点是否取到要看不等号是开口还是闭口',
  '公式法和因式分解法是常用通法',
  '频率会逐渐稳定在某个值附近',
  '汇聚光线形成中心投影',
  '方差或波动程度',
  '用长 10 的线围成矩形',
  '约 25 cm²',
  '笔 3 元，本子 5 元',
  '学完自测',
  '单元输出任务',
  '测评任务',
  '先理解成一个小工具',
  '先围绕“',
  '并能围绕“',
  '做完题后回看本节易错点',
]);

requireTokens('直角三角形全等', getFormula('12.2 三角形全等的判定'), ['直角三角形', 'HL', 'SSA 不能']);
requireTokens('角平分线逆命题', getFormula('12.3 角的平分线的性质'), ['角的内部', '垂线段']);
requireTokens('分式定义', getFormula('15.1 分式'), ['B 含有字母', 'B≠0']);
requireTokens('分式乘除', getFormula('15.2 分式的运算'), ['b≠0', 'c≠0', 'd≠0', '除式']);
requireTokens('函数定义', getLesson('19.1 函数'), ['允许范围', '唯一确定', '不同 x 可以对应同一个 y']);
requireTokens('数据集中趋势', getLesson('20.1 数据的集中趋势'), ['四分位数', '众数可能不止一个', '也可能不存在']);
requireTokens('四分位数图示映射', getLesson('20.1 数据的集中趋势').sourceImage, ['model-data-quartiles.png']);
requireTokens('一元二次方程求根', getFormula('21.2 解一元二次方程'), ['a≠0', 'Δ=b²-4ac≥0', 'Δ<0', '没有实数根']);
requireTokens('二次函数开口宽窄', getLesson('22.1 二次函数的图象和性质'), ['h、k 相同', '|a| 越大', '开口越窄']);
requireTokens('弧长与扇形', getFormula('24.4 弧长和扇形面积'), ['l=nπr/180', 'S=nπr²/360=lr/2', '圆心角度数']);
requireTokens('等可能概率', getFormula('25.2 用列举法求概率'), ['有限', '等可能', '不能直接用结果个数相除']);
requireTokens('频率估计', getLesson('25.3 用频率估计概率'), ['附近波动', '不保证单调接近', '近似值']);
requireTokens('反比例函数单调性', getLesson('26.1 反比例函数'), ['第一、三象限', '第二、四象限', '每一支上', '不经过坐标轴']);
requireTokens('位似坐标', getFormula('27.3 位似'), ['位似中心为原点', 'k<0', '中心两侧']);
requireTokens('坡度定义', getFormula('28.2 解直角三角形'), ['铅直高度', '水平长度', '坡面与水平面的锐角']);
requireTokens('投影定义', getFormula('29.1 投影'), ['互相平行', '经过同一点', '同一点发出']);
requireTokens('投影图示映射', getLesson('29.1 投影').sourceImage, ['model-projection-types.png']);

requireTokens('分式除法限制例题', getProblem('15.2 分式的运算', '÷'), ['x≠1', 'x≠-1']);
requireTokens('四分位数例题', getProblem('20.1 数据的集中趋势', '上下两半数据各自中位数'), ['4.5', '11']);
requireTokens('包装纸盒粘贴边', getProblem('4.4 课题学习 设计制作长方体形状的包装纸盒', '粘贴边'), ['5 cm²']);
requireTokens('二次函数面积建模', getProblem('22.3 实际问题与二次函数', '长与宽之和为 10'), ['0<x<10', 'x(10-x)']);
requireTokens('反比例工程建模', getProblem('26.2 实际问题与反比例函数', '120 个工日'), ['效率相同', '正整数']);
requireTokens('投影影长边界', getProblem('29.1 投影', '固定路灯高度'), ['水平地面', '影子变长']);

const parallelJudgment = getLesson('5.2 平行线及其判定');
(parallelJudgment.problems || []).slice(0, 3).forEach((problem, index) => {
  if (/已知.*(?:∥|平行)/.test(problem.stem)) issue(`5.2/例题${index + 1}`, '判定题不应预先给出两直线平行');
});

const parallelProperties = getLesson('5.3 平行线的性质');
(parallelProperties.problems || []).slice(0, 3).forEach((problem, index) => {
  if (!/(?:∥|平行线)/.test(problem.stem)) issue(`5.3/例题${index + 1}`, '性质题应明确已知两直线平行');
});

requireTokens('中位线模板', getTemplate('model-midpoint'), ['三角形中位线', '第三边', '一半']);
requireTokens('切线模板', getTemplate('model-tangent'), ['过切点的半径', '圆外同一点', '两条切线长相等']);
requireTokens('概率专题', math.getMathStudyMap(), ['只有确认各基本结果等可能时', '不能把少量频率当作固定概率']);

const legacyLinear = legacyKnowledgeList.find((item) => item.id === 'linear-function-application') || {};
requireTokens('兼容一次函数内容', legacyLinear, ['固定服务费', 'x≥0']);
const legacyQuadratic = legacyKnowledgeList.find((item) => item.id === 'quadratic-solve') || {};
requireTokens('兼容求根公式', legacyQuadratic, ['a≠0', 'b^2-4ac≥0', '实数范围']);

if (issues.length) {
  console.log('FOUND_MATH_ACCURACY_ISSUES');
  issues.forEach((item) => console.log(item));
  process.exit(1);
}

console.log(`OK ${chapters.length} chapters, ${lessons.length} lessons, ${problems.length} examples, ${legacyKnowledgeList.length} legacy entries checked for mathematical accuracy boundaries`);
