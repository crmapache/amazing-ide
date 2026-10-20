import { it, vi, expect, describe } from 'vitest'

import { isExternalWebUrl } from './open-external'

vi.mock('electron', () => ({ shell: { openExternal: vi.fn() } }))

describe('адрес наружу', () => {
  it('сайт открывается, файл, шара и чужая схема - нет', () => {
    expect(isExternalWebUrl('https://auth.example.com/authorize?x=1')).toBe(true)
    expect(isExternalWebUrl('http://localhost:3000/cb')).toBe(true)
    expect(isExternalWebUrl('file:///Applications/X.app')).toBe(false)
    expect(isExternalWebUrl('smb://host/share')).toBe(false)
    expect(isExternalWebUrl('vscode://open')).toBe(false)
    expect(isExternalWebUrl('HTTPS://EXAMPLE.COM')).toBe(true)
    expect(isExternalWebUrl('not a url')).toBe(false)
  })
})
