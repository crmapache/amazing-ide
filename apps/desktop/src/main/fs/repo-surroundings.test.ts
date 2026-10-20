import { it, expect, describe } from 'vitest'

import { foldersAbove } from './repo-surroundings'

describe('foldersAbove', () => {
  it('проект - подпапка: папки от верха репозитория до родителя проекта', () => {
    expect(foldersAbove('/repo', '/repo/apps/web')).toEqual(['/repo', '/repo/apps'])
    expect(foldersAbove('/repo', '/repo/web')).toEqual(['/repo'])
  })

  it('проект - сам репозиторий: над ним слушать нечего', () => {
    expect(foldersAbove('/repo', '/repo')).toEqual([])
  })

  it('похожее имя рядом - не внутри', () => {
    expect(foldersAbove('/repo', '/repository/web')).toEqual([])
  })
})
