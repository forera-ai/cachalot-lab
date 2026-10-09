import { invoke, isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { MessageSquarePlus, Send, Square, Trash2 } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import {
  deleteConversation,
  listConversations,
  saveConversation,
  titleFromMessage,
  type Conversation,
  type GenerationSettings,
} from './conversations'
import type { RuntimeConnection } from './runtime'
import { useLabStore } from './store'

type ChatEvent = {
  chat_id: number
  kind: 'delta' | 'done' | 'error' | 'canceled'
  content?: string
  reasoning?: string
  usage?: Record<string, unknown>
  error?: string
}

const emptyMessages: Conversation['messages'] = []
const defaultSettings: GenerationSettings = {
  thinking: false,
  max_tokens: 2048,
  temperature: null,
}

function updatedConversation(
  conversation: Conversation,
  messages: Conversation['messages'],
): Conversation {
  return { ...conversation, messages, updated_at: Date.now() }
}

export function ChatScreen({ runtime }: { runtime: RuntimeConnection }) {
  const setScreen = useLabStore((state) => state.setScreen)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [newChatSettings, setNewChatSettings] =
    useState<GenerationSettings>(defaultSettings)
  const [maxTokensDraft, setMaxTokensDraft] = useState<string | null>(null)
  const [temperatureDraft, setTemperatureDraft] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const conversationsRef = useRef<Conversation[]>([])
  const activeRequestId = useRef<number | null>(null)
  const activeConversationId = useRef<string | null>(null)
  const pendingRequest = useRef(false)
  const pendingSave = useRef<Conversation | null>(null)
  const saveTimer = useRef<number | null>(null)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const bottomRef = useRef<HTMLDivElement>(null)

  const queueSave = useCallback((conversation: Conversation) => {
    saveQueue.current = saveQueue.current
      .then(() => saveConversation(conversation))
      .then(() => setStorageError(null))
      .catch((error: unknown) => setStorageError(String(error)))
  }, [])

  const flushSave = useCallback(() => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    saveTimer.current = null
    if (pendingSave.current) queueSave(pendingSave.current)
    pendingSave.current = null
  }, [queueSave])

  const scheduleSave = useCallback(
    (conversation: Conversation) => {
      pendingSave.current = conversation
      if (saveTimer.current === null)
        saveTimer.current = window.setTimeout(flushSave, 1000)
    },
    [flushSave],
  )

  const updateConversation = useCallback(
    (id: string, update: (current: Conversation) => Conversation) => {
      const current = conversationsRef.current.find((item) => item.id === id)
      if (!current) return
      const changed = update(current)
      const next = conversationsRef.current
        .map((item) => (item.id === id ? changed : item))
        .sort((left, right) => right.updated_at - left.updated_at)
      conversationsRef.current = next
      setConversations(next)
      scheduleSave(changed)
    },
    [scheduleSave],
  )

  useEffect(() => {
    let disposed = false
    void listConversations()
      .then((items) => {
        if (disposed) return
        const ordered = [...items].sort(
          (left, right) => right.updated_at - left.updated_at,
        )
        conversationsRef.current = ordered
        setConversations(ordered)
        setSelectedId(ordered[0]?.id ?? null)
        setLoaded(true)
      })
      .catch((error: unknown) => {
        if (disposed) return
        setStorageError(String(error))
        setLoaded(true)
      })
    return () => {
      disposed = true
      flushSave()
    }
  }, [flushSave])

  useEffect(() => {
    if (!isTauri()) return
    let disposed = false
    let unlisten: (() => void) | undefined
    void listen<ChatEvent>('runtime-chat', ({ payload }) => {
      if (
        activeRequestId.current !== null &&
        payload.chat_id !== activeRequestId.current
      )
        return
      if (activeRequestId.current === null) {
        if (!pendingRequest.current) return
        activeRequestId.current = payload.chat_id
      }
      if (payload.kind === 'error') {
        setChatError(payload.error || 'The generation failed.')
        const id = activeConversationId.current
        if (id) {
          updateConversation(id, (conversation) => {
            const last = conversation.messages.at(-1)
            return last?.role === 'assistant' &&
              !last.content &&
              !last.reasoning
              ? updatedConversation(
                  conversation,
                  conversation.messages.slice(0, -1),
                )
              : conversation
          })
        }
        setSending(false)
        activeRequestId.current = null
        activeConversationId.current = null
        pendingRequest.current = false
        flushSave()
        return
      }
      if (payload.kind === 'done' || payload.kind === 'canceled') {
        const id = activeConversationId.current
        if (id) {
          updateConversation(id, (conversation) => {
            const last = conversation.messages.at(-1)
            return last?.role === 'assistant' &&
              !last.content &&
              !last.reasoning
              ? updatedConversation(
                  conversation,
                  conversation.messages.slice(0, -1),
                )
              : conversation
          })
        }
        setSending(false)
        activeRequestId.current = null
        activeConversationId.current = null
        pendingRequest.current = false
        flushSave()
        return
      }
      const id = activeConversationId.current
      if (!id) return
      updateConversation(id, (conversation) => {
        const messages = [...conversation.messages]
        const last = messages[messages.length - 1]
        if (!last || last.role !== 'assistant') return conversation
        messages[messages.length - 1] = {
          ...last,
          content: last.content + (payload.content || ''),
          reasoning: (last.reasoning || '') + (payload.reasoning || ''),
          usage: payload.usage || last.usage,
        }
        return updatedConversation(conversation, messages)
      })
    }).then((release) => {
      if (disposed) release()
      else unlisten = release
    })
    return () => {
      disposed = true
      unlisten?.()
    }
  }, [flushSave, updateConversation])

  const selected = conversations.find((item) => item.id === selectedId)
  const messages = selected?.messages ?? emptyMessages
  const settings = selected
    ? (selected.settings ?? defaultSettings)
    : newChatSettings

  useEffect(() => {
    setMaxTokensDraft(null)
    setTemperatureDraft(null)
  }, [selectedId])
  const sameSource =
    !selected ||
    (selected.endpoint === runtime.snapshot.endpoint &&
      selected.model_id === runtime.snapshot.model_id)

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages])

  function selectConversation(id: string | null) {
    if (sending) return
    flushSave()
    setSelectedId(id)
    if (id === null) setNewChatSettings(defaultSettings)
    setMaxTokensDraft(null)
    setTemperatureDraft(null)
    setDraft('')
    setChatError(null)
  }

  function updateSettings(change: Partial<GenerationSettings>) {
    if (sending) return
    if (selected) {
      updateConversation(selected.id, (current) => ({
        ...current,
        settings: { ...(current.settings ?? defaultSettings), ...change },
        updated_at: Date.now(),
      }))
    } else {
      setNewChatSettings((current) => ({ ...current, ...change }))
    }
  }

  async function removeConversation(id: string) {
    if (sending || !window.confirm('Delete this saved conversation?')) return
    flushSave()
    try {
      await saveQueue.current
      await deleteConversation(id)
      const next = conversationsRef.current.filter((item) => item.id !== id)
      conversationsRef.current = next
      setConversations(next)
      if (selectedId === id) setSelectedId(next[0]?.id ?? null)
      setStorageError(null)
    } catch (error) {
      setStorageError(String(error))
    }
  }

  async function send() {
    const content = draft.trim()
    if (!content || sending || !loaded || !runtime.snapshot.healthy) return
    const existing = conversationsRef.current.find(
      (item) => item.id === selectedId,
    )
    if (
      existing &&
      (existing.endpoint !== runtime.snapshot.endpoint ||
        existing.model_id !== runtime.snapshot.model_id)
    ) {
      setChatError(
        'Connect to the original server and model to continue this chat.',
      )
      return
    }
    const history = (existing?.messages ?? [])
      .map(({ role, content: text }) => ({ role, content: text }))
      .filter((message) => message.content)
    const id = existing?.id ?? crypto.randomUUID()
    const nextMessages: Conversation['messages'] = [
      ...(existing?.messages ?? []),
      { role: 'user', content },
      { role: 'assistant', content: '' },
    ]
    if (existing) {
      updateConversation(id, (current) =>
        updatedConversation(current, nextMessages),
      )
    } else {
      const conversation: Conversation = {
        id,
        title: titleFromMessage(content),
        endpoint: runtime.snapshot.endpoint || '',
        model_id: runtime.snapshot.model_id || '',
        updated_at: Date.now(),
        messages: nextMessages,
        settings: { ...settings },
      }
      const next = [conversation, ...conversationsRef.current]
      conversationsRef.current = next
      setConversations(next)
      setSelectedId(id)
      scheduleSave(conversation)
    }
    setDraft('')
    setChatError(null)
    setSending(true)
    pendingRequest.current = true
    activeConversationId.current = id
    try {
      const requestId = await invoke<number>('start_chat', {
        messages: [...history, { role: 'user', content }],
        maxTokens: settings.max_tokens,
        thinking: settings.thinking,
        temperature: settings.temperature,
      })
      if (pendingRequest.current) activeRequestId.current = requestId
    } catch (error) {
      setSending(false)
      pendingRequest.current = false
      activeRequestId.current = null
      activeConversationId.current = null
      setChatError(String(error))
      setDraft(content)
      if (existing) {
        updateConversation(id, () => existing)
      } else {
        if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
        saveTimer.current = null
        pendingSave.current = null
        const next = conversationsRef.current.filter((item) => item.id !== id)
        conversationsRef.current = next
        setConversations(next)
        setSelectedId(null)
        saveQueue.current = saveQueue.current
          .then(() => deleteConversation(id))
          .catch((saveError: unknown) => setStorageError(String(saveError)))
      }
    }
  }

  function onDraftKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <div className="page chat-page">
      <div className="page-heading chat-heading">
        <div>
          <h1>Chat</h1>
          <p>
            {runtime.snapshot.healthy
              ? `Talking to ${runtime.snapshot.model_id}`
              : 'Connect a local runtime to start or continue a chat.'}
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={() => selectConversation(null)}
          disabled={sending || !loaded}
        >
          <MessageSquarePlus size={15} /> New chat
        </button>
      </div>
      {!runtime.snapshot.healthy && (
        <div className="chat-connection-note">
          <span>Runtime offline. Saved conversations are still available.</span>
          <button className="secondary-button" onClick={() => setScreen('api')}>
            Open API setup
          </button>
        </div>
      )}
      <div className="chat-workspace">
        <aside className="conversation-rail" aria-label="Saved conversations">
          <div className="conversation-rail-title">CONVERSATIONS</div>
          {conversations.length === 0 && (
            <p className="conversation-rail-empty">No saved chats yet.</p>
          )}
          <div
            className="conversation-list"
            tabIndex={0}
            role="group"
            aria-label="Conversation list"
          >
            {conversations.map((conversation) => (
              <div
                className={`conversation-entry ${selectedId === conversation.id ? 'is-selected' : ''}`}
                key={conversation.id}
              >
                <button
                  className="conversation-select"
                  aria-label={`Open ${conversation.title}`}
                  onClick={() => selectConversation(conversation.id)}
                  disabled={sending}
                  aria-current={
                    selectedId === conversation.id ? 'true' : undefined
                  }
                >
                  <strong>{conversation.title}</strong>
                  <span>{conversation.model_id || 'Local model'}</span>
                </button>
                <button
                  className="conversation-delete"
                  aria-label={`Delete ${conversation.title}`}
                  title="Delete conversation"
                  disabled={sending}
                  onClick={() => void removeConversation(conversation.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </aside>
        <div className="chat-main">
          <div
            className="chat-messages"
            role="log"
            aria-label="Conversation"
            tabIndex={0}
          >
            {messages.length === 0 && (
              <div className="chat-welcome">
                <span className="section-kicker">LOCAL INFERENCE</span>
                <h2>Ask something.</h2>
                <p>
                  Messages go directly to the Cachalot server on this Mac.
                  {isTauri()
                    ? ' Conversations are saved locally and can be reopened after restarting Lab.'
                    : ' Browser preview chats are temporary.'}
                </p>
              </div>
            )}
            {selected && !sameSource && (
              <p className="chat-source-note">
                Saved with {selected.model_id} at {selected.endpoint}. Connect
                that source to continue, or start a new chat.
              </p>
            )}
            {messages.map((message, index) => (
              <article
                className={`chat-message chat-${message.role}`}
                key={`${selectedId}-${index}`}
              >
                <div className="chat-message-role">
                  {message.role === 'user' ? 'YOU' : 'CACHALOT'}
                </div>
                {message.reasoning && (
                  <details className="reasoning-block">
                    <summary>Reasoning</summary>
                    <p>{message.reasoning}</p>
                  </details>
                )}
                <div className="chat-message-content">
                  {message.content ||
                    (sending && index === messages.length - 1
                      ? 'Thinking…'
                      : '')}
                </div>
                {message.usage && (
                  <div className="chat-usage">
                    {String(message.usage.completion_tokens ?? '—')} output
                    tokens · {String(message.usage.total_tokens ?? '—')} total
                  </div>
                )}
              </article>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="chat-compose">
            {storageError && (
              <p className="inline-error" role="alert">
                Could not access saved conversations: {storageError}
              </p>
            )}
            {chatError && (
              <p className="inline-error" role="alert">
                {chatError}
              </p>
            )}
            <div className="chat-options">
              <label>
                <input
                  type="checkbox"
                  checked={settings.thinking}
                  disabled={sending}
                  onChange={(event) =>
                    updateSettings({ thinking: event.target.checked })
                  }
                />{' '}
                Thinking
              </label>
              <label>
                Max output tokens{' '}
                <input
                  type="number"
                  min="1"
                  max="32768"
                  value={maxTokensDraft ?? settings.max_tokens}
                  disabled={sending}
                  onChange={(event) => {
                    const raw = event.target.value
                    setMaxTokensDraft(raw)
                    const value = Number(raw)
                    if (Number.isInteger(value) && value >= 1 && value <= 32768)
                      updateSettings({ max_tokens: value })
                  }}
                  onBlur={() => setMaxTokensDraft(null)}
                />
              </label>
              <label>
                Temperature{' '}
                <input
                  aria-label="Temperature · server default when empty"
                  title="Empty uses the server default"
                  placeholder="Default"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperatureDraft ?? settings.temperature ?? ''}
                  disabled={sending}
                  onChange={(event) => {
                    const value = event.target.value
                    setTemperatureDraft(value)
                    if (value === '') updateSettings({ temperature: null })
                    else if (
                      Number.isFinite(Number(value)) &&
                      Number(value) >= 0 &&
                      Number(value) <= 2
                    )
                      updateSettings({ temperature: Number(value) })
                  }}
                  onBlur={() => setTemperatureDraft(null)}
                />
              </label>
            </div>
            <div className="chat-input-row">
              <textarea
                aria-label="Message"
                placeholder="Message your local model…"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onDraftKeyDown}
                disabled={!loaded || !runtime.snapshot.healthy || !sameSource}
                rows={3}
              />
              <button
                className="primary-button"
                onClick={() => void (sending ? invoke('stop_chat') : send())}
                disabled={!sending && (!draft.trim() || !sameSource || !loaded)}
              >
                {sending ? (
                  <>
                    <Square size={15} /> Stop
                  </>
                ) : (
                  <>
                    <Send size={15} /> Send
                  </>
                )}
              </button>
            </div>
            <span className="chat-hint">
              Enter to send · Shift Enter for a new line
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
