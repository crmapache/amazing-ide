import { it, expect, describe } from 'vitest'

import { projectTone, parentFolder, projectInitials } from './projects.utils'

describe('projectInitials', () => {
  it('первые буквы двух слов, любые разделители и camelCase', () => {
    expect(projectInitials('amazing-ide')).toBe('AI')
    expect(projectInitials('smooth-stream-text')).toBe('SS')
    expect(projectInitials('roasRadar')).toBe('RR')
    expect(projectInitials('gymapp_web')).toBe('GW')
  })

  it('одно слово - две первые буквы, пустое имя - знак вопроса', () => {
    expect(projectInitials('snakein')).toBe('SN')
    expect(projectInitials('x')).toBe('X')
    expect(projectInitials('---')).toBe('?')
  })
})

describe('projectTone', () => {
  it('один проект - всегда один цвет, в пределах палитры', () => {
    expect(projectTone('amazing-ide')).toBe(projectTone('amazing-ide'))
    expect(projectTone('roas-radar')).toBeGreaterThanOrEqual(0)
    expect(projectTone('roas-radar')).toBeLessThan(6)
  })
})

describe('parentFolder', () => {
  it('папка над путём, у корня - корень', () => {
    expect(parentFolder('/Users/max/Projects/amazing-ide')).toBe('/Users/max/Projects')
    expect(parentFolder('/x')).toBe('/')
  })
})
