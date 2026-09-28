import { Copy, PlugZap } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { DEFAULT_ENDPOINT, type RuntimeConnection } from './runtime'

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
