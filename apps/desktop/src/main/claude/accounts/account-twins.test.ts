import { it, expect, describe } from 'vitest'

import type { TwinRow } from './account-twins'
import { holdsOf, filedKey, twinMerges, mislabelled } from './account-twins'
import type { AccountIdentity } from './identity-probe'
import { accountKey } from './identity-probe'

const who = (email: string, orgUuid = 'org-1'): AccountIdentity => ({
  email,
  orgUuid,
  accountUuid: '',
})

const row = (
  id: string,
  holds: AccountIdentity | null,
  options: Partial<Omit<TwinRow, 'id' | 'who'>> = {},
): TwinRow => ({
  id,
  who: holds,
  live: true,
  filedAs: holds ? accountKey(holds.email, holds.orgUuid) : '',
  addedAt: 0,
  alias: '',
  ...options,
})

describe('что держит хранилище', () => {
  const filedAs = accountKey('a@x.io', 'org-1')

  it('пустое - nobody, не сказал чей - unknown: на этом ничего не удаляют', () => {
    expect(holdsOf(false, who('a@x.io'), filedAs)).toEqual({ kind: 'nobody' })
    expect(holdsOf(true, null, filedAs)).toEqual({ kind: 'unknown' })
  })

  it('тот же аккаунт - same, другая организация той же почты - чужой', () => {
    expect(holdsOf(true, who('A@x.io'), filedAs)).toEqual({ kind: 'same' })
    expect(holdsOf(true, who('a@x.io', 'org-2'), filedAs)).toMatchObject({ kind: 'another' })
  })

  it('запись старше поля организации сравнивается по почте с организацией ответа', () => {
    expect(filedKey({ email: 'a@x.io', orgUuid: '' }, who('a@x.io', 'org-9'))).toBe(
      accountKey('a@x.io', 'org-9'),
    )
  })
})

describe('строки, записанные не под тем аккаунтом', () => {
  it('переписывается та, чьё живое хранилище держит другого', () => {
    const rows = [
      row('a', who('b@x.io'), { filedAs: accountKey('a@x.io', 'org-1') }),
      row('c', who('c@x.io')),
    ]

    expect(mislabelled(rows)).toEqual([{ id: 'a', who: who('b@x.io') }])
  })

  it('без ответа или мёртвое хранилище - не трогается', () => {
    expect(mislabelled([row('a', null, { filedAs: 'x' })])).toEqual([])
    expect(mislabelled([row('a', who('b@x.io'), { filedAs: 'x', live: false })])).toEqual([])
  })
})

describe('склейка дублей аккаунтов', () => {
  const nobody = { who: null, live: false }

  it('добавленная строка на аккаунт обычного входа уходит в него вместе с именем', () => {
    const rows = [row('a', who('A@x.io'), { alias: 'Work' }), row('b', who('b@x.io'))]

    expect(twinMerges({ who: who('a@x.io'), live: true }, rows, 'a')).toEqual([
      { drop: 'a', keep: '', alias: 'Work' },
    ])
  })

  it('две добавленные строки одного аккаунта: остаётся та, что в работе', () => {
    const rows = [row('a', who('a@x.io'), { addedAt: 1, alias: 'Work' }), row('b', who('a@x.io'))]

    expect(twinMerges(nobody, rows, 'a')).toEqual([{ drop: 'b', keep: 'a', alias: null }])
  })

  it('иначе более новая, а имя уходящей переезжает на неё, если своего нет', () => {
    const rows = [
      row('a', who('a@x.io'), { addedAt: 1, alias: 'Work' }),
      row('b', who('a@x.io'), { addedAt: 2 }),
    ]

    expect(twinMerges(nobody, rows, '')).toEqual([{ drop: 'a', keep: 'b', alias: 'Work' }])
  })

  it('одна почта в двух организациях - два аккаунта, не дубль', () => {
    const rows = [row('a', who('a@x.io', 'org-1')), row('b', who('a@x.io', 'org-2'))]

    expect(twinMerges({ who: who('a@x.io', 'org-3'), live: true }, rows, '')).toEqual([])
  })

  it('пара, записанная под разными почтами, но держащая один аккаунт, склеивается', () => {
    const rows = [
      row('a', who('a@x.io'), { addedAt: 1, filedAs: accountKey('old@x.io', '') }),
      row('b', who('a@x.io'), { addedAt: 2 }),
    ]

    expect(twinMerges(nobody, rows, '')).toEqual([{ drop: 'a', keep: 'b', alias: null }])
  })

  it('без свежего ответа или мёртвое хранилище не склеивается ничего', () => {
    expect(twinMerges(nobody, [row('a', null), row('b', null)], '')).toEqual([])
    expect(
      twinMerges(
        { who: who('a@x.io'), live: false },
        [row('a', who('a@x.io'), { live: false }), row('b', who('a@x.io'))],
        '',
      ),
    ).toEqual([])
  })
})
