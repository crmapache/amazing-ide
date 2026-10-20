import { useTranslation } from 'react-i18next'

import { Card } from '@amazing-ide/ui/Card'
import { Switch } from '@amazing-ide/ui/Switch'

import { useClaudeActions } from '../claude-actions.hooks'
import { usePanelPrefs } from '../claude.queries'
import { PanelScreen } from '../PanelScreen/PanelScreen'
import styles from './PrefSwitchScreen.module.scss'
import type { PrefSwitchScreenProps } from './PrefSwitchScreen.types'

/**
 * Экран настройки из одного выключателя и пояснения под ним (как SwitchScreen в ACC):
 * открытый файл в сообщениях, проверка орфографии. Одна разметка на такие экраны -
 * копии разошлись бы на первой же правке.
 */
export const PrefSwitchScreen = ({ pref }: PrefSwitchScreenProps) => {
  const { t } = useTranslation()
  const prefs = usePanelPrefs()
  const { setPrefs } = useClaudeActions()

  return (
    <PanelScreen title={t(`claudeCode.menu.titles.${pref}.title`)}>
      <Card>
        <Switch
          label={t(`claudeCode.${pref}.label`)}
          description={t(`claudeCode.${pref}.hint`)}
          checked={prefs[pref]}
          onChange={(value) => void setPrefs({ [pref]: value })}
        />
      </Card>
      <p className={styles.note}>{t(`claudeCode.${pref}.note`)}</p>
    </PanelScreen>
  )
}
