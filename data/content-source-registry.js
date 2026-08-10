const OFFICIAL_HOSTS = new Set(['www.moe.gov.cn', 'moe.gov.cn', 'www.pep.com.cn', 'pep.com.cn']);
const REFERENCE_HOSTS = new Set([
  'dictionary.cambridge.org',
  'www.oxfordlearnersdictionaries.com',
  'learnenglish.britishcouncil.org',
]);

const SOURCE_DEFINITIONS = {
  'moe-biology-curriculum-2022': {
    title: '义务教育生物学课程标准（2022年版）',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582359998122.pdf',
    kind: 'official',
  },
  'pep-compulsory-biology-textbook': {
    title: '人教版义务教育生物学（七至八年级）新教材介绍',
    url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202409/t20240914_1995532.html',
    kind: 'official',
  },
  'moe-chemistry-2022': {
    title: '义务教育化学课程标准（2022年版）',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
    kind: 'official',
  },
  'moe-textbook-catalog-2024': {
    title: '2024年义务教育国家课程教学用书目录（根据2022年版课程标准修订）',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202408/W020250418502592948423.pdf',
    kind: 'official',
  },
  'pep-chemistry-training-2024': {
    title: '人教版义务教育化学新教材培训通知',
    url: 'https://www.pep.com.cn/rjdt/rjdt/202405/t20240517_1992181.shtml',
    kind: 'official',
  },
  'moe-math-curriculum-2022': {
    title: '义务教育数学课程标准（2022年版）',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582346895190.pdf',
    kind: 'official',
  },
  'pep-math-current-catalog': {
    title: '数学稳定目录当前核对记录（不等同于新版逐册目录）',
    url: null,
    kind: 'internal',
  },
  'pep-math-new-textbook-2024': {
    title: '人教版义务教育数学（七至九年级）新教材介绍',
    url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202408/t20240826_1994351.html',
    kind: 'official',
  },
  'original-derivation-review': {
    title: '项目原创推导与内部复核记录',
    url: null,
    kind: 'internal',
  },
  'moe-physics-2022': {
    title: '义务教育物理课程标准（2022年版）',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
    kind: 'official',
  },
  'moe-physics-experiments': {
    title: '物理实验步骤、误差与安全内部复核记录',
    url: null,
    kind: 'internal',
  },
  'pep-physics-public': {
    title: '人教版初中物理新教材介绍',
    url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202409/t20240925_1995627.html',
    kind: 'official',
  },
  'cambridge-dictionary': {
    title: 'Cambridge Dictionary pronunciation and usage',
    url: 'https://dictionary.cambridge.org/pronunciation/',
    kind: 'reference',
  },
  'oxford-learners-dictionaries': {
    title: "Oxford Learner's Dictionaries pronunciation and usage",
    url: 'https://www.oxfordlearnersdictionaries.com/about/english/pronunciation_english.html',
    kind: 'reference',
  },
  'cambridge-grammar': {
    title: 'Cambridge Dictionary: English Grammar Today',
    url: 'https://dictionary.cambridge.org/grammar/british-grammar/',
    kind: 'reference',
  },
  'british-council-grammar': {
    title: 'British Council LearnEnglish Grammar',
    url: 'https://learnenglish.britishcouncil.org/grammar',
    kind: 'reference',
  },
  'moe-english-curriculum-2022': {
    title: '义务教育英语课程标准（2022年版）',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
    kind: 'official',
  },
  'pep-english-new-textbook-2025': {
    title: '人教版义务教育英语（七至九年级）新教材介绍',
    url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html',
    kind: 'official',
  },
  'pep-english-digital-resources-2025': {
    title: '义务教育教科书英语教材数字配套资源',
    url: 'https://www.pep.com.cn/zslth/yyptzy/',
    kind: 'official',
  },
};

const CONTENT_SOURCE_REGISTRY = Object.freeze(
  Object.fromEntries(Object.entries(SOURCE_DEFINITIONS).map(([key, source]) => [key, Object.freeze({ key, ...source })])),
);

function getContentSource(key) {
  return CONTENT_SOURCE_REGISTRY[key] || null;
}

function getContentSourceKeys() {
  return Object.keys(CONTENT_SOURCE_REGISTRY).sort();
}

function isAllowedContentSourceUrl(source, url) {
  if (!source || !url) return false;
  const hostname = new URL(url).hostname;
  const allowedHosts = source.kind === 'official' ? OFFICIAL_HOSTS : REFERENCE_HOSTS;
  return allowedHosts.has(hostname);
}

function checkContentSourceRegistry() {
  const keys = getContentSourceKeys();
  if (!keys.length) throw new Error('内容来源注册表不能为空');
  keys.forEach((key) => {
    const source = CONTENT_SOURCE_REGISTRY[key];
    if (source.key !== key || !source.title || !['official', 'reference', 'internal'].includes(source.kind)) {
      throw new Error(`内容来源注册表条目不完整：${key}`);
    }
    if (source.kind === 'internal') {
      if (source.url !== null) throw new Error(`内部来源不得声明 URL：${key}`);
      return;
    }
    if (typeof source.url !== 'string' || !source.url.startsWith('https://')) {
      throw new Error(`外部来源 URL 无效：${key}`);
    }
    if (!isAllowedContentSourceUrl(source, source.url)) {
      const hostname = new URL(source.url).hostname;
      throw new Error(`来源域名与来源类型不匹配：${key}/${hostname}`);
    }
  });
  return true;
}

module.exports = {
  CONTENT_SOURCE_REGISTRY,
  getContentSource,
  getContentSourceKeys,
  isAllowedContentSourceUrl,
  checkContentSourceRegistry,
};
