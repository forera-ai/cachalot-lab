import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TelemetryStrip } from './TelemetryStrip'
import type { RuntimeSnapshot } from './runtime'

const connected: RuntimeSnapshot = {
  connected: true,
  healthy: true,
  busy: false,
  endpoint: 'http://127.0.0.1:8011',
  model_id: 'cachalot-mock',
  stats: { decode_tps: 12.345, expert_hit_rate: 0.875, ssd_gbps: 1.2 },
  error: null,
}

describe('Telemetry strip', () => {
  it('shows reported values and opens Cockpit', () => {
    const openCockpit = vi.fn()
    render(<TelemetryStrip snapshot={connected} openCockpit={openCockpit} />)

    expect(screen.getByText('cachalot-mock')).toBeInTheDocument()
    expect(screen.getByText('12.35')).toBeInTheDocument()
    expect(screen.getByText('87.5')).toBeInTheDocument()
    expect(screen.getByText('1.20')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open Cockpit' }))
    expect(openCockpit).toHaveBeenCalledOnce()
  })

  it('shows unavailable readings without inventing telemetry', () => {
    render(
      <TelemetryStrip
        snapshot={{ ...connected, stats: null }}
        openCockpit={() => undefined}
      />,
    )

    expect(screen.getAllByText('—')).toHaveLength(3)
  })

  it('stays hidden before connecting', () => {
    render(
      <TelemetryStrip
        snapshot={{ ...connected, connected: false }}
        openCockpit={() => undefined}
      />,
    )

    expect(
      screen.queryByLabelText('Live runtime telemetry'),
    ).not.toBeInTheDocument()
  })
})
