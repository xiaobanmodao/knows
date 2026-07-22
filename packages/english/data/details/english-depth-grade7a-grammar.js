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
    'eng-unit-g7a-starter-hello-grammar-greetings',
    ['根据见面时间选择 morning、afternoon 或 evening。', 'Nice to meet you 主要用于初次见面，回应通常加 too。'],
    [
      ['见面问候', 'Good morning/afternoon/evening, + 称呼.', '按时段使用，称呼前用逗号。'],
      ['初次见面', 'Nice to meet you.', '介绍后表达认识对方的愉快。'],
      ['礼貌回应', 'Nice to meet you too.', 'too 表示“我也一样”，常放句末。'],
    ],
    ['Good night', 'Good evening 用于晚上见面；Good night 通常用于夜间告别或睡前。', ['Good evening, Mr Li.', 'Good night. See you tomorrow.']],
    ['comparison', '先判断交际阶段', ['见面：Good morning/afternoon/evening', '介绍：Nice to meet you', '离开或睡前：Goodbye/Good night']],
    ['Good morning, everyone. It is nice to meet you all.', '大家早上好，很高兴认识你们。', '先按时段问候，再用 meet 表示初次见面。'],
  ),
  grammar(
    'eng-unit-g7a-starter-hello-grammar-question-spelling',
    ['What 用于询问名称或信息内容。', 'How 用于询问方式；拼写问句需要助动词 do。'],
    [
      ['询问名称', 'What is + 名词/代词?', '询问某人或某物是什么。'],
      ['询问拼写', 'How do you spell + 名词?', '主语为 you 时使用 do。'],
      ['礼貌请求', 'Could you spell + 名词, please?', '用 could 降低命令感。'],
    ],
    ['What 与 How', 'What 询问答案内容，How 询问完成动作的方式。', ['What is your family name?', 'How do you spell your family name?']],
    ['sentence-map', '疑问词决定答案类型', ['What → 名称或内容', 'How → 方式', 'How do you spell ...? → 字母顺序']],
    ['How do you spell the name of your city?', '你怎样拼写你所在城市的名字？', 'How 后接一般疑问句语序 do you spell。'],
  ),

  grammar(
    'eng-unit-g7a-starter-keep-tidy-grammar-possessives',
    ['形容词性物主代词必须放在名词前。', '名词性物主代词独立使用，代替“物主代词 + 名词”。'],
    [
      ['名词前', 'my/your/his/her/its/our/their + 名词', '指出名词属于谁。'],
      ['独立使用', 'mine/yours/his/hers/ours/theirs', '避免重复已经明确的名词。'],
      ['同义替换', 'This is my book. = This book is mine.', '两种结构表达同一归属关系。'],
    ],
    ['its 与 it’s', 'its 是形容词性物主代词；it’s 是 it is 或 it has 的缩写。', ['The cat moves its tail.', "It's under the chair."]],
    ['comparison', '物主代词位置', ['名词前：my book', '句末或表语：The book is mine', '不能说：mine book']],
    ['Their classroom is on the second floor, and ours is on the third.', '他们的教室在二楼，我们的在三楼。', 'ours 代替 our classroom，避免重复。'],
  ),
  grammar(
    'eng-unit-g7a-starter-keep-tidy-grammar-whose-demonstratives',
    ['whose 用于询问物品的所有者。', 'this/that 搭配单数，these/those 搭配复数。'],
    [
      ['近处单数', 'Whose + 单数名词 + is this?', 'this 指靠近说话者的一件物品。'],
      ['远处单数', 'Whose + 单数名词 + is that?', 'that 指较远的一件物品。'],
      ['复数问句', 'Whose + 复数名词 + are these/those?', '复数主语与 are 搭配。'],
    ],
    ['whose 与 who’s', 'whose 询问归属；who’s 是 who is 或 who has。', ['Whose bag is this?', "Who's at the door?"]],
    ['sentence-map', '距离和数量共同决定指示词', ['近 + 单：this', '远 + 单：that', '近 + 复：these；远 + 复：those']],
    ['Whose gloves are those beside the window?', '窗边的那些手套是谁的？', 'gloves 和 those 都是复数，因此使用 are。'],
  ),

  grammar(
    'eng-unit-g7a-starter-welcome-grammar-there-be',
    ['there be 用于说明某处存在某人或某物。', 'be 动词通常与离它最近的名词在数上保持一致。'],
    [
      ['单数或不可数', 'There is + 单数/不可数名词 + 地点.', 'is 与最近的单数或不可数名词搭配。'],
      ['复数', 'There are + 复数名词 + 地点.', 'are 与最近的复数名词搭配。'],
      ['并列名词', 'There is/are + A + and + B ...', '按就近原则观察 A 的数。'],
    ],
    ['there be 与 have', 'there be 强调某地存在；have 强调某人或某物拥有。', ['There is a garden behind the house.', 'The house has a small garden.']],
    ['sentence-map', '存在句的信息顺序', ['地点背景', 'There is/are + 存在的人或物', '句尾补充位置']],
    ['There is some fresh milk and two apples in the fridge.', '冰箱里有一些鲜牛奶和两个苹果。', '紧邻 be 的 milk 不可数，因此使用 is。'],
  ),
  grammar(
    'eng-unit-g7a-starter-welcome-grammar-number-nouns',
    ['one 后接单数可数名词。', 'two 及以上通常接复数；不规则复数需要单独记忆。'],
    [
      ['一个', 'one/a/an + 单数可数名词', '名词保持单数。'],
      ['多个', 'two/three/... + 复数可数名词', '通常加 -s 或 -es。'],
      ['不规则复数', 'child → children; goose → geese', '不能直接在原词后加 -s。'],
    ],
    ['可数与不可数', '数词直接修饰可数名词；不可数名词通常借助量词表达数量。', ['three rabbits', 'three bottles of water']],
    ['comparison', '先判断名词能否直接计数', ['可数单数：one rabbit', '可数复数：two rabbits', '不可数：two bottles of water']],
    ['Four geese are walking behind one sheep.', '四只鹅正走在一只羊后面。', 'geese 是 goose 的复数，sheep 单复数同形。'],
  ),

  grammar(
    'eng-unit-g7a-you-and-me-grammar-be-pronouns',
    ['一般现在时中 I 与 am 搭配。', '第三人称单数用 is，you 和复数主语用 are。'],
    [
      ['第一人称单数', 'I am ...', 'am 只与 I 搭配。'],
      ['第三人称单数', 'He/She/It is ...', '单个人或事物使用 is。'],
      ['第二人称和复数', 'You/We/They are ...', 'you 无论单复数都使用 are。'],
    ],
    ['be 与实义动词', 'be 后可接身份、状态或地点；描述动作时使用实义动词。', ['She is friendly.', 'She plays tennis.']],
    ['sentence-map', '主语决定 be', ['I → am', 'he/she/it/单数名词 → is', 'you/we/they/复数名词 → are']],
    ['My brother is fourteen, and I am thirteen.', '我哥哥十四岁，我十三岁。', '英语表达年龄使用 be 动词。'],
  ),
  grammar(
    'eng-unit-g7a-you-and-me-grammar-wh-personal-info',
    ['先根据所需信息选择 what、where、how old 或 which。', '疑问词后仍需保持正确的一般疑问句语序。'],
    [
      ['询问内容', 'What + be/do + 主语 ...?', '询问姓名、爱好等内容。'],
      ['询问地点或来源', 'Where + be/do + 主语 ...?', '询问来自哪里或位于哪里。'],
      ['询问有限选择', 'Which + 名词 + be/do + 主语 ...?', '在明确范围内选择。'],
    ],
    ['what 与 which', 'what 面向开放答案；which 通常在已知或有限范围内选择。', ['What is your favourite sport?', 'Which club do you want to join?']],
    ['sentence-map', '问题与答案配对', ['What → 内容', 'Where → 地点或来源', 'How old → 年龄；Which → 范围内选择']],
    ['Which grade is your new classmate in?', '你的新同学读几年级？', 'which grade 在有限年级范围内提问。'],
  ),

  grammar(
    'eng-unit-g7a-were-family-grammar-present-have',
    ['一般现在时描述稳定关系、习惯或经常发生的动作。', '第三人称单数主语使用 has，其他人称使用 have。'],
    [
      ['非第三人称单数', 'I/You/We/They have ...', 'have 保持原形。'],
      ['第三人称单数', 'He/She/It has ...', 'have 的第三人称单数是不规则形式 has。'],
      ['一般动作', '第三人称单数 + 动词 -s/-es', '其他实义动词也需要第三人称单数变化。'],
    ],
    ['have 与 there be', 'have 表示主语拥有；there be 表示某处存在。', ['Our school has a garden.', 'There is a garden in our school.']],
    ['sentence-map', '先判断主语人称和数量', ['I/you/we/they → have', 'he/she/it/单数名词 → has', '否定：do not/does not have']],
    ['My cousin has a camera and often takes family photos.', '我的表姐有一台相机，经常拍家庭照片。', '单数 cousin 同时要求 has 和 takes。'],
  ),
  grammar(
    'eng-unit-g7a-were-family-grammar-possessive-case',
    ['单数名词和不以 s 结尾的复数名词通常加 ’s。', '以 s 结尾的复数名词通常只加撇号。'],
    [
      ['单数所有者', "单数名词 + 's + 名词", '表示某一个人或事物所有。'],
      ['规则复数所有者', "复数名词-s + ' + 名词", '撇号放在复数 s 后。'],
      ['共同所有', "A and B's + 名词", '只有最后一个名字加 ’s。'],
    ],
    ['共同所有与分别所有', 'A and B’s 表示共同拥有；A’s and B’s 表示各自拥有。', ["Tom and Lily's room", "Tom's and Lily's rooms"]],
    ['comparison', '撇号位置表达所有者数量', ["sister's bike：一个姐姐", "parents' room：父母双方", "children's books：不规则复数"]],
    ["The children's drawings are on their grandparents' wall.", '孩子们的画贴在祖父母家的墙上。', 'children 是不规则复数加 ’s，grandparents 是规则复数只加撇号。'],
  ),

  grammar(
    'eng-unit-g7a-my-school-grammar-there-be-location',
    ['把 be 动词移到 there 前构成一般疑问句。', '在 be 后加 not 构成否定句。'],
    [
      ['单数疑问', 'Is there + 单数/不可数名词 ...?', '肯定回答用 Yes, there is.。'],
      ['复数疑问', 'Are there + 复数名词 ...?', '肯定回答用 Yes, there are.。'],
      ['否定', 'There is not/isn’t ...; There are not/aren’t ...', 'not 紧跟 is 或 are。'],
    ],
    ['any 与 some', '疑问和否定句常用 any；肯定句通常用 some。', ['Are there any computers?', 'There are some computers.']],
    ['sentence-map', '陈述句变疑问句', ['There is/are ...', 'is/are 提到 there 前', 'Is/Are there ...?']],
    ['Is there any water in the classroom? No, there isn’t.', '教室里有水吗？没有。', 'water 不可数，因此使用 Is there。'],
  ),
  grammar(
    'eng-unit-g7a-my-school-grammar-place-prepositions',
    ['方位介词后接名词或代词构成介词短语。', '选择介词时要明确参照物、方向和是否穿越。'],
    [
      ['相邻', 'next to/beside + 名词', '表示紧挨着。'],
      ['两者之间', 'between A and B', '必须给出两个参照对象。'],
      ['对面或前后', 'across from/in front of/behind + 名词', '描述相对位置。'],
    ],
    ['in front of 与 in the front of', 'in front of 在物体外部前方；in the front of 在物体内部前部。', ['A tree is in front of the bus.', 'The driver sits in the front of the bus.']],
    ['sentence-map', '位置关系三要素', ['目标物', '方位介词', '参照物']],
    ['The art room is across from the library and next to the stairs.', '美术教室在图书馆对面，紧挨着楼梯。', '两个介词短语从不同参照物描述同一地点。'],
  ),

  grammar(
    'eng-unit-g7a-favourite-subject-grammar-conjunctions-reason',
    ['and 连接并列或递进信息。', 'but 表示转折，because 引出原因从句。'],
    [
      ['并列', 'A and B', '连接语法地位相同的内容。'],
      ['转折', 'A, but B', 'B 与 A 的预期不同。'],
      ['原因', '结果 + because + 主语 + 谓语', 'because 后必须是完整从句。'],
    ],
    ['because 与 because of', 'because 后接从句；because of 后接名词、代词或 doing。', ['We stayed because it rained.', 'We stayed because of the rain.']],
    ['sentence-map', '逻辑连接词', ['and → 增加信息', 'but → 转折', 'because → 说明原因']],
    ['I like science because it answers questions about the world.', '我喜欢科学，因为它能回答关于世界的问题。', 'because 后接 it answers... 这一完整从句。'],
  ),
  grammar(
    'eng-unit-g7a-favourite-subject-grammar-time-prepositions',
    ['at 用于具体钟点或较短时间点。', 'on 用于具体日期或某天的早午晚，in 用于较长时段。'],
    [
      ['时间点', 'at + 钟点/noon/night', '强调具体时刻。'],
      ['具体日子', 'on + 星期/日期/某天的早午晚', '强调日历中的一天。'],
      ['较长时段', 'in + 月份/季节/年份/泛指早午晚', '强调较长时间范围。'],
    ],
    ['on Monday morning 与 in the morning', '有具体星期时用 on；泛指早晨时用 in。', ['on Friday afternoon', 'in the afternoon']],
    ['timeline', '时间范围从小到大', ['at 8:00：时间点', 'on Monday：一天', 'in September：月份']],
    ['Our geography lesson begins at nine on Thursday morning.', '我们的地理课星期四上午九点开始。', '钟点用 at，具体某天的上午用 on。'],
  ),

  grammar(
    'eng-unit-g7a-fun-clubs-grammar-modal-can',
    ['can 表示现在具备的能力，也可用于请求或许可。', 'can 后始终接动词原形，不随主语变化。'],
    [
      ['肯定', '主语 + can + 动词原形.', 'can 后不用 to。'],
      ['否定', '主语 + cannot/can’t + 动词原形.', 'cannot 通常写成一个词。'],
      ['疑问', 'Can + 主语 + 动词原形?', '把 can 提到主语前。'],
    ],
    ['can 与 be able to', 'can 是常用情态动词；be able to 可根据时态改变 be 的形式。', ['She can swim.', 'She will be able to swim.']],
    ['sentence-map', 'can 句型不改变实义动词', ['肯定：can do', '否定：cannot do', '疑问：Can ... do?']],
    ['Can your brother play a musical instrument?', '你哥哥会演奏乐器吗？', 'can 提到主语前，play 保持原形。'],
  ),
  grammar(
    'eng-unit-g7a-fun-clubs-grammar-verb-patterns-club',
    ['want 和 would like 后通常接 to do。', 'enjoy 和介词 at 后接动词 -ing。'],
    [
      ['想做', 'want to do', '语气直接，表达愿望。'],
      ['愿意做', 'would like to do', '比 want 更委婉。'],
      ['喜欢或擅长', 'enjoy doing; be good at doing', 'doing 作宾语。'],
    ],
    ['to do 与 doing', '不同动词或介词决定后接形式，不能只按中文“做”选择。', ['I want to paint.', 'I enjoy painting.']],
    ['sentence-map', '先看前面的动词或介词', ['want/would like → to do', 'enjoy → doing', '介词 at → doing']],
    ['She would like to join the drama club because she enjoys acting.', '她想加入戏剧社，因为她喜欢表演。', 'would like 后接 to join，enjoy 后接 acting。'],
  ),

  grammar(
    'eng-unit-g7a-day-in-life-grammar-clock-time',
    ['整点和分钟数可以直接按数字顺序读。', 'past 表示过了当前小时，to 表示距离下一小时还差多久。'],
    [
      ['直接读法', '6:15 = six fifteen', '先读小时，再读分钟。'],
      ['past 读法', '6:15 = a quarter past six', '分钟在 1 至 30 时常用 past。'],
      ['to 读法', '6:45 = a quarter to seven', '超过 30 分钟时可说距下一小时的分钟数。'],
    ],
    ['half past 与 half to', '英语标准钟点表达使用 half past 表示半点，不使用 half to。', ['6:30 = half past six', '6:45 = a quarter to seven']],
    ['timeline', '钟面从当前小时走向下一小时', ['6:15：quarter past six', '6:30：half past six', '6:45：quarter to seven']],
    ['The school bus leaves at twenty past seven.', '校车七点二十分出发。', '7:20 可用 twenty past seven 表达。'],
  ),
  grammar(
    'eng-unit-g7a-day-in-life-grammar-frequency-adverbs',
    ['频度副词描述动作发生的频率，常用于一般现在时。', '通常放在实义动词前、be 动词后。'],
    [
      ['实义动词', '主语 + always/usually/often/sometimes + 动词', '频度副词位于实义动词之前。'],
      ['be 动词', '主语 + be + 频度副词', '频度副词位于 be 之后。'],
      ['询问频率', 'How often + do/does + 主语 + 动词原形?', '用频率短语回答。'],
    ],
    ['sometimes 与 some times', 'sometimes 是“有时”；some times 是“几次”。', ['I sometimes walk home.', 'I tried it some times.']],
    ['comparison', '大致频率顺序', ['always：总是', 'usually/often：通常/经常', 'sometimes：有时；never：从不']],
    ['How often does Leo exercise? He usually exercises after school.', '利奥多久锻炼一次？他通常放学后锻炼。', '问句 does 后用 exercise 原形，答句第三人称单数用 exercises。'],
  ),

  grammar(
    'eng-unit-g7a-happy-birthday-grammar-dates-ordinals',
    ['日期中的日通常使用序数词。', '具体日期前使用介词 on。'],
    [
      ['月日在前', 'May 12 = May the twelfth', '先说月份再说序数词。'],
      ['日在前', '12 May = the twelfth of May', '序数词前有 the，并用 of 连接月份。'],
      ['介词结构', 'on + 具体日期', '表示事情发生在哪一天。'],
    ],
    ['序数词与基数词', '基数词表示数量，序数词表示顺序和日期中的“第几日”。', ['twelve candles', 'the twelfth of May']],
    ['timeline', '日期从大范围定位到一天', ['月份：May', '日期：the twelfth', '完整日期：on May the twelfth']],
    ['The new term starts on September the first.', '新学期九月一日开始。', '具体日期前使用 on，1st 读作 first。'],
  ),
  grammar(
    'eng-unit-g7a-happy-birthday-grammar-when-how-much',
    ['when 询问时间或日期。', 'how much 询问不可数数量或商品价格。'],
    [
      ['询问日期', 'When is + 事件?', '回答常用 It is on + 日期。'],
      ['询问单数价格', 'How much is + 单数/不可数名词?', '回答 It is + 价格。'],
      ['询问复数价格', 'How much are + 复数名词?', '回答 They are + 价格。'],
    ],
    ['how much 与 how many', 'how much 接不可数名词或询问价格；how many 接复数可数名词询问数量。', ['How much is the cake?', 'How many candles are there?']],
    ['sentence-map', '先判断要问的信息', ['时间或日期 → When', '价格或不可数数量 → How much', '可数数量 → How many']],
    ['How much are these two birthday cards? They are twelve yuan.', '这两张生日卡多少钱？十二元。', '复数 cards 要求问句用 are，回答用 They are。'],
  ),
];

module.exports = GRAMMAR_DEPTH;
