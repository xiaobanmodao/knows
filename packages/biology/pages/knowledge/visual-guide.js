const CYCLE_HINT = '这些环节持续关联，不表示单一因果链。';

function cloneValue(value) {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item));
  if (!value || typeof value !== 'object') return value;

  return Object.keys(value).reduce((copy, key) => {
    copy[key] = cloneValue(value[key]);
    return copy;
  }, {});
}

function prepareVisualGuide(guide) {
  if (!guide || !Array.isArray(guide.items) || !guide.items.length) return null;

  const isCompare = guide.type === 'compare';
  const isSequential = guide.type === 'flow';
  const isCycle = guide.type === 'cycle';
  const items = guide.items.map((item, index, sourceItems) => ({
    ...cloneValue(item),
    displayIndex: index + 1,
    isLast: index === sourceItems.length - 1,
  }));
  const preparedGuide = {
    ...cloneValue(guide),
    items,
    isCompare,
    isSequential,
    isCycle,
    cycleHint: isCycle ? CYCLE_HINT : '',
  };

  if (isCompare) {
    preparedGuide.compareColumns = { left: [], right: [] };
    items.forEach((item) => {
      if (item.lane === 'left') preparedGuide.compareColumns.left.push(item);
      if (item.lane === 'right') preparedGuide.compareColumns.right.push(item);
    });
  }

  return preparedGuide;
}

module.exports = {
  prepareVisualGuide,
};
