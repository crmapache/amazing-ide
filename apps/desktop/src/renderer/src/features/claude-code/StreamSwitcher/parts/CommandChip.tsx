import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@amazing-ide/ui/IconButton'
import { Tooltip } from '@amazing-ide/ui/Tooltip'

import styles from '../StreamSwitcher.module.scss'
import type { CommandChipProps } from '../StreamSwitcher.types'
import { commandLabel } from '../StreamSwitcher.utils'
import { inputText } from '../../claude.utils'
import { StatusDot } from '../../StatusDot/StatusDot'
import { ChipClock } from './ChipClock'

/**
 * Фоновая команда - не поток: своего журнала у неё нет, нажимать некуда. Чип - знак, что
 * процесс жив, и он стоит ровно столько, сколько процесс идёт. Подсказка - сама команда
 * и описание модели: «что это всё ещё работает» - вопрос, который чип и задаёт.
 */
export const CommandChip = ({ tool, onStop }: CommandChipProps) => {
  const { t } = useTranslation()
  const command = inputText(tool.input, 'command')
  const description = inputText(tool.input, 'description')
  const label = commandLabel(command) || description
  const hint = [command.split('\n')[0]?.trim(), description].filter(Boolean).join('\n')

  const handleStop = () =>
    onStop({ taskId: tool.task?.taskId ?? '', kind: 'command', subject: description || label })

  return (
    <div className={styles.chip}>
      <Tooltip label={hint} disabled={!hint}>
        <span className={styles.static}>
          <StatusDot status="running" />
          <span className={styles.label}>{t('claudeCode.agents.streams.background')}</span>
          <ChipClock startedAt={tool.task?.startedAt ?? 0} />
          {label && <span className={styles.meta}>{label}</span>}
        </span>
      </Tooltip>
      {tool.task?.taskId && (
        <IconButton
          icon={X}
          size="sm"
          label={t('claudeCode.agents.streams.stopCommand')}
          onClick={handleStop}
        />
      )}
    </div>
  )
}
