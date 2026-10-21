import { it, vi, expect, describe } from 'vitest'

import { readWebImage } from './web-image'
import { WEB_IMAGE_MAX_BYTES } from './web-image.constants'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47])

/** Ответ сайта; url - куда в итоге привела переадресация. */
const respond = (
  body: ConstructorParameters<typeof Response>[0],
  init: ResponseInit & { url?: string } = {},
) => {
  const response = new Response(body, init)

  if (init.url) Object.defineProperty(response, 'url', { value: init.url })

  return response
}

const fetchWith = (response: Response) => vi.fn(() => Promise.resolve(response))

describe('readWebImage', () => {
  it('картинка - data URL с типом из ответа', async () => {
    const fetchImage = fetchWith(respond(PNG, { headers: { 'content-type': 'image/png' } }))

    expect(await readWebImage('https://img.example/a.png', fetchImage)).toEqual({
      kind: 'image',
      data: `data:image/png;base64,${Buffer.from(PNG).toString('base64')}`,
    })
    expect(fetchImage).toHaveBeenCalledWith(
      'https://img.example/a.png',
      expect.objectContaining({ credentials: 'omit' }),
    )
  })

  it('не https - не ходит в сеть вовсе', async () => {
    const fetchImage = fetchWith(respond(PNG))

    expect(await readWebImage('http://img.example/a.png', fetchImage)).toEqual({ kind: 'failed' })
    expect(await readWebImage('file:///etc/passwd', fetchImage)).toEqual({ kind: 'failed' })
    expect(fetchImage).not.toHaveBeenCalled()
  })

  it('переадресация на http - отказ', async () => {
    const fetchImage = fetchWith(
      respond(PNG, { headers: { 'content-type': 'image/png' }, url: 'http://evil.example/a.png' }),
    )

    expect(await readWebImage('https://img.example/a.png', fetchImage)).toEqual({ kind: 'failed' })
  })

  it('ошибка сайта - missing, не картинка - notImage, тип с мусором - notImage', async () => {
    expect(await readWebImage('https://x/a', fetchWith(respond(null, { status: 404 })))).toEqual({
      kind: 'missing',
    })
    expect(
      await readWebImage(
        'https://x/a',
        fetchWith(respond('<html>', { headers: { 'content-type': 'text/html' } })),
      ),
    ).toEqual({ kind: 'notImage' })
    expect(
      await readWebImage(
        'https://x/a',
        fetchWith(respond(PNG, { headers: { 'content-type': 'image/png,<b>' } })),
      ),
    ).toEqual({ kind: 'notImage' })
  })

  it('больше потолка - по заявленному размеру и по тому, что пришло на деле', async () => {
    const declared = respond(PNG, {
      headers: { 'content-type': 'image/png', 'content-length': String(WEB_IMAGE_MAX_BYTES + 5) },
    })
    const streamed = respond(new Uint8Array(WEB_IMAGE_MAX_BYTES + 1), {
      headers: { 'content-type': 'image/png' },
    })

    expect(await readWebImage('https://x/a', fetchWith(declared))).toEqual({
      kind: 'tooLarge',
      size: WEB_IMAGE_MAX_BYTES + 5,
      limit: WEB_IMAGE_MAX_BYTES,
    })
    expect(await readWebImage('https://x/a', fetchWith(streamed))).toMatchObject({
      kind: 'tooLarge',
    })
  })

  it('сеть упала - failed', async () => {
    const fetchImage = vi.fn(() => Promise.reject(new Error('offline')))

    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(await readWebImage('https://x/a', fetchImage)).toEqual({ kind: 'failed' })
  })
})
