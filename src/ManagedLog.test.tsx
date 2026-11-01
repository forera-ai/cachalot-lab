import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { ManagedLog } from './ManagedScreens'

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ invoke, isTauri: () => true }))
beforeEach(() => invoke.mockReset())

it('shows each explicit failure with collapsed traceback while preserving raw logs', async () => {
  const log = `[request failed] KeyError: 'w1.weight'
Traceback (most recent call last):
  File "/synthetic/server.py", line 10, in produce
    raise KeyError('w1.weight')
KeyError: 'w1.weight'
[request] model=synthetic tokens=2
[request failed] ValueError: invalid prompt
`
  invoke.mockResolvedValue(log)
  render(<ManagedLog />)
  const failure = await screen.findByRole('article', {
    name: 'Failed request at visible line 1',
  })
  expect(failure).toHaveTextContent("KeyError: 'w1.weight'")
  const trace = within(failure).getByLabelText('Traceback excerpt')
  expect(trace).not.toBeVisible()
  await userEvent.click(within(failure).getByText('Traceback excerpt'))
  expect(trace).toBeVisible()
  expect(trace).toHaveTextContent('/synthetic/server.py')
  expect(trace).not.toHaveTextContent('model=synthetic')
  const badRequest = screen.getByRole('article', {
    name: 'Failed request at visible line 7',
  })
  expect(badRequest).toHaveTextContent('ValueError: invalid prompt')
  expect(
    within(badRequest).queryByText('Traceback excerpt'),
  ).not.toBeInTheDocument()
  expect(screen.getByLabelText('Managed runtime output').textContent).toBe(log)
})

it('does not infer failures from missing completion lines or orphan tracebacks', async () => {
  const log =
    'ready\nTraceback (most recent call last):\n  old traceback\nKeyError: old\n[request failed] KeyError: partial'
  invoke.mockResolvedValue(log)
  render(<ManagedLog compact />)
  await screen.findByText('ready', { exact: false })
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Managed runtime output').textContent).toBe(log)
})

it('renders log content as text', async () => {
  const log = '[request failed] ValueError: <img src=x onerror=alert(1)>\n'
  invoke.mockResolvedValue(log)
  render(<ManagedLog />)
  const article = await screen.findByRole('article')
  expect(article).toHaveTextContent('<img src=x onerror=alert(1)>')
  expect(article.querySelector('img')).toBeNull()
  expect(screen.getAllByRole('article')).toHaveLength(1)
})

it('polls replace the visible failures without duplicating or retaining an old log', async () => {
  vi.useFakeTimers()
  try {
    invoke.mockResolvedValue('[request failed] ValueError: bad\n')
    await act(async () => {
      render(<ManagedLog />)
    })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    invoke.mockResolvedValue('new launch\n')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Managed runtime output').textContent).toBe(
      'new launch\n',
    )
  } finally {
    vi.useRealTimers()
  }
})
