import { invoke, isTauri } from '@tauri-apps/api/core'
import { useCallback, useEffect, useRef, useState } from 'react'

import { DEFAULT_RUNTIME_PORT, type RuntimeConnection } from './runtime'

export type RuntimeTuning = {
  minimax_decode_miss_substitution: boolean | null
  minimax_prefill_miss_substitution: boolean | null
  loop_guard_repeats: number | null
  loop_guard_incrementing: number | null
  minimax_decode_cache_gib: number | null
  minimax_spill_blocks: boolean | null
  host_grow_quiet_s: number | null
  host_shrink_every_s: number | null
  minimax_mirror_adapt: boolean | null
  minimax_bank_path: string | null
  minimax_mirror_path: string | null
  minimax_mirror_fraction: number | null
}

export type LaunchProfile = {
  id: string
  name: string
  python_executable: string
  model_path: string
  port: number
  family: 'auto' | 'deepseek' | 'glm' | 'minimax'
  expert_budget_gib: number | null
  max_seq_len: number | null
  io_workers: number | null
  model_id: string | null
  default_max_tokens: number | null
  default_temperature: number | null
  snapshot_dir: string | null
  tuning: RuntimeTuning
}

export type ManagedStatus = {
  running: boolean
  ready: boolean
  profile_id: string | null
  endpoint: string | null
  pid: number | null
  last_exit_code: number | null
}

export function newProfile(): LaunchProfile {
  return {
    id: crypto.randomUUID(),
    name: '',
    python_executable: '',
    model_path: '',
    port: DEFAULT_RUNTIME_PORT,
    family: 'auto',
    expert_budget_gib: null,
    max_seq_len: null,
    io_workers: null,
    model_id: null,
    default_max_tokens: null,
    default_temperature: null,
    snapshot_dir: null,
    tuning: {
      minimax_decode_miss_substitution: null,
      minimax_prefill_miss_substitution: null,
      loop_guard_repeats: null,
      loop_guard_incrementing: null,
      minimax_decode_cache_gib: null,
      minimax_spill_blocks: null,
      host_grow_quiet_s: null,
      host_shrink_every_s: null,
      minimax_mirror_adapt: null,
      minimax_bank_path: null,
      minimax_mirror_path: null,
      minimax_mirror_fraction: null,
    },
  }
}

export function useManagedRuntime(runtime: RuntimeConnection) {
  const [status, setStatus] = useState<ManagedStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const connectedPid = useRef<number | null>(null)
  const attemptingPid = useRef<number | null>(null)
  const lastAttemptedStatus = useRef<ManagedStatus | null>(null)
  const previousStatus = useRef<ManagedStatus | null>(null)
  const { connect, connecting, disconnect, snapshot } = runtime

  const refresh = useCallback(async () => {
    if (!isTauri()) return
    try {
      setStatus(await invoke<ManagedStatus>('managed_runtime_status'))
    } catch (reason) {
      setError(String(reason))
    }
  }, [])

  useEffect(() => {
    if (!isTauri()) return
    let active = true
    let timer: number | undefined
    async function poll() {
      await refresh()
      if (active) timer = window.setTimeout(() => void poll(), 2000)
    }
    void poll()
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [refresh])

  useEffect(() => {
    if (
      !status?.ready ||
      !status.endpoint ||
      !status.pid ||
      connecting ||
      connectedPid.current === status.pid ||
      attemptingPid.current === status.pid ||
      lastAttemptedStatus.current === status ||
      (snapshot.healthy && snapshot.endpoint === status.endpoint)
    )
      return
    const pid = status.pid
    lastAttemptedStatus.current = status
    attemptingPid.current = pid
    void connect(status.endpoint, undefined, false).then((connected) => {
      if (connected) connectedPid.current = pid
      attemptingPid.current = null
    })
  }, [connect, connecting, snapshot.endpoint, snapshot.healthy, status])

  useEffect(() => {
    const previous = previousStatus.current
    if (
      previous?.running &&
      !status?.running &&
      connectedPid.current === previous.pid &&
      snapshot.endpoint === previous.endpoint
    ) {
      connectedPid.current = null
      void disconnect()
    }
    previousStatus.current = status
  }, [disconnect, snapshot.endpoint, status])

  const start = useCallback(async (id: string) => {
    setWorking(true)
    setError(null)
    try {
      setStatus(await invoke<ManagedStatus>('start_managed_runtime', { id }))
    } catch (reason) {
      setError(String(reason))
    } finally {
      setWorking(false)
    }
  }, [])

  const stop = useCallback(async () => {
    setWorking(true)
    setError(null)
    try {
      const stopped = await invoke<ManagedStatus>('stop_managed_runtime')
      if (status?.endpoint && snapshot.endpoint === status.endpoint) {
        await disconnect()
      }
      connectedPid.current = null
      setStatus(stopped)
    } catch (reason) {
      setError(String(reason))
    } finally {
      setWorking(false)
    }
  }, [disconnect, snapshot.endpoint, status?.endpoint])

  return { status, error, working, refresh, start, stop }
}

export type ManagedRuntime = ReturnType<typeof useManagedRuntime>
