/** Папка проекта без привязки к вкладке: недавний проект. */
export type ProjectRef = {
  /** Имя - последняя часть пути. */
  name: string
  /** Абсолютный путь к корню проекта на диске. */
  rootPath: string
}

/** Открытый в IDE проект: вкладка в строке под шапкой окна. */
export type Project = ProjectRef & {
  id: string
}

/** Набор проектов. Источник правды - главный процесс, окно его зеркалит. */
export type WorkspaceState = {
  projects: Project[]
  activeProjectId: string | null
  /**
   * Недавно закрытые проекты, свежие первыми. Открытых здесь нет: открыл недавний -
   * он переезжает во вкладки.
   */
  recentProjects: ProjectRef[]
}
