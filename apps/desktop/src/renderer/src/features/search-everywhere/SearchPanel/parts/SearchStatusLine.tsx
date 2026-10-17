import { useTranslation } from 'react-i18next'

import { TEXT_QUERY_MAX_LENGTH } from '@shared/search'

import styles from '../SearchPanel.module.scss'
import type { SearchStatusLineProps } from '../SearchPanel.types'
import { TEXT_MIN_QUERY } from '../../search-everywhere.constants'

/**
 * Строка под списком: почему он пуст (нет проекта, запрос короток или длинен, ничего
 * нет) или что показано не всё. Результаты есть и показаны все - строки нет.
 */
export const SearchStatusLine = ({
  tab,
  status,
  isFilesTruncated,
  isTextTruncated,
}: SearchStatusLineProps) => {
  const { t } = useTranslation()

  const message = (() => {
    switch (status) {
      case 'noProject':
        return t('searchEverywhere.noProject')
      case 'typeToSearch':
        return t(`searchEverywhere.typeToSearch.${tab}`)
      case 'shortQuery':
        return t('searchEverywhere.shortQuery', { count: TEXT_MIN_QUERY })
      case 'longQuery':
        return t('searchEverywhere.longQuery', { count: TEXT_QUERY_MAX_LENGTH })
      case 'loading':
        return t('searchEverywhere.searching')
      case 'nothingFound':
        return t('searchEverywhere.nothingFound')
      case 'ready':
        if (isTextTruncated) return t('searchEverywhere.textTruncated')
        if (isFilesTruncated) return t('searchEverywhere.filesTruncated')

        return null
    }
  })()

  return message && <div className={styles.status}>{message}</div>
}
