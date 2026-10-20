import { useTranslation } from 'react-i18next'

import { Card } from '@amazing-ide/ui/Card'
import { Switch } from '@amazing-ide/ui/Switch'

import { useClaudeActions } from '../claude-actions.hooks'
import { usePanelPrefs } from '../claude.queries'
import { PanelScreen } from '../PanelScreen/PanelScreen'
import styles from './RestoreTabsScreen.module.scss'

/**
 * Вкладки после перезапуска IDE (Settings → Tabs on start): один переключатель и два
 * ответа - что возвращается и чего это стоит. Десять вкладок - не десять агентов:
 * процесс поднимается, только когда во вкладку заходят. Выключено - полоса и черновики
 * начинаются заново, разговоры остаются в истории.
 */
export const RestoreTabsScreen = () => {
  const { t } = useTranslation()
  const prefs = usePanelPrefs()
  const { setPrefs } = useClaudeActions()

  return (
    <PanelScreen title={t('claudeCode.menu.titles.restoreTabs.title')}>
      <Card>
        <Switch
          label={t('claudeCode.restoreTabs.label')}
          description={t('claudeCode.restoreTabs.hint')}
          checked={prefs.restoreTabs}
          onChange={(restoreTabs) => void setPrefs({ restoreTabs })}
        />
      </Card>
      <p className={styles.note}>{t('claudeCode.restoreTabs.note')}</p>
    </PanelScreen>
  )
}
