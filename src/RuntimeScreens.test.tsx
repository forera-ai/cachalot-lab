import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { ConnectionPanel } from './RuntimeScreens'
import type { RuntimeConnection } from './runtime'

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
