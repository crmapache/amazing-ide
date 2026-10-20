import { it, expect, describe } from 'vitest'

import { forkLeaf, forkAnchor } from './fork-anchor'

const line = (value: Record<string, unknown>) => JSON.stringify(value)

const transcript = [
  line({ type: 'user', uuid: 'u1', parentUuid: null }),
  line({ type: 'attachment', uuid: 'at1', parentUuid: 'u1' }),
  line({ type: 'assistant', uuid: 'a1', parentUuid: 'at1' }),
  line({ type: 'system', subtype: 'stop_hook_summary', uuid: 'h1', parentUuid: 'a1' }),
  line({ type: 'system', subtype: 'api_error', uuid: 'e1', parentUuid: 'h1' }),
  line({ type: 'user', uuid: 'u2', parentUuid: 'e1' }),
  line({ type: 'assistant', uuid: 'a2', parentUuid: 'u2' }),
  line({
    type: 'attachment',
    uuid: 'q1',
    parentUuid: 'a2',
    attachment: { type: 'queued_command', source_uuid: 'steer' },
  }),
  line({ type: 'assistant', uuid: 'a3', parentUuid: 'q1' }),
  line({ type: 'assistant', uuid: 's1', parentUuid: 'a3', isSidechain: true }),
  line({ type: 'ai-title', aiTitle: 'Words' }),
]

describe('точка форка', () => {
  it('весь разговор - последняя строка цепочки, не боковая', () => {
    expect(forkLeaf(transcript)).toBe('a3')
    expect(forkLeaf([line({ type: 'ai-title', aiTitle: 'Words' })])).toBeNull()
  })

  it('перед сообщением - ближайшая вверх строка, которую CLI примет', () => {
    expect(forkAnchor(transcript, 'u2')).toEqual({ kind: 'at', uuid: 'h1' })
  })

  it('сообщение посреди хода ищется по вложению очереди', () => {
    expect(forkAnchor(transcript, 'steer')).toEqual({ kind: 'at', uuid: 'a2' })
  })

  it('перед первым сообщением нести нечего', () => {
    expect(forkAnchor(transcript, 'u1')).toEqual({ kind: 'start' })
  })

  it('сообщения нет в транскрипте - это не «нести нечего», а промах', () => {
    expect(forkAnchor(transcript, 'missing')).toEqual({ kind: 'missing' })
  })
})
