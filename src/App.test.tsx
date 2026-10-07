import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { useLabStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useLabStore.setState({
    screen: 'cockpit',
    themePreference: 'abyss',
    paletteOpen: false,
    silentRunning: false,
  })
})

describe('Lab shell', () => {
  it('saves silent running and restores it from local preferences', async () => {
    const user = userEvent.setup()
    useLabStore.setState({ screen: 'settings' })
    render(<App />)
    const toggle = screen.getByRole('switch', { name: 'Silent running' })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(toggle).toBeChecked()
    expect(document.documentElement).toHaveAttribute(
      'data-silent-running',
      'true',
    )
    const stored = localStorage.getItem('cachalot-studio-ui')
    expect(JSON.parse(stored!).state.silentRunning).toBe(true)
    useLabStore.setState({ silentRunning: false })
    localStorage.setItem('cachalot-studio-ui', stored!)
    await useLabStore.persist.rehydrate()
    await waitFor(() => expect(toggle).toBeChecked())
    await user.click(toggle)
    expect(document.documentElement).toHaveAttribute(
      'data-silent-running',
      'false',
    )
  })

  it('navigates with the sidebar and command palette', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Doctor' }))
    expect(screen.getByRole('heading', { name: 'Doctor' })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    const palette = await screen.findByRole('dialog', {
      name: 'Command palette',
    })
    await user.type(
      within(palette).getByRole('textbox', { name: 'Search commands' }),
      'open settings',
    )
    await user.keyboard('{Enter}')

    expect(
      screen.getByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument()
  })

  it('applies theme choices to the document', async () => {
    const user = userEvent.setup()
    useLabStore.setState({ screen: 'settings' })
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Surface/ }))
    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute('data-theme', 'surface'),
    )
    expect(useLabStore.getState().themePreference).toBe('surface')
  })
})
