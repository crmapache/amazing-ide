import { useUpdateStatusSync } from '../../state/updates.queries'
import { useWorkspaceSync } from '../../state/workspace.queries'

/**
 * Подписки на события главного процесса - по одной на всё окно. Отдельный
 * компонент, потому что подпискам нужен кэш React Query, а он есть только внутри
 * провайдера.
 */
export const MainProcessSync = () => {
  useWorkspaceSync()
  useUpdateStatusSync()

  return null
}
