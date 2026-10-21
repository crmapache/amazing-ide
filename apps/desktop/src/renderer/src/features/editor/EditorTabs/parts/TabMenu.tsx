import { X, Copy, ListX, SquareX, ArrowRightToLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'
import { MenuSeparator } from '@amazing-ide/ui/MenuSeparator'
import { Popover } from '@amazing-ide/ui/Popover'
import { useAnchoredPopover } from '@amazing-ide/ui/Popover.hooks'

import type { TabMenuProps } from '../EditorTabs.types'
import { requestCloseTabs } from '../../editor-close'

/**
 * Меню правой кнопки на вкладке файла, как в WebStorm: закрыть эту, остальные, все
 * справа или все сразу; скопировать путь от корня проекта. Встаёт под вкладкой.
 */
export const TabMenu = ({ projectId, paths, target, onClose }: TabMenuProps) => {
  const { t } = useTranslation()
  const { id, ref, onToggle } = useAnchoredPopover(target?.anchor ?? null, onClose)
  const path = target?.path ?? ''
  const index = paths.indexOf(path)

  const close = (closing: readonly string[]) => {
    ref.current?.hidePopover()
    if (closing.length > 0) requestCloseTabs(projectId, closing)
  }

  const handleClose = () => close([path])

  const handleCloseOthers = () => close(paths.filter((open) => open !== path))

  const handleCloseRight = () => close(paths.slice(index + 1))

  const handleCloseAll = () => close(paths)

  const handleCopy = () => {
    ref.current?.hidePopover()
    void navigator.clipboard.writeText(path)
  }

  return (
    <Popover id={id} ref={ref} onToggle={onToggle}>
      {target && (
        <Menu label={t('editor.tabs.menu.label')} autoFocus>
          <MenuItem icon={X} label={t('editor.tabs.menu.close')} onSelect={handleClose} />
          <MenuItem
            icon={SquareX}
            label={t('editor.tabs.menu.closeOthers')}
            onSelect={handleCloseOthers}
          />
          <MenuItem
            icon={ArrowRightToLine}
            label={t('editor.tabs.menu.closeRight')}
            onSelect={handleCloseRight}
          />
          <MenuItem icon={ListX} label={t('editor.tabs.menu.closeAll')} onSelect={handleCloseAll} />
          <MenuSeparator />
          <MenuItem icon={Copy} label={t('editor.tabs.menu.copyPath')} onSelect={handleCopy} />
        </Menu>
      )}
    </Popover>
  )
}
