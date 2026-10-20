import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

import { Button } from '@amazing-ide/ui/Button'
import { Popover } from '@amazing-ide/ui/Popover'
import { usePopover } from '@amazing-ide/ui/Popover.hooks'
import { RingMeter } from '@amazing-ide/ui/RingMeter'
import { Tooltip } from '@amazing-ide/ui/Tooltip'

import styles from '../ComposerStatus.module.scss'
import type { UsageRingsProps } from '../ComposerStatus.types'
import { usageRings } from '../ComposerStatus.utils'
import { useClaudeCodeStore } from '../../claude-code.store'
import { useClaudeState } from '../../claude.queries'
import { useNow } from '../../clock.hooks'
import { USAGE_TICK_MS, PANEL_USAGE_REFRESH_MS } from '../../usage.constants'
import { useUsageRefresh } from '../../usage.hooks'
import { UsageWindows } from '../../UsageWindows/UsageWindows'

/**
 * Кольца лимитов аккаунта разговоров справа под полем, как в ACC: пять часов, неделя,
 * неделя модели - кольцо и процент цветом темпа, подробности в подсказке. По нажатию -
 * все окна со сбросами и переход к аккаунтам. Пока цифр нет - ничего: пустые кольца
 * только отвлекали бы.
 */
export const UsageRings = ({ hidden }: UsageRingsProps) => {
  const { t } = useTranslation()
  const { data: state } = useClaudeState()
  const popover = usePopover()
  const openMenu = useClaudeCodeStore((store) => store.openMenu)
  const now = useNow(true, USAGE_TICK_MS)
  const current = state?.accounts.current ?? ''

  useUsageRefresh(state ? [current] : [], PANEL_USAGE_REFRESH_MS)

  const usage = state?.accounts.usage[current]
  const rings = usage
    ? usageRings(usage, now, t).filter((ring) => !hidden.includes(ring.indicator))
    : []

  if (!usage || rings.length === 0) return null

  const handleManage = () => {
    popover.close()
    openMenu('accounts')
  }

  return (
    <>
      <button
        {...popover.triggerProps}
        type="button"
        className={styles.rings}
        aria-label={t('claudeCode.usage.title')}>
        {rings.map((ring) => (
          <Tooltip key={ring.key} label={ring.hint} placement="top">
            <span className={styles.ring}>
              <RingMeter
                value={ring.value}
                pace={ring.pace}
                tone={ring.tone}
                burning={ring.burning}
                label={ring.hint}
              />
              {!ring.burning && (
                <span className={clsx(styles.ringValue, styles[ring.tone])}>
                  {t('claudeCode.usage.percent', { value: Math.round(ring.value) })}
                </span>
              )}
            </span>
          </Tooltip>
        ))}
      </button>
      <Popover {...popover.popoverProps} width="md">
        {popover.isOpen && (
          <div className={styles.usagePanel}>
            <div className={styles.usageTitle}>{t('claudeCode.usage.title')}</div>
            <UsageWindows usage={usage} />
            <div className={styles.usageActions}>
              <Button size="sm" variant="ghost" onClick={handleManage}>
                {t('claudeCode.usage.manage')}
              </Button>
            </div>
          </div>
        )}
      </Popover>
    </>
  )
}
