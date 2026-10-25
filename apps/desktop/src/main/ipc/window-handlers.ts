import type { BrowserWindow } from 'electron'

import type { WindowInvokeContract } from '@shared/ipc/window.contract'

import { TITLE_BAR_HEIGHT_LIMITS } from '../window/main-window.constants'
import { trafficLightPosition } from '../window/traffic-lights'
import type { InvokeHandlers } from './handle'

type WindowChannels = keyof WindowInvokeContract

const assertTitleBarHeight = (value: unknown): number => {
  const { min, max } = TITLE_BAR_HEIGHT_LIMITS

  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error('Высота шапки - не число в пределах')
  }

  return value
}

/**
 * Каналы рамки окна: «светофор» macOS - по середине шапки, которую окно померило. Кнопки
 * рисует система, и только на macOS их можно сдвинуть.
 */
export const createWindowHandlers = (
  getWindow: () => BrowserWindow | null,
): Pick<InvokeHandlers, WindowChannels> => ({
  'window:setTitleBarHeight': ({ height }) => {
    const position = trafficLightPosition(assertTitleBarHeight(height))

    if (process.platform === 'darwin') getWindow()?.setWindowButtonPosition(position)
  },
})
