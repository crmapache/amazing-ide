import { open } from 'node:fs/promises'

import { NEWLINE } from '../history/history.constants'
import { READ_CHUNK_BYTES } from './search.constants'

/**
 * Прочитать файл с байта from построчно и вернуть, где кончилась последняя целая строка.
 * Байтами, а не через декодер: ответ - смещение в байтах, а CLI пишет файл, пока мы его
 * читаем, и последняя строка может быть недописана - она останется следующему чтению,
 * которое начнётся ровно здесь. Кусками: по байту тяжёлый проект читался бы секунды, а
 * между кусками главный процесс успевает ответить окну.
 */
export const readLinesFrom = async (
  file: string,
  from: number,
  onLine: (line: string) => void,
): Promise<number> => {
  const handle = await open(file, 'r')

  try {
    const chunk = Buffer.alloc(READ_CHUNK_BYTES)
    let position = from
    let consumed = from
    let pending: Buffer[] = []

    for (;;) {
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, position)

      if (bytesRead === 0) break

      position += bytesRead

      let start = 0

      for (let index = chunk.indexOf(NEWLINE, 0); index !== -1 && index < bytesRead;) {
        const piece = chunk.subarray(start, index)
        const line = pending.length > 0 ? Buffer.concat([...pending, piece]) : piece

        consumed += line.length + 1
        pending = []
        onLine(line.toString('utf8'))
        start = index + 1
        index = chunk.indexOf(NEWLINE, start)
      }

      // Хвост куска - начало строки, которая кончится в следующем: копия, буфер переиспользуется.
      if (start < bytesRead) pending.push(Buffer.from(chunk.subarray(start, bytesRead)))
    }

    return consumed
  } finally {
    await handle.close()
  }
}
