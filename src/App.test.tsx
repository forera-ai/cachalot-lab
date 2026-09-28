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
import { useStudioStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useStudioStore.setState({
    screen: 'cockpit',
    themePreference: 'abyss',
    paletteOpen: false,
  })
})

describe('Studio shell', () => {
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
    useStudioStore.setState({ screen: 'settings' })
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Surface/ }))
    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute('data-theme', 'surface'),
    )
    expect(useStudioStore.getState().themePreference).toBe('surface')
  })
})
