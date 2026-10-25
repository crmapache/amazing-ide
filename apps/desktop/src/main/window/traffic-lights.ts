import { TRAFFIC_LIGHT_SIZE, TRAFFIC_LIGHT_INSET } from './main-window.constants'

/**
 * Место «светофора» macOS по середине шапки данной высоты: слева - постоянный отступ,
 * сверху - половина того, что остаётся от шапки под кнопками. Окно без рамки рисует
 * кнопки поверх шапки, а шапка растёт с размером текста.
 */
export const trafficLightPosition = (titleBarHeight: number) => ({
  x: TRAFFIC_LIGHT_INSET,
  y: Math.max(0, Math.round((titleBarHeight - TRAFFIC_LIGHT_SIZE) / 2)),
})
