import {
  ArrowRight,
  Check,
  ChevronRight,
  Command,
  Cpu,
  HardDrive,
  Moon,
  Search,
  Sun,
  Waves,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import markDark from '../assets/logo/cachalot-mark-dark.svg'
import markLight from '../assets/logo/cachalot-mark-light.svg'
import CommandPalette from './CommandPalette'
import { navigation, type Screen } from './navigation'
import { loadPlatformInfo, type PlatformInfo } from './platform'
import { ApiScreen, ChatScreen } from './RuntimeScreens'
import { runtimeNumber, useRuntime, type RuntimeConnection } from './runtime'
import { useStudioStore, type ThemePreference } from './store'

function useResolvedTheme(preference: ThemePreference) {
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const theme =
    preference === 'system' ? (systemDark ? 'abyss' : 'surface') : preference
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme =
      theme === 'abyss' ? 'dark' : 'light'
  }, [theme])
  return theme
}

function Cockpit({
  platform,
  platformError,
  openScreen,
  runtime,
}: {
  platform: PlatformInfo | null
  platformError: string | null
  openScreen: (screen: Screen) => void
  runtime: RuntimeConnection
}) {
  const { snapshot } = runtime
  const hits = runtimeNumber(snapshot.stats, 'expert_hit_rate')
  const requests = runtimeNumber(snapshot.stats, 'requests_served')
  const tokens = runtimeNumber(snapshot.stats, 'tokens_generated')
  const residents = runtimeNumber(snapshot.stats, 'resident_experts')
  return (
    <div className="page cockpit-page">
      <div className="eyebrow">
        <span className="eyebrow-line" /> STUDIO / 001
      </div>
      <div className="page-heading">
        <div>
          <h1>Cockpit</h1>
          <p>Your local inference instrument panel.</p>
        </div>
        <span className={`state-pill ${snapshot.healthy ? 'is-online' : ''}`}>
          <span className="status-dot" />{' '}
          {snapshot.healthy
            ? snapshot.busy
              ? 'Generating'
              : 'Runtime ready'
            : 'Runtime offline'}
        </span>
      </div>

      <section className="hero-panel" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="section-kicker">CACHALOT ENGINE</span>
          <h2 id="hero-title">
            {snapshot.healthy ? 'Your model is live.' : 'Ready to dive.'}
          </h2>
          <p>
            {snapshot.healthy
              ? `${snapshot.model_id} is connected on this Mac. Start a conversation or inspect live telemetry.`
              : 'Connect to a Cachalot server on this Mac to chat and watch its live telemetry.'}
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => openScreen(snapshot.healthy ? 'chat' : 'api')}
            >
              {snapshot.healthy ? 'Open chat' : 'Connect runtime'}{' '}
              <ArrowRight size={16} />
            </button>
            <button
              className="secondary-button"
              onClick={() => openScreen('doctor')}
            >
              Check this Mac <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="depth-illustration" aria-hidden="true">
          <div className="depth-grid" />
          <div className="depth-ring depth-ring-outer" />
          <div className="depth-ring depth-ring-middle" />
          <div className="depth-ring depth-ring-inner" />
          <div className="depth-core">
            <img src={markDark} alt="" />
          </div>
          <span className="depth-label depth-label-top">
            SURFACE <b>00</b>
          </span>
          <span className="depth-label depth-label-bottom">
            ABYSS <b>04</b>
          </span>
          <span className="depth-cross depth-cross-one">+</span>
          <span className="depth-cross depth-cross-two">+</span>
        </div>
      </section>

      <div className="section-head">
        <div>
          <span className="section-kicker">SYSTEM OVERVIEW</span>
          <h2>At a glance</h2>
        </div>
        <span className="section-note">
          {snapshot.healthy
            ? `Live from ${snapshot.endpoint}`
            : 'Values appear when a runtime is connected'}
        </span>
      </div>
      <div className="metric-grid">
        <Metric
          title="Requests served"
          value={requests?.toLocaleString() ?? '—'}
          unit="total"
          detail={
            snapshot.healthy
              ? 'Since runtime start'
              : 'Waiting for a running model'
          }
          index="01"
        />
        <Metric
          title="Expert hit rate"
          value={hits === null ? '—' : (hits * 100).toFixed(1)}
          unit="%"
          detail={
            snapshot.healthy
              ? 'Reported by Cachalot'
              : 'Waiting for cache telemetry'
          }
          index="02"
        />
        <Metric
          title="Tokens generated"
          value={tokens?.toLocaleString() ?? '—'}
          unit="total"
          detail={
            snapshot.healthy ? 'Since runtime start' : 'Waiting for generation'
          }
          index="03"
        />
        <Metric
          title="Resident experts"
          value={residents?.toLocaleString() ?? '—'}
          unit="experts"
          detail={
            residents !== null
              ? 'Current runtime cache'
              : 'Waiting for cache telemetry'
          }
          index="04"
        />
      </div>

      <div className="lower-grid">
        <section className="info-panel tier-panel">
          <div className="panel-title">
            <span className="section-kicker">THE MEMORY COLUMN</span>
            <span className="panel-index">01 / 02</span>
          </div>
          <h3>Four zones. One machine.</h3>
          <p className="panel-intro">
            Cachalot can move model data between memory and storage as a request
            runs.
          </p>
          <div className="tier-list">
            <Tier
              color="surface"
              label="Surface"
              detail="Resident trunk + hot experts"
            />
            <Tier
              color="twilight"
              label="Twilight"
              detail="Wired cache + prefix memory"
            />
            <Tier
              color="midnight"
              label="Midnight"
              detail="Page cache + snapshots"
            />
            <Tier color="abyss" label="Abyss" detail="SSD + mirror drive" />
          </div>
        </section>
        <section className="info-panel machine-panel">
          <div className="panel-title">
            <span className="section-kicker">THIS MAC</span>
            <span className="panel-index">02 / 02</span>
          </div>
          <h3>Local by design.</h3>
          <p className="panel-intro">
            Studio runs on your Mac. Model data and telemetry stay here.
          </p>
          <div className="machine-rows">
            <div>
              <Cpu size={17} />
              <span>Processor</span>
              <strong>
                {platform?.architecture ??
                  (platformError ? 'Unavailable' : 'Checking…')}
              </strong>
            </div>
            <div>
              <Waves size={17} />
              <span>macOS</span>
              <strong>
                {platform?.macos_version ??
                  (platformError ? 'Unavailable' : 'Checking…')}
              </strong>
            </div>
            <div>
              <HardDrive size={17} />
              <span>Unified memory</span>
              <strong>
                {platform
                  ? `${platform.memory_gib.toFixed(1)} GiB`
                  : platformError
                    ? 'Unavailable'
                    : 'Checking…'}
              </strong>
            </div>
          </div>
          <button className="text-button" onClick={() => openScreen('doctor')}>
            Open Doctor <ArrowRight size={16} />
          </button>
        </section>
      </div>
    </div>
  )
}

function Metric({
  title,
  value,
  unit,
  detail,
  index,
}: {
  title: string
  value: string
  unit: string
  detail: string
  index: string
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <small>{index}</small>
      </div>
      <div className="metric-value">
        {value}
        <span>{unit}</span>
      </div>
      <div className="metric-detail">
        <span className="tiny-dot" />
        {detail}
      </div>
    </div>
  )
}

function Tier({
  color,
  label,
  detail,
}: {
  color: string
  label: string
  detail: string
}) {
  return (
    <div className="tier">
      <span className={`tier-swatch tier-${color}`} />
      <strong>{label}</strong>
      <span>{detail}</span>
    </div>
  )
}

function Doctor({
  platform,
  error,
  runtime,
}: {
  platform: PlatformInfo | null
  error: string | null
  runtime: RuntimeConnection
}) {
  const checks = [
    {
      label: 'Architecture',
      value: platform?.architecture ?? '—',
      ok: platform?.architecture === 'arm64',
    },
    {
      label: 'macOS version',
      value: platform?.macos_version ?? '—',
      ok: platform ? Number(platform.macos_version.split('.')[0]) >= 14 : false,
    },
    {
      label: 'Unified memory',
      value: platform ? `${platform.memory_gib.toFixed(1)} GiB` : '—',
      ok: Boolean(platform),
    },
    {
      label: 'Local Cachalot server',
      value: runtime.snapshot.healthy ? 'Connected' : 'Not connected',
      ok: runtime.snapshot.healthy,
    },
  ]
  return (
    <div className="page detail-page">
      <div className="eyebrow">
        <span className="eyebrow-line" /> SYSTEM / DIAGNOSTICS
      </div>
      <div className="page-heading">
        <div>
          <h1>Doctor</h1>
          <p>A clear view of this Mac before the first dive.</p>
        </div>
      </div>
      <section className="info-panel diagnostic-panel">
        <span className="section-kicker">HARDWARE</span>
        <h2>Machine basics</h2>
        <p className="panel-intro">
          Read directly from macOS when running the native app.
        </p>
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        {checks.map((check) => (
          <div className="check-row" key={check.label}>
            <span className={check.ok ? 'check-icon is-ok' : 'check-icon'}>
              {check.ok ? <Check size={15} /> : '—'}
            </span>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
          </div>
        ))}
        <p className="panel-footnote">
          Model and storage checks will be added with managed runtime profiles.
        </p>
      </section>
    </div>
  )
}

function Settings() {
  const preference = useStudioStore((state) => state.themePreference)
  const setPreference = useStudioStore((state) => state.setThemePreference)
  const choices: {
    id: ThemePreference
    label: string
    description: string
    icon: typeof Sun
  }[] = [
    {
      id: 'system',
      label: 'System',
      description: 'Match macOS appearance',
      icon: Command,
    },
    {
      id: 'abyss',
      label: 'Abyss',
      description: 'Deep water, luminous detail',
      icon: Moon,
    },
    {
      id: 'surface',
      label: 'Surface',
      description: 'Daylight over water',
      icon: Sun,
    },
  ]
  return (
    <div className="page detail-page">
      <div className="eyebrow">
        <span className="eyebrow-line" /> STUDIO / PREFERENCES
      </div>
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Shape the Studio around the way you work.</p>
        </div>
      </div>
      <section className="info-panel settings-panel">
        <span className="section-kicker">APPEARANCE</span>
        <h2>Theme</h2>
        <p className="panel-intro">
          Choose the light of the room, or follow your Mac.
        </p>
        <div className="theme-choices">
          {choices.map(({ id, label, description, icon: Icon }) => (
            <button
              className={`theme-choice ${preference === id ? 'is-active' : ''}`}
              onClick={() => setPreference(id)}
              key={id}
              aria-pressed={preference === id}
            >
              <Icon size={20} />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              {preference === id && <Check size={18} className="theme-check" />}
            </button>
          ))}
        </div>
      </section>
      <p className="settings-note">
        Theme preference stays on this Mac. API keys remain in memory for the
        current session.
      </p>
    </div>
  )
}

export default function App() {
  const storedScreen = useStudioStore((state) => state.screen)
  const screen = navigation.some((item) => item.id === storedScreen)
    ? storedScreen
    : 'cockpit'
  const setScreen = useStudioStore((state) => state.setScreen)
  const setPaletteOpen = useStudioStore((state) => state.setPaletteOpen)
  const preference = useStudioStore((state) => state.themePreference)
  const theme = useResolvedTheme(preference)
  const runtime = useRuntime()
  const [platform, setPlatform] = useState<PlatformInfo | null>(null)
  const [platformError, setPlatformError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadPlatformInfo()
      .then((info) => {
        if (active) {
          setPlatform(info)
          if (!info)
            setPlatformError('Hardware details are available in the macOS app.')
        }
      })
      .catch((error: unknown) => {
        if (active)
          setPlatformError(
            error instanceof Error
              ? error.message
              : 'Could not read machine details.',
          )
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setPaletteOpen])

  return (
    <div className="studio-shell">
      <aside
        className="sidebar"
        aria-label="Main navigation"
        data-tauri-drag-region
      >
        <div className="sidebar-brand">
          <span className="brand-mark">
            <img src={theme === 'abyss' ? markDark : markLight} alt="" />
          </span>
          <span className="brand-name">
            CACHALOT <b>STUDIO</b>
          </span>
        </div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          {navigation.slice(0, 3).map((item) => (
            <NavButton
              key={item.id}
              item={item}
              current={screen}
              onSelect={setScreen}
            />
          ))}
        </nav>
        <div className="sidebar-section-label sidebar-section-label-lower">
          SYSTEM
        </div>
        <nav className="sidebar-nav">
          {navigation.slice(3).map((item) => (
            <NavButton
              key={item.id}
              item={item}
              current={screen}
              onSelect={setScreen}
            />
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span
            className={`side-status ${runtime.snapshot.healthy ? 'is-online' : ''}`}
          >
            <span className="status-dot" />{' '}
            {runtime.snapshot.healthy
              ? 'RUNTIME CONNECTED'
              : 'NO RUNTIME ACTIVE'}
          </span>
          <span className="side-version">STUDIO 0.1.0</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar" data-tauri-drag-region>
          <div className="breadcrumbs">
            <span>STUDIO</span>
            <ChevronRight size={14} />
            <strong>
              {navigation.find((item) => item.id === screen)?.label}
            </strong>
          </div>
          <button
            className="command-trigger"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette"
          >
            <Search size={16} />
            <span>Jump to anything</span>
            <kbd>⌘ K</kbd>
          </button>
        </header>
        <main className="main-content" id="main-content">
          <div hidden={screen !== 'chat'}>
            <ChatScreen runtime={runtime} />
          </div>
          {screen === 'cockpit' ? (
            <Cockpit
              platform={platform}
              platformError={platformError}
              openScreen={setScreen}
              runtime={runtime}
            />
          ) : screen === 'api' ? (
            <ApiScreen runtime={runtime} />
          ) : screen === 'doctor' ? (
            <Doctor
              platform={platform}
              error={platformError}
              runtime={runtime}
            />
          ) : screen === 'settings' ? (
            <Settings />
          ) : null}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}

function NavButton({
  item,
  current,
  onSelect,
}: {
  item: (typeof navigation)[number]
  current: Screen
  onSelect: (screen: Screen) => void
}) {
  const Icon = item.icon
  return (
    <button
      className={`nav-button ${current === item.id ? 'is-active' : ''}`}
      onClick={() => onSelect(item.id)}
      aria-current={current === item.id ? 'page' : undefined}
    >
      <Icon size={18} strokeWidth={1.8} />
      <span>{item.label}</span>
      {current === item.id && <span className="nav-active-indicator" />}
    </button>
  )
}
