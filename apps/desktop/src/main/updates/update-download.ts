import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { createWriteStream } from 'node:fs'
import { rm } from 'node:fs/promises'

import { net } from 'electron'

import { UpdateError } from './update-error'
import { parseUpdateManifest } from './update-manifest'
import type { UpdateAsset, UpdateManifest } from './update-manifest'
import { FEED_TIMEOUT_MS, DOWNLOAD_TIMEOUT_MS } from './update.constants'

export const fetchUpdateManifest = async (url: string): Promise<UpdateManifest> => {
  const response = await net.fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`Манифест обновлений: HTTP ${response.status}`)

  return parseUpdateManifest(await response.json())
}

const closeFile = (file: ReturnType<typeof createWriteStream>) =>
  new Promise<void>((resolve, reject) => {
    file.end((error?: Error | null) => (error ? reject(error) : resolve()))
  })

/**
 * Качает сборку в файл и сверяет размер и SHA-512 с манифестом. Не сошлось -
 * файл удаляется, и дальше дело не идёт. Это защита от оборванной и битой
 * загрузки; от подменённой защищает проверка подписи после распаковки.
 */
export const downloadAsset = async (
  asset: UpdateAsset,
  destination: string,
  onProgress: (fraction: number) => void,
): Promise<void> => {
  const response = await net
    .fetch(asset.url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) })
    .catch((error: unknown) => {
      throw new UpdateError('download', `Загрузка обновления: ${String(error)}`)
    })

  if (!response.ok || response.body === null) {
    throw new UpdateError('download', `Загрузка обновления: HTTP ${response.status}`)
  }

  const hash = createHash('sha512')
  const file = createWriteStream(destination)
  let received = 0

  try {
    for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
      hash.update(chunk)
      received += chunk.byteLength
      if (!file.write(chunk)) await once(file, 'drain')
      onProgress(Math.min(received / asset.size, 1))
    }

    await closeFile(file)

    if (received !== asset.size) {
      throw new UpdateError(
        'integrity',
        `Загрузка обновления: получено ${received} байт из ${asset.size}`,
      )
    }

    if (hash.digest('base64') !== asset.sha512) {
      throw new UpdateError('integrity', 'Загрузка обновления: контрольная сумма не совпала')
    }
  } catch (error) {
    file.destroy()
    await rm(destination, { force: true })
    throw error
  }
}
