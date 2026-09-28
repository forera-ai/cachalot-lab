import { invoke, isTauri } from '@tauri-apps/api/core'
import { useCallback, useEffect, useState } from 'react'

export const DEFAULT_ENDPOINT = 'http://127.0.0.1:8011'

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
  connecting: boolean
  connectError: string | null
  connect: (endpoint: string, apiKey?: string) => Promise<void>
  disconnect: () => Promise<void>
  refresh: () => Promise<void>
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
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isTauri()) return
    try {
      setSnapshot(await invoke<RuntimeSnapshot>('poll_runtime'))
    } catch (error) {
      setConnectError(String(error))
    }
  }, [])

  const connect = useCallback(async (endpoint: string, apiKey?: string) => {
    if (!isTauri()) {
      setConnectError('Open the macOS app to connect to a local runtime.')
      return
    }
    setConnecting(true)
    setConnectError(null)
    try {
      await invoke('connect_runtime', {
        endpointUrl: endpoint,
        apiKey: apiKey || null,
      })
      localStorage.setItem('cachalot-runtime-endpoint', endpoint)
      setSnapshot(await invoke<RuntimeSnapshot>('poll_runtime'))
    } catch (error) {
      setConnectError(String(error))
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (!isTauri()) return
    await invoke('disconnect_runtime')
    setSnapshot(disconnected)
    setConnectError(null)
  }, [])

  useEffect(() => {
    if (!isTauri()) return
    void connect(
      localStorage.getItem('cachalot-runtime-endpoint') || DEFAULT_ENDPOINT,
    )
    const interval = window.setInterval(() => void refresh(), 3000)
    return () => window.clearInterval(interval)
  }, [connect, refresh])

  return { snapshot, connecting, connectError, connect, disconnect, refresh }
}

export function runtimeNumber(
  stats: Record<string, unknown> | null,
  key: string,
): number | null {
  const value = stats?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
