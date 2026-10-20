import { open, stat, mkdir, unlink, readdir } from 'node:fs/promises'
import { join, extname } from 'node:path'

import { PASTED_NAME_MAX, PASTED_MAX_AGE_MS } from './composer.constants'

/**
 * Вставленное из буфера - на диск. Скриншот и документ приходят в окно байтами без
 * пути, а чипу нужен путь: по нему файл копируется, открывается и называется модели.
 * Каталог выбирает IDE, от окна приходит только имя - и то чистится.
 */

/** Имя из буфера - только буквы, цифры и простая пунктуация; пусто - имя по времени. */
export const pastedName = (raw: string, now: Date): string => {
  const cleaned = raw
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}._ -]/gu, '_')
    .replace(/^[.\s]+/, '')
    .trim()
    .slice(-PASTED_NAME_MAX)

  if (cleaned) return cleaned

  const stamp = now.toISOString().replace(/[:.]/g, '-').replace('T', ' ').slice(0, 19)

  return `Pasted ${stamp}.png`
}

/** Тот же файл с номером перед расширением: «shot.png» → «shot 2.png». */
const numbered = (name: string, index: number) => {
  if (index === 1) return name

  const extension = extname(name)

  return `${name.slice(0, name.length - extension.length)} ${index}${extension}`
}

/**
 * Записать байты под свободным именем. Имя занимается в момент создания (`wx`), а не
 * только проверяется: файлы одной вставки пишутся параллельно, и проверка «есть ли»
 * пустила бы двоих под одно имя. Не вышло записать - занятый пустой файл удаляется.
 */
export const writePasted = async (dir: string, name: string, bytes: Buffer): Promise<string> => {
  await mkdir(dir, { recursive: true })

  for (let index = 1; ; index += 1) {
    const path = join(dir, numbered(name, index))
    const file = await open(path, 'wx').catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'EEXIST') return null

      throw error
    })

    if (!file) continue

    try {
      await file.writeFile(bytes)

      return path
    } catch (error) {
      await unlink(path).catch(() => undefined)

      throw error
    } finally {
      await file.close()
    }
  }
}

/**
 * Удалить вставленное старше срока. Метётся при вставке, а не по таймеру: каталог
 * важен только тогда, когда в него что-то кладут.
 */
export const sweepPasted = async (dir: string, now: number): Promise<void> => {
  const names = await readdir(dir).catch(() => [])

  await Promise.all(
    names.map(async (name) => {
      const path = join(dir, name)
      const info = await stat(path).catch(() => null)

      if (info?.isFile() && now - info.mtimeMs > PASTED_MAX_AGE_MS) {
        await unlink(path).catch(() => undefined)
      }
    }),
  )
}
