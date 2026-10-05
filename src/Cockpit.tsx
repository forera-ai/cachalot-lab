import { ArrowRight, ChevronRight, Monitor, Radio } from 'lucide-react'
import { useId, useState } from 'react'

import type { HostPoint } from './host'
import type { Screen } from './navigation'
import type { PlatformInfo } from './platform'
import {
  runtimeNumber,
  type RuntimeConnection,
  type RuntimePoint,
} from './runtime'
import './cockpit.css'
import { useStudioStore } from './store'

type TrendDatum = { at: number; value: number | null }

function runtimeTotal(runtime: RuntimeConnection, key: string): string {
  if (!runtime.snapshot.connected || !runtime.snapshot.healthy) return '—'
  const value = runtimeNumber(runtime.snapshot.stats, key)
  return value !== null && Number.isSafeInteger(value) && value >= 0
    ? value.toLocaleString()
    : '—'
}

function TrendChart({
  data,
  label,
  color,
  ceiling,
  className = '',
}: {
  data: TrendDatum[]
  label: string
  color: string
  ceiling?: number
  className?: string
}) {
  const silentRunning = useStudioStore((state) => state.silentRunning)
  const id = useId().replaceAll(':', '')
  if (silentRunning) {
    return (
      <div
        className={`trend-chart ${className}`}
        aria-label={`${label} trace paused`}
      >
        <span className="trend-empty">Live trace paused</span>
      </div>
    )
  }
  const valid = data.filter((point) => point.value !== null)
  const latest = valid.at(-1)
  const span = 120_000
  const end = latest?.at ?? Date.now()
  const start = end - span
  const top =
    ceiling ?? Math.max(1, ...valid.map((point) => point.value ?? 0)) * 1.15
  const x = (at: number) =>
    Math.max(0, Math.min(600, ((at - start) / span) * 600))
  const y = (value: number) => 128 - Math.max(0, Math.min(1, value / top)) * 112
  let hasSegment = false
  const path = data
    .map((point) => {
      if (point.value === null || point.at < start) {
        hasSegment = false
        return ''
      }
      const command = hasSegment ? 'L' : 'M'
      hasSegment = true
      return `${command}${x(point.at).toFixed(1)},${y(point.value).toFixed(1)}`
    })
    .join(' ')
  let recentSegment: TrendDatum[] = []
  for (const point of data) {
    if (point.value === null || point.at < start) recentSegment = []
    else recentSegment.push(point)
  }
  const firstRecent = recentSegment[0]
  const lastRecent = recentSegment.at(-1)
  const area =
    firstRecent && lastRecent && recentSegment.length > 1
      ? `M${x(firstRecent.at).toFixed(1)},128 ${recentSegment
          .map(
            (point) =>
              `L${x(point.at).toFixed(1)},${y(point.value ?? 0).toFixed(1)}`,
          )
          .join(' ')} L${x(lastRecent.at).toFixed(1)},128 Z`
      : ''

  return (
    <div className={`trend-chart ${className}`}>
      <svg
        viewBox="0 0 600 140"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label} history`}
        style={{ color }}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[16, 53, 90, 128].map((row) => (
          <line
            key={row}
            x1="0"
            x2="600"
            y1={row}
            y2={row}
            className="chart-grid-line"
          />
        ))}
        {[150, 300, 450].map((column) => (
          <line
            key={column}
            x1={column}
            x2={column}
            y1="16"
            y2="128"
            className="chart-grid-line chart-grid-vertical"
          />
        ))}
        {area && <path d={area} fill={`url(#${id})`} />}
        {path && (
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="chart-signal"
          />
        )}
        {latest && latest.value !== null && (
          <>
            <circle
              cx={x(latest.at)}
              cy={y(latest.value)}
              r="6"
              fill={color}
              opacity="0.15"
            />
            <circle
              cx={x(latest.at)}
              cy={y(latest.value)}
              r="2.6"
              fill={color}
            />
          </>
        )}
      </svg>
      {valid.length === 0 && (
        <span className="trend-empty">Waiting for samples</span>
      )}
      <div className="chart-time-axis">
        <span>2m ago</span>
        <span>Now</span>
      </div>
    </div>
  )
}

function latestNumber(points: RuntimePoint[], key: keyof RuntimePoint) {
  const value = points.at(-1)?.[key]
  return typeof value === 'number' ? value : null
}

function storageRate(gibPerSecond: number | null) {
  if (gibPerSecond === null) return { value: '—', unit: 'GB/s' }
  return gibPerSecond < 0.01
    ? { value: (gibPerSecond * 1000).toFixed(1), unit: 'MB/s' }
    : { value: gibPerSecond.toFixed(2), unit: 'GB/s' }
}

export function Cockpit({
  platform,
  platformError,
  host,
  openScreen,
  runtime,
}: {
  platform: PlatformInfo | null
  platformError: string | null
  host: { history: HostPoint[]; error: string | null }
  openScreen: (screen: Screen) => void
  runtime: RuntimeConnection
}) {
  const [storageView, setStorageView] = useState<'drives' | 'runtime'>('drives')
  const [diskId, setDiskId] = useState('')
  const { snapshot, history } = runtime
  const latestHost = host.history.at(-1)
  const disks = host.error ? [] : (latestHost?.disks ?? [])
  const selectedDisk = diskId
    ? disks.find((disk) => disk.id === diskId)
    : disks[0]
  const selectedId = selectedDisk?.id
  const diskTrace = (key: 'read_mbps' | 'write_mbps') =>
    host.history.map((point) => ({
      at: point.at,
      value: selectedId
        ? (point.disks?.find((disk) => disk.id === selectedId)?.[key] ?? null)
        : null,
    }))
  const decode = runtimeNumber(snapshot.stats, 'decode_tps')
  const hitRate = runtimeNumber(snapshot.stats, 'expert_hit_rate')
  const ssdRate = runtimeNumber(snapshot.stats, 'ssd_gbps')
  const storage = storageRate(ssdRate)
  const residents = runtimeNumber(snapshot.stats, 'resident_experts')
  const cpu = latestHost?.cpu_percent ?? null
  const gpu = latestHost?.gpu_percent ?? null
  const ram = latestHost?.memory_working_gib ?? null
  const ramShare =
    ram !== null && platform
      ? Math.min(100, (ram / platform.memory_gib) * 100)
      : null
  const model =
    snapshot.healthy && snapshot.model_id
      ? snapshot.model_id
      : 'No model connected'
  const rawNumericsTag = snapshot.stats?.numerics_tag
  const numericsTag =
    typeof rawNumericsTag === 'string' && rawNumericsTag.trim()
      ? rawNumericsTag.trim().slice(0, 48)
      : null
  const machine =
    platform?.machine_name ||
    (platformError ? 'Mac unavailable' : 'Checking this Mac…')

  return (
    <div className="cockpit-page">
      <header className="cockpit-header">
        <div className="cockpit-heading">
          <div className="cockpit-overline">
            <span className="signal-line" /> STUDIO / SYSTEM TELEMETRY
          </div>
          <div className="cockpit-title-row">
            <h1>Cockpit</h1>
            <span
              className={`cockpit-live-tag ${snapshot.healthy ? 'is-live' : ''}`}
            >
              <span className="status-dot" />
              {snapshot.healthy
                ? snapshot.busy
                  ? 'GENERATING'
                  : 'RUNTIME READY'
                : 'RUNTIME OFFLINE'}
            </span>
          </div>
          <p>
            <strong title={model}>{model}</strong>
            <span className="cockpit-separator">/</span>
            {snapshot.healthy
              ? 'Live model and Mac performance'
              : 'Host telemetry live. Connect Cachalot for model traces.'}
            {snapshot.healthy && (
              <span
                className="cockpit-numerics-note"
                title={
                  numericsTag
                    ? `Runtime numerics tag: ${numericsTag}`
                    : 'This server does not report whether its output uses exact or approximate numerics. MiniMax runtime 0.43 and newer defaults to miss substitution.'
                }
              >
                {numericsTag
                  ? `NUMERICS ${numericsTag}`
                  : 'OUTPUT MODE UNREPORTED'}
              </span>
            )}
          </p>
        </div>
        <button
          className="cockpit-action"
          onClick={() => openScreen(snapshot.healthy ? 'chat' : 'api')}
        >
          {snapshot.healthy ? 'Open chat' : 'Connect runtime'}{' '}
          <ArrowRight size={16} />
        </button>
      </header>

      <div className="cockpit-readouts" aria-label="Current runtime statistics">
        <Readout
          label="DECODE SPEED"
          value={decode === null ? '—' : decode.toFixed(1)}
          unit="tok/s"
          detail="Model output rate"
          color="var(--accent)"
          data={history.map((point) => ({
            at: point.at,
            value: point.decode_tps,
          }))}
        />
        <Readout
          label="EXPERT REUSE"
          value={hitRate === null ? '—' : (hitRate * 100).toFixed(1)}
          unit="%"
          detail="Cache hit rate"
          color="var(--cockpit-violet)"
          data={history.map((point) => ({
            at: point.at,
            value:
              point.expert_hit_rate === null
                ? null
                : point.expert_hit_rate * 100,
          }))}
          ceiling={100}
        />
        <Readout
          label="RUNTIME SSD READ"
          value={storage.value}
          unit={storage.unit}
          detail="Runtime storage stream"
          color="var(--cockpit-amber)"
          data={history.map((point) => ({
            at: point.at,
            value: point.ssd_gbps,
          }))}
        />
        <Readout
          label="GPU LOAD"
          value={gpu === null ? '—' : gpu.toFixed(0)}
          unit="%"
          detail="Whole Mac · IOKit"
          color="var(--cockpit-mint)"
          data={host.history.map((point) => ({
            at: point.at,
            value: point.gpu_percent,
          }))}
          ceiling={100}
        />
      </div>

      <div className="cockpit-grid">
        <section
          className="cockpit-panel throughput-panel"
          aria-labelledby="throughput-title"
        >
          <PanelHead
            overline="MODEL / 01"
            title="Generation throughput"
            detail="Rolling 2-minute trace"
            id="throughput-title"
          />
          <div className="throughput-primary">
            <strong>{decode === null ? '—' : decode.toFixed(1)}</strong>
            <span>tokens / second</span>
          </div>
          <TrendChart
            className="throughput-chart"
            data={history.map((point) => ({
              at: point.at,
              value: point.decode_tps,
            }))}
            color="var(--accent)"
            label="Model decode speed"
          />
          <div className="throughput-foot">
            <SmallStat
              label="TOKENS GENERATED"
              value={
                latestNumber(history, 'tokens_generated')?.toLocaleString() ??
                '—'
              }
            />
            <SmallStat
              label="REQUESTS SERVED"
              value={
                latestNumber(history, 'requests_served')?.toLocaleString() ??
                '—'
              }
            />
            <SmallStat
              label="QUEUED"
              value={
                latestNumber(history, 'queued_requests')?.toLocaleString() ??
                '—'
              }
            />
            <div
              role="group"
              aria-label="Image input total"
              title="Runtime image inputs across requests, including video steps and resent history. Not unique images, completed replies, or a vision capability signal. — means unreported."
            >
              <SmallStat
                label="IMAGE INPUTS"
                value={runtimeTotal(runtime, 'images_served')}
              />
            </div>
            {!snapshot.healthy && (
              <button
                className="panel-inline-link"
                onClick={() => openScreen('api')}
              >
                Connect to begin trace <ChevronRight size={13} />
              </button>
            )}
          </div>
        </section>

        <section
          className="cockpit-panel host-panel"
          aria-labelledby="host-title"
        >
          <PanelHead
            overline="HOST / 02"
            title="Machine load"
            detail="Whole Mac · sampled every 2 seconds"
            id="host-title"
          />
          <HostLane
            name="CPU"
            value={cpu === null ? '—' : cpu.toFixed(0)}
            unit="%"
            color="var(--accent)"
            data={host.history.map((point) => ({
              at: point.at,
              value: point.cpu_percent,
            }))}
          />
          <HostLane
            name="GPU"
            value={gpu === null ? '—' : gpu.toFixed(0)}
            unit="%"
            color="var(--cockpit-mint)"
            data={host.history.map((point) => ({
              at: point.at,
              value: point.gpu_percent,
            }))}
          />
          <HostLane
            name="RAM"
            value={ram === null ? '—' : ram.toFixed(1)}
            unit="GiB"
            color="var(--cockpit-violet)"
            data={host.history.map((point) => ({
              at: point.at,
              value: platform
                ? (point.memory_working_gib / platform.memory_gib) * 100
                : null,
            }))}
            suffix={
              ramShare === null
                ? undefined
                : `${ramShare.toFixed(0)}% of ${platform?.memory_gib.toFixed(0)} GiB`
            }
          />
          <p className="host-definition">
            RAM = active + wired + compressed.{' '}
            {host.error
              ? 'Host sampling unavailable.'
              : 'GPU load depends on driver support.'}
          </p>
        </section>

        <section
          className="cockpit-panel cache-panel"
          aria-labelledby="cache-title"
        >
          <PanelHead
            overline="CACHE + STORAGE / 03"
            title="Memory movement"
            detail="Expert reuse and SSD activity"
            id="cache-title"
          />
          <div className="storage-controls">
            <div role="group" aria-label="Storage view">
              <button
                aria-pressed={storageView === 'drives'}
                onClick={() => setStorageView('drives')}
              >
                Drives
              </button>
              <button
                aria-pressed={storageView === 'runtime'}
                onClick={() => setStorageView('runtime')}
              >
                Runtime
              </button>
            </div>
            {storageView === 'drives' && (
              <select
                aria-label="Storage drive"
                value={selectedId ?? ''}
                onChange={(event) => setDiskId(event.target.value)}
              >
                <option value="" disabled>
                  {diskId
                    ? 'Selected drive unavailable'
                    : 'No drive counters available'}
                </option>
                {disks.map((disk) => (
                  <option key={disk.id} value={disk.id}>
                    {disk.name} · {disk.bsd_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {storageView === 'drives' ? (
            <div
              className="cache-traces disk-traces"
              role="group"
              aria-label="Drive throughput"
            >
              {(['read_mbps', 'write_mbps'] as const).map((key) => (
                <div className="cache-trace" key={key}>
                  <div className="trace-head">
                    <span>
                      {key === 'read_mbps' ? 'DRIVE READ' : 'DRIVE WRITE'}
                    </span>
                    <strong>
                      {selectedDisk?.[key] == null
                        ? '—'
                        : selectedDisk[key].toFixed(1)}{' '}
                      MB/s
                    </strong>
                  </div>
                  <TrendChart
                    data={diskTrace(key)}
                    color={
                      key === 'read_mbps'
                        ? 'var(--cockpit-amber)'
                        : 'var(--cockpit-mint)'
                    }
                    label={
                      key === 'read_mbps'
                        ? 'Drive read throughput'
                        : 'Drive write throughput'
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="cache-traces">
              <div className="cache-trace">
                <div className="trace-head">
                  <span>EXPERT HIT RATE</span>
                  <strong>
                    {hitRate === null ? '—' : `${(hitRate * 100).toFixed(1)}%`}
                  </strong>
                </div>
                <TrendChart
                  data={history.map((point) => ({
                    at: point.at,
                    value:
                      point.expert_hit_rate === null
                        ? null
                        : point.expert_hit_rate * 100,
                  }))}
                  color="var(--cockpit-violet)"
                  label="Expert hit rate"
                  ceiling={100}
                />
              </div>
              <div className="cache-trace">
                <div className="trace-head">
                  <span>RUNTIME SSD READ</span>
                  <strong>
                    {ssdRate === null
                      ? '—'
                      : `${storage.value} ${storage.unit}`}
                  </strong>
                </div>
                <TrendChart
                  data={history.map((point) => ({
                    at: point.at,
                    value: point.ssd_gbps,
                  }))}
                  color="var(--cockpit-amber)"
                  label="Runtime SSD read rate"
                />
              </div>
              <div className="cache-trace">
                <div className="trace-head">
                  <span>RESIDENT EXPERTS</span>
                  <strong>{residents?.toLocaleString() ?? '—'}</strong>
                </div>
                <TrendChart
                  data={history.map((point) => ({
                    at: point.at,
                    value: point.resident_experts,
                  }))}
                  color="var(--cockpit-mint)"
                  label="Resident experts"
                />
              </div>
            </div>
          )}
          {storageView === 'runtime' && (
            <div
              className="prefetch-totals"
              role="group"
              aria-label="Expert prefetch totals"
            >
              <SmallStat
                label="PREFETCH READS"
                value={runtimeTotal(runtime, 'predicted_loads')}
              />
              <SmallStat
                label="PREFETCH USED"
                value={runtimeTotal(runtime, 'predicted_used')}
              />
              <p>Runtime totals · — means unreported. Not a speedup measure.</p>
            </div>
          )}
          <div className="cache-footer">
            <p>
              {storageView === 'drives'
                ? 'Whole-drive activity from all apps · decimal MB/s · — means unavailable or awaiting samples. Not a speed benchmark or Cachalot-only I/O.'
                : 'Surface · Twilight · Midnight · Abyss are memory tiers. Per-tier occupancy and SSD pressure are not reported by this runtime.'}
            </p>
          </div>
        </section>

        <section
          className="cockpit-panel machine-panel-v2"
          aria-labelledby="machine-title"
        >
          <div className="machine-intro">
            {platform?.machine_icon_data_url ? (
              <img
                className="machine-glyph"
                src={platform.machine_icon_data_url}
                alt={`${platform.machine_name || 'This Mac'} system icon`}
              />
            ) : (
              <Monitor
                className="generic-machine-glyph"
                size={62}
                strokeWidth={1.1}
              />
            )}
            <div>
              <span className="panel-overline">THIS MAC / 04</span>
              <h2 id="machine-title">{machine}</h2>
              <p>
                {platform?.chip_name ||
                  platform?.model_identifier ||
                  'Hardware details available in native app'}
              </p>
            </div>
            <button
              className="machine-doctor"
              onClick={() => openScreen('doctor')}
              aria-label="Open Doctor"
            >
              <ArrowRight size={17} />
            </button>
          </div>
          <div className="machine-specs">
            <MachineSpec
              label="CPU"
              value={platform?.cpu_cores ? `${platform.cpu_cores} cores` : '—'}
            />
            <MachineSpec
              label="GPU"
              value={platform?.gpu_cores ? `${platform.gpu_cores} cores` : '—'}
            />
            <MachineSpec
              label="UNIFIED MEMORY"
              value={platform ? `${platform.memory_gib.toFixed(0)} GiB` : '—'}
            />
            <MachineSpec
              label="STARTUP VOLUME"
              value={
                platform?.storage_available_gib == null ||
                platform.storage_total_gib == null
                  ? '—'
                  : `${platform.storage_available_gib.toFixed(0)} / ${platform.storage_total_gib.toFixed(0)} GiB free`
              }
            />
            <MachineSpec label="MACOS" value={platform?.macos_version || '—'} />
            <MachineSpec
              label="MODEL"
              value={platform?.model_identifier || '—'}
            />
          </div>
          <div className="machine-foot">
            <Radio size={13} /> Hardware read from macOS on this machine
          </div>
        </section>
      </div>
    </div>
  )
}

function PanelHead({
  overline,
  title,
  detail,
  id,
}: {
  overline: string
  title: string
  detail: string
  id: string
}) {
  return (
    <div className="cockpit-panel-head">
      <div>
        <span className="panel-overline">{overline}</span>
        <h2 id={id}>{title}</h2>
      </div>
      <small>{detail}</small>
    </div>
  )
}

function Readout({
  label,
  value,
  unit,
  detail,
  color,
  data,
  ceiling,
}: {
  label: string
  value: string
  unit: string
  detail: string
  color: string
  data: TrendDatum[]
  ceiling?: number
}) {
  return (
    <div
      className="cockpit-readout"
      style={{ '--readout-color': color } as React.CSSProperties}
    >
      <span className="readout-label">
        {label}
        <span className="readout-dot" />
      </span>
      <div className="readout-main">
        <strong>{value}</strong>
        <span>{unit}</span>
      </div>
      <span className="readout-detail">{detail}</span>
      <TrendChart
        className="readout-chart"
        data={data}
        label={label}
        color={color}
        ceiling={ceiling}
      />
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="small-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function HostLane({
  name,
  value,
  unit,
  color,
  data,
  suffix,
}: {
  name: string
  value: string
  unit: string
  color: string
  data: TrendDatum[]
  suffix?: string
}) {
  return (
    <div className="host-lane">
      <div className="host-lane-label">
        <span style={{ background: color }} />
        {name}
      </div>
      <TrendChart
        data={data}
        color={color}
        label={`${name} load`}
        ceiling={100}
      />
      <div className="host-lane-value">
        <strong>{value}</strong>
        <span>{unit}</span>
        {suffix && <small>{suffix}</small>}
      </div>
    </div>
  )
}

function MachineSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="machine-spec">
      <span>{label}</span>
      <strong title={value}>{value}</strong>
    </div>
  )
}
