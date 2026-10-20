import { useTranslation } from 'react-i18next'

import styles from '../AgentLog.module.scss'
import type { AgentWorkingProps } from '../AgentLog.types'
import { elapsedMs } from '../../agents.utils'
import { TICK_MS } from '../../claude.constants'
import { formatDuration } from '../../claude.utils'
import { useNow } from '../../clock.hooks'

/**
 * «Working · 12s» под журналом идущего агента. Своим компонентом: часы тикают раз в
 * секунду, и перерисовываться должна эта строка, а не весь журнал.
 */
export const AgentWorking = ({ tool }: AgentWorkingProps) => {
  const { t } = useTranslation()
  const now = useNow(true, TICK_MS)

  return (
    <div className={styles.working}>
      {t('claudeCode.agents.working', { duration: formatDuration(elapsedMs(tool, now)) })}
    </div>
  )
}
