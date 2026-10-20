import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { MenuItem } from '@amazing-ide/ui/MenuItem'
import { MenuSection } from '@amazing-ide/ui/MenuSection'
import { MenuSeparator } from '@amazing-ide/ui/MenuSeparator'

import { MAIN_MODELS } from '../ComposerStatus.constants'
import styles from '../ComposerStatus.module.scss'
import type { PickerProps } from '../ComposerStatus.types'
import { useClaudeActions } from '../../claude-actions.hooks'
import { useClaudeCodeStore } from '../../claude-code.store'
import { usePanelPrefs, useModelCatalog } from '../../claude.queries'
import { FAST_MARK } from '../../model-chip.constants'
import { modelChip } from '../../model-chip.utils'
import { pickableModels } from '../../models.utils'
import { FastModeItem } from '../../FastModeItem/FastModeItem'
import { OptionPicker } from './OptionPicker'

/**
 * MODEL - модель разговора из каталога CLI: основные сразу, старые версии - в свёрнутой
 * группе, свои (прокси, шлюз) - следом с пометкой. «По умолчанию» - как в настройках
 * Claude Code. Последний пункт ведёт на экран, где свои модели добавляют. Смена идёт
 * живому процессу, без перезапуска разговора.
 */
export const ModelPicker = ({ conversation }: PickerProps) => {
  const { t } = useTranslation()
  const { setOptions } = useClaudeActions()
  const prefs = usePanelPrefs()
  const openMenu = useClaudeCodeStore((store) => store.openMenu)
  const models = pickableModels(useModelCatalog(), prefs.customModels)
  // Чип держит выбор; не та модель (CLI сменил сам, выбор не доехал) - жёлтым, ↯ - быстрый режим.
  const chip = modelChip(conversation, models, t)
  const toItem = (model: (typeof models)[number]) => (
    <MenuItem
      key={model.value}
      label={model.displayName}
      description={
        model.custom ? t('claudeCode.customModels.menuCustom') : model.description || undefined
      }
      current={model.value === conversation.model}
      onSelect={() => void setOptions(conversation.id, { model: model.value })}
    />
  )
  const items = models.filter((model) => !model.custom).map(toItem)

  return (
    <OptionPicker
      caption={t('claudeCode.status.modelCaption')}
      label={chip.label}
      tone={chip.warning ? 'warning' : undefined}
      mark={
        chip.fast && <span className={clsx(styles.fastMark, styles[chip.fast])}>{FAST_MARK}</span>
      }
      hint={chip.hint}
      menuLabel={t('claudeCode.model.menu')}>
      <MenuItem
        label={t('claudeCode.model.default')}
        description={t('claudeCode.model.defaultHint')}
        current={conversation.model === null}
        onSelect={() => void setOptions(conversation.id, { model: null })}
      />
      {items.slice(0, MAIN_MODELS - 1)}
      {items.length >= MAIN_MODELS && (
        <MenuSection title={t('claudeCode.model.other')} collapsible defaultCollapsed>
          {items.slice(MAIN_MODELS - 1)}
        </MenuSection>
      )}
      {models.filter((model) => model.custom).map(toItem)}
      <MenuSeparator />
      <FastModeItem conversation={conversation} />
      <MenuItem
        icon={Plus}
        label={t('claudeCode.customModels.menuAdd')}
        description={t('claudeCode.customModels.menuAddHint')}
        onSelect={() => openMenu('customModels')}
      />
    </OptionPicker>
  )
}
