function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function collectObservations(knowledgeItems) {
  const records = new Map();
  const owners = new Map();
  const issues = [];

  (knowledgeItems || []).forEach((knowledge) => {
    const observation = knowledge.safetyObservation;
    if (!observation) return;

    const id = observation.id;
    if (typeof id !== 'string' || !id.trim()) {
      issues.push(`${knowledge.id || 'unknown'}: 观察记录缺少稳定 id`);
      return;
    }

    const observationOwners = owners.get(id) || [];
    observationOwners.push(knowledge.id);
    owners.set(id, observationOwners);
    if (!records.has(id)) records.set(id, observation);
  });

  return { records, owners, issues };
}

function compareObservationLayer(source, layer) {
  const label = layer.label || '未知层';
  const runtime = collectObservations(layer.knowledgeItems);
  const issues = runtime.issues.map((issue) => `${label}运行时生物观察：${issue}`);

  runtime.owners.forEach((owners, id) => {
    if (owners.length !== 1) {
      issues.push(`${label}运行时生物观察 ${id} 被 ${owners.length} 个知识点重复拥有`);
    }
  });

  source.records.forEach((sourceObservation, id) => {
    const sourceOwners = source.owners.get(id) || [];
    const runtimeOwners = runtime.owners.get(id) || [];
    if (runtimeOwners.length === 0) {
      issues.push(`${label}运行时生物观察缺失 ${id}`);
      return;
    }
    if (sourceOwners[0] !== runtimeOwners[0]) {
      issues.push(`${label}运行时生物观察归属不一致 ${id}`);
    }
    if (!sameValue(sourceObservation, runtime.records.get(id))) {
      issues.push(`${label}运行时生物观察字段与源数据不一致 ${id} (${sourceOwners[0] || 'unknown'})`);
    }
  });

  runtime.records.forEach((runtimeObservation, id) => {
    if (!source.records.has(id)) {
      issues.push(`${label}运行时生物观察出现未登记记录 ${id}`);
    }
  });

  return issues;
}

function compareReferenceEntries(source, referenceEntries) {
  const issues = [];
  const records = new Map();
  const entries = (referenceEntries || []).filter((entry) => entry.subjectId === 'biology');

  entries.forEach((entry) => {
    const id = entry.focusId;
    if (typeof id !== 'string' || !id.trim()) {
      issues.push('参考索引观察记录缺少 focusId');
      return;
    }
    if (records.has(id)) {
      issues.push(`参考索引观察记录重复 ${id}`);
    } else {
      records.set(id, entry);
    }
  });

  source.records.forEach((observation, id) => {
    const entry = records.get(id);
    const owner = source.owners.get(id) || [];
    if (!entry) {
      issues.push(`参考索引观察记录缺失 ${id}`);
      return;
    }
    if (entry.kind !== 'experiment' || entry.refId !== owner[0]) {
      issues.push(`参考索引观察记录归属不一致 ${id}`);
    }
    if (entry.key !== `biology:experiment:${id}`) {
      issues.push(`参考索引观察记录键不一致 ${id}`);
    }
  });

  records.forEach((entry, id) => {
    if (!source.records.has(id)) {
      issues.push(`参考索引观察记录出现未登记记录 ${id}`);
    }
  });

  return issues;
}

function collectBiologyObservationContractIssues({
  sourceKnowledgeItems,
  runtimeLayers,
  referenceEntries,
} = {}) {
  const source = collectObservations(sourceKnowledgeItems);
  const issues = source.issues.map((issue) => `源数据生物观察：${issue}`);

  source.owners.forEach((owners, id) => {
    if (owners.length !== 1) {
      issues.push(`源数据生物观察 ${id} 被 ${owners.length} 个知识点重复拥有`);
    }
  });

  (runtimeLayers || []).forEach((layer) => {
    issues.push(...compareObservationLayer(source, layer));
  });

  if (Array.isArray(referenceEntries)) {
    issues.push(...compareReferenceEntries(source, referenceEntries));
  }

  return issues;
}

module.exports = {
  collectBiologyObservationContractIssues,
};
