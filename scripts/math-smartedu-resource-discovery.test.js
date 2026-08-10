const assert = require('assert');

const {
  buildReport,
  checkReport,
  discoverCandidates,
  EXPECTED_CANDIDATE_KEYS,
} = require('./math-smartedu-resource-discovery');

const evidence = {
  sourceId: 'smartedu-math-textbook-catalog-2026',
  retrieval: {
    resourceParts: [
      'https://bdcs-file-1.ykt.cbern.com.cn/zxx_secondary/ndrs/resources/tch_material/part_100.json',
      'https://bdcs-file-1.ykt.cbern.com.cn/zxx_secondary/ndrs/resources/tch_material/part_101.json',
      'https://bdcs-file-1.ykt.cbern.com.cn/zxx_secondary/ndrs/resources/tch_material/part_102.json',
      'https://bdcs-file-1.ykt.cbern.com.cn/zxx_secondary/ndrs/resources/tch_material/part_103.json',
    ],
  },
  resourceRecords: [
    { grade: '八年级', volume: '上册', resourceId: 'g8u' },
    { grade: '八年级', volume: '下册', resourceId: 'g8d' },
    { grade: '九年级', volume: '上册', resourceId: 'g9u' },
    { grade: '九年级', volume: '下册', resourceId: 'g9d' },
  ],
};

function tags(...tagNames) {
  return tagNames.map((tag_name) => ({ tag_name }));
}

const candidates = discoverCandidates([
  [{
    id: 'g8u',
    title: '义务教育教科书·数学八年级上册',
    label: ['zxx', '义务教育教科书 数学 八年级 上册'],
    tag_list: tags('人教版', '初中', '数学', '八年级', '上册'),
    create_time: '2022-09-29T19:09:46.705+0800',
    update_time: '2024-08-31T17:46:06.094+0800',
    online_time: '2023-07-04T18:34:21.320+0800',
  }, {
    id: 'g8d',
    title: '义务教育教科书·数学八年级下册',
    label: ['zxx', '义务教育教科书 数学 八年级 下册'],
    tag_list: tags('人教版', '初中', '数学', '八年级', '下册'),
    create_time: '2022-09-29T19:09:48.583+0800',
    update_time: '2025-01-26T12:41:31.077+0800',
    online_time: '2022-09-29T19:09:48.613+0800',
  }],
  [{
    id: 'g9u',
    title: '义务教育教科书·数学九年级上册',
    label: ['zxx', '义务教育教科书 数学 九年级 上册'],
    tag_list: tags('人教版', '初中', '数学', '九年级', '上册'),
    create_time: '2022-09-29T19:09:50.789+0800',
    update_time: '2024-08-31T17:46:39.807+0800',
    online_time: '2023-07-04T18:29:01.932+0800',
  }, {
    id: 'g9d',
    title: '义务教育教科书·数学九年级下册',
    label: ['zxx', '义务教育教科书 数学 九年级 下册'],
    tag_list: tags('人教版', '初中', '数学', '九年级', '下册'),
    create_time: '2022-09-29T19:09:52.502+0800',
    update_time: '2025-01-26T12:42:14.545+0800',
    online_time: '2022-09-29T19:09:52.534+0800',
  }],
  [{
    id: 'five-four',
    title: '义务教育教科书（五•四学制）·数学八年级上册',
    label: ['zxx', '初中数学（五四学制）八年级上册'],
    tag_list: tags('人教版', '数学', '八年级', '上册', '初中（五•四学制）'),
  }],
  [{
    id: 'other-subject',
    title: '义务教育教科书·物理八年级上册',
    label: ['zxx', '物理'],
    tag_list: tags('人教版', '初中', '物理', '八年级', '上册'),
  }],
]);

assert.deepStrictEqual(candidates.map((item) => item.key), EXPECTED_CANDIDATE_KEYS);
assert.deepStrictEqual(candidates.map((item) => item.id), ['g8u', 'g8d', 'g9u', 'g9d']);

const report = buildReport(evidence, candidates, '2026-08-10T11:00:00.000Z');
assert.strictEqual(checkReport(evidence, report), true);
assert.strictEqual(report.candidateCount, 4);
assert.strictEqual(report.result, 'no-additional-normal-school-candidates');

assert.throws(
  () => checkReport(evidence, { ...report, candidateCount: 3 }),
  /candidateCount|候选/,
);
assert.throws(
  () => checkReport(evidence, { ...report, candidateIds: ['g8u', 'g8d', 'g9u', 'other'] }),
  /candidateIds|候选|resourceId/,
);
assert.throws(
  () => checkReport(evidence, { ...report, scannedResourceParts: ['https://example.com/part.json'] }),
  /resourceParts|分片/,
);
assert.throws(
  () => checkReport({
    ...evidence,
    retrieval: { resourceParts: ['https://example.com/part.json'] },
  }, {
    ...report,
    scannedResourceParts: ['https://example.com/part.json'],
  }),
  /官方平台|SmartEdu/,
);

console.log('OK math SmartEdu resource discovery contract: 4 normal-school candidates checked');
