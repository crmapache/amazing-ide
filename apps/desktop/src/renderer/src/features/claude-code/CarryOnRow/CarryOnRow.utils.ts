import type { TFunction } from 'i18next'

import type { UserFeedItem } from '@shared/claude-feed'

/**
 * Почему сообщение написала панель - подсказка над PANEL. Незнакомая причина (транскрипт
 * более новой версии) - без подсказки: за причину, которую не знаем, не ручаемся.
 */
export const autoWhy = (auto: UserFeedItem['auto'], t: TFunction): string =>
  auto && auto !== 'unknown' ? t(`claudeCode.carryOn.why.${auto}`) : ''
