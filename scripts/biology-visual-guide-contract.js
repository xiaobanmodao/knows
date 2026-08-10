const GUIDE_TYPES = new Set(['flow', 'cycle', 'compare', 'hierarchy']);
const GUIDE_TONES = new Set(['green', 'blue', 'amber', 'slate']);
const GUIDE_LANES = new Set(['left', 'right']);
const FORBIDDEN_CONTENT = /(?:https?:\/\/|www\.|<[^>]+>)/i;
const TEXT_LIMITS = Object.freeze({
  title: 24,
  summary: 72,
  label: 32,
  note: 96,
});
const FINAL_TO_FIRST_CAUSALITY = /(?:最后(?:一个)?(?:环节|节点|步骤|阶段)?|最终(?:阶段|环节|节点|步骤)?|终末(?:阶段|环节|节点|步骤)?|末尾|终点)[^。！？；]{0,48}(?:直接)?(?:导致|引起|造成|使得|使|促使)[^。！？；]{0,48}(?:第?(?:一|1)个?(?:环节|节点|步骤|阶段)?|起点)/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateText(value, label, maximumLength, issues, knowledgeId) {
  if (!isNonEmptyString(value)) {
    issues.push(`${knowledgeId}: 图解${label}缺失`);
    return;
  }
  if (value.trim().length > maximumLength) {
    issues.push(`${knowledgeId}: 图解${label}长度超出 ${maximumLength} 字符`);
  }
  if (FORBIDDEN_CONTENT.test(value)) {
    issues.push(`${knowledgeId}: 图解${label}包含 URL 或 HTML`);
  }
}

function validateSourceGuides(sourceKnowledgeItems) {
  const issues = [];

  (Array.isArray(sourceKnowledgeItems) ? sourceKnowledgeItems : []).forEach((knowledge, index) => {
    const knowledgeId = isNonEmptyString(knowledge && knowledge.id) ? knowledge.id : `unknown-${index}`;
    const guide = knowledge && knowledge.visualGuide;

    if (!guide || typeof guide !== 'object' || Array.isArray(guide)) {
      issues.push(`${knowledgeId}: 缺少图解`);
      return;
    }

    if (!GUIDE_TYPES.has(guide.type)) {
      issues.push(`${knowledgeId}: 图解类型不合法`);
    }
    validateText(guide.title, '标题', TEXT_LIMITS.title, issues, knowledgeId);
    validateText(guide.summary, '摘要', TEXT_LIMITS.summary, issues, knowledgeId);

    if (!Array.isArray(guide.items) || guide.items.length < 2 || guide.items.length > 5) {
      issues.push(`${knowledgeId}: 图解节点数量必须为 2 至 5 个`);
      return;
    }

    const labels = new Set();
    let hasLeftLane = false;
    let hasRightLane = false;
    guide.items.forEach((item, itemIndex) => {
      const itemLabel = `节点 ${itemIndex + 1}`;
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        issues.push(`${knowledgeId}: ${itemLabel}无效`);
        return;
      }

      validateText(item.label, `${itemLabel}标签`, TEXT_LIMITS.label, issues, knowledgeId);
      if (isNonEmptyString(item.label) && labels.has(item.label)) {
        issues.push(`${knowledgeId}: 图解标签重复 ${item.label}`);
      } else if (isNonEmptyString(item.label)) {
        labels.add(item.label);
      }
      validateText(item.note, `${itemLabel}说明`, TEXT_LIMITS.note, issues, knowledgeId);

      if (!GUIDE_TONES.has(item.tone)) {
        issues.push(`${knowledgeId}: ${itemLabel}色调不合法`);
      }

      if (guide.type === 'compare') {
        if (!GUIDE_LANES.has(item.lane)) {
          issues.push(`${knowledgeId}: compare 图解${itemLabel}缺少合法 lane`);
        } else if (item.lane === 'left') {
          hasLeftLane = true;
        } else {
          hasRightLane = true;
        }
      } else if (Object.prototype.hasOwnProperty.call(item, 'lane')) {
        issues.push(`${knowledgeId}: ${guide.type} 图解${itemLabel}不得包含 lane`);
      }

      if (guide.type === 'hierarchy') {
        if (!Number.isInteger(item.depth) || item.depth < 0 || item.depth > 2) {
          issues.push(`${knowledgeId}: hierarchy 图解${itemLabel} depth 类型不合法`);
        }
      } else if (Object.prototype.hasOwnProperty.call(item, 'depth')) {
        issues.push(`${knowledgeId}: ${guide.type} 图解${itemLabel}不得包含 depth`);
      }
    });

    if (guide.type === 'compare' && !hasLeftLane) {
      issues.push(`${knowledgeId}: compare 图解缺少左侧 lane`);
    }
    if (guide.type === 'compare' && !hasRightLane) {
      issues.push(`${knowledgeId}: compare 图解缺少右侧 lane`);
    }
    if (guide.type === 'cycle') {
      const cycleText = [guide.title, guide.summary]
        .concat(guide.items.flatMap((item) => (item && typeof item === 'object' ? [item.label, item.note] : [])))
        .filter(isNonEmptyString)
        .join(' ');
      if (FINAL_TO_FIRST_CAUSALITY.test(cycleText)) {
        issues.push(`${knowledgeId}: cycle 图解不得声明末尾节点直接导致起点`);
      }
    }
  });

  return issues;
}

function collectGuideRecords(knowledgeItems, layerLabel) {
  const records = new Map();
  const issues = [];

  (Array.isArray(knowledgeItems) ? knowledgeItems : []).forEach((knowledge, index) => {
    const id = knowledge && knowledge.id;
    const guide = knowledge && knowledge.visualGuide;
    if (!isNonEmptyString(id)) {
      if (guide) issues.push(`${layerLabel}图解归属不一致：知识点缺少 ID (${index})`);
      return;
    }
    if (records.has(id)) {
      issues.push(`${layerLabel}图解归属不一致：知识点 ID 重复 ${id}`);
      return;
    }
    if (guide) records.set(id, guide);
  });

  return { records, issues };
}

function compareRuntimeGuideLayer(sourceKnowledgeItems, layer) {
  const issues = [];
  const source = collectGuideRecords(sourceKnowledgeItems, '源数据');
  const runtime = collectGuideRecords(layer && layer.knowledgeItems, `运行时${layer && layer.label ? layer.label : ''}`);
  issues.push(...runtime.issues);

  source.records.forEach((sourceGuide, id) => {
    if (!runtime.records.has(id)) {
      issues.push(`图解运行时缺失 ${id}`);
      return;
    }
    if (JSON.stringify(sourceGuide) !== JSON.stringify(runtime.records.get(id))) {
      issues.push(`图解运行时字段与源数据不一致 ${id}`);
    }
  });

  runtime.records.forEach((runtimeGuide, id) => {
    if (!source.records.has(id)) {
      issues.push(`图解运行时出现未登记记录 ${id}`);
    }
    if (runtimeGuide && isNonEmptyString(runtimeGuide.knowledgeId) && runtimeGuide.knowledgeId !== id) {
      issues.push(`图解运行时归属不一致 ${id}`);
    }
  });

  return issues;
}

function collectBiologyVisualGuideIssues({ sourceKnowledgeItems = [], runtimeLayers = [] } = {}) {
  const issues = validateSourceGuides(sourceKnowledgeItems);
  (Array.isArray(runtimeLayers) ? runtimeLayers : []).forEach((layer) => {
    issues.push(...compareRuntimeGuideLayer(sourceKnowledgeItems, layer));
  });
  return issues;
}

module.exports = {
  collectBiologyVisualGuideIssues,
};
