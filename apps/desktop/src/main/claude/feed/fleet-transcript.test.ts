import { it, expect, describe } from 'vitest'

import { FLEET_MAX_STEPS, FLEET_OUTPUT_CHARS } from './agent-tasks.constants'
import { isAgentName, readFleetTranscript } from './fleet-transcript'

const line = (value: object) => JSON.stringify(value)

const user = (content: unknown) => line({ type: 'user', message: { role: 'user', content } })

const assistant = (...content: object[]) =>
  line({ type: 'assistant', message: { role: 'assistant', content } })

const toolUse = (name: string, input: object) => ({ type: 'tool_use', id: name, name, input })

describe('readFleetTranscript', () => {
  it('задание - первое сообщение агенту, ответ - его последние слова', () => {
    const transcript = readFleetTranscript([
      user('Find every bug in billing.\n\nReport file and line.'),
      assistant({ type: 'text', text: 'Looking.' }, toolUse('Read', { file_path: '/p/bill.ts' })),
      user([{ type: 'tool_result', tool_use_id: 'Read', content: 'code' }]),
      assistant({ type: 'text', text: 'Two bugs: bill.ts:12 and bill.ts:40.' }),
    ])

    expect(transcript).toEqual({
      found: true,
      prompt: 'Find every bug in billing.\n\nReport file and line.',
      steps: ['Read /p/bill.ts'],
      output: 'Two bugs: bill.ts:12 and bill.ts:40.',
      truncated: false,
    })
  })

  it('у агента со схемой ответ - его StructuredOutput, а не слова рядом', () => {
    const transcript = readFleetTranscript([
      user([{ type: 'text', text: 'Review' }]),
      assistant(toolUse('StructuredOutput', { findings: [{ file: 'a.ts' }] })),
    ])

    expect(transcript.output).toBe('{"findings":[{"file":"a.ts"}]}')
    expect(transcript.steps).toEqual([])
  })

  it('шаг назван первой строкой цели, без цели - именем инструмента', () => {
    const transcript = readFleetTranscript([
      user('go'),
      assistant(toolUse('Bash', { command: 'pnpm test\n--watch' }), toolUse('TodoWrite', {})),
    ])

    expect(transcript.steps).toEqual(['Bash pnpm test', 'TodoWrite'])
  })

  it('держит последние шаги и говорит, что ответ обрезан', () => {
    const many = Array.from({ length: FLEET_MAX_STEPS + 50 }, (_, index) =>
      assistant(toolUse('Grep', { pattern: `p${index}` })),
    )
    const transcript = readFleetTranscript([
      user('go'),
      ...many,
      assistant({ type: 'text', text: 'x'.repeat(FLEET_OUTPUT_CHARS + 1) }),
    ])

    expect(transcript.steps).toHaveLength(FLEET_MAX_STEPS)
    expect(transcript.steps.at(-1)).toBe(`Grep p${FLEET_MAX_STEPS + 49}`)
    expect(transcript.output).toHaveLength(FLEET_OUTPUT_CHARS)
    expect(transcript.truncated).toBe(true)
  })

  it('мусорные строки пропускает', () => {
    expect(readFleetTranscript(['not json', '', user('go')]).prompt).toBe('go')
  })
})

describe('isAgentName', () => {
  it('пускает имена CLI и не пускает путь', () => {
    expect(isAgentName('a1b2c3d4-e5')).toBe(true)
    expect(isAgentName('../../etc/passwd')).toBe(false)
    expect(isAgentName('a/b')).toBe(false)
    expect(isAgentName('')).toBe(false)
  })
})
