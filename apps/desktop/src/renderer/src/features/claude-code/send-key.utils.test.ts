import { it, expect, describe } from 'vitest'

import { enterAction } from './send-key.utils'

describe('клавиша отправки', () => {
  const key = (shiftKey = false, metaKey = false) => ({ shiftKey, metaKey, ctrlKey: false })

  it('Enter: отправляет и Enter, и Cmd+Enter; Shift+Enter - перенос', () => {
    expect(enterAction('enter', key())).toBe('send')
    expect(enterAction('enter', key(false, true))).toBe('send')
    expect(enterAction('enter', key(true))).toBe('newline')
  })

  it('Cmd+Enter: любой другой Enter переносит строку', () => {
    expect(enterAction('modEnter', key())).toBe('newline')
    expect(enterAction('modEnter', key(true))).toBe('newline')
    expect(enterAction('modEnter', key(false, true))).toBe('send')
  })
})
