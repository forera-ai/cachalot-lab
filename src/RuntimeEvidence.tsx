import type { RuntimeConnection } from './runtime'

// Optional runtime objects are untrusted, including in saved conversation usage.
function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}
function number(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= Number.MAX_SAFE_INTEGER
    ? value
    : null
}
function format(value: unknown, unit = '', integer = false): string {
  const n = number(value)
  if (n === null || (integer && !Number.isSafeInteger(n))) return '—'
  return `${integer ? n.toLocaleString() : n.toFixed(3)}${unit ? ` ${unit}` : ''}`
}
function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{value}</td>
    </tr>
  )
}
const components = ['cpu', 'gpu', 'ane', 'dram', 'dcs', 'amcc'] as const
const energyLimits =
  'Whole-system SMC power includes other apps and the display; no idle baseline is subtracted. Short or first requests can carry up to one sampling interval of error at each end. IOReport components are SoC estimates, not an additive breakdown of the system total. No SSD or DRAM-transport energy is measured here.'

export function RuntimeEvidence({ runtime }: { runtime: RuntimeConnection }) {
  const stats =
    runtime.snapshot.connected && runtime.snapshot.healthy
      ? runtime.snapshot.stats
      : null
  const energy = object(stats?.energy)
  const system = object(energy?.system)
  const component = object(energy?.components)
  const interval = number(energy?.sample_interval_seconds)
  const age = number(energy?.last_sample_age_seconds)
  const stale =
    interval !== null && interval > 0 && age !== null && age > 5 * interval + 1
  const enabled = energy?.enabled === true
  const systemOK = enabled && !stale && system?.available === true
  const componentOK = enabled && !stale && component?.available === true
  const joules = componentOK ? object(component?.joules) : null
  const trace = object(stats?.token_trace)
  const sampled = number(trace?.sampled_tokens)
  const mean =
    sampled !== null && Number.isSafeInteger(sampled) && sampled > 0
      ? object(trace?.mean_per_sampled_token)
      : null
  const dropped = number(trace?.dropped_events)
  return (
    <>
      <details className="read-evidence instrument-evidence">
        <summary>Energy evidence</summary>
        <div className="read-evidence-body">
          <p>
            What power and energy has this server's meter observed? /v1/stats ·
            runtime measurements · — means unavailable. Off by default; enable
            energy in a launch profile with Cachalot 0.63+.
          </p>
          {(!energy || !enabled) && (
            <p>Energy unavailable: not reported or not enabled.</p>
          )}
          {stale && (
            <p role="status">Energy samples stale; readings unavailable.</p>
          )}
          <p>
            System source: {text(system?.source, 'unreported')}.{' '}
            {!systemOK && text(system?.reason, 'System energy unavailable.')}
          </p>
          <table aria-label="Runtime system energy">
            <tbody>
              <Row
                label="System power · measured"
                value={format(systemOK ? system?.watts : null, 'W')}
              />
              <Row
                label="System energy · cumulative since meter start"
                value={format(systemOK ? system?.joules : null, 'J')}
              />
              <Row
                label="Sampling interval"
                value={format(energy?.sample_interval_seconds, 's')}
              />
              <Row
                label="Last sample age at poll"
                value={format(energy?.last_sample_age_seconds, 's')}
              />
              <Row
                label="Retained samples"
                value={format(energy?.samples, '', true)}
              />
              <Row
                label="Retained window start · epoch"
                value={format(energy?.since, 's')}
              />
            </tbody>
          </table>
          <details className="evidence-limits">
            <summary>Component estimates and limits</summary>
            <p>{energyLimits}</p>
            <p>
              Component source: {text(component?.source, 'unreported')}.{' '}
              {!componentOK &&
                text(component?.reason, 'Component estimates unavailable.')}
            </p>
            <table aria-label="Runtime component energy estimates">
              <tbody>
                {components.map((key) => (
                  <Row
                    key={key}
                    label={`${key.toUpperCase()} · cumulative estimate`}
                    value={format(joules?.[key], 'J')}
                  />
                ))}
              </tbody>
            </table>
            <p>
              Lab never starts a privileged power sampler. Cumulative energy can
              include idle periods and must not be divided by unrelated token
              totals.
            </p>
          </details>
        </div>
      </details>
      <details className="read-evidence instrument-evidence">
        <summary>Sampled token evidence</summary>
        <div className="read-evidence-body">
          <p>
            Where does sampled DeepSeek decode time go? /v1/stats · running
            means per sampled decode token since server start, collected after
            requests. Not this chat or a token timeline.
          </p>
          {!trace && (
            <p>
              Token trace unavailable: requires DeepSeek, Cachalot 0.64+, and
              explicit trace enablement.
            </p>
          )}
          <table aria-label="Runtime token trace sample">
            <tbody>
              <Row
                label="Record one decode token in"
                value={format(trace?.every, '', true)}
              />
              <Row
                label="Sampled tokens"
                value={format(trace?.sampled_tokens, '', true)}
              />
              <Row
                label="Collected requests"
                value={format(trace?.requests, '', true)}
              />
              <Row
                label="Dropped events"
                value={format(trace?.dropped_events, '', true)}
              />
              {(
                [
                  ['wall_ms', 'Token wall time', 'ms'],
                  ['sync_ms', 'Router eval window', 'ms'],
                  ['blocked_ms', 'Main-thread expert wait', 'ms'],
                  ['read_busy_ms', 'Read busy union', 'ms'],
                  ['hidden_read_ms', 'Read time outside wait', 'ms'],
                  ['reads', 'Reads', ''],
                  ['bytes', 'Read bytes', 'B'],
                  ['events', 'Events', ''],
                ] as const
              ).map(([key, label, unit]) => (
                <Row
                  key={key}
                  label={`${label} · sampled mean`}
                  value={format(mean?.[key], unit)}
                />
              ))}
              <Row
                label="Exposed read ratio · derived by runtime"
                value={format(
                  mean &&
                    number(mean.read_busy_ms) !== null &&
                    Number(mean.read_busy_ms) > 0
                    ? trace?.exposed_read_share
                    : null,
                )}
              />
            </tbody>
          </table>
          <p role="status">
            {dropped === null || !Number.isSafeInteger(dropped)
              ? 'Event loss unknown; completeness unverified.'
              : dropped > 0
                ? 'Events dropped; evidence incomplete.'
                : 'No dropped events reported; boundary-crossing reads are still omitted.'}
          </p>
          <details className="evidence-limits">
            <summary>Interpretation and collection cost</summary>
            <p>
              Router eval includes queued GPU work; it is not pure
              synchronization, compute, or waiting. Main-thread expert wait is
              exposed I/O, not a proven critical path or guaranteed faster-drive
              saving. Read intervals overlap; do not add these rows.
              Boundary-crossing reads are omitted; ratios are approximate and
              not a latency percentage. No GPU timeline is available.
            </p>
            <p>
              Sampling is positional, default one in four. Continuous recording
              measured +0.55 ms per decode token (95% +0.05 to +1.11) on one
              runtime workload. Later one-in-four measurement averaged +0.274 ms
              (95% −0.065 to +0.645); overhead was not certified under the
              runtime's 0.5 ms upper-bound rule. These are workload-specific
              runtime results, not measured Lab overhead.
            </p>
          </details>
        </div>
      </details>
    </>
  )
}

export function RequestEnergy({ usage }: { usage: Record<string, unknown> }) {
  const energy = object(object(usage.cachalot)?.energy)
  if (!energy) return null
  const available = energy.available === true
  const request = available ? object(energy.request) : null
  const decode = available ? object(energy.decode) : null
  return (
    <details className="reasoning-block request-energy">
      <summary>Request energy · whole system</summary>
      {!available && (
        <p>Unavailable: {text(energy.reason, 'no usable samples reported')}</p>
      )}
      <p>
        Source: {text(energy.source, 'unreported')} · runtime tag:{' '}
        {text(energy.tag, 'unreported')} · sampling interval{' '}
        {format(energy.sample_interval_seconds, 's')}.
      </p>
      <table aria-label="Request energy">
        <tbody>
          <Row
            label="Request window · queue excluded"
            value={format(request?.seconds, 's')}
          />
          <Row
            label="Request system energy"
            value={format(request?.system_joules, 'J')}
          />
          <Row
            label="Request mean system power"
            value={format(request?.mean_system_watts, 'W')}
          />
          <Row
            label="Decode window · tail of request"
            value={format(decode?.seconds, 's')}
          />
          <Row
            label="Decode system energy"
            value={format(decode?.system_joules, 'J')}
          />
          <Row
            label="Decode mean system power"
            value={format(decode?.mean_system_watts, 'W')}
          />
          <Row
            label="Decode system energy per output token"
            value={format(decode?.system_joules_per_token, 'J/token')}
          />
        </tbody>
      </table>
      <p>{energyLimits}</p>
      <details>
        <summary>Request and decode component estimates</summary>
        <p>
          Source: {text(energy.components_source, 'unreported')}. — means
          unavailable, never zero.
        </p>
        <table aria-label="Request component energy estimates">
          <tbody>
            {(['request', 'decode'] as const).flatMap((window) => {
              const values =
                energy.components_available === true
                  ? object(object(energy[window])?.components_joules)
                  : null
              return components.map((key) => (
                <Row
                  key={`${window}-${key}`}
                  label={`${window} ${key.toUpperCase()} · estimate`}
                  value={format(available ? values?.[key] : null, 'J')}
                />
              ))
            })}
          </tbody>
        </table>
      </details>
    </details>
  )
}
