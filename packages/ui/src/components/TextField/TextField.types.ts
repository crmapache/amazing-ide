import type { Ref, InputHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'value' | 'onChange' | 'aria-label'
> & {
  label: string
  /** Подпись не видна, но остаётся для скринридера: поле поиска в меню. */
  hideLabel?: boolean | undefined
  value: string
  onChange: (value: string) => void
  /** Иконка внутри поля слева: лупа у поиска. */
  icon?: LucideIcon | undefined
  /** Что не так с введённым. Показывается под полем красным. */
  error?: string | undefined
  /** Само поле ввода: вернуть в него фокус после клика по соседней кнопке. */
  ref?: Ref<HTMLInputElement> | undefined
}
