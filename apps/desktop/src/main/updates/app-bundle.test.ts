import { it, expect, describe } from 'vitest'

import {
  findAppBundle,
  isAdHocRequirement,
  isTransientLocation,
  parseDesignatedRequirement,
} from './app-bundle'

describe('findAppBundle', () => {
  it('находит бандл по исполняемому файлу, в том числе с пробелами в имени', () => {
    expect(findAppBundle('/Applications/Amazing IDE.app/Contents/MacOS/Amazing IDE')).toBe(
      '/Applications/Amazing IDE.app',
    )
  })

  it('не-бандл (dev-режим, Electron из node_modules вне .app) - null', () => {
    expect(findAppBundle('/usr/local/bin/electron')).toBeNull()
  })
})

describe('isTransientLocation', () => {
  it('dmg и карантинная копия - временные, папка - нет', () => {
    expect(isTransientLocation('/Volumes/Amazing IDE/Amazing IDE.app')).toBe(true)
    expect(
      isTransientLocation('/private/var/folders/x/AppTranslocation/ABC/d/Amazing IDE.app'),
    ).toBe(true)
    expect(isTransientLocation('/Applications/Amazing IDE.app')).toBe(false)
  })
})

describe('parseDesignatedRequirement', () => {
  it('вытаскивает правило из вывода codesign', () => {
    const output = [
      'Executable=/Applications/Amazing IDE.app/Contents/MacOS/Amazing IDE',
      'designated => identifier "io.github.crmapache.amazingide" and certificate leaf = H"ad34"',
    ].join('\n')

    expect(parseDesignatedRequirement(output)).toBe(
      'identifier "io.github.crmapache.amazingide" and certificate leaf = H"ad34"',
    )
  })

  it('нет правила в выводе - null', () => {
    expect(parseDesignatedRequirement('code object is not signed at all')).toBeNull()
  })
})

describe('isAdHocRequirement', () => {
  it('ad-hoc привязан к хешу, сертификат - нет', () => {
    expect(isAdHocRequirement('cdhash H"eccd5ad036f6fe25682c1a221ac61bc75006e9dd"')).toBe(true)
    expect(isAdHocRequirement('identifier "x" and certificate leaf = H"ad34"')).toBe(false)
  })
})
