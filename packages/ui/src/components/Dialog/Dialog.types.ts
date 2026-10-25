import type { ReactNode } from 'react'

/**
 * dim - окно под диалогом темнеет и размывается: важен только вопрос. clear - окно видно
 * как есть: диалог меняет то, что надо видеть в окне под ним (размер текста).
 */
export type DialogBackdrop = 'dim' | 'clear'

export type DialogProps = {
  open: boolean
  title: string
  backdrop?: DialogBackdrop | undefined
  /** Поле и подсказки. Enter в поле отправляет форму - как кнопка подтверждения. */
  children: ReactNode
  /** Кнопки справа внизу. Подтверждение - Button с type="submit". */
  actions: ReactNode
  onSubmit: () => void
  /** Закрыли без подтверждения: Esc, «Отмена». */
  onClose: () => void
}
