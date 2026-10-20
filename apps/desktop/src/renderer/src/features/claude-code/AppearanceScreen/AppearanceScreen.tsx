import clsx from 'clsx'
import { Plus, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { TEXT_SIZE_MAX, TEXT_SIZE_MIN, TEXT_SIZE_FOLLOW } from '@shared/claude-prefs'

import { Card } from '@amazing-ide/ui/Card'
import { IconButton } from '@amazing-ide/ui/IconButton'
import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'

import { useClaudeActions } from '../claude-actions.hooks'
import { usePanelPrefs } from '../claude.queries'
import { useDelayedSave } from '../delayed-save.hooks'
import { IDE_TEXT_SIZE, TEXT_SIZE_SAVE_MS } from '../panel-look.constants'
import { PanelScreen } from '../PanelScreen/PanelScreen'
import styles from './AppearanceScreen.module.scss'
import { drawnSize, stepTextSize } from './AppearanceScreen.utils'

/**
 * Размер текста панели (Settings → Appearance): как у IDE или свой, 8-32 pt. Масштаб -
 * всей панели Claude Code, а не окна. Цифра меняется сразу, а пишется, когда нажатия
 * кончились: масштаб сдвигает кнопки из-под курсора. Темы нет - IDE только тёмная.
 */
export const AppearanceScreen = () => {
  const { t } = useTranslation()
  const prefs = usePanelPrefs()
  const { setPrefs } = useClaudeActions()
  const [size, setSize] = useDelayedSave(
    prefs.textSize,
    (textSize) => setPrefs({ textSize }),
    TEXT_SIZE_SAVE_MS,
  )
  const isFollowing = size === TEXT_SIZE_FOLLOW
  const drawn = drawnSize(size)
  const points = (value: number) => t('claudeCode.appearance.points', { size: value })

  return (
    <PanelScreen title={t('claudeCode.menu.titles.appearance.title')}>
      <Card title={t('claudeCode.appearance.size')}>
        <div className={styles.appearanceScreen}>
          <Menu label={t('claudeCode.appearance.size')}>
            <MenuItem
              selection="single"
              checked={isFollowing}
              label={t('claudeCode.appearance.follow')}
              description={t('claudeCode.appearance.followSub', { size: points(IDE_TEXT_SIZE) })}
              onSelect={() => setSize(TEXT_SIZE_FOLLOW)}
            />
            <MenuItem
              selection="single"
              checked={!isFollowing}
              label={t('claudeCode.appearance.own')}
              description={t('claudeCode.appearance.ownSub')}
              onSelect={() => setSize(drawn)}
            />
          </Menu>
          <div className={styles.stepper}>
            <IconButton
              icon={Minus}
              size="sm"
              label={t('claudeCode.appearance.smaller')}
              disabled={drawn <= TEXT_SIZE_MIN}
              onClick={() => setSize(stepTextSize(size, -1))}
            />
            <span className={clsx(styles.points, isFollowing && styles.following)}>
              {points(drawn)}
            </span>
            <IconButton
              icon={Plus}
              size="sm"
              label={t('claudeCode.appearance.larger')}
              disabled={drawn >= TEXT_SIZE_MAX}
              onClick={() => setSize(stepTextSize(size, 1))}
            />
          </div>
        </div>
      </Card>
    </PanelScreen>
  )
}
