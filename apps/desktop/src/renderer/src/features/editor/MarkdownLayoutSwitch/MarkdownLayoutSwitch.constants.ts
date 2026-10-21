import { Eye, Columns2, TextAlignStart } from 'lucide-react'

import type { LayoutOption } from './MarkdownLayoutSwitch.types'

/** Виды по порядку, как в WebStorm: код, код и просмотр, просмотр. */
export const LAYOUT_OPTIONS: readonly LayoutOption[] = [
  { layout: 'editor', icon: TextAlignStart, labelKey: 'editor.markdown.editor' },
  { layout: 'split', icon: Columns2, labelKey: 'editor.markdown.split' },
  { layout: 'preview', icon: Eye, labelKey: 'editor.markdown.preview' },
]
