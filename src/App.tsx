import { Check, ChevronRight, Command, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import markDark from '../assets/logo/cachalot-mark-dark.svg'
import markLight from '../assets/logo/cachalot-mark-light.svg'
import { ChatScreen } from './ChatScreen'
import { Cockpit } from './Cockpit'
import CommandPalette from './CommandPalette'
import { useHostTelemetry } from './host'
import { DiveScreen, LogsScreen } from './ManagedScreens'
import { useManagedRuntime, type ManagedRuntime } from './managed'
import { navigation, type Screen } from './navigation'
import { loadPlatformInfo, type PlatformInfo } from './platform'
import { ApiScreen } from './RuntimeScreens'
import { useRuntime, type RuntimeConnection } from './runtime'
import { useLabStore, type ThemePreference } from './store'
import { TelemetryStrip } from './TelemetryStrip'

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

function Doctor({
  platform,
  error,
  runtime,
  managed,
}: {
  platform: PlatformInfo | null
  error: string | null
  runtime: RuntimeConnection
  managed: ManagedRuntime
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
    {
      label: 'Managed runtime',
      value: managed.status?.running
        ? managed.status.ready
          ? 'Ready'
          : 'Starting'
        : 'Not running',
      ok: Boolean(managed.status?.ready),
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
          Managed runtime details and startup output appear in Dive and Logs.
        </p>
      </section>
    </div>
  )
}

function Settings() {
  const silentRunning = useLabStore((state) => state.silentRunning)
  const setSilentRunning = useLabStore((state) => state.setSilentRunning)
  const preference = useLabStore((state) => state.themePreference)
  const setPreference = useLabStore((state) => state.setThemePreference)
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
        <span className="eyebrow-line" /> LAB / PREFERENCES
      </div>
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Shape the Lab around the way you work.</p>
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
      <section className="info-panel settings-panel">
        <span className="section-kicker">MOTION</span>
        <h2>Silent running</h2>
        <p className="panel-intro" id="silent-running-description">
          Pause live traces and remove interface transitions. Readings and
          connection checks stay live; runtime generation continues as usual.
        </p>
        <button
          className={`theme-choice ${silentRunning ? 'is-active' : ''}`}
          role="switch"
          aria-label="Silent running"
          aria-describedby="silent-running-description"
          aria-checked={silentRunning}
          onClick={() => setSilentRunning(!silentRunning)}
        >
          <Moon size={20} aria-hidden="true" />
          <span>
            <strong>{silentRunning ? 'On' : 'Off'}</strong>
            <small>
              {silentRunning
                ? 'Quiet interface, live readings'
                : 'Live traces and transitions'}
            </small>
          </span>
          {silentRunning && (
            <Check size={18} className="theme-check" aria-hidden="true" />
          )}
        </button>
      </section>
      <p className="settings-note">
        Appearance preferences stay on this Mac. API keys stay in session memory
        unless explicitly saved in Keychain from API.
      </p>
    </div>
  )
}

export default function App() {
  const storedScreen = useLabStore((state) => state.screen)
  const screen = navigation.some((item) => item.id === storedScreen)
    ? storedScreen
    : 'cockpit'
  const setScreen = useLabStore((state) => state.setScreen)
  const setPaletteOpen = useLabStore((state) => state.setPaletteOpen)
  const preference = useLabStore((state) => state.themePreference)
  const theme = useResolvedTheme(preference)
  const silentRunning = useLabStore((state) => state.silentRunning)
  useEffect(() => {
    document.documentElement.dataset.silentRunning = String(silentRunning)
    return () => {
      delete document.documentElement.dataset.silentRunning
    }
  }, [silentRunning])
  const runtime = useRuntime()
  const managed = useManagedRuntime(runtime)
  const host = useHostTelemetry(screen === 'cockpit')
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
    <div className="lab-shell">
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
            CACHALOT <b>LAB</b>
          </span>
        </div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          {navigation.slice(0, 4).map((item) => (
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
          {navigation.slice(4).map((item) => (
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
              : managed.status?.running
                ? 'RUNTIME STARTING'
                : 'NO RUNTIME ACTIVE'}
          </span>
          <span className="side-version">LAB {labVersion}</span>
        </div>
      </aside>
      <div
        className={`main-shell ${runtime.snapshot.connected && screen !== 'cockpit' ? 'with-telemetry' : ''} ${screen === 'cockpit' ? 'cockpit-shell' : ''}`}
      >
        <header className="topbar" data-tauri-drag-region>
          <div className="breadcrumbs">
            <span>LAB</span>
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
              host={host}
              openScreen={setScreen}
              runtime={runtime}
            />
          ) : screen === 'api' ? (
            <ApiScreen runtime={runtime} />
          ) : screen === 'dive' ? (
            <DiveScreen managed={managed} runtime={runtime} />
          ) : screen === 'doctor' ? (
            <Doctor
              platform={platform}
              error={platformError}
              runtime={runtime}
              managed={managed}
            />
          ) : screen === 'logs' ? (
            <LogsScreen />
          ) : screen === 'settings' ? (
            <Settings />
          ) : null}
        </main>
        {screen !== 'cockpit' && (
          <TelemetryStrip
            snapshot={runtime.snapshot}
            openCockpit={() => setScreen('cockpit')}
          />
        )}
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
import { version as labVersion } from '../package.json'
