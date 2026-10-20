import type { ComposerLayout } from '@shared/claude-prefs'

/**
 * Раскладки поля, которые есть в IDE. Колонки слева и справа у ACC - из-за краёв окна
 * JetBrains; здесь панель всегда справа, и колонка у края отняла бы ширину у ленты.
 */
export const LAYOUT_CHOICES = ['bottom', 'compact'] as const satisfies readonly ComposerLayout[]
