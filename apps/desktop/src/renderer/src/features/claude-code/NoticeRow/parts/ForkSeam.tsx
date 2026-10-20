import { useTranslation } from 'react-i18next'

import styles from '../NoticeRow.module.scss'
import type { NoticeItemProps } from '../NoticeRow.types'
import { useClaudeActions } from '../../claude-actions.hooks'
import { useActiveProject } from '../../../../state/workspace.queries'
import { CheckpointRow } from './CheckpointRow'

/**
 * Шов форка, как в ACC: выше - унаследованное, ниже - сказанное в самом форке. Имя
 * оригинала - кнопка: открывает его (вкладку, если он открыт, иначе из истории).
 */
export const ForkSeam = ({ item }: NoticeItemProps) => {
  const { t } = useTranslation()
  const project = useActiveProject()
  const { openHistory } = useClaudeActions()
  const title = item.detail || t('claudeCode.notice.forkUntitled')
  const source = item.sourceSessionId

  const handleOpen = () => {
    if (project && source) void openHistory(project.id, source)
  }

  return (
    <CheckpointRow chip={t('claudeCode.notice.chips.fork')}>
      {t('claudeCode.notice.forkedBefore')}
      {project && source ? (
        <button type="button" className={styles.checkpointLink} onClick={handleOpen}>
          {title}
        </button>
      ) : (
        title
      )}
      {t('claudeCode.notice.forkedAfter')}
    </CheckpointRow>
  )
}
