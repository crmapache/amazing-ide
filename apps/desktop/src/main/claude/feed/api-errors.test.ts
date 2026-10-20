import { it, expect, describe } from 'vitest'

import { overSampling } from './api-errors'

describe('отказ из-за параметра выборки', () => {
  it('код 400 и имя поля в тексте - в любой обёртке шлюза', () => {
    expect(overSampling(400, 'API Error: 400 `temperature` is deprecated for this model.')).toBe(
      true,
    )
    expect(
      overSampling(400, 'Error from client: AnthropicLLMClient {"error":"top_p is not supported"}'),
    ).toBe(true)
  })

  it('другой код или другой отказ - не он', () => {
    expect(overSampling(500, 'temperature is deprecated')).toBe(false)
    expect(overSampling(400, 'prompt is too long')).toBe(false)
    expect(overSampling(0, '')).toBe(false)
  })
})
