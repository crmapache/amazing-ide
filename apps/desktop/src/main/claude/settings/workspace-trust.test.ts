import { rm, mkdtemp, symlink, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it, expect, describe } from 'vitest'

import { withParents, WorkspaceTrust, trustedInConfig } from './workspace-trust'

describe('доверие к папке', () => {
  it('доверие к родителю распространяется на вложенные папки', () => {
    const config = { projects: { '/work': { hasTrustDialogAccepted: true } } }

    expect(trustedInConfig(config, '/work/app')).toBe(true)
    expect(trustedInConfig(config, '/other')).toBe(false)
    expect(trustedInConfig({ projects: { '/work': {} } }, '/work')).toBe(false)
    expect(withParents('/a/b')).toEqual(['/a/b', '/a', '/'])
  })

  it('папка, открытая через ссылку, доверена по настоящему пути', async () => {
    const real = await realpath(await mkdtemp(join(tmpdir(), 'trust-')))
    const link = `${real}-link`

    await symlink(real, link)

    try {
      const trust = new WorkspaceTrust([real], () => undefined)

      await expect(trust.isTrusted(link)).resolves.toBe(true)
    } finally {
      await rm(link)
      await rm(real, { recursive: true })
    }
  })
})
