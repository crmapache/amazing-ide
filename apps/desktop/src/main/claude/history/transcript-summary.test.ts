import { it, expect, describe } from 'vitest'

import { summarizeTranscript } from './transcript-summary'

const line = (value: object) => JSON.stringify(value)
const user = line({ type: 'user', message: { role: 'user', content: 'Refactor the auth module' } })

describe('заголовок прошлого разговора', () => {
  it('имя от человека - как есть и с рангом user, поверх имени модели', () => {
    const head = [
      user,
      line({ type: 'ai-title', aiTitle: 'Auth refactor' }),
      line({ type: 'custom-title', customTitle: 'My own name' }),
    ].join('\n')

    expect(summarizeTranscript(head, '')).toEqual({ title: 'My own name', source: 'user' })
  })

  it('имя от модели - llm, без имён - догадка по первому сообщению', () => {
    const named = [user, line({ type: 'ai-title', aiTitle: 'Auth refactor' })].join('\n')

    expect(summarizeTranscript(named, '')).toEqual({ title: 'Auth refactor', source: 'llm' })
    expect(summarizeTranscript(user, '')).toEqual({
      title: 'Refactor the auth module',
      source: 'heuristic',
    })
  })
})
