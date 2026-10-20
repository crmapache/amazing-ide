import type { TFunction } from 'i18next'

import type { PanelPrefs } from '@shared/claude-prefs'
import {
  SOUND_EVENTS,
  INDICATOR_IDS,
  GAUGE_VIVID_CALM,
  GAUGE_VIVID_FULL,
} from '@shared/claude-prefs'

import type { SettingsScreen } from '../claude.types'

const onOff = (value: boolean, t: TFunction) =>
  value ? t('claudeCode.settings.values.on') : t('claudeCode.settings.values.off')

/**
 * Значение справа от строки Settings: ответ на вопрос, ради которого экран открыли бы
 * («13 pt», «6 on», «Cmd+Enter»). Пусто у экранов, чьё содержимое в слово не сложить.
 */
export const settingValue = (
  screen: SettingsScreen,
  prefs: PanelPrefs,
  projectPath: string,
  t: TFunction,
): string => {
  switch (screen) {
    case 'appearance':
      return prefs.textSize
        ? t('claudeCode.settings.values.points', { size: prefs.textSize })
        : t('claudeCode.settings.values.default')
    case 'sounds':
      return t('claudeCode.settings.values.countOn', {
        count: SOUND_EVENTS.length - prefs.mutedSounds.length,
      })
    case 'calmColors':
      if (prefs.gaugeVivid === GAUGE_VIVID_FULL) return t('claudeCode.settings.values.fullColor')
      if (prefs.gaugeVivid === GAUGE_VIVID_CALM) return t('claudeCode.settings.values.calm')

      return t('claudeCode.settings.values.percent', { value: prefs.gaugeVivid })
    case 'indicators':
      return t('claudeCode.settings.values.countOn', {
        count: INDICATOR_IDS.length - prefs.hiddenIndicators.length,
      })
    case 'restoreTabs':
      return onOff(prefs.restoreTabs, t)
    case 'shareEditor':
      return onOff(prefs.shareEditor, t)
    case 'spellcheck':
      return onOff(prefs.spellcheck, t)
    case 'composerLayout':
      return t(`claudeCode.settings.values.layouts.${prefs.composerLayout}`)
    case 'pasteCollapse':
      return prefs.pasteCollapse
        ? t('claudeCode.settings.values.fromLines', { count: prefs.pasteCollapse })
        : t('claudeCode.settings.values.never')
    case 'sendKey':
      return t(`claudeCode.settings.values.sendKeys.${prefs.sendKey}`)
    case 'settingSources':
      return t(`claudeCode.settings.values.sources.${prefs.settingSources[projectPath] ?? 'all'}`)
    case 'customModels':
      return prefs.customModels.length > 0
        ? String(prefs.customModels.length)
        : t('claudeCode.settings.values.none')
    default:
      return ''
  }
}
