import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'

import { Cockpit } from './Cockpit'
import type { PlatformInfo } from './platform'
import type { RuntimeConnection, RuntimePoint } from './runtime'
import { useStudioStore } from './store'

beforeEach(() => useStudioStore.setState({ silentRunning: false }))

it('pauses traces in silent running while keeping readings current', () => {
  const runtime = connection()
  const view = () => (
    <Cockpit
      platform={platform}
      platformError={null}
      host={{ history: [], error: null }}
      openScreen={vi.fn()}
      runtime={runtime}
    />
  )
  const { rerender } = render(view())
  expect(
    screen.getByRole('img', { name: 'Model decode speed history' }),
  ).toBeInTheDocument()
  act(() => useStudioStore.getState().setSilentRunning(true))
  expect(screen.queryByRole('img', { name: /history/ })).not.toBeInTheDocument()
  expect(screen.getAllByText('Live trace paused').length).toBeGreaterThan(0)
  runtime.snapshot.stats = { decode_tps: 37, images_served: 9 }
  rerender(view())
  expect(screen.getAllByText('37.0').length).toBeGreaterThan(0)
  expect(
    within(screen.getByRole('group', { name: 'Image input total' })).getByText(
      '9',
    ),
  ).toBeInTheDocument()
  act(() => useStudioStore.getState().setSilentRunning(false))
  expect(
    screen.getByRole('img', { name: 'Model decode speed history' }),
  ).toBeInTheDocument()
})

const platform: PlatformInfo = {
  architecture: 'arm64',
  macos_version: '27.2',
  memory_gib: 96,
  machine_name: 'Mac Studio',
  model_identifier: 'Mac15,14',
  machine_icon_data_url: 'data:image/png;base64,dGVzdA==',
  chip_name: 'Apple M3 Ultra',
  cpu_cores: 28,
  gpu_cores: 60,
  storage_total_gib: 1800,
  storage_available_gib: 450,
}

function connection(history: RuntimePoint[] = []): RuntimeConnection {
  return {
    snapshot: {
      connected: true,
      healthy: true,
      busy: false,
      endpoint: 'http://127.0.0.1:8011',
      model_id: 'local-model',
      stats: { decode_tps: 24, expert_hit_rate: 0.85, ssd_gbps: 0.4 },
      error: null,
    },
    history,
    connecting: false,
    connectError: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    refresh: vi.fn(),
  }
}

it('shows measured Mac details and labels unsupported tier data', () => {
  render(
    <Cockpit
      platform={platform}
      platformError={null}
      host={{ history: [], error: null }}
      openScreen={vi.fn()}
      runtime={connection()}
    />,
  )

  expect(
    screen.getByRole('img', { name: 'Mac Studio system icon' }),
  ).toHaveAttribute('src', platform.machine_icon_data_url)
  expect(screen.getByText('Apple M3 Ultra')).toBeInTheDocument()
  expect(screen.getByText('28 cores')).toBeInTheDocument()
  expect(screen.getByText('60 cores')).toBeInTheDocument()
  expect(screen.getByText('OUTPUT MODE UNREPORTED')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Runtime' }))
  expect(
    screen.getByText(/Per-tier occupancy and SSD pressure are not reported/),
  ).toBeInTheDocument()
  expect(screen.queryByText('THE MEMORY COLUMN')).not.toBeInTheDocument()
})

it('uses a generic glyph when macOS has no model icon', () => {
  render(
    <Cockpit
      platform={{ ...platform, machine_icon_data_url: null }}
      platformError={null}
      host={{ history: [], error: null }}
      openScreen={vi.fn()}
      runtime={connection()}
    />,
  )

  expect(
    screen.queryByRole('img', { name: 'Mac Studio system icon' }),
  ).toBeNull()
  expect(screen.getByText('Mac Studio')).toBeInTheDocument()
})

it('draws a trace from actual successive samples', () => {
  const history: RuntimePoint[] = [
    {
      at: 1_000,
      endpoint: 'http://127.0.0.1:8011',
      decode_tps: 12,
      expert_hit_rate: 0.7,
      ssd_gbps: 0.1,
      requests_served: 1,
      tokens_generated: 12,
      queued_requests: 0,
      resident_experts: null,
    },
    {
      at: 2_000,
      endpoint: 'http://127.0.0.1:8011',
      decode_tps: 24,
      expert_hit_rate: 0.85,
      ssd_gbps: 0.4,
      requests_served: 2,
      tokens_generated: 36,
      queued_requests: 0,
      resident_experts: null,
    },
  ]
  render(
    <Cockpit
      platform={platform}
      platformError={null}
      host={{ history: [], error: null }}
      openScreen={vi.fn()}
      runtime={connection(history)}
    />,
  )
  const chart = screen.getByRole('img', { name: 'Model decode speed history' })
  expect(chart.querySelector('path.chart-signal')?.getAttribute('d')).toContain(
    'L',
  )
})

it('does not present a remembered model as connected after disconnect', () => {
  const runtime = connection()
  runtime.snapshot.healthy = false
  render(
    <Cockpit
      platform={platform}
      platformError={null}
      host={{ history: [], error: null }}
      openScreen={vi.fn()}
      runtime={runtime}
    />,
  )
  expect(screen.getByText('No model connected')).toBeInTheDocument()
  expect(screen.queryByText('local-model')).not.toBeInTheDocument()
})

it('shows an explicit numerics tag when a future runtime reports one', () => {
  const runtime = connection()
  runtime.snapshot.stats = { numerics_tag: 'missdrop0.2-sub4' }
  render(
    <Cockpit
      platform={platform}
      platformError={null}
      host={{ history: [], error: null }}
      openScreen={vi.fn()}
      runtime={runtime}
    />,
  )
  expect(screen.getByText('NUMERICS missdrop0.2-sub4')).toBeInTheDocument()
  expect(screen.queryByText('OUTPUT MODE UNREPORTED')).not.toBeInTheDocument()
})

it('shows reported prefetch totals, preserves zero, and clears unavailable data', () => {
  const runtime = connection()
  const view = () => (
    <Cockpit
      platform={platform}
      platformError={null}
      host={{ history: [], error: null }}
      openScreen={vi.fn()}
      runtime={runtime}
    />
  )
  runtime.snapshot.stats = { predicted_loads: 120, predicted_used: 0 }
  const { rerender } = render(view())
  fireEvent.click(screen.getByRole('button', { name: 'Runtime' }))
  const totals = () =>
    within(screen.getByRole('group', { name: 'Expert prefetch totals' }))
  expect(totals().getByText('120')).toBeInTheDocument()
  expect(totals().getByText('0')).toBeInTheDocument()
  expect(totals().getByText(/Runtime totals/)).toBeInTheDocument()

  runtime.snapshot.stats = { predicted_loads: 0, predicted_used: 0 }
  rerender(view())
  expect(totals().getAllByText('0')).toHaveLength(2)

  runtime.snapshot.stats = { predicted_loads: 12 }
  rerender(view())
  expect(totals().getByText('12')).toBeInTheDocument()
  expect(totals().getByText('—')).toBeInTheDocument()

  for (const stats of [
    {},
    { predicted_loads: '120', predicted_used: null },
    { predicted_loads: -1, predicted_used: 0.5 },
    { predicted_loads: Infinity, predicted_used: Number.MAX_SAFE_INTEGER + 1 },
  ]) {
    runtime.snapshot.stats = stats
    rerender(view())
    expect(totals().getAllByText('—')).toHaveLength(2)
  }

  runtime.snapshot.stats = { predicted_loads: 120, predicted_used: 80 }
  runtime.snapshot.healthy = false
  rerender(view())
  expect(totals().getAllByText('—')).toHaveLength(2)
  expect(totals().queryByText('120')).not.toBeInTheDocument()
})

it('shows image input totals without inferring vision support and clears stale values', () => {
  const runtime = connection()
  const view = () => (
    <Cockpit
      platform={platform}
      platformError={null}
      host={{ history: [], error: null }}
      openScreen={vi.fn()}
      runtime={runtime}
    />
  )
  runtime.snapshot.stats = { images_served: 7 }
  const { rerender } = render(view())
  const total = () =>
    within(screen.getByRole('group', { name: 'Image input total' }))
  expect(total().getByText('7')).toBeInTheDocument()
  expect(total().getByText('IMAGE INPUTS')).toBeInTheDocument()
  for (const value of [0, 12]) {
    runtime.snapshot.stats = { images_served: value }
    rerender(view())
    expect(total().getByText(String(value))).toBeInTheDocument()
  }
  for (const value of [
    undefined,
    null,
    '7',
    -1,
    0.5,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    runtime.snapshot.stats = { images_served: value }
    rerender(view())
    expect(total().getByText('—')).toBeInTheDocument()
  }
  runtime.snapshot.stats = { images_served: 7 }
  runtime.snapshot.healthy = false
  rerender(view())
  expect(total().getByText('—')).toBeInTheDocument()
  runtime.snapshot.healthy = true
  runtime.snapshot.connected = false
  rerender(view())
  expect(total().getByText('—')).toBeInTheDocument()
})

it('shows drive rates offline, changes drive, and clears disconnected or failed samples', () => {
  const runtime = connection()
  runtime.snapshot.healthy = false
  const host = {
    history: [
      {
        at: Date.now(),
        cpu_percent: null,
        gpu_percent: null,
        memory_working_gib: 12,
        disks: [
          {
            id: '1',
            name: 'Internal SSD',
            bsd_name: 'disk0',
            read_mbps: 12.5,
            write_mbps: 0,
          },
          {
            id: '2',
            name: 'External SSD',
            bsd_name: 'disk6',
            read_mbps: 25,
            write_mbps: 1,
          },
        ],
      },
    ],
    error: null as string | null,
  }
  const view = () => (
    <Cockpit
      platform={platform}
      platformError={null}
      host={host}
      openScreen={vi.fn()}
      runtime={runtime}
    />
  )
  const { rerender } = render(view())
  const rates = () =>
    within(screen.getByRole('group', { name: 'Drive throughput' }))
  expect(rates().getByText('12.5 MB/s')).toBeInTheDocument()
  expect(rates().getByText('0.0 MB/s')).toBeInTheDocument()
  fireEvent.change(screen.getByRole('combobox', { name: 'Storage drive' }), {
    target: { value: '2' },
  })
  expect(rates().getByText('25.0 MB/s')).toBeInTheDocument()
  host.history[0]!.disks = host.history[0]!.disks.slice(0, 1)
  rerender(view())
  expect(rates().getAllByText('— MB/s')).toHaveLength(2)
  expect(rates().queryByText('12.5 MB/s')).not.toBeInTheDocument()
  fireEvent.change(screen.getByRole('combobox', { name: 'Storage drive' }), {
    target: { value: '1' },
  })
  host.error = 'sampling failed'
  rerender(view())
  expect(rates().getAllByText('— MB/s')).toHaveLength(2)
})
