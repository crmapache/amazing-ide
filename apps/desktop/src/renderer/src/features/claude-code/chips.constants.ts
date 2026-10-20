import type { LucideIcon } from 'lucide-react'
import { File, Image, Quote, Folder, FileCode, SquareSlash, ClipboardList } from 'lucide-react'

import type { ChipKind } from '@shared/claude-draft'

/** Длиннее имя на чипе режется посередине, расширение остаётся видно. */
export const MAX_LABEL_LENGTH = 28

/** Сколько слов цитаты и вставки видно на чипе. */
export const QUOTE_PREVIEW_WORDS = 5
export const PASTE_PREVIEW_WORDS = 7

/** Потолок подписи вставки символами: одно «слово» бывает адресом без пробелов. */
export const PASTE_PREVIEW_CHARS = 40

/** Дальше этого вставку для подписи не смотрим: подпись строится на каждую перерисовку. */
export const PASTE_SCAN_CHARS = 300

/** Подсказка чипа - напоминание: несколько коротких строк. */
export const TITLE_LINES = 5
export const TITLE_LINE_CHARS = 70
export const QUOTE_TITLE_CHARS = 400

/**
 * Больше стольких символов вставка сворачивается всегда, что бы ни стояло в настройке:
 * замер ACC - на мегабайте в поле каждая буква идёт восьмую долю секунды.
 */
export const PASTE_ALWAYS_FOLDS_CHARS = 100_000

/** Значок вида чипа - тот же язык, что у подсказки «@» и дерева файлов. */
export const CHIP_ICONS: Record<ChipKind, LucideIcon> = {
  file: File,
  img: Image,
  dir: Folder,
  cmd: SquareSlash,
  ref: FileCode,
  quote: Quote,
  paste: ClipboardList,
}
