import { useId, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { nextActiveIndex } from './ListBox.utils'

/**
 * Связка поля поиска и ListBox: какой вариант выделен и что делают клавиши. Полю -
 * comboboxProps и handleKeyDown (Enter отдаёт номер выделенного варианта тому, кто
 * передал onSelect), списку - listBoxProps, варианту - optionId. Поменялся
 * resetKey (новый запрос, другая вкладка) - выделение встаёт на первый вариант. Пустой
 * список не рисуют: поле тогда «свёрнуто» и ни на что не ссылается.
 */
export const useListBox = (count: number, resetKey: string) => {
  const id = useId()
  const [activeIndex, setActiveIndex] = useState(0)
  const [lastResetKey, setLastResetKey] = useState(resetKey)

  // Сброс прямо при отрисовке, а не эффектом: иначе один кадр подсвечен старый номер.
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey)
    setActiveIndex(0)
  }

  const current = count === 0 ? -1 : Math.min(activeIndex, count - 1)
  const optionId = (index: number) => `${id}-option-${index}`

  /** true - клавиша обработана списком, полю её дальше не разбирать. */
  const handleKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    onSelect: (index: number) => void,
  ): boolean => {
    if (event.key === 'Enter') {
      if (current < 0 || event.nativeEvent.isComposing) return false

      event.preventDefault()
      onSelect(current)

      return true
    }

    const next = nextActiveIndex(event.key, current, count)

    if (next === null) return false

    event.preventDefault()
    setActiveIndex(next)

    return true
  }

  return {
    activeIndex: current,
    setActiveIndex,
    optionId,
    handleKeyDown,
    listBoxProps: { id },
    comboboxProps: {
      role: 'combobox',
      'aria-controls': count > 0 ? id : undefined,
      'aria-expanded': count > 0,
      'aria-autocomplete': 'list',
      'aria-activedescendant': current < 0 ? undefined : optionId(current),
    } as const,
  }
}
