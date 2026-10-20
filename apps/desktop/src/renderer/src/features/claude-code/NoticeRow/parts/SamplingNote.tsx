import { useTranslation } from 'react-i18next'

import { Button } from '@amazing-ide/ui/Button'

import styles from '../NoticeRow.module.scss'
import { useClaudeCodeStore } from '../../claude-code.store'

/**
 * Под отказом шлюза из-за параметра выборки (как в ACC): параметр послала не панель, а то,
 * через что идут запросы, - шлюз или прокси из настроек. Кнопка - на тот же экран, что у
 * строки SETTINGS, и теми же словами: экран один.
 */
export const SamplingNote = () => {
  const { t } = useTranslation()
  const openMenu = useClaudeCodeStore((store) => store.openMenu)

  const handleSources = () => openMenu('settingSources')

  return (
    <>
      <span className={styles.errorNote}>{t('claudeCode.notice.sampling')}</span>
      <div className={styles.actions}>
        <Button size="sm" variant="secondary" onClick={handleSources}>
          {t('claudeCode.notice.outranked.open')}
        </Button>
      </div>
    </>
  )
}
