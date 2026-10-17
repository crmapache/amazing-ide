import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@amazing-ide/ui/IconButton'
import { Popover } from '@amazing-ide/ui/Popover'
import { usePopover } from '@amazing-ide/ui/Popover.hooks'

import type { SearchTab } from '../search-everywhere.types'
import { SearchPanel } from '../SearchPanel/SearchPanel'
import { useSearchShortcuts } from './SearchEverywhere.hooks'
import type { SearchEverywhereProps } from './SearchEverywhere.types'

/**
 * Поиск везде, как в WebStorm: кнопка с лупой в шапке и панель сверху по центру
 * окна. Открывается кнопкой, двойным Shift и сочетаниями вкладок. Панель монтируется
 * только открытой: так каждый раз свежий список файлов и пустой запрос.
 */
export const SearchEverywhere = ({ projectId, actions, onOpenFile }: SearchEverywhereProps) => {
  const { t } = useTranslation()
  const popover = usePopover()
  const [tab, setTab] = useState<SearchTab>('all')

  useSearchShortcuts((next) => {
    setTab(next)
    popover.open()
  })

  return (
    <>
      <IconButton
        {...popover.triggerProps}
        icon={Search}
        label={t('searchEverywhere.open')}
        onClick={() => setTab('all')}
      />
      <Popover {...popover.popoverProps} width="xl" placement="top">
        {popover.isOpen && (
          <SearchPanel
            projectId={projectId}
            actions={actions}
            tab={tab}
            onTabChange={setTab}
            onOpenFile={onOpenFile}
            onClose={popover.close}
          />
        )}
      </Popover>
    </>
  )
}
