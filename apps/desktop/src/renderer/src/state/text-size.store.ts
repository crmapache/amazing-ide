import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { TEXT_SIZE, FONT_SCALE_PROPERTY, TEXT_SIZE_STORAGE_KEY } from './text-size.constants'
import { fontScaleOf, clampTextSize, restoreTextSize, steppedTextSize } from './text-size.utils'

type TextSizeStore = {
  /** Размер текста в процентах от кеглей токенов: 100 - как нарисовано. */
  textSize: number
  setTextSize: (textSize: number) => void
  /** Соседняя ступень: ⌘+ и ⌘- из меню приложения. */
  stepTextSize: (direction: 1 | -1) => void
  resetTextSize: () => void
}

/**
 * Размер текста всей IDE (Settings → Appearance, ADR 0024). Интерфейсное состояние окна,
 * как раскладка: живёт в localStorage и читается синхронно при старте, поэтому окно сразу
 * рисуется нужным размером, без скачка после загрузки.
 */
export const useTextSizeStore = create<TextSizeStore>()(
  persist(
    (set) => ({
      textSize: TEXT_SIZE.default,
      setTextSize: (textSize) => set({ textSize: clampTextSize(textSize) }),
      stepTextSize: (direction) =>
        set((state) => ({ textSize: steppedTextSize(state.textSize, direction) })),
      resetTextSize: () => set({ textSize: TEXT_SIZE.default }),
    }),
    {
      name: TEXT_SIZE_STORAGE_KEY,
      partialize: ({ textSize }) => ({ textSize }),
      merge: (persisted, current) => ({ ...current, textSize: restoreTextSize(persisted) }),
    },
  ),
)

const appliedListeners = new Set<() => void>()

const applyTextSize = (textSize: number) => {
  document.documentElement.style.setProperty(FONT_SCALE_PROPERTY, fontScaleOf(textSize))
  appliedListeners.forEach((listener) => listener())
}

/**
 * Ставит размер текста на корень документа и дальше держит его там. Зовётся один раз
 * до первой отрисовки: токены считают от него кегли и высоты строк во всём окне, в
 * панели Claude Code и во всплывающих слоях.
 */
export const installTextSize = () => {
  applyTextSize(useTextSizeStore.getState().textSize)
  useTextSizeStore.subscribe((state, previous) => {
    if (state.textSize !== previous.textSize) applyTextSize(state.textSize)
  })
}

/**
 * Размер текста уже стоит на корне - для того, кто пишет кеглями не через CSS (редактор
 * Monaco считает буквы сам). Подписка на стор тут не годится: она могла бы сработать
 * раньше, чем корень получил новый множитель, и прочитать старый кегль. Отписка - вызов
 * возвращённой функции.
 */
export const onTextSizeApplied = (listener: () => void): (() => void) => {
  appliedListeners.add(listener)

  return () => appliedListeners.delete(listener)
}
