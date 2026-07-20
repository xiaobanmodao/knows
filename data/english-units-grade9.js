const { createBook, createUnit, grammar } = require('./english-unit-builder');

const g = grammar;

function unit(config) {
  return createUnit({ expressions: [], ...config });
}

const grade9Upper = createBook({
  id: 'eng-book-g9a-2025', gradeId: 'g9', semester: 'upper', label: '九年级上册', shortLabel: '九上',
  edition: '新版教材', status: 'verified', sourceNote: '单元标题和顺序已按当前公开的人教版九年级上册新版教材核对；词汇用法、语法讲解和例句由本项目按单元主题原创整理，不作为教材逐页词表。',
  units: [
    unit({
      id: 'eng-unit-g9a-changing-world', number: 1, title: 'The Changing World', theme: '社会变化与适应',
      expressions: ['Life has changed greatly in recent years.', 'Technology has replaced some routine tasks.', 'We need to adapt while keeping what matters.'],
      vocabulary: [
        ['change', '名词/动词', '变化；改变；零钱', '可及物或不及物，change into 表示变成。', 'changes；changed；changing。', ['social change', 'change into'], 'Online services have changed the way people shop.', '在线服务改变了人们购物的方式。', 'change 指具体变化时可数，泛指变化过程时可作不可数名词。'],
        ['develop', '动词', '发展；培养；开发', '既可描述事物发展，也可主动培养能力。', 'develops；developed；developing；名词 development。', ['develop skills', 'develop rapidly'], 'The town has developed rapidly since the new railway opened.', '新铁路开通后，这座城镇发展很快。', 'developing 可指发展中的，developed 可指发达的。'],
        ['technology', '名词', '科技；技术', '通常不可数，具体技术体系可数。', '复数 technologies；形容词 technological。', ['digital technology', 'technological change'], 'Technology should solve real problems rather than create new ones.', '科技应解决真实问题，而不是制造新问题。', 'technology 不是单个电子设备。'],
        ['replace', '动词', '取代；替换', 'replace A with B 表示用 B 替换 A。', 'replaces；replaced；replacing；名词 replacement。', ['replace ... with ...', 'be replaced by'], 'Reusable cups can replace some single-use ones.', '可重复使用的杯子能替代部分一次性杯子。', '主动结构介词用 with，被动结构用 by。'],
        ['adapt', '动词', '适应；改编', 'adapt to 表示适应；adapt A for/from 表示改编。', 'adapts；adapted；adapting；名词 adaptation。', ['adapt to change', 'adapt a story for'], 'Students learn to adapt to different learning environments.', '学生学习适应不同的学习环境。', 'adapt to 中 to 是介词，后可接 doing。'],
        ['progress', '名词/动词', '进步；进展', '作名词通常不可数，make progress。', '动词 progresses；progressed；progressing。', ['make progress', 'scientific progress'], 'The project has made steady progress this month.', '项目本月取得了稳步进展。', '不能说 make a progress。'],
        ['modern', '形容词', '现代的；现代化的', '修饰生活、技术、艺术等。', '名词 modernization；动词 modernize。', ['modern society', 'modern method'], 'Modern transport connects distant places quickly.', '现代交通快速连接相距遥远的地方。', 'modern 不一定等于 better，评价仍需证据。'],
        ['compare', '动词', '比较；把……比作', 'compare A with B 比较异同；compare A to B 也可比作。', 'compares；compared；comparing；名词 comparison。', ['compare with', 'by comparison'], 'Compare the benefits with the possible costs.', '把益处与可能的代价进行比较。', 'comparison 是名词，常用 make a comparison。'],
      ],
      grammar: [
        g('present-perfect-change', '现在完成时：变化与延续', 'have/has + 过去分词连接过去与现在；since 标起点，for 标时长，in recent years 标近期变化。', ['have/has + 过去分词', 'since + 时间点/从句', 'for + 时间段'], [['Public transport has improved in recent years.', '近年来公共交通已经改善。', '变化结果与现在相关。'], ['The library has offered online services since 2023.', '图书馆自 2023 年起提供在线服务。', 'since 标明起点。']], ['与明确结束的过去时间 last year 随意同用。', 'since 后接时间段。']),
        g('used-to-contrast', 'used to、be used to 与 get used to', 'used to do 表示过去习惯；be/get used to doing 表示习惯于某事，to 是介词。', ['used to + 动词原形', 'be used to + 名词/doing', 'get used to + 名词/doing'], [['People used to pay mostly in cash.', '人们过去主要用现金付款。', '描述已改变的过去习惯。'], ['Many users are used to checking maps on their phones.', '许多用户已经习惯在手机上查看地图。', 'to 后接 checking。']], ['be used to 后接动词原形。', '把 used to do 误解为现在仍然如此。']),
      ],
    }),
    unit({
      id: 'eng-unit-g9a-inspiring-people', number: 2, title: 'Inspiring People', theme: '榜样人物与社会贡献',
      expressions: ['Her work has inspired many young people.', 'It was courageous of him to keep trying.', 'What matters is how the person helped others.'],
      vocabulary: [
        ['inspire', '动词', '激励；启发', 'inspire sb to do 表示激励某人做某事；inspire confidence/an idea 表示激发信心或想法。', 'inspires；inspired；inspiring；名词 inspiration。', ['inspire somebody to do', 'draw inspiration from'], 'Her careful research inspired me to ask better questions.', '她严谨的研究激励我提出更好的问题。', '人感到鼓舞用 inspired，事物鼓舞人心用 inspiring。'],
        ['admire', '动词', '钦佩；欣赏', 'admire sb for sth/doing。', 'admires；admired；admiring；名词 admiration。', ['admire ... for ...', 'greatly admire'], 'I admire the doctor for serving remote communities.', '我钦佩这位医生服务偏远社区。', 'admire 后直接接人，不加 to。'],
        ['pioneer', '名词/动词', '先驱；开拓', '指率先进入某领域或发展新方法的人。', '复数 pioneers；pioneered；pioneering。', ['a pioneer in', 'pioneer a method'], 'She was a pioneer in environmental education.', '她是环境教育领域的先驱。', '领域前常用介词 in。'],
        ['discovery', '名词', '发现；被发现的事物', '动词 discover，指发现原本存在但未知的事物。', '复数 discoveries。', ['scientific discovery', 'make a discovery'], 'The discovery changed how scientists understood the disease.', '这一发现改变了科学家对疾病的认识。', 'invent 是创造新事物，discover 是发现已有事物。'],
        ['contribution', '名词', '贡献；捐献', 'make a contribution to；动词 contribute。', '复数 contributions。', ['make a contribution to', 'major contribution'], 'Her greatest contribution was making the method widely available.', '她最大的贡献是让这种方法得到广泛使用。', 'to 是介词，后可接 doing。'],
        ['courage', '名词', '勇气', '不可数；have the courage to do。', '形容词 courageous；副词 courageously。', ['show courage', 'have the courage to'], 'It takes courage to admit that an idea has failed.', '承认一个想法失败需要勇气。', 'courageous 是形容词，不写 couragous。'],
        ['devote', '动词', '奉献；专心', 'devote time/oneself to 名词或 doing。', 'devotes；devoted；devoting；形容词 devoted。', ['devote ... to ...', 'be devoted to'], 'He devoted decades to improving rural education.', '他用数十年改善乡村教育。', 'to 是介词，后接 improving。'],
        ['admirable', '形容词', '令人钦佩的', '描述行为或品质值得尊敬。', '动词 admire；名词 admiration。', ['admirable quality', 'truly admirable'], 'Her honesty in reporting the mistake was admirable.', '她如实报告错误的行为令人钦佩。', '人对某事钦佩可用 be impressed by，不用 admired 表示主动感受。'],
      ],
      grammar: [
        g('it-adjective-infinitive', 'It is + 形容词 + for/of sb to do', 'for sb 说明动作对谁而言；of sb 评价人的品格。', ['It is + 形容词 + for sb + to do', 'It is + 品格形容词 + of sb + to do'], [['It is difficult for one person to change a system alone.', '一个人很难独自改变一个系统。', 'difficult 描述事情难度，用 for。'], ['It was generous of her to share the research freely.', '她免费分享研究成果，真慷慨。', 'generous 评价人的品质，用 of。']], ['所有形容词后一律用 for。', 'to 后使用动名词。']),
        g('attributive-clauses-people', 'who/that 引导人物定语从句', 'who 或 that 指人，在从句中作主语或宾语；从句紧跟被修饰名词。', ['a person who/that + 谓语', 'a person (who/that) + 主语 + 谓语'], [['We remember people who improve other lives.', '我们铭记改善他人生活的人。', 'who 在从句作主语，不能省略。'], ['The scientist that we interviewed works on clean energy.', '我们采访的科学家研究清洁能源。', 'that 作宾语时可省略。']], ['关系词后重复 he/she。', '关系词作主语时随意省略。']),
      ],
    }),
    unit({
      id: 'eng-unit-g9a-smart-learning', number: 3, title: 'Smart Learning', theme: '学习策略与数字素养',
      expressions: ['This strategy helps me remember more effectively.', 'I learn by connecting new ideas with old ones.', 'Digital tools are useful only when used purposefully.'],
      vocabulary: [
        ['strategy', '名词', '策略；行动方案', '指为实现目标设计的一组方法。', '复数 strategies。', ['learning strategy', 'use a strategy'], 'Changing strategies can solve different learning problems.', '改变策略可以解决不同的学习问题。', 'method 偏具体方法，strategy 更强调整体安排。'],
        ['efficient', '形容词', '高效的；效率高的', '强调用较少时间、精力或资源取得结果。', '比较级 more efficient；名词 efficiency；副词 efficiently。', ['efficient way', 'work efficiently'], 'Short focused reviews can be more efficient than rereading.', '短时专注复习可能比重复阅读更高效。', 'effective 强调有效，efficient 还强调投入产出。'],
        ['resource', '名词', '资源；资料', '学习资源包括书籍、课程、人员和工具。', '复数 resources。', ['learning resource', 'online resources'], 'Choose reliable resources instead of opening too many pages.', '选择可靠资源，不要同时打开太多页面。', 'information 通常不可数，resource 可数。'],
        ['podcast', '名词', '播客；播客节目', '可数名词，可用 listen to。', '复数 podcasts。', ['listen to a podcast', 'educational podcast'], 'I replayed a short podcast to notice the speaker’s linking.', '我重播短播客以留意说话者的连读。', 'listen 后接对象要加 to。'],
        ['review', '动词/名词', '复习；回顾；评论', '学习语境中指间隔后重新提取知识。', 'reviews；reviewed；reviewing。', ['review notes', 'weekly review'], 'Review new words before you begin the next unit.', '开始下一单元前复习新词。', 'review 不等同于只重新阅读。'],
        ['concentrate', '动词', '集中注意力；浓缩', 'concentrate on 名词或 doing。', 'concentrates；concentrated；concentrating；名词 concentration。', ['concentrate on', 'improve concentration'], 'I concentrate better when notifications are off.', '关闭通知时我更能集中注意力。', '介词固定为 on。'],
        ['method', '名词', '方法；办法', 'method of/for doing 表示做某事的方法。', '复数 methods。', ['study method', 'method of doing'], 'The teacher showed us a method for checking sources.', '老师教我们一种核查来源的方法。', '不能说 method to doing。'],
        ['digital', '形容词', '数字的；数码的', '修饰设备、资源、技能和环境。', '副词 digitally。', ['digital tool', 'digital literacy'], 'Digital notes are useful when they are well organized.', '数字笔记整理得当时很有用。', 'digital literacy 包括判断信息质量，不只是会操作设备。'],
      ],
      grammar: [
        g('by-gerund', 'by + doing 表示方式', '介词 by 后接动名词，说明通过何种行动实现结果。', ['主语 + 谓语 + by + doing', 'How ...? — By + doing.'], [['I remember terms by using them in short sentences.', '我通过在短句中使用术语来记忆。', 'by using 说明方式。'], ['She improved her listening by slowing down the recording.', '她通过降低录音速度提高听力。', '介词后用 slowing。']], ['by 后使用动词原形。', '把方式 by 与截止时间 by 混为一谈。']),
        g('question-clauses-learning', '学习反思中的宾语从句', 'ask、know、find out、explain 后可接 what/how/why 引导的宾语从句，从句用陈述语序。', ['find out + 疑问词 + 陈述语序', 'explain why/how + 陈述语序'], [['Find out which method works best for you.', '找出哪种方法最适合你。', 'which method 在从句中作主语。'], ['Can you explain why this source is reliable?', '你能解释这个来源为什么可靠吗？', '从句为 this source is。']], ['从句写成 why is this source reliable。', '疑问词后随意加 do/does。']),
      ],
    }),
    unit({
      id: 'eng-unit-g9a-our-memory', number: 4, title: 'Our Memory', theme: '记忆机制与学习实践',
      expressions: ['This smell reminds me of my first school.', 'I can recall the idea but not the exact words.', 'Spaced review improves long-term memory.'],
      vocabulary: [
        ['memory', '名词', '记忆力；记忆；回忆', '可指能力、记忆系统或具体回忆。', '复数 memories。', ['long-term memory', 'childhood memory'], 'Sleep plays an important role in memory.', '睡眠在记忆中起重要作用。', '表示能力时常不可数，具体回忆可数。'],
        ['memorize', '动词', '记住；熟记', '强调有意识地把信息存入记忆。', 'memorizes；memorized；memorizing；名词 memorization。', ['memorize a poem', 'memorize by doing'], 'Do not memorize a rule without understanding it.', '不要在不理解的情况下死记规则。', '英式也写 memorise。'],
        ['remind', '动词', '提醒；使想起', 'remind sb to do/of sth/that ...。', 'reminds；reminded；reminding。', ['remind ... of ...', 'remind ... to ...'], 'This photo reminds me of our first science project.', '这张照片让我想起第一个科学项目。', 'remember 是自己记得，remind 是使别人想起。'],
        ['recall', '动词/名词', '回想；记起', '强调从记忆中主动提取。', 'recalls；recalled；recalling。', ['recall information', 'recall doing'], 'Try to recall the answer before checking your notes.', '查看笔记前先尝试回想答案。', 'recall doing 表示回想做过某事。'],
        ['method', '名词', '方法', '可与记忆、研究或解决问题搭配。', '复数 methods。', ['memory method', 'effective method'], 'The keyword method connects a new word with a familiar image.', '关键词法把新词和熟悉图像联系起来。', 'method 需要与目标匹配，不存在万能方法。'],
        ['association', '名词', '联想；联系；协会', '记忆语境中指信息间的心理连接。', '复数 associations；动词 associate。', ['word association', 'association between'], 'A vivid association can make a word easier to recall.', '生动联想能让单词更容易被回想。', 'associate A with B 表示把两者联系。'],
        ['forgetful', '形容词', '健忘的', '描述经常忘事的人或状态。', '比较级 more forgetful；动词 forget。', ['become forgetful', 'forgetful person'], 'Being tired can make anyone more forgetful.', '疲劳会让任何人更健忘。', 'forgotten 是 forget 的过去分词，不是形容人的常用词。'],
        ['improve', '动词', '提高；改善', '既可及物也可不及物。', 'improves；improved；improving；名词 improvement。', ['improve memory', 'improve gradually'], 'Retrieval practice improves memory more than passive rereading.', '提取练习比被动重读更能改善记忆。', 'improve 不需要搭配 up。'],
      ],
      grammar: [
        g('verb-patterns-memory', 'remember、forget、stop 的 do/doing 差异', 'to do 指尚未完成的事，doing 指回忆已经做过的事；stop to do 是停下原事去做另一事。', ['remember/forget to do', 'remember/forget doing', 'stop to do / stop doing'], [['Remember to review the cards tomorrow.', '记得明天复习卡片。', '动作尚未发生。'], ['I remember seeing this diagram before.', '我记得以前见过这张图。', 'seeing 已经发生。']], ['把 remember to do 理解为回忆过去。', 'stop to do 与 stop doing 混淆。']),
        g('comparisons-memory', '比较结构表达方法效果', '比较级、as ... as 和 the more ... the more ... 可用于比较记忆方法及变量关系。', ['比较级 + than', 'as + 原级 + as', 'The more ..., the more ...'], [['Active recall is more effective than simply copying notes.', '主动回忆比单纯抄笔记更有效。', '用比较级评价方法。'], ['The more often you retrieve an idea, the easier it becomes to recall.', '提取一个观点越频繁，回想就越容易。', '两个 the + 比较级表示同步变化。']], ['the more 后使用原级。', 'more effective 与 -er 重复。']),
      ],
    }),
    unit({
      id: 'eng-unit-g9a-power-of-ideas', number: 5, title: 'Power of Ideas', theme: '创意、问题解决与实践验证',
      expressions: ['The idea was created to solve a daily problem.', 'The first design did not work as expected.', 'A useful solution must be tested and improved.'],
      vocabulary: [
        ['idea', '名词', '想法；主意；观念', '可数名词，可与 have、suggest、develop 搭配。', '复数 ideas。', ['come up with an idea', 'main idea'], 'A strong idea begins with a clearly defined problem.', '好创意始于定义清楚的问题。', 'idea 本身不是完成的 solution。'],
        ['creative', '形容词', '有创造力的；创新的', '描述人、想法或过程。', '名词 creativity；动词 create；副词 creatively。', ['creative solution', 'think creatively'], 'Constraints sometimes lead to more creative solutions.', '限制有时会带来更有创意的方案。', 'creative 不代表脱离实际。'],
        ['solution', '名词', '解决办法；溶液', 'solution to a problem。', '复数 solutions；动词 solve。', ['solution to', 'practical solution'], 'The team proposed a simple solution to food waste.', '团队提出一个减少食物浪费的简单方案。', '介词固定为 to，不用 of。'],
        ['invent', '动词', '发明', '创造以前没有的装置或方法。', 'invents；invented；inventing；名词 invention/inventor。', ['invent a tool', 'useful invention'], 'The students invented a device that waters plants slowly.', '学生发明了缓慢给植物浇水的装置。', 'discover 指发现原本存在的事物。'],
        ['imagine', '动词', '想象；设想', 'imagine doing 或 imagine that ...。', 'imagines；imagined；imagining；名词 imagination。', ['imagine doing', 'imagine a future'], 'Imagine using rainwater to clean the playground.', '设想用雨水清洁操场。', 'imagine 后通常不接 to do。'],
        ['experiment', '名词/动词', '实验；试验', 'do/conduct an experiment；experiment with。', '复数 experiments；experimented；experimenting。', ['conduct an experiment', 'experiment with'], 'We conducted an experiment to compare two materials.', '我们做实验比较两种材料。', '实验需要变量、证据和可重复步骤。'],
        ['design', '名词/动词', '设计；图样', 'design sth for sb/purpose。', '复数 designs；designed；designing；名词 designer。', ['design a product', 'be designed for'], 'The handle was designed for younger users.', '这个手柄是为低龄用户设计的。', 'design for 强调使用对象或目的。'],
        ['practical', '形容词', '实用的；可行的', '强调能在真实条件下实施。', '比较级 more practical；名词 practicality。', ['practical idea', 'practical skills'], 'The second plan is cheaper and more practical.', '第二个方案更便宜也更可行。', 'practical 与 practicable 接近，practice 是名词/动词。'],
      ],
      grammar: [
        g('passive-process', '一般过去时和一般现在时被动语态', 'be + 过去分词突出动作承受者；现在时说明常规过程，过去时说明已完成过程。', ['am/is/are + 过去分词', 'was/were + 过去分词', 'by + 动作执行者'], [['The model is tested under different conditions.', '模型在不同条件下接受测试。', '描述常规流程用一般现在时被动。'], ['The first version was built from recycled plastic.', '第一版由再生塑料制成。', '描述过去完成的制作。']], ['be 后使用过去式而非过去分词。', '不需要时仍机械添加 by us。']),
        g('purpose-result', '目的、结果与评价结构', 'to do/so that 表示目的；so ... that/such ... that 表示结果。', ['to do / so that + 句子', 'so + 形容词/副词 + that', 'such + 名词短语 + that'], [['We changed the shape to make the tool safer.', '我们改变形状以使工具更安全。', '不定式表示目的。'], ['The switch was so small that users missed it.', '开关太小，以至于用户没注意到。', 'so 修饰形容词 small。']], ['such 后直接接形容词无名词。', 'so that 与 so ... that 含义混淆。']),
      ],
    }),
    unit({
      id: 'eng-unit-g9a-beyond-earth', number: 6, title: 'Beyond Earth', theme: '宇宙探索与科学证据',
      expressions: ['The spacecraft entered orbit successfully.', 'Scientists are looking for evidence of water.', 'A planet that supports life needs suitable conditions.'],
      vocabulary: [
        ['universe', '名词', '宇宙；世界', '通常与定冠词 the 连用。', '复数 universes 多用于理论或虚构语境。', ['the universe', 'observable universe'], 'The universe contains billions of galaxies.', '宇宙包含数十亿个星系。', 'universe 范围大于 solar system 和 galaxy。'],
        ['planet', '名词', '行星', '围绕恒星运行且满足相关定义的天体。', '复数 planets；形容词 planetary。', ['distant planet', 'planet Earth'], 'Mars is a rocky planet with a thin atmosphere.', '火星是一颗大气稀薄的岩石行星。', 'Earth 作专名通常首字母大写。'],
        ['spacecraft', '名词', '航天器；宇宙飞船', '单复数同形，泛指用于太空任务的飞行器。', '单复数均为 spacecraft。', ['launch a spacecraft', 'uncrewed spacecraft'], 'The spacecraft sent images back to Earth.', '航天器把图像传回地球。', '不能写 spacecrafts。'],
        ['orbit', '名词/动词', '轨道；绕轨道运行', 'in orbit；orbit the Earth。', '复数 orbits；orbited；orbiting。', ['enter orbit', 'orbit the Earth'], 'The satellite entered orbit after launch.', '卫星发射后进入轨道。', '作动词时可直接接天体：orbit the Earth；名词结构可说 an orbit around the Earth。'],
        ['astronaut', '名词', '宇航员；航天员', '接受训练并执行太空任务的人。', '复数 astronauts。', ['train as an astronaut', 'astronaut crew'], 'Astronauts exercise daily to protect their health in space.', '航天员每天锻炼以保护太空中的健康。', 'astronomer 是天文学家，不一定进入太空。'],
        ['explore', '动词', '探索；探究', '可接地点、问题或可能性。', 'explores；explored；exploring；名词 exploration/explorer。', ['explore space', 'space exploration'], 'Robotic missions explore places that are too dangerous for people.', '机器人任务探索对人类过于危险的地方。', 'explore 后直接接 space，不加 in。'],
        ['evidence', '名词', '证据；迹象', '不可数；一项证据可说 a piece of evidence。', '不可数；形容词 evident。', ['scientific evidence', 'evidence of'], 'Scientists need strong evidence before accepting a claim.', '科学家在接受一种说法前需要有力证据。', '不能说 evidences 或 an evidence。'],
        ['beyond', '介词/副词', '在……之外；超出', '可表示空间、时间或能力范围之外。', '通常不变化。', ['beyond Earth', 'beyond doubt'], 'The mission will travel beyond the Moon.', '任务将飞越月球更远的地方。', 'beyond 已含“超过”，不再加 than。'],
      ],
      grammar: [
        g('relative-clauses-science', 'who、which、that 引导定语从句', 'who 指人，which 指物，that 可指人或物；关系词在从句作宾语时常可省略。', ['名词 + who + 谓语', '名词 + which/that + 谓语', '名词 + (which/that) + 主语 + 谓语'], [['An astronaut is a person who works in space.', '航天员是在太空工作的人。', 'who 在从句中作主语。'], ['The signals that the telescope received were weak.', '望远镜接收到的信号很弱。', 'that 作 received 的宾语。']], ['关系词后重复 it/he。', 'who 指代 spacecraft。']),
        g('certainty-evidence', 'must、may、might、can’t 表推测', 'must 表示有强证据的肯定推测，may/might 表示可能，can’t 表示有强证据的否定推测。', ['must be/do', 'may/might be/do', 'can’t be/do'], [['The bright point must be a planet; it moves differently from the stars.', '这个亮点一定是行星，它的运动方式与恒星不同。', '有观察证据支持强推测。'], ['The signal might come from equipment noise.', '信号可能来自设备噪声。', '证据不足，用 might。']], ['用 mustn’t 表示“不可能”。', '情态动词后接 to be。']),
      ],
    }),
    unit({
      id: 'eng-unit-g9a-feel-rhythm', number: 7, title: 'Feel the Rhythm', theme: '音乐表达与文化连接',
      expressions: ['The rhythm makes the piece energetic.', 'This instrument is used in traditional music.', 'The composer, who grew up by the sea, used natural sounds.'],
      vocabulary: [
        ['rhythm', '名词', '节奏；律动', '可指数声音或动作的规律强弱。', '复数 rhythms；形容词 rhythmic。', ['strong rhythm', 'sense of rhythm'], 'The drum creates a steady rhythm for the dancers.', '鼓为舞者打出稳定节奏。', '拼写中没有第二个元音字母，注意 rhythm。'],
        ['melody', '名词', '旋律', '按顺序组织、可辨认的一系列音高。', '复数 melodies。', ['simple melody', 'play a melody'], 'The melody rises slowly and then becomes softer.', '旋律缓慢上升，随后变得更轻柔。', 'melody 不等同于 lyrics；描述音量变小可用 softer/quieter。'],
        ['instrument', '名词', '乐器；仪器', '音乐语境中常用 play the + 乐器。', '复数 instruments。', ['musical instrument', 'string instrument'], 'The erhu is a traditional Chinese string instrument.', '二胡是中国传统弦乐器。', '演奏乐器前通常加 the。'],
        ['perform', '动词', '表演；执行', 'perform music/a task；名词 performance/performer。', 'performs；performed；performing。', ['perform on stage', 'live performance'], 'The group performed an original song at the festival.', '这个组合在节日上表演了一首原创歌曲。', 'performance 是表演，performer 是表演者。'],
        ['traditional', '形容词', '传统的', '描述长期传承的音乐、艺术或习俗。', '名词 tradition；副词 traditionally。', ['traditional music', 'traditional style'], 'Young musicians mixed traditional sounds with electronic music.', '年轻音乐人把传统声音与电子音乐融合。', 'traditional 不代表一成不变。'],
        ['composer', '名词', '作曲家', '创作音乐作品的人；动词 compose。', '复数 composers。', ['famous composer', 'compose music'], 'The composer used silence as part of the piece.', '作曲家把停顿作为作品的一部分。', 'singer 演唱，composer 创作音乐。'],
        ['audience', '名词', '观众；听众', '可作为整体用单数，强调成员时可用复数概念。', '复数 audiences。', ['live audience', 'attract an audience'], 'The audience became silent before the first note.', '第一个音响起前，观众安静下来。', 'audience 指整体，不说 many audience；应说 a large audience。'],
        ['beat', '名词/动词', '节拍；敲击；击败', '音乐中指规律脉冲，也可作动词。', '复数 beats；beat；beaten；beating。', ['keep the beat', 'strong beat'], 'Clap your hands to keep the beat.', '拍手保持节拍。', 'beat 的过去式仍为 beat，过去分词 beaten。'],
      ],
      grammar: [
        g('passive-music', '被动语态描述乐器与作品', 'be + 过去分词可说明乐器如何演奏、作品何时创作或音乐在哪里使用。', ['am/is/are + 过去分词', 'was/were + 过去分词', 'be played with/by/on ...'], [['The drum is played with two sticks.', '这种鼓用两根鼓槌演奏。', '突出乐器和演奏方式。'], ['The song was written for a school celebration.', '这首歌为学校庆典而创作。', '过去时被动描述创作背景。']], ['被动语态遗漏 be。', '所有乐器都用同一介词说明演奏方式。']),
        g('non-defining-relatives', '非限制性定语从句', '逗号隔开的从句补充信息，不限定对象；常用 who、which，通常不用 that，也不能省略关系词。', ['人名/事物, who/which + 从句, 主句', '主句, which + 补充评价'], [['The conductor, who studied folk music, explained the rhythm.', '这位指挥研究过民间音乐，他解释了节奏。', '从句补充已确定人物的信息。'], ['The performance ended with silence, which surprised the audience.', '表演以寂静结束，这令观众惊讶。', 'which 指代前面的整件事。']], ['在逗号从句中使用 that。', '省略作宾语的关系词。']),
      ],
    }),
    unit({
      id: 'eng-unit-g9a-more-than-game', number: 8, title: 'More than a Game', theme: '体育精神与团队价值',
      expressions: ['The team kept working together under pressure.', 'Winning matters, but respect matters more.', 'If the team communicated more clearly, it would make fewer mistakes.'],
      vocabulary: [
        ['athlete', '名词', '运动员', '尤指经过训练参加体育项目的人。', '复数 athletes；形容词 athletic。', ['professional athlete', 'young athlete'], 'Every athlete followed the same safety rules.', '每位运动员都遵守同样的安全规则。', '注意发音和拼写，不漏掉第二个 t。'],
        ['competition', '名词', '比赛；竞争', '可指具体赛事或竞争状态。', '复数 competitions；动词 compete。', ['enter a competition', 'fierce competition'], 'The competition brought together teams from six schools.', '比赛汇集了六所学校的队伍。', 'compete with/against sb for a prize。'],
        ['teamwork', '名词', '团队合作', '不可数，强调成员协作。', '不可数。', ['good teamwork', 'build teamwork'], 'Good teamwork helped the weaker players contribute.', '良好的团队合作帮助较弱队员作出贡献。', '不能说 teamworks。'],
        ['respect', '名词/动词', '尊重；敬意', 'respect an opponent；show respect for。', 'respects；respected；respecting。', ['mutual respect', 'show respect'], 'Players shook hands to show respect after the match.', '赛后运动员握手以示尊重。', 'respect 后直接接人，名词结构用 for。'],
        ['victory', '名词', '胜利', '可数名词，a victory over 对……的胜利。', '复数 victories。', ['win a victory', 'victory over'], 'The narrow victory came after months of training.', '这场险胜源于数月训练。', 'win 是动词；victory 是名词。'],
        ['opponent', '名词', '对手；反对者', '比赛中指另一方个人或队伍。', '复数 opponents。', ['strong opponent', 'respect an opponent'], 'A good opponent can push you to improve.', '优秀对手能推动你进步。', 'opponent 不等于 enemy。'],
        ['spirit', '名词', '精神；心态；灵魂', 'team spirit、sportsmanship 等表达共同态度。', '复数 spirits。', ['team spirit', 'fighting spirit'], 'The runners showed strong team spirit in the relay.', '接力赛跑者展现了强烈团队精神。', 'spirit 在此通常不可数。'],
        ['relay', '名词/动词', '接力赛；传递', '接力项目中队员依次完成赛段。', '复数 relays；relayed；relaying。', ['relay race', 'relay a message'], 'Our final runner caught up in the relay.', '我们的最后一棒在接力赛中追了上来。', 'relay 作动词也可表示转达信息。'],
      ],
      grammar: [
        g('conditionals-sport', '真实条件与假设条件', '第一条件句谈可能发生的情况；第二条件句谈与现在事实距离较远的假设。', ['If + 一般现在时, will/can + 动词原形', 'If + 一般过去时, would/could + 动词原形'], [['If the team communicates clearly, it will make fewer mistakes.', '如果团队沟通清楚，就会少犯错。', '真实可行条件用第一条件句。'], ['If I were the captain, I would rotate the players.', '如果我是队长，我会轮换队员。', '与当前事实不同的假设用 were/would。']], ['第一条件句 if 从句使用 will。', '第二条件句主句使用 will。']),
        g('concession-sport', 'although、even though 与 despite', 'although/even though 后接完整句；despite/in spite of 后接名词、代词或 doing。', ['although/even though + 句子', 'despite/in spite of + 名词/doing'], [['Although the team lost, the players supported one another.', '尽管球队输了，队员仍相互支持。', 'although 后接完整句。'], ['Despite feeling tired, she completed the relay.', '尽管感到疲惫，她完成了接力。', 'despite 后接 feeling。']], ['although 与 but 在同一句重复。', 'despite 后直接接完整句且无 the fact that。']),
      ],
    }),
  ],
});

const grade9Lower = createBook({
  id: 'eng-book-g9b-pending', gradeId: 'g9', semester: 'lower', label: '九年级下册', shortLabel: '九下',
  edition: '新版目录待发布', status: 'pending', sourceNote: '官方新版完整单元目录公开后再逐单元核对录入，当前不展示占位内容。', units: [],
});

module.exports = [grade9Upper, grade9Lower];
