import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@amazing-ide/ui/EmptyState'

/**
 * GUI провайдера Claude Code в правой панели (зона 7). Заглушка: сам GUI придёт
 * из amazing-claude-code, как именно его встраивать - отдельное решение (ADR).
 */
export const ClaudeCodeView = () => {
  const { t } = useTranslation()

  return (
    <EmptyState icon={Sparkles} title={t('claudeCode.title')} description={t('claudeCode.stub')} />
  )
}
