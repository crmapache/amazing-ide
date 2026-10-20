import { useUpdateStatusSync } from '../../state/updates.queries'
import { useWorkspaceSync } from '../../state/workspace.queries'
import { useAsideSync } from '../../features/claude-code/aside.queries'
import { useClaudeSync } from '../../features/claude-code/claude.queries'
import { useClaudeSearchSync } from '../../features/claude-code/search.queries'
import { useSpellcheckSync } from '../../features/claude-code/spellcheck.hooks'

/**
 * Подписки на события главного процесса - по одной на всё окно. Отдельный
 * компонент, потому что подпискам нужен кэш React Query, а он есть только внутри
 * провайдера.
 */
export const MainProcessSync = () => {
  useWorkspaceSync()
  useUpdateStatusSync()
  useClaudeSync()
  useAsideSync()
  useSpellcheckSync()
  useClaudeSearchSync()

  return null
}
