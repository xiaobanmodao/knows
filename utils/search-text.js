const CHARACTER_REPLACEMENTS = {
  '＝': '=',
  '／': '/',
  '∕': '/',
  '÷': '/',
  '－': '-',
  '—': '-',
  '–': '-',
  '−': '-',
  '（': '(',
  '）': ')',
  '×': '*',
  '·': '*',
  '⋅': '*',
  '²': '^2',
  '³': '^3',
  '⁰': '^0',
  '¹': '^1',
  '⁴': '^4',
  '⁵': '^5',
  '⁶': '^6',
  '⁷': '^7',
  '⁸': '^8',
  '⁹': '^9',
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
};

function normalizeCharacter(character) {
  if (CHARACTER_REPLACEMENTS[character]) return CHARACTER_REPLACEMENTS[character];
  const code = character.charCodeAt(0);
  if (code >= 0xFF01 && code <= 0xFF5E) return String.fromCharCode(code - 0xFEE0);
  return character;
}

function normalizeSearchText(value) {
  return [...String(value || '')]
    .map(normalizeCharacter)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

function normalizeWithOffsets(value) {
  const text = String(value || '');
  let normalized = '';
  const offsets = [];
  [...text].forEach((character, index) => {
    const replacement = normalizeCharacter(character).toLowerCase();
    if (/\s/.test(replacement)) return;
    normalized += replacement;
    for (let position = 0; position < replacement.length; position += 1) offsets.push(index);
  });
  return { text, normalized, offsets };
}

function buildHighlightSegments(value, terms = []) {
  const { text, normalized, offsets } = normalizeWithOffsets(value);
  if (!text) return [];
  const normalizedTerms = [...new Set((terms || []).map(normalizeSearchText).filter(Boolean))]
    .sort((left, right) => right.length - left.length);
  if (!normalizedTerms.length || !normalized) return [{ text, highlighted: false }];

  const ranges = [];
  normalizedTerms.forEach((term) => {
    let fromIndex = 0;
    while (fromIndex < normalized.length) {
      const matchIndex = normalized.indexOf(term, fromIndex);
      if (matchIndex < 0) break;
      ranges.push({
        start: offsets[matchIndex],
        end: offsets[matchIndex + term.length - 1] + 1,
      });
      fromIndex = matchIndex + Math.max(term.length, 1);
    }
  });
  if (!ranges.length) return [{ text, highlighted: false }];

  const mergedRanges = ranges
    .sort((left, right) => left.start - right.start || right.end - left.end)
    .reduce((result, range) => {
      const previous = result[result.length - 1];
      if (previous && range.start <= previous.end) {
        previous.end = Math.max(previous.end, range.end);
      } else {
        result.push({ ...range });
      }
      return result;
    }, []);
  const segments = [];
  let cursor = 0;
  mergedRanges.forEach((range) => {
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start), highlighted: false });
    segments.push({ text: text.slice(range.start, range.end), highlighted: true });
    cursor = range.end;
  });
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false });
  return segments;
}

module.exports = {
  buildHighlightSegments,
  normalizeSearchText,
};
