import { it, expect, describe } from 'vitest'

import {
  expandHome,
  insideRoot,
  rankByName,
  outsidePath,
  isNetworkPath,
  readWrittenPath,
} from './path-location'

const ROOT = '/Users/max/project'
const HOME = '/Users/max'

describe('readWrittenPath', () => {
  it('относительный - от корня проекта, и его можно искать по имени', () => {
    expect(readWrittenPath('src/App.tsx', ROOT, HOME)).toEqual({
      absolutePath: '/Users/max/project/src/App.tsx',
      written: 'src/App.tsx',
      byName: true,
    })
  })

  it('абсолютный - как есть, по имени не ищется', () => {
    expect(readWrittenPath('/var/log/../log/system.log', ROOT, HOME)).toEqual({
      absolutePath: '/var/log/system.log',
      written: '/var/log/../log/system.log',
      byName: false,
    })
  })

  // Самый частый путь вне проекта; одноимённый файл проекта был бы чужим файлом.
  it('тильда - домашняя папка, и такой путь по имени не ищется', () => {
    expect(readWrittenPath('~/.claude/settings.json', ROOT, HOME)).toEqual({
      absolutePath: '/Users/max/.claude/settings.json',
      written: '~/.claude/settings.json',
      byName: false,
    })
    expect(readWrittenPath('~', ROOT, HOME)?.absolutePath).toBe(HOME)
  })

  it('file:// снимается, вместе с процентами', () => {
    expect(readWrittenPath('file:///Users/max/My%20File.txt', ROOT, HOME)?.absolutePath).toBe(
      '/Users/max/My File.txt',
    )
  })

  it('пробелы по краям не часть пути', () => {
    expect(readWrittenPath('  README.md \n', ROOT, HOME)?.written).toBe('README.md')
  })

  it('сетевой путь, чужая схема, хост в file:// - отказ', () => {
    expect(readWrittenPath('//attacker.example/share/a.ts', ROOT, HOME)).toBeNull()
    expect(readWrittenPath('\\\\attacker.example\\share\\a.ts', ROOT, HOME)).toBeNull()
    expect(readWrittenPath('smb://host/share', ROOT, HOME)).toBeNull()
    expect(readWrittenPath('file://host/share/a.ts', ROOT, HOME)).toBeNull()
  })

  it('управляющие знаки и пустота - отказ', () => {
    expect(readWrittenPath('src/a\u0000.ts', ROOT, HOME)).toBeNull()
    expect(readWrittenPath('file:///a%00b', ROOT, HOME)).toBeNull()
    expect(readWrittenPath('   ', ROOT, HOME)).toBeNull()
    expect(readWrittenPath('a'.repeat(5000), ROOT, HOME)).toBeNull()
  })
})

describe('expandHome', () => {
  it('чужой дом и тильда посреди пути не трогаются', () => {
    expect(expandHome('~ivan/notes.md', HOME)).toBe('~ivan/notes.md')
    expect(expandHome('src/~/a.ts', HOME)).toBe('src/~/a.ts')
  })
})

describe('isNetworkPath', () => {
  it('локальные пути - не сетевые', () => {
    expect(isNetworkPath('/Volumes/share/a.ts')).toBe(false)
    expect(isNetworkPath('src/a.ts')).toBe(false)
  })
})

describe('insideRoot', () => {
  it('путь от корня через «/», корень - пустая строка', () => {
    expect(insideRoot(ROOT, '/Users/max/project/src/a.ts')).toBe('src/a.ts')
    expect(insideRoot(ROOT, ROOT)).toBe('')
  })

  it('соседняя папка с тем же началом и выход наверх - снаружи', () => {
    expect(insideRoot(ROOT, '/Users/max/project-copy/a.ts')).toBeNull()
    expect(insideRoot(ROOT, '/Users/max/a.ts')).toBeNull()
  })

  it('имя приводится к NFC, как в дереве', () => {
    expect(insideRoot(ROOT, `${ROOT}/${'й'.normalize('NFD')}.md`)).toBe('й.md')
  })
})

describe('rankByName', () => {
  const files = [
    'src/components/Button.js',
    'src/legacy/Button.js',
    'Button.js',
    'xsrc/components/Button.js',
    'docs/README.md',
    'README.md',
  ]

  it('голое имя - все одноимённые, ближние к корню первыми', () => {
    expect(rankByName('Button.js', files, true)).toEqual([
      'Button.js',
      'src/components/Button.js',
      'src/legacy/Button.js',
      'xsrc/components/Button.js',
    ])
  })

  it('папки перед именем сужают по целым кускам пути', () => {
    expect(rankByName('components/Button.js', files, true)).toEqual([
      'src/components/Button.js',
      'xsrc/components/Button.js',
    ])
    expect(rankByName('src/components/Button.js', files, true)).toEqual([
      'src/components/Button.js',
    ])
    expect(rankByName('./legacy\\Button.js', files, true)).toEqual(['src/legacy/Button.js'])
  })

  // Список на выбор - ответ; «ничего не произошло» - нет.
  it('под написанными папками пусто - все файлы с таким именем', () => {
    expect(rankByName('moved/README.md', files, true)).toEqual(['README.md', 'docs/README.md'])
  })

  it('регистр - как у файловой системы', () => {
    expect(rankByName('readme.md', files, true)).toEqual([])
    expect(rankByName('readme.md', files, false)).toEqual(['README.md', 'docs/README.md'])
  })

  it('хвост наверх не лезет, пустое не ищется', () => {
    expect(rankByName('../Button.js', files, true)).toEqual([])
    expect(rankByName('./', files, true)).toEqual([])
  })
})

describe('outsidePath', () => {
  it('абсолютный путь - нормализованный, остальное - отказ', () => {
    expect(outsidePath('/Users/max/./notes/../a.md')).toBe('/Users/max/a.md')
    expect(outsidePath('notes/a.md')).toBeNull()
    expect(outsidePath('//host/share/a.md')).toBeNull()
    expect(outsidePath('/Users/max/a\u0007.md')).toBeNull()
    expect(outsidePath(`/${'a'.repeat(5000)}`)).toBeNull()
  })
})
