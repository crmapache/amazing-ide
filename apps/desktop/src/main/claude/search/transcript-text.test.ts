import { it, expect, describe } from 'vitest'

import type { BlockCounts } from './transcript-text'
import { readTranscriptLine } from './transcript-text'

const user = (content: unknown, uuid = 'u1', extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    type: 'user',
    uuid,
    timestamp: '2026-08-14T09:12:00.000Z',
    ...extra,
    message: { role: 'user', content },
  })

const assistant = (
  content: unknown[],
  { uuid = 'a1', id = 'msg_1', model = 'claude-opus-5' } = {},
) =>
  JSON.stringify({
    type: 'assistant',
    uuid,
    timestamp: '2026-08-14T09:13:00.000Z',
    message: { id, model, content },
  })

const read = (line: string, blocks: BlockCounts = []) => readTranscriptLine('c1', line, blocks)

const textOf = (line: string, blocks: BlockCounts = []) => {
  const result = read(line, blocks)

  return result?.kind === 'message' ? result.message.text : null
}

describe('что строка транскрипта даёт поиску', () => {
  it('простое сообщение человека - сообщение, с именем, временем и местом в ленте', () => {
    expect(read(user('почему баланс не показывается?'))).toEqual({
      kind: 'message',
      message: {
        conversation: 'c1',
        uuid: 'u1',
        anchor: 'u1',
        at: Date.parse('2026-08-14T09:12:00.000Z'),
        speaker: 'you',
        text: 'почему баланс не показывается?',
      },
    })
  })

  it('ответ держит текстовые блоки и отбрасывает вызовы и размышления', () => {
    const line = assistant([
      { type: 'thinking', thinking: 'hm' },
      { type: 'text', text: 'Looked at the css.' },
      { type: 'tool_use', id: 't', name: 'Read', input: {} },
      { type: 'text', text: 'Done.' },
    ])
    const result = read(line)

    expect(result).toMatchObject({
      kind: 'message',
      message: { speaker: 'claude', text: 'Looked at the css.\nDone.' },
    })
    // Номер блока - как у ленты: размышление стоит первым, текст - вторым.
    expect(result?.kind === 'message' && result.message.anchor).toBe('msg_1:1')
  })

  it('номер блока ответа считается через строки одного сообщения', () => {
    const blocks: BlockCounts = []

    expect(
      read(assistant([{ type: 'thinking', thinking: 'x' }], { uuid: 'a1' }), blocks),
    ).toBeNull()
    expect(
      read(
        assistant([{ type: 'tool_use', id: 't', name: 'Read', input: {} }], { uuid: 'a2' }),
        blocks,
      ),
    ).toBeNull()

    const answer = read(assistant([{ type: 'text', text: 'Here.' }], { uuid: 'a3' }), blocks)

    expect(answer?.kind === 'message' && answer.message.anchor).toBe('msg_1:2')

    const next = read(
      assistant([{ type: 'text', text: 'Next.' }], { uuid: 'a4', id: 'msg_2' }),
      blocks,
    )

    expect(next?.kind === 'message' && next.message.anchor).toBe('msg_2:0')
  })

  it('результат вызова - не сообщение', () => {
    expect(
      read(user([{ type: 'tool_result', tool_use_id: 't', content: 'file contents' }])),
    ).toBeNull()
  })

  it('свои метки CLI - не сообщения', () => {
    expect(read(user('a skill body', 'u1', { isMeta: true }))).toBeNull()
    expect(read(user('side', 'u1', { isSidechain: true }))).toBeNull()
    expect(
      read(assistant([{ type: 'text', text: 'Interrupted' }], { model: '<synthetic>' })),
    ).toBeNull()
    expect(read(assistant([{ type: 'text', text: '(no content)' }]))).toBeNull()
    expect(read(user('<local-command-stdout>x</local-command-stdout>'))).toBeNull()
    expect(read(user('[Request interrupted by user]'))).toBeNull()
    expect(read('not json')).toBeNull()
  })

  it('имена разговора и метка отката - отдельно от сообщений', () => {
    expect(read(JSON.stringify({ type: 'ai-title', aiTitle: 'Name', sessionId: 'c1' }))).toEqual({
      kind: 'aiTitle',
      title: 'Name',
    })
    expect(read(JSON.stringify({ type: 'custom-title', customTitle: 'Mine' }))).toEqual({
      kind: 'customTitle',
      title: 'Mine',
    })
    expect(read(JSON.stringify({ type: 'last-prompt', rewound: true, leafUuid: 'u1' }))).toEqual({
      kind: 'rewind',
    })
  })

  it('команда «/» остаётся командой', () => {
    const line = user(
      '<command-message>deploy</command-message><command-name>/deploy</command-name><command-args>staging</command-args>',
    )

    expect(textOf(line)).toBe('/deploy staging')
  })

  it('команда «!» держит свою строку и теряет вывод', () => {
    const text =
      '<bash-input>git status</bash-input>\n<bash-stdout>On branch main\nnothing to commit</bash-stdout>\n<bash-exit-code>0</bash-exit-code>\nNow fix the test'

    expect(textOf(user(text))).toBe('! git status\n\nNow fix the test')
  })

  it('одна команда «!» без слов стоит в ленте карточкой команды', () => {
    const result = read(user('<bash-input>ls</bash-input>\n<bash-stdout>a</bash-stdout>', 'u7'))

    expect(result).toMatchObject({
      kind: 'message',
      message: { text: '! ls', anchor: 'u7:shell:0' },
    })
  })

  it('напоминание внутри сообщения уходит, слова остаются', () => {
    expect(textOf(user('<system-reminder>be careful</system-reminder>look at this'))).toBe(
      'look at this',
    )
    expect(read(user('<system-reminder>only this</system-reminder>'))).toBeNull()
  })

  it('строка без имени - к ней не прыгнуть, её нет', () => {
    expect(
      read(JSON.stringify({ type: 'user', message: { role: 'user', content: 'hello' } })),
    ).toBeNull()
  })
})
