import { invoke, isTauri } from '@tauri-apps/api/core'
import { useEffect, useRef, useState } from 'react'

export type DiskSample = {
  id: string
  name: string
  bsd_name: string
  read_bytes: string
  write_bytes: string
}

export type DiskPoint = Pick<DiskSample, 'id' | 'name' | 'bsd_name'> & {
  read_mbps: number | null
  write_mbps: number | null
}

export function diskRates(
  previous: DiskSample[] | null,
  current: DiskSample[] | null,
  elapsedMs: number,
): DiskPoint[] | null {
  if (!current) return null
  return current.map((disk) => {
    const before = previous?.find(
      (item) => item.id === disk.id && item.bsd_name === disk.bsd_name,
    )
    const rate = (key: 'read_bytes' | 'write_bytes') => {
      if (
        !before ||
        !Number.isFinite(elapsedMs) ||
        elapsedMs <= 0 ||
        elapsedMs > 15000
      )
        return null
      if (!/^\d{1,20}$/.test(disk[key]) || !/^\d{1,20}$/.test(before[key]))
        return null
      const delta = BigInt(disk[key]) - BigInt(before[key])
      return delta < 0n ? null : Number(delta) / (elapsedMs * 1000)
    }
    return {
      id: disk.id,
      name: disk.name,
      bsd_name: disk.bsd_name,
      read_mbps: rate('read_bytes'),
      write_mbps: rate('write_bytes'),
    }
  })
}

export type HostSample = {
  cpu_ticks: [number, number, number, number]
  gpu_percent: number | null
  memory_working_gib: number
  disks?: DiskSample[] | null
}

export type HostPoint = {
  at: number
  cpu_percent: number | null
  gpu_percent: number | null
  memory_working_gib: number
  disks?: DiskPoint[] | null
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
    previousTicks.current = null
    let previousDisks: DiskSample[] | null = null
    let previousAt = 0
    let live = true
    let timer: number | undefined

    async function sample() {
      try {
        const next = await invoke<HostSample>('host_sample')
        if (!live) return
        const monotonicAt = performance.now()
        const point: HostPoint = {
          at: Date.now(),
          cpu_percent: cpuPercent(previousTicks.current, next.cpu_ticks),
          gpu_percent: next.gpu_percent,
          memory_working_gib: next.memory_working_gib,
          disks: diskRates(
            previousDisks,
            next.disks ?? null,
            monotonicAt - previousAt,
          ),
        }
        previousDisks = next.disks ?? null
        previousAt = monotonicAt
        previousTicks.current = next.cpu_ticks
        setHistory((points) => [
          ...points.filter((item) => item.at >= point.at - 120_000),
          point,
        ])
        setError(null)
      } catch (cause) {
        previousDisks = null
        previousTicks.current = null
        if (live) {
          setHistory([])
          setError(String(cause))
        }
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
