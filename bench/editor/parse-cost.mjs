// Цена повторного разбора TypeScript парсером CodeMirror (Lezer) без окна: полный
// разбор, узлы-ошибки и инкрементальный разбор после вставки символа в разных местах
// файла. Так нашлось, откуда задержка ввода у CodeMirror на больших файлах.
//
//   node parse-cost.mjs

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const base = new URL('./node_modules/.pnpm/', import.meta.url).pathname
const { readdirSync } = await import('node:fs')
const jsDir = readdirSync(base).find((n) => n.startsWith('@lezer+javascript@'))
const commonDir = readdirSync(base).find((n) => n.startsWith('@lezer+common@'))
const { parser } = await import(`${base}${jsDir}/node_modules/@lezer/javascript/dist/index.js`)
const { TreeFragment } = await import(
  `${base}${commonDir}/node_modules/@lezer/common/dist/index.js`
)

// тот же генератор, что в стенде (Node 24 сам снимает типы с .ts)
const { generateTypeScript } = await import('./src/harness.ts')
const text = generateTypeScript(2000)
const ts = parser.configure({ dialect: 'ts' })

let t = performance.now()
const tree = ts.parse(text)
console.log('полный разбор, мс:', (performance.now() - t).toFixed(1), 'длина', text.length)

let errors = 0
const firstErrors = []
tree.iterate({
  enter: (node) => {
    if (node.type.isError) {
      errors++
      if (firstErrors.length < 3)
        firstErrors.push(
          text.slice(Math.max(0, node.from - 40), node.from + 20).replace(/\n/g, '⏎'),
        )
    }
  },
})
console.log('узлов-ошибок:', errors, firstErrors)

// вставка символа в середину, как в стенде
const middle = text.indexOf('\n', Math.floor(text.length / 2))
const changed = text.slice(0, middle) + 'x' + text.slice(middle)
const fragments = TreeFragment.applyChanges(TreeFragment.addTree(tree), [
  { fromA: middle, toA: middle, fromB: middle, toB: middle + 1 },
])
t = performance.now()
ts.parse(changed, fragments)
console.log('инкрементальный после вставки, мс:', (performance.now() - t).toFixed(2))

// Устойчивые цифры: много вставок подряд, каждая поверх прошлого дерева
const measure = (dialect, label) => {
  const p = parser.configure({ dialect })
  let doc = text
  let currentTree = p.parse(doc)
  const times = []
  for (let i = 0; i < 40; i++) {
    const at = doc.indexOf('\n', Math.floor(doc.length / 2))
    doc = doc.slice(0, at) + 'x' + doc.slice(at)
    const frags = TreeFragment.applyChanges(TreeFragment.addTree(currentTree), [
      { fromA: at, toA: at, fromB: at, toB: at + 1 },
    ])
    const start = performance.now()
    currentTree = p.parse(doc, frags)
    times.push(performance.now() - start)
  }
  times.sort((a, b) => a - b)
  console.log(
    label,
    'инкрементальный: медиана',
    times[20].toFixed(2),
    'мс, макс',
    times[39].toFixed(2),
  )
}
measure('ts', 'TypeScript')
measure('', 'JavaScript')

const measureAt = (fraction, lines) => {
  const p = parser.configure({ dialect: 'ts' })
  let doc = generateTypeScript(lines)
  let currentTree = p.parse(doc)
  const times = []
  for (let i = 0; i < 30; i++) {
    const at = doc.indexOf('\n', Math.floor(doc.length * fraction))
    doc = doc.slice(0, at) + 'x' + doc.slice(at)
    const frags = TreeFragment.applyChanges(TreeFragment.addTree(currentTree), [
      { fromA: at, toA: at, fromB: at, toB: at + 1 },
    ])
    const start = performance.now()
    currentTree = p.parse(doc, frags)
    times.push(performance.now() - start)
  }
  times.sort((a, b) => a - b)
  return times[15].toFixed(2)
}
for (const lines of [300, 2000]) {
  console.log(
    `строк ${lines}: в начале ${measureAt(0.05, lines)} мс, в середине ${measureAt(0.5, lines)} мс, в конце ${measureAt(0.95, lines)} мс`,
  )
}

// Настоящие большие файлы: сколько в них узлов-ошибок у грамматики и сколько стоит
// вставка символа на 50% и 90% файла.
const realFiles = {
  'protocol.ts': new URL('../../../amazing-claude-code/webview/src/protocol.ts', import.meta.url),
  'App.tsx': new URL('../../../amazing-claude-code/webview/src/App.tsx', import.meta.url),
}

for (const [name, url] of Object.entries(realFiles)) {
  let doc
  try {
    doc = readFileSync(url, 'utf8')
  } catch {
    continue
  }
  const p = parser.configure({ dialect: name.endsWith('.tsx') ? 'ts jsx' : 'ts' })
  let start = performance.now()
  let fileTree = p.parse(doc)
  const full = performance.now() - start
  let errorCount = 0
  fileTree.iterate({
    enter: (node) => {
      if (node.type.isError) errorCount++
    },
  })
  const costAt = (fraction) => {
    let current = doc
    let currentTree = fileTree
    const times = []
    for (let i = 0; i < 30; i++) {
      const at = current.indexOf('\n', Math.floor(current.length * fraction))
      current = current.slice(0, at) + 'x' + current.slice(at)
      const frags = TreeFragment.applyChanges(TreeFragment.addTree(currentTree), [
        { fromA: at, toA: at, fromB: at, toB: at + 1 },
      ])
      start = performance.now()
      currentTree = p.parse(current, frags)
      times.push(performance.now() - start)
    }
    times.sort((a, b) => a - b)
    return times[15].toFixed(1)
  }
  console.log(
    `${name}: ${doc.split('\n').length} строк, полный разбор ${full.toFixed(0)} мс, узлов-ошибок ${errorCount}, вставка на 50% ${costAt(0.5)} мс, на 90% ${costAt(0.9)} мс`,
  )
}

// Стиль кода без точек с запятой (semi: false, как во всех проектах Макса) плюс
// комментарии: на этом повторный разбор Lezer дорожает с ростом позиции правки.
const asiCost = (doc) => {
  let current = doc
  let currentTree = ts.parse(current)
  const times = []
  for (let i = 0; i < 20; i++) {
    const at = current.indexOf('\n', Math.floor(current.length * 0.9))
    current = current.slice(0, at) + 'x' + current.slice(at)
    const frags = TreeFragment.applyChanges(TreeFragment.addTree(currentTree), [
      { fromA: at, toA: at, fromB: at, toB: at + 1 },
    ])
    const start = performance.now()
    currentTree = ts.parse(current, frags)
    times.push(performance.now() - start)
  }
  return times.sort((a, b) => a - b)[10].toFixed(1)
}
const repeat = (line) => Array.from({ length: 2000 }, (_, i) => line(i)).join('\n')
console.log('2000 строк, вставка на 90%:')
console.log(
  '  без ;, комментарий в конце строки:',
  asiCost(repeat((i) => `export const a${i} = ${i} // c${i}`)),
  'мс',
)
console.log(
  '  с ;,   комментарий в конце строки:',
  asiCost(repeat((i) => `export const a${i} = ${i}; // c${i}`)),
  'мс',
)
console.log(
  '  без ;, без комментариев:          ',
  asiCost(repeat((i) => `export const a${i} = ${i}`)),
  'мс',
)
