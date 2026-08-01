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
    'eng-unit-g8b-time-to-relax-grammar-present-perfect-duration',
    ['动作或状态从过去开始，并且在说话时仍在持续或仍然成立。', 'for 后接一段时长，since 后接过去的起点；短暂动作通常不能直接表示持续状态。'],
    [
      ['肯定', '主语 + have/has + 过去分词 + for/since ...', 'have/has 与主语一致，过去分词不能用过去式代替。'],
      ['否定', "主语 + haven't/hasn't + 过去分词 + for/since ...", '否定说明这段持续时间内没有发生或保持某状态。'],
      ['询问时长', 'How long + have/has + 主语 + 过去分词 ...?', '回答通常使用 for 或 since。'],
    ],
    ['for 与 since', 'for 说明持续了多长时间；since 标明持续从何时开始。', ['I have kept this notebook for two years.', 'I have kept this notebook since 2024.']],
    ['timeline', '从过去延伸到现在', ['起点：since last summer', '持续段：for eight months', '现在：爱好仍在继续']],
    ['How long have you had this model plane?', '你拥有这架模型飞机多久了？', 'have 在这里表示“拥有”，可与 How long 和现在完成时连用。'],
  ),
  grammar(
    'eng-unit-g8b-time-to-relax-grammar-gerunds-hobbies',
    ['动名词把一个动作当作活动或事情来谈，作主语时通常使用单数谓语。', 'enjoy、finish、practise、avoid、consider 等动词后接 doing；介词后也使用 doing。'],
    [
      ['作主语', 'Doing ... + 单数谓语 + ...', '较长的动名词短语仍作为一个整体。'],
      ['作动词宾语', 'enjoy/finish/practise/avoid + doing', '这些动词的支配形式需要逐词记忆。'],
      ['介词之后', '介词 + doing', '如 be interested in doing、be good at doing。'],
    ],
    ['doing 与 to do', 'doing 常强调活动本身或已有经验；to do 常表示目的、计划或特定动词的不定式宾语，不能随意互换。', ['I enjoy painting outdoors.', 'I plan to paint outdoors tomorrow.']],
    ['sentence-map', '动名词的三个位置', ['句首作主语 → Reading helps', '特定动词后 → enjoy reading', '介词后 → good at reading']],
    ['Keeping a hobby journal helps me notice my progress.', '记录爱好日志帮助我发现自己的进步。', 'Keeping a hobby journal 作主语，谓语使用 helps。'],
  ),

  grammar(
    'eng-unit-g8b-stay-healthy-grammar-health-modals',
    ['情态动词后直接接动词原形，不随主语改变。', 'should 表示一般建议，had better 针对具体情况且语气较强，must 表示必要义务；must not 表示禁止。'],
    [
      ['一般建议', '主语 + should/should not + 动词原形', '适合提出通常有益的健康建议。'],
      ['具体警告', '主语 + had better (not) + 动词原形', '常暗示不听建议可能有不良后果。'],
      ['必要或禁止', '主语 + must/must not + 动词原形', 'must 表必要，must not 表禁止。'],
    ],
    ['must not 与 do not have to', 'must not 表示“不准做”；do not have to 表示“没有必要做”，并非禁止。', ['You must not share medicine with others.', 'You do not have to exercise when you have a high fever.']],
    ['comparison', '建议语气阶梯', ['should → 一般建议', 'had better → 具体且较强', 'must / must not → 必须 / 禁止']],
    ['You had better ask an adult before taking any medicine.', '服用任何药物前，你最好先询问成年人。', 'had better 后使用 ask 原形，安全建议也明确需要成人参与。'],
  ),
  grammar(
    'eng-unit-g8b-stay-healthy-grammar-present-perfect-health',
    ['过去的健康事件对现在仍有结果，或状态从过去持续到现在时使用现在完成时。', 'already 常用于肯定句，yet 常位于疑问句或否定句末，since/for 说明持续时间。'],
    [
      ['肯定结果', '主语 + have/has + already + 过去分词', '强调到现在已经完成的健康行动。'],
      ['疑问', 'Have/Has + 主语 + 过去分词 + yet?', '询问截至现在是否完成。'],
      ['否定', "主语 + haven't/hasn't + 过去分词 + yet", '说明截至现在尚未完成。'],
    ],
    ['现在完成时与一般过去时', '现在完成时不与 yesterday、last night 等明确结束的过去时间直接连用；一般过去时说明已结束的过去事件。', ['I have taken my temperature.', 'I took my temperature this morning.']],
    ['timeline', '健康行动与当前结果', ['过去：症状开始或采取行动', '现在：结果仍然相关', '线索：already / yet / since / for']],
    ['The swelling has already become smaller after the cold compress.', '冷敷后肿胀已经减轻。', 'has become 表示变化结果在现在仍可观察。'],
  ),

  grammar(
    'eng-unit-g8b-growing-up-grammar-used-to',
    ['used to + 动词原形表示过去反复发生的习惯或过去存在、现在已经改变的状态。', '否定和疑问通常借助 did，此时写 use to；used to 没有现在时形式。'],
    [
      ['肯定', '主语 + used to + 动词原形', '暗示现在通常已不再如此。'],
      ['否定', "主语 + didn't use to + 动词原形", 'did 已承担过去时标记。'],
      ['疑问', 'Did + 主语 + use to + 动词原形?', '简短回答使用 did/did not。'],
    ],
    ['used to do 与 be used to doing', 'used to do 表示过去习惯；be used to doing 表示习惯于做某事，其中 to 是介词。', ['I used to avoid group work.', 'I am used to sharing ideas in a group now.']],
    ['timeline', '过去习惯发生变化', ['过去：used to depend on others', '变化：learned and practised', '现在：can work independently']],
    ['My brother did not use to plan his time carefully.', '我哥哥过去不习惯认真规划时间。', 'did not 后使用 use，而不是 used。'],
  ),
  grammar(
    'eng-unit-g8b-growing-up-grammar-emotion-causes',
    ['-ed 形容词通常描述人如何感受，-ing 形容词描述引发这种感受的人、事或情况。', 'make 后可接宾语加形容词或不带 to 的动词原形。'],
    [
      ['人的感受', '人 + be/feel + -ed 形容词', '如 interested、worried、disappointed。'],
      ['感受来源', '人/事 + be + -ing 形容词', '如 interesting、worrying、disappointing。'],
      ['造成影响', 'make + sb + 形容词/动词原形', 'make sb do 中不使用 to。'],
    ],
    ['-ed 与 -ing 形容词', '选择取决于句中对象是感受者还是感受来源，而不是机械地只看主语是否为人。', ['The long wait was tiring.', 'The passengers were tired.']],
    ['sentence-map', '感受关系', ['来源 → an encouraging message', '影响 → makes me hopeful', '感受者 → I am encouraged']],
    ['The honest feedback made me think more carefully about my choice.', '坦诚的反馈让我更认真地思考自己的选择。', 'make me think 后使用不带 to 的动词原形。'],
  ),

  grammar(
    'eng-unit-g8b-wonder-of-nature-grammar-present-perfect-experience',
    ['现在完成时可询问或陈述截至现在的人生经历，不说明已经结束的具体过去时间。', 'ever 常用于疑问，never 自带否定意义，before 常位于句末。'],
    [
      ['询问经历', 'Have/Has + 主语 + ever + 过去分词 ...?', 'ever 表示“曾经”。'],
      ['否定经历', '主语 + have/has + never + 过去分词 ...', 'never 前不再加 not。'],
      ['曾经发生', '主语 + have/has + 过去分词 + before', 'before 表示在现在之前曾有该经历。'],
    ],
    ['现在完成时与一般过去时', '先问是否有经历可用现在完成时；继续询问何时、何地等已结束细节时改用一般过去时。', ['Have you ever visited a canyon?', 'When did you visit it?']],
    ['timeline', '经历提问的两步', ['截至现在：Have you ever ...?', '回答经历：Yes, I have.', '追问细节：When did ...?']],
    ['We have seen this waterfall before, but never in winter.', '我们以前见过这座瀑布，但从未在冬天见过。', 'have seen 表示截至现在的经历，before 不给出具体过去时间。'],
  ),
  grammar(
    'eng-unit-g8b-wonder-of-nature-grammar-measurements',
    ['描述尺寸时，数字和单位放在 long、wide、high、deep 等形容词之前。', '倍数结构使用 twice/three times + as + 原级 + as，并明确比较对象。'],
    [
      ['直接尺寸', '数字 + 单位复数 + long/wide/high/deep', '数值大于一时单位通常使用复数。'],
      ['同等尺寸', 'as + 原级 + as', '表示两个对象在某一维度相同。'],
      ['倍数比较', 'twice/数字 + times + as + 原级 + as', '倍数置于第一个 as 前。'],
    ],
    ['high 与 tall', 'high 常描述山、墙、建筑等从底部到顶部的高度；tall 常描述人、树或窄而直立的物体。', ['The cliff is 80 metres high.', 'The tree is 30 metres tall.']],
    ['comparison', '尺寸表达顺序', ['数值：twenty', '单位：metres', '维度：wide / high / deep']],
    ['At its widest point, the lake is nearly five kilometres wide.', '在最宽处，这座湖接近五千米宽。', '数字和单位 nearly five kilometres 放在尺寸形容词 wide 前。'],
  ),

  grammar(
    'eng-unit-g8b-natures-temper-grammar-past-continuous',
    ['过去进行时描述过去某一时刻正在进行的背景动作，结构为 was/were + doing。', 'when 常引出打断背景的短动作，while 常连接持续动作；具体选择仍取决于动作关系。'],
    [
      ['背景被打断', '主语 + was/were doing when + 一般过去时', '正在进行的长动作使用过去进行时。'],
      ['同时持续', 'While + 主语 + was/were doing, 主语 + was/were doing', '强调两个动作在一段时间内同时进行。'],
      ['否定或疑问', "主语 + wasn't/weren't doing / Was/Were + 主语 + doing?", 'be 动词承担否定和倒装。'],
    ],
    ['过去进行时与一般过去时', '过去进行时呈现动作过程或背景；一般过去时呈现完成的事件或打断动作。', ['The rain was falling heavily.', 'The warning arrived at six.']],
    ['timeline', '背景与突发事件', ['背景开始：people were sleeping', '突发点：the alarm rang', '随后行动：people left safely']],
    ['While volunteers were checking the doors, the power suddenly went out.', '志愿者检查门窗时，电力突然中断。', '持续背景用 were checking，突发事件用 went out。'],
  ),
  grammar(
    'eng-unit-g8b-natures-temper-grammar-emergency-imperatives',
    ['祈使句省略主语 you，以动词原形开头，适合给出简短明确的应急行动。', '否定祈使句使用 Do not/Don’t + 动词原形；顺序词应反映真实执行次序。'],
    [
      ['肯定指令', '动词原形 + 其他成分', '每一步尽量只表达一个清晰动作。'],
      ['否定指令', "Do not/Don't + 动词原形", '用于明确禁止危险行为。'],
      ['行动顺序', 'First ... Next ... Then ... Finally ...', '按时间或安全优先级排列步骤。'],
    ],
    ['祈使句与 must', '祈使句直接给指令；must + 动词原形说明必要规则，两者都可表达强要求。', ['Use the stairs.', 'You must use the stairs during an evacuation.']],
    ['sentence-map', '应急指令检查', ['动作：动词原形开头', '顺序：先避险再撤离', '禁止：Do not + 危险动作']],
    ['Stay away from damaged walls until an adult says the area is safe.', '在成年人确认区域安全之前，要远离受损墙体。', '祈使句以 Stay 原形开头，并给出安全结束条件。'],
  ),

  grammar(
    'eng-unit-g8b-crossing-cultures-grammar-cultural-modals',
    ['must 和 have to 表示必要，should 表示合适的建议，may 表示允许或可能。', '情态动词后接动词原形；have to 随时态和主语变化，must 本身不变。'],
    [
      ['必要规则', '主语 + must/have to + 动词原形', 'must 常体现说话者要求，have to 常说明外部规则或实际需要。'],
      ['礼仪建议', '主语 + should/should not + 动词原形', '说明尊重而合适的做法。'],
      ['允许或可能', '主语 + may + 动词原形', '语境决定表示许可还是可能性。'],
    ],
    ['must not 与 do not have to', 'must not 表示禁止；do not have to 表示没有必要、可以选择不做。', ['Guests must not enter this room.', 'Guests do not have to bring a gift.']],
    ['comparison', '文化情境中的语气', ['规则 → must / have to', '建议 → should', '允许或可能 → may']],
    ['You may ask the host when you are unsure about a local custom.', '不确定当地习俗时，你可以询问主人。', 'may 表示允许采取礼貌的询问方式。'],
  ),
  grammar(
    'eng-unit-g8b-crossing-cultures-grammar-passive-expectations',
    ['be expected to 和 be supposed to 用于表达社会规范、安排或他人期待。', 'be 动词必须与主语和时态一致，后面使用 to + 动词原形。'],
    [
      ['社会期待', '主语 + am/is/are expected to + 动词原形', '强调他人或社会对主语的期待。'],
      ['通常规范', '主语 + am/is/are supposed to + 动词原形', '说明按规定或惯例应当怎样做。'],
      ['否定', '主语 + am/is/are not expected/supposed to + 动词原形', 'not 放在 be 动词之后。'],
    ],
    ['主动期待与被动期待', 'expect sb to do 明确谁提出期待；sb be expected to do 把被期待的人或行为放在信息中心。', ['The school expects visitors to sign in.', 'Visitors are expected to sign in.']],
    ['sentence-map', '被动期待结构', ['主语：Guests', 'be：are', 'expected/supposed + to do']],
    ['At a formal meal, guests are expected to wait until everyone is served.', '正式用餐时，客人通常应等所有人都上餐后再开始。', 'are expected to 表达用餐礼仪期待。'],
  ),

  grammar(
    'eng-unit-g8b-good-read-grammar-present-perfect-reading',
    ['现在完成时说明截至现在的阅读进度或已完成阅读产生的当前结果。', 'just 和 already 常位于 have/has 后，yet 常位于疑问或否定句末。'],
    [
      ['刚刚完成', '主语 + have/has + just + 过去分词', '强调刚发生且与当前对话相关。'],
      ['已经完成', '主语 + have/has + already + 过去分词', '说明比预期早或截至现在已完成。'],
      ['尚未或是否', "Have/Has ... yet? / haven't/hasn't ... yet", 'yet 通常位于句末。'],
    ],
    ['现在完成时与一般过去时', '现在完成时关注当前进度或结果；一般过去时说明在明确过去时间完成的阅读。', ['I have finished the second chapter.', 'I finished the second chapter last night.']],
    ['timeline', '阅读进度线', ['起点：started the book', '当前：have read six chapters', '下一步：will continue tonight']],
    ['We have not discovered the main character’s secret yet.', '我们还没有发现主人公的秘密。', 'not ... yet 表示截至现在尚未发生。'],
  ),
  grammar(
    'eng-unit-g8b-good-read-grammar-reporting-opinions',
    ['think、believe、feel 等可接 that 引导的宾语从句转述完整观点，从句使用陈述语序。', 'find + 宾语 + 形容词可简洁表达评价；评价后应给出文本依据。'],
    [
      ['完整观点', 'I think/believe (that) + 陈述句', 'that 在非正式表达中常可省略。'],
      ['简洁评价', 'I find + 宾语 + 形容词', '形容词说明对宾语的评价。'],
      ['说明理由', 'The reason is that + 陈述句 / because + 原因', '理由要与评价直接对应。'],
    ],
    ['观点与事实概述', '观点包含判断并需要依据；事实概述只说明文本中发生了什么。', ['The hero leaves the village in Chapter Two.', 'I think the hero’s choice is brave because it protects others.']],
    ['sentence-map', '完整文学评价', ['观点：I find the ending hopeful', '依据：because the family reunites', '说明：this resolves the main conflict']],
    ['I believe the final decision shows how much the character has changed.', '我认为最后的决定体现了这个人物发生了多大变化。', 'believe 后接陈述语序的宾语从句。'],
  ),

  grammar(
    'eng-unit-g8b-making-difference-grammar-infinitives-volunteering',
    ['to + 动词原形可说明一个行动的目的，回答“为什么做”。', 'decide、hope、offer、plan、volunteer 等动词可接不定式作宾语；否定形式是 not to do。'],
    [
      ['说明目的', '主语 + 行动 + to + 动词原形', '目的动作的执行者通常与主句主语一致。'],
      ['动词宾语', 'decide/hope/offer/volunteer + to + 动词原形', '这些动词的支配结构需要整体记忆。'],
      ['否定不定式', 'not to + 动词原形', 'not 放在 to 前。'],
    ],
    ['目的不定式与 for', 'to do 后接动作；for 后通常接名词或代词，不能用 for do 表目的。', ['We met to plan the event.', 'This room is for community meetings.']],
    ['sentence-map', '志愿行动结构', ['行动：collected old books', '目的：to support the library', '计划：decided to continue']],
    ['The group volunteered to prepare simple guides for new visitors.', '小组自愿为新访客准备简明指南。', 'volunteer 后接 to prepare。'],
  ),
  grammar(
    'eng-unit-g8b-making-difference-grammar-present-perfect-impact',
    ['过去开始的公益行动对现在仍有可见结果，或从过去持续到现在时使用现在完成时。', 'so far 和 up to now 表示截至现在，since 标起点，for 标持续时长。'],
    [
      ['当前成果', '主语 + have/has + 过去分词 + so far', '可与明确的成果数量连用。'],
      ['持续支持', '主语 + have/has + 过去分词 + since/for ...', '说明行动或状态持续至今。'],
      ['疑问进展', 'How much/many + have/has + 主语 + 过去分词 ...?', '询问截至现在累计的成果。'],
    ],
    ['现在完成时与一般过去时', '现在完成时统计截至现在的影响；一般过去时报告已结束阶段在具体过去时间取得的结果。', ['The project has helped 80 families so far.', 'The project helped 20 families last month.']],
    ['timeline', '公益行动的累计影响', ['起点：started in March', '累计：has collected 300 books', '现在：service continues']],
    ['Our volunteers have repaired twelve bicycles up to now.', '到目前为止，我们的志愿者已经修好了十二辆自行车。', 'up to now 与现在完成时 have repaired 连用。'],
  ),
];

module.exports = GRAMMAR_DEPTH;
