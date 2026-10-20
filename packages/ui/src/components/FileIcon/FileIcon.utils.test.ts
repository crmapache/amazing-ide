import { it, expect, describe } from 'vitest'

import { FILE_ICON_SET } from './file-icon-set.generated'
import { renderFileIcon, resolveFileIcon } from './FileIcon.utils'

const file = (path: string) => resolveFileIcon(path, 'file', false)

describe('resolveFileIcon', () => {
  it('точное имя файла важнее расширения', () => {
    expect(file('package.json')).toBe('package-json')
    expect(file('apps/desktop/tsconfig.base.json')).toBe('typescript-config')
    expect(file('notes.json')).toBe('json')
  })

  it('регистр имени не важен', () => {
    expect(file('Dockerfile')).toBe('docker')
    expect(file('src/App.TSX')).toBe('typescript-react')
  })

  it('длинное расширение раньше короткого', () => {
    expect(file('src/a.test.ts')).toBe('typescript-test')
    expect(file('src/env.d.ts')).toBe('typescript-def')
    expect(file('src/a.ts')).toBe('typescript')
  })

  it('имя с точкой впереди ищется и как расширение', () => {
    expect(file('.gitignore')).toBe('git')
    expect(file('.env')).toBe('env')
  })

  it('папка над файлом уточняет расширение', () => {
    expect(file('.github/workflows/ci.yml')).toBe('workflow')
    expect(file('config/ci.yml')).toBe('yaml')
  })

  it('свои привязки поверх набора', () => {
    expect(file('signing.p12')).toBe('certificate')
    expect(file('changes.diff')).toBe('diff')
  })

  it('незнакомый файл - общая иконка', () => {
    expect(file('notes.zzz')).toBe('_file')
    expect(file('Something')).toBe('_file')
  })

  it('имена из прототипа объекта - не иконки', () => {
    expect(file('constructor')).toBe('_file')
    expect(file('a.toString')).toBe('_file')
    expect(resolveFileIcon('__proto__', 'folder', true)).toBe('_folder_open')
  })

  it('папка - по имени, раскрытая - открытая', () => {
    expect(resolveFileIcon('apps/desktop/src', 'folder', false)).toBe('folder_src')
    expect(resolveFileIcon('apps/desktop/src', 'folder', true)).toBe('folder_src_open')
    expect(resolveFileIcon('misc', 'folder', false)).toBe('_folder')
    expect(resolveFileIcon('misc', 'folder', true)).toBe('_folder_open')
  })

  it('«/» в конце пути папки не мешает', () => {
    expect(resolveFileIcon('apps/desktop/src/', 'folder', false)).toBe('folder_src')
  })
})

describe('набор иконок', () => {
  it('у каждой привязки есть картинка, у каждой папки - открытая', () => {
    const { icons, fileNames, fileExtensions, folderNames } = FILE_ICON_SET
    const linked = [fileNames, fileExtensions, folderNames].flatMap((map) => Object.values(map))
    const opened = Object.values(folderNames).map((icon) => `${icon}_open`)
    const wanted = [...linked, ...opened, '_file', '_folder', '_folder_open']

    expect(wanted.filter((icon) => !Object.hasOwn(icons, icon))).toEqual([])
  })

  it('цвета картинок - только тона палитры', () => {
    const colors = JSON.stringify(FILE_ICON_SET.icons).match(/#[0-9a-f]{3,8}\b|var\([^)]*\)/gi)
    const foreign = new Set(colors?.filter((color) => !color.startsWith('var(--color-file-icon-')))

    expect([...foreign]).toEqual([])
  })
})

describe('renderFileIcon', () => {
  it('собирает картинку один раз и отдаёт ту же', () => {
    expect(renderFileIcon('typescript')).toBe(renderFileIcon('typescript'))
  })

  it('неизвестное имя - общая иконка файла', () => {
    expect(renderFileIcon('no-such-icon').content).toEqual(renderFileIcon('_file').content)
  })
})
