import { it, expect, describe } from 'vitest'

import { lifecycleOf, isFinalState, isStartupResult } from './turn-command'

const empty = { type: 'result', num_turns: 0, result: '', is_error: false }

describe('рукопожатие свежего процесса или конец хода', () => {
  it('пустой итог свежего процесса без нашего сообщения - рукопожатие', () => {
    expect(isStartupResult(empty, true, false)).toBe(true)
  })

  it('итог /compact и /clear - конец хода, хоть он и пустой', () => {
    const compact = {
      ...empty,
      local_command: 'compact',
      user_message_uuid: 'u1',
      user_message_uuids: ['u1'],
    }

    expect(isStartupResult(compact, true, false)).toBe(false)
    expect(isStartupResult({ ...empty, user_message_uuids: ['u1'] }, true, false)).toBe(false)
    expect(isStartupResult({ ...empty, local_command: 'clear' }, true, false)).toBe(false)
  })

  it('процесс уже не свежий, ход остановлен, есть текст или ошибка - конец хода', () => {
    expect(isStartupResult(empty, false, false)).toBe(false)
    expect(isStartupResult(empty, true, true)).toBe(false)
    expect(isStartupResult({ ...empty, result: 'Unknown command: /x' }, true, false)).toBe(false)
    expect(isStartupResult({ ...empty, is_error: true }, true, false)).toBe(false)
    expect(isStartupResult({ ...empty, num_turns: 1 }, true, false)).toBe(false)
  })
})

describe('отметки команды', () => {
  it('отметка - чья команда и что с ней; другие строки - не отметки', () => {
    expect(
      lifecycleOf({ type: 'command_lifecycle', command_uuid: 'u1', state: 'started' }),
    ).toEqual({ uuid: 'u1', state: 'started' })
    expect(lifecycleOf({ type: 'result' })).toBeNull()
  })

  it('команда кончилась - выполнена или снята', () => {
    expect(isFinalState('completed')).toBe(true)
    expect(isFinalState('cancelled')).toBe(true)
    expect(isFinalState('started')).toBe(false)
    expect(isFinalState('queued')).toBe(false)
  })
})
