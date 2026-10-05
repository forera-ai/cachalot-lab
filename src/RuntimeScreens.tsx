import { Copy, PlugZap } from 'lucide-react'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { apiExamples, type ApiExampleLanguage } from './apiExamples'
import {
  DEFAULT_ENDPOINT,
  DEFAULT_RUNTIME_PORT,
  type RuntimeConnection,
} from './runtime'

export function ConnectionPanel({ runtime }: { runtime: RuntimeConnection }) {
  const [endpoint, setEndpoint] = useState(
    () => localStorage.getItem('cachalot-runtime-endpoint') || DEFAULT_ENDPOINT,
  )
  const [apiKey, setApiKey] = useState('')
  const [savedEndpoint, setSavedEndpoint] = useState<string | null>(null)
  const [useSaved, setUseSaved] = useState(true)
  const [keyBusy, setKeyBusy] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)
  const keyRevision = useRef(0)
  const hasSaved = savedEndpoint === endpoint
  useEffect(() => {
    if (!isTauri()) return
    let active = true
    const revision = ++keyRevision.current
    const timer = window.setTimeout(() => {
      void invoke<boolean>('has_runtime_key', { endpointUrl: endpoint })
        .then((found) => {
          if (active && revision === keyRevision.current) {
            setSavedEndpoint(found ? endpoint : null)
            setKeyError(null)
          }
        })
        .catch(() => {
          if (active && revision === keyRevision.current) setSavedEndpoint(null)
        })
    }, 300)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [endpoint])
  async function changeSavedKey(remove: boolean) {
    const address = endpoint
    ++keyRevision.current
    setKeyBusy(true)
    setKeyError(null)
    try {
      await invoke(remove ? 'delete_runtime_key' : 'save_runtime_key', {
        endpointUrl: address,
        ...(remove ? {} : { apiKey }),
      })
      setSavedEndpoint(remove ? null : address)
      if (!remove) {
        setApiKey('')
        setUseSaved(true)
      }
    } catch (reason) {
      setKeyError(String(reason))
    } finally {
      setKeyBusy(false)
    }
  }
  const { snapshot } = runtime

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runtime.connect(
      endpoint,
      apiKey,
      true,
      useSaved && hasSaved && !apiKey.trim(),
    )
    setApiKey('')
  }

  return (
    <section className="info-panel connection-panel">
      <span className="section-kicker">LOCAL CONNECTION</span>
      <h2>{snapshot.healthy ? 'Runtime connected' : 'Connect to Cachalot'}</h2>
      <p className="panel-intro">
        Use a Cachalot server running on this Mac. Keys stay in session memory
        unless you explicitly save one in macOS Keychain for this address.
      </p>
      <form
        onSubmit={(event) => void submit(event)}
        className="connection-form"
      >
        <label htmlFor="runtime-endpoint">Server address</label>
        <input
          id="runtime-endpoint"
          value={endpoint}
          disabled={keyBusy}
          onChange={(event) => setEndpoint(event.target.value)}
          spellCheck={false}
          placeholder={DEFAULT_ENDPOINT}
        />
        <div className="connection-default">
          Default port: {DEFAULT_RUNTIME_PORT}
          {endpoint !== DEFAULT_ENDPOINT && (
            <button
              type="button"
              className="text-button"
              disabled={keyBusy}
              onClick={() => setEndpoint(DEFAULT_ENDPOINT)}
            >
              Use default address
            </button>
          )}
        </div>
        <label htmlFor="runtime-api-key">
          API key <span>(only if your server requires one)</span>
        </label>
        <input
          id="runtime-api-key"
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          autoComplete="off"
          disabled={keyBusy}
        />
        {isTauri() && (
          <div className="keychain-controls">
            {hasSaved && (
              <label>
                <input
                  type="checkbox"
                  checked={useSaved}
                  onChange={(event) => setUseSaved(event.target.checked)}
                />{' '}
                Use saved Keychain key for this address
              </label>
            )}
            <button
              className="text-button"
              type="button"
              disabled={keyBusy || !apiKey.trim()}
              onClick={() => void changeSavedKey(false)}
            >
              Save key in Keychain
            </button>
            {hasSaved && (
              <button
                className="text-button"
                type="button"
                disabled={keyBusy}
                onClick={() => void changeSavedKey(true)}
              >
                Forget saved key
              </button>
            )}
            <p className="panel-intro">
              A typed key overrides the saved key. Saved keys can reconnect
              after restart. Forgetting a key leaves the active connection
              unchanged.
            </p>
            {keyError && (
              <p className="inline-error" role="alert">
                {keyError}
              </p>
            )}
          </div>
        )}
        <div className="connection-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={runtime.connecting || keyBusy}
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
  const [language, setLanguage] = useState<ApiExampleLanguage>('curl')
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  )
  const snippet = apiExamples(snapshot.endpoint, snapshot.model_id)[language]

  async function copyExample() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

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
          Copy an example for your client. Set CACHALOT_API_KEY in your shell
          only if the server requires a key. Studio never inserts its in-memory
          key into copied code.
        </p>
        <div
          className="api-example-tabs"
          role="tablist"
          aria-label="API example language"
        >
          {(['curl', 'python', 'javascript'] as const).map((option) => (
            <button
              key={option}
              id={`api-example-${option}`}
              type="button"
              role="tab"
              aria-selected={language === option}
              aria-controls="api-example-code"
              onClick={() => {
                setLanguage(option)
                setCopyStatus('idle')
              }}
            >
              {option === 'curl'
                ? 'curl'
                : option === 'python'
                  ? 'Python'
                  : 'JavaScript'}
            </button>
          ))}
        </div>
        <pre
          id="api-example-code"
          role="tabpanel"
          aria-labelledby={`api-example-${language}`}
        >
          <code>{snippet}</code>
        </pre>
        <button
          className="text-button"
          type="button"
          onClick={() => void copyExample()}
        >
          <Copy size={15} />{' '}
          {copyStatus === 'copied' ? 'Copied' : 'Copy example'}
        </button>
        {copyStatus === 'error' && (
          <p className="inline-error" role="alert">
            Could not copy. Select the example above and copy it manually.
          </p>
        )}
      </section>
    </div>
  )
}
