import { it, expect, describe } from 'vitest'

import { TITLE_BAR_HEIGHT } from './main-window.constants'
import { trafficLightPosition } from './traffic-lights'

describe('trafficLightPosition', () => {
  it('обычная шапка - кнопки на прежнем месте', () => {
    expect(trafficLightPosition(TITLE_BAR_HEIGHT)).toEqual({ x: 16, y: 13 })
  })

  it('шапка выросла с размером текста - кнопки по её середине', () => {
    expect(trafficLightPosition(60)).toEqual({ x: 16, y: 23 })
  })

  it('нечётный остаток - до целого пикселя', () => {
    expect(trafficLightPosition(33)).toEqual({ x: 16, y: 10 })
  })

  it('шапка ниже кнопок - кнопки у верхнего края, а не над окном', () => {
    expect(trafficLightPosition(8)).toEqual({ x: 16, y: 0 })
  })
})
