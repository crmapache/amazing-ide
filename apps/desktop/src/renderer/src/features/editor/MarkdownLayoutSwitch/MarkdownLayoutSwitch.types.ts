import type { LucideIcon } from 'lucide-react'

import type { MarkdownLayout } from '../editor.types'

export type MarkdownLayoutSwitchProps = {
  projectId: string
  /** Файл Markdown активной вкладки. */
  path: string
}

/** Кнопка вида: какой вид, значок и ключ подписи. */
export type LayoutOption = {
  layout: MarkdownLayout
  icon: LucideIcon
  labelKey: 'editor.markdown.editor' | 'editor.markdown.split' | 'editor.markdown.preview'
}
