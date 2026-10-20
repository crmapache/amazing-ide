import { useTranslation } from 'react-i18next'

import styles from '../NoticeRow.module.scss'
import type { NoticeItemProps } from '../NoticeRow.types'
import { SessionField } from './SessionField'

/**
 * /status, как в ACC: id разговора и команда, которой его продолжают в терминале, -
 * обе плашки копируются нажатием.
 */
export const SessionRow = ({ item }: NoticeItemProps) => {
  const { t } = useTranslation()

  return (
    <div className={styles.session}>
      <span className={styles.label}>{t('claudeCode.notice.session.label')}</span>
      {item.detail ? (
        <>
          <SessionField name={t('claudeCode.notice.session.id')} value={item.detail} />
          <SessionField
            name={t('claudeCode.notice.session.terminal')}
            note={t('claudeCode.notice.session.terminalNote')}
            value={`claude --resume ${item.detail}`}
          />
        </>
      ) : (
        <p className={styles.sessionNote}>{t('claudeCode.notice.session.none')}</p>
      )}
    </div>
  )
}
