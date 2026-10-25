/**
 * Команда меню приложения, которая принадлежит окну целиком, а не одному виду: открыть
 * настройки IDE (⌘,), сделать текст крупнее, мельче или вернуть как было (⌘+, ⌘-, ⌘0).
 */
export type WindowCommand = 'openSettings' | 'textSizeUp' | 'textSizeDown' | 'textSizeReset'
