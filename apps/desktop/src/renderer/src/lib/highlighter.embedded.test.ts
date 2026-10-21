import { it, expect, describe } from 'vitest'

import { createLineHighlighter } from './highlighter'

// Отдельным файлом: у каждого файла тестов своя подсветка, и TypeScript в ней ещё не
// загружен - ровно как у человека, который первым открыл README.
describe('вложенные языки', () => {
  it('блок кода в Markdown окрашен своим языком, даже если его файлов ещё не открывали', async () => {
    const markdown = await createLineHighlighter('markdown')
    let state = markdown!.initial
    const roles: string[][] = []

    for (const line of ['```ts', 'const answer = 42', '```']) {
      const result = markdown!.tokenizeLine(line, state)

      state = result.state
      roles.push(result.tokens.map((token) => token.role))
    }

    expect(roles[1]).toContain('token-keyword')
  })
})
