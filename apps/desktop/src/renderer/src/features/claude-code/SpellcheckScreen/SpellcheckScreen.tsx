import { PrefSwitchScreen } from '../PrefSwitchScreen/PrefSwitchScreen'

/**
 * Settings → Spell check: подчёркивать ли слова, которых нет в словаре, - в поле
 * сообщения и других полях для прозы. Исправления - в контекстном меню слова.
 */
export const SpellcheckScreen = () => <PrefSwitchScreen pref="spellcheck" />
