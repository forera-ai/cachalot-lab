import { invoke, isTauri } from '@tauri-apps/api/core'
import { useCallback, useEffect, useState } from 'react'

export const DEFAULT_RUNTIME_PORT = 8011
export const DEFAULT_ENDPOINT = `http://127.0.0.1:${DEFAULT_RUNTIME_PORT}`

export type RuntimeSnapshot = {
  connected: boolean
  healthy: boolean
  busy: boolean
  endpoint: string | null
  model_id: string | null
  stats: Record<string, unknown> | null
  error: string | null
}

export type RuntimeConnection = {
  snapshot: RuntimeSnapshot
  history: RuntimePoint[]
  connecting: boolean
  connectError: string | null
  connect: (
    endpoint: string,
    apiKey?: string,
    remember?: boolean,
    useKeychain?: boolean,
  ) => Promise<boolean>
  disconnect: () => Promise<void>
  refresh: () => Promise<void>
}

export type RuntimePoint = {
  at: number
  endpoint: string | null
  decode_tps: number | null
  expert_hit_rate: number | null
  ssd_gbps: number | null
  requests_served: number | null
  tokens_generated: number | null
  queued_requests: number | null
  resident_experts: number | null
}

export function appendRuntimePoint(
  history: RuntimePoint[],
  snapshot: RuntimeSnapshot,
  at: number,
): RuntimePoint[] {
  if (!snapshot.connected) return []
  const current = history.at(-1)?.endpoint === snapshot.endpoint ? history : []
  const point: RuntimePoint = {
    at,
    endpoint: snapshot.endpoint,
    decode_tps: runtimeNumber(snapshot.stats, 'decode_tps'),
    expert_hit_rate: runtimeNumber(snapshot.stats, 'expert_hit_rate'),
    ssd_gbps: runtimeNumber(snapshot.stats, 'ssd_gbps'),
    requests_served: runtimeNumber(snapshot.stats, 'requests_served'),
    tokens_generated: runtimeNumber(snapshot.stats, 'tokens_generated'),
    queued_requests: runtimeNumber(snapshot.stats, 'queued_requests'),
    resident_experts: runtimeNumber(snapshot.stats, 'resident_experts'),
  }
  return [...current.filter((sample) => sample.at >= at - 120_000), point]
}

const disconnected: RuntimeSnapshot = {
  connected: false,
  healthy: false,
  busy: false,
  endpoint: null,
  model_id: null,
  stats: null,
  error: null,
}

export function useRuntime(): RuntimeConnection {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>(disconnected)
  const [history, setHistory] = useState<RuntimePoint[]>([])
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isTauri()) return
    try {
      const next = await invoke<RuntimeSnapshot>('poll_runtime')
      setSnapshot(next)
      setHistory((previous) => appendRuntimePoint(previous, next, Date.now()))
    } catch (error) {
      setConnectError(String(error))
    }
  }, [])

  const connect = useCallback(
    async (
      endpoint: string,
      apiKey?: string,
      remember = true,
      useKeychain = false,
    ) => {
      if (!isTauri()) {
        setConnectError('Open the macOS app to connect to a local runtime.')
        return false
      }
      setConnecting(true)
      setConnectError(null)
      try {
        await invoke('connect_runtime', {
          endpointUrl: endpoint,
          apiKey: apiKey || null,
          useKeychain,
        })
        if (remember)
          localStorage.setItem('cachalot-runtime-endpoint', endpoint)
        const next = await invoke<RuntimeSnapshot>('poll_runtime')
        setSnapshot(next)
        setHistory((previous) => appendRuntimePoint(previous, next, Date.now()))
        return true
      } catch (error) {
        setConnectError(String(error))
        return false
      } finally {
        setConnecting(false)
      }
    },
    [],
  )

  const disconnect = useCallback(async () => {
    if (!isTauri()) return
    await invoke('disconnect_runtime')
    setSnapshot(disconnected)
    setHistory([])
    setConnectError(null)
  }, [])

  useEffect(() => {
    if (!isTauri()) return
    let active = true
    let timer: number | undefined

    function schedule(delay = document.hidden ? 5000 : 1000) {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void poll(), delay)
    }

    async function poll() {
      timer = undefined
      await refresh()
      if (active) schedule()
    }

    function onVisibilityChange() {
      if (timer !== undefined) schedule(document.hidden ? 5000 : 0)
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    void connect(
      localStorage.getItem('cachalot-runtime-endpoint') || DEFAULT_ENDPOINT,
      undefined,
      true,
      true,
    ).finally(() => {
      if (active) schedule()
    })
    return () => {
      active = false
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [connect, refresh])

  return {
    snapshot,
    history,
    connecting,
    connectError,
    connect,
    disconnect,
    refresh,
  }
}

export function runtimeNumber(
  stats: Record<string, unknown> | null,
  key: string,
): number | null {
  const value = stats?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
