import { it, expect, describe } from 'vitest'

import { dropRewound } from './transcript-rewinds'

const line = (value: Record<string, unknown>) => JSON.stringify(value)
const user = (uuid: string, parentUuid: string | null) => line({ type: 'user', uuid, parentUuid })
const assistant = (uuid: string, parentUuid: string) =>
  line({ type: 'assistant', uuid, parentUuid })
const hook = (uuid: string, parentUuid: string) =>
  line({ type: 'system', subtype: 'stop_hook_summary', uuid, parentUuid })
const marker = (leafUuid: string) => line({ type: 'last-prompt', leafUuid, rewound: true })
const title = line({ type: 'ai-title', aiTitle: 'Words' })
const uuids = (lines: string[]) =>
  lines.map((item) => (JSON.parse(item) as { uuid?: string; type: string }).uuid ?? item)

// Запись 2.1.293: три хода, откат ко второму, новое сообщение цепляется к стопу первого.
const transcript = [
  user('u1', null),
  assistant('a1', 'u1'),
  hook('h1', 'a1'),
  title,
  user('u2', 'h1'),
  assistant('a2', 'u2'),
  hook('h2', 'a2'),
  user('u3', 'h2'),
  assistant('a3', 'u3'),
  marker('a1'),
  user('u4', 'h1'),
  assistant('a4', 'u4'),
]

describe('отрезанное откатом', () => {
  it('уходят строки цепочки между точкой продолжения и меткой, имя остаётся', () => {
    expect(uuids(dropRewound(transcript))).toEqual([
      'u1',
      'a1',
      'h1',
      title,
      marker('a1'),
      'u4',
      'a4',
    ])
  })

  it('после метки ещё ничего - точка продолжения из самой метки', () => {
    expect(uuids(dropRewound(transcript.slice(0, 10)))).toEqual(['u1', 'a1', title, marker('a1')])
  })

  it('без метки файл как есть', () => {
    const plain = transcript.slice(0, 9)

    expect(dropRewound(plain)).toEqual(plain)
  })

  it('откат к первому сообщению - уходит вся цепочка до метки, снимки и имя остаются', () => {
    const snapshot = line({ type: 'file-history-snapshot', messageId: 'u2', snapshot: {} })
    const fromStart = [
      line({ type: 'file-history-snapshot', messageId: 'u1', snapshot: {} }),
      user('u1', null),
      assistant('a1', 'u1'),
      title,
      snapshot,
      user('u2', 'a1'),
      assistant('a2', 'u2'),
      marker(''),
    ]
    const kept = [fromStart[0], title, snapshot, marker('')]

    expect(dropRewound(fromStart)).toEqual(kept)
    expect(dropRewound([...fromStart, user('u3', null), assistant('a3', 'u3')])).toEqual([
      ...kept,
      user('u3', null),
      assistant('a3', 'u3'),
    ])
  })

  it('точка продолжения не попала в прочитанный хвост - уходит всё до метки', () => {
    expect(uuids(dropRewound(transcript.slice(4)))).toEqual([marker('a1'), 'u4', 'a4'])
  })
})
