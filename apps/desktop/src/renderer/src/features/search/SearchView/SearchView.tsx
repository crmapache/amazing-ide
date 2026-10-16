import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@amazing-ide/ui/EmptyState'

/** Вид «Поиск» левой панели. Заглушка: показывает, что вид переключается. */
export const SearchView = () => {
  const { t } = useTranslation()

  return <EmptyState icon={Search} title={t('search.title')} description={t('search.stub')} />
}
