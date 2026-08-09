const { buildTemplate } = require('./biology-builders');

function defineTemplate(id, title, topicIds, category, summary, steps, pitfalls) {
  return buildTemplate({
    id,
    title,
    name: title,
    topicIds,
    category,
    summary,
    steps: steps.map((action, index) => ({ order: index + 1, action })),
    pitfalls,
    figure: `/assets/figures/generated/biology/templates/${id}.png`,
  });
}

const templates = [
  defineTemplate('bio-tpl-evidence-chain', '生命现象的证据链', ['bio-unit-cells'], '科学观察', '把可见事实、比较依据和暂时解释分开，避免由单一现象直接下结论。', ['明确观察对象和条件。', '记录可直接看到或测到的事实。', '与对照或已有证据比较。', '说明结论的适用范围。'], ['把猜测当作观察结果。', '遗漏观察条件。']),
  defineTemplate('bio-tpl-feature-comparison', '生物特征比较表', ['bio-unit-diversity'], '分类比较', '用共同特征和差异特征建立清晰的比较维度，再形成分类判断。', ['确定比较对象。', '选择稳定而可观察的特征。', '逐项记录相同点和不同点。', '依据多个特征说明分类理由。'], ['只凭一种表面特征分类。', '把生活环境当作唯一分类依据。']),
  defineTemplate('bio-tpl-variable-observation', '植物条件观察记录', ['bio-unit-plants'], '条件观察', '用一致材料和可追溯条件比较植物生命活动，结论只覆盖实际观察范围。', ['提出可观察的问题。', '保持其余条件一致。', '按相同时间点记录变化。', '比较记录并说明证据边界。'], ['同时改变多个条件。', '把一次偶然观察推广为普遍规律。']),
  defineTemplate('bio-tpl-system-link', '人体系统协作图', ['bio-unit-health'], '系统联系', '用物质进入、运输、交换、排出和调节的线索连接人体系统。', ['确定生命活动的起点。', '标出参与的器官或系统。', '说明物质或信息的去向。', '检查各环节是否能连成闭环。'], ['把器官功能彼此孤立。', '混淆物质运输和信息调节。']),
  defineTemplate('bio-tpl-ecosystem-map', '生态关系图', ['bio-unit-environment'], '生态分析', '从非生物成分、生物成分和能量流动建立生态系统的关系图。', ['列出环境条件。', '识别生产者、消费者和分解者。', '用箭头表示取食或物质关系。', '说明干扰可能影响的环节。'], ['把箭头方向画成能量来源的反向。', '遗漏分解者的作用。']),
  defineTemplate('bio-tpl-evidence-timeline', '生命发展证据时间线', ['bio-unit-evolution'], '证据解释', '按证据来源、形成先后和可支持的结论组织生命发展信息。', ['区分化石、比较和遗传等证据。', '按时间或层次排列事实。', '说明证据支持的变化线索。', '保留无法由现有证据回答的边界。'], ['把推测写成确定历史。', '忽略不同证据之间的相互印证。']),
];

module.exports = { templates };
