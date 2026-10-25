import type { WindowCommand } from '@shared/window'

import { useIpcEvent } from '../../lib/ipc.hooks'
import { useTextSizeStore } from '../../state/text-size.store'
import { useSettingsStore } from '../../features/settings/settings.store'

/**
 * Команды меню приложения для окна целиком (window:command): Settings… (⌘,) открывает
 * настройки IDE, ⌘+, ⌘- и ⌘0 двигают размер текста - тот же, что ползунок в настройках.
 * Меню забирает эти клавиши раньше страницы, поэтому они приходят событием.
 */
export const useWindowCommands = () => {
  const openSettings = useSettingsStore((state) => state.open)
  const stepTextSize = useTextSizeStore((state) => state.stepTextSize)
  const resetTextSize = useTextSizeStore((state) => state.resetTextSize)

  const commands: Record<WindowCommand, () => void> = {
    openSettings,
    textSizeUp: () => stepTextSize(1),
    textSizeDown: () => stepTextSize(-1),
    textSizeReset: resetTextSize,
  }

  useIpcEvent('window:command', (command) => commands[command]())
}
