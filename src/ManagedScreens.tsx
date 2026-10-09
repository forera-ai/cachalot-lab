import { invoke, isTauri } from '@tauri-apps/api/core'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import {
  newProfile,
  type LaunchProfile,
  type ManagedRuntime,
  type RuntimeTuning,
} from './managed'
import { Eye, Pencil, Play, Plus, Square, Trash2 } from 'lucide-react'

import { ModelDiscovery } from './ModelDiscovery'
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
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [previewBusy, setPreviewBusy] = useState(false)
  const previewRequest = useRef(0)
  const selected = profiles.find((profile) => profile.id === selectedId) ?? null
  const status = managed.status
  const ownsSelected = status?.running && status.profile_id === selected?.id
  const otherRunning = status?.running && !ownsSelected
  function clearPreview() {
    ++previewRequest.current
    setPreview(null)
    setPreviewBusy(false)
    setDeleteId(null)
  }

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
    if (
      !selected ||
      deleteId !== selected.id ||
      status?.profile_id === selected.id
    )
      return
    setBusy(true)
    setError(null)
    try {
      await invoke('delete_profile', { id: selected.id })
      setSelectedId(null)
      clearPreview()
      await reload()
    } catch (reason) {
      setError(String(reason))
    } finally {
      setBusy(false)
    }
  }

  async function showPreview() {
    if (!selected) return
    if (preview) {
      clearPreview()
      return
    }
    const request = ++previewRequest.current
    setPreviewBusy(true)
    setError(null)
    try {
      const command = await invoke<LaunchCommand>('preview_profile', {
        profile: selected,
      })
      if (request === previewRequest.current) setPreview(command)
    } catch (reason) {
      if (request === previewRequest.current) setError(String(reason))
    } finally {
      if (request === previewRequest.current) setPreviewBusy(false)
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
          disabled={busy || !isTauri()}
          onClick={() => {
            setDraft(newProfile())
            clearPreview()
          }}
        >
          <Plus size={15} aria-hidden="true" /> New profile
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
        <aside className="managed-sidebar" aria-label="Profiles and discovery">
          <section className="info-panel managed-profiles">
            <span className="section-kicker">01 / SAVED PROFILES</span>
            <h2>Your launch setups</h2>
            <p className="panel-intro">Saved configurations for this Mac.</p>
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
                  aria-pressed={selectedId === profile.id}
                  disabled={busy}
                  onClick={() => {
                    setSelectedId(profile.id)
                    setDraft(null)
                    clearPreview()
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
          {!draft && (
            <details className="discovery-disclosure">
              <summary>Find a model folder</summary>
              <ModelDiscovery
                onDraft={(profile) => {
                  clearPreview()
                  setDraft(profile)
                }}
              />
            </details>
          )}
        </aside>
        <section
          className="info-panel managed-details"
          aria-label="Profile details"
        >
          <span className="section-kicker">02 / SELECTED PROFILE</span>
          {draft ? (
            <>
              <h2>
                {profiles.some((item) => item.id === draft.id)
                  ? 'Edit profile'
                  : 'New profile'}
              </h2>
              <p className="panel-intro">
                Set the model and Python environment, then review launch
                settings. Changes apply on the next launch.
              </p>
              <form
                className="managed-form profile-editor"
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
                <h3 className="managed-form-heading">Launch settings</h3>
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
                          default_temperature:
                            event.target.value === 'minimax' &&
                            draft.default_temperature === null
                              ? 0.7
                              : draft.default_temperature,
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
                </div>
                <details className="profile-options">
                  <summary>Response and snapshot defaults</summary>
                  <div className="managed-fields">
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
                      label={
                        draft.family === 'minimax'
                          ? 'Default temperature · MiniMax script 0.7; empty uses CLI 0.6'
                          : 'Default temperature · empty uses CLI 0.6'
                      }
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
                </details>
                {draft.family !== 'auto' && (
                  <details className="profile-options" key={draft.family}>
                    <summary>
                      Runtime tuning <span>Family controls · next launch</span>
                    </summary>
                    {draft.family === 'deepseek' && (
                      <>
                        <div className="managed-fields">
                          <TriState
                            label="Decode drops misses · Cachalot 0.57+ · CLI default Off"
                            value={
                              draft.tuning.deepseek_decode_drop_misses ?? null
                            }
                            onChange={(deepseek_decode_drop_misses) =>
                              updateTuning({ deepseek_decode_drop_misses })
                            }
                          />
                          <TriState
                            label="System date reuse · Cachalot 0.60+ · default On"
                            value={
                              draft.tuning.deepseek_system_date_reuse ?? null
                            }
                            onChange={(deepseek_system_date_reuse) =>
                              updateTuning({ deepseek_system_date_reuse })
                            }
                          />
                        </div>
                        <p className="panel-intro">
                          Decode drops misses is faster but changes outputs and
                          can lower quality. On drops every non-resident decode
                          expert; Off selects exact decode. Cachalot 0.60
                          serve.sh defaults to On; Lab launches the CLI
                          directly, which defaults to Off. Runtime default
                          preserves that CLI behavior.
                        </p>
                        <p className="panel-intro">
                          System date reuse can avoid refilling a saved system
                          block on a new day. The model can see a date up to 7
                          days old in the leading system message. Off keeps the
                          true date. A snapshot directory retains date reuse
                          across restarts. Older runtimes ignore unsupported
                          controls. Changes apply on the next launch.
                        </p>
                      </>
                    )}
                    {(draft.family === 'glm' || draft.family === 'minimax') && (
                      <>
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
                          <OptionalNumber
                            label="Incrementing-list guard · Cachalot 0.46+ · default 64; 0 off; 2–4096"
                            value={draft.tuning.loop_guard_incrementing}
                            min={0}
                            max={4096}
                            onChange={(loop_guard_incrementing) =>
                              updateTuning({ loop_guard_incrementing })
                            }
                          />
                          {draft.family === 'glm' && (
                            <>
                              <label>
                                GLM expert bank directory · optional · Cachalot
                                0.49+
                                <input
                                  value={draft.tuning.glm_bank_path ?? ''}
                                  placeholder="/path/to/glm-bank"
                                  onChange={(event) =>
                                    updateTuning({
                                      glm_bank_path: event.target.value || null,
                                    })
                                  }
                                />
                              </label>
                              <TriState
                                label="GLM expert bank · 0.49+ default On when a bank is set"
                                value={draft.tuning.glm_bank_enabled ?? null}
                                onChange={(glm_bank_enabled) =>
                                  updateTuning({ glm_bank_enabled })
                                }
                              />
                              <OptionalNumber
                                label="GLM decode miss budget · 0.62.14+; -1 off"
                                value={
                                  draft.tuning.glm_decode_miss_budget ?? null
                                }
                                min={-1}
                                max={288}
                                onChange={(glm_decode_miss_budget) =>
                                  updateTuning({ glm_decode_miss_budget })
                                }
                              />
                              <p className="panel-intro">
                                Decode miss budget changes outputs and may lower
                                quality. Nonnegative values cap non-resident
                                expert reads per layer; 0 drops all misses.
                                Empty or -1 disables this budget. Prefill is
                                unchanged. Next launch only; older runtimes
                                ignore this control.
                              </p>
                              <OptionalNumber
                                label="GLM prefetch experts · CLI default 5; 0 off"
                                value={draft.tuning.glm_predict_topk ?? null}
                                min={0}
                                max={288}
                                onChange={(glm_predict_topk) =>
                                  updateTuning({ glm_predict_topk })
                                }
                              />
                              <OptionalNumber
                                label="GLM prefetch read limit · 0.50+ default 0 (all predicted)"
                                value={draft.tuning.glm_predict_limit ?? null}
                                min={0}
                                max={288}
                                onChange={(glm_predict_limit) =>
                                  updateTuning({ glm_predict_limit })
                                }
                              />
                              <label>
                                GLM prefetch scheduling · Cachalot 0.50+
                                <select
                                  value={
                                    draft.tuning.glm_predict_after_demand ??
                                    'inherit'
                                  }
                                  onChange={(event) =>
                                    updateTuning({
                                      glm_predict_after_demand: optionalNumber(
                                        event.target.value === 'inherit'
                                          ? ''
                                          : event.target.value,
                                      ),
                                    })
                                  }
                                >
                                  <option value="inherit">
                                    Runtime default (after demand)
                                  </option>
                                  <option value="1">After demand reads</option>
                                  <option value="0">
                                    Alongside demand reads
                                  </option>
                                  <option value="-1">
                                    Follow store policy
                                  </option>
                                </select>
                              </label>
                            </>
                          )}
                          {draft.family === 'minimax' && (
                            <>
                              <TriState
                                label="Decode miss substitution"
                                value={
                                  draft.tuning.minimax_decode_miss_substitution
                                }
                                onChange={(minimax_decode_miss_substitution) =>
                                  updateTuning({
                                    minimax_decode_miss_substitution,
                                  })
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
                                      minimax_bank_path:
                                        event.target.value || null,
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
                        {draft.family === 'glm' && (
                          <p className="panel-intro">
                            Optional GLM overrides apply on the next launch.
                            Empty fields use runtime defaults; older runtimes
                            ignore these controls. A bank needs bank.json; Off
                            retains its saved path but uses checkpoint experts.
                            Bank reads and prefetch preserve model outputs. Lab
                            uses the direct CLI: empty prefetch remains 5;
                            serve-glm.sh defaults to 0 since 0.62.14. Empty
                            decode budget stays off in Lab; serve-glm.sh
                            defaults to 2 since 0.62.20 and changes outputs. Its
                            automatic bank selection is not applied here.
                          </p>
                        )}
                        {draft.family === 'minimax' && (
                          <>
                            <p className="panel-intro">
                              Miss substitution changes model output and disk
                              snapshot numerics. First request after switching
                              may re-prefill a long system block. Off selects
                              exact outputs on Cachalot 0.43 or newer.
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
                  </details>
                )}
                {draft.family === 'glm' &&
                  draft.tuning.glm_decode_miss_budget != null &&
                  draft.tuning.glm_decode_miss_budget >= 0 && (
                    <p className="managed-notice">
                      Decode budget {draft.tuning.glm_decode_miss_budget}:
                      outputs change on the next launch; active server mode is
                      unreported.
                    </p>
                  )}
                <div className="managed-actions">
                  <button className="primary-button" disabled={busy}>
                    Save profile
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={busy}
                    onClick={() => setDraft(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          ) : selected ? (
            <>
              <div className="managed-detail-heading">
                <h2>{selected.name}</h2>
                <span
                  className={`managed-state ${ownsSelected ? 'is-active' : ''}`}
                >
                  {ownsSelected
                    ? status?.ready
                      ? 'Ready'
                      : 'Starting'
                    : 'Not running'}
                </span>
              </div>
              <p className="panel-intro">
                Lab manages only processes started here. Startup can take
                several minutes while model loads.
              </p>
              <div className="managed-facts">
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
              {selected.family === 'glm' &&
                selected.tuning.glm_decode_miss_budget != null &&
                selected.tuning.glm_decode_miss_budget >= 0 && (
                  <p className="panel-intro">
                    GLM decode budget {selected.tuning.glm_decode_miss_budget} ·
                    output-changing next-launch setting; active server mode is
                    unreported.
                  </p>
                )}
              <div className="managed-actions">
                {ownsSelected ? (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={managed.working || busy}
                    onClick={() => void managed.stop()}
                  >
                    <Square size={14} aria-hidden="true" /> Stop runtime
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={
                      managed.working || busy || !!otherRunning || !isTauri()
                    }
                    onClick={() => void managed.start(selected.id)}
                  >
                    <Play size={14} aria-hidden="true" /> Start runtime
                  </button>
                )}
                <button
                  className="secondary-button"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    clearPreview()
                    setDraft(structuredClone(selected))
                  }}
                >
                  <Pencil size={14} aria-hidden="true" /> Edit
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  aria-expanded={!!preview}
                  aria-controls="launch-preview"
                  disabled={previewBusy || busy}
                  onClick={() => void showPreview()}
                >
                  <Eye size={14} aria-hidden="true" />{' '}
                  {previewBusy
                    ? 'Loading…'
                    : preview
                      ? 'Hide preview'
                      : 'Preview'}
                </button>
                <button
                  className="secondary-button managed-delete"
                  type="button"
                  disabled={busy || status?.profile_id === selected.id}
                  aria-expanded={deleteId === selected.id}
                  aria-controls="delete-profile-confirmation"
                  onClick={() => setDeleteId(selected.id)}
                >
                  <Trash2 size={14} aria-hidden="true" /> Delete profile
                </button>
              </div>
              {otherRunning && (
                <p className="managed-notice">
                  Another profile is running. Select it to stop the runtime
                  before starting this profile.
                </p>
              )}
              {deleteId === selected.id && (
                <div
                  id="delete-profile-confirmation"
                  className="managed-delete-confirmation"
                  role="group"
                  aria-label="Delete profile confirmation"
                >
                  <div>
                    <strong>Delete “{selected.name}”?</strong>
                    <p>
                      Only the saved launch profile is removed. Model files and
                      conversations stay on your Mac.
                    </p>
                  </div>
                  <div className="managed-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={busy}
                      onClick={() => setDeleteId(null)}
                    >
                      Keep profile
                    </button>
                    <button
                      type="button"
                      className="secondary-button managed-delete"
                      disabled={busy}
                      onClick={() => void remove()}
                    >
                      {busy ? 'Deleting…' : 'Confirm delete'}
                    </button>
                  </div>
                </div>
              )}
              {preview && (
                <section
                  id="launch-preview"
                  className="managed-preview-panel"
                  aria-label="Launch preview"
                >
                  <div className="managed-preview-heading">
                    <h3>Launch preview</h3>
                    <span>{preview.endpoint}</span>
                  </div>
                  <p className="panel-intro">
                    Review the exact executable, arguments, and environment
                    before starting.
                  </p>
                  <h4>Executable</h4>
                  <pre className="managed-preview">
                    <code>{preview.executable}</code>
                  </pre>
                  <h4>Arguments</h4>
                  <pre className="managed-preview">
                    <code>
                      {preview.args
                        .map((arg) => JSON.stringify(arg))
                        .join('\n')}
                    </code>
                  </pre>
                  <h4>Environment overrides</h4>
                  {Object.keys(preview.environment).length ? (
                    <pre className="managed-preview">
                      <code>
                        {Object.entries(preview.environment)
                          .map(([key, value]) => `${key}=${value}`)
                          .join('\n')}
                      </code>
                    </pre>
                  ) : (
                    <p className="panel-intro">No explicit overrides.</p>
                  )}
                </section>
              )}
              {runtime.snapshot.endpoint === status?.endpoint &&
                status?.ready && (
                  <p className="panel-intro">
                    Lab connected to this managed runtime.
                  </p>
                )}
            </>
          ) : (
            <p className="panel-intro">Select or create a profile.</p>
          )}
        </section>
      </div>
      <details className="managed-log-disclosure">
        <summary>
          Runtime output <span>Recent output from Lab-owned launches</span>
        </summary>
        <ManagedLog compact />
      </details>
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
      <pre
        className={`managed-log ${compact ? 'is-compact' : ''}`}
        tabIndex={0}
        aria-label="Managed runtime output"
      >
        <code>{log || 'No managed runtime output yet.'}</code>
      </pre>
    </section>
  )
}

export function LogsScreen() {
  return (
    <div className="page detail-page managed-page logs-page">
      <div className="eyebrow">
        <span className="eyebrow-line" /> SYSTEM / LOGS
      </div>
      <div className="page-heading">
        <div>
          <h1>Logs</h1>
          <p>Inspect output from the runtime Lab started.</p>
        </div>
      </div>
      <ManagedLog />
    </div>
  )
}
