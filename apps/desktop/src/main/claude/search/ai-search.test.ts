import { it, expect, describe } from 'vitest'

import { AiRuns } from './ai-runs'
import { aiStepOf, aiErrorIn, aiSearchArgs, aiSearchBody, parseAiPicks } from './ai-search'

/** Поток CLI: шаги и итог последней строкой. */
const stream = (result: string, isError = false) =>
  [
    JSON.stringify({ type: 'system', subtype: 'init' }),
    JSON.stringify({ type: 'result', subtype: 'success', is_error: isError, result }),
  ].join('\n')

const toolUse = (name: string, input: Record<string, unknown>) =>
  JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'tool_use', id: 't', name, input }] },
  })

describe('поиск модели по разговорам', () => {
  it('находки читаются из текста модели, обёртки не в счёт', () => {
    const text =
      'Here:\n```json\n{"hits":[{"conversationId":"bbbb","uuid":"u-4","reason":"about the balance"}]}\n```'

    expect(parseAiPicks(stream(text))).toEqual([
      { conversation: 'bbbb', uuid: 'u-4', reason: 'about the balance' },
    ])
  })

  it('пустой список - ответ, проза и ошибка - нет', () => {
    expect(parseAiPicks(stream('{"hits":[]}'))).toEqual([])
    expect(parseAiPicks(stream('I could not find anything.'))).toBeNull()
    expect(parseAiPicks(stream('{}', true))).toBeNull()
    expect(parseAiPicks('not json')).toBeNull()
  })

  it('находка без имён выбрасывается', () => {
    const text = '{"hits":[{"conversationId":"a"},{"conversationId":"a","uuid":"u2"}]}'

    expect(parseAiPicks(stream(text))).toEqual([{ conversation: 'a', uuid: 'u2', reason: '' }])
  })

  it('шаги модели читаются из потока по мере прихода', () => {
    expect(aiStepOf(toolUse('Grep', { pattern: 'Deepgram|баланс' }))).toEqual({
      kind: 'grep',
      subject: 'Deepgram|баланс',
    })
    expect(aiStepOf(toolUse('Read', { file_path: '/x/corpus/abc-123.txt' }))).toEqual({
      kind: 'read',
      subject: 'abc-123',
    })
    expect(aiStepOf(toolUse('Read', { file_path: '/x/corpus/sessions.txt' }))).toEqual({
      kind: 'list',
      subject: '',
    })
    expect(aiStepOf(toolUse('Glob', { pattern: '*.txt' }))).toEqual({ kind: 'other', subject: '' })
    expect(
      aiStepOf(
        JSON.stringify({
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'thinking' }] },
        }),
      ),
    ).toBeNull()
    expect(aiStepOf(JSON.stringify({ type: 'result', result: '{}' }))).toBeNull()
    expect(aiStepOf('not json')).toBeNull()
  })

  it('запрос едет последним, между метками, с датой', () => {
    const body = aiSearchBody('where did we talk about "balance"?', new Date(2026, 8, 1))

    expect(body).toContain('Today is 2026-09-01.')
    expect(body.endsWith('<<<REQUEST\nwhere did we talk about "balance"?\nREQUEST>>>\n')).toBe(true)
    expect(body.indexOf('REQUEST>>>')).toBeGreaterThan(body.indexOf('sessions.txt'))
  })

  it('ошибка из итога CLI - одна строка, которую стоит показать', () => {
    expect(aiErrorIn(stream('Not logged in', true))).toBe('Not logged in')
    expect(aiErrorIn(stream('fine'))).toBeNull()
  })

  it('флаги - только знакомые CLI, а без --tools не запускаться вовсе', () => {
    expect(aiSearchArgs('-p --print')).toBeNull()

    const args = aiSearchArgs('--tools --model --effort --safe-mode') ?? []

    expect(args).toEqual(
      expect.arrayContaining([
        '--tools',
        'Grep',
        'Read',
        'Glob',
        '--model',
        'sonnet',
        '--effort',
        'low',
      ]),
    )
    expect(args).not.toContain('--fallback-model')
    // Аргументы - без переводов строк и кавычек: батник CLI на Windows режет по ним.
    expect(args.some((arg) => /["\n]/.test(arg))).toBe(false)
  })
})

describe('отмена прогона модели', () => {
  const runs = () => {
    const stopped: string[] = []

    return { stopped, book: new AiRuns<string>((handle) => stopped.push(handle)) }
  }

  it('отмена до старта помнится, и прогон не стартует', () => {
    const { stopped, book } = runs()

    book.asked('r1')
    expect(book.cancel('r1')).toBe(true)
    expect(book.isCancelled('r1')).toBe(true)
    book.started('r1', 'process')
    expect(stopped).toEqual(['process'])
    expect(book.finished('r1')).toBe(true)
    expect(book.size).toBe(0)
  })

  it('отмена после старта гасит процесс', () => {
    const { stopped, book } = runs()

    book.asked('r1')
    book.started('r1', 'process')
    book.cancel('r1')
    expect(stopped).toEqual(['process'])
  })

  it('процесс, пришедший к забытому запросу, гасится на приёме', () => {
    const { stopped, book } = runs()

    book.started('nobody', 'late')
    expect(stopped).toEqual(['late'])
  })

  it('прогон, кончившийся сам, забывается, и его итог - новость', () => {
    const { stopped, book } = runs()

    book.asked('r1')
    book.started('r1', 'process')
    expect(book.finished('r1')).toBe(false)
    expect(book.size).toBe(0)
    expect(stopped).toEqual([])
  })

  it('отмена незаданного запроса - ничто', () => {
    expect(runs().book.cancel('nobody')).toBe(false)
  })
})
