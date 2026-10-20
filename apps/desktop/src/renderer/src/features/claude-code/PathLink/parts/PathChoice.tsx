import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'
import { MenuSection } from '@amazing-ide/ui/MenuSection'

import type { PathChoiceProps } from '../PathLink.types'

/**
 * Меню выбора, когда голое имя нашлось в нескольких местах проекта, как «Go to File»:
 * в строках пути от корня - имя у всех одно, различает их только папка.
 */
export const PathChoice = ({ path, candidates, onChoose }: PathChoiceProps) => {
  const { t } = useTranslation()

  return (
    <Menu label={t('claudeCode.paths.chooseLabel', { path })} autoFocus>
      <MenuSection title={t('claudeCode.paths.chooseTitle')}>
        {candidates.map((candidate) => (
          <MenuItem
            key={candidate}
            icon={FileText}
            label={candidate}
            onSelect={() => onChoose(candidate)}
          />
        ))}
      </MenuSection>
    </Menu>
  )
}
