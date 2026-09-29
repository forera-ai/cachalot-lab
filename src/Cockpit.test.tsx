import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

import { Cockpit } from './Cockpit'
import type { PlatformInfo } from './platform'
import type { RuntimeConnection, RuntimePoint } from './runtime'

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
