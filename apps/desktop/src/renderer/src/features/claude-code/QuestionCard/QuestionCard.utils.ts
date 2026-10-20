import type { ToolFeedItem } from '@shared/claude-feed'

/** Тексты вопросов из входа AskUserQuestion. */
const questionTitles = (tool: ToolFeedItem): string[] => {
  const questions = tool.input['questions']

  if (!Array.isArray(questions)) return []

  return questions
    .map((question: unknown) =>
      typeof question === 'object' && question !== null && 'question' in question
        ? String(question.question)
        : '',
    )
    .filter(Boolean)
}

/**
 * Пары «вопрос - ответ» из результата AskUserQuestion: CLI пишет их модели парами
 * `"вопрос"="ответ"`. Закрытый крестиком вопрос ответов не несёт - пусто, строки нет.
 */
export const answerPairs = (tool: ToolFeedItem): { question: string; answer: string }[] => {
  if (tool.status !== 'done' || !tool.result) return []

  const answers = new Map(
    [...tool.result.text.matchAll(/"([^"]+)"="([^"]*)"/g)].map(([, question = '', answer = '']) => [
      question,
      answer,
    ]),
  )

  return questionTitles(tool)
    .map((question) => ({ question, answer: answers.get(question) ?? '' }))
    .filter((pair) => pair.answer.trim())
}

/** Время ЧЧ:ММ - когда ответили. */
export const clockTime = (at: number): string =>
  new Date(at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
