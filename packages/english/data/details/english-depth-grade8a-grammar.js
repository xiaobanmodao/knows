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
    contrasts: [{
      target: contrast[0],
      difference: contrast[1],
      examples: contrast[2],
    }],
    visual: {
      type: visual[0],
      title: visual[1],
      items: visual[2].map((item, index) => ({ id: `${id}-visual-${index + 1}`, text: item })),
    },
    extraExamples: [{
      sentence: extraExample[0],
      translation: extraExample[1],
      explanation: extraExample[2],
    }],
    review: { ...REVIEW },
  };
}

const GRAMMAR_DEPTH = [
  grammar(
    'eng-unit-g8a-happy-holiday-grammar-simple-past-review',
    ['叙述的动作发生在明确或可推断的过去时间，并且已经结束。', '连续动作保持同一过去时间框架；did 已表示过去，后面的实义动词使用原形。'],
    [
      ['肯定叙述', '主语 + 动词过去式 + 其他成分.', '规则与不规则过去式都要核对。'],
      ['否定', "主语 + did not/didn't + 动词原形 + 其他成分.", '否定信息放在 did not 后。'],
      ['一般疑问', 'Did + 主语 + 动词原形 + 其他成分?', '用 Yes, ... did./No, ... did not. 回答。'],
    ],
    ['一般过去时与现在完成时', '一般过去时关注已结束的过去时间；现在完成时把过去经历或结果与现在相连。', ['We visited the town last July.', 'We have visited the town before.']],
    ['timeline', '假期故事的过去时间线', ['明确过去：last summer', '动作链：arrived → explored → returned', '现在回顾：讲述已经结束的经历']],
    ['After lunch, we rented bicycles and rode along the coast.', '午饭后，我们租了自行车，沿着海岸骑行。', 'rented 和 rode 是同一过去时间线上的连续动作。'],
  ),
  grammar(
    'eng-unit-g8a-happy-holiday-grammar-indefinite-pronouns',
    ['复合不定代词指不确定的人或事物，作主语时通常按第三人称单数处理。', '形容词修饰复合不定代词时放在其后；否定句中避免 nobody 与 not 重复否定。'],
    [
      ['肯定中的“某”', 'someone/somebody/something + 单数谓语', '说话者认为对象存在但不具体说明。'],
      ['疑问与否定', 'anyone/anybody/anything + 单数谓语', '通常用于一般疑问句和否定句。'],
      ['全部或没有', 'everyone/everything/nobody/nothing + 单数谓语', '形式表示多人或多物，语法上仍作单数。'],
    ],
    ['some- 系列与 any- 系列', 'some- 常用于肯定句，也可用于期待肯定回答的请求；any- 常用于疑问、否定或“任何一个”。', ['Would you like something warm?', 'I did not see anything unusual.']],
    ['sentence-map', '不定代词的三步判断', ['对象：人用 -one/-body，事物用 -thing', '语境：肯定常用 some-，疑问否定常用 any-', '修饰：something useful，形容词后置']],
    ['Nobody in our group was ready to leave the beach early.', '我们组里没有人愿意早早离开海滩。', 'nobody 作主语使用单数 was，句中不再添加 not。'],
  ),

  grammar(
    'eng-unit-g8a-home-sweet-home-grammar-polite-requests',
    ['Could you ...? 用于请对方完成某个动作，could 在这里表达礼貌而非过去能力。', '回应请求时先明确接受或不能接受，再根据需要说明时间、原因或替代方案。'],
    [
      ['提出请求', 'Could you (please) + 动词原形 ...?', 'please 可放在动词前或句末。'],
      ['接受请求', 'Sure./Of course./No problem. + 补充信息', '说明何时或如何完成会更清楚。'],
      ['暂时拒绝', "Sorry, I can't ... now, but I can ... later.", '礼貌说明限制并给出替代安排。'],
    ],
    ['Could you ...? 与 Can you ...?', '两者都能提出请求；Could you ...? 通常更委婉，Can you ...? 更直接，也可询问能力。', ['Could you close the window, please?', 'Can you lift this box by yourself?']],
    ['sentence-map', '完整请求与回应', ['请求：Could you + do?', '态度：Sure / Sorry', '安排：now / after dinner / tomorrow']],
    ['Could you put the clean cups back in the cupboard?', '请你把干净的杯子放回橱柜好吗？', 'Could you 后直接使用 put 原形。'],
  ),
  grammar(
    'eng-unit-g8a-home-sweet-home-grammar-make-let-help',
    ['make 和 let 后接宾语加不带 to 的动词原形。', 'help 后可接 help sb do 或 help sb to do；变为 make 的被动语态时要恢复 to。'],
    [
      ['使某人做', 'make + sb + 动词原形', '强调某人或某事促使动作发生。'],
      ['允许某人做', 'let + sb + 动词原形', '表示允许，不使用 to。'],
      ['帮助某人做', 'help + sb + (to) + 动词原形', 'to 可以保留或省略。'],
    ],
    ['let 与 allow', 'let sb do 后不带 to；allow sb to do 必须带 to，语气通常更正式。', ['My parents let me choose the colour.', 'My parents allowed me to choose the colour.']],
    ['comparison', '宾语后动词形式', ['make sb do → 不带 to', 'let sb do → 不带 to', 'help sb (to) do → to 可省略']],
    ['A shared calendar helps everyone remember their weekly chores.', '共用日历帮助每个人记住每周家务。', 'help everyone remember 使用不带 to 的动词原形。'],
  ),

  grammar(
    'eng-unit-g8a-same-or-different-grammar-comparatives',
    ['比较级用于两个对象或同一对象前后状态的比较，通常由 than 或上下文给出参照。', '比较级只使用一种构成方式；不规则形式如 good → better、bad → worse 需要单独记忆。'],
    [
      ['短形容词', '形容词-er + than', '注意辅音双写、去 e 和 y 变 i 等拼写规则。'],
      ['长形容词', 'more + 形容词 + than', '多音节形容词通常使用 more。'],
      ['副词比较', '动词 + 副词比较级 + than', 'hard → harder；carefully → more carefully。'],
    ],
    ['比较级与 as ... as', '比较级表示程度不同；as + 原级 + as 表示程度相同。', ['This room is brighter than mine.', 'This room is as bright as mine.']],
    ['comparison', '比较级构成路线', ['短词：small → smaller', '长词：careful → more careful', '不规则：good/well → better']],
    ['The second speaker answered more confidently than the first.', '第二位发言者回答得比第一位更自信。', 'confidently 是多音节副词，使用 more confidently。'],
  ),
  grammar(
    'eng-unit-g8a-same-or-different-grammar-both-comparison',
    ['both 只指两个对象，both A and B 连接语法功能相同的成分。', 'as ... as 中使用形容词或副词原级；much、far、a little、a bit 可修饰比较级。'],
    [
      ['共同特征', 'both A and B + 复数谓语', 'A 和 B 通常是并列的名词或代词。'],
      ['程度相同', 'A + be/动词 + as + 原级 + as + B', '否定形式 not as/so ... as 表示不及。'],
      ['差异程度', 'much/far/a little/a bit + 比较级', '说明差别很大或较小。'],
    ],
    ['both 与 all', 'both 用于两个对象；all 用于三个或更多对象或一个整体。', ['Both routes are safe.', 'All three routes are safe.']],
    ['comparison', '先数对象再选结构', ['两个都 → both', '程度相同 → as ... as', '差异大小 → much/a little + 比较级']],
    ['Both solutions are useful, but the first is a little easier to explain.', '两种解法都有用，但第一种稍微更容易解释。', 'both 对应两个解法，a little 修饰比较级 easier。'],
  ),

  grammar(
    'eng-unit-g8a-amazing-plants-animals-grammar-superlatives',
    ['最高级用于三个或更多对象，或一个明确范围内的最高程度。', '形容词最高级前通常使用 the；one of the 后接最高级和可数名词复数。'],
    [
      ['短形容词最高级', 'the + 形容词-est + 范围', '注意 biggest、happiest 等拼写变化。'],
      ['长形容词最高级', 'the most + 形容词 + 范围', '多音节词通常使用 most。'],
      ['“最……之一”', 'one of the + 最高级 + 可数名词复数', '谓语由句子真正的主语决定。'],
    ],
    ['in 与 of 的比较范围', 'in 后常接地点、组织或类别；of 后常接一组明确对象或时间范围。', ['the tallest tree in the park', 'the wettest month of the year']],
    ['comparison', '最高级句的三个部分', ['对象：被描述的人或物', '最高级：the smallest / the most active', '范围：in the forest / of the three']],
    ['The mangrove is one of the most valuable plants in this ecosystem.', '红树林是这个生态系统中最有价值的植物之一。', 'one of the 后使用复数 plants，并用 in 给出范围。'],
  ),
  grammar(
    'eng-unit-g8a-amazing-plants-animals-grammar-relative-descriptions',
    ['关系代词紧跟被说明的先行词，并在关系从句中充当成分。', 'who 通常指人，which 指事物，that 可指人或事物；本阶段先处理关系代词作主语的情况。'],
    [
      ['描述人', '人 + who/that + 谓语 ...', '关系词在从句中代替前面的人。'],
      ['描述事物', '事物 + which/that + 谓语 ...', '关系词在从句中代替前面的事物。'],
      ['组合定义', 'A/An + 名词 + is + 名词 + that/which + 谓语 ...', '用关系从句补充类别特征。'],
    ],
    ['关系代词与重复主语', '关系代词已在从句中作主语时，不能再重复 he、it、they 等主语。', ['a bird that lives near water', 'not: a bird that it lives near water']],
    ['sentence-map', '先行词决定关系词', ['人 → who / that', '事物 → which / that', '关系词后直接接从句谓语']],
    ['A botanist is a scientist who studies plants.', '植物学家是研究植物的科学家。', 'who 指代 scientist，并在从句中作 studies 的主语。'],
  ),

  grammar(
    'eng-unit-g8a-delicious-meal-grammar-exclamations',
    ['What 引导的感叹部分中心是名词，How 引导的感叹部分中心是形容词或副词。', '单数可数名词前需要 a/an；复数或不可数名词前不使用 a/an。'],
    [
      ['单数名词', 'What + a/an + 形容词 + 单数可数名词 (+ 主语 + 谓语)!', '冠词由后面词语的首个音素决定。'],
      ['复数或不可数', 'What + 形容词 + 复数/不可数名词 (+ 主语 + 谓语)!', '不添加 a/an。'],
      ['形容词或副词', 'How + 形容词/副词 (+ 主语 + 谓语)!', 'How 后不直接放名词短语。'],
    ],
    ['What 与 How', '先找感叹重点：有中心名词选 What，只突出性质或方式选 How。', ['What a useful recipe!', 'How useful this recipe is!']],
    ['sentence-map', '感叹句结构选择', ['名词中心 → What', '单数可数 → 加 a/an', '形容词/副词中心 → How']],
    ['What a wonderful smell the fresh bread has!', '新鲜面包的香味多么美妙啊！', '中心词 smell 是单数可数名词，因此使用 What a。'],
  ),
  grammar(
    'eng-unit-g8a-delicious-meal-grammar-quantity-food',
    ['先按当前词义判断名词是否可数，再选择 how many/many/few 或 how much/much/little。', '不可数食物需要计数时使用容器、重量或份数单位，并让单位名词随数量变化。'],
    [
      ['询问可数数量', 'How many + 可数名词复数 + ...?', '答案直接给出个数。'],
      ['询问不可数总量', 'How much + 不可数名词 + ...?', '答案可给出总量或量词结构。'],
      ['量词计数', '数字 + cups/pieces/grams/bowls of + 名词', '复数变化落在量词上。'],
    ],
    ['fewer 与 less', 'fewer 修饰可数复数；less 修饰不可数名词。', ['fewer onions', 'less oil']],
    ['comparison', '食物数量的判断流程', ['能直接数 → many / a few', '不能直接数 → much / a little', '借单位数 → two pieces of ...']],
    ['We need three pieces of fruit and a little yoghurt.', '我们需要三份水果和一点酸奶。', 'fruit 通过 pieces 计数，yoghurt 作为不可数名词使用 a little。'],
  ),

  grammar(
    'eng-unit-g8a-plan-yourself-grammar-future-plans',
    ['be going to 表示事先已有的打算，或根据当前迹象作出的预测。', '现在进行时表示已与他人或日程确定的近期安排，通常带明确将来时间。'],
    [
      ['个人打算', '主语 + am/is/are going to + 动词原形.', '说明已经形成的计划。'],
      ['否定计划', '主语 + am/is/are not going to + 动词原形.', 'not 放在 be 后。'],
      ['确定安排', '主语 + am/is/are + 动词-ing + 将来时间.', '常用于会面、出发、课程等已安排活动。'],
    ],
    ['be going to 与 will', 'be going to 常表示事先计划或有迹象的预测；will 常表示说话时决定、承诺或一般预测。', ['I am going to revise tonight.', 'The phone is ringing. I will answer it.']],
    ['timeline', '从意图到确定安排', ['想法形成 → be going to', '时间约定 → 现在进行时', '临时决定 → will']],
    ['We are meeting our project partner after school on Tuesday.', '我们周二放学后要见项目搭档。', 'meeting 表示已经约定好的近期安排。'],
  ),
  grammar(
    'eng-unit-g8a-plan-yourself-grammar-infinitive-purpose',
    ['to + 动词原形可说明前面动作的目的，回答“为什么这样做”。', 'want、hope、decide、plan、manage 等动词后可接不定式作宾语，但具体搭配需要逐词确认。'],
    [
      ['说明目的', '主语 + 行动 + to + 动词原形 ...', '目的主语通常与主句主语一致。'],
      ['动词宾语', 'want/hope/decide/plan + to + 动词原形', '说明希望、决定或计划的动作。'],
      ['否定不定式', 'not to + 动词原形', 'not 放在 to 前。'],
    ],
    ['目的不定式与 for', 'to do 后接动作；for 后通常接名词或代词，不能直接使用 for do。', ['I use a timer to stay focused.', 'This timer is for study sessions.']],
    ['sentence-map', 'to do 的两种位置', ['行动之后 → 表目的', '特定动词之后 → 作宾语', '否定 → not to do']],
    ['She decided not to change all her habits at once.', '她决定不一次改变所有习惯。', 'decide 后使用否定不定式 not to change。'],
  ),

  grammar(
    'eng-unit-g8a-when-tomorrow-comes-grammar-future-will',
    ['will 后始终接动词原形，不随主语变化。', 'will 可表达对未来的预测、承诺，以及说话时刚作出的决定。'],
    [
      ['肯定', '主语 + will + 动词原形.', '缩写形式为 ’ll。'],
      ['否定', "主语 + will not/won't + 动词原形.", 'won’t 表示将不会。'],
      ['疑问', 'Will + 主语 + 动词原形?', '简短回答使用 will/won’t。'],
    ],
    ['will 与 be going to', 'will 常用于一般预测或即时决定；be going to 常用于已有计划或有当前迹象的预测。', ['I think transport will be cleaner.', 'Look at those clouds. It is going to rain.']],
    ['timeline', 'will 的三个常见功能', ['未来判断 → I think ... will', '当场决定 → I will do it', '承诺 → I will remember']],
    ['Will people use the same devices twenty years from now?', '二十年后人们还会使用同样的设备吗？', '一般疑问句把 will 放到主语 people 前。'],
  ),
  grammar(
    'eng-unit-g8a-when-tomorrow-comes-grammar-probability-modals',
    ['may、might 和 will 后都接动词原形。', 'may/might 保留不确定性；will 表示说话者认为较确定的未来，probably 可调整确定程度。'],
    [
      ['存在可能', '主语 + may/might + 动词原形.', 'might 往往显得更试探，但两者都不表示精确概率。'],
      ['较可能预测', '主语 + will probably + 动词原形.', 'probably 通常位于 will 后。'],
      ['较可能不发生', "主语 + probably won't + 动词原形.", 'probably 通常放在 won’t 前。'],
    ],
    ['may/might 与 will', 'may/might 表示可能但不确定；will 表示较明确的判断，而不是客观保证。', ['Robots might assist nurses.', 'Robots will probably handle more routine tasks.']],
    ['comparison', '从不确定到较确定', ['might → 可能', 'may → 可能', 'will probably → 很可能']],
    ['Some jobs may change, but they will probably not disappear completely.', '一些工作可能会改变，但很可能不会完全消失。', 'may 表示可能变化，will probably not 表示较有把握的否定预测。'],
  ),

  grammar(
    'eng-unit-g8a-communicate-grammar-object-clauses',
    ['宾语从句在 think、know、ask、tell、wonder 等动词后充当宾语。', '无论由 that、if/whether 还是疑问词引导，从句都使用陈述语序。'],
    [
      ['转述陈述', '主句 + (that) + 主语 + 谓语 ...', '口语中 that 常可省略。'],
      ['转述一般疑问', '主句 + if/whether + 主语 + 谓语 ...', '表示“是否”。'],
      ['转述特殊疑问', '主句 + 疑问词 + 主语 + 谓语 ...', '保留 what、where、why、how 等信息焦点。'],
    ],
    ['直接问句与宾语从句', '直接问句使用疑问语序；宾语从句恢复陈述语序。', ['Where is the station?', 'Could you tell me where the station is?']],
    ['sentence-map', '宾语从句语序', ['引导词：that / if / 疑问词', '主语：the meeting / she / they', '谓语：is / means / arrived']],
    ['Do you know why the speaker changed her tone?', '你知道说话者为什么改变语气吗？', 'why 后使用陈述语序 the speaker changed。'],
  ),
  grammar(
    'eng-unit-g8a-communicate-grammar-communication-conditionals',
    ['第一条件句谈现在或将来真实可能发生的条件及其结果。', 'if 从句通常用一般现在时表示将来条件，主句可使用 will、can、may 或祈使句。'],
    [
      ['可能结果', 'If + 一般现在时, 主语 + will + 动词原形.', '说明条件成立后可能发生的未来结果。'],
      ['能力或选择', 'If + 一般现在时, 主语 + can/may + 动词原形.', '说明可采取的行动。'],
      ['建议或指令', 'If + 一般现在时, 动词原形 ...', '主句使用祈使句。'],
    ],
    ['if 与 when', 'if 表示条件是否成立尚不确定；when 表示说话者把事情看作会发生，再说明发生时间。', ['If I receive a reply, I will tell you.', 'When I receive the scheduled report, I will check it.']],
    ['timeline', '真实条件与结果', ['现在判断条件：if + present', '条件成立', '未来结果：will/can/祈使句']],
    ['If you do not understand a word, ask the speaker to explain it.', '如果你不理解某个词，请说话者解释。', 'if 从句使用一般现在时，主句使用祈使句 ask。'],
  ),
];

module.exports = GRAMMAR_DEPTH;
