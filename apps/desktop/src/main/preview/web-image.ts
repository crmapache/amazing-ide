import type { WebImageRead } from '@shared/preview-images'

import {
  IMAGE_CONTENT_TYPE,
  WEB_IMAGE_MAX_BYTES,
  WEB_IMAGE_TIMEOUT_MS,
} from './web-image.constants'

/** Запрос к сайту - fetch сеанса картинок (web-image-session.ts) или подделка в тесте. */
export type WebFetch = (url: string, init: RequestInit) => Promise<Response>

const FAILED: WebImageRead = { kind: 'failed' }

const tooLarge = (size: number): WebImageRead => ({
  kind: 'tooLarge',
  size,
  limit: WEB_IMAGE_MAX_BYTES,
})

const isHttps = (url: string): boolean => {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

/** Ответ, который не нужен, - закрыть: иначе соединение держится до сборки мусора. */
const discard = async (response: Response) => {
  await response.body?.cancel().catch(() => undefined)
}

/** Тело ответа, но не больше потолка: сайт может не назвать размер или соврать о нём. */
const readCapped = async (response: Response): Promise<Buffer | null> => {
  const reader = response.body?.getReader() as ReadableStreamDefaultReader<Uint8Array> | undefined
  const chunks: Uint8Array[] = []
  let total = 0

  if (!reader) return Buffer.alloc(0)

  for (;;) {
    const { done, value } = await reader.read()

    if (done) return Buffer.concat(chunks)

    total += value.byteLength

    if (total > WEB_IMAGE_MAX_BYTES) {
      await reader.cancel()

      return null
    }

    chunks.push(value)
  }
}

/**
 * Картинка с сайта для просмотра Markdown, которую человек сам попросил показать: окно в
 * сеть не ходит, у него в CSP только свои картинки. Только https (и после переадресации),
 * только ответ image/…, не больше потолка и не дольше срока. Отказ - видом, подробности -
 * в журнал.
 */
export const readWebImage = async (url: string, fetchImage: WebFetch): Promise<WebImageRead> => {
  if (!isHttps(url)) return FAILED

  try {
    const response = await fetchImage(url, {
      redirect: 'follow',
      credentials: 'omit',
      headers: { accept: 'image/*' },
      signal: AbortSignal.timeout(WEB_IMAGE_TIMEOUT_MS),
    })
    const type = (response.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase()
    const declared = Number(response.headers.get('content-length'))

    const refusal =
      response.url && !isHttps(response.url)
        ? FAILED
        : !response.ok
          ? { kind: 'missing' as const }
          : !type || !IMAGE_CONTENT_TYPE.test(type)
            ? { kind: 'notImage' as const }
            : declared > WEB_IMAGE_MAX_BYTES
              ? tooLarge(declared)
              : null

    if (refusal) {
      await discard(response)

      return refusal
    }

    const bytes = await readCapped(response)

    if (!bytes)
      return tooLarge(
        Number.isFinite(declared) && declared > 0 ? declared : WEB_IMAGE_MAX_BYTES + 1,
      )

    return { kind: 'image', data: `data:${type};base64,${bytes.toString('base64')}` }
  } catch (error) {
    console.warn('[preview] картинка с сайта не загрузилась:', url.slice(0, 200), error)

    return FAILED
  }
}
