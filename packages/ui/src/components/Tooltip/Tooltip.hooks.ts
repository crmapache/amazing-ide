import { useRef } from 'react'
import type { FocusEvent } from 'react'

/**
 * Показ и скрытие подсказки. Подсказка открывается с источником-якорем
 * (showPopover({ source })) - так position-area ставит её у элемента без
 * anchor-name. Задержку появления держит CSS, здесь только «показать сейчас».
 */
export const useTooltip = () => {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)

  const show = () => {
    const tooltip = tooltipRef.current
    const anchor = anchorRef.current

    if (!tooltip || !anchor || tooltip.matches(':popover-open')) return
    tooltip.showPopover({ source: anchor })
  }

  const hide = () => {
    const tooltip = tooltipRef.current

    if (tooltip?.matches(':popover-open')) tooltip.hidePopover()
  }

  // Фокус мышью подсказку не показывает: она нужна тому, кто идёт по Tab.
  const handleFocus = (event: FocusEvent<HTMLSpanElement>) => {
    if (event.target.matches(':focus-visible')) show()
  }

  return {
    anchorRef,
    tooltipRef,
    handlers: {
      onPointerEnter: show,
      onPointerLeave: hide,
      onPointerDown: hide,
      onFocus: handleFocus,
      onBlur: hide,
    },
  }
}
