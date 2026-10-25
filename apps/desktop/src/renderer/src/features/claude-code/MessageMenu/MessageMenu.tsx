import { Ellipsis } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@amazing-ide/ui/IconButton'
import { Menu } from '@amazing-ide/ui/Menu'
import { MenuSection } from '@amazing-ide/ui/MenuSection'
import { Popover } from '@amazing-ide/ui/Popover'
import { usePopover } from '@amazing-ide/ui/Popover.hooks'

import type { MessageMenuProps } from './MessageMenu.types'

/**
 * Три точки в углу карточки сообщения, как в ACC: действия с карточкой - в меню под ними,
 * на виду остаются только копия и горящая булавка. Одна и та же у своего сообщения и у
 * ответа, даже с одним пунктом: угол у всех карточек одинаковый.
 */
export const MessageMenu = ({ children }: MessageMenuProps) => {
  const { t } = useTranslation()
  const popover = usePopover()

  return (
    <>
      <IconButton
        {...popover.triggerProps}
        icon={Ellipsis}
        size="sm"
        label={t('claudeCode.message.more')}
        aria-haspopup="menu"
      />
      <Popover {...popover.popoverProps}>
        {popover.isOpen && (
          <Menu label={t('claudeCode.message.menu')} autoFocus>
            <MenuSection title={t('claudeCode.message.menuTitle')}>{children}</MenuSection>
          </Menu>
        )}
      </Popover>
    </>
  )
}
