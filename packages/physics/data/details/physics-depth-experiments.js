const EXPERIMENT_DEPTH = {
  'phy-ch01-length-time': {
    method: '直接测量与多次测量',
    controls: ['刻度尺贴近被测边且与被测边平行。', '每次读数都从同一零刻线或明确起始刻线开始。'],
    records: ['记录量程、分度值、每次测量值和单位。', '多次测量后计算平均值，异常值须先说明判断依据。'],
  },
  'phy-ch01-average-speed': {
    method: '分段测量与间接计算',
    controls: ['小车每次从同一位置由静止释放。', '斜面坡度和各段路程保持不变。'],
    records: ['分别记录各段路程 s 和时间 t。', '用对应路程除以对应时间，不能直接平均各段速度。'],
  },
  'phy-ch02-generation-propagation': {
    method: '转换法',
    controls: ['使用同一音叉并保持敲击方式可比较。', '音叉只轻触水面，避免水阻显著改变振动。'],
    records: ['记录发声、手感振动和水花出现是否同步。', '水花只用于放大显示振动，不代表声音由水产生。'],
  },
  'phy-ch03-melting-freezing': {
    method: '持续加热与温度时间图像',
    controls: ['样品种类、质量和颗粒大小保持一致。', '温度计玻璃泡充分接触样品且不碰容器底。'],
    records: ['按等时间间隔记录温度和物态。', '在图像中同时标出熔化开始、结束和平台阶段。'],
  },
  'phy-ch03-vaporization': {
    method: '持续加热与温度时间图像',
    controls: ['水量、加热功率和测温位置保持稳定。', '实验过程中外界气压近似不变。'],
    records: ['接近沸腾后按等时间间隔记录温度。', '同时记录气泡在沸腾前后的大小和运动变化。'],
  },
  'phy-ch04-reflection': {
    method: '光路显示、测角与纸板折转',
    controls: ['镜面、纸板和法线位置固定。', '每次只改变入射角并重新描出光路。'],
    records: ['记录多组入射角与反射角。', '记录纸板折转前后反射光线能否在同一平面显示。'],
  },
  'phy-ch04-plane-mirror': {
    method: '等效替代法',
    controls: ['玻璃板竖直且位置固定。', '替代物与物体外形、大小保持相同。'],
    records: ['记录物和替代物到玻璃板的垂直距离。', '移去替代物后用光屏检验像是否可承接。'],
  },
  'phy-ch05-convex-imaging': {
    method: '控制物距并观察成像',
    controls: ['烛焰、透镜和光屏中心大致同高。', '先测焦距，再分区间改变物距。'],
    records: ['记录 u、v、像的正倒、大小和虚实。', '找不到像时记录物距区间并检查是否为 u=f 或 u<f。'],
  },
  'phy-ch06-mass-balance': {
    method: '直接测量',
    controls: ['天平置于水平面，游码归零后再调平。', '称量过程中不再调节平衡螺母。'],
    records: ['记录砝码总质量和游码左边缘示数。', '物体质量写为两者之和并保留对应单位。'],
  },
  'phy-ch06-density-measurement': {
    method: '排水法与间接测量',
    controls: ['先测干燥石块质量。', '石块完全浸没且不接触量筒壁，表面不附气泡。'],
    records: ['记录质量 m、初始体积 V₁ 和浸没后体积 V₂。', '按 V=V₂-V₁、ρ=m/V 计算并写单位。'],
  },
  'phy-ch07-elastic-force': {
    method: '控制变量与图像归纳',
    controls: ['始终使用同一弹簧。', '逐次增加钩码且不超过弹簧弹性限度。'],
    records: ['记录拉力和对应弹簧长度或伸长量。', '作 F-Δl 图像时明确横纵轴和有效线性区间。'],
  },
  'phy-ch08-newton-inertia': {
    method: '控制变量实验与理想推理',
    controls: ['小车从同一斜面同一高度由静止释放。', '只改变水平面的粗糙程度。'],
    records: ['记录小车在不同表面运动的距离。', '先写实验观察，再说明阻力趋近于零时的理想推理。'],
  },
  'phy-ch08-two-force-balance': {
    method: '逐条件控制变量',
    controls: ['依次只改变力的大小、方向、作用线或受力物体。', '卡片质量和滑轮摩擦应尽量减小。'],
    records: ['记录卡片是否保持静止或匀速直线运动。', '分别归纳同体、等大、反向、共线四个条件。'],
  },
  'phy-ch08-friction': {
    method: '控制变量法',
    controls: ['木块在水平面上做匀速直线运动。', '研究压力时保持接触面不变，研究粗糙程度时保持压力不变。'],
    records: ['记录压力、接触面材料和测力计示数。', '测力计示数等于滑动摩擦力的依据是二力平衡。'],
  },
  'phy-ch09-solid-pressure': {
    method: '转换法与控制变量法',
    controls: ['研究压力时保持受力面积不变。', '研究受力面积时保持压力不变。'],
    records: ['用压痕深浅表示压力作用效果。', '记录压力和受力面积，不把接触面积与物体底面积无条件等同。'],
  },
  'phy-ch09-liquid-pressure': {
    method: '转换法与控制变量法',
    controls: ['使用同种液体研究深度关系。', '改变方向时保持探头在同一深度。'],
    records: ['记录液体密度、竖直深度、探头方向和液面高度差。', '实验前后检查压强计气密性和零位。'],
  },
  'phy-ch10-archimedes': {
    method: '称重法与等量比较',
    controls: ['溢水杯加水至溢水口并排尽多余水。', '物体完全浸没且不触底、不附气泡。'],
    records: ['记录空气中重力、浸没示数、空杯和杯加排液重力。', '分别计算 F浮=G-F示 与 G排，再比较。'],
  },
  'phy-ch12-lever': {
    method: '控制变量与多组测量',
    controls: ['先调节杠杆在水平位置平衡。', '每组只改变力或力臂，并使力臂按垂直距离读取。'],
    records: ['记录 F₁、l₁、F₂、l₂ 多组数据。', '比较 F₁l₁ 与 F₂l₂，避免只凭一组数据下结论。'],
  },
  'phy-ch12-efficiency': {
    method: '同步测量与间接计算',
    controls: ['物体匀速提升并保持装置绕绳方式不变。', '各次实验明确物重、提升高度、拉力和自由端距离。'],
    records: ['记录 G、h、F、s。', '分别计算 W有=Gh、W总=Fs 和 η=W有/W总。'],
  },
  'phy-ch13-specific-heat': {
    method: '转换法与控制变量法',
    controls: ['水和食用油质量相同、初温接近。', '使用相同加热器并让加热时间或吸收热量可比较。'],
    records: ['记录质量、初温、末温和加热时间。', '用升温多少或达到同温所需时间比较吸热能力。'],
  },
  'phy-ch15-current-rules': {
    method: '多点测量与归纳',
    controls: ['连接方式和电源保持不变。', '电流表逐点改接时先断电，并保持量程与正负接线正确。'],
    records: ['串联记录各处 I、I₁、I₂；并联记录干路与支路电流。', '更换灯泡或电阻重复实验，避免特殊数据。'],
  },
  'phy-ch16-voltage-rules': {
    method: '多点测量与归纳',
    controls: ['连接方式和电源保持不变。', '电压表始终并联，改接前断电。'],
    records: ['串联记录电源和各用电器两端电压。', '并联记录各支路和电源两端电压并更换元件复测。'],
  },
  'phy-ch16-resistance': {
    method: '控制变量法',
    controls: ['研究长度或横截面积时保持材料和温度相同。', '通电时间尽量短，避免电阻丝温度升高。'],
    records: ['记录材料、长度、横截面积和电流表示数。', '电流越小表示接入导体电阻越大，但比较时电压应相同。'],
  },
  'phy-ch17-current-voltage-resistance': {
    method: '控制变量与图像归纳',
    controls: ['研究 I-U 时保持定值电阻和温度近似不变。', '研究 I-R 时保持电阻两端电压不变。'],
    records: ['记录多组 U、I、R 并绘制 I-U 图像。', '只在同一导体同一状态下归纳电流与电压关系。'],
  },
  'phy-ch17-resistance-measurement': {
    method: '伏安法间接测量',
    controls: ['闭合开关前变阻器置最大阻值。', '被测电阻温度近似不变，仪表量程适当。'],
    records: ['记录多组 U、I 并逐组计算 R=U/I。', '定值电阻取多次结果平均，不能把灯丝电阻变化简单视为偶然误差。'],
  },
  'phy-ch18-measure-power': {
    method: '伏安法间接测量',
    controls: ['闭合前变阻器置最大阻值。', '调到额定电压后再比较低于和略高于额定电压的状态。'],
    records: ['记录 U、I、P=UI 和灯泡亮度。', '略高于额定电压时迅速读数，不长时间通电。'],
  },
  'phy-ch20-current-magnetic': {
    method: '铁屑显示与小磁针定向',
    controls: ['螺线管绕向和位置保持不变。', '改变电流方向时只对调电源正负极。'],
    records: ['记录电流方向和小磁针 N 极指向。', '用右手安培定则复核螺线管 N、S 极。'],
  },
  'phy-ch20-electromagnet-relay': {
    method: '控制变量与转换法',
    controls: ['研究电流时保持匝数和铁芯相同。', '研究匝数时保持电流和铁芯相同。'],
    records: ['用吸起铁钉数量或测力大小表示磁性强弱。', '记录电流、匝数、铁芯条件和对应现象。'],
  },
  'phy-ch20-generator': {
    method: '控制变量与方向比较',
    controls: ['磁场方向、导体运动方向和切割速度每次只改变一个。', '导体、磁体和灵敏电流计连接保持可靠。'],
    records: ['记录是否产生感应电流及指针偏转方向。', '分别反转运动方向和磁场方向，比较感应电流方向。'],
  },
};

function getPhysicsExperimentDepth(knowledgeId) {
  const detail = EXPERIMENT_DEPTH[knowledgeId];
  if (!detail) throw new Error(`物理补深缺少实验映射：${knowledgeId}`);

  return {
    structureVersion: 2,
    experimentId: `${knowledgeId}-experiment`,
    ...detail,
    review: {
      status: 'verified',
      reviewedAt: '2026-08-01',
      sourceKeys: ['moe-physics-experiments', 'pep-physics-public'],
    },
  };
}

module.exports = {
  EXPERIMENT_DEPTH,
  getPhysicsExperimentDepth,
};
