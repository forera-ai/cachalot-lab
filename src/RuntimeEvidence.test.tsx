import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { RuntimeEvidence, RequestEnergy } from './RuntimeEvidence'
import type { RuntimeConnection } from './runtime'

const energy = {
  enabled: true,
  available: true,
  samples: 7,
  sample_interval_seconds: 1,
  last_sample_age_seconds: 0.96,
  since: 1791713761.68,
  system: {
    available: true,
    watts: 36.7,
    joules: 314.4,
    source: 'SMC PSTR',
    tag: 'measured',
  },
  components: {
    available: false,
    joules: { cpu: 0 },
    source: 'IOReport Energy Model',
    reason: 'Counters frozen',
  },
}
const trace = {
  every: 4,
  sampled_tokens: 86,
  requests: 3,
  dropped_events: 0,
  exposed_read_share: 0.6,
  mean_per_sampled_token: {
    wall_ms: 153.2,
    sync_ms: 62.4,
    blocked_ms: 62.8,
    read_busy_ms: 104.4,
    hidden_read_ms: 43.1,
    reads: 66.3,
    bytes: 659000000,
    events: 294,
  },
}
function connection(stats: Record<string, unknown>, healthy = true) {
  return { snapshot: { connected: true, healthy, stats } } as RuntimeConnection
}
function cell(table: string, label: string) {
  return within(
    within(screen.getByRole('table', { name: table })).getByRole('row', {
      name: new RegExp(label),
    }),
  ).getByRole('cell')
}
function openEvidence() {
  fireEvent.click(screen.getByText('Energy evidence'))
  fireEvent.click(screen.getByText('Sampled token evidence'))
}
it('keeps measured system energy separate from unavailable component estimates', () => {
  render(
    <RuntimeEvidence runtime={connection({ energy, token_trace: trace })} />,
  )
  openEvidence()
  fireEvent.click(screen.getByText('Component estimates and limits'))
  expect(cell('Runtime system energy', 'System power')).toHaveTextContent(
    '36.700 W',
  )
  expect(cell('Runtime system energy', 'System energy')).toHaveTextContent(
    '314.400 J',
  )
  expect(cell('Runtime component energy estimates', 'CPU')).toHaveTextContent(
    '—',
  )
  expect(screen.getByText(/Counters frozen/)).toBeInTheDocument()
  expect(
    cell('Runtime token trace sample', 'Router eval window'),
  ).toHaveTextContent('62.400 ms')
  expect(
    cell('Runtime token trace sample', 'Exposed read ratio'),
  ).toHaveTextContent('0.600')
})
it('shows event loss and preserves unknown means before any tokens are sampled', () => {
  render(
    <RuntimeEvidence
      runtime={connection({
        token_trace: { ...trace, sampled_tokens: 0, dropped_events: 9 },
      })}
    />,
  )
  openEvidence()
  expect(
    cell('Runtime token trace sample', 'Token wall time'),
  ).toHaveTextContent('—')
  expect(
    cell('Runtime token trace sample', 'Exposed read ratio'),
  ).toHaveTextContent('—')
  expect(
    screen.getByText('Events dropped; evidence incomplete.'),
  ).toBeInTheDocument()
})
it.each([false, true])(
  'hides offline or stale energy and validates every metric independently (%s)',
  (stale) => {
    render(
      <RuntimeEvidence
        runtime={connection(
          {
            energy: { ...energy, last_sample_age_seconds: 7 },
            token_trace: {
              ...trace,
              mean_per_sampled_token: {
                ...trace.mean_per_sampled_token,
                wall_ms: '153',
                reads: -1,
                bytes: Infinity,
              },
            },
          },
          stale,
        )}
      />,
    )
    openEvidence()
    expect(cell('Runtime system energy', 'System power')).toHaveTextContent('—')
    expect(
      cell('Runtime token trace sample', 'Token wall time'),
    ).toHaveTextContent('—')
    expect(cell('Runtime token trace sample', 'Read bytes')).toHaveTextContent(
      '—',
    )
    if (stale)
      expect(screen.getByText(/Energy samples stale/)).toBeInTheDocument()
  },
)
it('keeps valid zero distinct from missing values and never substitutes request energy for decode', () => {
  render(
    <RequestEnergy
      usage={{
        cachalot: {
          energy: {
            available: true,
            source: 'SMC PSTR',
            tag: 'measured',
            sample_interval_seconds: 1,
            request: { seconds: 2, system_joules: 0, mean_system_watts: 0 },
            decode: null,
            components_available: false,
          },
        },
      }}
    />,
  )
  fireEvent.click(screen.getByText('Request energy · whole system'))
  expect(cell('Request energy', 'Request system energy')).toHaveTextContent(
    '0.000 J',
  )
  expect(
    cell('Request energy', 'Decode system energy per output token'),
  ).toHaveTextContent('—')
})
it('ignores malformed optional objects and shows explicit request unavailability', () => {
  const { rerender } = render(
    <RequestEnergy usage={{ cachalot: { energy: [] } }} />,
  )
  expect(
    screen.queryByText('Request energy · whole system'),
  ).not.toBeInTheDocument()
  rerender(
    <RequestEnergy
      usage={{
        cachalot: {
          energy: {
            available: false,
            reason: 'No window',
            request: { system_joules: 100 },
          },
        },
      }}
    />,
  )
  fireEvent.click(screen.getByText('Request energy · whole system'))
  expect(screen.getByText('Unavailable: No window')).toBeInTheDocument()
  expect(cell('Request energy', 'Request system energy')).toHaveTextContent('—')
})
