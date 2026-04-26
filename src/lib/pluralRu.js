/**
 * Склонение существительного по числу (рус.): 1 вопрос, 2 вопроса, 5 вопросов.
 * @param {number} n
 * @param {[string, string, string]} forms — [для 1, для 2–4, для 5+]
 */
export function pluralRu(n, [one, few, many]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) {
    return many;
  }
  if (b > 1 && b < 5) {
    return few;
  }
  if (b === 1) {
    return one;
  }
  return many;
}
