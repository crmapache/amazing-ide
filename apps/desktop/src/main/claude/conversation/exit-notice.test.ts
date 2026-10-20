import { it, expect, describe } from 'vitest'

import { exitNotice } from './exit-notice'

const context = (turnActive: boolean, freshProcess: boolean, stopped = false) => ({
  turnActive,
  freshProcess,
  meta: { stopRequestedAt: stopped ? 1 : null },
})

describe('выход процесса CLI', () => {
  it('не начал отвечать - «не запустился» с причиной из stderr', () => {
    expect(
      exitNotice(context(true, true), 1, 'warn\nError: Session ID x is already in use\n'),
    ).toEqual({
      code: 'start-failed',
      detail: 'Error: Session ID x is already in use',
    })
  })

  it('посреди хода - «упал», после «стоп» - «прервано»', () => {
    expect(exitNotice(context(true, false), 137, '')).toEqual({
      code: 'process-exited',
      detail: '137',
    })
    expect(exitNotice(context(true, false, true), 0, '')).toEqual({
      code: 'interrupted',
      detail: '',
    })
  })

  it('между ходами - без отметки', () => {
    expect(exitNotice(context(false, false), 0, '')).toBeNull()
  })
})
