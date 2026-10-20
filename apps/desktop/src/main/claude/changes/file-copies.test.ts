import { rm, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it, expect, describe, afterEach, beforeEach } from 'vitest'

import { copyKey, readCopy, copiesTaken, findTurnStart, copyRecordsFrom } from './file-copies'

let dir = ''

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'copies-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true })
})

const snapshot = (messageId: string, at: string, names: string[]) =>
  JSON.stringify({
    type: 'file-history-snapshot',
    messageId,
    snapshot: {
      messageId,
      timestamp: at,
      trackedFileBackups: Object.fromEntries(names.map((name) => [name, { backupFileName: name }])),
    },
  })

const delta = (at: string, name: string | null) =>
  JSON.stringify({ type: 'file-history-delta', timestamp: at, backup: { backupFileName: name } })

const key = copyKey('/p/a.ts')

describe('копии CLI для хода', () => {
  it('не раньше начала хода, поздняя по времени побеждает, где бы ни лежала', () => {
    const lines = [
      snapshot('m0', '2026-10-15T10:00:00.000Z', [`${key}@v1`]),
      snapshot('m1', '2026-10-15T10:05:00.000Z', [`${key}@v3`]),
      // Форку CLI дописывает записи источника позже, но со старым временем.
      delta('2026-10-15T10:01:00.000Z', `${key}@v2`),
      delta('2026-10-15T10:06:00.000Z', null),
      '{"type":"user","message":"file-history-snapshot"}',
    ]

    expect(copiesTaken(lines, Date.parse('2026-10-15T10:04:00.000Z'))).toEqual(
      new Map([[key, `${key}@v3`]]),
    )
    expect(copiesTaken(lines, Date.parse('2026-10-15T10:10:00.000Z')).size).toBe(0)
  })

  it('начало хода ищется с конца, записи копий читаются от него, копия - по пути', async () => {
    const transcript = join(dir, 'conv.jsonl')
    const filler = `${JSON.stringify({ type: 'assistant', text: 'x'.repeat(5000) })}\n`
    const lines = [
      snapshot('m0', '2026-10-15T10:00:00.000Z', [`${key}@v1`]),
      filler.trim(),
      JSON.stringify({ type: 'user', uuid: 'm1' }),
      snapshot('m1', '2026-10-15T10:05:00.000Z', [`${key}@v2`]),
      filler.trim(),
    ]

    await writeFile(transcript, `${lines.join('\n')}\n`)

    const start = await findTurnStart(transcript, 'm1')

    expect(start).toBe(lines.slice(0, 2).join('\n').length + 1)
    expect(await findTurnStart(transcript, 'nope')).toBeNull()

    const records = await copyRecordsFrom(transcript, start ?? 0)

    expect(records).toEqual([lines[3]])

    const history = join(dir, 'file-history')

    await mkdir(history)
    await writeFile(join(history, `${key}@v2`), 'before\n')
    await expect(readCopy(history, copiesTaken(records, 0), '/p/a.ts')).resolves.toBe('before\n')
    await expect(readCopy(history, copiesTaken(records, 0), '/p/b.ts')).resolves.toBeNull()
  })
})
