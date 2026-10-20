import { it, expect, describe } from 'vitest'

import { modelLabel, pickableModels } from './models.utils'

const catalog = [
  { value: 'default', displayName: 'Default', description: '' },
  { value: 'opus', displayName: 'Opus', description: 'Best' },
]

describe('модели для меню', () => {
  it('без «по умолчанию», свои - в конце и с пометкой, повтор каталога не дублируется', () => {
    const models = pickableModels(catalog, ['proxy/fast', 'opus'])

    expect(models.map((model) => [model.value, model.custom])).toEqual([
      ['opus', false],
      ['proxy/fast', true],
    ])
  })

  it('пока каталога нет - запасной список', () => {
    expect(pickableModels([], []).length).toBeGreaterThan(0)
  })

  it('подпись - из каталога, своя модель - своим именем', () => {
    const models = pickableModels(catalog, ['proxy/fast'])

    expect(modelLabel('opus', models)).toBe('Opus')
    expect(modelLabel('proxy/fast', models)).toBe('proxy/fast')
  })
})
