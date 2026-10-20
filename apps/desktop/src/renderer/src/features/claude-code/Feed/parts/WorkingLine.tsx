import type { CSSProperties } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

import { STATUS_TICK_MS } from '../Feed.constants'
import { useStalled } from '../Feed.hooks'
import styles from '../Feed.module.scss'
import type { WorkingLineProps } from '../Feed.types'
import { statusLabel, streamStatus } from '../Feed.utils'
import { useNow } from '../../clock.hooks'

/**
 * Последняя строка ленты, как в ACC: «Claude is thinking · 12s» с переливом по буквам
 * (время - всего запроса), «Waiting for you», «Waiting for N subagents», «API overloaded ·
 * waiting 30s». Застыла надолго - перелив гаснет. «Погасить процесс», когда CLI не
 * подтверждает стоп, - только в ряду поля рядом со Stop, как в ACC: здесь лишь «Stopping».
 */
export const WorkingLine = ({ conversation, items }: WorkingLineProps) => {
  const { t } = useTranslation()
  const status = streamStatus(conversation, items)
  const now = useNow(status.kind !== 'none', STATUS_TICK_MS)
  const isStalled = useStalled(items, now)

  if (status.kind === 'none') return null

  const label = statusLabel(t, status, now)
  const isShimmering =
    !isStalled &&
    (status.kind === 'thinking' || status.kind === 'retry' || status.kind === 'compacting')

  return (
    <div role="status" className={styles.workingLine}>
      <span className={clsx(styles.workingLabel, isShimmering && styles.shimmer)}>
        {isShimmering
          ? [...label].map((letter, index) => (
              // eslint-disable-next-line no-restricted-syntax -- номер буквы задаёт задержку волны перелива
              <span key={index} style={{ '--letter': index } as CSSProperties}>
                {letter}
              </span>
            ))
          : label}
      </span>
    </div>
  )
}
