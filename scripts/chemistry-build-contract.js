const SECTION_CONTRACTS = [
  { type: 'equation', idField: 'equationId', label: '方程式' },
  { type: 'experiment', idField: 'experimentId', label: '实验' },
];

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function collectSections(knowledgeItems, type, idField) {
  const records = new Map();
  const owners = new Map();
  const issues = [];

  (knowledgeItems || []).forEach((knowledge) => {
    (knowledge.sections || [])
      .filter((section) => section.type === type)
      .forEach((section) => {
        const id = section[idField];
        if (typeof id !== 'string' || !id.trim()) {
          issues.push(`${knowledge.id || 'unknown'}: ${type} 缺少 ${idField}`);
          return;
        }

        const sectionOwners = owners.get(id) || [];
        sectionOwners.push(knowledge.id);
        owners.set(id, sectionOwners);
        if (!records.has(id)) records.set(id, section);
      });
  });

  return { records, owners, issues };
}

function compareSectionContract({
  type,
  idField,
  label,
  sourceKnowledgeItems,
  runtimeKnowledgeItems,
  sourceSections,
  runtimeSections,
}) {
  const issues = [];
  const source = collectSections(sourceKnowledgeItems, type, idField);
  const runtime = collectSections(runtimeKnowledgeItems, type, idField);
  issues.push(...source.issues.map((issue) => `源数据${label}：${issue}`));
  issues.push(...runtime.issues.map((issue) => `运行时${label}：${issue}`));

  source.owners.forEach((owners, id) => {
    if (owners.length !== 1) {
      issues.push(`源数据${label} ${id} 被 ${owners.length} 个知识点重复拥有`);
    }
  });
  runtime.owners.forEach((owners, id) => {
    if (owners.length !== 1) {
      issues.push(`运行时${label} ${id} 被 ${owners.length} 个知识点重复拥有`);
    }
  });

  source.records.forEach((sourceSection, id) => {
    const sourceOwner = source.owners.get(id) || [];
    const runtimeOwner = runtime.owners.get(id) || [];
    if (runtimeOwner.length === 0) {
      issues.push(`${label}运行时缺失 ${id}`);
      return;
    }

    const runtimeSection = runtime.records.get(id);
    if (!sameValue(sourceSection, runtimeSection)) {
      issues.push(`${label}运行时字段与源数据不一致 ${id} (${sourceOwner[0] || 'unknown'})`);
    }
  });

  runtime.records.forEach((runtimeSection, id) => {
    if (!source.records.has(id)) {
      issues.push(`${label}运行时出现未登记记录 ${id}`);
    }
  });

  const sourceAggregate = new Map();
  (sourceSections || []).forEach((section) => {
    const id = section[idField];
    if (sourceAggregate.has(id)) {
      issues.push(`源数据聚合${label}重复 ${id}`);
    } else {
      sourceAggregate.set(id, section);
    }
  });

  const runtimeAggregate = new Map();
  (runtimeSections || []).forEach((section) => {
    const id = section[idField];
    if (runtimeAggregate.has(id)) {
      issues.push(`运行时聚合${label}重复 ${id}`);
    } else {
      runtimeAggregate.set(id, section);
    }
  });

  sourceAggregate.forEach((sourceSection, id) => {
    if (!runtimeAggregate.has(id)) {
      issues.push(`运行时聚合${label}缺失 ${id}`);
      return;
    }
    if (!sameValue(sourceSection, runtimeAggregate.get(id))) {
      issues.push(`运行时聚合${label}字段与源数据不一致 ${id}`);
    }
  });
  runtimeAggregate.forEach((runtimeSection, id) => {
    if (!sourceAggregate.has(id)) {
      issues.push(`运行时聚合${label}出现未登记记录 ${id}`);
    }
  });

  return issues;
}

function collectChemistryBuildContractIssues({
  sourceKnowledgeItems,
  runtimeKnowledgeItems,
  sourceEquations,
  runtimeEquations,
  sourceExperiments,
  runtimeExperiments,
} = {}) {
  const issues = [];
  const values = {
    equation: { sourceSections: sourceEquations, runtimeSections: runtimeEquations },
    experiment: { sourceSections: sourceExperiments, runtimeSections: runtimeExperiments },
  };

  SECTION_CONTRACTS.forEach((contract) => {
    issues.push(...compareSectionContract({
      ...contract,
      sourceKnowledgeItems,
      runtimeKnowledgeItems,
      ...values[contract.type],
    }));
  });

  return issues;
}

module.exports = {
  collectChemistryBuildContractIssues,
};
