import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { it, expect, describe } from 'vitest'

import { parseUsage } from './usage-parse'

const reply = JSON.parse(
  readFileSync(join(import.meta.dirname, '__fixtures__/get-usage.json'), 'utf8'),
) as Record<string, unknown>

describe('лимиты из ответа CLI', () => {
  it('ответ сервера: пять часов, неделя и неделя модели со сбросом', () => {
    const parsed = parseUsage(reply)

    expect(parsed?.fromServer).toBe(true)
    expect(parsed?.extra).toBeNull()
    expect(parsed?.windows).toEqual([
      {
        group: 'session',
        model: '',
        percent: 75,
        resetsAt: Date.parse('2026-10-18T01:20:00.049754+00:00'),
        severity: 'warning',
      },
      {
        group: 'weekly',
        model: '',
        percent: 70,
        resetsAt: Date.parse('2026-10-19T00:00:00.049777+00:00'),
        severity: 'normal',
      },
      {
        group: 'weekly',
        model: 'Fable',
        percent: 0,
        resetsAt: Date.parse('2026-10-19T00:00:00+00:00'),
        severity: 'normal',
      },
    ])
  })

  it('подставленный ответ - без списка сервера, из старых полей', () => {
    const limits = reply['rate_limits'] as Record<string, unknown>
    const { limits: _list, ...seeded } = limits
    const parsed = parseUsage({ rate_limits: seeded })

    expect(parsed?.fromServer).toBe(false)
    expect(parsed?.windows.map((window) => [window.group, window.model, window.percent])).toEqual([
      ['session', '', 75],
      ['weekly', '', 70],
      ['weekly', 'Fable', 0],
    ])
  })

  it('лимитов нет - null; доплата включена - её процент', () => {
    expect(parseUsage({ rate_limits: null, rate_limits_available: true })).toBeNull()

    const limits = reply['rate_limits'] as Record<string, unknown>
    const paid = parseUsage({
      rate_limits: { ...limits, extra_usage: { is_enabled: true, utilization: 12 } },
    })

    expect(paid?.extra).toEqual({ percent: 12 })
  })
})
