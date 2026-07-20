const { createBook, createUnit, grammar } = require('./english-unit-builder');

const g = grammar;

function unit(config) {
  return createUnit({ expressions: [], ...config });
}

const grade8Upper = createBook({
  id: 'eng-book-g8a-2024', gradeId: 'g8', semester: 'upper', label: '八年级上册', shortLabel: '八上',
  edition: '2024 年修订版', status: 'verified', sourceNote: '单元标题和顺序已按人教版八年级上册新版教材核对；词汇用法、语法讲解和例句由本项目按单元主题原创整理，不作为教材逐页词表。',
  units: [
    unit({
      id: 'eng-unit-g8a-happy-holiday', number: 1, title: 'Happy Holiday', theme: '假期经历与旅行见闻',
      expressions: ['Where did you go on holiday?', 'I visited a local market.', 'The trip was relaxing and meaningful.'],
      vocabulary: [
        ['holiday', '名词', '假期；节日', '表示一段休息时间，常与 on 连用。', '复数 holidays。', ['on holiday', 'summer holiday'], 'We went camping during the summer holiday.', '暑假期间我们去露营了。', 'on holiday 表示“在度假”，不加冠词。'],
        ['travel', '动词/名词', '旅行；游历', '作动词可不及物，作名词通常不可数。', 'travels；travelled/traveled；travelling/traveling。', ['travel around', 'travel by train'], 'My family travelled around the island by bus.', '我的家人乘公交环游了这座岛。', '表示一次旅行常用 trip 或 journey，不说 a travel。'],
        ['scenery', '名词', '风景；景色', '不可数，指某地自然景观的总体。', '不可数，无复数。', ['beautiful scenery', 'enjoy the scenery'], 'We stopped to enjoy the mountain scenery.', '我们停下来欣赏山景。', '不能说 sceneries；一处具体景象可用 scene。'],
        ['local', '形容词/名词', '当地的；当地人', '修饰地方事物，作名词时常用 the locals。', '复数 locals。', ['local food', 'local people'], 'A local guide showed us the old town.', '一位当地向导带我们参观了古城。', 'local 强调属于当前地区，不等同于 native。'],
        ['experience', '名词/动词', '经历；经验；体验', '表示可数经历时可复数，表示经验时不可数。', '复数 experiences；experienced；experiencing。', ['travel experience', 'experience local life'], 'Staying with a host family was a special experience.', '住在寄宿家庭是一次特别的经历。', 'work experience 中 experience 通常不可数。'],
        ['traditional', '形容词', '传统的', '描述长期传承的习俗、艺术或食物。', '名词 tradition；副词 traditionally。', ['traditional culture', 'traditional dish'], 'We learned to make a traditional paper lantern.', '我们学习制作传统纸灯笼。', 'tradition 是名词，不能直接修饰名词。'],
        ['souvenir', '名词', '纪念品', '旅行中为留念购买或保存的物品。', '复数 souvenirs。', ['buy a souvenir', 'souvenir shop'], 'I bought a postcard as a souvenir.', '我买了一张明信片作纪念。', 'souvenir 是可数名词，单数前需限定词。'],
        ['relax', '动词', '放松；使轻松', '人主动放松用 relax；事物令人放松用 relaxing。', 'relaxes；relaxed；relaxing；形容词 relaxed/relaxing。', ['relax by doing', 'feel relaxed'], 'We relaxed by the lake after a long walk.', '长途步行后我们在湖边放松。', '人感到轻松用 relaxed，事物令人轻松用 relaxing。'],
      ],
      grammar: [
        g('simple-past-review', '一般过去时：经历与事件链', '过去发生并结束的动作使用过去式；连续动作可用 then、after that 等连接。', ['主语 + 动词过去式 + ...', 'Did + 主语 + 动词原形 ...?', '主语 + did not + 动词原形 ...'], [['We arrived early and explored the village.', '我们很早到达并游览了村庄。', '两个动作都发生在过去。'], ['Did you try the local noodles?', '你尝当地面条了吗？', 'did 后动词恢复原形。']], ['did 后仍使用过去式。', '叙述过去经历时混用一般现在时。']),
        g('indefinite-pronouns', '复合不定代词', 'someone、anything、nothing 等作主语通常视为单数，形容词放在其后。', ['something interesting', 'Did anyone ...?', 'Nobody was ...'], [['I found something unusual near the beach.', '我在海滩附近发现了不寻常的东西。', '形容词 unusual 后置。'], ['Everyone was excited about the boat trip.', '每个人都对乘船旅行感到兴奋。', 'everyone 搭配单数 was。']], ['写成 interesting something。', 'everyone 后使用 were。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8a-home-sweet-home', number: 2, title: 'Home Sweet Home', theme: '家庭责任与共同生活',
      expressions: ['Could you take out the rubbish?', 'We should share the housework.', 'Doing chores makes us more independent.'],
      vocabulary: [
        ['chore', '名词', '日常杂务；家务', '多指需要定期完成的小任务。', '复数 chores。', ['do chores', 'household chores'], 'I finish my chores before playing games.', '我玩游戏前完成家务。', '常用复数 do chores，不说 make chores。'],
        ['responsibility', '名词', '责任；职责', '表示应承担的事情，可数或不可数。', '复数 responsibilities；形容词 responsible。', ['take responsibility for', 'family responsibility'], 'Keeping shared rooms clean is everyone’s responsibility.', '保持公共房间整洁是每个人的责任。', 'be responsible for 与 take responsibility for 含义相近。'],
        ['share', '动词/名词', '分享；共同使用；分担', 'share sth with sb 表示与某人分享。', 'shares；shared；sharing。', ['share chores', 'share ... with ...'], 'We share the cooking and cleaning at weekends.', '周末我们分担做饭和清洁。', 'share 后不需要再加 together。'],
        ['household', '名词/形容词', '一家人；家庭的', '作形容词修饰家务、用品和开支。', '复数 households。', ['household tasks', 'household members'], 'Every household has its own daily routine.', '每个家庭都有自己的日常安排。', 'household 强调整个家庭单位，family 还强调亲属关系。'],
        ['independent', '形容词', '独立的；自主的', 'be independent of 表示不依赖。', '名词 independence；副词 independently。', ['become independent', 'independent learner'], 'Learning to cook helps teenagers become independent.', '学习做饭帮助青少年变得独立。', '反义词 dependent，介词搭配为 of。'],
        ['relationship', '名词', '关系；联系', '谈人际关系常与 between/with 连用。', '复数 relationships。', ['build a relationship', 'relationship with sb'], 'Honest talks improve the relationship between parents and children.', '坦诚交流能改善亲子关系。', 'between 后要明确双方；with 后接关系的另一方。'],
        ['comfortable', '形容词', '舒适的；自在的', '既可描述环境，也可描述人的感受。', '比较级 more comfortable；名词 comfort。', ['feel comfortable', 'comfortable room'], 'Soft light makes the living room comfortable.', '柔和的光线让客厅很舒适。', '拼写中包含 comfort，不要漏写第二个 o。'],
        ['organize', '动词', '组织；整理；安排', '美式拼写 organize，英式也可用 organise；本词条保留教材常见的 organize。', 'organizes；organized；organizing；名词 organization。', ['organize your room', 'organize your time'], 'Let us organize the kitchen shelves together.', '让我们一起整理厨房架子。', 'organize 强调有条理地安排，不只是清洁。'],
      ],
      grammar: [
        g('polite-requests', 'Could you ...? 礼貌请求', 'Could you 后接动词原形，用于礼貌请求；肯定和否定回应都应说明态度。', ['Could you + 动词原形 ...?', 'Sure./No problem.', 'Sorry, I can’t because ...'], [['Could you fold the clothes, please?', '请你叠一下衣服好吗？', 'could 使请求更礼貌。'], ['Sorry, I can’t do it now, but I can help later.', '抱歉我现在做不了，但稍后可以帮忙。', '拒绝后给出理由和替代方案。']], ['Could you 后接 to do。', '用生硬的 No 单独拒绝。']),
        g('make-let-help', '使役与帮助结构', 'make/let 后接省略 to 的动词原形；help 后可接 do 或 to do。', ['make/let + sb + do', 'help + sb + (to) do'], [['Shared tasks make family life run smoothly.', '共同任务让家庭生活顺畅运转。', 'make 后接 run 原形。'], ['My brother helps me (to) prepare dinner.', '我哥哥帮我准备晚餐。', 'help 后 to 可省略。']], ['make sb to do。', 'let 后接 doing。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8a-same-or-different', number: 3, title: 'Same or Different?', theme: '人物比较与个性差异',
      expressions: ['She is more outgoing than I am.', 'We are similar in some ways.', 'Both of us enjoy science.'],
      vocabulary: [
        ['compare', '动词', '比较；对照', 'compare A with B 强调比较异同，compare A to B 也可表示比作。', 'compares；compared；comparing；名词 comparison。', ['compare with', 'compare ... to ...'], 'Compare the two speakers’ ideas before you decide.', '决定前比较两位发言者的观点。', '比较级句本身常用 than，不等于 compare 的介词。'],
        ['similar', '形容词', '相似的', 'be similar to 表示与……相似。', '名词 similarity；副词 similarly。', ['be similar to', 'similar interests'], 'My study habits are similar to my sister’s.', '我的学习习惯与姐姐的相似。', '介词用 to，不用 with。'],
        ['difference', '名词', '差别；差异', '可数名词，difference between A and B。', '复数 differences；形容词 different。', ['make a difference', 'difference between'], 'One small habit can make a big difference.', '一个小习惯能产生很大影响。', 'different 是形容词，difference 是名词。'],
        ['personality', '名词', '性格；个性', '可描述一组稳定的人格特点。', '复数 personalities。', ['friendly personality', 'personality type'], 'Her calm personality helps the team solve problems.', '她沉稳的性格帮助团队解决问题。', 'personality 不等于短暂的 mood。'],
        ['outgoing', '形容词', '外向的；友好的', '描述乐于与人交往的性格。', '比较级 more outgoing。', ['outgoing student', 'be outgoing'], 'Leo is outgoing and enjoys meeting new people.', '利奥很外向，喜欢认识新朋友。', '多音节形容词通常用 more 构成比较级。'],
        ['serious', '形容词', '严肃的；认真的；严重的', '语境决定描述态度还是问题程度。', '比较级 more serious；副词 seriously。', ['be serious about', 'serious problem'], 'Mina is serious about her violin practice.', '米娜认真对待小提琴练习。', 'be serious about 后接名词或 doing。'],
        ['talented', '形容词', '有天赋的', 'be talented in/at 表示在某方面有天赋。', '名词 talent。', ['be talented in', 'talented musician'], 'He is talented in drawing but still practises daily.', '他有绘画天赋，但仍每天练习。', 'talent 可数时指一种才能，不可数时指天赋。'],
        ['both', '限定词/代词/副词', '两个都', '只用于两者；both ... and ... 连接同类成分。', '通常不变化。', ['both of', 'both ... and ...'], 'Both Ella and Grace speak clearly.', '埃拉和格蕾丝说话都很清楚。', 'both 作主语通常搭配复数谓语。'],
      ],
      grammar: [
        g('comparatives', '形容词和副词比较级', '两者比较常用比较级 + than；短词多加 -er，长词多加 more。', ['A + be + 比较级 + than B', 'A + 实义动词 + 副词比较级 + than B'], [['This path is shorter than that one.', '这条路比那条短。', 'short 的比较级直接加 -er。'], ['Nina explains ideas more clearly than before.', '尼娜解释观点比以前更清楚。', 'clearly 用 more 构成比较级。']], ['比较级前再加 very。', 'more 和 -er 同时使用。']),
        g('both-comparison', 'both、as ... as 与差异量', 'both 强调共同点；as ... as 表示程度相同；much/a little 可修饰比较级。', ['both A and B', 'as + 原级 + as', 'much/a little + 比较级'], [['Both teams worked as carefully as possible.', '两队都尽可能认真地完成了任务。', 'as ... as 中用原级 carefully。'], ['This question is a little harder than the first one.', '这道题比第一道稍难。', 'a little 修饰比较级 harder。']], ['as ... as 中使用比较级。', '用 very 修饰 harder。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8a-amazing-plants-animals', number: 4, title: 'Amazing Plants and Animals', theme: '生物多样性与相互依存',
      expressions: ['It is one of the rarest species here.', 'Bees help pollinate flowers.', 'Many animals depend on this habitat.'],
      vocabulary: [
        ['species', '名词', '物种；种类', '单复数同形，常与 endangered、native 搭配。', '单复数均为 species。', ['endangered species', 'plant species'], 'Several bird species live around the wetland.', '数种鸟类生活在湿地周围。', '不能写成 specie 或 specieses。'],
        ['environment', '名词', '环境', '既可指自然环境，也可指学习生活环境。', '复数 environments；形容词 environmental。', ['protect the environment', 'natural environment'], 'Clean water is essential to the wetland environment.', '清洁水源对湿地环境至关重要。', 'environmental 是形容词，如 environmental problem。'],
        ['connect', '动词', '连接；联系', 'connect A with/to B 表示把两者连接。', 'connects；connected；connecting；名词 connection。', ['connect with', 'be connected to'], 'Food chains connect plants with many animals.', '食物链把植物和许多动物联系起来。', 'be connected with 还可表示“与……有关”。'],
        ['survive', '动词', '生存；幸存', '可不及物，也可直接接灾难等宾语。', 'survives；survived；surviving；名词 survival。', ['survive in', 'survive a storm'], 'Some desert plants survive with very little water.', '一些沙漠植物靠极少的水生存。', 'survival 是名词，survivor 指幸存者。'],
        ['ecosystem', '名词', '生态系统', '指生物与环境相互作用形成的整体。', '复数 ecosystems。', ['forest ecosystem', 'healthy ecosystem'], 'Removing one species may change the whole ecosystem.', '移除一个物种可能改变整个生态系统。', 'eco- 表示生态或环境。'],
        ['pollinate', '动词', '给……授粉', '昆虫、风等把花粉传递到花朵。', 'pollinates；pollinated；pollinating；名词 pollination。', ['pollinate flowers', 'help pollinate'], 'Butterflies help pollinate many wild flowers.', '蝴蝶帮助许多野花授粉。', 'pollinator 指传粉者。'],
        ['depend', '动词', '依靠；取决于', '固定搭配 depend on/upon。', 'depends；depended；depending；形容词 dependent。', ['depend on', 'It depends.'], 'Young plants depend on light, water and soil.', '幼小植物依赖光、水和土壤。', 'depend 后必须接 on 才能接对象。'],
        ['protect', '动词', '保护', 'protect A from/against B 表示保护 A 免受 B。', 'protects；protected；protecting；名词 protection。', ['protect from', 'protect wildlife'], 'Thick fur protects the animal from cold winds.', '厚毛保护这种动物免受寒风。', '介词 from 后接危险来源。'],
      ],
      grammar: [
        g('superlatives', '形容词最高级', '三者及以上比较用最高级，前通常有 the，并明确比较范围。', ['the + 最高级 + in/of ...', 'one of the + 最高级 + 复数名词'], [['The blue whale is the largest animal on Earth.', '蓝鲸是地球上最大的动物。', '比较范围用 on Earth。'], ['It is one of the most unusual plants in the forest.', '它是森林中最奇特的植物之一。', 'one of 后名词用复数。']], ['最高级前遗漏 the。', 'one of the 后接单数名词。']),
        g('relative-descriptions', '关系词引导的简短描述', 'who 指人，which/that 指事物，可把特征与名词连接为一个完整描述。', ['a scientist who studies ...', 'an animal that/which lives ...'], [['A pollinator is an animal that carries pollen.', '传粉动物是携带花粉的动物。', 'that 指代 animal。'], ['People who protect wetlands also protect birds.', '保护湿地的人也保护了鸟类。', 'who 指代 people。']], ['用 who 指植物。', '关系从句中重复被指代的主语。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8a-delicious-meal', number: 5, title: 'What a Delicious Meal!', theme: '饮食文化与烹饪过程',
      expressions: ['What a delicious meal!', 'First, chop the vegetables.', 'How much flour do we need?'],
      vocabulary: [
        ['cuisine', '名词', '烹饪风格；菜系', '多指国家或地区特有的烹饪传统。', '复数 cuisines。', ['Chinese cuisine', 'local cuisine'], 'Sichuan cuisine is famous for bold flavours.', '川菜以浓郁味道著称。', 'cuisine 比 food 更强调烹饪体系。'],
        ['ingredient', '名词', '原料；成分', '可数名词，食谱常列出 ingredients。', '复数 ingredients。', ['main ingredient', 'fresh ingredients'], 'Tomatoes are the main ingredient in this soup.', '西红柿是这道汤的主要原料。', 'ingredient 指构成成品的材料。'],
        ['recipe', '名词', '食谱；方法', '包含食材与制作步骤。', '复数 recipes。', ['follow a recipe', 'family recipe'], 'I followed the recipe but used less sugar.', '我按照食谱做了，但少放了糖。', 'recipe 是做法，menu 是菜单。'],
        ['serve', '动词', '端上；供应；服务', 'serve sth to sb 或 serve sb sth。', 'serves；served；serving；名词 service。', ['serve with', 'serve dinner'], 'Serve the noodles with fresh vegetables.', '把面条配新鲜蔬菜端上。', '表示食物足够几人可说 serve four people。'],
        ['flavour', '名词/动词', '味道；给……调味', '英式 flavour，美式 flavor。', '复数 flavours；flavoured。', ['rich flavour', 'add flavour to'], 'Ginger adds a warm flavour to the soup.', '姜给汤增添温暖的味道。', 'taste 可指味觉或尝起来，flavour 指综合风味。'],
        ['delicious', '形容词', '美味的', '描述食物令人愉悦的味道。', '通常用 more/most delicious 比较。', ['look delicious', 'delicious meal'], 'The freshly baked bread smells delicious.', '刚烤好的面包闻起来很香。', '感官动词 smell 后接形容词。'],
        ['chop', '动词/名词', '切碎；劈', '烹饪中指快速切成小块。', 'chops；chopped；chopping。', ['chop up', 'chop vegetables'], 'Chop the onions into small pieces.', '把洋葱切成小块。', 'into small pieces 说明切后的形状。'],
        ['boil', '动词/名词', '煮沸；沸腾', '液体作主语时表示沸腾，接食物时表示水煮。', 'boils；boiled；boiling。', ['boil water', 'bring to the boil'], 'Boil the dumplings for six minutes.', '把饺子煮六分钟。', 'boiled 是水煮的，boiling 表示正在沸腾或非常热。'],
      ],
      grammar: [
        g('exclamations', 'What 与 How 感叹句', 'What 修饰名词短语，How 修饰形容词或副词；主谓部分可保留也可省略。', ['What + a/an + 形容词 + 单数名词!', 'What + 形容词 + 复数/不可数名词!', 'How + 形容词/副词!'], [['What fresh vegetables they are!', '这些蔬菜多么新鲜啊！', '复数名词前不用 a。'], ['How delicious the soup smells!', '这汤闻起来多香啊！', 'how 后直接接形容词。']], ['How a delicious meal。', '不可数名词前加 a。']),
        g('quantity-food', '食物数量表达', '可数名词用 many/few， 不可数名词用 much/little；容器单位可使不可数名词计数。', ['How many + 复数名词?', 'How much + 不可数名词?', 'a cup/piece/bowl of ...'], [['How much cheese should we add?', '我们应该加多少奶酪？', 'cheese 不可数，用 much。'], ['We need two bowls of rice.', '我们需要两碗米饭。', '数量变化在 bowls。']], ['说 two rices。', 'How many 后接不可数名词原形。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8a-plan-yourself', number: 6, title: 'Plan for Yourself', theme: '目标、选择与自我管理',
      expressions: ['I am going to improve my writing.', 'My first step is to make a schedule.', 'If the plan does not work, I will adjust it.'],
      vocabulary: [
        ['goal', '名词', '目标；球门；进球', '学习语境中指希望达到的结果。', '复数 goals。', ['set a goal', 'achieve a goal'], 'Set one clear goal for each week.', '每周设定一个明确目标。', 'goal 应具体可衡量，dream 更偏长期愿望。'],
        ['plan', '名词/动词', '计划；打算', 'plan to do，或 make a plan for。', '复数 plans；planned；planning。', ['plan to do', 'make a plan'], 'We plan to review vocabulary every evening.', '我们计划每晚复习词汇。', 'plan 的过去式和现在分词要双写 n。'],
        ['achieve', '动词', '达到；实现', '接 goal、success、result 等。', 'achieves；achieved；achieving；名词 achievement。', ['achieve a goal', 'achieve success'], 'Small daily actions help you achieve a big goal.', '每天的小行动帮助你实现大目标。', 'achieve 后直接接目标，不加 to。'],
        ['improve', '动词', '改善；提高', '可及物或不及物，improve skills 或 things improve。', 'improves；improved；improving；名词 improvement。', ['improve skills', 'improve by doing'], 'My pronunciation improved through regular practice.', '我的发音通过经常练习提高了。', 'improvement 是可数名词时指一项改进。'],
        ['schedule', '名词/动词', '日程；安排', '作名词表示时间表，作动词安排时间。', '复数 schedules；scheduled；scheduling。', ['make a schedule', 'on schedule'], 'The schedule leaves time for rest and exercise.', '这份日程为休息和锻炼留出了时间。', 'on schedule 表示按预定时间。'],
        ['choice', '名词', '选择；选项', 'make a choice；动词为 choose。', '复数 choices；动词 choose/chose/chosen。', ['make a choice', 'have no choice but to'], 'Think about the result before you make a choice.', '作选择前先考虑结果。', 'choice 是名词，choose 是动词。'],
        ['future', '名词/形容词', '未来；将来的', 'in the future 表示未来，future plan 表示将来计划。', '通常用单数；复数 futures 表示不同前景。', ['in the future', 'future career'], 'I hope to work with computers in the future.', '我希望未来从事计算机相关工作。', 'in future 在英式英语还可表示“今后”。'],
        ['manage', '动词', '管理；设法做到', 'manage to do 强调克服困难后做到。', 'manages；managed；managing；名词 management。', ['manage time', 'manage to do'], 'She managed to finish the project before Friday.', '她设法在周五前完成了项目。', 'manage doing 不表示“设法完成”。'],
      ],
      grammar: [
        g('future-plans', 'be going to 与现在进行时表将来', 'be going to 表计划或有迹象的预测；现在进行时可表示已安排的近期活动。', ['主语 + be going to + 动词原形', '主语 + be + doing + 将来时间'], [['I am going to keep a weekly learning log.', '我打算坚持写每周学习记录。', '表示个人计划。'], ['We are meeting the adviser tomorrow afternoon.', '我们明天下午要见指导老师。', '见面已安排。']], ['going to 后接 doing。', 'be 动词与主语不一致。']),
        g('infinitive-purpose', '动词不定式表示目的与计划', 'to do 可说明行动目的，也可作 want、hope、decide、plan 等动词的宾语。', ['行动 + to do（目的）', 'want/hope/decide/plan + to do'], [['I use a calendar to manage my time.', '我用日历管理时间。', 'to manage 说明使用日历的目的。'], ['He decided to practise speaking first.', '他决定先练口语。', 'decide 后接不定式。']], ['to 后误用动名词。', 'hope sb to do；应使用 hope that ... 或希望自己做。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8a-when-tomorrow-comes', number: 7, title: 'When Tomorrow Comes', theme: '未来生活与科技判断',
      expressions: ['Robots may do more routine work.', 'There will be cleaner transport.', 'Technology should serve people responsibly.'],
      vocabulary: [
        ['predict', '动词', '预测；预言', '根据信息判断未来，predict that ...。', 'predicts；predicted；predicting；名词 prediction。', ['predict the future', 'predict that'], 'Experts predict that batteries will become safer.', '专家预测电池会变得更安全。', 'prediction 是名词，可与 make 搭配。'],
        ['technology', '名词', '技术；科技', '通常不可数，具体技术种类可数。', '复数 technologies；形容词 technological。', ['modern technology', 'use technology'], 'Technology can make learning more flexible.', '科技能让学习更灵活。', 'technology 不等同于单个 machine。'],
        ['robot', '名词', '机器人', '可数名词，指可执行任务的机器。', '复数 robots；形容词 robotic。', ['service robot', 'robot technology'], 'A service robot carries meals in the hospital.', '服务机器人在医院运送餐食。', 'robotic 也可描述动作机械。'],
        ['possibility', '名词', '可能性；可能的事', 'there is a possibility that ...。', '复数 possibilities；形容词 possible。', ['possibility of', 'explore possibilities'], 'There is a possibility of working from anywhere.', '未来可能可以在任何地方工作。', 'of 后接名词或 doing，that 后接完整句。'],
        ['environment', '名词', '环境', '可指自然环境或生活工作条件。', '复数 environments；形容词 environmental。', ['clean environment', 'environmental cost'], 'Future cities must protect the environment.', '未来城市必须保护环境。', '环境问题用 environmental problems。'],
        ['likely', '形容词/副词', '可能的；很可能', 'be likely to do，或 It is likely that。', '比较级 more likely。', ['be likely to', 'most likely'], 'Electric buses are likely to become more common.', '电动公交很可能会更普遍。', '主语可以是人或事物。'],
        ['invent', '动词', '发明；创造', '创造此前没有的装置或方法。', 'invents；invented；inventing；名词 invention/inventor。', ['invent a device', 'new invention'], 'Young engineers invented a low-cost water sensor.', '年轻工程师发明了低成本水传感器。', 'invent 发明新物，discover 发现已有事物。'],
        ['responsible', '形容词', '负责任的；负责的', 'be responsible for 表示负责或是……的原因。', '名词 responsibility；副词 responsibly。', ['be responsible for', 'responsible use'], 'Users should be responsible for how they share data.', '用户应对如何分享数据负责。', 'for 后接名词或 doing。'],
      ],
      grammar: [
        g('future-will', 'will 表示预测与临时决定', 'will + 动词原形可表示未来预测、承诺或说话时作出的决定。', ['主语 + will + 动词原形', 'Will + 主语 + 动词原形?', '主语 + will not/won’t + 动词原形'], [['Homes will use energy more efficiently.', '家庭将更高效地使用能源。', '表示对未来的预测。'], ['I will check the information before sharing it.', '我会在分享前核对信息。', '表示承诺。']], ['will 后接 to do。', 'will 与动词第三人称形式连用。']),
        g('probability-modals', 'may、might、will 的可能性', 'will 表示较确定预测，may/might 表示可能；probably 常放在 will 后。', ['may/might + 动词原形', 'will probably + 动词原形', 'probably will not + 动词原形'], [['People may use virtual labs more often.', '人们可能更常使用虚拟实验室。', 'may 保留不确定性。'], ['Cars will probably become quieter.', '汽车很可能会更安静。', 'probably 位于 will 后。']], ['may 后接 to do。', '说 will maybe 而不调整语序。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8a-communicate', number: 8, title: "Let's Communicate!", theme: '沟通方式与减少误解',
      expressions: ['Could you explain what you mean?', 'If I understand correctly, ...', 'The speaker’s tone changed the message.'],
      vocabulary: [
        ['communicate', '动词', '交流；传达', 'communicate with sb；communicate sth to sb。', 'communicates；communicated；communicating；名词 communication。', ['communicate with', 'communicate clearly'], 'Good teams communicate openly when problems appear.', '优秀团队在出现问题时坦诚沟通。', '与人交流用 with，传递内容可用 to。'],
        ['message', '名词/动词', '信息；要旨；发消息', '可指具体消息或作品传达的中心意思。', '复数 messages；messaged；messaging。', ['send a message', 'main message'], 'Her short message explained the change clearly.', '她的短消息清楚解释了变动。', 'information 通常不可数，message 可数。'],
        ['polite', '形容词', '有礼貌的', 'be polite to sb；礼貌表达常使用缓和语。', '比较级 politer/more polite；副词 politely。', ['polite request', 'be polite to'], 'It is polite to wait until the speaker finishes.', '等发言者讲完是有礼貌的。', '反义词 impolite。'],
        ['misunderstanding', '名词', '误解；误会', '可数名词，clear up a misunderstanding。', '复数 misunderstandings；动词 misunderstand。', ['avoid misunderstanding', 'clear up'], 'A quick question cleared up the misunderstanding.', '一个简短问题消除了误会。', 'misunderstand 的过去式和过去分词是 misunderstood。'],
        ['express', '动词', '表达；表示', 'express an idea/feeling/opinion。', 'expresses；expressed；expressing；名词 expression。', ['express an opinion', 'express clearly'], 'Use examples to express your idea more clearly.', '用例子把观点表达得更清楚。', 'express 后直接接内容，不加 about。'],
        ['listener', '名词', '听者；听众', '由 listen + -er 构成，指接收口头信息的人。', '复数 listeners。', ['active listener', 'good listener'], 'An active listener asks useful follow-up questions.', '积极倾听者会提出有用的追问。', 'listen 接对象时需加 to。'],
        ['tone', '名词', '语气；音调；色调', '沟通中指声音或文字呈现的态度。', '复数 tones。', ['friendly tone', 'tone of voice'], 'The same words can sound different in a cold tone.', '同样的话用冷淡语气听起来会不同。', '书面消息也有 tone。'],
        ['gesture', '名词/动词', '手势；姿态；用手势表示', '非语言沟通的一部分。', '复数 gestures；gestured；gesturing。', ['hand gesture', 'gesture to'], 'A simple gesture showed that he agreed.', '一个简单手势表明他同意。', '不同文化中同一手势含义可能不同。'],
      ],
      grammar: [
        g('object-clauses', '宾语从句：转述信息与核对理解', '宾语从句使用陈述语序；that 常引陈述内容，if/whether 引一般疑问，疑问词保留信息焦点。', ['I think (that) + 陈述句', 'Could you tell me if/whether + 陈述语序?', 'Do you know what/why/how + 陈述语序?'], [['Could you tell me where the meeting is?', '你能告诉我会议在哪里吗？', '从句使用 the meeting is。'], ['I am not sure whether he received the message.', '我不确定他是否收到消息。', 'whether 表示“是否”。']], ['从句仍用疑问语序。', 'whether 后再加 or not 时结构混乱。']),
        g('communication-conditionals', 'if 条件句：沟通策略', '真实可能条件用 if + 一般现在时，主句用 will/can/祈使句。', ['If + 一般现在时, 主语 + will/can + 动词原形', 'If + 一般现在时, 祈使句'], [['If the message is unclear, ask a follow-up question.', '如果信息不清楚，就追问。', '主句使用祈使句。'], ['If you listen carefully, you will notice the speaker’s tone.', '如果认真听，你会注意到说话者的语气。', 'if 从句不用 will。']], ['if 从句使用 will 表示普通条件。', '主句遗漏动词原形。']),
      ],
    }),
  ],
});

const grade8Lower = createBook({
  id: 'eng-book-g8b-2024', gradeId: 'g8', semester: 'lower', label: '八年级下册', shortLabel: '八下',
  edition: '2024 年修订版', status: 'verified', sourceNote: '单元标题和顺序已按人教版八年级下册新版教材核对；词汇用法、语法讲解和例句由本项目按单元主题原创整理，不作为教材逐页词表。',
  units: [
    unit({
      id: 'eng-unit-g8b-time-to-relax', number: 1, title: 'Time to Relax', theme: '休闲活动与身心平衡',
      expressions: ['I have been collecting stamps for two years.', 'This hobby helps me slow down.', 'It is important to balance work and rest.'],
      vocabulary: [
        ['leisure', '名词/形容词', '闲暇；空闲的', 'leisure time 表示可自由安排的时间。', '通常不可数。', ['at leisure', 'leisure activity'], 'Reading is my favourite leisure activity.', '阅读是我最喜欢的休闲活动。', 'leisure 不是 lazy，休闲也可积极充实。'],
        ['hobby', '名词', '爱好', '可数名词，指经常从事并享受的活动。', '复数 hobbies。', ['take up a hobby', 'develop a hobby'], 'She took up gardening during the winter break.', '她寒假期间开始从事园艺。', 'take up 可表示开始培养爱好。'],
        ['collect', '动词', '收集；领取；聚集', 'collect stamps 等强调系统积累。', 'collects；collected；collecting；名词 collection/collector。', ['collect stamps', 'a collection of'], 'My collection tells stories about different cities.', '我的收藏讲述不同城市的故事。', 'collection 是收藏品整体，collector 是收藏者。'],
        ['creative', '形容词', '有创造力的；创造性的', '修饰人、想法或活动。', '比较级 more creative；名词 creativity。', ['creative activity', 'creative thinking'], 'Model building is both creative and practical.', '模型制作既有创意又实用。', 'create 是动词，creative 是形容词。'],
        ['achievement', '名词', '成就；成绩', '指努力后取得的结果。', '复数 achievements；动词 achieve。', ['sense of achievement', 'great achievement'], 'Finishing the painting gave me a sense of achievement.', '完成这幅画给我成就感。', '不可把 achievement 写成 achieve。'],
        ['instructor', '名词', '教练；指导者', '指教授技能的人。', '复数 instructors；动词 instruct。', ['dance instructor', 'follow the instructor'], 'The instructor showed us how to hold the paddle.', '教练示范了如何握桨。', 'teacher 更广泛，instructor 常指具体技能。'],
        ['relaxing', '形容词', '令人放松的', '描述活动或环境带来的感受。', '动词 relax；形容词 relaxed。', ['relaxing music', 'find ... relaxing'], 'I find slow cycling relaxing after school.', '我觉得放学后慢骑车很放松。', '人感到放松用 relaxed。'],
        ['balance', '名词/动词', '平衡；使平衡', 'balance A and/with B 表示兼顾两者。', 'balances；balanced；balancing。', ['keep a balance', 'balance study and rest'], 'A weekly plan helps me balance study and rest.', '周计划帮助我平衡学习和休息。', 'balanced 还可表示均衡的，如 a balanced diet。'],
      ],
      grammar: [
        g('present-perfect-duration', '现在完成时：持续到现在', 'have/has + 过去分词表示从过去开始并持续到现在；for 接时长，since 接起点。', ['主语 + have/has + 过去分词', 'for + 一段时间', 'since + 时间点/从句'], [['I have played chess for three years.', '我下国际象棋三年了。', 'for 后接持续时长。'], ['She has loved painting since primary school.', '她从小学起就喜欢画画。', 'since 后接起点。']], ['for 后接 yesterday。', '第三人称单数使用 have。']),
        g('gerunds-hobbies', '动名词作主语和宾语', 'doing 可把活动当作一件事作主语，也可放在 enjoy、finish、practise 等动词后。', ['Doing ... + 单数谓语', 'enjoy/finish/practise + doing'], [['Swimming helps me clear my mind.', '游泳帮助我理清思绪。', '动名词短语作主语，谓语用 helps。'], ['We practise taking better photos outdoors.', '我们在户外练习拍更好的照片。', 'practise 后接 doing。']], ['动名词主语搭配复数谓语。', 'enjoy 后接 to do。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8b-stay-healthy', number: 2, title: 'Stay Healthy', theme: '健康问题与科学建议',
      expressions: ['I have had a stomachache since morning.', 'You should drink water and rest.', 'If the pain gets worse, see a doctor.'],
      vocabulary: [
        ['symptom', '名词', '症状；征兆', '可数名词，指疾病或问题表现。', '复数 symptoms。', ['common symptom', 'show symptoms'], 'A high temperature can be a symptom of illness.', '高体温可能是疾病症状。', 'symptom 不是 disease 本身。'],
        ['stomachache', '名词', '胃痛；腹痛', '常用 have a stomachache。', '复数 stomachaches。', ['have a stomachache', 'bad stomachache'], 'He had a stomachache after eating too quickly.', '他吃得太快后肚子疼。', 'ache 可构成 headache、toothache。'],
        ['treatment', '名词', '治疗；处理', '可数或不可数，动词为 treat。', '复数 treatments。', ['medical treatment', 'receive treatment'], 'Early treatment may stop the problem from getting worse.', '早期治疗可能防止问题恶化。', 'treat 还可表示对待或款待。'],
        ['advice', '名词', '建议', '不可数；一条建议是 a piece of advice。', '不可数；动词 advise。', ['give advice', 'ask for advice'], 'The nurse gave me useful advice about sleep.', '护士给了我有用的睡眠建议。', '不能说 an advice；advise 是动词且读音不同。'],
        ['harmful', '形容词', '有害的', 'be harmful to 等于 do harm to。', '名词/动词 harm；反义词 harmless。', ['be harmful to', 'harmful habit'], 'Too much screen time can be harmful to sleep.', '屏幕时间过长可能有害睡眠。', '介词搭配固定为 to。'],
        ['painful', '形容词', '疼痛的；痛苦的', '描述身体疼痛或难受经历。', '比较级 more painful；名词 pain。', ['feel painful', 'painful injury'], 'The ankle became painful after the fall.', '摔倒后脚踝开始疼。', '更自然地描述人的感受可说 be in pain。'],
        ['recover', '动词', '恢复；康复；找回', 'recover from illness/injury。', 'recovers；recovered；recovering；名词 recovery。', ['recover from', 'fully recover'], 'She recovered from the cold after several days of rest.', '休息几天后她感冒康复了。', 'recover 后接疾病要加 from。'],
        ['prevent', '动词', '预防；阻止', 'prevent sb/sth from doing。', 'prevents；prevented；preventing；名词 prevention。', ['prevent illness', 'prevent ... from ...'], 'Washing hands helps prevent infections.', '洗手有助于预防感染。', 'from 在正式结构中通常保留。'],
      ],
      grammar: [
        g('health-modals', 'should、had better 与 must', 'should 给一般建议，had better 语气更强且常针对具体情况，must 表示必要义务。', ['should/shouldn’t + 动词原形', 'had better (not) + 动词原形', 'must/mustn’t + 动词原形'], [['You should rest your eyes every thirty minutes.', '你应该每三十分钟让眼睛休息。', '一般健康建议用 should。'], ['You had better not move the injured leg.', '你最好不要移动受伤的腿。', '否定放在 better 后。']], ['had better 后接 to do。', 'mustn’t 误解为“不必”。']),
        g('present-perfect-health', '现在完成时：健康状态与结果', '现在完成时连接过去与现在，常与 already、yet、since、for 连用。', ['have/has + 过去分词', 'Have/Has ... yet?', 'have/has already + 过去分词'], [['Have you taken your temperature yet?', '你量体温了吗？', 'yet 常用于疑问句末。'], ['I have already drunk two glasses of water.', '我已经喝了两杯水。', 'already 常放在助动词后。']], ['使用明确过去时间 yesterday 时仍用现在完成时。', '把 taken 写成 took。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8b-growing-up', number: 3, title: 'Growing Up', theme: '成长挑战与负责任选择',
      expressions: ['I used to depend on others.', 'This challenge made me more confident.', 'I learned to take responsibility for my choice.'],
      vocabulary: [
        ['teenager', '名词', '青少年', '通常指 13 至 19 岁的人。', '复数 teenagers。', ['teenage years', 'teenage student'], 'Many teenagers want more chances to make decisions.', '许多青少年希望有更多作决定的机会。', 'teenage 是形容词，teenager 是人。'],
        ['challenge', '名词/动词', '挑战；向……挑战', '可指困难任务，也可作动词。', '复数 challenges；challenged；challenging。', ['face a challenge', 'challenging task'], 'Speaking in public was a challenge for me.', '公开演讲对我来说是个挑战。', '人感到有挑战可说 feel challenged，任务用 challenging。'],
        ['independent', '形容词', '独立的', 'be independent of；learn independently。', '名词 independence；副词 independently。', ['become independent', 'independent decision'], 'Managing pocket money is one step towards becoming independent.', '管理零花钱是走向独立的一步。', 'independence 是名词。'],
        ['decision', '名词', '决定', 'make a decision；动词 decide。', '复数 decisions。', ['make a decision', 'difficult decision'], 'She made the decision after listening to both sides.', '她听取双方意见后作出决定。', '不能说 do a decision。'],
        ['disappointed', '形容词', '失望的', '人感到失望用 disappointed；事令人失望用 disappointing。', '比较级 more disappointed；动词 disappoint。', ['be disappointed with', 'feel disappointed'], 'I felt disappointed, but I tried again.', '我感到失望，但又试了一次。', '介词可依对象使用 with/at/about。'],
        ['confidence', '名词', '信心；自信', '不可数，have confidence in。', '形容词 confident；副词 confidently。', ['build confidence', 'have confidence in'], 'Practice gave me confidence to speak in class.', '练习给了我课堂发言的信心。', 'confident 是形容词，不能说 feel confidence。'],
        ['responsibility', '名词', '责任', 'take responsibility for 表示承担责任。', '复数 responsibilities；形容词 responsible。', ['take responsibility', 'sense of responsibility'], 'Admitting a mistake is part of taking responsibility.', '承认错误是承担责任的一部分。', 'for 后接名词或 doing。'],
        ['mature', '形容词/动词', '成熟的；成熟', '描述能理性处理问题的人或事物。', '比较级 more mature；名词 maturity。', ['become mature', 'mature decision'], 'A mature person listens before judging.', '成熟的人会先倾听再判断。', 'mature 不等于年龄大，强调态度和能力。'],
      ],
      grammar: [
        g('used-to', 'used to 表示过去习惯或状态', 'used to + 动词原形表示过去常常而现在已改变；否定和疑问借助 did。', ['used to + 动词原形', 'did not use to + 动词原形', 'Did ... use to + 动词原形?'], [['I used to avoid difficult tasks.', '我过去常逃避困难任务。', '暗含现在不再这样。'], ['Did you use to be shy?', '你过去害羞吗？', 'did 后写 use。']], ['把 used to 与 be used to doing 混淆。', 'did 后仍写 used。']),
        g('emotion-causes', '-ed/-ing 形容词与 make', '-ed 形容人的感受，-ing 形容引发感受的人或事；make sb + 形容词/动词原形。', ['sb be + -ed 形容词', 'sth be + -ing 形容词', 'make + sb + 形容词/动词原形'], [['The result was disappointing, but I was not discouraged.', '结果令人失望，但我没有气馁。', '事物用 disappointing，人用 discouraged。'], ['The experience made me value teamwork.', '这段经历让我重视团队合作。', 'make 后接动词原形 value。']], ['人作主语一律用 -ing。', 'make sb to do。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8b-wonder-of-nature', number: 4, title: 'The Wonder of Nature', theme: '自然奇观与探索体验',
      expressions: ['It is one of the greatest natural wonders.', 'Have you ever seen a canyon?', 'The view took my breath away.'],
      vocabulary: [
        ['wonder', '名词/动词', '奇观；惊叹；想知道', '作名词可指数自然奇观；作动词后接疑问词从句。', '复数 wonders；wondered；wondering。', ['natural wonder', 'wonder why'], 'The limestone forest is a natural wonder.', '石灰岩森林是一处自然奇观。', 'No wonder 表示“难怪”。'],
        ['natural', '形容词', '自然的；天然的', '修饰环境、材料或能力。', '名词 nature；副词 naturally。', ['natural beauty', 'natural resource'], 'The park protects the area’s natural beauty.', '公园保护该地区的自然美景。', 'nature 是名词，不能直接作定语替代所有 natural。'],
        ['unusual', '形容词', '不寻常的', '由否定前缀 un- + usual 构成。', '比较级 more unusual。', ['unusual shape', 'It is unusual to'], 'The rocks have unusual shapes after years of erosion.', '岩石经过多年侵蚀形成奇特形状。', 'unusual 以元音音素开头，单数名词前用 an。'],
        ['canyon', '名词', '峡谷', '两侧陡峭、通常由河流切割形成的地形。', '复数 canyons。', ['deep canyon', 'canyon wall'], 'A river runs through the bottom of the canyon.', '一条河流过峡谷底部。', 'through 强调从内部穿过。'],
        ['waterfall', '名词', '瀑布', '由 water + fall 构成的复合名词。', '复数 waterfalls。', ['high waterfall', 'near a waterfall'], 'Mist rose from the waterfall in the morning sun.', '晨光中水雾从瀑布升起。', 'waterfall 可数。'],
        ['active', '形容词', '活跃的；活动的', '可描述人、火山或过程。', '名词 activity；副词 actively；反义 inactive。', ['active volcano', 'stay active'], 'The island has an active volcano.', '这座岛有一座活火山。', 'active volcano 指仍可能喷发的火山。'],
        ['explore', '动词', '探索；考察', '接地点、问题或可能性。', 'explores；explored；exploring；名词 exploration/explorer。', ['explore a cave', 'explore nature'], 'We explored the cave with a trained guide.', '我们在专业向导带领下探索洞穴。', 'explore 后直接接地点，不加 in。'],
        ['breathtaking', '形容词', '令人惊叹的', '描述极美或极震撼的景象。', '通常用 more/most breathtaking。', ['breathtaking view', 'absolutely breathtaking'], 'The sunrise above the clouds was breathtaking.', '云海上的日出令人惊叹。', '正式写作中可搭配 absolutely，不用 very breathtaking。'],
      ],
      grammar: [
        g('present-perfect-experience', '现在完成时：人生经历', 'have/has + 过去分词与 ever、never、before 连用，询问或陈述截至现在的经历。', ['Have/Has + 主语 + ever + 过去分词?', '主语 + have/has never + 过去分词', 'have/has + 过去分词 + before'], [['Have you ever climbed a mountain at dawn?', '你曾在黎明登山吗？', 'ever 表示“曾经”。'], ['I have never seen such a wide waterfall.', '我从未见过这么宽的瀑布。', 'never 已含否定。']], ['never 与 not 同时使用。', '过去分词误写成过去式。']),
        g('measurements', '长宽高与倍数表达', '数字 + 单位 + long/wide/high/deep 描述尺寸；倍数比较要明确参照。', ['数字 + metres/kilometres + long/wide/high/deep', '倍数 + as + 原级 + as'], [['The canyon is about twenty kilometres long.', '峡谷约二十千米长。', '尺寸形容词放在单位后。'], ['This waterfall is twice as high as that one.', '这座瀑布是那座的两倍高。', '倍数置于 as ... as 前。']], ['写成 twenty long kilometres。', '倍数结构中用比较级。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8b-natures-temper', number: 5, title: "Nature's Temper", theme: '自然灾害与应急行动',
      expressions: ['The ground was shaking when the alarm sounded.', 'Move away from windows.', 'Follow official warnings and stay calm.'],
      vocabulary: [
        ['disaster', '名词', '灾难；灾害', '指造成严重损失的事件。', '复数 disasters。', ['natural disaster', 'disaster area'], 'Preparation can reduce the harm caused by a disaster.', '充分准备能减少灾害造成的伤害。', 'hazard 是潜在危险，disaster 是造成严重后果的事件。'],
        ['earthquake', '名词', '地震', '可数名词，常与 strike、happen 搭配。', '复数 earthquakes。', ['strong earthquake', 'earthquake drill'], 'Our class took part in an earthquake drill.', '我们班参加了一次地震演练。', '地震“发生”可说 an earthquake strikes/happens；“参加演练”可用 take part in a drill。'],
        ['flood', '名词/动词', '洪水；淹没', '作名词可数，作动词描述水淹。', '复数 floods；flooded；flooding。', ['flash flood', 'be flooded with'], 'Heavy rain flooded several low roads.', '暴雨淹没了几条低洼道路。', 'flooded 还可比喻大量涌入。'],
        ['storm', '名词/动词', '暴风雨；猛烈攻击', '天气语境常与 warning、approach 搭配。', '复数 storms；stormed；storming。', ['storm warning', 'during a storm'], 'The storm warning was issued before the wind grew stronger.', '风力增强前发布了暴风雨预警。', 'issue a warning 表示“发布预警”；thunderstorm 特指雷暴。'],
        ['warning', '名词', '警告；预警', '可数名词；动词 warn。', '复数 warnings。', ['early warning', 'warning sign'], 'Never ignore an official flood warning.', '绝不要忽视官方洪水预警。', 'warn sb about/of sth 或 warn sb not to do。'],
        ['escape', '动词/名词', '逃离；逃脱', 'escape from 地点；escape doing 表示逃避某事。', 'escapes；escaped；escaping。', ['escape route', 'escape from'], 'Know the safest escape route from your building.', '要知道离开所在建筑的最安全逃生路线。', 'escape 作动词接地点时常加 from。'],
        ['emergency', '名词/形容词', '紧急情况；应急的', 'in an emergency 表示在紧急情况下。', '复数 emergencies。', ['emergency kit', 'emergency exit'], 'Keep water and a torch in your emergency kit.', '在应急包中放好水和手电筒。', '复数将 y 变为 ies。'],
        ['survive', '动词', '幸存；生存', '可直接接 disaster，也可用 survive in。', 'survives；survived；surviving；名词 survival/survivor。', ['survive a disaster', 'survival skills'], 'Clear information helps more people survive.', '清晰信息帮助更多人生存下来。', 'survivor 是人，survival 是生存。'],
      ],
      grammar: [
        g('past-continuous', '过去进行时：背景与被打断动作', 'was/were + doing 描述过去某时正在进行的动作，常与 when/while 连接。', ['主语 + was/were + doing', 'when + 一般过去时', 'while + 过去进行时'], [['We were having class when the alarm rang.', '警报响时我们正在上课。', '持续背景用过去进行时，短动作 rang 用一般过去时。'], ['While the wind was blowing, people stayed indoors.', '风刮着时，人们待在室内。', 'while 后突出持续过程。']], ['was/were 后使用动词原形。', '短促动作一律用过去进行时。']),
        g('emergency-imperatives', '祈使句与应急顺序', '祈使句用动词原形直接给出清晰行动；否定用 Do not/Don’t；顺序词帮助执行。', ['动词原形 + ...', 'Do not/Don’t + 动词原形', 'First/Next/Then/Finally'], [['Drop, cover and hold on.', '伏地、遮挡并抓牢。', '并列三个动词原形。'], ['Do not use the lift during a fire.', '火灾时不要使用电梯。', '否定祈使句用 Do not。']], ['祈使句前保留主语 you。', '否定写 No use the lift。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8b-crossing-cultures', number: 6, title: 'Crossing Cultures', theme: '跨文化礼仪与相互尊重',
      expressions: ['People may greet each other differently.', 'You are expected to arrive on time.', 'It is respectful to ask when you are unsure.'],
      vocabulary: [
        ['custom', '名词', '习俗；惯例', '可数名词，指群体长期形成的做法。', '复数 customs。', ['local custom', 'follow a custom'], 'Greeting customs vary from place to place.', '问候习俗因地而异。', 'customs 还可表示海关，要看语境。'],
        ['greeting', '名词', '问候；问候语', '可指动作或话语。', '复数 greetings；动词 greet。', ['exchange greetings', 'formal greeting'], 'A smile can be a friendly greeting.', '微笑可以是友好的问候。', 'greet sb，不能说 greet to sb。'],
        ['formal', '形容词', '正式的；正规的', '适用于正式场合、语言或服装。', '副词 formally；反义词 informal。', ['formal occasion', 'formal language'], 'Use a formal greeting in an official email.', '在正式邮件中使用正式问候。', 'formal 不等于 unfriendly。'],
        ['informal', '形容词', '非正式的；随意的', '用于朋友间或轻松场合。', '副词 informally。', ['informal conversation', 'informal clothes'], 'Text messages between close friends are often informal.', '亲密朋友之间的短信通常较随意。', '非正式仍需尊重。'],
        ['respect', '名词/动词', '尊重；敬意', 'respect sb/sth；show respect for。', 'respects；respected；respecting；形容词 respectful。', ['show respect for', 'respect differences'], 'We should respect customs that differ from our own.', '我们应尊重与自身不同的习俗。', 'respectful 描述行为，respected 描述受敬重的人。'],
        ['tradition', '名词', '传统', '可数时指具体传统，不可数时指传统观念。', '复数 traditions；形容词 traditional。', ['family tradition', 'cultural tradition'], 'Sharing food is an important family tradition.', '分享食物是一项重要家庭传统。', 'tradition 是名词，traditional 是形容词。'],
        ['host', '名词/动词', '主人；主持人；主办', '与 guest 相对，也可作动词。', '复数 hosts；hosted；hosting。', ['host family', 'host an event'], 'The host introduced each guest at dinner.', '主人在晚餐时介绍每位客人。', 'host 不限男性；女主人也可用 host。'],
        ['guest', '名词', '客人；嘉宾', '可数名词，指受邀请的人。', '复数 guests。', ['welcome a guest', 'guest room'], 'A thoughtful guest asks about house rules.', '体贴的客人会询问家庭规则。', '做客用 be a guest，不用 do a guest。'],
      ],
      grammar: [
        g('cultural-modals', 'must、have to、should 与 may', 'must/have to 表示必要，should 表示建议，may 表示允许或可能；语气需符合文化情境。', ['must/have to + 动词原形', 'should/shouldn’t + 动词原形', 'may + 动词原形'], [['Visitors have to remove their shoes in this home.', '访客在这个家里必须脱鞋。', 'have to 表示具体规则。'], ['You should ask politely if you are unsure.', '如果不确定，你应该礼貌询问。', 'should 给出尊重性的建议。']], ['mustn’t 与 don’t have to 混淆。', '情态动词后使用 to do。']),
        g('passive-expectations', 'be expected/supposed to', 'be expected to 与 be supposed to 表示社会期待或通常规范，语气比命令柔和。', ['be expected to + 动词原形', 'be supposed to + 动词原形'], [['Guests are expected to arrive on time.', '客人应按时到达。', '表达社会期待。'], ['You are not supposed to interrupt the speaker.', '你不应打断发言者。', '否定放在 be 后。']], ['expected 后漏写 to。', '主语变化时 be 不变化。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8b-good-read', number: 7, title: 'A Good Read', theme: '文学阅读与作品评价',
      expressions: ['The novel follows a young explorer.', 'The main character changes after the journey.', 'I recommend it because the ending is thought-provoking.'],
      vocabulary: [
        ['novel', '名词/形容词', '小说；新颖的', '作名词指长篇虚构作品，作形容词表示新颖。', '复数 novels。', ['historical novel', 'novel idea'], 'The novel is set in a small coastal town.', '这部小说以一座海滨小镇为背景。', 'novel 作形容词不等于 modern。'],
        ['author', '名词', '作者', '指书籍、文章等创作者。', '复数 authors。', ['the author of', 'favourite author'], 'The author tells the story through a child’s eyes.', '作者从一个孩子的视角讲述故事。', 'writer 更泛，author 常对应具体作品。'],
        ['plot', '名词/动词', '情节；密谋；绘制', '文学语境指事件如何发展。', '复数 plots；plotted；plotting。', ['main plot', 'plot develops'], 'The plot becomes faster near the end.', '临近结尾时情节推进加快。', 'plot 不等于 theme；theme 是中心思想。'],
        ['character', '名词', '人物；性格；特征', '文学中指人物，也可表示品格。', '复数 characters。', ['main character', 'character development'], 'The main character learns to trust others.', '主人公学会了信任他人。', '根据语境区分“人物”和“性格”。'],
        ['chapter', '名词', '章；篇', '书籍的结构单位。', '复数 chapters。', ['first chapter', 'chapter title'], 'Each chapter ends with a new question.', '每章都以一个新问题结束。', '章节编号常写 Chapter 3。'],
        ['magical', '形容词', '有魔力的；奇妙的', '可描述魔法元素或令人着迷的体验。', '名词 magic；副词 magically。', ['magical world', 'magical power'], 'The door leads to a magical world.', '这扇门通往一个奇幻世界。', 'magic 也可作定语，如 magic trick。'],
        ['recommend', '动词', '推荐；建议', 'recommend sth to sb；recommend doing。', 'recommends；recommended；recommending；名词 recommendation。', ['recommend a book', 'recommend doing'], 'I recommend reading the first chapter slowly.', '我建议慢慢读第一章。', '不能说 recommend sb to do，宜用 recommend that sb do。'],
        ['review', '名词/动词', '评论；复习；审查', '书评应含概述、评价与依据。', '复数 reviews；reviewed；reviewing。', ['book review', 'write a review'], 'Her review explains both the strengths and weaknesses.', '她的书评说明了优点和不足。', 'review 不应只复述全部情节。'],
      ],
      grammar: [
        g('present-perfect-reading', '现在完成时：阅读进度与结果', 'already、yet、just 可说明截至现在的阅读进度；finished 的结果与现在相关。', ['have/has already/just + 过去分词', 'Have/Has ... + 过去分词 + yet?', 'have/has not + 过去分词 + yet'], [['I have just finished Chapter Five.', '我刚读完第五章。', 'just 放在助动词后。'], ['Have you decided on your favourite character yet?', '你已经选出最喜欢的人物了吗？', 'yet 放句末。']], ['与 last night 同用而无特殊语境。', 'yet 放在助动词前。']),
        g('reporting-opinions', '转述观点与评价依据', 'think/believe/find 后可接宾语从句；find + 宾语 + 形容词可简洁评价。', ['I think/believe (that) + 陈述句', 'I find + 宾语 + 形容词', 'The reason is that ...'], [['I find the ending surprising but believable.', '我觉得结局出人意料但可信。', '形容词说明对 ending 的评价。'], ['I believe the story shows the value of courage.', '我认为故事展现了勇气的价值。', 'that 可省略。']], ['宾语从句使用疑问语序。', '评价只有形容词而没有文本依据。']),
      ],
    }),
    unit({
      id: 'eng-unit-g8b-making-difference', number: 8, title: 'Making a Difference', theme: '志愿服务与社会参与',
      expressions: ['We volunteer to help at the community centre.', 'The project has supported many families.', 'Small actions can make a real difference.'],
      vocabulary: [
        ['volunteer', '名词/动词', '志愿者；自愿做', 'volunteer to do 表示自愿做某事。', '复数 volunteers；volunteered；volunteering。', ['volunteer work', 'volunteer to help'], 'Students volunteered to sort donated books.', '学生自愿整理捐赠图书。', 'voluntary 是形容词，表示自愿的。'],
        ['elderly', '形容词/名词', '年长的；老年人', 'the elderly 泛指老年群体，谓语用复数。', '通常不作普通复数。', ['elderly people', 'help the elderly'], 'The centre offers digital lessons for elderly people.', '中心为老年人提供数字技能课程。', '描述个体宜说 an elderly person，不说 an elderly。'],
        ['shelter', '名词/动词', '收容所；遮蔽；庇护', '可指人或动物的临时安全场所。', '复数 shelters；sheltered；sheltering。', ['animal shelter', 'take shelter'], 'We cleaned cages at the animal shelter.', '我们在动物收容所清理笼舍。', 'take shelter from 表示躲避。'],
        ['service', '名词', '服务；公共设施', '可数或不可数；动词 serve。', '复数 services。', ['community service', 'public service'], 'Community service connects people with local needs.', '社区服务把人们与本地需求联系起来。', 'service 是名词，serve 是动词。'],
        ['support', '动词/名词', '支持；支撑', '接人、项目或观点；作名词通常不可数。', 'supports；supported；supporting。', ['support a project', 'give support to'], 'Local shops supported the food-sharing project.', '本地商店支持了食物分享项目。', 'support 后直接接对象。'],
        ['achievement', '名词', '成就', '强调通过努力取得的结果。', '复数 achievements。', ['proud achievement', 'sense of achievement'], 'The team’s greatest achievement was building trust.', '团队最大的成就是建立信任。', 'achievement 可数；泛指成就感用 a sense of achievement。'],
        ['successful', '形容词', '成功的', 'be successful in doing；名词 success。', '比较级 more successful；副词 successfully。', ['successful project', 'be successful in'], 'The campaign was successful in reducing waste.', '这项活动成功减少了浪费。', 'success 是名词，succeed 是动词。'],
        ['community', '名词', '社区；群体', '可指地域社区或有共同点的群体。', '复数 communities。', ['local community', 'community centre'], 'A strong community includes people of different ages.', '有凝聚力的社区包含不同年龄的人。', '复数将 y 变为 ies。'],
      ],
      grammar: [
        g('infinitives-volunteering', '动词不定式：目的、计划与宾语', 'to do 可说明志愿行动的目的，也可跟在 decide、hope、offer、volunteer 等动词后。', ['行动 + to do（目的）', 'decide/hope/offer/volunteer + to do'], [['We collected bottles to raise money for the shelter.', '我们收集瓶子为收容所筹款。', 'to raise 表示目的。'], ['Maya offered to design the poster.', '玛雅主动提出设计海报。', 'offer 后接不定式。']], ['表示目的时使用 for do。', 'volunteer 后接 doing。']),
        g('present-perfect-impact', '现在完成时：行动影响', '现在完成时强调过去行动对现在造成的结果，常与 so far、since、already 连用。', ['have/has + 过去分词', 'so far/up to now', 'since + 起点'], [['The project has collected 500 books so far.', '该项目到目前已收集五百本书。', 'so far 与现在完成时连用。'], ['Volunteers have supported the centre since March.', '志愿者从三月起一直支持该中心。', 'since 标明起点。']], ['so far 与一般过去时随意混用。', 'has 后写过去式。']),
      ],
    }),
  ],
});

module.exports = [grade8Upper, grade8Lower];
