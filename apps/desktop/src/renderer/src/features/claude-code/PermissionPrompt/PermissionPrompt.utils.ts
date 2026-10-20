import type { TFunction } from 'i18next'

import { baseName, inputText } from '../claude.utils'
import { toolLabel } from '../tool-summary.utils'
import type { PermissionRequest } from './PermissionPrompt.types'

const text = (request: PermissionRequest, key: string) => inputText(request.input, key)

/** Что модель хочет сделать - человеческой фразой: «хочет запустить команду». */
export const permissionTitle = (request: PermissionRequest, t: TFunction): string => {
  const file = baseName(text(request, 'file_path') || text(request, 'notebook_path'))

  switch (request.toolName) {
    case 'Bash':
      return t('claudeCode.permission.run')
    case 'Edit':
    case 'MultiEdit':
    case 'NotebookEdit':
      return t('claudeCode.permission.edit', { file })
    case 'Write':
      return t('claudeCode.permission.write', { file })
    case 'WebFetch':
      return t('claudeCode.permission.fetch', { target: text(request, 'url') })
    case 'WebSearch':
      return t('claudeCode.permission.fetch', { target: text(request, 'query') })
    default:
      return t('claudeCode.permission.use', { tool: toolLabel(request.toolName) })
  }
}
