export type LoggedFailure = {
  line: number
  type: string
  message: string
  traceback: string | null
}

export type PrefillLayer = {
  line: number
  layer: number
  rows: number
  routed: number
  ahead: string
  aheadCount: number
  waitMs: number
}

// Individual store waits only. Repeated row counts do not identify chunks or
// requests; neither sums nor latency attribution can be recovered from these logs.
export function parsePrefillLayers(log: string): PrefillLayer[] {
  const lines = log.split('\n')
  lines.pop()
  const observations: PrefillLayer[] = []
  lines.forEach((line, index) => {
    const match =
      /^\[prefill-layer\] layer=(\d+) rows=(\d+) routed=(\d+) ahead=(none|whole|pred|given):(\d+) wait_ms=(\d+(?:\.\d+)?)\r?$/.exec(
        line,
      )
    if (!match) return
    const [, layer, rows, routed, ahead, count, wait] = match
    const values = [layer, rows, routed, count, wait].map(Number)
    if (!values.every(Number.isFinite) || !ahead) return
    observations.push({
      line: index + 1,
      layer: Number(layer),
      rows: Number(rows),
      routed: Number(routed),
      ahead,
      aheadCount: Number(count),
      waitMs: Number(wait),
    })
  })
  return observations.slice(-100)
}

// Input is the native reader's latest 64 KiB, not a request history. Only
// newline-terminated, explicit runtime markers establish a logged failure.
export function parseLoggedFailures(log: string): LoggedFailure[] {
  const lines = log.split('\n')
  lines.pop() // Last fragment may be an incomplete write.
  const complete = lines.map((line) => line.replace(/\r$/, ''))
  const failures: LoggedFailure[] = []
  for (let index = 0; index < complete.length; index++) {
    const current = complete[index]
    if (current === undefined) continue
    const match = /^\[request failed\] ([A-Za-z_][\w.]*): ?(.*)$/.exec(current)
    if (!match) continue
    const [, type, message] = match
    if (type === undefined || message === undefined) continue
    const trace: string[] = []
    let next = index + 1
    const header = complete[next]
    if (header === 'Traceback (most recent call last):') {
      trace.push(header)
      next++
      // Python's header and final exception summary are non-indented. Keep
      // those explicitly, but never consume the next unrelated log event.
      while (next < complete.length) {
        const line = complete[next]
        if (line === undefined) break
        if (line === '' || /^\s/.test(line)) {
          trace.push(line)
          next++
        } else if (line.startsWith(`${type}:`)) {
          trace.push(line)
          break
        } else {
          break
        }
      }
    }
    failures.push({
      line: index + 1,
      type,
      message,
      traceback: trace.length ? trace.join('\n') : null,
    })
  }
  return failures
}
