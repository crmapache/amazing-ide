import { it, expect, describe } from 'vitest'

import { markdownToHtml } from './markdown-html.utils'

/** Номера строк меток по порядку. */
const marks = (html: string) => [...html.matchAll(/data-line="(\d+)"/g)].map((match) => match[1])

describe('markdownToHtml', () => {
  it('метка строки исходника перед каждым блоком', () => {
    const html = markdownToHtml('# Title\n\nFirst para\nstill first\n\n- a\n- b\n\n```ts\nx\n```\n')

    expect(marks(html)).toEqual(['1', '3', '6', '9'])
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<code class="language-ts">x\n</code>')
  })

  it('CRLF считается как LF: строки те же, что в редакторе', () => {
    expect(marks(markdownToHtml('a\r\n\r\nb\r\n'))).toEqual(['1', '3'])
  })

  it('шапка YAML - блоком кода, строки после неё на своих местах', () => {
    const html = markdownToHtml('---\ntitle: Doc\npaths:\n  - a\n---\n# Heading\n')

    expect(html).toContain('<code class="language-yaml">title: Doc\npaths:\n  - a\n</code>')
    expect(html).not.toContain('<h2>')
    expect(marks(html)).toEqual(['1', '6'])
  })

  it('HTML, разорванный абзацами, склеивается в одну строку', () => {
    const html = markdownToHtml('<details>\n<summary>More</summary>\n\nInside\n\n</details>\n')

    expect(html.replace(/<md-line[^>]*><\/md-line>/g, '')).toBe(
      '<details>\n<summary>More</summary><p>Inside</p>\n</details>\n',
    )
  })
})
