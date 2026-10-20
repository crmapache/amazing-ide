import type { TFunction } from 'i18next'

import { EFFORT_LEVELS, PERMISSION_MODES } from '@shared/claude'
import type { PanelPrefsPatch } from '@shared/claude-prefs'

import type { PickableModel } from '../models.types'
import type { NewChatField } from '../NewChatScreen/NewChatScreen.types'
import type { NewChatChoice } from './NewChatChoiceScreen.types'

/**
 * Варианты поля после «как выбрано в последний раз»: модели - те же, что в MODEL под
 * полем (и свои); усилие - уровни CLI; режим - как у новой вкладки по правилам CLI:
 * без вопросов - только если ни один слой настроек его не запретил.
 */
export const newChatChoices = (
  field: NewChatField,
  models: readonly PickableModel[],
  bypassAllowed: boolean,
  t: TFunction,
): NewChatChoice[] => {
  if (field === 'model') {
    return models.map((model) => ({
      value: model.value,
      label: model.displayName,
      description: model.custom ? t('claudeCode.newChats.custom') : model.description || undefined,
    }))
  }

  if (field === 'effort') {
    return EFFORT_LEVELS.map((level) => ({
      value: level,
      label: t(`claudeCode.effort.levels.${level}`),
      description: t(`claudeCode.effort.hints.${level}`),
    }))
  }

  return PERMISSION_MODES.filter((mode) => bypassAllowed || mode !== 'bypassPermissions').map(
    (mode) => ({
      value: mode,
      label: t(`claudeCode.modes.labels.${mode}`),
      description: t(`claudeCode.modes.hints.${mode}`),
    }),
  )
}

/** Изменение настроек для выбора; null - «как выбрано в последний раз». */
export const pinPatch = (field: NewChatField, value: string | null): PanelPrefsPatch => {
  if (field === 'model') return { newTabModel: value }
  if (field === 'effort')
    return { newTabEffort: EFFORT_LEVELS.find((level) => level === value) ?? null }

  return { newTabMode: PERMISSION_MODES.find((mode) => mode === value) ?? null }
}
