import { useIdeActions } from '../actions/ide-actions'
import { useOpenFile } from '../actions/open-file'
import { useActiveProject } from '../../state/workspace.queries'
import { SearchEverywhere } from '../../features/search-everywhere/SearchEverywhere/SearchEverywhere'

/**
 * Слой поиска везде: связывает панель поиска с действиями IDE и открытием файла.
 * Отдельно от Workbench, потому что действия пересобираются на каждую смену проекта,
 * ветки и раскладки - перерисовываться от этого должен только поиск, а не всё окно.
 */
export const SearchLayer = () => {
  const project = useActiveProject()
  const actions = useIdeActions()
  const openFile = useOpenFile()

  return <SearchEverywhere projectId={project?.id} actions={actions} onOpenFile={openFile} />
}
