import { basename } from 'node:path'

import type { Project, ProjectRef, WorkspaceState } from '@shared/workspace'

import { RECENT_PROJECTS_LIMIT } from './workspace.constants'

/**
 * Чистые переходы набора проектов. Ни диска, ни окна: на вход старое состояние,
 * на выход новое, - поэтому всё это покрыто тестами без Electron.
 */

export const EMPTY_WORKSPACE: WorkspaceState = {
  projects: [],
  activeProjectId: null,
  recentProjects: [],
}

const withoutRecent = (recent: ProjectRef[], rootPath: string) =>
  recent.filter((project) => project.rootPath !== rootPath)

/**
 * Открыть папку. Уже открытая не дублируется, а становится активной. Если папка была
 * среди недавних, оттуда она уходит.
 */
export const addProject = (
  state: WorkspaceState,
  rootPath: string,
  createId: () => string,
): WorkspaceState => {
  const existing = state.projects.find((project) => project.rootPath === rootPath)

  if (existing) {
    return { ...state, activeProjectId: existing.id }
  }

  const project: Project = { id: createId(), name: basename(rootPath), rootPath }

  return {
    projects: [...state.projects, project],
    activeProjectId: project.id,
    recentProjects: withoutRecent(state.recentProjects, rootPath),
  }
}

/**
 * Закрыть проект. Если закрыли активный, активным становится сосед справа, а у
 * последней вкладки - сосед слева: так ведут себя вкладки в браузере. Закрытый
 * проект встаёт первым в недавние.
 */
export const closeProject = (state: WorkspaceState, projectId: string): WorkspaceState => {
  const index = state.projects.findIndex((project) => project.id === projectId)
  const closed = state.projects[index]

  if (!closed) return state

  const projects = state.projects.filter((project) => project.id !== projectId)
  const recentProjects = [
    { name: closed.name, rootPath: closed.rootPath },
    ...withoutRecent(state.recentProjects, closed.rootPath),
  ].slice(0, RECENT_PROJECTS_LIMIT)

  if (state.activeProjectId !== projectId) {
    return { ...state, projects, recentProjects }
  }

  const neighbour = projects[index] ?? projects[index - 1] ?? null

  return { projects, activeProjectId: neighbour?.id ?? null, recentProjects }
}

export const activateProject = (state: WorkspaceState, projectId: string): WorkspaceState => {
  if (!state.projects.some((project) => project.id === projectId)) return state

  return { ...state, activeProjectId: projectId }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isProjectRef = (value: unknown): value is ProjectRef =>
  isRecord(value) && typeof value['name'] === 'string' && typeof value['rootPath'] === 'string'

const isProject = (value: unknown): value is Project =>
  isProjectRef(value) && typeof (value as Record<string, unknown>)['id'] === 'string'

/**
 * Состояние из файла. Файл правят и руками, поэтому всё, что не похоже на проект,
 * отбрасывается, активный проект без вкладки сбрасывается на первый, а недавние не
 * повторяют открытые.
 */
export const parseStoredWorkspace = (raw: unknown): WorkspaceState => {
  if (!isRecord(raw)) return EMPTY_WORKSPACE

  const projects = Array.isArray(raw['projects']) ? raw['projects'].filter(isProject) : []
  const openPaths = new Set(projects.map((project) => project.rootPath))
  const recentProjects = Array.isArray(raw['recentProjects'])
    ? raw['recentProjects']
        .filter(isProjectRef)
        .map(({ name, rootPath }) => ({ name, rootPath }))
        .filter((project) => !openPaths.has(project.rootPath))
        .slice(0, RECENT_PROJECTS_LIMIT)
    : []
  const activeProjectId = raw['activeProjectId']
  const isActiveKnown = projects.some((project) => project.id === activeProjectId)

  return {
    projects,
    activeProjectId: isActiveKnown ? (activeProjectId as string) : (projects[0]?.id ?? null),
    recentProjects,
  }
}
