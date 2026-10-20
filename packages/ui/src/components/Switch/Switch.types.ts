export type SwitchProps = {
  /** Что включает переключатель: подпись строки слева. */
  label: string
  /** Пояснение под подписью мельче: что изменится. */
  description?: string | undefined
  checked: boolean
  disabled?: boolean | undefined
  onChange: (checked: boolean) => void
}
