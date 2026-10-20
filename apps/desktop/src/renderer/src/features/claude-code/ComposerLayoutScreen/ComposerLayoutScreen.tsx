import { useTranslation } from 'react-i18next'

import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'

import { useClaudeActions } from '../claude-actions.hooks'
import { usePanelPrefs } from '../claude.queries'
import { PanelScreen } from '../PanelScreen/PanelScreen'
import { LAYOUT_CHOICES } from './ComposerLayoutScreen.constants'
import styles from './ComposerLayoutScreen.module.scss'

/**
 * Settings → Composer layout: обычная раскладка (строка MODEL, EFFORT, MODE и кольца под
 * полем) или ужатая - всё это в ряду кнопок поля, ленте остаётся больше высоты.
 */
export const ComposerLayoutScreen = () => {
  const { t } = useTranslation()
  const { composerLayout } = usePanelPrefs()
  const { setPrefs } = useClaudeActions()
  // Колонки слева и справа из ACC здесь рисуются обычной раскладкой.
  const current = LAYOUT_CHOICES.find((layout) => layout === composerLayout) ?? 'bottom'

  return (
    <PanelScreen title={t('claudeCode.menu.titles.composerLayout.title')}>
      <Menu label={t('claudeCode.menu.titles.composerLayout.title')} autoFocus>
        {LAYOUT_CHOICES.map((layout) => (
          <MenuItem
            key={layout}
            selection="single"
            checked={current === layout}
            label={t(`claudeCode.composerLayout.${layout}.label`)}
            description={t(`claudeCode.composerLayout.${layout}.sub`)}
            onSelect={() => void setPrefs({ composerLayout: layout })}
          />
        ))}
      </Menu>
      <p className={styles.note}>{t('claudeCode.composerLayout.note')}</p>
    </PanelScreen>
  )
}
