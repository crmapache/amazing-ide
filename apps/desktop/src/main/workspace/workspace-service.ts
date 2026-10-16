import { randomUUID } from 'node:crypto'
import { stat } from 'node:fs/promises'

import type { Project, WorkspaceState } from '@shared/workspace'

import type { JsonFile } from '../storage/json-file'
import { addProject, closeProject, activateProject, parseStoredWorkspace } from './workspace-state'

const isExistingDirectory = async (path: string) => {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

/**
 * Открытые проекты. Единственный владелец этого состояния: держит его в памяти,
 * пишет на диск и сообщает окну о каждом изменении. Окно только зеркалит.
 */
export class WorkspaceService {
  private constructor(
    private state: WorkspaceState,
    private readonly file: JsonFile<WorkspaceState>,
    private readonly onChange: (state: WorkspaceState) => void,
  ) {}

  /**
   * Поднимает сохранённое состояние. Папки, которых больше нет на диске
   * (удалили, переименовали), выпадают и из вкладок, и из недавних.
   */
  static async load(
    file: JsonFile<WorkspaceState>,
    onChange: (state: WorkspaceState) => void,
  ): Promise<WorkspaceService> {
    const stored = parseStoredWorkspace(await file.read())
    const existing = async <T extends { rootPath: string }>(items: T[]) => {
      const presence = await Promise.all(items.map((item) => isExistingDirectory(item.rootPath)))

      return items.filter((_item, index) => presence[index])
    }
    const state = parseStoredWorkspace({
      ...stored,
      projects: await existing(stored.projects),
      recentProjects: await existing(stored.recentProjects),
    })

    return new WorkspaceService(state, file, onChange)
  }

  getState(): WorkspaceState {
    return this.state
  }

  findProject(projectId: string): Project | undefined {
    return this.state.projects.find((project) => project.id === projectId)
  }

  openProject(rootPath: string): Promise<WorkspaceState> {
    return this.commit(addProject(this.state, rootPath, randomUUID))
  }

  /**
   * Открыть недавний проект. Путь из окна принимается, только если он и правда в
   * списке недавних: окно не может так открыть произвольную папку.
   */
  openRecentProject(rootPath: string): Promise<WorkspaceState> {
    const isRecent = this.state.recentProjects.some((project) => project.rootPath === rootPath)

    if (!isRecent) throw new Error(`Проекта ${rootPath} нет среди недавних`)

    return this.openProject(rootPath)
  }

  closeProject(projectId: string): Promise<WorkspaceState> {
    return this.commit(closeProject(this.state, projectId))
  }

  activateProject(projectId: string): Promise<WorkspaceState> {
    return this.commit(activateProject(this.state, projectId))
  }

  private async commit(next: WorkspaceState): Promise<WorkspaceState> {
    if (next === this.state) return next

    this.state = next
    await this.file.write(next)
    this.onChange(next)

    return next
  }
}
