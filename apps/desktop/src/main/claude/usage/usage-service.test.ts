import { it, vi, expect, describe, beforeEach } from 'vitest'

import type { CliProcess } from '../cli/cli-process'
import { probeUsage } from './usage-probe'
import { UsageService } from './usage-service'

vi.mock('./usage-probe', () => ({ probeUsage: vi.fn() }))

const windows = (percent: number) => ({
  rate_limits: {
    limits: [{ group: 'session', percent, resets_at: '2026-10-18T01:20:00Z', severity: 'normal' }],
  },
})

/** Процесс разговора, который отвечает на get_usage. */
const liveProcess = (percent: number) =>
  ({ control: vi.fn(() => Promise.resolve(windows(percent))) }) as unknown as CliProcess

const makeService = (live: CliProcess | null = null) =>
  new UsageService({
    cli: () =>
      Promise.resolve({
        binary: 'claude',
        env: {},
        features: {
          manualMode: true,
          allowSkipPermissions: true,
          safeMode: true,
        },
      }),
    drawerOf: (id) => (id === '' ? null : id === '0123456789abcdef' ? '/d/s-1' : undefined),
    liveProcess: () => live,
    dir: '/data/claude-accounts',
    onChange: () => undefined,
  })

const percentOf = (service: UsageService, id: string) =>
  service.view[id]?.windows[0]?.percent ?? null

beforeEach(() => vi.mocked(probeUsage).mockReset())

describe('лимиты аккаунтов', () => {
  it('без живого разговора - свой процесс, и не чаще своего шага', async () => {
    vi.mocked(probeUsage).mockResolvedValue({
      parsed: {
        windows: [{ group: 'session', model: '', percent: 40, resetsAt: null, severity: '' }],
        extra: null,
        fromServer: true,
      },
      fetchedAt: Date.now(),
    })

    const service = makeService()

    await service.refresh(['0123456789abcdef'])
    await service.refresh(['0123456789abcdef'])

    expect(probeUsage).toHaveBeenCalledTimes(1)
    expect(vi.mocked(probeUsage).mock.calls[0]?.[1]).toBe('/d/s-1')
    expect(percentOf(service, '0123456789abcdef')).toBe(40)
  })

  it('процесс, который сделал ход, отвечает сам - свой процесс не нужен', async () => {
    const live = liveProcess(75)
    const service = makeService(live)

    service.fromProcess('', live)
    await vi.waitFor(() => expect(percentOf(service, '')).toBe(75))
    await service.refresh([''])

    expect(probeUsage).not.toHaveBeenCalled()
  })

  it('отставший ответ не перекрывает более свежий', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })

    const live = { current: liveProcess(80) as CliProcess | null }
    const service = new UsageService({
      cli: () =>
        Promise.resolve({
          binary: 'claude',
          env: {},
          features: {
            manualMode: true,
            allowSkipPermissions: true,
            safeMode: true,
          },
        }),
      drawerOf: () => null,
      liveProcess: () => live.current,
      dir: '/data/claude-accounts',
      onChange: () => undefined,
    })

    service.fromProcess('', live.current as CliProcess)
    await vi.waitFor(() => expect(percentOf(service, '')).toBe(80))

    // Разговор уснул; свой процесс отвечает из кэша получасовой давности.
    live.current = null
    vi.setSystemTime(Date.now() + 3 * 60 * 1000)
    vi.mocked(probeUsage).mockResolvedValue({
      parsed: {
        windows: [{ group: 'session', model: '', percent: 10, resetsAt: null, severity: '' }],
        extra: null,
        fromServer: false,
      },
      fetchedAt: Date.now() - 30 * 60 * 1000,
    })
    await service.refresh([''])

    expect(probeUsage).toHaveBeenCalledTimes(1)
    expect(percentOf(service, '')).toBe(80)
    vi.useRealTimers()
  })

  it('чужой id - ничего не спрашивается', async () => {
    await makeService().refresh(['ffffffffffffffff'])

    expect(probeUsage).not.toHaveBeenCalled()
  })
})
