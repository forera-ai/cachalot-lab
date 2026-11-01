import { expect, it } from 'vitest'
import { parseLoggedFailures } from './managedLog'

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
