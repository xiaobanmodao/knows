const { createBook, createUnit, grammar } = require('./english-unit-builder');

const g = grammar;

function unit(config) {
  return createUnit({
    expressions: [],
    ...config,
  });
}

const grade7Upper = createBook({
  id: 'eng-book-g7a-2024',
  gradeId: 'g7',
  semester: 'upper',
  label: '七年级上册',
  shortLabel: '七上',
  edition: '2024 年修订版',
  status: 'verified',
  sourceNote: '目录已按 2024 年秋启用的人教版新教材核对。',
  units: [
    unit({
      id: 'eng-unit-g7a-starter-hello', number: 1, isStarter: true, title: 'Hello!', theme: '问候与开启对话',
      expressions: ['Good morning! Nice to meet you.', 'What is your name?', 'How do you spell it?'],
      vocabulary: [
        ['hello', '感叹词', '你好；喂', '用于见面问候或吸引对方注意，语气中性。', '通常不变化。', ['say hello to', 'Hello, everyone!'], 'Hello, I am Lin Tao. Nice to meet you.', '你好，我是林涛。很高兴认识你。', '打电话时 hello 也可表示“喂”，正式书信不这样开头。'],
        ['morning', '名词', '早晨；上午', '常与 good 构成早间问候，也可与 in the 连用。', '复数 mornings；通常用单数表示时段。', ['Good morning', 'in the morning'], 'I read English for ten minutes every morning.', '我每天早晨读十分钟英语。', 'every morning 前不加介词。'],
        ['afternoon', '名词', '下午', '表示午后到傍晚前的时间段。', '复数 afternoons。', ['Good afternoon', 'on Friday afternoon'], 'We have art on Friday afternoon.', '我们星期五下午上美术课。', '具体某天的下午通常用 on。'],
        ['evening', '名词', '傍晚；晚上', '多指天黑以后到睡觉前，问候用 Good evening。', '复数 evenings。', ['Good evening', 'in the evening'], 'My family usually walks in the evening.', '我家人通常在晚上散步。', 'Good night 多用于道别或睡前，不等同于见面问候。'],
        ['spell', '动词', '用字母拼；拼写', '询问单词拼写时常用 How do you spell ...?', 'spells；spelled/spelt；spelling。', ['spell your name', 'spell the word'], 'Could you spell your family name, please?', '请问你能拼一下你的姓吗？', '英式过去式可用 spelt，美式常用 spelled。'],
        ['please', '副词/感叹词', '请；请问', '放在请求句首或句末使语气更礼貌。', '通常不变化。', ['please sit down', 'Could you ..., please?'], 'Please speak a little more slowly.', '请说得稍微慢一点。', '句末 please 前常用逗号隔开。'],
        ['conversation', '名词', '交谈；对话', '指两人或多人之间的信息交流。', '复数 conversations。', ['start a conversation', 'have a conversation with'], 'A simple question can start a friendly conversation.', '一个简单的问题可以开启友好的交谈。', '与某人交谈用 have a conversation with sb.。'],
        ['goodbye', '感叹词/名词', '再见；告别', '用于结束见面或谈话。', '作名词时复数 goodbyes。', ['say goodbye to', 'wave goodbye'], 'We said goodbye to our new friends after class.', '下课后我们向新朋友告别。', 'say goodbye 后接人时要加 to。'],
      ],
      grammar: [
        g('greetings', '分时段问候与礼貌回应', '问候语要结合时间和交际阶段：见面先问候，初次见面再表达认识对方的愉快。', ['Good morning/afternoon/evening.', 'Nice to meet you. — Nice to meet you too.'], [['Good afternoon, Ms Chen.', '陈老师，下午好。', 'afternoon 对应午后时段。'], ['Nice to meet you, Peter.', '很高兴认识你，彼得。', '初次见面使用 meet，不用 see。']], ['把 Good night 当作晚上见面问候。', '对 Nice to meet you 只回答 I am fine。']),
        g('question-spelling', 'What 与 How 引导的基础问句', 'What 询问信息，How 询问方式；请求拼写时使用 how，而不是 what。', ['What is your name?', 'How do you spell your name?'], [['What is this in English?', '这个用英语怎么说？', 'what 询问事物名称。'], ['How do you spell “bike”?', 'bike 怎么拼写？', 'how 询问拼写方式。']], ['遗漏一般疑问结构中的 do。', '把 How do you spell 写成 What do you spell。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7a-starter-keep-tidy', number: 2, isStarter: true, title: 'Keep Tidy!', theme: '物品、颜色与归属',
      expressions: ['What colour is it?', 'Whose bottle is this?', 'It is mine.'],
      vocabulary: [
        ['tidy', '形容词/动词', '整洁的；使整洁', '作形容词描述环境，作动词表示整理。', 'tidier；tidiest；tidies；tidied；tidying。', ['keep tidy', 'tidy up'], 'Please tidy up your desk before you leave.', '离开前请整理好你的书桌。', 'tidy up 是动词短语，keep tidy 中 tidy 是形容词。'],
        ['bottle', '名词', '瓶子', '可数名词，也可作量词容器。', '复数 bottles。', ['a bottle of water', 'water bottle'], 'My water bottle is beside the blue bag.', '我的水瓶在蓝色书包旁边。', 'a bottle of 后接不可数液体时，复数变化在 bottle 上。'],
        ['eraser', '名词', '橡皮', '可数名词，美式英语常用 eraser。', '复数 erasers。', ['use an eraser', 'pencil and eraser'], 'This eraser is small, but it works well.', '这块橡皮很小，但很好用。', 'eraser 以元音音素开头，单数前用 an。'],
        ['ruler', '名词', '尺子；统治者', '本单元表示测量长度的文具。', '复数 rulers。', ['a long ruler', 'measure with a ruler'], 'Use a ruler to draw a straight line.', '用尺子画一条直线。', '语境决定 ruler 是“尺子”还是“统治者”。'],
        ['colour', '名词/动词', '颜色；给……着色', '英式拼写 colour，美式拼写 color。', '复数 colours；colours；coloured；colouring。', ['What colour', 'colour the picture'], 'What colour is your new pencil case?', '你的新铅笔盒是什么颜色？', '询问颜色用 What colour，不用 How colour。'],
        ['whose', '疑问限定词/代词', '谁的', '询问所有者，可直接放在名词前，也可单独使用。', '通常不变化。', ['whose book', 'Whose is this?'], 'Whose keys are these on the table?', '桌上的这些钥匙是谁的？', 'whose 与 who’s 发音相近，但 who’s 是 who is/has 的缩写。'],
        ['mine', '名词性物主代词', '我的', '相当于 my + 名词，后面不能再接名词。', '通常不变化。', ['a friend of mine', 'It is mine'], 'The green notebook is mine.', '绿色的笔记本是我的。', '不能说 mine notebook，应说 my notebook。'],
        ['put', '动词', '放；安置', '常接地点介词短语说明放置位置。', 'puts；put；put；putting。', ['put ... in', 'put away'], 'Put your books back on the shelf, please.', '请把书放回书架上。', 'put 的过去式和过去分词仍是 put。'],
      ],
      grammar: [
        g('possessives', '形容词性与名词性物主代词', '形容词性物主代词后必须接名词；名词性物主代词可以独立使用。', ['my book = mine', 'your ruler = yours', 'his bag = his', 'her bottle = hers'], [['This is my pen. That one is yours.', '这是我的钢笔。那支是你的。', 'yours 代替 your pen。'], ['Their classroom is larger than ours.', '他们的教室比我们的更大。', 'ours 代替 our classroom。']], ['在 mine、yours 后再接名词。', '把 its 和 it’s 混为一谈。']),
        g('whose-demonstratives', 'Whose 与指示代词', 'whose 询问归属；this/that 指单数，these/those 指复数。', ['Whose + 单数名词 + is this/that?', 'Whose + 复数名词 + are these/those?'], [['Whose cap is that?', '那是谁的帽子？', 'cap 为单数，be 动词用 is。'], ['Whose pencils are these?', '这些是谁的铅笔？', 'pencils 为复数，be 动词用 are。']], ['复数名词仍搭配 is。', '远处复数使用 these 而不是 those。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7a-starter-welcome', number: 3, isStarter: true, title: 'Welcome!', theme: '庭院、农场与身边事物',
      expressions: ['Welcome to our farm.', 'There are three rabbits.', 'What else can you see?'],
      vocabulary: [
        ['welcome', '感叹词/动词/形容词', '欢迎；迎接；受欢迎的', '可用于问候，也可作动词接人或作形容词。', 'welcomes；welcomed；welcoming。', ['welcome to', 'welcome visitors'], 'Welcome to our school garden.', '欢迎来到我们的校园花园。', 'Welcome to 后接地点；You are welcome 还可回应感谢。'],
        ['yard', '名词', '院子；庭院', '指房屋周围的户外空间。', '复数 yards。', ['front yard', 'in the yard'], 'Two children are playing in the yard.', '两个孩子正在院子里玩。', '表示在院子里使用 in the yard。'],
        ['farm', '名词/动词', '农场；务农', '作名词指农业生产场所，作动词表示耕作。', '复数 farms；farms；farmed；farming。', ['on a farm', 'farm animals'], 'My uncle grows vegetables on a small farm.', '我叔叔在一个小农场种蔬菜。', '英语习惯说 on a farm，而不是 in a farm。'],
        ['goose', '名词', '鹅', '可数名词，不规则复数。', '复数 geese。', ['a wild goose', 'a flock of geese'], 'Three geese are walking near the pond.', '三只鹅正在池塘附近走。', '复数是 geese，不是 gooses。'],
        ['rabbit', '名词', '兔子', '可数名词，可用形容词描述外形。', '复数 rabbits。', ['pet rabbit', 'a white rabbit'], 'The white rabbit has two long ears.', '这只白兔有两只长耳朵。', '描述动物拥有某物时注意 has/have。'],
        ['plant', '名词/动词', '植物；种植', '作名词指植物，作动词表示把种子或幼苗种下。', '复数 plants；plants；planted；planting。', ['green plants', 'plant a tree'], 'We plant flowers beside the classroom.', '我们在教室旁边种花。', 'plant trees 表示“植树”，tree 要用复数泛指。'],
        ['count', '动词/名词', '数数；计算；总数', '本单元主要作动词，表示逐个确定数量。', 'counts；counted；counting。', ['count from ... to ...', 'count the animals'], 'Can you count the ducks in the picture?', '你能数出图里的鸭子吗？', 'can 后使用动词原形 count。'],
        ['another', '限定词/代词', '又一个；另一个', '通常指三者或更多中的另一个，后接单数可数名词。', '通常不变化。', ['another one', 'another animal'], 'I can see another bird behind the tree.', '我能看到树后还有一只鸟。', 'another 后一般接单数，another two days 是特殊数量结构。'],
      ],
      grammar: [
        g('there-be', 'There be 场景描述', 'there be 表示某地存在某人或某物，be 的形式通常与紧邻的名词保持一致。', ['There is + 单数/不可数名词 + 地点.', 'There are + 复数名词 + 地点.'], [['There is a pond behind the house.', '房子后面有一个池塘。', 'a pond 为单数，所以用 is。'], ['There are five ducks on the farm.', '农场里有五只鸭子。', 'five ducks 为复数，所以用 are。']], ['用 have 直接替换所有 there be 句。', 'There are 后接单数名词。']),
        g('number-nouns', '基数词与可数名词复数', 'one 后接单数，two 及以上通常接可数名词复数；部分名词复数不规则。', ['one rabbit', 'two rabbits', 'one goose', 'three geese'], [['There is one sheep near the gate.', '门边有一只羊。', 'sheep 的单复数同形。'], ['I can count six tomatoes.', '我能数出六个西红柿。', 'tomato 的复数加 -es。']], ['所有复数都简单加 -s。', '数字大于一时仍使用单数名词。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7a-you-and-me', number: 1, title: 'You and Me', theme: '个人信息与结交朋友',
      expressions: ['I am in Class 2, Grade 7.', 'Where are you from?', 'We have the same hobby.'],
      vocabulary: [
        ['information', '名词', '信息；资料', '不可数名词，表示一项信息可说 a piece of information。', '不可数，无复数形式。', ['personal information', 'a piece of information'], 'Please check your personal information before you send the form.', '提交表格前请核对个人信息。', '不能说 an information 或 informations。'],
        ['classmate', '名词', '同班同学', '由 class + mate 构成，指同一个班的人。', '复数 classmates。', ['new classmate', 'talk with classmates'], 'My new classmate comes from Guangzhou.', '我的新同学来自广州。', 'classmate 不等于所有 schoolmate。'],
        ['country', '名词', '国家；乡村', '谈国籍时常与 be from 连用。', '复数 countries。', ['come from a country', 'country life'], 'Which country is your online friend from?', '你的网友来自哪个国家？', '复数将辅音字母+y 变为 -ies。'],
        ['hobby', '名词', '业余爱好', '可数名词，询问爱好常用 What is your hobby?。', '复数 hobbies。', ['have a hobby', 'favourite hobby'], 'Photography is an interesting hobby.', '摄影是一项有趣的爱好。', '复数为 hobbies，不是 hobbys。'],
        ['same', '形容词', '相同的', '通常与定冠词 the 连用。', '通常无比较级。', ['the same as', 'the same hobby'], 'Our school bags are the same colour.', '我们的书包颜色相同。', '常说 the same，不省略 the。'],
        ['different', '形容词', '不同的', '描述差异，常与 from 连用。', '名词 difference；副词 differently。', ['be different from', 'different ideas'], 'My daily routine is different from yours.', '我的日常安排与你的不同。', '标准表达是 different from。'],
        ['friend', '名词', '朋友', '可数名词，可通过后缀构成 friendly、friendship。', '复数 friends；friendly；friendship。', ['make friends with', 'close friend'], 'It takes time to make friends in a new school.', '在新学校交朋友需要时间。', 'make friends with 中 friends 通常用复数。'],
        ['introduce', '动词', '介绍；引见', '介绍自己用 introduce oneself，介绍 A 给 B 用 introduce A to B。', 'introduces；introduced；introducing；名词 introduction。', ['introduce yourself', 'introduce ... to ...'], 'Let me introduce my partner to the class.', '让我把我的搭档介绍给全班。', 'introduce 后接对象时注意介词 to。'],
      ],
      grammar: [
        g('be-pronouns', 'be 动词与人称代词', '一般现在时中 am 跟 I，is 跟第三人称单数，are 跟 you 和复数主语。', ['I am ...', 'He/She/It is ...', 'You/We/They are ...'], [['I am thirteen, and she is twelve.', '我十三岁，她十二岁。', '年龄前用 be，不用 have。'], ['They are in the same class.', '他们在同一个班。', '复数主语 they 搭配 are。']], ['用 I is 或 they is。', '介绍年龄时直译为 I have thirteen years。']),
        g('wh-personal-info', '个人信息特殊疑问句', 'what、where、how old、which 分别询问内容、来源、年龄和选择范围。', ['What is your name?', 'Where are you from?', 'How old are you?', 'Which class are you in?'], [['Where is Emma from?', '埃玛来自哪里？', 'where 询问来源地点。'], ['Which class is Peter in?', '彼得在哪个班？', '有明确班级范围时使用 which。']], ['特殊疑问词后仍按陈述语序排列 be。', '把 How old 误写成 How many years。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7a-were-family', number: 2, title: "We're Family!", theme: '家庭成员与共同生活',
      expressions: ['This is my elder brother.', 'My father enjoys cooking.', "It's my grandparents' house."],
      vocabulary: [
        ['family', '名词', '家庭；家人', '指家庭整体时可看作单数，强调成员时可按复数理解。', '复数 families。', ['family member', 'a family of four'], 'My family has dinner together every Sunday.', '我家每周日一起吃晚饭。', '在美式英语中 family 作主语时常用单数谓语。'],
        ['parent', '名词', '父亲或母亲；家长', '单数指父母中的一方，parents 指父母双方。', '复数 parents。', ['my parents', 'parent meeting'], 'One of my parents walks me to school.', '我的父母中有一位陪我走路上学。', 'one of 后接复数名词，谓语按 one 用单数。'],
        ['cousin', '名词', '堂/表兄弟姐妹', '英语不区分堂亲和表亲，也不区分性别。', '复数 cousins。', ['older cousin', 'my cousin'], 'My cousin and I share the same interest in music.', '我和表姐都对音乐感兴趣。', '不要仅凭 cousin 判断性别或长幼。'],
        ['grandparent', '名词', '祖父母或外祖父母中的一位', 'grandparents 可泛指祖父母或外祖父母。', '复数 grandparents。', ['visit grandparents', 'grandparent and grandchild'], 'We visit our grandparents during the holiday.', '假期里我们去看望祖父母。', '中文关系更细，英语常靠上下文说明。'],
        ['child', '名词', '孩子；儿童', '不规则复数名词。', '复数 children。', ['only child', 'young children'], 'Every child in the family has a small job.', '家里的每个孩子都有一项小任务。', '复数是 children，不能写 childs。'],
        ['together', '副词', '一起；共同', '修饰动词，说明多人共同完成活动。', '通常不变化。', ['work together', 'get together'], 'We clean the kitchen together after dinner.', '晚饭后我们一起打扫厨房。', 'together 不直接作名词使用。'],
        ['share', '动词/名词', '分享；共同使用；一份', 'share sth. with sb. 表示与某人分享某物。', 'shares；shared；sharing。', ['share ... with ...', 'share housework'], 'I share a room with my younger sister.', '我和妹妹共用一个房间。', '介词使用 with，不用 to。'],
        ['elder', '形容词/名词', '年长的；长辈', '多用于家庭关系，常放在名词前。', '通常不作比较级；对应 younger。', ['elder brother', 'respect the elderly'], 'My elder brother teaches me to play chess.', '我哥哥教我下棋。', '比较年龄通常用 older；elder 主要用于亲属称谓。'],
      ],
      grammar: [
        g('present-have', '一般现在时与 have/has', '一般现在时描述稳定关系、习惯和经常性活动；第三人称单数谓语要变化。', ['I/You/We/They have ...', 'He/She/It has ...', '主语 + 动词第三人称单数 + ...'], [['My mother has short hair.', '我妈妈留着短发。', '第三人称单数使用 has。'], ['My cousins often play basketball together.', '我的表兄弟姐妹经常一起打篮球。', '复数主语使用 play 原形。']], ['第三人称单数漏加 -s。', 'does 出现后实义动词仍保留 -s。']),
        g('possessive-case', '名词所有格', '单数名词一般加 ’s；规则复数以 s 结尾时只加撇号；共同所有与分别所有含义不同。', ["my sister's bike", "my parents' room", "Tom and Jack's teacher"], [["This is my grandparents' garden.", '这是我祖父母的花园。', 'grandparents 已以 s 结尾，只加撇号。'], ["Lily's and Amy's bags are different.", '莉莉和埃米各自的包不同。', '分别拥有时两个名字都加 ’s。']], ['把 parents’ 写成 parent’s 导致含义改变。', '所有复数名词都只加撇号，忽略 children’s。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7a-my-school', number: 3, title: 'My School', theme: '校园空间与位置',
      expressions: ['There is a library near the gate.', 'The gym is across from the dining hall.', 'Go along this road and turn left.'],
      vocabulary: [
        ['building', '名词', '建筑物；楼房', '可数名词，也可指建造这一过程。', '复数 buildings；动词 build。', ['school building', 'office building'], 'The science building is behind the library.', '科学楼在图书馆后面。', 'building 指建筑，build 是动词。'],
        ['classroom', '名词', '教室', '由 class + room 构成的可数名词。', '复数 classrooms。', ['in the classroom', 'classroom rules'], 'Our classroom is on the second floor.', '我们的教室在二楼。', '楼层前常用 on。'],
        ['library', '名词', '图书馆', '可数名词，表示去图书馆常用 go to the library。', '复数 libraries。', ['school library', 'borrow from the library'], 'Students can read quietly in the library.', '学生可以在图书馆安静阅读。', '辅音字母+y 变复数为 -ies。'],
        ['gym', '名词', '体育馆；健身房', 'gymnasium 的常用缩略形式。', '复数 gyms。', ['school gym', 'in the gym'], 'The basketball team practises in the gym.', '篮球队在体育馆训练。', 'gym 前通常加冠词或限定词。'],
        ['behind', '介词/副词', '在……后面；向后', '作介词时后接名词或代词。', '通常不变化。', ['behind the building', 'leave ... behind'], 'There is a small garden behind our classroom.', '我们教室后面有一个小花园。', 'behind 表示空间后方，不同于 after 的时间先后。'],
        ['between', '介词', '在……之间', '通常用于两个对象或边界清楚的多个对象之间。', '通常不变化。', ['between A and B', 'between classes'], 'The lab is between the library and the gym.', '实验室在图书馆和体育馆之间。', '固定结构是 between A and B。'],
        ['across', '介词/副词', '横过；在对面', 'across from 表示在……对面，across 强调从表面穿过。', '通常不变化。', ['across from', 'walk across'], 'The dining hall is across from the art room.', '食堂在美术室对面。', 'across 是介词/副词，cross 是动词。'],
        ['direction', '名词', '方向；指示', 'give directions 表示指路，in the direction of 表示朝……方向。', '复数 directions；形容词 direct。', ['give directions', 'in this direction'], 'Could you give me directions to the music room?', '你能告诉我去音乐教室怎么走吗？', '表示“指路”时 directions 常用复数。'],
      ],
      grammar: [
        g('there-be-location', 'There be 的疑问与否定', '询问某地是否存在某物时把 be 提前；否定在 be 后加 not。', ['Is there + 单数/不可数名词 ...?', 'Are there + 复数名词 ...?', 'There is/are not ...'], [['Is there a computer room in your school?', '你们学校有电脑室吗？', '单数 room 搭配 Is there。'], ['There are not any shops near the gate.', '校门附近没有商店。', '否定句中常用 any。']], ['疑问句仍保持 There is ...?。', '否定句同时使用 no 和 not any。']),
        g('place-prepositions', '方位介词和介词短语', '方位表达从参照物出发，注意 near、behind、between、across from 的不同关系。', ['next to/beside', 'between A and B', 'across from/opposite', 'in front of/behind'], [['The office is next to the teachers’ room.', '办公室紧挨着教师办公室。', 'next to 表示紧邻。'], ['A tall tree stands in front of the lab.', '实验室前面有一棵高树。', 'in front of 指外部前方。']], ['混淆 in front of 与 in the front of。', 'between 后只写一个参照物。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7a-favourite-subject', number: 4, title: 'My Favourite Subject', theme: '课程、偏好与学习安排',
      expressions: ['My favourite subject is science.', 'I like it because it is useful.', 'We have history on Tuesday morning.'],
      vocabulary: [
        ['subject', '名词', '学科；主题；主语', '校园语境中指课程学科，语法中也可指主语。', '复数 subjects。', ['school subject', 'favourite subject'], 'Which subject helps you understand nature?', '哪门学科帮助你理解自然？', '根据语境判断是“学科”“主题”还是“主语”。'],
        ['favourite', '形容词/名词', '最喜欢的；最喜欢的人或物', '英式拼写 favourite，美式拼写 favorite。', '复数 favourites（作名词时）。', ['favourite subject', 'my favourite'], 'Art is my favourite because I enjoy drawing.', '美术是我最喜欢的学科，因为我喜欢画画。', 'favourite 本身已有“最喜欢”，一般不再加 most。'],
        ['useful', '形容词', '有用的；实用的', '由 use + -ful 构成，可作表语或定语。', '比较级 more useful；反义词 useless。', ['be useful for', 'useful skill'], 'Learning to read a map is useful for travel.', '学会看地图对旅行很有用。', 'be useful for 后接名词或 doing。'],
        ['difficult', '形容词', '困难的', '描述任务或学科难度，常用 it is difficult to do。', '比较级 more difficult；名词 difficulty。', ['find ... difficult', 'difficult to understand'], 'I find physics difficult but interesting.', '我觉得物理难但有趣。', '主语通常是事物；描述人的感受可说 have difficulty。'],
        ['because', '连词', '因为', '引导原因状语从句，回答 why。', '通常不变化。', ['because + 句子', 'because of + 名词'], 'I enjoy geography because it connects places and people.', '我喜欢地理，因为它把地方和人联系起来。', 'because 后接完整句，because of 后接名词性成分。'],
        ['history', '名词', '历史；历史学', '表示学科时通常不可数且不加冠词。', '复数 histories（指不同历史时）；形容词 historical。', ['study history', 'Chinese history'], 'History teaches us how societies change.', '历史教我们社会如何变化。', '学科名称首字母一般不大写，句首除外。'],
        ['science', '名词', '科学；理科', '表示学科时多为不可数名词。', '科学分支可用 sciences；形容词 scientific。', ['science class', 'do a science experiment'], 'Our science class begins with a simple question.', '我们的科学课从一个简单问题开始。', 'scientist 指科学家，scientific 是形容词。'],
        ['geography', '名词', '地理；地理学', '学科名称，通常不可数。', '形容词 geographical；名词 geographer。', ['study geography', 'geography lesson'], 'Geography helps me understand maps and climate.', '地理帮助我理解地图和气候。', '注意拼写中 geo- 与 -graphy。'],
      ],
      grammar: [
        g('conjunctions-reason', 'and、but 与 because', 'and 连接并列信息，but 表示转折，because 引出原因；一个句子要按逻辑选择连接词。', ['A and B', 'A, but B', '结果 + because + 原因'], [['Math is challenging, but I enjoy solving problems.', '数学有挑战性，但我喜欢解决问题。', '前后意义转折，用 but。'], ['I like biology because I am curious about life.', '我喜欢生物，因为我对生命好奇。', 'because 引出偏好的原因。']], ['because 与 so 在同一句中重复连接。', '转折关系误用 and。']),
        g('time-prepositions', '时间介词 at、on、in', 'at 接具体钟点，on 接具体日期或某天时段，in 接月份、年份和较长时段。', ['at 8:00', 'on Monday/on Monday morning', 'in September/in the afternoon'], [['The lesson starts at half past nine.', '这节课九点半开始。', '具体时刻使用 at。'], ['We have PE on Thursday afternoon.', '我们星期四下午上体育课。', '具体某天的下午使用 on。']], ['说 on the morning 泛指每天早晨。', '月份前使用 at。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7a-fun-clubs', number: 5, title: 'Fun Clubs', theme: '社团、能力与合作',
      expressions: ['I can play the guitar.', 'I would like to join the drama club.', 'What can you do for the club?'],
      vocabulary: [
        ['club', '名词', '俱乐部；社团', '可数名词，学校社团名称前通常加 the。', '复数 clubs。', ['join a club', 'school club'], 'Our reading club meets every Wednesday.', '我们的阅读社团每周三活动。', 'join 表示加入组织，attend 表示参加活动。'],
        ['join', '动词', '加入；参加；连接', '接人或组织；参加具体活动多用 join in 或 take part in。', 'joins；joined；joining。', ['join the team', 'join in the activity'], 'Mia wants to join the school orchestra.', '米娅想加入学校管弦乐团。', '不能说 join to the club。'],
        ['skill', '名词', '技能；技巧', '可数名词，常与 develop、practise 搭配。', '复数 skills；形容词 skilled。', ['communication skills', 'develop a skill'], 'The club helps students develop speaking skills.', '这个社团帮助学生培养口语技能。', '泛指多种能力时常用复数 skills。'],
        ['musical', '形容词/名词', '音乐的；音乐剧', '作形容词修饰名词，作名词表示音乐剧。', '复数 musicals；名词 music/musician。', ['musical instrument', 'school musical'], 'Leo can play two musical instruments.', '利奥会演奏两种乐器。', 'music 是名词，musical 才能直接修饰 instrument。'],
        ['instrument', '名词', '乐器；仪器', '语境决定是音乐器材还是科学仪器。', '复数 instruments。', ['play an instrument', 'musical instrument'], 'Which instrument would you like to learn?', '你想学哪种乐器？', 'play 后接乐器通常加 the：play the violin。'],
        ['drama', '名词', '戏剧；戏剧表演', '可指艺术形式，通常不可数；也可指一部戏剧。', '复数 dramas（指作品时）。', ['drama club', 'perform a drama'], 'The drama club is preparing a short play.', '戏剧社正在准备一部短剧。', 'play 也可作名词表示戏剧。'],
        ['paint', '动词/名词', '绘画；给……刷漆；油漆', '作动词可接图画或物体，painting 指画作或绘画活动。', 'paints；painted；painting。', ['paint a picture', 'paint the wall'], 'I like to paint scenes from nature.', '我喜欢画自然景色。', 'draw 常指线条画，paint 强调用颜料。'],
        ['ability', '名词', '能力；才能', 'have the ability to do 表示有能力做某事。', '复数 abilities；形容词 able。', ['have the ability to', 'language ability'], 'Team projects show each member’s ability.', '团队项目能展现每位成员的能力。', 'be able to 可用于更多时态，can 形式有限。'],
      ],
      grammar: [
        g('modal-can', 'can 表示能力', 'can 后接动词原形，没有人称变化；否定为 cannot/can’t，疑问把 can 提前。', ['主语 + can + 动词原形.', 'Can + 主语 + 动词原形?', '主语 + cannot/can’t + 动词原形.'], [['She can dance and sing.', '她会跳舞和唱歌。', 'can 同时支配两个并列动词原形。'], ['Can you design a club poster?', '你会设计社团海报吗？', '疑问句把 can 放在主语前。']], ['can 后使用 to do。', '第三人称单数写 cans play。']),
        g('verb-patterns-club', 'want、would like 与 enjoy 的动词搭配', '不同动词后的形式不同：want/would like 后接 to do，enjoy 后接 doing。', ['want/would like to do', 'enjoy doing', 'be good at doing'], [['I would like to join the chess club.', '我想加入国际象棋社。', 'would like 后接不定式。'], ['Ella enjoys taking photos.', '埃拉喜欢拍照。', 'enjoy 后接动名词。']], ['would like 后直接接 doing。', 'be good at 后接动词原形。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7a-day-in-life', number: 6, title: 'A Day in the Life', theme: '日常作息与时间管理',
      expressions: ['I usually get up at 6:30.', 'How often do you exercise?', 'I sometimes read before bed.'],
      vocabulary: [
        ['routine', '名词/形容词', '常规；日常安排；常规的', 'daily routine 表示每天重复的活动次序。', '复数 routines。', ['daily routine', 'morning routine'], 'A simple morning routine helps me start calmly.', '简单的晨间安排帮助我从容开始一天。', 'routine 强调规律，不等于一次性的 plan。'],
        ['wake', '动词', '醒来；唤醒', 'wake up 可不及物，也可接宾语。', 'wakes；woke；woken；waking。', ['wake up', 'wake somebody up'], 'I wake up before my alarm on school days.', '上学日我在闹钟响前醒来。', 'wake 的过去式是 woke，过去分词是 woken。'],
        ['shower', '名词/动词', '淋浴；淋浴器；洗淋浴', 'take/have a shower 表示洗淋浴。', '复数 showers；showered；showering。', ['take a shower', 'shower room'], 'He takes a quick shower after basketball practice.', '篮球训练后他快速冲个澡。', '中文“洗澡”不要直译为 wash a shower。'],
        ['breakfast', '名词', '早餐', '餐名前通常不用冠词，have breakfast 表示吃早餐。', '通常不可数；特指不同种类时可数。', ['have breakfast', 'a healthy breakfast'], 'We have breakfast at home before seven.', '我们七点前在家吃早餐。', '固定搭配中不说 have a breakfast，除非强调一顿特别的早餐。'],
        ['arrive', '动词', '到达', 'arrive at 接小地点，arrive in 接城市、国家等大地点。', 'arrives；arrived；arriving；名词 arrival。', ['arrive at school', 'arrive in Beijing'], 'The school bus arrives at the gate at 7:40.', '校车七点四十分到校门口。', 'arrive 后不能直接接地点名词。'],
        ['usually', '副词', '通常', '表示较高频率，常放在实义动词前、be 动词后。', '通常不变化。', ['usually go', 'be usually'], 'I usually review my notes after dinner.', '我通常晚饭后复习笔记。', '在否定句中位置要结合助动词。'],
        ['sometimes', '副词', '有时', '可放句首、句中或句末，位置较灵活。', '通常不变化。', ['sometimes visit', 'Sometimes, ...'], 'Sometimes I walk to school with my neighbour.', '有时我和邻居一起走路上学。', 'sometimes 是频度副词；some times 表示“几次”。'],
        ['homework', '名词', '家庭作业', '不可数名词，一项作业可说 a piece of homework。', '不可数，无复数形式。', ['do homework', 'finish homework'], 'I finish my homework before I use the tablet.', '我完成作业后才使用平板电脑。', '不能说 homeworks，也不说 make homework。'],
      ],
      grammar: [
        g('clock-time', '钟点与时段表达', '可直接按小时和分钟读，也可用 past/to；安排时间时常与 at 连用。', ['6:15 = six fifteen/a quarter past six', '6:30 = six thirty/half past six', '6:45 = six forty-five/a quarter to seven'], [['Our first class begins at eight twenty.', '我们的第一节课八点二十分开始。', '具体钟点前用 at。'], ['I leave home at a quarter to eight.', '我七点四十五分离开家。', 'to 后接下一个钟点。']], ['past 和 to 的参照钟点弄反。', '钟点前使用 on。']),
        g('frequency-adverbs', '一般现在时与频度副词', '一般现在时描述习惯；always、usually、often、sometimes、never 表示不同频率。', ['主语 + 频度副词 + 实义动词', '主语 + be + 频度副词', 'How often + do/does ...?'], [['Tina often reads on the bus.', '蒂娜经常在公交车上阅读。', 'often 放在实义动词 reads 前。'], ['He is never late for school.', '他上学从不迟到。', 'never 放在 be 动词后。']], ['把频度副词一律放在句末。', 'How often 的回答只写一个具体钟点。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7a-happy-birthday', number: 7, title: 'Happy Birthday!', theme: '日期、庆祝与理性消费',
      expressions: ['When is your birthday?', 'It is on the twelfth of May.', 'How much is the notebook?'],
      vocabulary: [
        ['birthday', '名词', '生日', '可数名词，birthday party 表示生日聚会。', '复数 birthdays。', ['happy birthday', 'birthday gift'], 'We are planning a small birthday picnic for Mei.', '我们正在为梅策划一个小型生日野餐。', 'birthday 前有物主限定词时不用冠词。'],
        ['celebrate', '动词', '庆祝；赞美', '接节日、生日或成就作宾语。', 'celebrates；celebrated；celebrating；名词 celebration。', ['celebrate a birthday', 'celebrate with'], 'They celebrate their grandmother’s birthday at home.', '他们在家庆祝祖母的生日。', 'celebration 是名词，注意词性转换。'],
        ['date', '名词/动词', '日期；约会；确定年代', '询问日期可用 What is the date today?。', '复数 dates；dated；dating。', ['today’s date', 'date of birth'], 'Please write the date at the top of the page.', '请在页面顶部写日期。', 'What day 询问星期，What date 询问日期。'],
        ['gift', '名词', '礼物；天赋', '可数名词，give sb. a gift 表示送某人礼物。', '复数 gifts。', ['birthday gift', 'a gift for'], 'This handmade card is a meaningful gift for Dad.', '这张手工卡片是送给爸爸的一份有意义的礼物。', '给某人的礼物用 a gift for sb.。'],
        ['candle', '名词', '蜡烛', '可数名词，生日语境常用复数。', '复数 candles。', ['light a candle', 'birthday candles'], 'There are thirteen candles on the cake.', '蛋糕上有十三支蜡烛。', 'light 作动词时过去式可为 lit/lighted。'],
        ['wish', '名词/动词', '愿望；祝愿；希望', 'make a wish 表示许愿；wish sb. + 名词表示祝愿。', '复数 wishes；wishes；wished；wishing。', ['make a wish', 'wish you happiness'], 'Close your eyes and make a wish.', '闭上眼睛许个愿吧。', 'wish to do 较正式；hope 后通常不接 sb. to do。'],
        ['price', '名词', '价格；代价', '价格高低用 high/low，物品贵贱用 expensive/cheap。', '复数 prices。', ['at a good price', 'the price of'], 'The price of this book is lower online.', '这本书在网上价格更低。', '不能说 the price is expensive。'],
        ['afford', '动词', '买得起；承担得起', '常与 can/cannot 连用，后接名词或 to do。', 'affords；afforded；affording。', ['can afford', 'afford to buy'], 'I can afford the pen, but not the expensive bag.', '我买得起这支笔，但买不起那个昂贵的包。', 'afford 本身含能力意义，常用于否定或疑问。'],
      ],
      grammar: [
        g('dates-ordinals', '序数词与日期', '日期中的“日”使用序数词；书写可用 May 12/12 May，朗读时补充 the 和 of。', ['May 12 = May the twelfth', '12 May = the twelfth of May', 'on + 具体日期'], [['The school festival is on October the third.', '校园节在十月三日。', '具体日期前使用 on。'], ['Her birthday is on the twenty-first of June.', '她的生日是六月二十一日。', '21st 读作 twenty-first。']], ['日期中的日使用基数词直接朗读。', '具体日期前使用 in。']),
        g('when-how-much', 'When 与 How much 问句', 'when 询问时间，how much 询问价格或不可数数量；回答要与问题类型一致。', ['When is ...? — It is on ...', 'How much is/are ...? — It is/They are ... yuan.'], [['When is the class party?', '班级聚会是什么时候？', '询问活动日期使用 when。'], ['How much are these two notebooks?', '这两本笔记本多少钱？', '复数主语使用 are。']], ['复数商品仍使用 How much is。', '用 How many 直接询问价格。']),
      ],
    }),
  ],
});

const grade7Lower = createBook({
  id: 'eng-book-g7b-2024',
  gradeId: 'g7',
  semester: 'lower',
  label: '七年级下册',
  shortLabel: '七下',
  edition: '2024 年修订版',
  status: 'verified',
  sourceNote: '目录已按 2025 年春启用的人教版新教材核对。',
  units: [
    unit({
      id: 'eng-unit-g7b-animal-friends', number: 1, title: 'Animal Friends', theme: '动物特征与和谐共生',
      expressions: ['What animals do you like?', 'Why do you like penguins?', 'We should protect animals in danger.'],
      vocabulary: [
        ['animal', '名词', '动物', '可数名词，泛指动物种类时常用复数。', '复数 animals。', ['wild animal', 'protect animals'], 'Every animal has a role in its ecosystem.', '每种动物在生态系统中都有作用。', '泛指一类动物可用复数或 the + 单数。'],
        ['penguin', '名词', '企鹅', '可数名词，描述种类时可使用复数。', '复数 penguins。', ['emperor penguin', 'a group of penguins'], 'Penguins use their wings to swim through water.', '企鹅用翅膀在水中游动。', '企鹅有 wings，但不会像多数鸟类那样飞。'],
        ['eagle', '名词', '鹰；雕', '可数名词，以元音音素开头，单数用 an eagle。', '复数 eagles。', ['a golden eagle', 'eagle’s wings'], 'An eagle can see small animals from high above.', '鹰能从高空看到小动物。', '单数前用 an，不用 a。'],
        ['lovely', '形容词', '可爱的；令人愉快的', '可描述人、动物、天气或体验。', '比较级 lovelier；最高级 loveliest。', ['lovely animal', 'lovely day'], 'The baby elephant looks lovely and curious.', '小象看起来可爱又好奇。', 'lovely 是形容词，不是副词。'],
        ['protect', '动词', '保护', 'protect ... from/against ... 表示保护……免受……。', 'protects；protected；protecting；名词 protection。', ['protect wildlife', 'protect ... from ...'], 'Trees protect small animals from strong sunlight.', '树木保护小动物免受强烈阳光照射。', 'from 后接名词或 doing。'],
        ['danger', '名词', '危险', 'in danger 表示处于危险中，dangerous 是形容词。', '复数 dangers；形容词 dangerous。', ['in danger', 'out of danger'], 'Some sea animals are in danger because of plastic waste.', '一些海洋动物因塑料垃圾而处于危险中。', 'in danger 的主语处境危险；dangerous 描述会带来危险。'],
        ['habitat', '名词', '栖息地；生境', '指动植物自然生活和生长的环境。', '复数 habitats。', ['natural habitat', 'lose a habitat'], 'Wetlands provide a habitat for many birds.', '湿地为许多鸟类提供栖息地。', 'provide a habitat for 是常见搭配。'],
        ['clever', '形容词', '聪明的；灵巧的', '可描述学习快、解决问题能力强。', '比较级 cleverer/more clever；最高级 cleverest。', ['clever animal', 'clever at'], 'Dolphins are clever enough to learn signals.', '海豚足够聪明，能够学习信号。', 'clever enough 中 enough 放在形容词后。'],
      ],
      grammar: [
        g('wh-animals', 'What、Where 与 Why 特殊疑问句', 'what 询问对象或特征，where 询问地点，why 询问原因并常用 because 回答。', ['What animals ...?', 'Where do they live?', 'Why do you like them? — Because ...'], [['Where do polar bears live?', '北极熊生活在哪里？', '询问栖息地使用 where。'], ['Why are bees important? Because they help plants grow.', '蜜蜂为什么重要？因为它们帮助植物生长。', 'why 与 because 构成问答。']], ['Why 问句回答只重复 yes/no。', '特殊疑问词后漏掉助动词 do。']),
        g('plural-adjectives', '名词复数与形容词描述', '谈动物种类常用复数；形容词放在名词前或系动词后，不随名词单复数变化。', ['cute pandas', 'Pandas are cute.', 'one wolf — two wolves'], [['Giraffes have long necks.', '长颈鹿有长脖子。', '泛指长颈鹿和脖子都使用复数。'], ['The fox looks clever.', '这只狐狸看起来很聪明。', 'look 为系动词，后接形容词。']], ['给形容词加复数 -s。', '不规则复数 wolf 写成 wolfs。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7b-no-rules-no-order', number: 2, title: 'No Rules, No Order', theme: '规则、秩序与责任',
      expressions: ['We must follow the rules.', 'You must not run in the hall.', 'Do we have to wear a uniform?'],
      vocabulary: [
        ['rule', '名词/动词', '规则；规定；统治', '本单元主要作可数名词，follow/obey a rule 表示遵守规则。', '复数 rules；ruled；ruling。', ['follow the rules', 'school rule'], 'Clear rules help everyone use the lab safely.', '清晰的规则帮助大家安全使用实验室。', 'break a rule 表示违反规则。'],
        ['order', '名词/动词', '秩序；命令；点单', 'in order 表示有序，out of order 可表示故障或无序。', '复数 orders；ordered；ordering。', ['keep order', 'in order'], 'Students line up in order before entering the hall.', '学生们排好队进入大厅。', '语境决定 order 是秩序、命令还是订单。'],
        ['follow', '动词', '遵循；跟随；理解', 'follow a rule/advice 表示遵守规则或听从建议。', 'follows；followed；following。', ['follow instructions', 'follow the rules'], 'Follow the signs to find the emergency exit.', '按照标志找到紧急出口。', 'follow 后直接接宾语，不加 to。'],
        ['allow', '动词', '允许；准许', 'allow sb. to do 或 allow doing，结构不同。', 'allows；allowed；allowing。', ['allow somebody to do', 'allow doing'], 'The museum does not allow visitors to touch the exhibits.', '博物馆不允许游客触摸展品。', '不能说 allow somebody do。'],
        ['must', '情态动词', '必须；一定', '表示强制义务或肯定推测，后接动词原形。', '情态动词无第三人称变化。', ['must do', 'must not'], 'Cyclists must stop when the light is red.', '红灯时骑车人必须停下。', 'must not 表示禁止，不等于“不必”。'],
        ['uniform', '名词/形容词', '制服；统一的', 'school uniform 为可数名词短语。', '复数 uniforms。', ['wear a uniform', 'school uniform'], 'Our team wears a blue uniform during matches.', '比赛时我们队穿蓝色队服。', 'wear 强调穿着状态，put on 强调动作。'],
        ['quiet', '形容词', '安静的；轻声的', '作表语或定语；副词为 quietly。', '比较级 quieter；副词 quietly。', ['keep quiet', 'quiet place'], 'Please keep quiet while others are reading.', '别人在阅读时请保持安静。', '修饰动词 speak 要用 quietly。'],
        ['responsibility', '名词', '责任；职责', '可数或不可数，take responsibility for 表示对……负责。', '复数 responsibilities；形容词 responsible。', ['take responsibility for', 'personal responsibility'], 'Keeping the classroom clean is everyone’s responsibility.', '保持教室清洁是每个人的责任。', 'be responsible for 与 take responsibility for 对应。'],
      ],
      grammar: [
        g('imperatives-rules', '祈使句表达指令与禁止', '肯定祈使句以动词原形开头；否定祈使句用 Don’t + 动词原形；please 可缓和语气。', ['动词原形 + ...', 'Don’t + 动词原形 + ...', 'Please + 动词原形 + ...'], [['Keep the passage clear.', '保持通道畅通。', '直接以动词原形开头。'], ['Do not feed the animals.', '请勿投喂动物。', '正式告示常用 Do not。']], ['祈使句主语前再加 you。', '否定句写 Not run。']),
        g('must-have-to', 'must、have to 与 can', 'must 表示说话者强调的义务，have to 常指客观要求，can 可表达允许；不必用 don’t have to。', ['must/must not + 动词原形', 'have/has to + 动词原形', 'can/cannot + 动词原形'], [['We have to show our tickets at the gate.', '我们必须在入口出示票。', '规定形成客观要求，使用 have to。'], ['You do not have to bring your own chair.', '你不必自带椅子。', 'don’t have to 表示没有必要。']], ['用 mustn’t 表示“不必”。', 'has to 后的实义动词加 -s。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7b-keep-fit', number: 3, title: 'Keep Fit', theme: '运动、习惯与身心健康',
      expressions: ['How often do you exercise?', 'You should get enough sleep.', 'Walking keeps us active.'],
      vocabulary: [
        ['fit', '形容词/动词', '健康的；合适；适合', 'keep fit 表示保持健康；fit 也可表示尺寸合适。', 'fitter；fittest；fits；fitted；fitting。', ['keep fit', 'fit well'], 'Regular exercise helps us keep fit.', '规律运动帮助我们保持健康。', 'healthy 强调整体健康，fit 常强调身体状态。'],
        ['exercise', '名词/动词', '锻炼；练习', '表示体育锻炼通常不可数，表示一道练习题时可数。', '复数 exercises；exercised；exercising。', ['do exercise', 'exercise regularly'], 'My grandfather exercises in the park every morning.', '我爷爷每天早上在公园锻炼。', '具体练习题可说 grammar exercises。'],
        ['healthy', '形容词', '健康的；有益健康的', '可描述人、饮食、习惯；名词为 health。', '比较级 healthier；名词 health。', ['healthy lifestyle', 'stay healthy'], 'A healthy lunch gives us energy for the afternoon.', '健康的午餐为下午提供能量。', 'health 是名词，healthy 是形容词。'],
        ['habit', '名词', '习惯', '可数名词，develop/form a habit 表示养成习惯。', '复数 habits。', ['good habit', 'develop a habit of'], 'Reading before bed is a relaxing habit.', '睡前阅读是一个让人放松的习惯。', 'habit of 后接名词或 doing。'],
        ['sleep', '名词/动词', '睡眠；睡觉', 'get enough sleep 中为不可数名词。', 'sleeps；slept；sleeping；形容词 sleepy/asleep。', ['get enough sleep', 'fall asleep'], 'Teenagers need enough sleep to stay focused.', '青少年需要充足睡眠来保持专注。', 'sleepy 表示困倦，asleep 表示睡着。'],
        ['energy', '名词', '精力；能量', '通常不可数，形容词 energetic 表示精力充沛。', '通常不可数；形容词 energetic。', ['have energy', 'save energy'], 'A short break can give you more energy.', '短暂休息能让你更有精力。', '表示“精力”时一般不用复数。'],
        ['active', '形容词', '活跃的；积极的', 'stay active 表示保持活动，也可描述积极参与。', '副词 actively；名词 activity。', ['stay active', 'take an active part in'], 'She stays active by cycling to school.', '她通过骑车上学保持活力。', 'by 后接 doing 表示方式。'],
        ['enough', '限定词/代词/副词', '足够的（地）', '修饰名词时放名词前，修饰形容词或副词时放其后。', '通常不变化。', ['enough water', 'old enough'], 'Drink enough water when you exercise.', '锻炼时要喝足够的水。', '位置规则：enough time，但 strong enough。'],
      ],
      grammar: [
        g('how-often', 'How often 与频率表达', 'How often 询问动作发生频率，可用频度副词或 once/twice/three times a week 回答。', ['How often do/does ...?', 'once/twice a week', 'three times a month'], [['How often do you play outside?', '你多久进行一次户外活动？', '询问重复频率。'], ['I swim twice a week.', '我每周游泳两次。', 'twice 表示两次。']], ['用具体钟点回答 How often。', '三次写成 third times。']),
        g('advice-health', 'should 与动名词作主语', 'should + 动词原形用于提出建议；动名词短语可作主语，谓语通常用单数。', ['You should/should not + 动词原形.', 'Doing ... is/helps ...'], [['You should stretch before running.', '跑步前你应该拉伸。', 'should 后使用动词原形。'], ['Eating slowly helps your body notice when it is full.', '慢慢吃帮助身体感知饱腹。', '动名词短语作主语，谓语用 helps。']], ['should 后使用 to do。', '动名词主语后谓语误用复数。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7b-eat-well', number: 4, title: 'Eat Well', theme: '食物、营养与均衡选择',
      expressions: ['How much sugar is there?', 'We need some protein and plenty of vegetables.', 'This meal is healthier than that one.'],
      vocabulary: [
        ['meal', '名词', '一餐；进餐', '可数名词，常见 breakfast、lunch、dinner 三餐。', '复数 meals。', ['have a meal', 'balanced meal'], 'A balanced meal includes different kinds of food.', '均衡的一餐包含不同种类的食物。', 'meal 指一餐整体，不等同于某一种 food。'],
        ['balanced', '形容词', '均衡的；平衡的', '由 balance 的过去分词形式转化，可描述饮食或生活。', '动词/名词 balance。', ['balanced diet', 'well-balanced meal'], 'Try to keep a balanced diet during busy weeks.', '忙碌的几周里也要尽量保持均衡饮食。', 'diet 指日常饮食，不只表示节食。'],
        ['vegetable', '名词', '蔬菜', '可数名词，泛指多种蔬菜时常用复数。', '复数 vegetables。', ['fresh vegetables', 'green vegetables'], 'Colourful vegetables make the plate more varied.', '多彩蔬菜让餐盘更加多样。', '谈一类蔬菜通常使用复数。'],
        ['sugar', '名词', '糖；食糖', '表示物质时不可数，强调种类时可数。', '通常不可数。', ['too much sugar', 'low in sugar'], 'This drink contains too much sugar.', '这种饮料含糖过多。', '不可数 sugar 与 much/little 搭配。'],
        ['protein', '名词', '蛋白质', '作为营养成分通常不可数，也可指某类蛋白质。', '通常不可数；指种类时可数。', ['rich in protein', 'source of protein'], 'Beans are a useful source of protein.', '豆类是很好的蛋白质来源。', 'be rich in 表示富含。'],
        ['fresh', '形容词', '新鲜的；清新的', '可描述食物、空气、水或想法。', '比较级 fresher；最高级 freshest。', ['fresh fruit', 'fresh air'], 'Choose fresh fruit instead of a sugary snack.', '选择新鲜水果代替高糖零食。', 'fresh 不等于 new，食物通常用 fresh。'],
        ['avoid', '动词', '避免；避开', '后接名词、代词或 doing，不直接接 to do。', 'avoids；avoided；avoiding。', ['avoid doing', 'avoid too much salt'], 'Avoid eating too quickly at lunch.', '午餐时避免吃得太快。', '固定用 avoid doing。'],
        ['portion', '名词', '一份；部分', '指为一个人准备或食用的量。', '复数 portions。', ['small portion', 'portion size'], 'A smaller portion may be enough if you eat slowly.', '如果慢慢吃，较小的一份可能就够了。', 'portion 强调分配的一份，amount 强调总量。'],
      ],
      grammar: [
        g('count-uncount', '可数与不可数名词的数量表达', '可数复数搭配 many/few，通常不可数名词搭配 much/little；some/any 可用于两类。', ['many/few + 可数名词复数', 'much/little + 不可数名词', 'some/any + 两类名词'], [['There are a few tomatoes in the bowl.', '碗里有几个西红柿。', 'tomatoes 可数，使用 a few。'], ['We do not need much oil.', '我们不需要很多油。', 'oil 不可数，使用 much。']], ['用 many 修饰 sugar。', '把 advice、bread 随意加 -s。']),
        g('quantities-comparison', 'How many、How much 与比较选择', 'How many 询问可数数量，How much 询问不可数数量或价格；比较健康程度使用比较级。', ['How many + 可数复数 ...?', 'How much + 不可数名词 ...?', '形容词比较级 + than'], [['How many eggs do we need?', '我们需要多少个鸡蛋？', 'eggs 可数，用 how many。'], ['Steamed fish is healthier than fried fish.', '清蒸鱼比油炸鱼更健康。', 'healthy 的比较级为 healthier。']], ['How much 后接可数复数。', '比较级和 more 重复使用。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7b-here-and-now', number: 5, title: 'Here and Now', theme: '正在发生的校园与生活',
      expressions: ['What are they doing now?', 'The students are preparing a show.', 'She usually sings, but today she is dancing.'],
      vocabulary: [
        ['activity', '名词', '活动', '可数名词，指有目的的行动或项目。', '复数 activities；形容词 active。', ['school activity', 'outdoor activity'], 'Several activities are taking place in the playground.', '操场上正在开展几项活动。', '复数把 y 变为 -ies。'],
        ['prepare', '动词', '准备；预备', 'prepare sth.、prepare for sth.、prepare to do 结构不同。', 'prepares；prepared；preparing；名词 preparation。', ['prepare for', 'prepare to do'], 'The band is preparing for the school show.', '乐队正在为校园演出做准备。', 'prepare for 后接准备面对的事情。'],
        ['practise', '动词', '练习；实践', '英式拼写 practise 为动词，美式 practice 可作动词；后接 doing。', 'practises；practised；practising。', ['practise doing', 'practise a skill'], 'They are practising speaking clearly on stage.', '他们正在练习在台上清晰讲话。', '在英式英语中 practice 通常是名词。'],
        ['happen', '动词', '发生；碰巧', '不及物动词，不能直接使用被动语态。', 'happens；happened；happening。', ['What happened?', 'happen to do'], 'Something exciting is happening near the gate.', '校门附近正在发生令人兴奋的事。', '不能说 was happened。'],
        ['currently', '副词', '目前；当前', '比 now 稍正式，可修饰正在持续的状态或安排。', '形容词 current。', ['currently working', 'currently available'], 'The library is currently holding a book fair.', '图书馆目前正在举办书展。', 'currently 常与进行时连用，但也可用于一般时态。'],
        ['performance', '名词', '表演；表现；性能', '校园语境可指演出，也可指完成任务的表现。', '复数 performances；动词 perform。', ['give a performance', 'stage performance'], 'Our class is giving a short performance in the hall.', '我们班正在礼堂进行短节目表演。', 'perform 是动词，performance 是名词。'],
        ['member', '名词', '成员；会员', '可数名词，a member of 表示……的一员。', '复数 members。', ['team member', 'a member of'], 'Every club member is helping with the event.', '每位社团成员都在协助活动。', 'a member of 后接组织。'],
        ['stage', '名词/动词', '舞台；阶段；上演', 'on stage 表示在舞台上，也可比喻处于阶段。', '复数 stages；staged；staging。', ['on stage', 'stage a show'], 'Two speakers are waiting beside the stage.', '两位发言者正在舞台旁等待。', 'on the stage 指具体舞台表面，on stage 强调登台状态。'],
      ],
      grammar: [
        g('present-continuous', '现在进行时', '现在进行时表示说话时或当前阶段正在进行的动作，结构为 am/is/are + doing。', ['I am doing ...', 'He/She is doing ...', 'We/You/They are doing ...'], [['The art club is painting a wall picture.', '美术社正在绘制墙画。', '单数主语 club 搭配 is painting。'], ['Are the students waiting outside?', '学生们正在外面等吗？', '疑问句把 are 提前。']], ['遗漏 be 只写 They singing。', '所有动词直接加 -ing，忽略 write→writing。']),
        g('simple-vs-continuous', '一般现在时与现在进行时', '一般现在时描述习惯和事实；现在进行时描述当前动作或临时状态。', ['usually/often/every day → 一般现在时', 'now/look/listen/at the moment → 现在进行时'], [['Leo usually plays the drums, but he is singing today.', '利奥通常打鼓，但今天他在唱歌。', 'usually 对应习惯，today 强调临时变化。'], ['Look! The robot is moving.', '看！机器人正在移动。', 'Look 是当前动作信号。']], ['看到 today 一律使用一般现在时。', '状态动词 know、like 随意使用进行时。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7b-rain-or-shine', number: 6, title: 'Rain or Shine', theme: '天气、气候与活动选择',
      expressions: ["What's the weather like?", 'It is warm and sunny.', 'Take an umbrella because it may rain heavily.'],
      vocabulary: [
        ['weather', '名词', '天气', '不可数名词，询问天气用 What is the weather like?。', '不可数，无复数形式。', ['weather forecast', 'bad weather'], 'The weather changes quickly near the mountains.', '山区附近天气变化很快。', '不能说 a weather 或 weathers。'],
        ['temperature', '名词', '温度；体温', '可数或不可数，询问具体温度用 What is the temperature?。', '复数 temperatures。', ['high temperature', 'body temperature'], 'The temperature will drop below ten degrees tonight.', '今晚温度会降到十度以下。', '温度高低用 high/low。'],
        ['stormy', '形容词', '有暴风雨的；风暴般的', '由 storm + -y 构成，描述天气。', '比较级 stormier；名词 storm。', ['stormy weather', 'stormy night'], 'We cancelled the boat trip because it was stormy.', '因为有暴风雨，我们取消了乘船旅行。', 'storm 是名词，stormy 是形容词。'],
        ['lightning', '名词', '闪电', '通常不可数；lightning flash 可表示一道闪电。', '通常不可数。', ['flash of lightning', 'lightning storm'], 'Lightning lit up the sky for a second.', '闪电瞬间照亮了天空。', 'lightning 是闪电，lightening 是“变轻/变亮”。'],
        ['forecast', '名词/动词', '预报；预测', 'weather forecast 为天气预报，动词过去式可仍为 forecast。', '复数 forecasts；forecast/forecasted。', ['weather forecast', 'forecast rain'], 'The forecast says there will be fog in the morning.', '预报说明早晨会有雾。', 'forecast 后可接名词，也可接从句。'],
        ['heavily', '副词', '大量地；猛烈地', '修饰 rain、snow 等动词，不能用 heavy 直接修饰动词。', '形容词 heavy。', ['rain heavily', 'snow heavily'], 'It is raining heavily, so drive slowly.', '雨下得很大，所以要慢慢开车。', 'heavy rain 中 heavy 修饰名词；rain heavily 中 heavily 修饰动词。'],
        ['climate', '名词', '气候', '指某地区长期天气模式，不等于某一天的 weather。', '复数 climates。', ['warm climate', 'climate change'], 'The island has a warm and wet climate.', '这座岛气候温暖湿润。', 'weather 短期，climate 长期。'],
        ['affect', '动词', '影响', '直接接宾语；effect 通常作名词表示影响或效果。', 'affects；affected；affecting。', ['affect daily life', 'be affected by'], 'Hot weather can affect our sleep.', '炎热天气会影响睡眠。', 'affect 是动词，effect 常是名词。'],
      ],
      grammar: [
        g('weather-it', '天气表达中的 it', '描述天气、温度和时间常用无具体所指的 it 作形式主语。', ['It is + 天气形容词.', 'It is raining/snowing.', 'It will be + 天气形容词.'], [['It is cloudy in the east this morning.', '今天早晨东部多云。', 'it 作天气句主语。'], ['It may be windy after lunch.', '午饭后可能有风。', 'may 后接 be 原形。']], ['省略 it 直接说 Is rainy。', 'rainy 与 raining 同时重复使用。']),
        g('weather-actions', '一般现在时、进行时与天气安排', '常态气候用一般现在时，当前天气用进行时，基于预报的安排可用将来表达。', ['It often rains ...', 'It is raining now.', 'We will/won’t ... if ...'], [['It often snows here in January.', '这里一月经常下雪。', 'often 描述气候规律。'], ['We will stay indoors if the storm continues.', '如果暴风雨持续，我们会待在室内。', 'if 从句用一般现在时表达将来条件。']], ['if 条件从句和主句都机械使用 will。', '描述当前降雨只写 It rains now。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7b-day-to-remember', number: 7, title: 'A Day to Remember', theme: '难忘经历与过去事件',
      expressions: ['What happened yesterday?', 'We visited the museum and saw a special show.', 'It was a day I will always remember.'],
      vocabulary: [
        ['remember', '动词', '记得；想起；纪念', 'remember doing 表示记得做过，remember to do 表示记得要做。', 'remembers；remembered；remembering。', ['remember doing', 'remember to do'], 'I remember meeting the artist after the show.', '我记得演出后见过那位艺术家。', 'doing 与 to do 表示不同时间关系。'],
        ['event', '名词', '事件；活动；比赛项目', '可数名词，可指有组织的活动或重要事情。', '复数 events。', ['special event', 'sports event'], 'The science event attracted many families.', '这次科学活动吸引了许多家庭。', 'event 通常比普通 happening 更正式。'],
        ['suddenly', '副词', '突然地', '用于叙事转折，修饰动作或整句。', '形容词 sudden。', ['suddenly appear', 'suddenly, ...'], 'Suddenly, all the lights went out.', '突然，所有灯都熄灭了。', '句首使用时后面常加逗号。'],
        ['surprise', '名词/动词', '惊喜；意外；使惊讶', 'surprised 描述人的感受，surprising 描述事物。', '复数 surprises；surprised；surprising。', ['to one’s surprise', 'surprise somebody'], 'To our surprise, the lost dog returned home.', '令我们惊讶的是，走失的狗回家了。', '人感到惊讶用 surprised。'],
        ['experience', '名词/动词', '经历；经验；体验', '表示一次经历时可数，表示经验时通常不可数。', '复数 experiences；experienced；experiencing。', ['learning experience', 'have experience in'], 'The trip was a valuable learning experience.', '这次旅行是宝贵的学习经历。', 'experience 表“经验”时不随意加复数。'],
        ['excited', '形容词', '兴奋的；激动的', '描述人的感受；exciting 描述令人兴奋的事物。', '比较级 more excited；动词 excite。', ['feel excited about', 'be excited to do'], 'We were excited to see the final race.', '看到决赛我们很兴奋。', '不要说 The race was excited。'],
        ['unforgettable', '形容词', '难忘的', '由 un- + forget + -able 构成，表示不能忘记的。', '比较级 more unforgettable；动词 forget。', ['unforgettable day', 'unforgettable experience'], 'Helping the injured bird was unforgettable.', '帮助受伤的小鸟是一段难忘的经历。', '拼写中有双写 t：forgettable。'],
        ['happen', '动词', '发生；碰巧', '询问过去事件常用 What happened?。', 'happens；happened；happening。', ['happen yesterday', 'happen to meet'], 'What happened after the bus stopped?', '公交车停下后发生了什么？', 'happen 不使用被动语态。'],
      ],
      grammar: [
        g('simple-past', '一般过去时', '一般过去时描述过去发生并结束的动作或状态；be 用 was/were，实义动词使用过去式。', ['主语 + was/were ...', '主语 + 动词过去式 ...', 'Did + 主语 + 动词原形 ...?'], [['We arrived early and found good seats.', '我们早早到达并找到了好座位。', '并列动作都使用过去式。'], ['Did you take any photos?', '你拍照片了吗？', 'did 后动词恢复原形 take。']], ['did 后仍写 took。', 'was/were 与实义动词过去式无连接词堆在一起。']),
        g('past-sequence', '过去时间标志与叙事顺序', 'yesterday、last、ago 定位过去；first、then、after that、finally 组织事件顺序。', ['last + 时间', '时间段 + ago', 'First ... Then ... Finally ...'], [['Two days ago, our class visited a farm.', '两天前，我们班参观了农场。', 'ago 从现在向前计算。'], ['First we checked the map; then we chose a path.', '我们先查看地图，然后选择路线。', '顺序词使叙述清楚。']], ['ago 与 before 随意互换。', '叙述过去时部分谓语突然变回一般现在时。']),
      ],
    }),
    unit({
      id: 'eng-unit-g7b-once-upon-a-time', number: 8, title: 'Once upon a Time', theme: '故事、人物与寓意',
      expressions: ['Once upon a time, there lived a brave girl.', 'As soon as she opened the door, the bird flew out.', 'In the end, they understood the lesson.'],
      vocabulary: [
        ['once', '副词/连词', '曾经；一次；一旦', 'once upon a time 是故事常用开头；once 也可表示一次。', '通常不变化。', ['once upon a time', 'once a week'], 'Once upon a time, a young farmer lived by the river.', '从前，一位年轻农夫住在河边。', '根据语境区分“曾经”和“一次”。'],
        ['character', '名词', '人物；性格；字符', '故事语境指人物，也可表示人的品质。', '复数 characters。', ['main character', 'strong character'], 'The main character learns to listen to others.', '主人公学会了倾听他人。', 'character 不等同于 actor，后者是演员。'],
        ['brave', '形容词', '勇敢的', '可描述面对危险或困难时的品质。', '比较级 braver；名词 bravery。', ['brave enough to', 'brave choice'], 'The boy was brave enough to tell the truth.', '这个男孩足够勇敢，说出了真相。', 'bravery 是名词，不是 braveness 的常用首选。'],
        ['magic', '名词/形容词', '魔法；有魔力的', 'magical 也作形容词，强调神奇体验。', '形容词 magical；名词 magician。', ['magic power', 'magic trick'], 'The old key opened a magic door.', '那把旧钥匙打开了一扇魔法门。', 'magic 可直接作定语；magical 更常描述感受或特质。'],
        ['journey', '名词', '旅程；历程', '可数名词，强调从一地到另一地的过程。', '复数 journeys。', ['long journey', 'begin a journey'], 'Their journey became more difficult after the storm.', '暴风雨后，他们的旅程变得更加艰难。', '复数是 journeys，不把 y 变为 i。'],
        ['decide', '动词', '决定', 'decide to do；decide on sth.；名词 decision。', 'decides；decided；deciding。', ['decide to do', 'make a decision'], 'The traveller decided to share his food.', '旅行者决定分享食物。', 'decide 后常接 to do，不接 doing。'],
        ['finally', '副词', '最后；终于', '可表示事件顺序的最后，也可表示经过等待后终于发生。', '形容词 final。', ['finally reach', 'and finally'], 'Finally, the two friends found their way home.', '最后，两个朋友找到了回家的路。', 'finally 强调终点；at last 情感色彩更强。'],
        ['moral', '名词/形容词', '寓意；道德的', 'the moral of the story 表示故事寓意。', '复数 morals；副词 morally。', ['story moral', 'moral lesson'], 'The moral of the story is to keep your promise.', '故事的寓意是要信守承诺。', '作“寓意”时是可数名词。'],
      ],
      grammar: [
        g('narrative-past', '故事中的一般过去时', '故事通常建立在过去时间框架中，动作链使用过去式，背景状态使用 was/were。', ['Once ... lived/was ...', '主语 + 过去式 + and/but + 过去式', 'Did ...?'], [['A fox saw the grapes but could not reach them.', '一只狐狸看见葡萄，却够不着。', '动作 saw 与情态过去式 could 位于同一过去框架。'], ['The road was dark, so the traveller stopped.', '道路很黑，因此旅行者停下了。', 'was 描述背景，stopped 描述动作。']], ['故事中时态频繁无理由切换。', 'could 后使用 reached。']),
        g('story-connectors', '故事连接词和时间从句', 'when、while、as soon as 连接动作；because、so 表因果；although/but 表转折时避免重复。', ['when + 一般过去时', 'as soon as + 一般过去时', 'because + 原因；so + 结果'], [['As soon as the rain stopped, they left the cave.', '雨一停，他们就离开了山洞。', 'as soon as 强调紧接发生。'], ['The girl helped the wolf because it was hurt.', '女孩帮助了那只狼，因为它受伤了。', 'because 引出原因。']], ['because 与 so 重复连接同一组分句。', 'although 与 but 同时出现。']),
      ],
    }),
  ],
});

module.exports = [grade7Upper, grade7Lower];
