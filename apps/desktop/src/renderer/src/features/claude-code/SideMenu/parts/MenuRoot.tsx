import { Plug, Puzzle, History, Settings, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'

import { useMenuSummary } from '../SideMenu.hooks'
import { useClaudeCodeStore } from '../../claude-code.store'
import type { MenuScreenProps } from '../../claude.types'

/**
 * Корень бокового меню: пункт - экран, справа - что он скажет, не открывая его (число
 * разговоров, «4/5» серверов, имя аккаунта цветом его состояния).
 */
export const MenuRoot = (props: MenuScreenProps) => {
  const { t } = useTranslation()
  const pickMenu = useClaudeCodeStore((store) => store.pickMenu)
  const summary = useMenuSummary(props)

  return (
    <Menu label={t('claudeCode.menu.titles.menu.title')} autoFocus>
      <MenuItem
        icon={History}
        iconTone="neutral"
        label={t('claudeCode.menu.rows.history.label')}
        description={t('claudeCode.menu.rows.history.sub')}
        hint={summary.history?.text}
        chevron
        onSelect={() => pickMenu('history')}
      />
      <MenuItem
        icon={Plug}
        iconTone={summary.mcp?.tone ?? 'neutral'}
        label={t('claudeCode.menu.rows.mcp.label')}
        description={t('claudeCode.menu.rows.mcp.sub')}
        hint={summary.mcp?.text}
        hintTone={summary.mcp?.tone}
        chevron
        onSelect={() => pickMenu('mcp')}
      />
      <MenuItem
        icon={Puzzle}
        iconTone="neutral"
        label={t('claudeCode.menu.rows.plugins.label')}
        description={t('claudeCode.menu.rows.plugins.sub')}
        hint={summary.plugins?.text}
        chevron
        onSelect={() => pickMenu('plugins')}
      />
      <MenuItem
        icon={UsersRound}
        iconTone={summary.accounts?.tone ?? 'neutral'}
        label={t('claudeCode.menu.rows.accounts.label')}
        description={t('claudeCode.menu.rows.accounts.sub')}
        hint={summary.accounts?.text}
        hintTone={summary.accounts?.tone}
        chevron
        onSelect={() => pickMenu('accounts')}
      />
      {/* Своя строка панели - последней: настройки настраивают саму панель, и им не
          место среди строк выше. */}
      <MenuItem
        icon={Settings}
        iconTone="neutral"
        label={t('claudeCode.menu.rows.settings.label')}
        description={t('claudeCode.menu.rows.settings.sub')}
        chevron
        onSelect={() => pickMenu('settings')}
      />
    </Menu>
  )
}
