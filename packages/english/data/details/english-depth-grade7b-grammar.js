const REVIEW = {
  status: 'verified',
  reviewedAt: '2026-07-22',
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
    'eng-unit-g7b-animal-friends-grammar-wh-animals',
    ['先根据答案类型选择 what、where 或 why。', '含实义动词的一般现在时问句需要 do/does，含 be 的问句直接提前 be。'],
    [
      ['询问对象', 'What + 名词 + do/does + 主语 + 动词原形?', '答案给出动物、事物或类别。'],
      ['询问地点', 'Where + do/does + 主语 + 动词原形?', '答案给出栖息地或位置。'],
      ['询问原因', 'Why + do/does/is/are + 主语 ...?', '通常用 because 引出原因。'],
    ],
    ['why 问句与 because 答句', 'why 用于提出原因问题；because 引出完整的原因从句。', ['Why do you protect the wetland?', 'Because many birds live there.']],
    ['sentence-map', '疑问词决定答案方向', ['What → 对象或种类', 'Where → 地点或栖息地', 'Why → 原因；Because → 回答']],
    ['Why does the panda need bamboo? Because it is its main food.', '熊猫为什么需要竹子？因为竹子是它的主要食物。', '单数 panda 要求 does，does 后的 need 保持原形。'],
  ),
  grammar(
    'eng-unit-g7b-animal-friends-grammar-plural-adjectives',
    ['泛指一类动物时常用可数名词复数。', '形容词作定语或表语时都不随名词的单复数改变。'],
    [
      ['名词前描述', '形容词 + 单数/复数名词', '形容词直接放在名词前。'],
      ['系动词后描述', '主语 + be/look/seem + 形容词', '形容词作表语说明主语特征。'],
      ['不规则复数', 'wolf → wolves; goose → geese', '先判断名词是否使用特殊复数。'],
    ],
    ['形容词与名词复数', '名词需要按数量变化，形容词本身不加复数词尾。', ['a clever fox', 'two clever foxes']],
    ['comparison', '描述动物的两种位置', ['名词前：a lovely penguin', 'be 后：Penguins are lovely', '数量变化：one wolf → two wolves']],
    ['Eagles are strong birds with wide wings.', '鹰是有宽大翅膀的强壮鸟类。', '泛指鹰和鸟类都用复数，形容词 strong 不变化。'],
  ),

  grammar(
    'eng-unit-g7b-no-rules-no-order-grammar-imperatives-rules',
    ['祈使句用于发出指令、提醒、请求或禁止。', '祈使句通常省略主语 you，并以动词原形开头。'],
    [
      ['肯定指令', '动词原形 + 其他成分.', '直接说明要做的动作。'],
      ['否定或禁止', "Don't/Do not + 动词原形 + 其他成分.", '正式标识常使用 Do not。'],
      ['礼貌请求', 'Please + 动词原形 ... / 动词原形 ..., please.', 'please 可放句首或句末。'],
    ],
    ['祈使句与 must', '祈使句直接给出行动；must 陈述必须遵守的义务。', ['Keep the door closed.', 'Visitors must keep the door closed.']],
    ['sentence-map', '从意图选择祈使结构', ['要求做 → Open/Keep/Follow ...', "禁止做 → Don't/Do not ...", '缓和语气 → Please ...']],
    ['Please leave enough space between the bicycles.', '请在自行车之间留出足够空间。', '礼貌祈使句使用 please 加动词原形 leave。'],
  ),
  grammar(
    'eng-unit-g7b-no-rules-no-order-grammar-must-have-to',
    ['must 和 have to 都能表达现在的义务，后接动词原形。', 'must not 表示禁止，do not have to 表示没有必要，含义不能互换。'],
    [
      ['强调义务', '主语 + must + 动词原形.', '常由说话者强调或用于明确规定。'],
      ['客观要求', '主语 + have/has to + 动词原形.', '常来自制度、环境或客观条件。'],
      ['没有必要', "主语 + don't/doesn't have to + 动词原形.", '表示可以不做，而不是禁止。'],
    ],
    ["mustn't 与 don't have to", "mustn't 是不允许；don't have to 是可做可不做。", ["You mustn't enter this room.", "You don't have to wait outside."]],
    ['comparison', '义务强度和否定含义', ['must/have to → 必须', "mustn't → 禁止", "don't have to → 不必"]],
    ['Mia has to wear a helmet, but she does not have to bring one from home.', '米娅必须戴头盔，但她不必从家里带。', 'has to 表示规定，does not have to 表示没有必要。'],
  ),

  grammar(
    'eng-unit-g7b-keep-fit-grammar-how-often',
    ['How often 询问重复发生的频率，不询问具体时刻。', '问句中的 do/does 由主语决定，does 后动词恢复原形。'],
    [
      ['非第三人称单数', 'How often do + I/you/we/they + 动词原形?', '用频度副词或频率短语回答。'],
      ['第三人称单数', 'How often does + he/she/单数名词 + 动词原形?', 'does 已承担第三人称变化。'],
      ['频率回答', 'once/twice/数字 + times + a week/month', 'once 和 twice 是特殊形式。'],
    ],
    ['How often 与 When', 'How often 问重复频率；When 问某次活动发生的时间。', ['How often do you swim?', 'When do you swim this week?']],
    ['timeline', '频率从高到低', ['every day：每天', 'twice a week：每周两次', 'once a month：每月一次']],
    ['How often does your brother cycle? He cycles three times a week.', '你哥哥多久骑一次车？他每周骑三次。', '问句 does 后用 cycle，答句单数主语使用 cycles。'],
  ),
  grammar(
    'eng-unit-g7b-keep-fit-grammar-advice-health',
    ['should 用于给出建议或说明理想做法，后接动词原形。', '动词 -ing 短语可以整体作主语，谓语通常按单数处理。'],
    [
      ['肯定建议', '主语 + should + 动词原形.', '说明推荐采取的行动。'],
      ['否定建议', "主语 + shouldn't + 动词原形.", '说明不推荐的行动。'],
      ['活动作主语', 'Doing ... + is/helps/keeps ...', '把一项活动看作一个整体。'],
    ],
    ['should 与 must', 'should 表示建议，通常允许选择；must 表示强义务或明确要求。', ['You should rest after training.', 'You must stop when the light is red.']],
    ['sentence-map', '建议句先确定主语', ['对某人建议 → You should do', '建议不做 → You should not do', '评价活动 → Doing ... is ...']],
    ['Getting enough sleep helps your mind stay ready to learn.', '获得充足睡眠能让大脑保持良好的学习状态。', 'Getting enough sleep 作整体主语，谓语使用 helps。'],
  ),

  grammar(
    'eng-unit-g7b-eat-well-grammar-count-uncount',
    ['先判断名词在当前词义下能否直接计数。', '可数复数和不可数名词使用的数量限定词不同，some/any 可用于两类。'],
    [
      ['可数复数', 'many/(a) few + 可数名词复数', 'few 表示数量少，名词必须用复数。'],
      ['不可数名词', 'much/(a) little + 不可数名词', '名词不加复数词尾。'],
      ['两类通用', 'some/any/a lot of + 名词', '根据句型和语气选择 some 或 any。'],
    ],
    ['a few/few 与 a little/little', '带 a 表示“有一些”；不带 a 往往强调“几乎没有”。', ['We have a few apples.', 'There is little sugar left.']],
    ['comparison', '先分类再选数量词', ['可数：many eggs / a few tomatoes', '不可数：much water / a little oil', '都可用：some / any / a lot of']],
    ['There is a little cheese and a few grapes on the plate.', '盘子里有一点奶酪和几颗葡萄。', 'cheese 不可数用 a little，grapes 可数复数用 a few。'],
  ),
  grammar(
    'eng-unit-g7b-eat-well-grammar-quantities-comparison',
    ['How many 后接可数名词复数，How much 后接不可数名词或用于询价。', '两者比较时使用比较级，并用 than 引出比较对象。'],
    [
      ['询问可数数量', 'How many + 可数名词复数 + ...?', '答案给出可直接计数的数量。'],
      ['询问不可数数量', 'How much + 不可数名词 + ...?', '答案给出总量或量词结构。'],
      ['比较选择', 'A + be + 形容词比较级 + than + B.', '比较级只使用一种正确形式。'],
    ],
    ['fewer 与 less', 'fewer 修饰可数复数；less 修饰不可数名词。', ['fewer biscuits', 'less sugar']],
    ['comparison', '数量和比较的判断顺序', ['能直接计数 → How many / fewer', '不能直接计数 → How much / less', '比较性质 → 比较级 + than']],
    ['How much salt is in this soup, and is it lighter than the other one?', '这份汤里有多少盐？它比另一份清淡吗？', 'salt 不可数用 How much，lighter than 构成比较。'],
  ),

  grammar(
    'eng-unit-g7b-here-and-now-grammar-present-continuous',
    ['现在进行时描述说话时正在发生或当前阶段临时进行的动作。', '结构必须同时包含 am/is/are 和动词 -ing。'],
    [
      ['肯定', '主语 + am/is/are + 动词-ing.', 'be 根据主语变化。'],
      ['否定', '主语 + am/is/are not + 动词-ing.', 'not 放在 be 后。'],
      ['疑问', 'Am/Is/Are + 主语 + 动词-ing?', '把 be 提到主语前。'],
    ],
    ['doing 形式与动名词', '两者外形相同；现在分词与 be 构成进行时，动名词可作名词成分。', ['They are reading now.', 'Reading is useful.']],
    ['sentence-map', '进行时的三个必要部分', ['主语', 'am/is/are', '动词-ing + 当前情境']],
    ['The students are carrying chairs into the hall now.', '学生们现在正把椅子搬进礼堂。', '复数主语 students 使用 are carrying。'],
  ),
  grammar(
    'eng-unit-g7b-here-and-now-grammar-simple-vs-continuous',
    ['一般现在时描述习惯、规律和稳定事实。', '现在进行时描述此刻动作或当前阶段的临时情况。'],
    [
      ['习惯或事实', '主语 + 一般现在时谓语', '常与 usually、often、every day 连用。'],
      ['当前动作', '主语 + am/is/are + 动词-ing', '常与 now、look、listen、at the moment 连用。'],
      ['习惯与当前对照', 'usually + 一般现在时, but today + 现在进行时', '在一句中突出临时变化。'],
    ],
    ['状态动词与动作动词', 'know、like、believe 等状态动词通常不用进行时；run、write 等动作动词可用。', ['I know the answer.', 'I am writing the answer.']],
    ['comparison', '先看时间范围和动词意义', ['经常、通常 → 一般现在时', '此刻、目前 → 现在进行时', '状态动词 → 通常不用进行时']],
    ['Our teacher usually uses the screen, but today she is drawing on the board.', '老师通常使用屏幕，但今天她正在黑板上画图。', 'usually 对应习惯，today 对应临时动作。'],
  ),

  grammar(
    'eng-unit-g7b-rain-or-shine-grammar-weather-it',
    ['描述天气、温度或时间时常用无具体所指的 it 作主语。', '天气形容词、天气动词和将来预测使用不同结构。'],
    [
      ['天气状态', 'It is + sunny/cloudy/windy/...', 'be 后接天气形容词。'],
      ['正在发生', 'It is raining/snowing.', 'be + 天气动词-ing 表示当前降水。'],
      ['可能或将来', 'It may/will be + 天气形容词.', '情态动词后使用 be 原形。'],
    ],
    ['rainy 与 raining', 'rainy 是形容词，说明天气多雨；raining 是 rain 的现在分词，说明正在下雨。', ['It is rainy in summer.', 'It is raining now.']],
    ['sentence-map', '天气句保持完整主语', ['状态：It is sunny', '当前：It is raining', '预测：It may be windy']],
    ['It will be cooler near the coast tomorrow morning.', '明天早晨沿海地区会更凉爽。', '天气预测使用 it will be 加形容词比较级 cooler。'],
  ),
  grammar(
    'eng-unit-g7b-rain-or-shine-grammar-weather-actions',
    ['长期天气规律使用一般现在时，眼前天气使用现在进行时。', '谈将来安排时，if 条件从句通常用一般现在时，主句可用 will。'],
    [
      ['气候规律', 'It often + 天气动词一般现在时 ...', '频度副词说明重复规律。'],
      ['当前天气', 'It is + 天气动词-ing + now.', '表示此刻正在发生。'],
      ['条件安排', '主语 + will + 动词原形 + if + 一般现在时.', 'if 从句不用 will 表示普通将来条件。'],
    ],
    ['if 从句与主句', '主句说明条件成立后的结果；if 从句提供条件并通常使用一般现在时。', ['We will walk if it stays dry.', 'If it rains, we will take the bus.']],
    ['timeline', '天气时间范围决定时态', ['长期规律 → often rains', '眼前动作 → is raining now', '将来条件 → will ... if it rains']],
    ['If the temperature drops tonight, we will move the plants indoors.', '如果今晚降温，我们会把植物搬到室内。', 'if 从句用 drops，主句用 will move。'],
  ),

  grammar(
    'eng-unit-g7b-day-to-remember-grammar-simple-past',
    ['一般过去时描述过去某个明确时间发生并结束的动作或状态。', 'be 动词使用 was/were；实义动词使用过去式，did 后恢复原形。'],
    [
      ['过去状态', '主语 + was/were + 其他成分.', '单数通常用 was，复数和 you 用 were。'],
      ['过去动作', '主语 + 动词过去式 + 其他成分.', '规则和不规则过去式都要核对。'],
      ['过去疑问', 'Did + 主语 + 动词原形 ...?', 'did 已表示过去，后面不用过去式。'],
    ],
    ['过去式与过去分词', '一般过去时直接使用过去式；完成时或被动语态才需要过去分词配合助动词。', ['She wrote a note yesterday.', 'She has written a note.']],
    ['timeline', '动作位于已经结束的过去', ['过去时间：yesterday/last week', '发生并结束：visited/saw/went', '现在回看：叙述结果']],
    ['Did the guide explain why the old bridge was important?', '向导解释那座古桥为什么重要了吗？', 'did 后用 explain 原形，从句过去状态用 was。'],
  ),
  grammar(
    'eng-unit-g7b-day-to-remember-grammar-past-sequence',
    ['last、yesterday 和时间段 + ago 可明确定位过去。', 'first、then、after that 和 finally 用来安排事件先后。'],
    [
      ['过去时间', 'last + 时间 / yesterday / 时间段 + ago', '通常与一般过去时连用。'],
      ['开始叙事', 'First, + 过去时句子.', '介绍动作链的第一步。'],
      ['继续与结束', 'Then/After that/Finally, + 过去时句子.', '保持同一过去时间框架。'],
    ],
    ['ago 与 before', 'ago 从说话的现在向前计算；before 需要由语境提供参照时间。', ['We met two days ago.', 'We had met before that day.']],
    ['timeline', '顺序词把过去动作排成线', ['First：起点', 'Then/After that：发展', 'Finally：结果']],
    ['First we checked the weather, then we packed our bags, and finally we left.', '我们先查看天气，然后收拾行李，最后出发。', '三个顺序词把同一过去时间中的动作连接起来。'],
  ),

  grammar(
    'eng-unit-g7b-once-upon-a-time-grammar-narrative-past',
    ['故事开头通常建立过去时间和人物背景。', '连续动作使用过去式，背景状态使用 was/were，情态动词 could 后接原形。'],
    [
      ['故事背景', 'Once ... + 主语 + was/were/lived ...', '交代时间、地点和人物状态。'],
      ['动作链', '主语 + 过去式 + and/but/so + 过去式', '保持同一过去时间框架。'],
      ['过去能力', '主语 + could/could not + 动词原形', 'could 后不使用过去式。'],
    ],
    ['was/were 与实义动词过去式', 'be 后接身份、状态或地点；实义动词过去式直接描述动作，不在前面再加 was。', ['The road was narrow.', 'The traveller crossed the road.']],
    ['timeline', '故事过去时的层次', ['背景：was/were/lived', '事件：found/opened/ran', '结果：returned/understood']],
    ['The door was heavy, but the girl pushed it open and stepped inside.', '门很重，但女孩把它推开并走了进去。', 'was 描述背景，pushed 和 stepped 构成动作链。'],
  ),
  grammar(
    'eng-unit-g7b-once-upon-a-time-grammar-story-connectors',
    ['when 和 while 建立动作发生的时间关系，as soon as 强调紧接发生。', 'because 引出原因，so 引出结果；同一关系通常只选一个连接词。'],
    [
      ['时间关系', 'when/while + 过去时从句, + 过去时主句', '说明动作发生的背景或交点。'],
      ['紧接发生', 'as soon as + 过去时从句, + 过去时主句', '第二个动作紧随第一个动作。'],
      ['因果关系', '结果 + because + 原因 / 原因, so + 结果', '根据要突出的位置选择连接词。'],
    ],
    ['because/so 与 although/but', 'because 和 so 不重复连接同一因果；although 和 but 不重复连接同一转折。', ['She stayed because it was dark.', 'It was dark, so she stayed.']],
    ['sentence-map', '连接词标明事件关系', ['when/as soon as → 时间', 'because → 原因', 'so → 结果；although/but → 转折']],
    ['As soon as the bell rang, the horse turned and ran towards the village.', '铃声一响，那匹马就转身朝村庄跑去。', 'as soon as 强调 rang 后 turned 和 ran 紧接发生。'],
  ),
];

module.exports = GRAMMAR_DEPTH;
