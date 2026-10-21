import { useRef, useState, useEffect } from 'react'
import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { editor } from 'monaco-editor/editor/editor.api.js'

import { showWhenCompared } from '../diff-reveal'
import { focusOnRevert } from '../diff-revert'
import { useDiffViewStore } from '../diff-view.store'
import { putText } from '../document-model'
import { documents } from '../documents'
import { takeFocus, hideFindFromPalette, remeasureWhenLoaded } from '../editor-instance'
import { diffViewOptions, scrollbarOptions, diffEditorOptions } from '../editor-options'
import { watchSelection } from '../editor-selection'
import type { SelectionWatch } from '../editor-selection'
import { useEditorStore } from '../editor.store'
import { monaco } from '../monaco-setup'
import { hasClassicScrollbars } from '../CodeEditor/CodeEditor.utils'
import { languageOfPath } from '../../../lib/syntax-languages.utils'
import { useSelectionStore } from '../../../state/selection.store'
import { DIFF_ACTIONS } from './DiffEditor.constants'
import type { DiffState, DiffActions } from './DiffEditor.types'

type Diff = editor.IStandaloneDiffEditor
type Editor = editor.IStandaloneCodeEditor

/**
 * Разница Monaco: создаётся вместе с компонентом, файлы меняются парами моделей. Правая
 * сторона - документ файла, как в редакторе: уход из неё пишет файл, выделение уходит полю
 * Claude Code. Вид (колонки, свёрнутое) берётся из выбора человека и меняется на ходу.
 */
const useMonacoDiff = (isShown: RefObject<boolean>) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLDivElement>(null)
  const diffRef = useRef<Diff | null>(null)
  const originalRef = useRef<Editor | null>(null)
  const modifiedRef = useRef<Editor | null>(null)
  const selectionRef = useRef<SelectionWatch | null>(null)

  useEffect(() => {
    const host = hostRef.current
    const probe = probeRef.current

    if (!host || !probe) return

    const diff = monaco.editor.createDiffEditor(
      host,
      diffEditorOptions(hasClassicScrollbars(probe), useDiffViewStore.getState()),
    )
    const original = diff.getOriginalEditor()
    const modified = diff.getModifiedEditor()
    const scrollbars = new ResizeObserver(() =>
      diff.updateOptions({ scrollbar: scrollbarOptions(hasClassicScrollbars(probe)) }),
    )
    const shownDocument = () => documents.findByModel(modified.getModel()) ?? null

    scrollbars.observe(probe)
    diffRef.current = diff
    originalRef.current = original
    modifiedRef.current = modified

    hideFindFromPalette(original)
    hideFindFromPalette(modified)
    focusOnRevert(diff)
    modified.onDidBlurEditorText(() => void shownDocument()?.save())
    remeasureWhenLoaded()

    const selection = watchSelection(modified, shownDocument, () => isShown.current)

    selectionRef.current = selection

    const view = useDiffViewStore.subscribe((state) => diff.updateOptions(diffViewOptions(state)))
    // Модель уходит, пока стоит в разнице (документ файла закрыли): сначала отпустить пару -
    // иначе Monaco считает это ошибкой. Сервис моделей узнаёт об уходе раньше самой разницы.
    const disposing = monaco.editor.onWillDisposeModel((model) => {
      const pair = diff.getModel()

      if (pair?.original === model || pair?.modified === model) diff.setModel(null)
    })

    return () => {
      scrollbars.disconnect()
      selection.dispose()
      view()
      disposing.dispose()
      diff.setModel(null)
      diff.dispose()
      diffRef.current = null
      originalRef.current = null
      modifiedRef.current = null
      selectionRef.current = null
    }
  }, [isShown])

  return { hostRef, probeRef, diffRef, originalRef, modifiedRef, selectionRef }
}

/**
 * Пара моделей в разнице: слева - текст из коммита, справа - документ файла или пустота у
 * удалённого. Документ запрашивается сразу, пока коммит ещё читается; держит его вкладка
 * разницы. Пара создаётся на файл: новый текст коммита того же файла (коммит в терминале)
 * встаёт в левую модель, и разница пересчитывается на месте, как при наборе справа.
 */
const useDiffModels = (
  diffRef: RefObject<Diff | null>,
  { projectId, path, needsDocument, state }: DiffModelsInput,
) => {
  const original = state.kind === 'ready' ? state.original : null
  const modified = state.kind === 'ready' ? state.modified : null
  const originalText = useRef(original)
  const originalModel = useRef<editor.ITextModel | null>(null)

  useEffect(() => {
    if (needsDocument) documents.get(projectId, path)
  }, [projectId, path, needsDocument])

  // Только середина, а не весь текст: целиком Monaco потерял бы метки свёрнутого и развернул
  // файл; так он сдвигает их с текстом, и что было на виду, на виду и остаётся.
  useEffect(() => {
    originalText.current = original
    if (original !== null && originalModel.current) putText(originalModel.current, original)
  }, [original])

  useEffect(() => {
    const diff = diffRef.current
    const text = originalText.current

    if (!diff || text === null || modified === null) return

    const language = languageOfPath(path) ?? 'plaintext'
    const document = modified === 'document' ? documents.find(projectId, path) : undefined
    const left = monaco.editor.createModel(text, language)
    const right = document?.model ?? monaco.editor.createModel('', language)
    const reveal = showWhenCompared(diff, diff.getContainerDomNode())

    diff.setModel({ original: left, modified: right })
    originalModel.current = left

    return () => {
      reveal.dispose()
      originalModel.current = null
      // Разницу уже убрали вместе с компонентом - она отпустила пару сама.
      if (diff.getModel()?.original === left) diff.setModel(null)

      left.dispose()
      if (right !== document?.model) right.dispose()
    }
  }, [diffRef, projectId, path, modified])
}

type DiffModelsInput = { projectId: string; path: string; needsDocument: boolean; state: DiffState }

/** Сколько правок нашёл Monaco; null - ещё считает или пары нет. */
const useChangeCount = (diffRef: RefObject<Diff | null>) => {
  const [counted, setCounted] = useState<DiffCount>(NOT_COUNTED)

  useEffect(() => {
    const diff = diffRef.current

    if (!diff) return

    // Переводы строк сравниваются, только когда текст есть с обеих сторон: у нового файла
    // пустая сторона - перевод строк Monaco по умолчанию, а не файла.
    const update = () => {
      const pair = diff.getModel()

      setCounted(
        pair
          ? {
              count: diff.getLineChanges()?.length ?? null,
              eolChanged:
                pair.original.getValueLength() > 0 &&
                pair.modified.getValueLength() > 0 &&
                pair.original.getEOL() !== pair.modified.getEOL(),
            }
          : NOT_COUNTED,
      )
    }
    const listeners = [diff.onDidUpdateDiff(update), diff.onDidChangeModel(update)]

    return () => {
      for (const listener of listeners) listener.dispose()
    }
  }, [diffRef])

  return counted
}

/** Сколько правок нашёл Monaco (null - ещё считает или пары нет) и разные ли переводы строк. */
type DiffCount = { count: number | null; eolChanged: boolean }

const NOT_COUNTED: DiffCount = { count: null, eolChanged: false }

/**
 * Переходы по правкам и к самому файлу - кнопками панели и клавишами WebStorm (F7, Shift+F7,
 * F4) с любой стороны разницы. Файл открывается на строке, где стоит курсор справа. ⌘Z и
 * ⇧⌘Z слева - отмена и повтор файла справа: в коммите отменять нечего, а нажимают их, чтобы
 * вернуть правку файла (кусок, возвращённый стрелкой). Фокус уходит туда, где видна отмена.
 */
const useDiffActions = (
  { diffRef, originalRef, modifiedRef }: ReturnType<typeof useMonacoDiff>,
  { projectId, path, canOpen }: { projectId: string; path: string; canOpen: boolean },
): DiffActions => {
  const { t } = useTranslation()
  const selectFile = useSelectionStore((state) => state.selectFile)

  const goTo = (target: 'next' | 'previous') => {
    diffRef.current?.goToDiff(target)
    modifiedRef.current?.focus()
  }

  const actions: DiffActions = {
    previousChange: () => goTo('previous'),
    nextChange: () => goTo('next'),
    openFile: canOpen
      ? () => {
          const line = modifiedRef.current?.getPosition()?.lineNumber

          selectFile(projectId, path, line === undefined ? undefined : { line })
        }
      : null,
  }
  const latest = useRef(actions)

  useEffect(() => {
    latest.current = actions
  })

  useEffect(() => {
    const { KeyCode, KeyMod } = monaco
    const original = originalRef.current
    const modified = modifiedRef.current
    const inFile = (command: 'undo' | 'redo') => () => {
      modified?.focus()
      modified?.trigger('keyboard', command, null)
    }
    const registrations = [original, modified].flatMap((instance) =>
      instance
        ? [
            instance.addAction({
              id: DIFF_ACTIONS.nextChange,
              label: t('editor.diff.nextChange'),
              keybindings: [KeyCode.F7],
              run: () => latest.current.nextChange(),
            }),
            instance.addAction({
              id: DIFF_ACTIONS.previousChange,
              label: t('editor.diff.previousChange'),
              keybindings: [KeyMod.Shift | KeyCode.F7],
              run: () => latest.current.previousChange(),
            }),
            instance.addAction({
              id: DIFF_ACTIONS.openFile,
              label: t('editor.diff.openFile'),
              keybindings: [KeyCode.F4],
              run: () => latest.current.openFile?.(),
            }),
          ]
        : [],
    )
    const history = original
      ? [
          original.addAction({
            id: DIFF_ACTIONS.undo,
            label: t('editor.diff.undo'),
            keybindings: [KeyMod.CtrlCmd | KeyCode.KeyZ],
            run: inFile('undo'),
          }),
          original.addAction({
            id: DIFF_ACTIONS.redo,
            label: t('editor.diff.redo'),
            keybindings: [KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ],
            run: inFile('redo'),
          }),
        ]
      : []

    return () => {
      for (const registration of [...registrations, ...history]) registration.dispose()
    }
  }, [originalRef, modifiedRef, t])

  return actions
}

/**
 * Разница файла с последним коммитом на Monaco: модели сторон, счёт правок, переходы и
 * клавиатура по просьбе вкладки - только у активной, спрятанная за файлом её не берёт.
 */
export const useDiffEditor = ({
  projectId,
  path,
  isActive,
  needsDocument,
  state,
  canOpen,
}: DiffModelsInput & { isActive: boolean; canOpen: boolean }) => {
  const { t } = useTranslation()
  const isShown = useRef(isActive)
  const monacoDiff = useMonacoDiff(isShown)
  const readOnly = state.kind === 'ready' && state.readOnly
  const focusSerial = useEditorStore((store) => store.focusSerial)
  // Просьбы до появления разницы - не к ней: открыл разницу из списка - клавиатура в списке.
  const focusSeen = useRef(focusSerial)

  useDiffModels(monacoDiff.diffRef, { projectId, path, needsDocument, state })

  const { count, eolChanged } = useChangeCount(monacoDiff.diffRef)
  const actions = useDiffActions(monacoDiff, {
    projectId,
    path,
    canOpen,
  })

  useEffect(() => {
    monacoDiff.diffRef.current?.updateOptions({
      readOnly,
      readOnlyMessage: { value: t('editor.readOnly') },
    })
  }, [monacoDiff.diffRef, readOnly, t])

  // Вкладка разницы снова активна - полю Claude Code выделение в ней, а не то, что было в файле.
  useEffect(() => {
    isShown.current = isActive
    if (isActive) monacoDiff.selectionRef.current?.publish()
  }, [monacoDiff.selectionRef, isActive])

  useEffect(() => {
    if (focusSerial === focusSeen.current) return

    focusSeen.current = focusSerial
    if (isActive) takeFocus(monacoDiff.modifiedRef.current)
  }, [monacoDiff.modifiedRef, focusSerial, isActive])

  return { ...monacoDiff, count, eolChanged, actions }
}
