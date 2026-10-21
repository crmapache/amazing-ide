import { createHash } from 'node:crypto'
import type { BigIntStats } from 'node:fs'
import { sep, relative, isAbsolute } from 'node:path'

import type { TextHash, FileFailure, FileVersion } from '@shared/fs'

import { resolveInsideRoot } from './project-paths'
import { UTF8_BOM, DENIED_CODES, BINARY_SNIFF_BYTES } from './text-file.constants'

/** Версия файла (shared/fs FileVersion) из его сведений. */
export const versionOf = (info: BigIntStats): FileVersion =>
  `${info.ino}:${info.mtimeNs}:${info.ctimeNs}:${info.size}`

/** Отпечаток текста (shared/fs TextHash): одинаковый у окна и главного процесса. */
export const hashText = (text: string): TextHash =>
  createHash('sha256').update(text, 'utf8').digest('hex')

export const errorCode = (error: unknown): string =>
  error instanceof Error && 'code' in error ? String(error.code) : ''

/** Отказ словами для окна; подробности - в журнал. */
export const failureOf = (error: unknown, path: string): FileFailure => {
  if (DENIED_CODES.has(errorCode(error))) return 'denied'

  console.warn(`[fs] ${path}:`, error)

  return 'unknown'
}

/** Абсолютный путь файла проекта; путь окна за корень - ошибка, а не чтение. */
export const insideRoot = (rootPath: string, relativePath: string): string => {
  const absolute = resolveInsideRoot(rootPath, relativePath)

  if (absolute === null) throw new Error(`Путь выходит за пределы проекта: ${relativePath}`)

  return absolute
}

/** Путь от корня до настоящего файла через «/» или null, если файл за корнем. */
export const relativeInside = (realRoot: string, realPath: string): string | null => {
  const fromRoot = relative(realRoot, realPath)

  if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) return null

  return fromRoot.split(sep).join('/')
}

/**
 * Байты файла - текстом. Ноль в начале или не UTF-8 - не текст: показать его словами
 * нельзя, а сохранённый обратно он испортился бы. Метка BOM снимается и запоминается.
 */
export const decodeText = (bytes: Buffer): { text: string; bom: boolean } | null => {
  if (bytes.subarray(0, BINARY_SNIFF_BYTES).includes(0)) return null

  const bom = bytes.subarray(0, UTF8_BOM.length).equals(UTF8_BOM)

  try {
    const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })

    return { text: decoder.decode(bom ? bytes.subarray(UTF8_BOM.length) : bytes), bom }
  } catch {
    return null
  }
}

export const encodeText = (text: string, bom: boolean): Buffer => {
  const bytes = Buffer.from(text, 'utf8')

  return bom ? Buffer.concat([UTF8_BOM, bytes]) : bytes
}
