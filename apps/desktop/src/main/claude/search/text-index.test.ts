import { it, expect, describe } from 'vitest'

import { withinEdits } from './search-query'
import { SNIPPET_WINDOW } from './search.constants'
import type { SearchOptions, IndexedMessage } from './search.types'
import { TextIndex } from './text-index'

const message = (
  uuid: string,
  text: string,
  { at = 0, conversation = 'c1', speaker = 'you' }: Partial<IndexedMessage> = {},
): IndexedMessage => ({ conversation, uuid, anchor: uuid, at, speaker, text })

const indexOf = (messages: IndexedMessage[]) => {
  const index = new TextIndex()

  index.add(messages)

  return index
}

const options = (overrides: Partial<SearchOptions> = {}): SearchOptions => ({
  conversation: null,
  onlyThatChat: false,
  limit: 50,
  matchCase: false,
  wholeWords: false,
  ...overrides,
})

const index = indexOf([
  message('1', 'Кнопка поиска в компактной раскладке налезает на Send', { at: 10 }),
  message(
    '2',
    'Looked at composer.module.css: the meters do not shrink, so the oldestEventUuid moved.',
    {
      at: 20,
      speaker: 'claude',
    },
  ),
  message('3', 'почему баланс Deepgram не показывается с ключом Member?', {
    at: 30,
    conversation: 'c2',
  }),
  message('4', 'Balance needs an Owner or Admin key; a Member key transcribes fine.', {
    at: 40,
    conversation: 'c2',
    speaker: 'claude',
  }),
  message('5', 'Ещё раз про баланс: с ключом Owner всё видно', { at: 50, conversation: 'c2' }),
])

const uuids = (query: string, overrides: Partial<SearchOptions> = {}) =>
  index.search(query, options(overrides)).hits.map((hit) => hit.message.uuid)

describe('поиск по словам разговоров', () => {
  it('слово как есть находит свои сообщения, лучшие первыми', () => {
    const found = index.search('баланс', options())

    expect(found.hits.map((hit) => hit.message.uuid)).toEqual(['3', '5'])
    expect(found.terms.map((term) => term.term)).toEqual(['баланс'])
  })

  it('недонабранное слово находит то, которое начинает', () => {
    const found = index.search('deepgr', options())

    expect(found.hits.map((hit) => hit.message.uuid)).toEqual(['3'])
    expect(found.terms.map((term) => term.term)).toContain('deepgram')
  })

  it('опечатка находит задуманное слово', () => {
    expect(uuids('deepgarm')).toEqual(['3'])
    expect(uuids('transcribs fine')).toEqual(['4'])
  })

  it('изменённое слово находит другие формы по основе, точное - выше основы', () => {
    const inflected = indexOf([
      message('7', 'fork стартовал с умолчаний, а не наследовал модель родительской вкладки', {
        at: 70,
      }),
      message('8', 'наследование модели решили отложить', { at: 80 }),
      message('9', 'про модели ни слова', { at: 90 }),
    ])
    const find = (query: string) =>
      inflected.search(query, options()).hits.map((hit) => hit.message.uuid)

    expect(find('fork наследует модель')).toEqual(['7'])
    expect(find('наследует').sort()).toEqual(['7', '8'])
    expect(find('наследование')[0]).toBe('8')
  })

  it('короткое слово без опечаток: правка делает другое слово', () => {
    expect(uuids('cat')).toEqual([])
  })

  it('каждое слово запроса обязано найтись', () => {
    expect(uuids('member key admin')).toEqual(['4'])
    expect(uuids('member nonexistentword')).toEqual([])
  })

  it('находит часть имени в коде', () => {
    expect(uuids('event uuid')).toEqual(['2'])
  })

  it('фраза в кавычках стоит как написана', () => {
    expect(uuids('"member key"')).toEqual(['4'])
    expect(uuids('"key member"')).toEqual([])
    expect(uuids('«ключом Member»')).toEqual(['3'])
  })

  it('область держит поиск в одном разговоре, а «этот чат» без разговора пуст', () => {
    expect(uuids('баланс', { conversation: 'c1', onlyThatChat: true })).toEqual([])
    expect(uuids('баланс', { conversation: 'c2', onlyThatChat: true })).toEqual(['3', '5'])
    expect(uuids('баланс', { conversation: null, onlyThatChat: true })).toEqual([])
  })

  it('обе области считаются одним поиском, до обрезки по лимиту', () => {
    const everywhere = index.search('баланс', options({ conversation: 'c2' }))

    expect(everywhere).toMatchObject({ total: 2, chatTotal: 2, conversations: 1 })
    expect(index.search('баланс', options({ conversation: 'c1' }))).toMatchObject({
      total: 2,
      chatTotal: 0,
    })

    const capped = index.search('баланс', options({ limit: 1 }))

    expect(capped.hits).toHaveLength(1)
    expect(capped.total).toBe(2)
  })

  it('ничего не спросили - ничего не нашли', () => {
    expect(uuids('')).toEqual([])
    expect(uuids('  -- ')).toEqual([])
  })

  it('кусок красит найденные слова там, где они стоят', () => {
    const hit = index.search('member', options()).hits.find((one) => one.message.uuid === '4')

    expect(hit?.snippet).toBe(hit?.message.text)
    expect(hit?.spans.map(([from, to]) => hit.snippet.slice(from, to))).toEqual(['Member'])
  })

  it('длинное сообщение режется вокруг первого совпадения, по словам', () => {
    const long = `${'word '.repeat(80)}needle in the middle ${'tail '.repeat(80)}`
    const [hit] = indexOf([message('9', long)]).search('needle', options()).hits

    expect(hit?.snippet.startsWith('…word ')).toBe(true)
    expect(hit?.snippet.endsWith(' tail…')).toBe(true)
    expect(hit?.snippet.length).toBeLessThanOrEqual(SNIPPET_WINDOW + 2)
    expect(hit?.spans.map(([from, to]) => hit.snippet.slice(from, to))).toEqual(['needle'])
  })

  it('найденное по началу красится на набранное, опечатка - целиком', () => {
    const begun = index.search('deepgr', options())
    const [hit] = begun.hits

    expect(hit?.spans.map(([from, to]) => hit.snippet.slice(from, to))).toEqual(['Deepgr'])
    expect(begun.terms).toEqual([{ term: 'deepgram', paint: 6 }])

    const [typo] = index.search('deepgarm', options()).hits

    expect(typo?.spans.map(([from, to]) => typo.snippet.slice(from, to))).toEqual(['Deepgram'])
  })

  it('часть имени в коде красится только на набранное', () => {
    const [hit] = indexOf([message('9', 'the useSelection hook and the UserCard chip')]).search(
      'use',
      options(),
    ).hits

    expect(hit?.spans.map(([from, to]) => hit.snippet.slice(from, to))).toEqual(['use', 'Use'])
  })

  it('Match case хочет буквы как набраны, опечатка при нём не ищется', () => {
    const cased = indexOf([
      message('10', 'a Member key transcribes fine'),
      message('11', 'every member of the team has one'),
    ])
    const find = (query: string, matchCase: boolean) =>
      cased.search(query, options({ matchCase })).hits.map((hit) => hit.message.uuid)

    expect(find('member', false).sort()).toEqual(['10', '11'])
    expect(find('member', true)).toEqual(['11'])
    expect(find('Member', true)).toEqual(['10'])
    expect(find('Membre', true)).toEqual([])
    expect(cased.search('Member', options({ matchCase: true })).terms).toEqual([
      { term: 'member', paint: 6, text: 'Member' },
    ])
  })

  it('Whole words хочет слово само по себе', () => {
    expect(uuids('event')).toEqual(['2'])
    expect(uuids('event', { wholeWords: true })).toEqual([])
    expect(uuids('deepgr', { wholeWords: true })).toEqual([])
    expect(uuids('deepgarm', { wholeWords: true })).toEqual([])
    expect(uuids('moved', { wholeWords: true })).toEqual(['2'])
    expect(index.search('moved', options({ wholeWords: true })).terms).toEqual([
      { term: 'moved', paint: 5, whole: true },
    ])
  })

  it('разговор снимается из индекса и дописывается заново', () => {
    const growing = indexOf([
      message('1', 'refund retry', { conversation: 'a' }),
      message('2', 'refund', { conversation: 'b' }),
    ])

    growing.removeConversation('a')
    expect(growing.search('refund', options()).hits.map((hit) => hit.message.uuid)).toEqual(['2'])
    expect(growing.size).toBe(1)

    growing.add([message('3', 'refund again', { conversation: 'a' })])
    expect(growing.search('refund', options()).total).toBe(2)
    expect(growing.search('again', options()).hits.map((hit) => hit.message.uuid)).toEqual(['3'])
  })

  it('правки считаются так, как делается опечатка', () => {
    expect(withinEdits('deepgram', 'deepgarm', 1)).toBe(true)
    expect(withinEdits('balance', 'balence', 1)).toBe(true)
    expect(withinEdits('balance', 'ballance!', 1)).toBe(false)
    expect(withinEdits('kitten', 'sitting', 3)).toBe(true)
    expect(withinEdits('kitten', 'sitting', 2)).toBe(false)
  })
})
