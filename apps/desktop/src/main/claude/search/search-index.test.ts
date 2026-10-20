import { rm, stat, mkdir, utimes, mkdtemp, readFile, writeFile, appendFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it, expect, describe, afterEach, beforeEach } from 'vitest'

import { corpusText, sessionsText } from './search-corpus'
import { SearchIndex } from './search-index'
import { MANIFEST_FILE, REFRESH_INTERVAL_MS } from './search.constants'
import type { SearchOptions } from './search.types'

const ALL: SearchOptions = {
  conversation: null,
  onlyThatChat: false,
  limit: 50,
  matchCase: false,
  wholeWords: false,
}

const userLine = (uuid: string, text: string) =>
  `${JSON.stringify({ type: 'user', uuid, timestamp: '2026-08-14T09:12:00.000Z', message: { role: 'user', content: text } })}\n`

const answerLine = (uuid: string, text: string) =>
  `${JSON.stringify({ type: 'assistant', uuid, timestamp: '2026-08-14T09:13:00.000Z', message: { id: `msg_${uuid}`, model: 'claude-opus-5', content: [{ type: 'text', text }] } })}\n`

let root = ''
let projects = ''
let copies = ''

const transcript = (id: string) => join(projects, `${id}.jsonl`)

const newIndex = () =>
  new SearchIndex(copies, async () =>
    (
      await Promise.all(
        ['c1', 'c2'].map(async (id) =>
          (await stat(transcript(id)).catch(() => null)) ? [id] : [],
        ),
      )
    )
      .flat()
      .map((id) => ({ id, file: transcript(id) })),
  )

const found = async (index: SearchIndex, query: string) =>
  (await index.find(query, ALL)).hits.map((hit) => hit.message.uuid)

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'claude-search-'))
  projects = join(root, 'projects')
  copies = join(root, 'copies')
  await mkdir(projects, { recursive: true })
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('индекс разговоров проекта', () => {
  it('находит слова каждого разговора', async () => {
    await writeFile(
      transcript('c1'),
      userLine('u1', 'почему баланс не виден') + answerLine('a1', 'Balance needs a key'),
    )
    await writeFile(transcript('c2'), userLine('u2', 'про баланс ещё раз'))

    const index = newIndex()

    expect((await found(index, 'баланс')).sort()).toEqual(['u1', 'u2'])
    expect(await found(index, 'balance')).toEqual(['a1'])
    expect(index.size).toBe(3)
  })

  it('выросший транскрипт дочитывается с места, недописанная строка ждёт', async () => {
    await writeFile(transcript('c1'), userLine('u1', 'first words'))

    const index = newIndex()

    await index.refresh(true)

    const half = userLine('u2', 'second thought')

    await appendFile(transcript('c1'), half.slice(0, 20))
    await index.refresh(true)
    expect(await found(index, 'second')).toEqual([])

    await appendFile(transcript('c1'), half.slice(20))
    await index.refresh(true)
    expect(await found(index, 'second')).toEqual(['u2'])
    expect(await found(index, 'first')).toEqual(['u1'])
    expect(index.size).toBe(2)
  })

  it('следующий запуск читает копию с диска, а не транскрипт', async () => {
    await writeFile(transcript('c1'), userLine('u1', 'alpha words'))
    await newIndex().refresh(true)

    // Тот же размер и время, другие слова: прочитай он транскрипт - нашёл бы их.
    const info = await stat(transcript('c1'))

    await writeFile(transcript('c1'), userLine('u1', 'omega words'))
    await utimes(transcript('c1'), info.atime, info.mtime)

    const next = newIndex()

    expect(await found(next, 'alpha')).toEqual(['u1'])
    expect(await found(next, 'omega')).toEqual([])
  })

  it('упавшая запись копии не считается записанной и догоняется целиком', async () => {
    await writeFile(transcript('c1'), userLine('u1', 'kept words'))
    // Папка на месте файла копии: запись упадёт.
    await mkdir(join(copies, 'c1.jsonl', 'obstacle'), { recursive: true })

    const index = newIndex()

    expect(await found(index, 'kept')).toEqual(['u1'])

    const manifest = JSON.parse(await readFile(join(copies, MANIFEST_FILE), 'utf8')) as {
      files: Record<string, { offset: number }>
    }

    expect(manifest.files['c1']?.offset).toBe(0)
    // Следующий запуск с такой копией читает транскрипт заново и находит всё.
    expect(await found(newIndex(), 'kept')).toEqual(['u1'])

    await rm(join(copies, 'c1.jsonl'), { recursive: true, force: true })
    await index.refresh(true)

    expect(await readFile(join(copies, 'c1.jsonl'), 'utf8')).toContain('kept words')
  })

  it('переписанный транскрипт читается с начала', async () => {
    await writeFile(
      transcript('c1'),
      userLine('u1', 'old long message about refunds') + userLine('u2', 'more'),
    )

    const index = newIndex()

    await index.refresh(true)
    await writeFile(transcript('c1'), userLine('u3', 'new'))
    await index.refresh(true)

    expect(await found(index, 'refunds')).toEqual([])
    expect(await found(index, 'new')).toEqual(['u3'])
  })

  it('исчезнувший файл уходит из индекса', async () => {
    await writeFile(transcript('c1'), userLine('u1', 'vanishing words'))

    const index = newIndex()

    await index.refresh(true)
    await rm(transcript('c1'))
    await index.refresh(true)

    expect(await found(index, 'vanishing')).toEqual([])
  })

  it('отрезанное откатом не ищется', async () => {
    const first = JSON.stringify({
      type: 'user',
      uuid: 'u1',
      parentUuid: null,
      message: { role: 'user', content: 'keep this' },
    })
    const cut = JSON.stringify({
      type: 'user',
      uuid: 'u2',
      parentUuid: 'u1',
      message: { role: 'user', content: 'drop this' },
    })
    const mark = JSON.stringify({ type: 'last-prompt', rewound: true, leafUuid: 'u1' })
    const after = JSON.stringify({
      type: 'user',
      uuid: 'u3',
      parentUuid: 'u1',
      message: { role: 'user', content: 'then this' },
    })

    await writeFile(transcript('c1'), `${first}\n${cut}\n${mark}\n${after}\n`)

    const index = newIndex()

    expect(await found(index, 'this')).toEqual(expect.arrayContaining(['u1', 'u3']))
    expect(await found(index, 'drop')).toEqual([])
  })

  it('имя - от человека, иначе от модели, иначе первые слова; переживает копию', async () => {
    await writeFile(transcript('c1'), userLine('u1', 'how do refunds work'))
    await writeFile(
      transcript('c2'),
      userLine('u2', 'hello') + `${JSON.stringify({ type: 'ai-title', aiTitle: 'Model name' })}\n`,
    )

    const index = newIndex()

    await index.refresh(true)
    expect(index.describe('c1')).toEqual({
      title: 'how do refunds work',
      titleSource: 'heuristic',
      messages: 1,
    })
    expect(index.describe('c2').title).toBe('Model name')

    await appendFile(
      transcript('c2'),
      `${JSON.stringify({ type: 'custom-title', customTitle: 'Mine' })}\n`,
    )
    await index.refresh(true)
    expect(index.describe('c2')).toMatchObject({ title: 'Mine', titleSource: 'user' })

    const next = newIndex()

    await next.refresh(true)
    expect(next.describe('c2')).toMatchObject({ title: 'Mine', titleSource: 'user' })
  })

  it('обновление не повторяется чаще интервала без force', async () => {
    await writeFile(transcript('c1'), userLine('u1', 'one'))

    const index = newIndex()

    expect(await index.refresh(false, 1_000_000)).toBe(true)
    await appendFile(transcript('c1'), userLine('u2', 'two'))
    expect(await index.refresh(false, 1_000_000 + REFRESH_INTERVAL_MS - 1)).toBe(false)
    expect(await index.refresh(false, 1_000_000 + REFRESH_INTERVAL_MS)).toBe(true)
  })

  it('корпус для модели - разговоры текстом, заголовок на сообщение', async () => {
    await writeFile(
      transcript('c1'),
      userLine('u1', 'how do refunds work') + answerLine('a1', 'Through the ledger.'),
    )

    const index = newIndex()
    const folder = await index.corpus()
    const text = await readFile(join(folder, 'c1.txt'), 'utf8')

    expect(text).toContain('# conversation c1')
    expect(text).toContain('## u1 2026-08-14T09:12:00.000Z you\nhow do refunds work')
    expect(text).toContain('## a1 2026-08-14T09:13:00.000Z claude\nThrough the ledger.')
    expect(await readFile(join(folder, 'sessions.txt'), 'utf8')).toContain('c1 | ')
  })
})

describe('корпус текстом', () => {
  const messages = [
    { conversation: 'c1', uuid: 'u1', anchor: 'u1', at: 0, speaker: 'you' as const, text: 'hi' },
  ]

  it('сообщение без времени - с прочерком, разговор без имени - untitled', () => {
    expect(corpusText({ id: 'c1', title: '', messages, revision: 1 })).toBe(
      '# untitled\n# conversation c1\n\n## u1 - you\nhi\n',
    )
  })

  it('список - только разговоры со словами, имя в одну строку', () => {
    const text = sessionsText([
      { id: 'c1', title: 'two\nlines', messages, revision: 1 },
      { id: 'c2', title: 'empty', messages: [], revision: 1 },
    ])

    expect(text).toContain('c1 | - .. - | 1 | two lines')
    expect(text).not.toContain('c2 |')
  })
})
