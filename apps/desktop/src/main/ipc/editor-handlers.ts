import { app } from 'electron'

import type { EditorInvokeContract } from '@shared/ipc/editor.contract'

import { readImageFile } from '../fs/image-file'
import { readTextFile } from '../fs/text-file'
import { writeTextFile } from '../fs/text-write'
import { readWebImage } from '../preview/web-image'
import { fetchWebImage } from '../preview/web-image-session'
import { editorSaved, allowUnsavedQuit } from '../window/editor-save'
import type { WorkspaceService } from '../workspace/workspace-service'
import type { InvokeHandlers } from './handle'
import { assertString } from './validate'
import { projectRootOf } from './workspace-handlers'

type EditorChannels = keyof EditorInvokeContract

const assertBoolean = (value: unknown, name: string): boolean => {
  if (typeof value !== 'boolean') throw new Error(`Ожидалось да или нет в поле ${name}`)

  return value
}

const versionOrNull = (value: unknown, name: string): string | null => {
  if (value === null || value === undefined) return null

  assertString(value, name)

  return value
}

/** Каналы редактора: проект - только открытый, поля - нужного типа, дальше - main/fs. */
export const createEditorHandlers = (
  workspace: WorkspaceService,
): Pick<InvokeHandlers, EditorChannels> => ({
  'fs:readFile': ({ projectId, relativePath, known }) => {
    assertString(relativePath, 'relativePath')

    return readTextFile(
      projectRootOf(workspace, projectId),
      relativePath,
      versionOrNull(known, 'known'),
    )
  },
  'fs:writeFile': ({ projectId, relativePath, text, bom, expected, base, outside }) => {
    assertString(relativePath, 'relativePath')
    assertString(text, 'text')

    return writeTextFile(projectRootOf(workspace, projectId), relativePath, {
      text,
      bom: assertBoolean(bom, 'bom'),
      expected: versionOrNull(expected, 'expected'),
      base: versionOrNull(base, 'base'),
      outside: outside === undefined ? false : assertBoolean(outside, 'outside'),
    })
  },
  'fs:readImage': ({ projectId, relativePath, known }) => {
    assertString(relativePath, 'relativePath')

    return readImageFile(
      projectRootOf(workspace, projectId),
      relativePath,
      versionOrNull(known, 'known'),
    )
  },
  'preview:readWebImage': ({ url }) => {
    assertString(url, 'url')

    return readWebImage(url, fetchWebImage)
  },
  'editor:savedAll': ({ unsaved }) => {
    editorSaved(Number.isInteger(unsaved) && unsaved > 0 ? unsaved : 0)
  },
  'editor:allowQuit': ({ quit }) => {
    allowUnsavedQuit()

    if (assertBoolean(quit, 'quit')) app.quit()
  },
})
