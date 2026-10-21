import type { editor } from 'monaco-editor/editor/editor.api.js'

/**
 * Возврат кусков у разницы Monaco - методы экземпляра вне описанного API. Их зовут все его
 * кнопки возврата: стрелка у изменённых строк, стрелка в зазоре удалённых, «Revert this
 * change» у лампочки в одной колонке (кусок), стрелка «вернуть выделенное» (части строк).
 */
type RevertingDiff = {
  revert?: (mapping: { modified: { startLineNumber: number } }) => void
  revertRangeMappings?: (mappings: unknown) => void
}

/** Что нужно от разницы: правая сторона и сами методы возврата. */
type RevertSource = Pick<editor.IStandaloneDiffEditor, 'getModifiedEditor'> & RevertingDiff

/**
 * Возврат куска ставит фокус и курсор справа, к возвращаемому куску. Monaco возвращает его
 * отдельным шагом отмены, но фокус не трогает: ⌘Z уходил туда, где фокус был (в левую
 * сторону, в список изменений), и возврат не отменялся. Курсор встаёт к началу куска до
 * возврата - отмена вернёт его сюда, а не туда, где он стоял, и экран не уедет, - и после:
 * вставленные строки удалённого куска сдвинули бы его под себя. У «вернуть выделенное»
 * курсор не трогается - выделение и есть возвращаемое. Пока разница пересчитывается, Monaco
 * возврат молча пропускает (стрелки ещё от прошлой): тогда курсор остаётся, где был. Не
 * стало методов (новый Monaco) - возврат работает как у Monaco, без фокуса.
 */
export const focusOnRevert = (diff: RevertSource): void => {
  const modified = diff.getModifiedEditor()
  const { revert, revertRangeMappings } = diff

  if (typeof revert === 'function') {
    diff.revert = (mapping) => {
      const version = modified.getModel()?.getVersionId()
      const selection = modified.getSelection()
      const toChange = () =>
        modified.setPosition({ lineNumber: mapping.modified.startLineNumber, column: 1 })

      modified.focus()
      toChange()
      revert.call(diff, mapping)

      if (modified.getModel()?.getVersionId() !== version) toChange()
      else if (selection) modified.setSelection(selection)
    }
  }

  if (typeof revertRangeMappings === 'function') {
    diff.revertRangeMappings = (mappings) => {
      modified.focus()
      revertRangeMappings.call(diff, mappings)
    }
  }
}
