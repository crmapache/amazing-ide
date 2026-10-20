import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

import { isolatedCli } from '../accounts/isolated-cli'
import type { ClaudeCli } from '../cli/cli-locator'
import { isRecord, numberField, recordField } from '../cli/cli-messages'
import type { ParsedUsage } from './usage-parse'
import { parseUsage } from './usage-parse'
import { PROBE_TIMEOUT_MS } from './usage.constants'

/** Цифры расхода и когда их сняли с сервера (мс). */
export type UsageAnswer = { parsed: ParsedUsage; fetchedAt: number }

/** Когда CLI последний раз снял расход с сервера - его кэш в своём конфиге; нет - null. */
const cachedAt = async (configDir: string): Promise<number | null> => {
  const config = await readFile(join(configDir, '.claude.json'), 'utf8')
    .then((text) => JSON.parse(text) as unknown)
    .catch(() => null)
  const fetched = isRecord(config)
    ? numberField(recordField(config, 'cachedUsageUtilization'), 'fetchedAtMs')
    : 0

  return fetched > 0 ? fetched : null
}

/**
 * Расход аккаунта - своим процессом CLI в постоянной папке конфига аккаунта
 * (isolated-cli.ts). Папка постоянная ради кэша CLI: сервер отбил вопрос (429) - CLI
 * отвечает цифрами из своего кэша этого же аккаунта (до часа), и их возраст виден по
 * самому кэшу. null - CLI не ответил или цифр у него нет.
 */
export const probeUsage = async (
  cli: ClaudeCli,
  drawer: string | null,
  configDir: string,
): Promise<UsageAnswer | null> => {
  await mkdir(configDir, { recursive: true, mode: 0o700 })

  const process = isolatedCli(cli, drawer, configDir)

  try {
    const reply = await Promise.race([
      process.control({ subtype: 'get_usage' }),
      delay(PROBE_TIMEOUT_MS).then(() => null),
    ])
    const parsed = parseUsage(reply)

    if (!parsed) return null

    const fetchedAt = parsed.fromServer ? Date.now() : await cachedAt(configDir)

    return fetchedAt === null ? null : { parsed, fetchedAt }
  } catch {
    return null
  } finally {
    await process.stop()
  }
}
