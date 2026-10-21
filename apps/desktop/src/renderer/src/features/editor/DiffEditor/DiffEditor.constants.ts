/**
 * Действия разницы на клавишах WebStorm: F7 и Shift+F7 - к следующей и предыдущей правке,
 * F4 - сам файл в редакторе (Jump to Source). Ставятся обеим сторонам разницы: клавиша
 * работает, с какой стороны ни стоял курсор. Отмена и повтор - только левой: в ней правок
 * нет, её ⌘Z и ⇧⌘Z - отмена и повтор правой стороны.
 */
export const DIFF_ACTIONS = {
  nextChange: 'amazingIde.diff.nextChange',
  previousChange: 'amazingIde.diff.previousChange',
  openFile: 'amazingIde.diff.openFile',
  undo: 'amazingIde.diff.undo',
  redo: 'amazingIde.diff.redo',
} as const
