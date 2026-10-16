import type { ReactNode } from 'react'

export type DialogProps = {
  open: boolean
  title: string
  /** Поле и подсказки. Enter в поле отправляет форму - как кнопка подтверждения. */
  children: ReactNode
  /** Кнопки справа внизу. Подтверждение - Button с type="submit". */
  actions: ReactNode
  onSubmit: () => void
  /** Закрыли без подтверждения: Esc, «Отмена». */
  onClose: () => void
}
