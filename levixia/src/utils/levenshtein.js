/**
 * Levenshtein distance for fuzzy spelling scoring.
 * Returns edit distance between two strings.
 */
export function levenshteinDistance(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return Math.max((a || '').length, (b || '').length);
  const sa = (a || '').toLowerCase().trim();
  const sb = (b || '').toLowerCase().trim();
  if (sa.length === 0) return sb.length;
  if (sb.length === 0) return sa.length;

  const matrix = [];
  for (let i = 0; i <= sa.length; i++) matrix[i] = [i];
  for (let j = 0; j <= sb.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= sa.length; i++) {
    for (let j = 1; j <= sb.length; j++) {
      const cost = sa[i - 1] === sb[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[sa.length][sb.length];
}

/**
 * Spelling accuracy for one word: 0–100 based on edit distance.
 * Exact match = 100; allows minor typos vs phonetic errors (higher penalty for longer words).
 */
export function spellingScore(correct, userAnswer) {
  if (!correct || typeof correct !== 'string') return 0;
  const user = (userAnswer || '').trim();
  if (user.length === 0) return 0;
  const dist = levenshteinDistance(correct, user);
  const maxLen = Math.max(correct.length, user.length);
  const similarity = 1 - dist / maxLen;
  return Math.max(0, Math.round(similarity * 100));
}
