import { it, expect, describe } from 'vitest'

import type { FeedItem } from '@shared/claude-feed'

import { PIN_LIMIT } from './pins.constants'
import { pinHint, pinLine, togglePin, pinnedItems } from './pins.utils'

const items: FeedItem[] = [
  {
    id: 'u1',
    kind: 'user',
    parentToolUseId: null,
    text: 'fix   the\n@src/a.ts',
    time: 0,
    images: [],
    steering: false,
  },
  {
    id: 'a1',
    kind: 'assistant',
    parentToolUseId: null,
    text: '## Done\n**All** `green`',
    streaming: false,
  },
  { id: 'n1', kind: 'notice', parentToolUseId: null, code: 'rewound', detail: '', replayed: false },
  { id: 'a2', kind: 'assistant', parentToolUseId: null, text: 'x'.repeat(500), streaming: false },
]

describe('закреплённые', () => {
  it('четвёртый не вытесняет старый: тот же массив', () => {
    const full = ['a', 'b', 'c']

    expect(full).toHaveLength(PIN_LIMIT)
    expect(togglePin(full, 'd')).toBe(full)
    expect(togglePin(full, 'b')).toEqual(['a', 'c'])
    expect(togglePin(['a'], 'b')).toEqual(['a', 'b'])
  })

  it('на полке - порядок разговора; служебное и пропавшее не встают', () => {
    expect(pinnedItems(items, ['a2', 'u1', 'n1', 'gone']).map((item) => item.id)).toEqual([
      'u1',
      'a2',
    ])
  })

  it('строка: пробелы схлопнуты, разметки нет, длина ограничена', () => {
    const [user, answer, long] = pinnedItems(items, ['u1', 'a1', 'a2'])

    expect(user && pinLine(user)).toBe('fix the a.ts')
    expect(answer && pinLine(answer)).toBe('Done All green')
    expect(long && pinLine(long).length).toBeLessThan(250)
    expect(answer && pinHint(answer)).toBe('Done\nAll green')
  })
})
