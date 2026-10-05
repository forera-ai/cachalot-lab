import { expect, it } from 'vitest'

import { cpuPercent, diskRates } from './host'

it('computes CPU busy time from cumulative ticks, including wraparound', () => {
  expect(cpuPercent(null, [100, 100, 100, 100])).toBeNull()
  expect(cpuPercent([100, 100, 100, 100], [110, 120, 160, 110])).toBe(40)
  expect(cpuPercent([2 ** 32 - 5, 0, 0, 0], [5, 0, 0, 0])).toBe(100)
})

const disk = {
  id: '1',
  name: 'SSD',
  bsd_name: 'disk0',
  read_bytes: '9007199254740993',
  write_bytes: '100',
}
it('computes per-drive decimal rates without losing large counter precision', () => {
  expect(
    diskRates(
      [disk],
      [{ ...disk, read_bytes: '9007199256740993', write_bytes: '100' }],
      2000,
    )?.[0],
  ).toMatchObject({ read_mbps: 1, write_mbps: 0 })
  expect(
    diskRates([disk], [{ ...disk, id: '2' }], 2000)?.[0]?.read_mbps,
  ).toBeNull()
  expect(diskRates(null, [disk], 2000)?.[0]?.read_mbps).toBeNull()
  expect(diskRates([disk], null, 2000)).toBeNull()
  expect(diskRates([disk], [], 2000)).toEqual([])
})
it('marks resets, malformed counters, and long sampling gaps unavailable', () => {
  for (const read_bytes of ['0', '-1', '1.5', 'not a counter']) {
    expect(
      diskRates([disk], [{ ...disk, read_bytes }], 2000)?.[0]?.read_mbps,
    ).toBeNull()
  }
  for (const elapsed of [0, -1, NaN, 16000]) {
    expect(diskRates([disk], [disk], elapsed)?.[0]?.read_mbps).toBeNull()
  }
})
