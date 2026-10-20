import { it, expect, describe } from 'vitest'

import { parsePullRequest } from './git-pull-request'

const answer = (fields: Record<string, unknown>) =>
  `${JSON.stringify({ number: 42, url: 'https://github.com/o/r/pull/42', ...fields })}\n`

describe('PR текущей ветки', () => {
  it('номер, адрес и состояние из ответа gh', () => {
    expect(parsePullRequest(answer({ state: 'OPEN', isDraft: false }))).toEqual({
      number: 42,
      url: 'https://github.com/o/r/pull/42',
      state: 'open',
    })
  })

  it('черновик - флаг поверх открытого, у слитого и закрытого он не важен', () => {
    expect(parsePullRequest(answer({ state: 'OPEN', isDraft: true }))?.state).toBe('draft')
    expect(parsePullRequest(answer({ state: 'MERGED', isDraft: true }))?.state).toBe('merged')
    expect(parsePullRequest(answer({ state: 'CLOSED', isDraft: false }))?.state).toBe('closed')
  })

  it('не тот вид, не сайт или незнакомое состояние - PR нет', () => {
    expect(parsePullRequest('no pull requests found')).toBeNull()
    expect(parsePullRequest('{"number":"42","url":"https://x","state":"OPEN"}')).toBeNull()
    expect(parsePullRequest('{"number":1,"url":"file:///etc/passwd","state":"OPEN"}')).toBeNull()
    expect(parsePullRequest(answer({ state: 'QUEUED' }))).toBeNull()
  })
})
