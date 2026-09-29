import { invoke, isTauri } from '@tauri-apps/api/core'
import { useEffect, useRef, useState } from 'react'

export type HostSample = {
  cpu_ticks: [number, number, number, number]
  gpu_percent: number | null
  memory_working_gib: number
}

export type HostPoint = {
  at: number
  cpu_percent: number | null
  gpu_percent: number | null
  memory_working_gib: number
}

function tickDelta(current: number, previous: number) {
  return current >= previous ? current - previous : current + 2 ** 32 - previous
}

export function cpuPercent(
  previous: HostSample['cpu_ticks'] | null,
  current: HostSample['cpu_ticks'],
): number | null {
  if (!previous) return null
  const changes = current.map((value, index) =>
    tickDelta(value, previous[index] ?? value),
  )
  const total = changes.reduce((sum, value) => sum + value, 0)
  return total > 0
    ? Math.max(0, Math.min(100, ((total - (changes[2] ?? 0)) / total) * 100))
    : null
}

export function useHostTelemetry(active: boolean) {
  const [history, setHistory] = useState<HostPoint[]>([])
  const [error, setError] = useState<string | null>(null)
  const previousTicks = useRef<HostSample['cpu_ticks'] | null>(null)

  useEffect(() => {
    if (!active || !isTauri()) return
    let live = true
    let timer: number | undefined

    async function sample() {
      try {
        const next = await invoke<HostSample>('host_sample')
        if (!live) return
        const point: HostPoint = {
          at: Date.now(),
          cpu_percent: cpuPercent(previousTicks.current, next.cpu_ticks),
          gpu_percent: next.gpu_percent,
          memory_working_gib: next.memory_working_gib,
        }
        previousTicks.current = next.cpu_ticks
        setHistory((points) => [
          ...points.filter((item) => item.at >= point.at - 120_000),
          point,
        ])
        setError(null)
      } catch (cause) {
        if (live) setError(String(cause))
      } finally {
        if (live)
          timer = window.setTimeout(sample, document.hidden ? 5000 : 2000)
      }
    }

    void sample()
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [active])

  return { history, error }
}
