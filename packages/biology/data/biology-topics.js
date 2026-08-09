const { buildTopic } = require('./biology-builders');

const topicDefinitions = [
  ['bio-unit-cells', '第一单元', '生物和细胞', '从生命现象、科学观察和细胞结构认识生物体的基本组成。', ['生物特征', '细胞', '显微镜', '组织器官'], ['bio-k-life-features', 'bio-k-science-observation', 'bio-k-microscope-observation', 'bio-k-plant-animal-cells', 'bio-k-cell-life', 'bio-k-structure-levels'], 'bio-tpl-evidence-chain'],
  ['bio-unit-diversity', '第二单元', '多种多样的生物', '依据共同特征认识植物、动物和微生物的多样性及分类线索。', ['分类依据', '植物', '动物', '微生物'], ['bio-k-classification-basis', 'bio-k-algae-plants', 'bio-k-animal-groups', 'bio-k-animal-behavior', 'bio-k-microorganisms', 'bio-k-biological-classification'], 'bio-tpl-feature-comparison'],
  ['bio-unit-plants', '第三单元', '植物的生活', '联系结构与功能，理解植物从萌发到生长的物质和能量变化。', ['种子萌发', '根吸收', '茎运输', '光合作用'], ['bio-k-seed-germination', 'bio-k-root-absorption', 'bio-k-stem-transport', 'bio-k-leaf-structure', 'bio-k-photosynthesis', 'bio-k-respiration-growth'], 'bio-tpl-variable-observation'],
  ['bio-unit-health', '第四单元', '人体生理与健康', '从系统协作理解人体生命活动，并形成健康生活的证据意识。', ['生殖发育', '消化', '呼吸', '免疫'], ['bio-k-reproduction-development', 'bio-k-digestion', 'bio-k-breathing', 'bio-k-circulation', 'bio-k-urinary', 'bio-k-nervous-immunity'], 'bio-tpl-system-link'],
  ['bio-unit-environment', '第五单元', '生物与环境', '用生态系统的组成、关系和功能解释生物与环境的相互影响。', ['环境因素', '种间关系', '生态系统', '生物圈'], ['bio-k-environment-factors', 'bio-k-species-relations', 'bio-k-ecosystem-structure', 'bio-k-ecosystem-function', 'bio-k-biosphere', 'bio-k-ecological-security'], 'bio-tpl-ecosystem-map'],
  ['bio-unit-evolution', '第六单元', '生命的延续和发展', '从生殖、遗传、变异和进化证据理解生命延续与保护责任。', ['生物生殖', '遗传', '变异', '生物多样性'], ['bio-k-biological-reproduction', 'bio-k-heredity-basics', 'bio-k-variation', 'bio-k-origin-life', 'bio-k-evolution-evidence', 'bio-k-biodiversity-conservation'], 'bio-tpl-evidence-timeline'],
];

const topics = topicDefinitions.map(([id, unitLabel, title, summary, keywords, knowledgeIds, templateId]) => buildTopic({
  id,
  unitLabel,
  title,
  summary,
  gradeBands: ['七年级'],
  keywords,
  knowledgeIds,
  templateIds: [templateId],
  coverImage: `/assets/figures/generated/biology/topics/${id}/cover.png`,
}));

module.exports = { topics };
