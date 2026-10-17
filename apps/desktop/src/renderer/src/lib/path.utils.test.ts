import { it, expect, describe } from 'vitest'

import { splitPath } from './path.utils'

describe('splitPath', () => {
  it('папка без слеша на конце и имя файла', () => {
    expect(splitPath('src/app/main.tsx')).toEqual({ folder: 'src/app', name: 'main.tsx' })
  })

  it('файл в корне проекта - без папки', () => {
    expect(splitPath('package.json')).toEqual({ folder: '', name: 'package.json' })
  })
})
