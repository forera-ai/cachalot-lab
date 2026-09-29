import { invoke, isTauri } from '@tauri-apps/api/core'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

import {
  newProfile,
  type LaunchProfile,
  type ManagedRuntime,
  type RuntimeTuning,
} from './managed'
import { DEFAULT_RUNTIME_PORT, type RuntimeConnection } from './runtime'

type LaunchCommand = {
  executable: string
  args: string[]
  environment: Record<string, string>
  endpoint: string
}

function optionalNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

function OptionalNumber({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  min: number
  max: number
  step?: number
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={(event) => onChange(optionalNumber(event.target.value))}
      />
    </label>
  )
}

function TriState({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (value: boolean | null) => void
}) {
  return (
    <label>
      {label}
      <select
        value={value === null ? 'inherit' : String(value)}
        onChange={(event) =>
          onChange(
            event.target.value === 'inherit'
              ? null
              : event.target.value === 'true',
          )
        }
      >
        <option value="inherit">Runtime default</option>
        <option value="true">On</option>
        <option value="false">Off</option>
      </select>
    </label>
  )
}

export function DiveScreen({
  managed,
  runtime,
}: {
  managed: ManagedRuntime
  runtime: RuntimeConnection
}) {
  const [profiles, setProfiles] = useState<LaunchProfile[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<LaunchProfile | null>(null)
  const [preview, setPreview] = useState<LaunchCommand | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const selected = profiles.find((profile) => profile.id === selectedId) ?? null
  const status = managed.status

  const reload = useCallback(async () => {
    if (!isTauri()) return
    try {
      const items = await invoke<LaunchProfile[]>('list_profiles')
      setProfiles(items)
      setSelectedId((previous) =>
        previous && items.some((item) => item.id === previous)
          ? previous
          : (items[0]?.id ?? null),
      )
    } catch (reason) {
      setError(String(reason))
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  function update(changes: Partial<LaunchProfile>) {
    setDraft((current) => (current ? { ...current, ...changes } : current))
    setPreview(null)
  }

  function updateTuning(changes: Partial<RuntimeTuning>) {
    if (draft) update({ tuning: { ...draft.tuning, ...changes } })
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) return
    setBusy(true)
    setError(null)
    try {
      await invoke('save_profile', { profile: draft })
      await reload()
      setSelectedId(draft.id)
      setDraft(null)
    } catch (reason) {
      setError(String(reason))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!selected || status?.profile_id === selected.id) return
    setBusy(true)
    setError(null)
    try {
      await invoke('delete_profile', { id: selected.id })
      setSelectedId(null)
      setPreview(null)
      await reload()
    } catch (reason) {
      setError(String(reason))
    } finally {
      setBusy(false)
    }
  }

  async function showPreview() {
    if (!selected) return
    setError(null)
    try {
      setPreview(
        await invoke<LaunchCommand>('preview_profile', { profile: selected }),
      )
    } catch (reason) {
      setError(String(reason))
    }
  }

  return (
    <div className="page detail-page managed-page">
      <div className="eyebrow">
        <span className="eyebrow-line" /> LOCAL RUNTIME CONTROL
      </div>
      <div className="page-heading">
        <div>
          <h1>Dive</h1>
          <p>
            Choose a profile, inspect its launch plan, then start Cachalot on
            this Mac.
          </p>
        </div>
        <button
          className="secondary-button"
          type="button"
          disabled={!isTauri()}
          onClick={() => {
            setDraft(newProfile())
            setPreview(null)
          }}
        >
          New profile
        </button>
      </div>
      {!isTauri() && (
        <p className="inline-error">Managed runtime requires the macOS app.</p>
      )}
      {(error || managed.error) && (
        <p className="inline-error" role="alert">
          {error || managed.error}
        </p>
      )}
      <div className="managed-grid">
        <section className="info-panel managed-profiles">
          <span className="section-kicker">01 / SAVED PROFILES</span>
          <h2>Your launch setups</h2>
          {profiles.length === 0 && (
            <p className="panel-intro">
              No profiles yet. Create one to launch a local model.
            </p>
          )}
          <div className="managed-profile-list">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className={`managed-profile ${selectedId === profile.id ? 'is-selected' : ''}`}
                onClick={() => {
                  setSelectedId(profile.id)
                  setDraft(null)
                  setPreview(null)
                }}
              >
                <strong>{profile.name}</strong>
                <span>
                  {profile.family} · port {profile.port}
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="info-panel managed-details">
          <span className="section-kicker">02 / SELECTED PROFILE</span>
          {draft ? (
            <>
              <h2>
                {profiles.some((item) => item.id === draft.id)
                  ? 'Edit profile'
                  : 'New profile'}
              </h2>
              <form
                className="managed-form"
                onSubmit={(event) => void save(event)}
              >
                <label>
                  Profile name
                  <input
                    required
                    maxLength={80}
                    value={draft.name}
                    onChange={(event) => update({ name: event.target.value })}
                  />
                </label>
                <label>
                  Python executable
                  <input
                    required
                    value={draft.python_executable}
                    placeholder="/path/to/.venv/bin/python"
                    onChange={(event) =>
                      update({ python_executable: event.target.value })
                    }
                  />
                </label>
                <label>
                  Model directory
                  <input
                    required
                    value={draft.model_path}
                    placeholder="/path/to/model"
                    onChange={(event) =>
                      update({ model_path: event.target.value })
                    }
                  />
                </label>
                <div className="managed-fields">
                  <OptionalNumber
                    label="Local port"
                    value={draft.port}
                    min={1024}
                    max={65535}
                    onChange={(port) =>
                      update({ port: port ?? DEFAULT_RUNTIME_PORT })
                    }
                  />
                  <label>
                    Model family
                    <select
                      value={draft.family}
                      onChange={(event) =>
                        update({
                          family: event.target.value as LaunchProfile['family'],
                          tuning: newProfile().tuning,
                        })
                      }
                    >
                      <option value="auto">Auto detect</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="glm">GLM</option>
                      <option value="minimax">MiniMax</option>
                    </select>
                  </label>
                  <OptionalNumber
                    label="Expert budget (GiB)"
                    value={draft.expert_budget_gib}
                    min={0.1}
                    max={512}
                    step={0.1}
                    onChange={(expert_budget_gib) =>
                      update({ expert_budget_gib })
                    }
                  />
                  <OptionalNumber
                    label="Max sequence length"
                    value={draft.max_seq_len}
                    min={1}
                    max={1048576}
                    onChange={(max_seq_len) => update({ max_seq_len })}
                  />
                  <OptionalNumber
                    label="I/O workers"
                    value={draft.io_workers}
                    min={1}
                    max={64}
                    onChange={(io_workers) => update({ io_workers })}
                  />
                  <label>
                    Model ID · runtime default when empty
                    <input
                      value={draft.model_id ?? ''}
                      placeholder="minimax-m3"
                      onChange={(event) =>
                        update({ model_id: event.target.value || null })
                      }
                    />
                  </label>
                  <OptionalNumber
                    label="Default maximum output tokens · runtime default 1024"
                    value={draft.default_max_tokens ?? null}
                    min={1}
                    max={1048576}
                    onChange={(default_max_tokens) =>
                      update({ default_max_tokens })
                    }
                  />
                  <OptionalNumber
                    label="Default temperature · runtime default 0.6"
                    value={draft.default_temperature ?? null}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={(default_temperature) =>
                      update({ default_temperature })
                    }
                  />
                  <label>
                    Snapshot directory · optional
                    <input
                      value={draft.snapshot_dir ?? ''}
                      placeholder="/path/to/prefix-snapshots"
                      onChange={(event) =>
                        update({ snapshot_dir: event.target.value || null })
                      }
                    />
                  </label>
                </div>
                {(draft.family === 'glm' || draft.family === 'minimax') && (
                  <>
                    <h3>Runtime tuning</h3>
                    <div className="managed-fields">
                      <OptionalNumber
                        label="Loop guard repeats"
                        value={draft.tuning.loop_guard_repeats}
                        min={0}
                        max={50}
                        onChange={(loop_guard_repeats) =>
                          updateTuning({ loop_guard_repeats })
                        }
                      />
                      {draft.family === 'minimax' && (
                        <>
                          <TriState
                            label="Decode miss substitution"
                            value={
                              draft.tuning.minimax_decode_miss_substitution
                            }
                            onChange={(minimax_decode_miss_substitution) =>
                              updateTuning({ minimax_decode_miss_substitution })
                            }
                          />
                          <TriState
                            label="Prefill miss substitution"
                            value={
                              draft.tuning.minimax_prefill_miss_substitution
                            }
                            onChange={(minimax_prefill_miss_substitution) =>
                              updateTuning({
                                minimax_prefill_miss_substitution,
                              })
                            }
                          />
                          <OptionalNumber
                            label="Decode cache (GiB)"
                            value={draft.tuning.minimax_decode_cache_gib}
                            min={-1}
                            max={8}
                            step={0.1}
                            onChange={(minimax_decode_cache_gib) =>
                              updateTuning({ minimax_decode_cache_gib })
                            }
                          />
                          <TriState
                            label="Persisted block retention"
                            value={draft.tuning.minimax_spill_blocks}
                            onChange={(minimax_spill_blocks) =>
                              updateTuning({ minimax_spill_blocks })
                            }
                          />
                          <OptionalNumber
                            label="Host quiet before cache growth (s) · 0.44+ default 60"
                            value={draft.tuning.host_grow_quiet_s}
                            min={0}
                            max={3600}
                            onChange={(host_grow_quiet_s) =>
                              updateTuning({ host_grow_quiet_s })
                            }
                          />
                          <OptionalNumber
                            label="Host pressure shrink interval (s) · 0.44+ default 10"
                            value={draft.tuning.host_shrink_every_s}
                            min={0}
                            max={3600}
                            onChange={(host_shrink_every_s) =>
                              updateTuning({ host_shrink_every_s })
                            }
                          />
                          <TriState
                            label="Adaptive mirror share · 0.45+ default On"
                            value={draft.tuning.minimax_mirror_adapt}
                            onChange={(minimax_mirror_adapt) =>
                              updateTuning({ minimax_mirror_adapt })
                            }
                          />
                          <label>
                            Expert bank directory
                            <input
                              value={draft.tuning.minimax_bank_path ?? ''}
                              placeholder="/path/to/coded-bank"
                              onChange={(event) =>
                                updateTuning({
                                  minimax_bank_path: event.target.value || null,
                                })
                              }
                            />
                          </label>
                          <label>
                            Mirror bank directory
                            <input
                              value={draft.tuning.minimax_mirror_path ?? ''}
                              placeholder="/Volumes/drive/path/to/coded-bank"
                              onChange={(event) =>
                                updateTuning({
                                  minimax_mirror_path:
                                    event.target.value || null,
                                })
                              }
                            />
                          </label>
                          <OptionalNumber
                            label="Mirror read fraction · runtime default 0.10"
                            value={draft.tuning.minimax_mirror_fraction}
                            min={0}
                            max={0.9}
                            step={0.01}
                            onChange={(minimax_mirror_fraction) =>
                              updateTuning({ minimax_mirror_fraction })
                            }
                          />
                        </>
                      )}
                    </div>
                    {draft.family === 'minimax' && (
                      <>
                        <p className="panel-intro">
                          Miss substitution changes model output and disk
                          snapshot numerics. First request after switching may
                          re-prefill a long system block. Off selects exact
                          outputs on Cachalot 0.43 or newer.
                        </p>
                        <button
                          className="text-button"
                          type="button"
                          onClick={() =>
                            updateTuning({
                              minimax_decode_miss_substitution: false,
                              minimax_prefill_miss_substitution: false,
                            })
                          }
                        >
                          Set exact outputs
                        </button>
                      </>
                    )}
                  </>
                )}
                <div className="managed-actions">
                  <button className="primary-button" disabled={busy}>
                    Save profile
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setDraft(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          ) : selected ? (
            <>
              <h2>{selected.name}</h2>
              <p className="panel-intro">
                Studio manages only processes started here. Startup can take
                several minutes while model loads.
              </p>
              <div className="managed-facts">
                <div>
                  <span>State</span>
                  <strong>
                    {status?.profile_id === selected.id
                      ? status.ready
                        ? 'Ready'
                        : 'Starting'
                      : 'Not running'}
                  </strong>
                </div>
                <div>
                  <span>Python</span>
                  <strong>{selected.python_executable}</strong>
                </div>
                <div>
                  <span>Model</span>
                  <strong>{selected.model_path}</strong>
                </div>
                <div>
                  <span>Endpoint</span>
                  <strong>127.0.0.1:{selected.port}</strong>
                </div>
                {status?.profile_id === selected.id && (
                  <div>
                    <span>Process ID</span>
                    <strong>{status.pid}</strong>
                  </div>
                )}
              </div>
              <div className="managed-actions">
                {status?.running ? (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={managed.working}
                    onClick={() => void managed.stop()}
                  >
                    Stop runtime
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={managed.working || !isTauri()}
                    onClick={() => void managed.start(selected.id)}
                  >
                    Start runtime
                  </button>
                )}
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setDraft(structuredClone(selected))}
                >
                  Edit
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void showPreview()}
                >
                  Preview
                </button>
                <button
                  className="text-button"
                  type="button"
                  disabled={busy || status?.profile_id === selected.id}
                  onClick={() => void remove()}
                >
                  Delete
                </button>
              </div>
              {preview && (
                <pre className="managed-preview">
                  <code>
                    {JSON.stringify(
                      [preview.executable, ...preview.args],
                      null,
                      2,
                    )}
                    \n
                    {Object.entries(preview.environment)
                      .map(([key, value]) => `${key}=${value}`)
                      .join('\n')}
                  </code>
                </pre>
              )}
              {runtime.snapshot.endpoint === status?.endpoint &&
                status?.ready && (
                  <p className="panel-intro">
                    Studio connected to this managed runtime.
                  </p>
                )}
            </>
          ) : (
            <p className="panel-intro">Select or create a profile.</p>
          )}
        </section>
      </div>
      <ManagedLog compact />
    </div>
  )
}

export function ManagedLog({ compact = false }: { compact?: boolean }) {
  const [log, setLog] = useState('')
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    if (!isTauri()) return
    try {
      setLog(await invoke<string>('read_managed_log'))
    } catch (reason) {
      setError(String(reason))
    }
  }, [])
  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 2000)
    return () => window.clearInterval(timer)
  }, [refresh])
  return (
    <section className="info-panel managed-log-panel">
      <span className="section-kicker">MANAGED RUNTIME LOG</span>
      <h2>{compact ? 'Recent output' : 'Logs'}</h2>
      <p className="panel-intro">
        Local launch output. Latest 64 KiB shown; a new launch starts a new log.
      </p>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <pre className={`managed-log ${compact ? 'is-compact' : ''}`}>
        <code>{log || 'No managed runtime output yet.'}</code>
      </pre>
    </section>
  )
}

export function LogsScreen() {
  return (
    <div className="page detail-page managed-page">
      <div className="eyebrow">
        <span className="eyebrow-line" /> SYSTEM / LOGS
      </div>
      <div className="page-heading">
        <div>
          <h1>Logs</h1>
          <p>Inspect output from the runtime Studio started.</p>
        </div>
      </div>
      <ManagedLog />
    </div>
  )
}
