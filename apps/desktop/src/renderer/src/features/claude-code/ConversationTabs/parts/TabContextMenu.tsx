import { Copy, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'
import { Popover } from '@amazing-ide/ui/Popover'
import { useAnchoredPopover } from '@amazing-ide/ui/Popover.hooks'

import type { TabContextMenuProps } from '../ConversationTabs.types'
import { useClaudeCodeStore } from '../../claude-code.store'
import { useCopy } from '../../clipboard.hooks'

/**
 * Меню правой кнопки на вкладке: скопировать ID разговора (для `claude --resume` в
 * терминале или чтобы передать его другой сессии) и переименовать. Встаёт под вкладкой.
 * У вкладки, где разговора ещё нет, копировать нечего - пункта нет.
 */
export const TabContextMenu = ({ conversation, anchor, onClose }: TabContextMenuProps) => {
  const { t } = useTranslation()
  const { id, ref, onToggle } = useAnchoredPopover(anchor, onClose)
  const setNaming = useClaudeCodeStore((store) => store.setNaming)
  const { copy } = useCopy()
  const hasSession =
    conversation !== null && (conversation.outcome !== 'none' || conversation.status !== 'idle')

  const handleCopy = () => {
    if (conversation) copy(conversation.sessionId)

    ref.current?.hidePopover()
  }

  // Сначала закрыть меню: закрытие возвращает фокус туда, где он был, а полю имени он
  // нужен после.
  const handleRename = () => {
    ref.current?.hidePopover()

    if (conversation) setNaming(conversation.id)
  }

  return (
    <Popover id={id} ref={ref} onToggle={onToggle}>
      {conversation && (
        <Menu label={t('claudeCode.tabs.menu.label')} autoFocus>
          {hasSession && (
            <MenuItem icon={Copy} label={t('claudeCode.tabs.menu.copyId')} onSelect={handleCopy} />
          )}
          <MenuItem
            icon={Pencil}
            label={t('claudeCode.tabs.menu.rename')}
            onSelect={handleRename}
          />
        </Menu>
      )}
    </Popover>
  )
}
