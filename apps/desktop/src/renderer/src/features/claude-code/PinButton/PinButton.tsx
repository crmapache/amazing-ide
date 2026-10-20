import { Pin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@amazing-ide/ui/IconButton'

import { PIN_LIMIT } from '../pins.constants'
import { usePins, usePinsStore } from '../pins.store'
import type { PinButtonProps } from './PinButton.types'

/**
 * Булавка в углу карточки - одна на своё сообщение и на ответ. Закреплённое - нажатая
 * кнопка (её видно и с экрана, где полки нет). Полная полка гасит булавки остального, но
 * не прячет: подсказка говорит, что сначала надо открепить, - до нажатия, а не после.
 */
export const PinButton = ({ conversationId, itemId }: PinButtonProps) => {
  const { t } = useTranslation()
  const pins = usePins(conversationId)
  const toggle = usePinsStore((store) => store.toggle)
  const isPinned = pins.includes(itemId)
  const isCrowded = !isPinned && pins.length >= PIN_LIMIT
  const label = isPinned
    ? t('claudeCode.pins.remove')
    : isCrowded
      ? t('claudeCode.pins.crowded')
      : t('claudeCode.pins.add')

  const handlePin = () => toggle(conversationId, itemId)

  return (
    <IconButton
      icon={Pin}
      size="sm"
      label={label}
      active={isPinned}
      aria-disabled={isCrowded || undefined}
      onClick={handlePin}
    />
  )
}
