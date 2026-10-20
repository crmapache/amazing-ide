import { useTranslation } from 'react-i18next'

import { EFFORT_LEVELS } from '@shared/claude'

import { MenuItem } from '@amazing-ide/ui/MenuItem'

import type { PickerProps } from '../ComposerStatus.types'
import { useClaudeActions } from '../../claude-actions.hooks'
import { OptionPicker } from './OptionPicker'

/** EFFORT - сколько модель думает перед ответом. «По умолчанию» - как в настройках Claude Code. */
export const EffortPicker = ({ conversation }: PickerProps) => {
  const { t } = useTranslation()
  const { setOptions } = useClaudeActions()
  const label = conversation.effort
    ? t(`claudeCode.effort.levels.${conversation.effort}`)
    : t('claudeCode.effort.default')

  return (
    <OptionPicker
      caption={t('claudeCode.status.effortCaption')}
      label={label}
      hint={t('claudeCode.status.effortHint', { value: label })}
      menuLabel={t('claudeCode.effort.menu')}>
      <MenuItem
        label={t('claudeCode.effort.default')}
        description={t('claudeCode.effort.defaultHint')}
        current={conversation.effort === null}
        onSelect={() => void setOptions(conversation.id, { effort: null })}
      />
      {EFFORT_LEVELS.map((level) => (
        <MenuItem
          key={level}
          label={t(`claudeCode.effort.levels.${level}`)}
          description={t(`claudeCode.effort.hints.${level}`)}
          current={level === conversation.effort}
          onSelect={() => void setOptions(conversation.id, { effort: level })}
        />
      ))}
    </OptionPicker>
  )
}
