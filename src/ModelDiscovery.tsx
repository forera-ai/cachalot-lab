import { invoke, isTauri } from '@tauri-apps/api/core'
import { useState, type FormEvent } from 'react'
import { newProfile, type LaunchProfile } from './managed'

type Candidate = {
  name: string
  path: string
  family: LaunchProfile['family']
  model_type: string
  weights_present: boolean
  tokenizer_present: boolean
}
type Discovery = {
  root: string
  models: Candidate[]
  scanned_dirs: number
  skipped_dirs: number
  invalid_configs: number
  truncated: boolean
}
export function ModelDiscovery({
  onDraft,
}: {
  onDraft: (profile: LaunchProfile) => void
}) {
  const [root, setRoot] = useState('')
  const [result, setResult] = useState<Discovery | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function scan(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      setResult(await invoke<Discovery>('discover_models', { rootPath: root }))
    } catch (reason) {
      setError(String(reason))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="info-panel model-discovery">
      <span className="section-kicker">LOCAL MODEL DISCOVERY</span>
      <h2>Find a model folder</h2>
      <p className="panel-intro">
        Scan a chosen folder and up to three levels below it for DeepSeek V4.1,
        GLM 5 Next, and MiniMax M3 metadata. No downloads or runtime launches.
      </p>
      <form
        className="managed-form discovery-form"
        onSubmit={(event) => void scan(event)}
      >
        <label>
          Search folder
          <input
            required
            value={root}
            placeholder="/Volumes/drive/models"
            onChange={(event) => {
              setRoot(event.target.value)
              setResult(null)
            }}
            disabled={busy}
          />
        </label>
        <button className="secondary-button" disabled={busy || !isTauri()}>
          {busy ? 'Scanning…' : 'Scan folder'}
        </button>
      </form>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <>
          <p className="panel-intro">
            {result.models.length} models found · {result.scanned_dirs} folders
            checked.
            {result.truncated
              ? ' Scan limit reached; choose a narrower folder.'
              : ''}{' '}
            {result.skipped_dirs > 0 || result.invalid_configs > 0
              ? `${result.skipped_dirs} unreadable folders; ${result.invalid_configs} invalid configurations.`
              : ''}
          </p>
          {result.models.map((model) => (
            <div className="discovered-model" key={model.path}>
              <div className="discovered-model-info">
                <strong>{model.name}</strong>
                <p>{model.path}</p>
                <p className="panel-intro">
                  {model.family} ·{' '}
                  {model.weights_present
                    ? 'Weight file found'
                    : 'No weight file found'}{' '}
                  ·{' '}
                  {model.tokenizer_present
                    ? 'Tokenizer found'
                    : 'Tokenizer missing'}
                </p>
              </div>
              <button
                className="secondary-button"
                aria-label={`Create profile for ${model.name}`}
                type="button"
                onClick={() =>
                  onDraft({
                    ...newProfile(),
                    name: model.name.slice(0, 80),
                    model_path: model.path,
                    family: model.family,
                    default_temperature:
                      model.family === 'minimax' ? 0.7 : null,
                  })
                }
              >
                Create profile
              </button>
            </div>
          ))}
          <p className="panel-intro">
            Metadata discovery does not verify complete weights. Review the
            draft, set Python and any expert bank paths, then save it. Nothing
            is saved automatically.
          </p>
        </>
      )}
    </section>
  )
}
