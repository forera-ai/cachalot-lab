import { describe, expect, it } from 'vitest'

import { titleFromMessage } from './conversations'

describe('conversation title', () => {
  it('keeps Unicode characters intact within the storage limit', () => {
    const title = titleFromMessage('🐋'.repeat(100))
    expect(Array.from(title)).toHaveLength(80)
    expect(new TextEncoder().encode(title).byteLength).toBeLessThanOrEqual(512)
  })
})
