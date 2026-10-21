import { it, expect, describe } from 'vitest'

import { GRAMMARS } from './syntax-grammars.constants'
import { LANGUAGE_ALIASES, FILE_NAME_LANGUAGES } from './syntax-languages.constants'
import { languageOfPath, resolveLanguage } from './syntax-languages.utils'

describe('resolveLanguage', () => {
  it('имя забора и псевдоним - к имени грамматики', () => {
    expect(resolveLanguage('TS')).toBe('typescript')
    expect(resolveLanguage(' bash ')).toBe('shellscript')
    expect(resolveLanguage('go')).toBe('go')
    expect(resolveLanguage('brainfuck')).toBeNull()
  })

  it('каждый псевдоним и каждое имя файла ведут в существующую грамматику', () => {
    const targets = [...Object.values(LANGUAGE_ALIASES), ...Object.values(FILE_NAME_LANGUAGES)]

    expect(targets.filter((language) => !(language in GRAMMARS))).toEqual([])
  })
})

describe('languageOfPath', () => {
  it('по расширению, в любом регистре', () => {
    expect(languageOfPath('src/app/App.tsx')).toBe('tsx')
    expect(languageOfPath('README.MD')).toBe('markdown')
    expect(languageOfPath('build.gradle.kts')).toBe('kotlin')
    expect(languageOfPath('build.gradle')).toBe('groovy')
    expect(languageOfPath('styles/_mixins.scss')).toBe('scss')
  })

  it('файлы окружения - dotenv, как бы ни кончалось имя', () => {
    expect(languageOfPath('.env')).toBe('dotenv')
    expect(languageOfPath('apps/api/.env.local')).toBe('dotenv')
    expect(languageOfPath('.env.example')).toBe('dotenv')
    expect(languageOfPath('prod.env')).toBe('dotenv')
    expect(languageOfPath('.envrc')).toBeNull()
  })

  it('имя целиком важнее расширения', () => {
    expect(languageOfPath('docker/Dockerfile')).toBe('docker')
    expect(languageOfPath('tsconfig.json')).toBe('jsonc')
    expect(languageOfPath('apps/desktop/tsconfig.node.json')).toBe('jsonc')
    expect(languageOfPath('package.json')).toBe('json')
    expect(languageOfPath('~/.zshrc')).toBe('shellscript')
  })

  it('незнакомое и без расширения - без подсветки', () => {
    expect(languageOfPath('LICENSE')).toBeNull()
    expect(languageOfPath('notes.txt')).toBeNull()
    expect(languageOfPath('.gitignore')).toBeNull()
  })
})
