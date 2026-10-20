import { useEffect } from 'react'

import { usePanelPrefs } from './claude.queries'

/**
 * Проверка орфографии (Settings → Spell check) - атрибутом на корне документа, как в
 * ACC: поле сообщения, ответ на вопрос и прочие поля для прозы наследуют его сами, а у
 * полей имён и путей свой spellCheck={false}. Включено - атрибут снимается, остаётся
 * поведение браузера; выключение снимает уже нарисованные подчёркивания сразу.
 */
export const useSpellcheckSync = () => {
  const { spellcheck } = usePanelPrefs()

  useEffect(() => {
    if (spellcheck) document.documentElement.removeAttribute('spellcheck')
    else document.documentElement.setAttribute('spellcheck', 'false')
  }, [spellcheck])
}
