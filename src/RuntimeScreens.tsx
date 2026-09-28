import { invoke, isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { Copy, PlugZap, Send, Square, Trash2 } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'

import { DEFAULT_ENDPOINT, type RuntimeConnection } from './runtime'

type Message = {
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  usage?: Record<string, unknown>
  error?: string
}
type ChatEvent = {
  chat_id: number
  kind: 'delta' | 'done' | 'error' | 'canceled'
  content?: string
  reasoning?: string
  usage?: Record<string, unknown>
  error?: string
}

export function ConnectionPanel({ runtime }: { runtime: RuntimeConnection }) {
  const [endpoint, setEndpoint] = useState(
    () => localStorage.getItem('cachalot-runtime-endpoint') || DEFAULT_ENDPOINT,
  )
  const [apiKey, setApiKey] = useState('')
  const { snapshot } = runtime

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runtime.connect(endpoint, apiKey)
    setApiKey('')
  }

  return (
    <section className="info-panel connection-panel">
      <span className="section-kicker">LOCAL CONNECTION</span>
      <h2>{snapshot.healthy ? 'Runtime connected' : 'Connect to Cachalot'}</h2>
      <p className="panel-intro">
        Use a Cachalot server running on this Mac. The API key stays in app
        memory for this session.
      </p>
      <form
        onSubmit={(event) => void submit(event)}
        className="connection-form"
      >
        <label htmlFor="runtime-endpoint">Server address</label>
        <input
          id="runtime-endpoint"
          value={endpoint}
          onChange={(event) => setEndpoint(event.target.value)}
          spellCheck={false}
          placeholder={DEFAULT_ENDPOINT}
        />
        <label htmlFor="runtime-api-key">
          API key <span>(only if your server requires one)</span>
        </label>
        <input
          id="runtime-api-key"
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          autoComplete="off"
        />
        <div className="connection-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={runtime.connecting}
          >
            {runtime.connecting ? 'Connecting…' : 'Connect'}{' '}
            <PlugZap size={16} />
          </button>
          {snapshot.connected && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => void runtime.disconnect()}
            >
              Disconnect
            </button>
          )}
        </div>
      </form>
      {runtime.connectError && (
        <p className="inline-error" role="alert">
          {runtime.connectError}
        </p>
      )}
      {snapshot.error && (
        <p className="inline-error" role="alert">
          {snapshot.error}
        </p>
      )}
      {snapshot.connected && (
        <div className="connection-facts">
          <div>
            <span>Endpoint</span>
            <strong>{snapshot.endpoint}</strong>
          </div>
          <div>
            <span>Model</span>
            <strong>{snapshot.model_id}</strong>
          </div>
          <div>
            <span>State</span>
            <strong>
              {snapshot.healthy
                ? snapshot.busy
                  ? 'Generating'
                  : 'Ready'
                : 'Unavailable'}
            </strong>
          </div>
        </div>
      )}
    </section>
  )
}

export function ApiScreen({ runtime }: { runtime: RuntimeConnection }) {
  const { snapshot } = runtime
  const snippet = [
    `curl ${snapshot.endpoint || DEFAULT_ENDPOINT}/v1/chat/completions ${String.fromCharCode(92)}`,
    `  -H 'Content-Type: application/json' ${String.fromCharCode(92)}`,
    `  -d '{"model":"${snapshot.model_id || 'your-model-id'}","messages":[{"role":"user","content":"Hello"}]}'`,
  ].join('\n')

  return (
    <div className="page detail-page">
      <div className="eyebrow">
        <span className="eyebrow-line" /> STUDIO / API
      </div>
      <div className="page-heading">
        <div>
          <h1>API</h1>
          <p>Connect Studio and other clients to the local server.</p>
        </div>
      </div>
      <ConnectionPanel runtime={runtime} />
      <section className="info-panel api-panel">
        <span className="section-kicker">OPENAI-COMPATIBLE</span>
        <h2>Chat completions</h2>
        <p className="panel-intro">
          Use the endpoint in any compatible client. If your server requires a
          key, add an Authorization bearer header.
        </p>
        <pre>
          <code>{snippet}</code>
        </pre>
        <button
          className="text-button"
          onClick={() => void navigator.clipboard.writeText(snippet)}
        >
          <Copy size={15} /> Copy example
        </button>
      </section>
    </div>
  )
}

export function ChatScreen({ runtime }: { runtime: RuntimeConnection }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const activeId = useRef<number | null>(null)
  const pending = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isTauri()) return
    let disposed = false
    let unlisten: (() => void) | undefined
    void listen<ChatEvent>('runtime-chat', ({ payload }) => {
      if (activeId.current !== null && payload.chat_id !== activeId.current)
        return
      if (activeId.current === null) {
        if (!pending.current) return
        activeId.current = payload.chat_id
      }
      if (payload.kind === 'error') {
        setChatError(payload.error || 'The generation failed.')
        setSending(false)
        activeId.current = null
        pending.current = false
        return
      }
      if (payload.kind === 'done' || payload.kind === 'canceled') {
        setSending(false)
        activeId.current = null
        pending.current = false
        return
      }
      setMessages((current) => {
        const next = [...current]
        const last = next[next.length - 1]
        if (!last || last.role !== 'assistant') return current
        next[next.length - 1] = {
          ...last,
          content: last.content + (payload.content || ''),
          reasoning: (last.reasoning || '') + (payload.reasoning || ''),
          usage: payload.usage || last.usage,
        }
        return next
      })
    }).then((release) => {
      if (disposed) release()
      else unlisten = release
    })
    return () => {
      disposed = true
      unlisten?.()
    }
  }, [])

  useEffect(
    () => bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' }),
    [messages],
  )

  async function send() {
    const content = draft.trim()
    if (!content || sending || !runtime.snapshot.healthy) return
    const history = messages
      .map(({ role, content: text }) => ({ role, content: text }))
      .filter((message) => message.content)
    const nextMessages: Message[] = [
      ...messages,
      { role: 'user', content },
      { role: 'assistant', content: '' },
    ]
    setMessages(nextMessages)
    setDraft('')
    setChatError(null)
    setSending(true)
    pending.current = true
    try {
      const id = await invoke<number>('start_chat', {
        messages: [...history, { role: 'user', content }],
        maxTokens,
        thinking,
      })
      if (pending.current) activeId.current = id
    } catch (error) {
      setSending(false)
      pending.current = false
      setChatError(String(error))
      setDraft(content)
      setMessages((current) => current.slice(0, -2))
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
      <div className="eyebrow">
        <span className="eyebrow-line" /> STUDIO / CHAT
      </div>
      <div className="page-heading">
        <div>
          <h1>Chat</h1>
          <p>
            {runtime.snapshot.healthy
              ? `Talking to ${runtime.snapshot.model_id}`
              : 'Connect a local runtime to start.'}
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={() => {
            setMessages([])
            setChatError(null)
          }}
          disabled={sending || messages.length === 0}
        >
          <Trash2 size={15} /> New chat
        </button>
      </div>
      {!runtime.snapshot.healthy ? (
        <ConnectionPanel runtime={runtime} />
      ) : (
        <div className="chat-workspace">
          <div className="chat-messages" role="log" aria-label="Conversation">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <span className="section-kicker">LOCAL INFERENCE</span>
                <h2>Ask something.</h2>
                <p>
                  Messages go directly to the Cachalot server on this Mac. This
                  conversation is kept in memory until you close Studio or start
                  a new chat.
                </p>
              </div>
            )}
            {messages.map((message, index) => (
              <article
                className={`chat-message chat-${message.role}`}
                key={index}
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
            {chatError && (
              <p className="inline-error" role="alert">
                {chatError}
              </p>
            )}
            <div className="chat-options">
              <label>
                <input
                  type="checkbox"
                  checked={thinking}
                  onChange={(event) => setThinking(event.target.checked)}
                />{' '}
                Thinking
              </label>
              <label>
                Max output tokens{' '}
                <input
                  type="number"
                  min="1"
                  max="32768"
                  value={maxTokens}
                  onChange={(event) => setMaxTokens(Number(event.target.value))}
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
                rows={3}
              />
              <button
                className="primary-button"
                onClick={() => void (sending ? invoke('stop_chat') : send())}
                disabled={!sending && !draft.trim()}
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
      )}
    </div>
  )
}
