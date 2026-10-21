import { it, expect, describe } from 'vitest'

import { tabLabels } from './EditorTabs.utils'

describe('tabLabels', () => {
  it('имя файла; одноимённые - с папками, пока не различатся', () => {
    const labels = tabLabels([
      'src/editor/index.ts',
      'src/tabs/index.ts',
      'a/x/utils.ts',
      'b/x/utils.ts',
      'README.md',
    ])

    expect([...labels.values()]).toEqual([
      'editor/index.ts',
      'tabs/index.ts',
      'a/x/utils.ts',
      'b/x/utils.ts',
      'README.md',
    ])
  })

  it('файл в корне рядом с одноимённым глубже - путь целиком', () => {
    expect([...tabLabels(['index.ts', 'src/index.ts']).values()]).toEqual([
      'index.ts',
      'src/index.ts',
    ])
  })

  it('файл и разница с ним - одна подпись, а не два «разных» файла', () => {
    expect([...tabLabels(['src/index.ts', 'src/index.ts', 'a.ts']).values()]).toEqual([
      'index.ts',
      'a.ts',
    ])
  })
})
