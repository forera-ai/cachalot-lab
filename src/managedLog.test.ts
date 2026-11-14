import { expect, it } from 'vitest'
import { parseLoggedFailures, parsePrefillLayers } from './managedLog'

it('reads complete GLM layer observations without inventing chunk or request boundaries', () => {
  const line =
    '[prefill-layer] layer=12 rows=2048 routed=288 ahead=whole:288 wait_ms=301.4'
  expect(
    parsePrefillLayers(`${line}\r\n${line.replace('whole', 'pred')}\n${line}`),
  ).toEqual([
    {
      line: 1,
      layer: 12,
      rows: 2048,
      routed: 288,
      ahead: 'whole',
      aheadCount: 288,
      waitMs: 301.4,
    },
    {
      line: 2,
      layer: 12,
      rows: 2048,
      routed: 288,
      ahead: 'pred',
      aheadCount: 288,
      waitMs: 301.4,
    },
  ])
  expect(
    parsePrefillLayers(
      `${line.replace('301.4', 'NaN')}\n${line.replace('whole', 'bogus')}\n`,
    ),
  ).toEqual([])
  expect(parsePrefillLayers(`${line}\n`.repeat(120))).toHaveLength(100)
  expect(parsePrefillLayers(`${line}\n`.repeat(120))[0]?.line).toBe(21)
})

it('keeps adjacent failures separate and ignores embedded/malformed/partial markers', () => {
  expect(
    parseLoggedFailures(
      'prefix [request failed] Error: embedded\n[request failed] invalid\n[request failed] ValueError: first\r\n[request failed] KeyError: second\n[request failed] KeyError: unfinished',
    ),
  ).toEqual([
    { line: 3, type: 'ValueError', message: 'first', traceback: null },
    { line: 4, type: 'KeyError', message: 'second', traceback: null },
  ])
})

it('bounds traceback attribution at the next unrelated non-indented line', () => {
  const events = parseLoggedFailures(
    '[request failed] RuntimeError: boom\nTraceback (most recent call last):\n  frame\nready in 3s\n  unrelated frame\n[request failed] ValueError: bad request\n',
  )
  expect(events).toEqual([
    {
      line: 1,
      type: 'RuntimeError',
      message: 'boom',
      traceback: 'Traceback (most recent call last):\n  frame',
    },
    { line: 6, type: 'ValueError', message: 'bad request', traceback: null },
  ])
})

it('retains only complete traceback lines at a polling boundary', () => {
  expect(
    parseLoggedFailures(
      '[request failed] KeyError: missing\nTraceback (most recent call last):\n  complete frame\n  unfinished frame',
    )[0]?.traceback,
  ).toBe('Traceback (most recent call last):\n  complete frame')
  expect(parseLoggedFailures('  orphaned frame\nKeyError: missing\n')).toEqual(
    [],
  )
})
