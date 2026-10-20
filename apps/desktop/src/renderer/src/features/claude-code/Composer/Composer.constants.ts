import type { LucideIcon } from 'lucide-react'
import { File, Folder, SquareSlash, CornerDownRight } from 'lucide-react'

import type { FitStep } from '../composer-fit.utils'
import type { SuggestRow } from '../suggestions.types'

/** Значок строки подсказки по её виду. */
export const SUGGEST_ICONS: Record<SuggestRow['kind'], LucideIcon> = {
  command: SquareSlash,
  value: CornerDownRight,
  file: File,
  folder: Folder,
}

/** Отрезки шкалы контекста: пять по 20% - читается, сколько осталось, без цифры. */
export const CONTEXT_SEGMENTS = [0, 1, 2, 3, 4] as const

/** Пустая история отправленного - один и тот же объект: селектор не будит перерисовку. */
export const NO_SENT: readonly never[] = []

/** Квадратные кнопки ряда, которые поле разговора может отдать на узкой панели. */
export const ROW_SQUARES: ReadonlySet<FitStep> = new Set(['slash', 'search'])
