import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

import { ProgressBar } from '@amazing-ide/ui/ProgressBar'
import { Tooltip } from '@amazing-ide/ui/Tooltip'

import { CONTEXT_SEGMENTS } from '../Composer.constants'
import styles from '../Composer.module.scss'
import type { ContextBarProps } from '../Composer.types'
import { segmentFill } from '../Composer.utils'
import { formatCost, contextTone, formatTokens } from '../../claude.utils'

/**
 * Сколько окна контекста занято - полоса во всю ширину поля сверху, как в ACC: пять
 * отрезков по 20% и «ctx 48%» справа. Цвет идёт ступенями от зелёного к красному:
 * красная - скоро CLI сожмёт разговор сам. Точные цифры и цена разговора - в подсказке.
 */
export const ContextBar = ({ conversation, showBar, showLabel }: ContextBarProps) => {
  const { t } = useTranslation()
  const { contextTokens, contextWindow, costUsd } = conversation?.usage ?? {
    contextTokens: 0,
    contextWindow: 0,
    costUsd: 0,
  }
  const share = contextWindow > 0 ? contextTokens / contextWindow : 0
  const tone = contextTone(share)
  const hint =
    contextWindow > 0
      ? t('claudeCode.context.hint', {
          used: formatTokens(contextTokens),
          total: formatTokens(contextWindow),
          cost: formatCost(costUsd),
        })
      : t('claudeCode.context.empty')

  return (
    <div className={styles.contextBar}>
      {showBar && (
        <Tooltip label={hint} placement="top" stretch>
          <div className={styles.contextSegments} tabIndex={0} aria-label={hint}>
            {CONTEXT_SEGMENTS.map((index) => (
              <ProgressBar
                key={index}
                value={segmentFill(share, index)}
                tone={tone}
                label={t('claudeCode.context.label')}
              />
            ))}
          </div>
        </Tooltip>
      )}
      {showLabel && (
        <Tooltip label={hint} placement="top">
          <span className={clsx(styles.contextValue, styles[tone])}>
            {t('claudeCode.context.short', { value: Math.round(share * 100) })}
          </span>
        </Tooltip>
      )}
    </div>
  )
}
