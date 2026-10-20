import { useTranslation } from 'react-i18next'

import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'

import { useClaudeCodeStore } from '../claude-code.store'
import { usePanelPrefs } from '../claude.queries'
import type { MenuScreenProps } from '../claude.types'
import { SETTINGS_ROWS, SETTINGS_VIEWS } from './SettingsList.constants'
import { settingValue } from './SettingsList.utils'

/**
 * Экран Settings бокового меню: настройки панели строками, у каждой - значение справа
 * и свой экран за ней. Настройки - на машину, источники слоёв Claude Code - на проект.
 */
export const SettingsList = ({ project }: MenuScreenProps) => {
  const { t } = useTranslation()
  const prefs = usePanelPrefs()
  const pickMenu = useClaudeCodeStore((store) => store.pickMenu)
  const rows = SETTINGS_ROWS.filter((row) => SETTINGS_VIEWS[row.screen])

  return (
    <Menu label={t('claudeCode.menu.titles.settings.title')} autoFocus>
      {rows.map((row) => (
        <MenuItem
          key={row.screen}
          icon={row.icon}
          iconTone="neutral"
          label={t(`claudeCode.settings.rows.${row.screen}.label`)}
          description={t(`claudeCode.settings.rows.${row.screen}.sub`)}
          hint={settingValue(row.screen, prefs, project.rootPath, t) || undefined}
          chevron
          onSelect={() => pickMenu(row.screen)}
        />
      ))}
    </Menu>
  )
}
