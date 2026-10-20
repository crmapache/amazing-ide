import type { PathLocation } from '../fs'

type ProjectRequest = { projectId: string }

/**
 * Часть контракта (contract.ts) про пути из текста: ссылка в ленте Claude Code ведёт
 * в файл или папку проекта, наружу или в никуда, и ответ на это знает только диск.
 * Отдельным файлом по области: общий контракт перерос лимит строк. В InvokeContract и
 * INVOKE_CHANNELS входит целиком, правила те же (.claude/rules/ipc-contract.md).
 */
export type FsPathsInvokeContract = {
  /**
   * Куда ведёт путь, как его написали: от корня, абсолютный, «~/…», голое имя. Голое
   * имя ищется по тем же файлам проекта, что кормят «@».
   */
  'fs:locatePath': { request: ProjectRequest & { path: string }; response: PathLocation }
  /**
   * Файл или папка вне проекта - системой: файл открывается своей программой, а папка и
   * всё исполняемое (приложение, скрипт, установщик) только показывается в Finder.
   * false - такого нет или путь отвергнут.
   */
  'fs:openOutside': {
    request: ProjectRequest & { path: string; reveal: boolean }
    response: boolean
  }
}

/** Каналы этой части в рантайме: их разворачивает INVOKE_CHANNELS. */
export const FS_PATHS_CHANNELS = {
  'fs:locatePath': true,
  'fs:openOutside': true,
} satisfies Record<keyof FsPathsInvokeContract, true>
