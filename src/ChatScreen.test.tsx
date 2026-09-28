import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChatScreen } from './ChatScreen'
import type { Conversation } from './conversations'
import type { RuntimeConnection } from './runtime'

const persistence = vi.hoisted(() => ({
  list: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
}))
const eventBus = vi.hoisted(() => ({
  handler: null as
    | null
    | ((event: {
        payload: { chat_id: number; kind: 'delta' | 'done'; content?: string }
      }) => void),
}))

vi.mock('./conversations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./conversations')>()
  return {
    ...actual,
    listConversations: persistence.list,
    saveConversation: persistence.save,
    deleteConversation: persistence.remove,
  }
})
vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => true,
  invoke: vi.fn().mockResolvedValue(7),
}))
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(
    async (_event: string, handler: NonNullable<typeof eventBus.handler>) => {
      eventBus.handler = handler
      return () => {
        eventBus.handler = null
      }
    },
  ),
}))

const saved: Conversation = {
  id: 'ef9194e0-69e1-4c1a-af0b-3c25b013329c',
  title: 'Earlier question',
  endpoint: 'http://127.0.0.1:8011',
  model_id: 'cachalot-mock',
  updated_at: 1,
  messages: [
    { role: 'user', content: 'Earlier question' },
    { role: 'assistant', content: 'Earlier answer' },
  ],
}

function runtime(model = 'cachalot-mock'): RuntimeConnection {
  return {
    snapshot: {
      connected: true,
      healthy: true,
      busy: false,
      endpoint: 'http://127.0.0.1:8011',
      model_id: model,
      stats: null,
      error: null,
    },
    connecting: false,
    connectError: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    refresh: vi.fn(),
  }
}

beforeEach(() => {
  eventBus.handler = null
  persistence.list.mockReset().mockResolvedValue([saved])
  persistence.save.mockReset().mockResolvedValue(undefined)
  persistence.remove.mockReset().mockResolvedValue(undefined)
})

describe('saved conversations', () => {
  it('reopens a conversation and keeps it when starting a new chat', async () => {
    const user = userEvent.setup()
    render(<ChatScreen runtime={runtime()} />)

    expect(await screen.findByText('Earlier answer')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'New chat' }))

    expect(screen.getByText('Ask something.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Open Earlier question' }),
    ).toBeInTheDocument()
    expect(persistence.remove).not.toHaveBeenCalled()
  })

  it('blocks continuing a chat on a different model', async () => {
    render(<ChatScreen runtime={runtime('another-model')} />)

    expect(await screen.findByText('Earlier answer')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeDisabled()
    expect(
      screen.getByText(/Connect that source to continue/),
    ).toBeInTheDocument()
  })

  it('saves a streamed reply after generation finishes', async () => {
    persistence.list.mockResolvedValue([])
    const user = userEvent.setup()
    render(<ChatScreen runtime={runtime()} />)

    await screen.findByText('Ask something.')
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hello')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(eventBus.handler).not.toBeNull())
    act(() => {
      eventBus.handler?.({
        payload: { chat_id: 7, kind: 'delta', content: 'Mock reply' },
      })
      eventBus.handler?.({ payload: { chat_id: 7, kind: 'done' } })
    })

    expect(await screen.findByText('Mock reply')).toBeInTheDocument()
    await waitFor(
      () =>
        expect(persistence.save).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Hello',
            model_id: 'cachalot-mock',
            messages: [
              { role: 'user', content: 'Hello' },
              {
                role: 'assistant',
                content: 'Mock reply',
                reasoning: '',
                usage: undefined,
              },
            ],
          }),
        ),
      { timeout: 2000 },
    )
  })
})
