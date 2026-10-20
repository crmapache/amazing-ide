import { useTranslation } from 'react-i18next'

import type { SettingSources } from '@shared/claude-prefs'
import { SETTING_SOURCES } from '@shared/claude-prefs'

import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'

import { useClaudeActions } from '../claude-actions.hooks'
import { useProjectClaudeSettings } from '../claude-settings.queries'
import { usePanelPrefs } from '../claude.queries'
import type { MenuScreenProps } from '../claude.types'
import { PanelScreen } from '../PanelScreen/PanelScreen'
import styles from './SettingSourcesScreen.module.scss'
import { withSources } from './SettingSourcesScreen.utils'
import { RepositoryCard } from './parts/RepositoryCard'

/**
 * Какие слои настроек Claude Code читает этот проект (Settings → Settings sources):
 * все, без локального файла, только свои. Выбор - по проекту и уходит флагом
 * `--setting-sources`; процессы проекта перезапускаются, как освободятся. Ниже - что
 * репозиторий задаёт сейчас: без этого выбирать вслепую.
 */
export const SettingSourcesScreen = ({ project }: MenuScreenProps) => {
  const { t } = useTranslation()
  const prefs = usePanelPrefs()
  const { setPrefs } = useClaudeActions()
  const { data: info } = useProjectClaudeSettings(project.id)
  const current = prefs.settingSources[project.rootPath] ?? 'all'

  const handlePick = (choice: SettingSources) =>
    void setPrefs({ settingSources: withSources(prefs.settingSources, project.rootPath, choice) })

  return (
    <PanelScreen title={t('claudeCode.menu.titles.settingSources.title')}>
      <p className={styles.note}>{t('claudeCode.settingSources.note')}</p>
      <Menu label={t('claudeCode.menu.titles.settingSources.title')} autoFocus>
        {SETTING_SOURCES.map((choice) => (
          <MenuItem
            key={choice}
            selection="single"
            checked={choice === current}
            label={t(`claudeCode.settingSources.options.${choice}.label`)}
            description={t(`claudeCode.settingSources.options.${choice}.sub`)}
            onSelect={() => handlePick(choice)}
          />
        ))}
      </Menu>
      <p className={styles.note}>{t('claudeCode.settingSources.restarts')}</p>
      {info && <RepositoryCard names={info.overrides} />}
      {info?.sourcesFlag === false && (
        <div role="status" className={styles.warning}>
          {t('claudeCode.settingSources.needsNewer')}
        </div>
      )}
    </PanelScreen>
  )
}
