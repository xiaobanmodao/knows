const ENGLISH_CURRICULUM_BASELINE = {
  schemaVersion: 1,
  baselineVersion: 'pep-english-2025-junior-high',
  sources: [
    {
      id: 'moe-english-curriculum-2022',
      title: '义务教育英语课程标准（2022年版）',
      url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
      role: '英语课程范围与学段边界',
    },
    {
      id: 'moe-textbook-catalog-2024',
      title: '2024年义务教育国家课程教学用书目录（根据2022年版课程标准修订）',
      url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202408/W020240805496325238752.pdf',
      role: '教材版本与册次范围',
    },
    {
      id: 'pep-english-new-textbook-2025',
      title: '人教版义务教育英语（七至九年级）新教材介绍',
      url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html',
      role: '全套册数、正式单元数和选学戏剧结构',
    },
    {
      id: 'pep-english-digital-resources-2025',
      title: '义务教育教科书英语教材数字配套资源',
      url: 'https://www.pep.com.cn/zslth/yyptzy/',
      role: '人教社公开配套资源入口核对；当前未提供九下具体单元标题',
    },
  ],
  structure: {
    bookCount: 6,
    formalUnitCount: 44,
    books: [
      { bookId: 'eng-book-g7a-2024', formalUnitCount: 7, starterUnitCount: 3, optionalDramaCount: 0 },
      { bookId: 'eng-book-g7b-2024', formalUnitCount: 8, starterUnitCount: 0, optionalDramaCount: 0 },
      { bookId: 'eng-book-g8a-2024', formalUnitCount: 8, starterUnitCount: 0, optionalDramaCount: 0 },
      { bookId: 'eng-book-g8b-2024', formalUnitCount: 8, starterUnitCount: 0, optionalDramaCount: 0 },
      { bookId: 'eng-book-g9a-2025', formalUnitCount: 8, starterUnitCount: 0, optionalDramaCount: 0 },
      { bookId: 'eng-book-g9b-pending', formalUnitCount: 5, starterUnitCount: 0, optionalDramaCount: 2 },
    ],
  },
  pendingMappings: [
    {
      bookId: 'eng-book-g9b-pending',
      mappingStatus: 'structure-confirmed-titles-pending',
      officialFormalUnitCount: 5,
      optionalDramaCount: 2,
      officialUnitTitles: null,
      sourceIds: ['moe-english-curriculum-2022', 'moe-textbook-catalog-2024', 'pep-english-new-textbook-2025', 'pep-english-digital-resources-2025'],
      reviewedAt: '2026-08-10',
      notes: '已确认九年级下册的正式单元数量和选学戏剧数量；人教社公开配套资源入口当前列至九年级上册，仍未提供九下具体标题；完整单元标题核对前不创建空单元、不猜测标题。',
    },
  ],
};

module.exports = {
  ENGLISH_CURRICULUM_BASELINE,
};
