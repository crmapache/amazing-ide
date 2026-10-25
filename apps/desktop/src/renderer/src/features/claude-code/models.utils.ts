import type { ModelInfo } from '@shared/claude'

import { modelFamily } from './model-chip.utils'
import type { PickableModel } from './models.types'
import {
  MODEL_RANK,
  MAIN_MODELS,
  FALLBACK_MODELS,
  DEFAULT_MODEL_VALUE,
} from './ComposerStatus/ComposerStatus.constants'

/** Место модели в порядке «сильнейшая первой»; модель без семьи Claude - после всех. */
const rankOf = (model: ModelInfo): number => {
  const family = modelFamily(model.value)

  return family ? MODEL_RANK.indexOf(family) : MODEL_RANK.length
}

/**
 * Основные модели каталога - сильнейшая первой. Остальные (старые версии) остаются за ними
 * в порядке CLI: в меню они в свёрнутой группе, а сортировка по семье вытащила бы старый
 * Opus наверх и столкнула бы Haiku в группу.
 */
const strongestFirst = (models: readonly ModelInfo[]): ModelInfo[] => {
  const main = models.slice(0, MAIN_MODELS - 1)

  return [...main.sort((a, b) => rankOf(a) - rankOf(b)), ...models.slice(MAIN_MODELS - 1)]
}

/**
 * Модели для меню: каталог CLI (пока его нет - запасной), без «по умолчанию» - в панели
 * это отдельный пункт, основные - сильнейшая первой; дальше свои, добавленные руками, если
 * их нет в каталоге. Один список для MODEL под полем и для новых вкладок: в чём можно
 * работать, с того можно и начинать.
 */
export const pickableModels = (
  catalog: readonly ModelInfo[],
  custom: readonly string[],
): PickableModel[] => {
  const known = strongestFirst(
    (catalog.length > 0 ? catalog : FALLBACK_MODELS).filter(
      (model) => model.value !== DEFAULT_MODEL_VALUE,
    ),
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
