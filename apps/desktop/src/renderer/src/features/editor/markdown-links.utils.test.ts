import { it, expect, describe } from 'vitest'

import {
  slugify,
  linkTarget,
  imageSource,
  webImageUrls,
  createSlugger,
  resolveFromFile,
  isPreviewImagePath,
} from './markdown-links.utils'

describe('resolveFromFile', () => {
  it('от папки файла, от корня, с точками и без выхода за корень', () => {
    expect(resolveFromFile('docs/adr/a.md', 'b.md')).toBe('docs/adr/b.md')
    expect(resolveFromFile('docs/adr/a.md', '../guide.md')).toBe('docs/guide.md')
    expect(resolveFromFile('docs/adr/a.md', './img/x%20y.png')).toBe('docs/adr/img/x y.png')
    expect(resolveFromFile('docs/a.md', '/README.md')).toBe('README.md')
    expect(resolveFromFile('docs/a.md', '../../secret.md')).toBeNull()
  })
})

describe('linkTarget', () => {
  it('сайт - наружу, другие схемы - никуда', () => {
    expect(linkTarget('https://example.com', 'a.md')).toEqual({
      kind: 'web',
      url: 'https://example.com',
    })
    expect(linkTarget('javascript:alert(1)', 'a.md')).toEqual({ kind: 'none' })
    expect(linkTarget('JaVaScRiPt:alert(1)', 'a.md')).toEqual({ kind: 'none' })
    expect(linkTarget('file:///etc/passwd', 'a.md')).toEqual({ kind: 'none' })
    expect(linkTarget('mailto:a@b.c', 'a.md')).toEqual({ kind: 'none' })
    expect(linkTarget('//evil.example', 'a.md')).toEqual({ kind: 'none' })
  })

  it('якорь - к заголовку этого файла', () => {
    expect(linkTarget('#getting-started', 'a.md')).toEqual({
      kind: 'anchor',
      id: 'getting-started',
    })
  })

  it('путь - файл проекта, #L10 и #L10-L20 - место в нём', () => {
    expect(linkTarget('../src/app.ts#L10', 'docs/a.md')).toEqual({
      kind: 'file',
      path: 'src/app.ts',
      place: { line: 10 },
    })
    expect(linkTarget('app.ts#L3-L7', 'a.md')).toEqual({
      kind: 'file',
      path: 'app.ts',
      place: { line: 3, endLine: 7 },
    })
    expect(linkTarget('guide.md#setup', 'a.md')).toEqual({
      kind: 'file',
      path: 'guide.md',
      place: undefined,
    })
  })

  it('папка - путь проекта, пустой путь и выход за корень - никуда', () => {
    expect(linkTarget('docs/', 'a.md')).toEqual({ kind: 'file', path: 'docs', place: undefined })
    expect(linkTarget('?tab=1', 'a.md')).toEqual({ kind: 'none' })
    expect(linkTarget('../../x.md', 'docs/a.md')).toEqual({ kind: 'none' })
  })
})

describe('imageSource', () => {
  it('https - с сайта, data:image - вписанная, http и другие схемы - нет', () => {
    expect(imageSource('https://img.shields.io/badge.svg', 'a.md')).toEqual({
      kind: 'web',
      url: 'https://img.shields.io/badge.svg',
    })
    expect(imageSource('data:image/png;base64,AAAA', 'a.md').kind).toBe('inline')
    expect(imageSource('http://example.com/x.png', 'a.md')).toEqual({ kind: 'none' })
    expect(imageSource('data:text/html,<b>', 'a.md')).toEqual({ kind: 'none' })
    expect(imageSource('file:///x.png', 'a.md')).toEqual({ kind: 'none' })
  })

  it('путь - файл проекта от папки файла, без запроса и якоря', () => {
    expect(imageSource('./shots/main.png?raw=1', 'docs/a.md')).toEqual({
      kind: 'project',
      path: 'docs/shots/main.png',
    })
  })
})

describe('isPreviewImagePath', () => {
  it('картинка - по расширению, без имён из прототипа', () => {
    expect(isPreviewImagePath('docs/shot.PNG')).toBe(true)
    expect(isPreviewImagePath('docs/guide.md')).toBe(false)
    expect(isPreviewImagePath('x.constructor')).toBe(false)
  })
})

describe('webImageUrls', () => {
  it('только картинки с сайтов, без повторов', () => {
    expect(
      webImageUrls(
        ['https://x/a.png', 'b.png', 'https://x/a.png', 'data:image/png;base64,A'],
        'a.md',
      ),
    ).toEqual(['https://x/a.png'])
  })
})

describe('якоря заголовков', () => {
  it('как у GitHub: строчные, без знаков, пробел - дефис, буквы любых алфавитов', () => {
    expect(slugify('Getting Started!')).toBe('getting-started')
    expect(slugify('Окно: восемь зон')).toBe('окно-восемь-зон')
    expect(slugify('A  B')).toBe('a--b')
  })

  it('повтор получает номер', () => {
    const slug = createSlugger()

    expect([slug('Intro'), slug('Intro'), slug('Intro')]).toEqual(['intro', 'intro-1', 'intro-2'])
  })
})
