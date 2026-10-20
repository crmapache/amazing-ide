/**
 * Собирает набор иконок типов файлов для FileIcon из catppuccin/vscode-icons (MIT):
 * картинки флейвора css-variables и привязки «имя файла, расширение, имя папки →
 * иконка» - так же, как их читает VS Code. Цвета Catppuccin перекладываются на тона
 * нашей палитры (--color-file-icon-*, tokens.css), поэтому иконки живут в теме IDE.
 *
 * Запуск из packages/ui: `pnpm icons:generate`. Обновить набор - поменять TAG и
 * запустить снова; итог - FileIcon/file-icon-set.generated.ts, руками его не правят.
 * Нужен Node 24: привязки Catppuccin - TypeScript, Node читает их сам, без сборки.
 */
import { execFileSync } from 'node:child_process'
import { rmSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const TAG = 'v1.26.0'
const SOURCE_URL = `https://codeload.github.com/catppuccin/vscode-icons/tar.gz/refs/tags/${TAG}`
const OUTPUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '../src/components/FileIcon/file-icon-set.generated.ts',
)

/**
 * Цвет Catppuccin → тон нашей палитры. Пары, которые в одной иконке не встречаются
 * (sky и sapphire, red и maroon, pink и flamingo), сходятся в один тон.
 */
const TONES = {
  text: 'neutral',
  overlay1: 'muted',
  blue: 'blue',
  lavender: 'blue',
  sky: 'cyan',
  sapphire: 'cyan',
  teal: 'teal',
  green: 'green',
  yellow: 'yellow',
  peach: 'orange',
  rosewater: 'orange',
  red: 'red',
  maroon: 'red',
  mauve: 'violet',
  pink: 'pink',
  flamingo: 'pink',
}

/**
 * Свои привязки поверх Catppuccin. diff у них держится только на языке VS Code
 * (languageIds), а языков у нас нет; p12 - тот же PKCS#12, что и pfx; у иконки замка
 * привязок нет вовсе, а *.lock - это файлы блокировки менеджеров пакетов.
 */
const EXTRA_EXTENSIONS = { diff: 'diff', p12: 'certificate', lock: 'lock' }

/** То, что задаёт корневой <svg> FileIcon: у элементов эти атрибуты не повторяются. */
const OUTPUT_DEFAULTS = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }

/** Значения тех же свойств по умолчанию в SVG - так их видит исходная картинка. */
const SVG_DEFAULTS = { fill: 'black', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter' }

const SHAPES = new Set(['g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'])

/** Обрезка по квадрату самой иконки ничего не обрезает - её просто выбрасываем. */
const FULL_BOX_CLIP = 'M0 0h16v16H0z'

const download = () => {
  const dir = mkdtempSync(join(tmpdir(), 'catppuccin-icons-'))
  const archive = join(dir, 'source.tar.gz')

  execFileSync('curl', ['-sSfL', SOURCE_URL, '-o', archive])
  execFileSync('tar', ['-xzf', archive, '-C', dir])

  const [root] = readdirSync(dir).filter((name) => name.startsWith('vscode-icons-'))

  return { dir, root: join(dir, root) }
}

const parseAttributes = (source) =>
  Object.fromEntries([...source.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]))

/** Разбор SVG Catppuccin: простая разметка без текста, скриптов и сущностей. */
const parseSvg = (source) => {
  const root = { tag: 'root', attributes: {}, children: [] }
  const stack = [root]

  for (const [, closing, tag, rest, selfClosing] of source.matchAll(
    /<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g,
  )) {
    if (closing) {
      stack.pop()
      continue
    }

    const node = { tag, attributes: parseAttributes(rest), children: [] }

    stack.at(-1).children.push(node)
    if (!selfClosing) stack.push(node)
  }

  const [svg] = root.children

  if (svg?.tag !== 'svg') throw new Error('корень - не <svg>')

  return svg
}

const toTone = (value) =>
  value.replace(/var\(--vscode-ctp-(\w+)\)/g, (_, color) => {
    const tone = TONES[color]

    if (!tone) throw new Error(`нет тона для цвета ${color}`)

    return `var(--color-file-icon-${tone})`
  })

const camelCase = (name) => name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

/**
 * Числа точнее тысячной (выгрузка из Inkscape) - до тысячной: на 16 пикселях разницы
 * нет, а набор худеет на десятки килобайт.
 */
const roundNumbers = (value) =>
  value.replace(/-?\d*\.\d{4,}/g, (number) => String(Number(Number(number).toFixed(3))))

/**
 * Узел для FileIcon: [тег, атрибуты React, вложенные]. Наследуемые свойства, которые
 * совпадают с унаследованными в выходной картинке, выпадают; группа без атрибутов
 * растворяется в родителе. Иконку, которую так не перенести, - исключение.
 */
const convert = (node, inherited, outputInherited) => {
  if (node.tag === 'defs') return []
  if (!SHAPES.has(node.tag)) throw new Error(`тег <${node.tag}> не поддержан`)

  const { 'clip-path': clip, ...attributes } = node.attributes

  if (clip !== undefined && clip !== 'url(#a)') throw new Error(`обрезка ${clip}`)
  if (attributes.fill?.startsWith('url(')) return []
  if (attributes.mask || attributes.style) throw new Error('маска или style')

  const effective = { ...inherited }
  const props = {}

  for (const [name, value] of Object.entries(attributes)) {
    if (name in SVG_DEFAULTS) effective[name] = value
    else props[camelCase(name)] = roundNumbers(toTone(value))
  }

  for (const name of Object.keys(SVG_DEFAULTS)) {
    if (effective[name] !== outputInherited[name]) props[camelCase(name)] = toTone(effective[name])
  }

  const children = node.children.flatMap((child) => convert(child, effective, effective))

  if (node.tag === 'g' && Object.keys(props).length === 0) return children
  if (node.tag === 'g' && children.length === 0) return []

  return [children.length > 0 ? [node.tag, props, children] : [node.tag, props]]
}

const convertIcon = (source) => {
  const svg = parseSvg(source)
  const clips = svg.children
    .flatMap((child) => [child, ...child.children])
    .filter((child) => child.tag === 'defs')
    .flatMap((defs) => defs.children)

  // Градиенты нужны только элементам с заливкой url(), а те выпадают в convert.
  for (const clip of clips.filter((child) => !child.tag.endsWith('Gradient'))) {
    const d = clip.children[0]?.attributes.d

    if (clip.tag !== 'clipPath' || d !== FULL_BOX_CLIP) throw new Error('непростая обрезка')
  }

  const nodes = svg.children.flatMap((child) => convert(child, SVG_DEFAULTS, OUTPUT_DEFAULTS))
  const { viewBox } = svg.attributes

  return viewBox === '0 0 16 16' ? { nodes } : { nodes, viewBox }
}

const lowerKeys = (map, known) =>
  Object.fromEntries(
    Object.entries(map)
      .filter(([, icon]) => known.has(icon))
      .map(([key, icon]) => [key.toLowerCase(), icon])
      .sort(([left], [right]) => (left < right ? -1 : 1)),
  )

const main = async () => {
  const { dir, root } = download()

  try {
    const iconsDir = join(root, 'icons/css-variables')
    const icons = {}
    const skipped = []

    for (const file of readdirSync(iconsDir).sort()) {
      const name = file.replace(/\.svg$/, '')

      try {
        icons[name] = convertIcon(readFileSync(join(iconsDir, file), 'utf8'))
      } catch (error) {
        skipped.push(`${name}: ${error.message}`)
      }
    }

    const defaults = (file) => import(pathToFileURL(join(root, 'src/defaults', file)).href)
    const { fileNames, fileExtensions } = await defaults('fileIcons.ts')
    const { folderNames } = await defaults('folderIcons.ts')
    const known = new Set(Object.keys(icons))
    const set = {
      license: readFileSync(join(root, 'LICENSE'), 'utf8').trim(),
      icons,
      fileNames: lowerKeys(fileNames, known),
      fileExtensions: lowerKeys({ ...fileExtensions, ...EXTRA_EXTENSIONS }, known),
      folderNames: lowerKeys(folderNames, known),
    }
    const header = [
      `// Создано scripts/generate-file-icons.mjs из catppuccin/vscode-icons ${TAG} (MIT,`,
      '// текст лицензии - в поле license). Руками не править: запустить генератор снова.',
      "import type { FileIconSet } from './FileIcon.types'",
      '',
    ].join('\n')

    // Строка в одинарных кавычках: кавычки JSON внутри неё не экранируются, и разбор
    // строки - самый быстрый способ поднять в окне данные такого размера.
    const literal = `'${JSON.stringify(set).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`

    writeFileSync(
      OUTPUT,
      // Сразу в том виде, в каком его оставит Prettier: проверка формата не ругается.
      `${header}\nexport const FILE_ICON_SET = JSON.parse(\n  ${literal},\n) as FileIconSet\n`,
    )

    console.log(`Иконок: ${known.size}, пропущено: ${skipped.length}`)
    for (const line of skipped) console.log(`  - ${line}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

await main()
