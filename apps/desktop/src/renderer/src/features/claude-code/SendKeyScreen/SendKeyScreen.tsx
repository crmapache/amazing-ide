import { useTranslation } from 'react-i18next'

import { SEND_KEYS } from '@shared/claude-prefs'

import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'

import { useClaudeActions } from '../claude-actions.hooks'
import { usePanelPrefs } from '../claude.queries'
import { PanelScreen } from '../PanelScreen/PanelScreen'
import styles from './SendKeyScreen.module.scss'

/**
 * Settings → Sending a message: какая клавиша отправляет - Enter или ⌘Enter; вторая
 * переносит строку. Сообщение абзацами пишется одной и той же клавишей в обоих режимах.
 */
export const SendKeyScreen = () => {
  const { t } = useTranslation()
  const { sendKey } = usePanelPrefs()
  const { setPrefs } = useClaudeActions()

  return (
    <PanelScreen title={t('claudeCode.menu.titles.sendKey.title')}>
      <p className={styles.note}>{t('claudeCode.sendKey.note')}</p>
      <Menu label={t('claudeCode.menu.titles.sendKey.title')} autoFocus>
        {SEND_KEYS.map((key) => (
          <MenuItem
            key={key}
            selection="single"
            checked={sendKey === key}
            label={t(`claudeCode.sendKey.${key}.label`)}
            description={t(`claudeCode.sendKey.${key}.sub`)}
            onSelect={() => void setPrefs({ sendKey: key })}
          />
        ))}
      </Menu>
    </PanelScreen>
  )
}
