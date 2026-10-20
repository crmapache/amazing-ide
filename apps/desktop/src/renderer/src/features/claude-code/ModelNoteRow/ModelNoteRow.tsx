import { useTranslation } from 'react-i18next'

import { usePanelPrefs, useModelCatalog } from '../claude.queries'
import { modelCaption } from '../model-chip.utils'
import { pickableModels } from '../models.utils'
import { LabelRow } from '../NoticeRow/parts/LabelRow'
import styles from './ModelNoteRow.module.scss'
import type { ModelNoteRowProps } from './ModelNoteRow.types'

/**
 * MODEL в ленте (как в ACC): выбор не доехал - «Fable picked, but the answers keep
 * coming on Opus 5.5» и совет выбрать снова; CLI сменил модель сам (по подписи ответа) -
 * «Opus 5.5 → Opus 4.8, switched by Claude Code, not by you».
 */
export const ModelNoteRow = ({ item }: ModelNoteRowProps) => {
  const { t } = useTranslation()
  const { customModels } = usePanelPrefs()
  const models = pickableModels(useModelCatalog(), customModels)
  const first = modelCaption(item.detail, models)
  const second = modelCaption(item.subject ?? '', models)

  if (item.code === 'model-stuck') {
    return (
      <LabelRow label={t('claudeCode.modelNote.label')} tone="warning">
        <span className={styles.model}>{first}</span>{' '}
        <span className={styles.muted}>{t('claudeCode.modelNote.stuck', { running: second })}</span>
        <span className={styles.hint}>{t('claudeCode.modelNote.stuckTip')}</span>
      </LabelRow>
    )
  }

  return (
    <LabelRow label={t('claudeCode.modelNote.label')} tone="warning">
      <span className={styles.from}>{first}</span>
      {' → '}
      <span className={styles.model}>{second}</span>{' '}
      <span className={styles.muted}>{t('claudeCode.notice.model.note')}</span>
    </LabelRow>
  )
}
