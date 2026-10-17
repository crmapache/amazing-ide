export const DEFAULT_WINDOW_SIZE = { width: 1440, height: 900 }

export const MIN_WINDOW_SIZE = { width: 960, height: 600 }

/**
 * Фон окна до первой отрисовки страницы. Совпадает с --color-bg-app из
 * packages/ui/src/styles/tokens.css: иначе при старте мелькает белый прямоугольник.
 */
export const WINDOW_BACKGROUND = '#050505'

/**
 * «Светофор» macOS по центру шапки окна: высота шапки - --size-title-bar (40px),
 * кнопки - около 14px. Место под них слева - --size-traffic-lights.
 */
export const TRAFFIC_LIGHT_POSITION = { x: 16, y: 13 }
