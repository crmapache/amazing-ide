import { it, expect, describe, beforeEach } from 'vitest'

import { documentKey } from './documents.utils'
import { useWebImagesStore } from './web-images.store'

beforeEach(() => useWebImagesStore.setState({ allowed: {} }))

describe('картинки с сайтов - только разрешённые', () => {
  it('разрешение - ровно на адреса, что были в файле, и только в нём', () => {
    useWebImagesStore.getState().allow('p1', 'README.md', ['https://x/a.png'])
    useWebImagesStore.getState().allow('p1', 'README.md', ['https://x/a.png', 'https://x/b.png'])

    const { allowed } = useWebImagesStore.getState()

    expect(allowed[documentKey('p1', 'README.md')]).toEqual(['https://x/a.png', 'https://x/b.png'])
    expect(allowed[documentKey('p1', 'docs/other.md')]).toBeUndefined()
    expect(allowed[documentKey('p2', 'README.md')]).toBeUndefined()
  })
})
