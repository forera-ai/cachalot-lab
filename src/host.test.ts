import { expect, it } from 'vitest'

import { cpuPercent } from './host'

it('computes CPU busy time from cumulative ticks, including wraparound', () => {
  expect(cpuPercent(null, [100, 100, 100, 100])).toBeNull()
  expect(cpuPercent([100, 100, 100, 100], [110, 120, 160, 110])).toBe(40)
  expect(cpuPercent([2 ** 32 - 5, 0, 0, 0], [5, 0, 0, 0])).toBe(100)
})
