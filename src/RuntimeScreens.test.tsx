import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { ConnectionPanel } from './RuntimeScreens'
import type { RuntimeConnection } from './runtime'

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ invoke, isTauri: () => true }))
beforeEach(() => {
  invoke.mockReset().mockResolvedValue(false)
  vi.mocked(runtime.connect).mockReset().mockResolvedValue(true)
})

const runtime = {
  snapshot: {
    connected: false,
    healthy: false,
    busy: false,
    endpoint: null,
    model_id: null,
    stats: null,
    error: null,
  },
  connecting: false,
  connectError: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
} as unknown as RuntimeConnection

afterEach(() => localStorage.clear())

it('shows port 8011 for a new connection', () => {
  render(<ConnectionPanel runtime={runtime} />)
  expect(screen.getByRole('textbox', { name: 'Server address' })).toHaveValue(
    'http://127.0.0.1:8011',
  )
  expect(screen.getByText('Default port: 8011')).toBeInTheDocument()
})

it('can replace a previously saved port with the default address', () => {
  localStorage.setItem('cachalot-runtime-endpoint', 'http://127.0.0.1:8012')
  render(<ConnectionPanel runtime={runtime} />)
  expect(screen.getByRole('textbox', { name: 'Server address' })).toHaveValue(
    'http://127.0.0.1:8012',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Use default address' }))
  expect(screen.getByRole('textbox', { name: 'Server address' })).toHaveValue(
    'http://127.0.0.1:8011',
  )
})

it('saves explicitly, connects with the native saved key, and forgets it without disconnecting', async () => {
  render(<ConnectionPanel runtime={runtime} />)
  fireEvent.change(screen.getByLabelText(/API key/), {
    target: { value: 'synthetic-secret' },
  })
  expect(invoke).not.toHaveBeenCalledWith('save_runtime_key', expect.anything())
  fireEvent.click(screen.getByRole('button', { name: 'Save key in Keychain' }))
  await waitFor(() => expect(screen.getByLabelText(/API key/)).toHaveValue(''))
  expect(invoke).toHaveBeenCalledWith('save_runtime_key', {
    endpointUrl: 'http://127.0.0.1:8011',
    apiKey: 'synthetic-secret',
  })
  fireEvent.click(screen.getByRole('button', { name: /^Connect$/ }))
  await waitFor(() =>
    expect(runtime.connect).toHaveBeenCalledWith(
      'http://127.0.0.1:8011',
      '',
      true,
      true,
    ),
  )
  fireEvent.change(screen.getByLabelText(/API key/), {
    target: { value: 'override' },
  })
  fireEvent.click(screen.getByRole('button', { name: /^Connect$/ }))
  await waitFor(() =>
    expect(runtime.connect).toHaveBeenCalledWith(
      'http://127.0.0.1:8011',
      'override',
      true,
      false,
    ),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Forget saved key' }))
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Forget saved key' }),
    ).not.toBeInTheDocument(),
  )
  expect(localStorage.getItem('synthetic-secret')).toBeNull()
})

it('does not use another address saved key', async () => {
  invoke.mockImplementation(async (command) => command === 'has_runtime_key')
  render(<ConnectionPanel runtime={runtime} />)
  await screen.findByLabelText('Use saved Keychain key for this address')
  fireEvent.change(screen.getByLabelText('Server address'), {
    target: { value: 'http://127.0.0.1:18021' },
  })
  fireEvent.click(screen.getByRole('button', { name: /^Connect$/ }))
  await waitFor(() =>
    expect(runtime.connect).toHaveBeenCalledWith(
      'http://127.0.0.1:18021',
      '',
      true,
      false,
    ),
  )
})
