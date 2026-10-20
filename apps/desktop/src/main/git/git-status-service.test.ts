import { it, vi, expect, describe } from 'vitest'

import type { GitStatus } from '@shared/git'

import { GitStatusService } from './git-status-service'
import type { GitStatusReader } from './git-status-service'

const statusWith = (files: GitStatus['files'], folders: GitStatus['folders'] = {}): GitStatus => ({
  files,
  folders,
  changedFolders: {},
  truncated: false,
  ignoreCase: false,
})

/** Чтение без git: проект в корне репозитория, статусы - по очереди из списка. */
const fakeReader = (...statuses: (GitStatus | null)[]) => {
  const scope = vi.fn<GitStatusReader['scope']>(() =>
    Promise.resolve({ prefix: '', ignoreCase: false }),
  )
  const status = vi.fn<GitStatusReader['status']>(() => Promise.resolve(statuses.shift() ?? null))

  return { scope, status }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('GitStatusService', () => {
  it('рассылает статус, только когда он стал другим', async () => {
    const onStatus = vi.fn()
    const reader = fakeReader(
      statusWith({ 'a.ts': 'modified' }),
      statusWith({ 'a.ts': 'modified' }),
      statusWith({}),
    )
    const service = new GitStatusService(onStatus, reader)

    await service.get('p1', '/repo')
    await service.get('p1', '/repo')
    await service.get('p1', '/repo')

    expect(reader.status).toHaveBeenCalledTimes(3)
    expect(onStatus.mock.calls).toEqual([
      ['p1', statusWith({ 'a.ts': 'modified' })],
      ['p1', statusWith({})],
    ])
  })

  it('изменения на диске не читают проект, о котором окно не спрашивало', () => {
    const reader = fakeReader()
    const service = new GitStatusService(vi.fn(), reader)

    service.changed('p1', { git: true, paths: null })

    expect(reader.scope).not.toHaveBeenCalled()
    expect(reader.status).not.toHaveBeenCalled()
  })

  it('изменения только внутри игнорируемого статус не перечитывают', async () => {
    const ignored = statusWith({ 'debug.log': 'ignored' }, { out: 'ignored' })
    const reader = fakeReader(ignored, ignored)
    const service = new GitStatusService(vi.fn(), reader)

    await service.get('p1', '/repo')
    service.changed('p1', { git: false, paths: ['out/bundle.js', 'debug.log'] })
    await settle()
    expect(reader.status).toHaveBeenCalledTimes(1)

    service.changed('p1', { git: false, paths: ['out/bundle.js', 'src/app.ts'] })
    await settle()
    expect(reader.status).toHaveBeenCalledTimes(2)
  })

  it('место в репозитории узнаётся один раз и заново - после изменений в .git', async () => {
    const reader = fakeReader()
    const service = new GitStatusService(vi.fn(), reader)

    await service.get('p1', '/repo')
    service.changed('p1', { git: false, paths: ['src/app.ts'] })
    await settle()
    expect(reader.scope).toHaveBeenCalledTimes(1)

    service.changed('p1', { git: true, paths: [] })
    await settle()
    expect(reader.scope).toHaveBeenCalledTimes(2)
  })

  it('не репозиторий - статус null без чтения git status', async () => {
    const reader = fakeReader()

    reader.scope.mockResolvedValue(null)

    expect(await new GitStatusService(vi.fn(), reader).get('p1', '/plain')).toBeNull()
    expect(reader.status).not.toHaveBeenCalled()
  })

  it('закрытый во время чтения проект окну не рассылается', async () => {
    const onStatus = vi.fn()
    let finish: (status: GitStatus) => void = () => undefined
    const service = new GitStatusService(onStatus, {
      scope: () => Promise.resolve({ prefix: '', ignoreCase: false }),
      status: () => new Promise((resolve) => (finish = resolve)),
    })
    const pending = service.get('p1', '/repo')

    await settle()
    service.forget('p1')
    finish(statusWith({}))
    await pending

    expect(onStatus).not.toHaveBeenCalled()
  })
})
