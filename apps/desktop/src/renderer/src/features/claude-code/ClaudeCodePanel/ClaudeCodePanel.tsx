import { useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { ClaudeCodeView } from '../ClaudeCodeView/ClaudeCodeView'
import { PanelCrash } from '../PanelCrash/PanelCrash'

/**
 * Правая панель Claude Code целиком - за границей ошибок. «Reload the panel» собирает её
 * заново: зеркала данных главного процесса перечитываются, дерево монтируется с нуля, а
 * окно IDE и разговоры (они в главном процессе) остаются как были.
 */
export const ClaudeCodePanel = () => {
  const queryClient = useQueryClient()
  const [generation, setGeneration] = useState(0)

  const handleReload = () => {
    void queryClient.resetQueries({ queryKey: ['claude'] })
    setGeneration((value) => value + 1)
  }

  return (
    <PanelCrash key={generation} onReload={handleReload}>
      <ClaudeCodeView />
    </PanelCrash>
  )
}
