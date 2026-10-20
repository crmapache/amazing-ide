/** Пункты, между которыми ходят стрелки: доступные пункты меню. */
export const ITEM_SELECTOR = '[role^="menuitem"]:not(:disabled)'

export const NAVIGATION_KEYS: ReadonlySet<string> = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End'])

/** Куда ставить фокус при появлении меню, если есть такой элемент. */
export const AUTOFOCUS_SELECTOR = '[data-autofocus]'
