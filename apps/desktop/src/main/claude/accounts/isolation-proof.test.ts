import { it, expect, describe } from 'vitest'

import type { AuthStatus } from './auth-status'
import { isolationVerdict } from './isolation-proof'

const FOLDER = '/Users/me/.claude/projects'

/** Ответы - в форме `claude auth status --json` (2.1.293). */
const status = (change: Partial<AuthStatus> = {}): AuthStatus => ({
  loggedIn: true,
  plan: 'max',
  email: '',
  method: 'claude.ai',
  projectsDirectory: FOLDER,
  ...change,
})

const EMPTY = status({ loggedIn: false, method: 'none', plan: '' })

describe('проба аккаунтов', () => {
  it('вход переехал, папка осталась - CLI держит входы порознь', () => {
    expect(isolationVerdict(status(), status(), EMPTY)).toBe('supported')
  })

  it('из обычного входа вышли - опора на добавленный живой вход', () => {
    expect(isolationVerdict(EMPTY, status(), EMPTY)).toBe('supported')
  })

  it('живого входа нет нигде', () => {
    expect(isolationVerdict(EMPTY, null, EMPTY)).toBe('not_signed_in')
    expect(isolationVerdict(EMPTY, EMPTY, EMPTY)).toBe('not_signed_in')
  })

  it('ключ API перебивает любое хранилище', () => {
    expect(isolationVerdict(status(), status({ method: 'api_key' }), EMPTY)).toBe('api_key')
  })

  it('пустое хранилище отвечает «вошёл» - переменную не слушают', () => {
    expect(isolationVerdict(status(), status(), status())).toBe('ignored')
  })

  it('папка разговоров уехала вместе со входом - нельзя', () => {
    expect(isolationVerdict(status(), status(), { ...EMPTY, projectsDirectory: '/x' })).toBe(
      'ignored',
    )
  })

  it('старый CLI не говорит, где папка: два «нет» равны, но это не доказательство', () => {
    const old = (answer: AuthStatus) => ({ ...answer, projectsDirectory: '' })

    expect(isolationVerdict(old(status()), old(status()), old(EMPTY))).toBe('ignored')
    expect(isolationVerdict(status(), status(), null)).toBe('ignored')
  })
})
