function sameKeys(left, right) {
  return JSON.stringify((left || []).map((item) => item.key)) === JSON.stringify((right || []).map((item) => item.key));
}

function sameQuantityShape(left, right) {
  return JSON.stringify(left || []) === JSON.stringify(right || []);
}

function collectPhysicsFormulaContractIssues(knowledgeItems) {
  const issues = [];

  (knowledgeItems || []).forEach((knowledge) => {
    const owner = `${knowledge.id}/${knowledge.title}`;
    const detail = knowledge.physicsDetail;
    const formula = (knowledge.sections || []).find((section) => section.type === 'formula');

    if (!detail || !formula) {
      issues.push(`${owner}: 公式区块或物理详情缺失`);
      return;
    }

    const formulaDetails = formula.formulaDetails || [];
    const formulaDetail = formulaDetails[0];
    if (formulaDetails.length !== 1 || !formulaDetail) {
      issues.push(`${owner}: 公式区块必须只有一条公式详情`);
      return;
    }

    if (!sameKeys(detail.quantities, formula.quantities)) {
      issues.push(`${owner}: 公式区块物理量顺序与详情不一致`);
    }
    if (!sameKeys(detail.quantities, formulaDetail.variables)) {
      issues.push(`${owner}: 公式变量与详情物理量不一致`);
    }
    if (!sameQuantityShape(detail.quantities, formula.quantities)) {
      issues.push(`${owner}: 公式区块物理量字段与详情不一致`);
    }
    if (!sameQuantityShape(detail.quantities, formulaDetail.variables)) {
      issues.push(`${owner}: 公式变量字段与详情不一致`);
    }
    if (formula.formula !== formulaDetail.expression) {
      issues.push(`${owner}: 公式表达式与公式详情不一致`);
    }
    if (JSON.stringify(detail.conditions || []) !== JSON.stringify(formula.conditions || [])) {
      issues.push(`${owner}: 公式适用条件与详情不一致`);
    }
    if (JSON.stringify(detail.directionRules || []) !== JSON.stringify(formula.directionRules || [])) {
      issues.push(`${owner}: 公式方向规则与详情不一致`);
    }
    if (detail.unitNote !== formula.unitNote || detail.unitNote !== formulaDetail.unitNote) {
      issues.push(`${owner}: 公式单位说明与详情不一致`);
    }
  });

  return issues;
}

module.exports = {
  collectPhysicsFormulaContractIssues,
};
