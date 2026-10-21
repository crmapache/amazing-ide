import type { FileFailure, FileVersion } from './fs'

/**
 * Картинки, которые просмотр Markdown показывает из проекта, - что Chromium рисует в
 * <img>, с типом для data URL. Главный процесс читает только их (по расширению
 * настоящего файла), окно по ним узнаёт ссылку на картинку. Map, а не объект: имя
 * `x.constructor` не найдёт тип в прототипе.
 */
export const PREVIEW_IMAGE_TYPES: ReadonlyMap<string, string> = new Map([
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['gif', 'image/gif'],
  ['webp', 'image/webp'],
  ['avif', 'image/avif'],
  ['bmp', 'image/bmp'],
  ['ico', 'image/x-icon'],
  ['svg', 'image/svg+xml'],
])

/**
 * Картинка проекта для просмотра Markdown. image - data URL, версия файла (окно
 * присылает её следующим чтением, и тот же файл отвечает unchanged, не пересылая байты)
 * и настоящий путь от корня, если файл - ссылка внутри проекта: по нему окно видит его
 * правку. Остальное - почему картинки нет: просмотр пишет причину на её месте.
 */
export type ProjectImageRead =
  | { kind: 'image'; data: string; version: FileVersion; realPath: string | null }
  | { kind: 'unchanged' }
  | { kind: 'missing' }
  | { kind: 'notImage' }
  | { kind: 'tooLarge'; size: number; limit: number }
  | { kind: 'failed'; reason: FileFailure }

/**
 * Картинка с сайта для просмотра Markdown, которую человек сам попросил показать.
 * image - data URL; missing - сайт ответил ошибкой; notImage - пришла не картинка;
 * failed - сеть, срок ожидания или адрес не https.
 */
export type WebImageRead =
  | { kind: 'image'; data: string }
  | { kind: 'missing' }
  | { kind: 'notImage' }
  | { kind: 'tooLarge'; size: number; limit: number }
  | { kind: 'failed' }
