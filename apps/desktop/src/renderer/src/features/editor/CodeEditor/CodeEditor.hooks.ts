import { useRef, useEffect } from 'react'
import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { editor } from 'monaco-editor/editor/editor.api.js'

import { MAX_SELECTION_CHARS } from '@shared/claude-draft'

import { documents } from '../documents'
import { documentKey } from '../documents.utils'
import type { EditorDocument } from '../editor-document'
import { editorOptions, scrollbarOptions } from '../editor-options'
import { SAVE_COMMAND, MONACO_FIND_COMMANDS, SELECTION_PUBLISH_DELAY_MS } from '../editor.constants'
import { useEditorStore } from '../editor.store'
import type { DocumentStatus, MarkdownLayout } from '../editor.types'
import { useMarkdownLayoutStore } from '../markdown-layout.store'
import { usePreviewScrollSync } from '../markdown-scroll.hooks'
import { monaco } from '../monaco-setup'
import { editorTypography } from '../monaco-theme'
import { useEditorSelectionStore } from '../../../state/editor-selection.store'
import type { FilePlace } from '../../../state/selection.store'
import { placeRange, selectionLines, hasClassicScrollbars } from './CodeEditor.utils'

type Editor = editor.IStandaloneCodeEditor

/** Выделение в редакторе - полю ввода Claude Code: строки и текст, если он не длинный. */
const publishSelection = (instance: Editor, document: EditorDocument | null) => {
  const { setSelection } = useEditorSelectionStore.getState()
  const model = instance.getModel()
  const range = instance.getSelection()

  if (!document || !model || !range || range.isEmpty()) return setSelection(null)

  const text =
    model.getValueLengthInRange(range) <= MAX_SELECTION_CHARS
      ? model.getValueInRange(range)
      : undefined

  setSelection({
    projectId: document.projectId,
    path: document.path,
    ...selectionLines(range),
    text,
  })
}

/**
 * Шрифт кода подгружается, когда им впервые пишут, а Monaco меряет буквы при создании:
 * без перемера после загрузки курсор встал бы мимо букв.
 */
const remeasureWhenLoaded = () => {
  const { fontFamily, fontSize } = editorTypography()

  void document.fonts
    .load(`${fontSize}px ${fontFamily}`)
    .then(() => monaco.editor.remeasureFonts())
    .catch(() => undefined)
}

/**
 * Один редактор Monaco на всё окно (ADR 0005): создаётся вместе с компонентом, файлы
 * меняются моделями. Уход из редактора пишет файл сразу, ⌘S - тоже. Выделение после
 * короткой паузы уходит полю ввода Claude Code. Полосы прокрутки повторяют системные:
 * их вид macOS меняет на ходу, и проба замечает это по своему размеру.
 */
const useMonacoEditor = (shown: RefObject<EditorDocument | null>) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)

  useEffect(() => {
    const host = hostRef.current
    const probe = probeRef.current

    if (!host || !probe) return

    const instance = monaco.editor.create(host, editorOptions(hasClassicScrollbars(probe)))
    const scrollbars = new ResizeObserver(() =>
      instance.updateOptions({ scrollbar: scrollbarOptions(hasClassicScrollbars(probe)) }),
    )

    scrollbars.observe(probe)

    editorRef.current = instance

    // Палитра команд Monaco строится из этого списка: без поиска, его панели в IDE нет.
    const supportedActions = instance.getSupportedActions.bind(instance)

    instance.getSupportedActions = () =>
      supportedActions().filter((action) => !MONACO_FIND_COMMANDS.has(action.id))
    instance.onDidBlurEditorText(() => void shown.current?.save())
    // ⌘S - явная просьба: пишет и файл за проектом, и после отказа записи. Команда и
    // сочетание снимаются вместе с редактором: реестр Monaco общий на окно.
    const save = [
      monaco.editor.registerCommand(SAVE_COMMAND, () => void shown.current?.saveAsked()),
      monaco.editor.addKeybindingRule({
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        command: SAVE_COMMAND,
      }),
    ]

    remeasureWhenLoaded()

    let selectionTimer: number | undefined

    instance.onDidChangeCursorSelection(() => {
      window.clearTimeout(selectionTimer)
      selectionTimer = window.setTimeout(
        () => publishSelection(instance, shown.current),
        SELECTION_PUBLISH_DELAY_MS,
      )
    })

    return () => {
      for (const registration of save) registration.dispose()
      scrollbars.disconnect()
      window.clearTimeout(selectionTimer)
      useEditorSelectionStore.getState().setSelection(null)
      if (shown.current) shown.current.viewState = instance.saveViewState()

      shown.current = null
      instance.dispose()
      editorRef.current = null
    }
  }, [shown])

  return { hostRef, probeRef, editorRef }
}

/**
 * Редактор файла активной вкладки: документ файла, его модель в редакторе с курсором и
 * прокруткой, на которых файл оставили, место из ссылки и клавиатура по просьбе вкладки.
 * Рядом с просмотром Markdown - прокрутка вместе с ним.
 */
export const useCodeEditor = (
  projectId: string,
  path: string,
  place: FilePlace | undefined,
  status: DocumentStatus,
  layout: MarkdownLayout,
) => {
  const { t } = useTranslation()
  const shown = useRef<EditorDocument | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const focusSerial = useEditorStore((state) => state.focusSerial)
  // Просьбы до появления редактора - не к нему: открыл файл из дерева - клавиатура в дереве.
  const focusSeen = useRef(focusSerial)
  const { hostRef, probeRef, editorRef } = useMonacoEditor(shown)
  const readOnly = status.kind === 'text' && status.readOnly

  // Модель файла - в редактор, как только файл прочитан. Прежний файл запоминает, где
  // в нём стояли, и дописывается: переключение вкладки - тоже уход из файла.
  useEffect(() => {
    const instance = editorRef.current
    const document = documents.get(projectId, path)

    if (!instance) return

    const previous = shown.current

    if (previous && previous !== document) {
      previous.viewState = instance.saveViewState()
      void previous.save()
    }

    shown.current = document

    if (instance.getModel() === document.model) return

    instance.setModel(document.model)
    if (document.viewState) instance.restoreViewState(document.viewState)
  }, [editorRef, projectId, path, status.kind])

  useEffect(() => {
    editorRef.current?.updateOptions({
      readOnly,
      readOnlyMessage: { value: t('editor.readOnly') },
    })
  }, [editorRef, readOnly, t])

  usePreviewScrollSync(
    editorRef,
    previewRef,
    status.kind === 'text' && layout !== 'editor',
    documentKey(projectId, path),
  )

  // Место из ссылки (поиск, лента Claude Code): выделить и показать, клавиатура - сюда.
  // Один раз на место: документ помнит показанное и после возврата в проект. Файл открыт
  // одним просмотром - рядом встаёт код, и место ставится уже в нём.
  useEffect(() => {
    const instance = editorRef.current
    const model = instance?.getModel()
    const document = shown.current

    if (!instance || !model || !document || !place || document.placed === place) return
    if (layout === 'preview') return useMarkdownLayoutStore.getState().reveal(projectId, path)

    document.placed = place
    // Код мог только что показаться (был один просмотр): Monaco перемеряется в своём
    // ResizeObserver позже, а строку надо поставить в центр уже видимого окна.
    instance.layout()

    const range = placeRange(model, place)

    if (range) {
      instance.setSelection(range)
      instance.revealRangeInCenterIfOutsideViewport(range)
    }

    instance.focus()
  }, [editorRef, projectId, path, place, status.kind, layout])

  useEffect(() => {
    if (focusSerial === focusSeen.current) return

    focusSeen.current = focusSerial
    editorRef.current?.focus()
  }, [editorRef, focusSerial])

  return { hostRef, probeRef, previewRef, editorRef }
}

/** Ручка между кодом и просмотром: сдвиг мыши - доля ширины под код. */
export const useSplitResize = () => {
  const panesRef = useRef<HTMLDivElement>(null)
  const splitRatio = useMarkdownLayoutStore((state) => state.splitRatio)

  const handleResize = (deltaX: number) => {
    const width = panesRef.current?.clientWidth ?? 0
    const { splitRatio: current, setSplitRatio } = useMarkdownLayoutStore.getState()

    if (width > 0) setSplitRatio(current + deltaX / width)
  }

  return { panesRef, splitRatio, handleResize }
}
