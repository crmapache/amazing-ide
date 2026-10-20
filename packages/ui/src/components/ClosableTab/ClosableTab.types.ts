import type { Ref, ReactNode, MouseEventHandler } from 'react'

/**
 * fill - вкладки делят ряд поровну (проекты); fit - по подписи до потолка; grow -
 * полоса в несколько рядов (разговоры): вкладка растёт в свободный конец ряда до своей
 * полной подписи, подпись режется посередине с последним словом на месте, а подсказка
 * всплывает, только когда подпись обрезана.
 */
export type ClosableTabWidth = 'fill' | 'fit' | 'grow'

/**
 * Цвет группы - полоска сверху и заливка выбранной вкладки: --color-tab-group-0 ... 5.
 * Идентификационный, как цвет значка проекта: вкладки одной группы узнаются по нему.
 */
export type ClosableTabTone = 0 | 1 | 2 | 3 | 4 | 5

/** Вкладка позвала человека: успех, внимание, ошибка - цвет повода (роли состояний). */
export type ClosableTabCall = 'success' | 'attention' | 'danger'

export type ClosableTabProps = {
  label: string
  /** Подсказка над вкладкой: полный путь проекта, полный заголовок разговора. */
  hint: string
  active: boolean
  /** Подпись крестика для скринридера и подсказки: «Close amazing-ide». */
  closeLabel: string
  /** Перед подписью: точка состояния, знак форка. */
  leading?: ReactNode | undefined
  width?: ClosableTabWidth | undefined
  tone?: ClosableTabTone | undefined
  /** Отступ слева ступенями: глубина форка в группе. */
  indent?: number | undefined
  /** Первая вкладка группы: зазор от соседней группы слева. */
  groupStart?: boolean | undefined
  /** Вкладка позвала - светится цветом повода, пока её не откроют. */
  call?: ClosableTabCall | null | undefined
  /** Свечение замирает (засыпание без человека рядом): цвет остаётся, движения нет. */
  calm?: boolean | undefined
  /** Вкладку несут рукой: поднята над соседями, без задержки за курсором. */
  lifted?: boolean | undefined
  /** Сдвиг от своего места на время жеста (перетаскивание), в пикселях. */
  offset?: { x: number; y: number } | null | undefined
  /** Поле на месте подписи (переименование): пока оно есть, подпись не рисуется. */
  editor?: ReactNode | undefined
  ref?: Ref<HTMLDivElement> | undefined
  onMouseDown?: MouseEventHandler<HTMLDivElement> | undefined
  onDoubleClick?: MouseEventHandler<HTMLDivElement> | undefined
  onContextMenu?: MouseEventHandler<HTMLDivElement> | undefined
  onActivate: () => void
  onClose: () => void
}
