import { it, expect, describe } from 'vitest'

import type { UsageWindow, AccountUsage } from '@shared/claude-usage'

import { HOUR_MS, MINUTE_MS } from './claude.constants'
import {
  usageTone,
  busiestWindow,
  windowPercent,
  formatRemaining,
  availableAgainAt,
} from './usage.utils'

const NOW = Date.parse('2026-10-17T22:00:00Z')

const window = (change: Partial<UsageWindow>): UsageWindow => ({
  group: 'session',
  model: '',
  percent: 0,
  resetsAt: NOW + HOUR_MS,
  severity: 'normal',
  ...change,
})

const usage = (windows: UsageWindow[], extra: AccountUsage['extra'] = null): AccountUsage => ({
  windows,
  extra,
  fetchedAt: NOW,
})

describe('лимиты на экране', () => {
  it('окно, чей сброс прошёл, - пустое, а не вчерашнее', () => {
    expect(windowPercent(window({ percent: 80 }), NOW)).toBe(80)
    expect(windowPercent(window({ percent: 80, resetsAt: NOW - 1 }), NOW)).toBe(0)
  })

  it('тон - уровень сервера, а без него - процент', () => {
    expect(usageTone(20, 'normal')).toBe('success')
    expect(usageTone(20, 'warning')).toBe('warning')
    expect(usageTone(75, '')).toBe('warning')
    expect(usageTone(95, 'normal')).toBe('danger')
  })

  it('сколько до сброса - днями, часами, минутами', () => {
    expect(formatRemaining(3 * 24 * HOUR_MS + 4 * HOUR_MS + 5 * MINUTE_MS)).toBe('3d 4h')
    expect(formatRemaining(2 * HOUR_MS + 5 * MINUTE_MS)).toBe('2h 05m')
    expect(formatRemaining(12 * MINUTE_MS)).toBe('12m')
    expect(formatRemaining(10_000)).toBe('1m')
  })

  it('на индикатор - самое занятое окно тарифа, неделя модели не в счёт', () => {
    const picked = busiestWindow(
      usage([
        window({ percent: 40 }),
        window({ group: 'weekly', percent: 70 }),
        window({ group: 'weekly', model: 'Fable', percent: 99 }),
      ]),
      NOW,
    )

    expect(picked?.percent).toBe(70)
  })

  it('снова доступен - по позднему из упёршихся окон; при доплате ждать нечего', () => {
    const full = usage([
      window({ percent: 100, resetsAt: NOW + HOUR_MS }),
      window({ group: 'weekly', percent: 100, resetsAt: NOW + 5 * HOUR_MS }),
    ])

    expect(availableAgainAt(full, NOW)).toBe(NOW + 5 * HOUR_MS)
    expect(availableAgainAt({ ...full, extra: { percent: 3 } }, NOW)).toBeNull()
    expect(availableAgainAt(usage([window({ percent: 50 })]), NOW)).toBeNull()
  })
})
