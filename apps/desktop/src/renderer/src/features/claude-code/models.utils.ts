import type { ModelInfo } from '@shared/claude'

import type { PickableModel } from './models.types'
import { FALLBACK_MODELS, DEFAULT_MODEL_VALUE } from './ComposerStatus/ComposerStatus.constants'

/**
 * Модели для меню: каталог CLI (пока его нет - запасной), без «по умолчанию» - в панели
 * это отдельный пункт; дальше свои, добавленные руками, если их нет в каталоге. Один
 * список для MODEL под полем и для новых вкладок: в чём можно работать, с того можно
 * и начинать.
 */
export const pickableModels = (
  catalog: readonly ModelInfo[],
  custom: readonly string[],
): PickableModel[] => {
  const known = (catalog.length > 0 ? catalog : FALLBACK_MODELS).filter(
    (model) => model.value !== DEFAULT_MODEL_VALUE,
  )
  const values = new Set(known.map((model) => model.value))

  return [
    ...known.map((model) => ({ ...model, custom: false })),
    ...custom
      .filter((name) => !values.has(name))
      .map((name) => ({ value: name, displayName: name, description: '', custom: true })),
  ]
}

/** Имя модели для подписи: из каталога, иначе как есть (своя модель - и есть имя). */
export const modelLabel = (value: string, models: readonly PickableModel[]): string =>
  models.find((model) => model.value === value)?.displayName ?? value
