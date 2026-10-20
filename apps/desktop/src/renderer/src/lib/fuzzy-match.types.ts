/** Кусок текста: с какого символа и сколько (тот же вид, что у подсветки ListBoxOption). */
export type MatchRange = {
  start: number
  length: number
}

/** Совпадение с запросом: очки и куски текста, которые подсветить. */
export type FuzzyMatch = {
  score: number
  ranges: MatchRange[]
}
