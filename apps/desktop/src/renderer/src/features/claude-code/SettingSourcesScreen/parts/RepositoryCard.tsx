import { useTranslation } from 'react-i18next'

import { Card } from '@amazing-ide/ui/Card'

import styles from '../SettingSourcesScreen.module.scss'
import type { RepositoryCardProps } from '../SettingSourcesScreen.types'

/**
 * Что файлы репозитория задают прямо сейчас из того, что решает вход и адрес, - при
 * любом выборе: тогда это «что вернётся». Только имена: значение там - ключ, а панель -
 * экран, на который может смотреть кто-то ещё.
 */
export const RepositoryCard = ({ names }: RepositoryCardProps) => {
  const { t } = useTranslation()

  if (names.length === 0) {
    return <p className={styles.note}>{t('claudeCode.settingSources.repositoryQuiet')}</p>
  }

  return (
    <Card title={t('claudeCode.settingSources.repositorySets')}>
      <div className={styles.repository}>
        <span className={styles.names}>{names.join(', ')}</span>
        <span>{t('claudeCode.settingSources.repositoryMeans')}</span>
      </div>
    </Card>
  )
}
