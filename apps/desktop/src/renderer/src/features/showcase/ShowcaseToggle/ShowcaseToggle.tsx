import '../showcase.i18n'

import { Palette } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@amazing-ide/ui/IconButton'

import { useShowcaseStore } from '../showcase.store'

/** Кнопка с палитрой в шапке окна: открывает и закрывает витрину дизайн-системы. */
export const ShowcaseToggle = () => {
  const { t } = useTranslation('showcase')
  const isOpen = useShowcaseStore((state) => state.isOpen)
  const toggle = useShowcaseStore((state) => state.toggle)

  return <IconButton icon={Palette} label={t('open')} active={isOpen} onClick={toggle} />
}
