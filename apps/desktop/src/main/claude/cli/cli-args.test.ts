import { it, expect, describe } from 'vitest'

import { buildLaunchArgs } from './cli-args'

const features = {
  manualMode: true,
  allowSkipPermissions: false,
  safeMode: true,
  settingSources: true,
}
const base = {
  sessionId: 'new',
  model: null,
  effort: null,
  permissionMode: 'default' as const,
  fork: null,
  settingSources: 'all' as const,
}

/** Значение флага в аргументах. */
const valueOf = (args: string[], flag: string) => args[args.indexOf(flag) + 1]

describe('аргументы запуска', () => {
  it('новый разговор - с нашим id, продолженный - --resume', () => {
    expect(valueOf(buildLaunchArgs({ ...base, resume: false }, features), '--session-id')).toBe(
      'new',
    )
    expect(valueOf(buildLaunchArgs({ ...base, resume: true }, features), '--resume')).toBe('new')
  })

  it('нерождённый форк - от источника до строки, под нашим id', () => {
    const args = buildLaunchArgs(
      { ...base, resume: false, fork: { sourceSessionId: 'src', at: 'line' } },
      features,
    )

    expect(valueOf(args, '--resume')).toBe('src')
    expect(args).toContain('--fork-session')
    expect(valueOf(args, '--session-id')).toBe('new')
    expect(valueOf(args, '--resume-session-at')).toBe('line')
  })

  it('родившийся форк продолжается своим транскриптом', () => {
    const args = buildLaunchArgs(
      { ...base, resume: true, fork: { sourceSessionId: 'src', at: 'line' } },
      features,
    )

    expect(valueOf(args, '--resume')).toBe('new')
    expect(args).not.toContain('--fork-session')
  })

  it('источники настроек: «все» - строка запуска прежняя, остальное - словами CLI', () => {
    const launch = (settingSources: 'all' | 'noLocal' | 'user') =>
      buildLaunchArgs({ ...base, resume: false, settingSources }, features)

    expect(launch('all')).not.toContain('--setting-sources')
    expect(valueOf(launch('noLocal'), '--setting-sources')).toBe('user,project')
    expect(valueOf(launch('user'), '--setting-sources')).toBe('user')
  })

  it('CLI без флага слоёв его не получает: иначе он не стартовал бы вовсе', () => {
    const args = buildLaunchArgs(
      { ...base, resume: false, settingSources: 'user' },
      { ...features, settingSources: false },
    )

    expect(args).not.toContain('--setting-sources')
  })
})
