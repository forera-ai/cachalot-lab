import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { newProfile, useManagedRuntime, type ManagedStatus } from './managed'
import type { RuntimeConnection } from './runtime'

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))

vi.mock('@tauri-apps/api/core', () => ({
  invoke,
  isTauri: () => true,
}))

const ready: ManagedStatus = {
  running: true,
  ready: true,
  profile_id: 'profile-1',
  endpoint: 'http://127.0.0.1:8011',
  pid: 1234,
  last_exit_code: null,
}

beforeEach(() => {
  vi.useFakeTimers()
  invoke.mockReset()
  invoke.mockResolvedValue(ready)
})

afterEach(() => vi.useRealTimers())

it('starts new managed profiles on port 8011', () => {
  expect(newProfile().port).toBe(8011)
})

it('connects once when owned process becomes ready and preserves saved endpoint', async () => {
  const connect = vi.fn().mockResolvedValue(true)
  const runtime = {
    snapshot: { connected: false, healthy: false, endpoint: null },
    connecting: false,
    connect,
    disconnect: vi.fn(),
  } as unknown as RuntimeConnection
  const { unmount } = renderHook(() => useManagedRuntime(runtime))

  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
  expect(connect).toHaveBeenCalledWith(ready.endpoint, undefined, false)

  await act(async () => vi.advanceTimersByTimeAsync(4000))
  expect(connect).toHaveBeenCalledTimes(1)
  unmount()
})

it('retries a failed connection on the next status poll without a tight loop', async () => {
  invoke.mockImplementation(() => Promise.resolve({ ...ready }))
  const connect = vi.fn().mockResolvedValue(false)
  const runtime = {
    snapshot: { connected: false, healthy: false, endpoint: null },
    connecting: false,
    connect,
    disconnect: vi.fn(),
  } as unknown as RuntimeConnection
  const { unmount } = renderHook(() => useManagedRuntime(runtime))
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
  expect(connect).toHaveBeenCalledTimes(1)
  await act(async () => vi.advanceTimersByTimeAsync(4000))
  expect(connect).toHaveBeenCalledTimes(2)
  unmount()
})

it('disconnects only when stopping the endpoint Studio connected', async () => {
  const disconnect = vi.fn().mockResolvedValue(undefined)
  const runtime = {
    snapshot: { connected: true, healthy: true, endpoint: ready.endpoint },
    connecting: false,
    connect: vi.fn(),
    disconnect,
  } as unknown as RuntimeConnection
  invoke.mockImplementation((command: string) =>
    Promise.resolve(
      command === 'stop_managed_runtime'
        ? { ...ready, running: false, ready: false, endpoint: null }
        : ready,
    ),
  )
  const { result, unmount } = renderHook(() => useManagedRuntime(runtime))
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
  await act(async () => {
    await result.current.stop()
  })
  expect(disconnect).toHaveBeenCalledOnce()
  unmount()
})

it('disconnects the owned endpoint after the child exits', async () => {
  const disconnect = vi.fn().mockResolvedValue(undefined)
  let checks = 0
  invoke.mockImplementation((command: string) => {
    if (command === 'managed_runtime_status') {
      checks += 1
      return Promise.resolve(
        checks === 1
          ? ready
          : {
              ...ready,
              running: false,
              ready: false,
              endpoint: null,
              pid: null,
            },
      )
    }
    return Promise.resolve(undefined)
  })
  const initial = {
    snapshot: { connected: false, healthy: false, endpoint: null },
    connecting: false,
    connect: vi.fn().mockResolvedValue(true),
    disconnect,
  } as unknown as RuntimeConnection
  const { rerender, unmount } = renderHook(
    ({ runtime }) => useManagedRuntime(runtime),
    { initialProps: { runtime: initial } },
  )
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
  rerender({
    runtime: {
      ...initial,
      snapshot: {
        ...initial.snapshot,
        connected: true,
        healthy: true,
        endpoint: ready.endpoint,
      },
    },
  })
  await act(async () => vi.advanceTimersByTimeAsync(2000))
  expect(disconnect).toHaveBeenCalledOnce()
  unmount()
})
