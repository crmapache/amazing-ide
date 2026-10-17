import i18next from 'i18next'

import showcaseEn from '../../locales/showcase.en.json'

/**
 * Подписи витрины - своё пространство переводов, а не часть общего en.json: так они
 * едут в окно только вместе с витриной, то есть только в dev и в копии агента.
 * Модуль подключают компоненты витрины, которые грузятся первыми (кнопка и слой).
 */
i18next.addResourceBundle('en', 'showcase', showcaseEn)
