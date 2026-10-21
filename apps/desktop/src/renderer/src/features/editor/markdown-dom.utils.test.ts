// @vitest-environment happy-dom
import { Fragment, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { it, expect, describe } from 'vitest'

import { htmlToElements } from './markdown-dom.utils'
import { markdownToHtml } from './markdown-html.utils'
import type { PreviewRenderers } from './markdown-preview.types'

/** Особые куски - видимыми заглушками: тесту важно, что и с чем их позвали. */
const renderers: PreviewRenderers = {
  code: (code, language) => createElement('x-code', { 'data-language': language }, code),
  image: ({ src, alt, width, align }) =>
    createElement('x-image', {
      'data-src': src,
      'data-alt': alt,
      'data-width': width,
      'data-align': align,
    }),
  link: (href, children) => createElement('x-link', { 'data-href': href }, ...children),
  task: (checked) => createElement('x-task', { 'data-checked': String(checked) }),
  lineMark: (line) => createElement('x-line', { 'data-line': line }),
}

const render = (markdown: string) =>
  renderToStaticMarkup(
    createElement(Fragment, null, htmlToElements(markdownToHtml(markdown), renderers).content),
  )
    .replace(/<x-line data-line="\d+"><\/x-line>/g, '')
    .trim()

describe('htmlToElements: что из HTML файла попадает в окно', () => {
  // <iframe> снимается так же (DROPPED_TAGS), но тестовый DOM пытается грузить его страницу.
  it('скрипты, стили, встроенные объекты и формы - вместе с содержимым', () => {
    const html = render(
      '<script>alert(1)</script><style>body{}</style>\n\n<object></object><embed><form><input type="text"></form><svg><script>1</script></svg>',
    )

    expect(html).not.toMatch(/script|style|object|embed|form|svg|alert|input/)
  })

  it('обработчики, стили, классы и адреса у обычных тегов снимаются', () => {
    const html = render(
      '<div onclick="x()" style="color:red" class="evil" data-x="1" title="t">Text <span onmouseover="y()">in</span></div>',
    )

    expect(html).toBe('<div>Text <span>in</span></div>')
  })

  it('незнакомый тег снимается, содержимое остаётся', () => {
    expect(render('<custom-box><b>bold</b></custom-box>')).toBe('<p><b>bold</b></p>')
  })

  it('картинка и ссылка - только через свои компоненты, с адресом как написан', () => {
    const html = render(
      '<img src="x.png" onerror="alert(1)" alt="Shot" width="200" align="right">\n\n[go](javascript:alert(1))',
    )

    expect(html).toContain(
      '<x-image data-src="x.png" data-alt="Shot" data-width="200" data-align="right"></x-image>',
    )
    expect(html).toContain('<x-link data-href="javascript:alert(1)">go</x-link>')
    expect(html).not.toContain('onerror')
  })

  it('размер картинки в px - числом', () => {
    expect(render('<img src="a.png" width="200px" alt="">')).toContain(
      '<x-image data-src="a.png" data-alt="" data-width="200"></x-image>',
    )
  })

  it('размер картинки - только число или процент', () => {
    expect(render('<img src="a.png" width="10px;x" alt="">')).toContain(
      '<x-image data-src="a.png" data-alt=""></x-image>',
    )
  })

  it('блок кода - компонентом подсветки с языком, без последнего перевода строки', () => {
    expect(render('```ts\nconst a = 1\n```')).toBe(
      '<x-code data-language="ts">const a = 1</x-code>',
    )
  })

  it('пункт-дело - отметкой, а не полем ввода', () => {
    expect(render('- [x] done\n- [ ] todo')).toBe(
      '<ul><li><x-task data-checked="true"></x-task> done</li><li><x-task data-checked="false"></x-task> todo</li></ul>',
    )
  })

  it('заголовкам - якоря как на GitHub, с приставкой и номером у повтора', () => {
    const html = render('# Getting Started!\n\n## Intro\n\n## Intro')

    expect(html).toContain('<h1 id="md-getting-started">')
    expect(html).toContain('<h2 id="md-intro">')
    expect(html).toContain('<h2 id="md-intro-1">')
  })

  it('свой id из файла - тоже с приставкой: не совпадёт с id окна', () => {
    expect(render('<a name="root"></a><p id="app">x</p>')).toBe(
      '<p><a id="md-root"></a></p><p id="md-app">x</p>',
    )
  })

  it('таблица: выравнивание колонок остаётся, пустой текст между строками - нет', () => {
    const html = render('| a | b |\n|:-:|--:|\n| 1 | 2 |')

    expect(html).toContain('<th align="center">a</th>')
    expect(html).toContain('<td align="right">2</td>')
    expect(html).not.toMatch(/<tr>\s+<t/)
  })

  it('адреса картинок - списком, как написаны: просмотр спросит про картинки с сайтов', () => {
    const { images } = htmlToElements(
      markdownToHtml('![a](https://x/a.png) <img src="b.png">'),
      renderers,
    )

    expect(images).toEqual(['https://x/a.png', 'b.png'])
  })

  it('<details> раскрытый остаётся раскрытым', () => {
    expect(render('<details open><summary>More</summary>Body</details>')).toBe(
      '<details open=""><summary>More</summary>Body</details>',
    )
  })
})
