import { it, expect, describe } from 'vitest'

import { toStored, startingState, freshConversation, parseStoredClaude } from './claude-state'

describe('сохранённые разговоры', () => {
  it('очередь переживает перезапуск текстом, битые записи в ней отбрасываются', () => {
    const conversation = freshConversation({
      id: 'c1',
      projectPath: '/p',
      sessionId: 's1',
      title: 'Fix',
      model: null,
      effort: 'high',
      permissionMode: 'plan',
      queue: [
        {
          id: 'q1',
          text: 'not sent yet',
          imageCount: 2,
          draft: { tokens: [{ kind: 'text', value: 'not sent yet' }], quotes: [] },
        },
      ],
      fork: { sourceSessionId: 's0', sourceTitle: 'Origin', at: 'a1' },
      updatedAt: 5,
    })
    const stored = JSON.parse(
      JSON.stringify({
        conversations: [toStored(conversation)],
        activeByProject: { '/p': 'c1' },
        trustedProjects: ['/p', 'relative'],
      }),
    ) as { conversations: { queue: unknown[] }[] }

    stored.conversations[0]?.queue.push({ id: 'q2' }, 'junk')

    const parsed = parseStoredClaude(stored)

    expect(parsed.conversations[0]).toMatchObject({
      effort: 'high',
      permissionMode: 'plan',
      queue: [
        {
          id: 'q1',
          text: 'not sent yet',
          imageCount: 0,
          draft: { tokens: [{ kind: 'text', value: 'not sent yet' }], quotes: [] },
        },
      ],
      fork: { sourceSessionId: 's0', sourceTitle: 'Origin', at: 'a1' },
    })
    expect(parsed.trustedProjects).toEqual(['/p'])
  })

  it('«Tabs on start» выключено - вкладки после перезапуска не возвращаются', () => {
    const stored = {
      conversations: [{ id: 'c1', projectPath: '/p', sessionId: 's1' }],
      activeByProject: { '/p': 'c1' },
      trustedProjects: ['/p'],
    }
    const kept = startingState(parseStoredClaude(stored))
    const dropped = startingState(parseStoredClaude({ ...stored, prefs: { restoreTabs: false } }))

    expect(kept.conversations).toHaveLength(1)
    expect(dropped.conversations).toEqual([])
    expect(dropped.closed).toEqual([])
    expect(dropped.activeByProject).toEqual({})
    // Доверие к папке - не вкладка: оно остаётся.
    expect(dropped.trustedProjects).toEqual(['/p'])
  })

  it('форк, который несёт разговор целиком вместо разреза, помнит это после перезапуска', () => {
    const fork = { sourceSessionId: 's0', sourceTitle: 'Origin', at: 'a1' }
    const parsed = parseStoredClaude({
      conversations: [
        { id: 'c1', projectPath: '/p', sessionId: 's1', fork: { ...fork, whole: true } },
        { id: 'c2', projectPath: '/p', sessionId: 's2', fork: { ...fork, whole: 'yes' } },
      ],
    })

    expect(parsed.conversations[0]?.fork).toEqual({ ...fork, whole: true })
    expect(parsed.conversations[1]?.fork).toEqual(fork)
  })

  it('выбранной остаётся только вкладка разговора: снятые вкладки панели после перезапуска пропадают', () => {
    const parsed = parseStoredClaude({
      conversations: [{ id: 'c1', projectPath: '/p', sessionId: 's1' }],
      activeByProject: { '/p': 'c1', '/q': 'panel:scenarios', '/r': 'panel:statistics' },
      panelTabs: [{ kind: 'scenarios', projectPath: '/q', unitsLeft: [] }],
    })

    expect(parsed.activeByProject).toEqual({ '/p': 'c1' })
    expect(parsed).not.toHaveProperty('panelTabs')
  })
})
