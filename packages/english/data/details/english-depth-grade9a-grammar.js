const REVIEW = {
  status: 'verified',
  reviewedAt: '2026-08-01',
  sourceKeys: ['cambridge-grammar', 'british-council-grammar'],
};

function grammar(id, conditions, variants, contrast, visual, extraExample) {
  return {
    id,
    detailVersion: 2,
    conditions,
    variants: variants.map(([label, structure, usage]) => ({ label, structure, usage })),
    contrasts: [{ target: contrast[0], difference: contrast[1], examples: contrast[2] }],
    visual: {
      type: visual[0],
      title: visual[1],
      items: visual[2].map((text, index) => ({ id: `${id}-visual-${index + 1}`, text })),
    },
    extraExamples: [{ sentence: extraExample[0], translation: extraExample[1], explanation: extraExample[2] }],
    review: { ...REVIEW },
  };
}

const GRAMMAR_DEPTH = [
  grammar(
    'eng-unit-g9a-changing-world-grammar-present-perfect-change',
    ['动作或状态从过去开始，并在现在仍有结果、影响或持续状态时使用现在完成时。', 'since 后接起点，for 后接时长；in recent years、so far 和 up to now 常提示与现在相关的时间范围。'],
    [
      ['近期变化', '主语 + have/has + 过去分词 + in recent years', '说明一段延续到现在的时期内发生的变化。'],
      ['持续状态', '主语 + have/has + 过去分词 + since/for ...', '延续性动词可直接表示持续；短暂动作需要改为相应状态。'],
      ['否定或疑问', "主语 + haven't/hasn't + 过去分词 / Have/Has + 主语 + 过去分词?", 'have/has 承担否定和倒装。'],
    ],
    ['现在完成时与一般过去时', '现在完成时连接过去和现在，不与明确结束的过去时间直接连用；一般过去时报告已结束时间中的事件。', ['Online services have expanded in recent years.', 'The town opened its first service centre last year.']],
    ['timeline', '变化如何连接现在', ['过去起点：services began', '发展过程：have expanded', '现在结果：more people can use them']],
    ['Public transport has become more accessible since the new station opened.', '新车站开放以来，公共交通变得更便利了。', 'since 从句用一般过去时 opened，主句用现在完成时表示变化延续到现在。'],
  ),
  grammar(
    'eng-unit-g9a-changing-world-grammar-used-to-contrast',
    ['used to + 动词原形描述过去习惯或状态，并通常暗示现在已经改变。', 'be used to 和 get used to 中的 to 是介词，后接名词、代词或 doing；be 表示已经习惯，get 表示逐渐习惯。'],
    [
      ['过去习惯', '主语 + used to + 动词原形', '否定和疑问通常使用 did not use to / Did ... use to ...?。'],
      ['已经习惯', '主语 + be used to + 名词/doing', 'be 随主语和时态变化。'],
      ['逐渐习惯', '主语 + get used to + 名词/doing', 'get 强调从不习惯到习惯的变化过程。'],
    ],
    ['used to do 与 be used to doing', 'used to do 指过去常做而现在通常不做；be used to doing 指现在或某时已经习惯做，二者不能只看 used to 判断。', ['I used to carry cash.', 'I am used to paying by phone now.']],
    ['comparison', '三个结构的时间方向', ['过去且已改变 → used to do', '当前习惯状态 → be used to doing', '适应过程 → get used to doing']],
    ['Older residents are gradually getting used to booking services online.', '年长居民正逐渐习惯在线预约服务。', 'getting used to 后接动名词 booking，表示适应过程。'],
  ),

  grammar(
    'eng-unit-g9a-inspiring-people-grammar-it-adjective-infinitive',
    ['It is + 形容词 + for/of sb to do 使用形式主语 it，把较长的不定式放在句末。', 'for sb 说明动作对谁来说具有某种难度、必要性或可能性；of sb 使用 kind、brave、careless 等评价人的品格。'],
    [
      ['评价事情', 'It is + 事情形容词 + for sb + to do', '常见形容词有 difficult、important、possible、necessary。'],
      ['评价人物', 'It is + 品格形容词 + of sb + to do', '常见形容词有 kind、brave、generous、careless。'],
      ['改写人物主语', 'sb + be + 品格形容词 + to do', 'of 结构通常可改写为直接评价人物。'],
    ],
    ['for sb 与 of sb', 'for sb 前的形容词评价动作或处境；of sb 前的形容词评价做出动作的人。', ['It was difficult for her to continue alone.', 'It was courageous of her to continue alone.']],
    ['sentence-map', '先判断评价对象', ['评价动作难度 → for sb', '评价人物品质 → of sb', '真正动作 → to + 动词原形']],
    ['It was honest of the researcher to report the unexpected result.', '研究人员如实报告意外结果是诚实的表现。', 'honest 评价研究人员的品质，因此使用 of。'],
  ),
  grammar(
    'eng-unit-g9a-inspiring-people-grammar-attributive-clauses-people',
    ['限制性定语从句紧跟先行词，说明具体指哪一个人，通常不使用逗号。', 'who 和 that 可指人；关系词作从句主语时不能省略，作宾语时在非正式表达中常可省略。'],
    [
      ['关系词作主语', '人物名词 + who/that + 谓语 ...', '关系词代替人物并承担从句主语。'],
      ['关系词作宾语', '人物名词 + (who/that) + 主语 + 谓语 ...', '作宾语时关系词可省略。'],
      ['带介词关系', '人物名词 + who/that + 主语 + 动词 + 介词', '初中阶段常把介词保留在从句末。'],
    ],
    ['关系词作主语与宾语', '看关系词后是否已有明确主语：直接接谓语时关系词作主语，不能省；后面已有主语时关系词多作宾语，可省。', ['The doctor who works here volunteers weekly.', 'The doctor (who) we interviewed volunteers weekly.']],
    ['sentence-map', '定语从句不重复先行词', ['先行词：the volunteer', '关系词：who', '从句：organised the clinic（不再加 she）']],
    ['We interviewed a teacher who has developed free science lessons for rural schools.', '我们采访了一位为乡村学校开发免费科学课程的教师。', 'who 在从句中作主语，不能省略，也不能再加 he 或 she。'],
  ),

  grammar(
    'eng-unit-g9a-smart-learning-grammar-by-gerund',
    ['by + doing 说明实现结果的方式或手段，回答“怎样做到”。', 'by 是介词，后接名词、代词或动名词；不能直接接动词原形。'],
    [
      ['陈述方式', '主语 + 谓语 + by + doing', 'doing 的逻辑主语通常与主句主语一致。'],
      ['回答方法', 'How ...? — By + doing ...', '简短回答可省略主句。'],
      ['使用工具', '主语 + 谓语 + with + 工具', '具体工具常用 with，行动方式常用 by doing。'],
    ],
    ['by doing 与 with a tool', 'by doing 强调采取的行动或方法；with 后接实施行动所使用的具体工具。', ['She checked the claim by reading the source.', 'She opened the file with a tablet.']],
    ['sentence-map', '方式结构', ['结果：remember more', '方式连接：by', '主动行动：testing yourself']],
    ['Students can reduce distraction by placing their phones outside the study area.', '学生可以通过把手机放在学习区外来减少干扰。', 'by 后接 placing，说明减少干扰的方法。'],
  ),
  grammar(
    'eng-unit-g9a-smart-learning-grammar-question-clauses-learning',
    ['ask、know、find out、explain、wonder 等后可接疑问词引导的宾语从句。', '宾语从句使用陈述语序；时态根据实际时间关系选择，疑问词本身在从句作主语时不需要另加主语。'],
    [
      ['疑问词作宾语', '动词 + what/which/who + 主语 + 谓语', '从句中已有主语，不能倒装。'],
      ['疑问词作主语', '动词 + what/which/who + 谓语', '疑问词本身就是从句主语。'],
      ['询问是否', '动词 + whether/if + 陈述语序', '表示“是否”，不能使用 yes/no 问句语序。'],
    ],
    ['直接疑问句与宾语从句', '直接问句常倒装或使用助动词；嵌入另一个句子后改为陈述语序。', ['Why is this source reliable?', 'Can you explain why this source is reliable?']],
    ['sentence-map', '恢复陈述语序', ['引导词：why', '主语：this method', '谓语：works → why this method works']],
    ['Before choosing an app, find out how it stores your personal information.', '选择应用前，先弄清它如何存储你的个人信息。', 'how 引导宾语从句，从句使用 it stores 的陈述语序。'],
  ),

  grammar(
    'eng-unit-g9a-our-memory-grammar-verb-patterns-memory',
    ['remember/forget to do 指记得或忘记完成尚未发生的任务；remember/forget doing 指记得或忘记已经发生的经历。', 'stop doing 表示停止当前动作；stop to do 表示停下当前动作，转去做另一件事。'],
    [
      ['待办任务', 'remember/forget + to + 动词原形', '不定式动作在记得或忘记之后应当发生。'],
      ['已有经历', 'remember/forget + doing', '动名词动作先发生，随后被回想或遗忘。'],
      ['停止关系', 'stop doing / stop to do', 'doing 是被停止的动作；to do 是停下来后要做的新动作。'],
    ],
    ['remember to do 与 remember doing', 'to do 面向尚未完成的任务，doing 回看已经发生的经历；判断关键是两个动作的时间先后。', ['Remember to lock the cabinet.', 'I remember locking the cabinet.']],
    ['timeline', '动作先后决定形式', ['to do：先记得 → 后行动', 'doing：先行动 → 后回想', 'stop to do：停下 A → 去做 B']],
    ['We stopped taking notes for a moment to recall the main idea from memory.', '我们暂时停止记笔记，以便凭记忆回想中心思想。', 'stopped taking 表示停止原动作，to recall 表示目的。'],
  ),
  grammar(
    'eng-unit-g9a-our-memory-grammar-comparisons-memory',
    ['比较两种方法、两个表现或变量变化时，可使用比较级、as ... as 和 the more ... the more ...。', '比较对象必须在同一维度上对应；多音节形容词使用 more，不能同时再加 -er。'],
    [
      ['差异比较', 'A + be + 比较级 + than + B', 'than 后对象应与 A 在逻辑上可比。'],
      ['同等比较', 'A + be + as + 原级 + as + B', '否定式 not as/so ... as 表示不如。'],
      ['同步变化', 'The + 比较级 ..., the + 比较级 ...', '前半说明条件变化，后半说明随之变化的结果。'],
    ],
    ['比较级与最高级', '比较级通常比较两个对象或两组；最高级在三个及以上对象中指出程度最高者。', ['This method is more efficient than copying.', 'This is the most efficient of the three methods.']],
    ['comparison', '比较结构检查', ['维度一致：effective', '对象对应：method A / method B', '形式正确：more effective，不写 more effectiver']],
    ['The more actively you retrieve an idea, the longer you are likely to remember it.', '你越主动提取一个观点，就越可能记得更久。', '两个 the + 比较级结构表达两个变量同步变化。'],
  ),

  grammar(
    'eng-unit-g9a-power-of-ideas-grammar-passive-process',
    ['当动作承受者、过程或结果比执行者更重要时使用被动语态。', '结构为 be + 过去分词；be 随主语、时态和情态动词变化，by + 执行者只在信息重要时出现。'],
    [
      ['常规过程', '主语 + am/is/are + 过去分词', '描述反复发生或一般成立的制作、测试流程。'],
      ['过去过程', '主语 + was/were + 过去分词', '描述过去完成的制作或测试。'],
      ['情态被动', '主语 + must/can/should + be + 过去分词', '情态动词后使用 be 原形。'],
    ],
    ['主动语态与被动语态', '主动语态突出谁执行动作；被动语态把承受动作的对象放在主语位置。', ['The class tested the model twice.', 'The model was tested twice.']],
    ['sentence-map', '被动语态三部分', ['承受者：the model', 'be：was / is / must be', '过去分词：tested']],
    ['Each new version must be checked by users with different needs.', '每个新版本都必须由具有不同需求的用户检查。', '情态动词 must 后使用 be checked。'],
  ),
  grammar(
    'eng-unit-g9a-power-of-ideas-grammar-purpose-result',
    ['to do 和 so that + 句子说明行动目的；so ... that 和 such ... that 说明已经产生或可能产生的结果。', 'so 修饰形容词或副词，such 修饰带形容词也可以的名词短语；so that 表目的时 that 后有完整主谓结构。'],
    [
      ['简洁目的', '主语 + 行动 + to + 动词原形', '目的动作的执行者通常与主句主语一致。'],
      ['完整目的', '主语 + 行动 + so that + 主语 + can/could/will/would ...', '适合目的动作有独立主语或需要表达情态。'],
      ['结果', 'so + 形容词/副词 + that / such + 名词短语 + that', 'that 后接实际结果。'],
    ],
    ['so that 与 so ... that', 'so that 直接连接目的从句；so ... that 中 so 必须修饰形容词或副词并引出结果。', ['We enlarged the label so that users could read it.', 'The label was so small that users missed it.']],
    ['sentence-map', '先分清目的还是结果', ['目的：为了什么 → to do / so that', '程度：如此…… → so/such', '结果：以至于…… → that 从句']],
    ['The team chose such a simple mechanism that anyone could repair it.', '团队选择了如此简单的结构，以至于任何人都能维修。', 'such 修饰名词短语 a simple mechanism，that 引出结果。'],
  ),

  grammar(
    'eng-unit-g9a-beyond-earth-grammar-relative-clauses-science',
    ['限制性定语从句说明先行词具体是哪一个人或物，不使用逗号隔开。', 'who 指人，which 指物，that 可指人或物；关系词作主语不能省，作宾语时常可省。'],
    [
      ['人物先行词', '人物名词 + who/that + 从句', 'who 通常只指人。'],
      ['事物先行词', '事物名词 + which/that + 从句', 'which 通常只指物。'],
      ['关系词作宾语', '名词 + (who/which/that) + 主语 + 谓语', '省略后从句仍有自己的主语。'],
    ],
    ['关系词与先行词重复', '关系词已经代替先行词在从句中承担成分，不能再添加 he、she 或 it。', ['A planet that supports life needs suitable conditions.', '不能写 a planet that it supports life。']],
    ['sentence-map', '选择关系词', ['先找先行词：astronaut / signal', '再看类别：人 → who；物 → which', 'that 可用于限制性从句的人或物']],
    ['The samples that the spacecraft collected may contain evidence of ancient water.', '航天器采集的样本可能包含古代水存在的证据。', 'that 在从句中作 collected 的宾语，因此可以省略。'],
  ),
  grammar(
    'eng-unit-g9a-beyond-earth-grammar-certainty-evidence',
    ['must 表示根据证据作出的强肯定推测，may/might/could 表示不同程度的可能，cannot/can\'t 表示强否定推测。', '这些情态动词后接动词原形；表示当前状态用 be，表示正在发生用 be doing，表示过去推测可用 have + 过去分词。'],
    [
      ['强肯定', '主语 + must + 动词原形', '说话者有较强证据，但不是表达义务。'],
      ['不确定可能', '主语 + may/might/could + 动词原形', '证据不足以作确定判断。'],
      ['强否定', '主语 + cannot/can\'t + 动词原形', '表示根据证据判断不可能；不用 must not。'],
    ],
    ['must not 与 cannot 推测', 'must not 通常表示禁止；cannot/can\'t be 表示根据证据判断“不可能是”。', ['Visitors must not touch the equipment.', 'This light cannot be a nearby aircraft.']],
    ['comparison', '证据强度阶梯', ['强肯定 → must', '可能 → may / might / could', '强否定 → cannot / can\'t']],
    ['The signal might be interference because it has appeared only once.', '这个信号可能是干扰，因为它只出现过一次。', '证据有限时使用 might，而不是 must。'],
  ),

  grammar(
    'eng-unit-g9a-feel-rhythm-grammar-passive-music',
    ['描述乐器如何演奏、作品何时创作或音乐在哪里使用时，被动语态突出乐器和作品。', '结构仍为 be + 过去分词；演奏工具、身体部位和演奏者所用介词取决于实际关系。'],
    [
      ['一般描述', '乐器/作品 + am/is/are + 过去分词', '说明通常的演奏方式或使用场景。'],
      ['创作背景', '作品 + was/were + written/composed + ...', '描述过去完成的创作。'],
      ['演奏方式', 'be played with/by/on + 名词', 'with 常接工具，by 常接执行者，on 常接具体乐器或设备。'],
    ],
    ['by 与 with', 'by 引出执行动作的人或群体；with 引出使用的工具或物件。', ['The piece was performed by the school orchestra.', 'The drum is played with two sticks.']],
    ['sentence-map', '乐器说明句', ['主体：the instrument', '被动：is played', '方式：with / by / on + 名词']],
    ['The final melody is played on a flute while the other instruments become quiet.', '最后的旋律由长笛演奏，其他乐器逐渐安静下来。', 'be played on a flute 说明旋律由哪种乐器演奏。'],
  ),
  grammar(
    'eng-unit-g9a-feel-rhythm-grammar-non-defining-relatives',
    ['非限制性定语从句为已经明确的人或物补充信息，用逗号与主句隔开。', '常用 who 指人、which 指物或前面整件事；通常不用 that，关系词即使作宾语也不能省略。'],
    [
      ['补充人物', '明确人物, who + 从句, 主句', '人名、独一对象等不需要从句来限定身份。'],
      ['补充事物', '明确事物, which + 从句, 主句', 'which 指前面的名词。'],
      ['评价整件事', '主句, which + 谓语 ...', 'which 可指代前面整个事实。'],
    ],
    ['限制性与非限制性定语从句', '限制性从句决定具体指谁或什么，不加逗号；非限制性从句只补充信息，加逗号且不用 that。', ['The musician who won the prize is sixteen.', 'Li Mei, who won the prize, is sixteen.']],
    ['sentence-map', '逗号改变信息功能', ['无逗号 → 限定身份', '有逗号 → 补充已知对象', '非限制性从句 → who / which，不用 that']],
    ['The performance ended with a single drumbeat, which surprised the audience.', '演出以一声鼓点结束，这让观众感到意外。', 'which 指代前面整件事，不能换成 that。'],
  ),

  grammar(
    'eng-unit-g9a-more-than-game-grammar-conditionals-sport',
    ['第一条件句描述现实中可能发生的未来结果，if 从句用一般现在时，主句常用 will/can/may + 动词原形。', '第二条件句描述与当前事实距离较远、可能性较低或纯假设的情况，if 从句用一般过去时，主句用 would/could/might + 动词原形。'],
    [
      ['真实可能', 'If + 一般现在时, 主语 + will/can/may + 动词原形', 'if 从句不使用 will 表示普通未来条件。'],
      ['现在假设', 'If + 一般过去时, 主语 + would/could/might + 动词原形', '过去形式表示与现实的距离，不一定表示过去时间。'],
      ['be 的假设', 'If + 主语 + were ..., 主语 + would ...', '正式和教学语境中各人称常用 were。'],
    ],
    ['第一条件句与第二条件句', '第一条件句把条件视为现实可行；第二条件句把条件视为假设、较不可能或与当前事实不同。', ['If I train regularly, I will improve.', 'If I were the captain, I would change the plan.']],
    ['comparison', '条件的现实距离', ['现实可行 → present + will', '假设或较远 → past + would', 'if 从句通常不放 will / would']],
    ['If every player understood two positions, the team could respond more flexibly.', '如果每位队员都理解两个位置，球队就能更灵活地应对。', '第二条件句用 understood 和 could，讨论假设方案。'],
  ),
  grammar(
    'eng-unit-g9a-more-than-game-grammar-concession-sport',
    ['although 和 even though 是连词，后接完整主谓结构；even though 让步语气通常更强。', 'despite 和 in spite of 是介词结构，后接名词、代词或 doing；接完整句时使用 despite/in spite of the fact that。'],
    [
      ['一般让步', 'Although + 完整句, 主句', 'although 已表示转折，同一句主句前不再加 but。'],
      ['强调让步', 'Even though + 完整句, 主句', '强调结果与条件形成明显反差。'],
      ['介词让步', 'Despite/In spite of + 名词/doing, 主句', '后面不直接接普通完整句。'],
    ],
    ['although 与 despite', 'although 后接主语加谓语；despite 后接名词性成分，转换时需要把句子改为名词或 doing。', ['Although she was tired, she finished.', 'Despite feeling tired, she finished.']],
    ['sentence-map', '看连接词后的结构', ['完整句 → although / even though', '名词或 doing → despite / in spite of', '避免 although ... but 重复']],
    ['Even though the team was behind at half-time, the players continued to communicate calmly.', '尽管球队半场时落后，队员仍继续冷静沟通。', 'even though 后接完整句 the team was behind，主句不再使用 but。'],
  ),
];

module.exports = GRAMMAR_DEPTH;
