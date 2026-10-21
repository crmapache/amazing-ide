import type { THEME_ROLES } from './monaco-theme.constants'

/** Цвет в долях: каналы 0-255, прозрачность 0-1. */
export type Rgba = { r: number; g: number; b: number; a: number }

/** Роли темы, переведённые в цвет. */
export type ThemeColors = Record<keyof typeof THEME_ROLES, Rgba>

/** Насколько тон проступает в подложке и в метке (--tint-soft, --tint-border), долей 0-1. */
export type ThemeTints = { soft: number; border: number }
