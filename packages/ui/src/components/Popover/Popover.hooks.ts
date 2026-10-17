import { useId, useRef, useState, useEffect, useCallback } from 'react'
import type { ToggleEvent } from 'react'

/**
 * Связка кнопки и всплывающей панели. Кнопке - triggerProps (открыть, закрыть,
 * aria-expanded), панели - popoverProps. Открытие, закрытие по клику мимо и по Esc
 * делает сам браузер (Popover API), здесь - состояние для отрисовки, открытие из кода
 * (сочетание клавиш) и закрытие, когда окно теряет фокус.
 */
export const usePopover = () => {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Клик в другое приложение или по рабочему столу браузер кликом мимо не считает, а
  // системное меню в этот момент закрывается - так же ведёт себя и панель.
  useEffect(() => {
    if (!isOpen) return

    const handleBlur = () => ref.current?.hidePopover()

    window.addEventListener('blur', handleBlur)

    return () => window.removeEventListener('blur', handleBlur)
  }, [isOpen])

  const open = useCallback(() => {
    if (!ref.current?.matches(':popover-open')) ref.current?.showPopover()
  }, [])

  const close = useCallback(() => ref.current?.hidePopover(), [])

  const handleToggle = useCallback((event: ToggleEvent<HTMLDivElement>) => {
    setIsOpen(event.newState === 'open')
  }, [])

  return {
    isOpen,
    open,
    close,
    triggerProps: { popoverTarget: id, 'aria-expanded': isOpen },
    popoverProps: { id, ref, onToggle: handleToggle },
  }
}
