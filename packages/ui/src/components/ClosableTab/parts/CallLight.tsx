import type { CSSProperties, TransitionEvent } from 'react'
import { useState } from 'react'
import clsx from 'clsx'
import { Sparkle } from 'lucide-react'

import { CALL_SPARKS, CALL_PHASE_SPAN_MS } from '../ClosableTab.constants'
import styles from '../ClosableTab.module.scss'
import type { CallLightProps } from '../ClosableTab.types'

/**
 * Свет позвавшей вкладки: плоская плашка цветом повода, как у выбранной вкладки группы, и
 * звёздочки по краям, как в ACC. Стоит во вкладке всегда и проступает или гаснет
 * прозрачностью; повод держится, пока свет гаснет, иначе цвет стекал бы в серый на выходе.
 */
export const CallLight = ({ call, since }: CallLightProps) => {
  const [paint, setPaint] = useState(call ? { call, since } : null)

  if (call && (call !== paint?.call || since !== paint.since)) setPaint({ call, since })

  const phase = paint?.since === undefined ? 0 : -(paint.since % CALL_PHASE_SPAN_MS)

  const handleTransitionEnd = (event: TransitionEvent<HTMLSpanElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'opacity') return
    if (!call) setPaint(null)
  }

  return (
    <span
      className={clsx(styles.light, paint && styles[paint.call])}
      data-lit={call ? '' : undefined}
      // eslint-disable-next-line no-restricted-syntax -- фаза света - от момента зова, у каждой вкладки своя
      style={{ '--call-phase': `${phase}ms` } as CSSProperties}
      aria-hidden
      onTransitionEnd={handleTransitionEnd}>
      {paint && (
        <>
          <span className={styles.plaque} />
          {CALL_SPARKS.map((index) => (
            <span key={index} className={clsx(styles.spark, styles[`spark${index}`])}>
              <Sparkle fill="currentColor" aria-hidden />
            </span>
          ))}
        </>
      )}
    </span>
  )
}
