import { useId, useRef, useState, useCallback } from 'react'
import type { ToggleEvent } from 'react'

/**
 * Связка кнопки и всплывающей панели. Кнопке - triggerProps (открыть, закрыть,
 * aria-expanded), панели - popoverProps. Открытие, закрытие по клику мимо и по Esc
 * делает сам браузер (Popover API), здесь только состояние для отрисовки.
 */
export const usePopover = () => {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const close = useCallback(() => ref.current?.hidePopover(), [])

  const handleToggle = useCallback((event: ToggleEvent<HTMLDivElement>) => {
    setIsOpen(event.newState === 'open')
  }, [])

  return {
    isOpen,
    close,
    triggerProps: { popoverTarget: id, 'aria-expanded': isOpen },
    popoverProps: { id, ref, onToggle: handleToggle },
  }
}
