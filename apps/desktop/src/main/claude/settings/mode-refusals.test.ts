import { it, expect, describe } from 'vitest'

import { NO_REFUSALS, withRefusal } from './mode-refusals'

describe('withRefusal', () => {
  it('bypass запоминается на всю панель, от модели не зависит', () => {
    expect(withRefusal(NO_REFUSALS, 'bypassPermissions', 'opus')).toEqual({
      bypass: true,
      autoModels: [],
    })
  })

  it('auto - на модель: отказ на одной не гасит его на другой', () => {
    const once = withRefusal(NO_REFUSALS, 'auto', 'haiku')

    expect(once.autoModels).toEqual(['haiku'])
    expect(withRefusal(once, 'auto', 'opus').autoModels).toEqual(['haiku', 'opus'])
  })

  it('повтор - тот же объект: рассылать окну нечего', () => {
    const once = withRefusal(NO_REFUSALS, 'auto', 'haiku')

    expect(withRefusal(once, 'auto', 'haiku')).toBe(once)
    expect(withRefusal(NO_REFUSALS, 'plan', 'opus')).toBe(NO_REFUSALS)
  })
})
