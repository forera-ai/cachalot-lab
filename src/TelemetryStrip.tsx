import { ArrowUpRight } from 'lucide-react'

import { runtimeNumber, type RuntimeSnapshot } from './runtime'

function Reading({
  label,
  value,
  unit,
  source,
}: {
  label: string
  value: string
  unit: string
  source: string
}) {
  return (
    <div className="telemetry-reading" title={source}>
      <span>{label}</span>
      <strong>
        {value} <small>{unit}</small>
      </strong>
    </div>
  )
}

export function TelemetryStrip({
  snapshot,
  openCockpit,
}: {
  snapshot: RuntimeSnapshot
  openCockpit: () => void
}) {
  if (!snapshot.connected) return null

  const decode = runtimeNumber(snapshot.stats, 'decode_tps')
  const hitRate = runtimeNumber(snapshot.stats, 'expert_hit_rate')
  const ssd = runtimeNumber(snapshot.stats, 'ssd_gbps')
  const state = snapshot.healthy
    ? snapshot.busy
      ? 'Generating'
      : 'Ready'
    : 'Unavailable'

  return (
    <aside className="telemetry-strip" aria-label="Live runtime telemetry">
      <div className="telemetry-source">
        <span className="telemetry-state">
          <span className={`status-dot ${snapshot.healthy ? 'is-live' : ''}`} />
          {state}
        </span>
        <strong title={snapshot.model_id || undefined}>
          {snapshot.model_id || 'Unknown model'}
        </strong>
        <small title={snapshot.endpoint || undefined}>
          {snapshot.endpoint || 'Endpoint unavailable'}
        </small>
      </div>
      <div className="telemetry-readings">
        <Reading
          label="DECODE"
          value={decode === null ? '—' : decode.toFixed(2)}
          unit="tok/s"
          source="/v1/stats · decode_tps"
        />
        <Reading
          label="EXPERT HITS"
          value={hitRate === null ? '—' : (hitRate * 100).toFixed(1)}
          unit="%"
          source="/v1/stats · expert_hit_rate"
        />
        <Reading
          label="SSD READ"
          value={ssd === null ? '—' : ssd.toFixed(2)}
          unit="GB/s"
          source="/v1/stats · ssd_gbps"
        />
      </div>
      <button
        className="telemetry-open"
        type="button"
        onClick={openCockpit}
        aria-label="Open Cockpit"
      >
        Cockpit <ArrowUpRight size={15} />
      </button>
    </aside>
  )
}
