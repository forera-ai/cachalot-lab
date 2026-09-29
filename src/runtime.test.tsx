import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useRuntime, type RuntimeSnapshot } from './runtime'

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))

vi.mock('@tauri-apps/api/core', () => ({
  invoke,
  isTauri: () => true,
}))

const snapshot: RuntimeSnapshot = {
  connected: true,
  healthy: true,
  busy: false,
  endpoint: 'http://127.0.0.1:8011',
  model_id: 'cachalot-mock',
  stats: null,
  error: null,
}

beforeEach(() => {
  vi.useFakeTimers()
  invoke.mockReset()
  invoke.mockImplementation((command: string) =>
    Promise.resolve(command === 'poll_runtime' ? snapshot : undefined),
  )
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

it('polls at the visible and hidden cadences', async () => {
  const { unmount } = renderHook(() => useRuntime())
  const pollCount = () =>
    invoke.mock.calls.filter(([command]) => command === 'poll_runtime').length

  await act(async () => {
    for (let index = 0; index < 5; index += 1) await Promise.resolve()
  })
  expect(pollCount()).toBe(1)

  await act(async () => vi.advanceTimersByTimeAsync(1000))
  expect(pollCount()).toBe(2)

  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: true,
  })
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  await act(async () => vi.advanceTimersByTimeAsync(4999))
  expect(pollCount()).toBe(2)
  await act(async () => vi.advanceTimersByTimeAsync(1))
  expect(pollCount()).toBe(3)

  unmount()
})
