const CYCLE_HINT = '这些环节持续关联，不表示单一因果链。';

function cloneValue(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function prepareStructuredVisualGuide(guide) {
  if (!guide || !Array.isArray(guide.items) || !guide.items.length) return null;

  const items = guide.items.map((item, index, sourceItems) => ({
    ...cloneValue(item),
    displayIndex: index + 1,
    isLast: index === sourceItems.length - 1,
  }));
  const prepared = {
    ...cloneValue(guide),
    items,
    isSequential: guide.type === 'flow',
    isCycle: guide.type === 'cycle',
    isCompare: guide.type === 'compare',
    cycleHint: guide.type === 'cycle' ? CYCLE_HINT : '',
  };

  if (prepared.isCompare) {
    prepared.compareColumns = { left: [], right: [] };
    items.forEach((item) => {
      if (item.lane === 'left' || item.lane === 'right') {
        prepared.compareColumns[item.lane].push(item);
      }
    });
  }

  return prepared;
}

module.exports = { CYCLE_HINT, prepareStructuredVisualGuide };
