import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

import { recordField, stringField, parseCliLine } from '../cli/cli-messages'
import { userTextOf } from '../feed/user-text'

/**
 * Картинка сообщения целиком из транскрипта, как data URL; нет - null. Файл читается
 * построчно до нужной строки: транскрипт бывает десятками мегабайт, а держать все
 * картинки разговора в памяти ради того, что откроют одну, незачем.
 */
export const readTranscriptImage = async (
  file: string,
  messageId: string,
  index: number,
): Promise<string | null> => {
  const lines = createInterface({ input: createReadStream(file, 'utf8'), crlfDelay: Infinity })

  try {
    for await (const line of lines) {
      if (!line.includes(messageId)) continue

      const message = parseCliLine(line)

      if (!message || stringField(message, 'uuid') !== messageId) continue

      const image = userTextOf(recordField(message, 'message')['content'])?.images[index]

      return image ? `data:${image.mediaType};base64,${image.data}` : null
    }
  } finally {
    lines.close()
  }

  return null
}
