import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Command, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { navigation } from './navigation'
import { useStudioStore } from './store'

type PaletteCommand = {
  id: string
  label: string
  detail: string
  group: string
  run: () => void
}

function fuzzyMatch(value: string, query: string): boolean {
  const text = value.toLowerCase()
  let position = 0

  for (const character of query.toLowerCase().trim()) {
    position = text.indexOf(character, position)
    if (position === -1) return false
    position += 1
  }

  return true
}

export default function CommandPalette() {
  const open = useStudioStore((state) => state.paletteOpen)
  const setOpen = useStudioStore((state) => state.setPaletteOpen)
  const setScreen = useStudioStore((state) => state.setScreen)
  const setTheme = useStudioStore((state) => state.setThemePreference)
  const systemReducedMotion = useReducedMotion()
  const silentRunning = useStudioStore((state) => state.silentRunning)
  const reduceMotion = systemReducedMotion || silentRunning
  const inputRef = useRef<HTMLInputElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)

  const commands = useMemo<PaletteCommand[]>(
    () => [
      ...navigation.map((item) => ({
        id: `screen-${item.id}`,
        label: `Open ${item.label}`,
        detail: item.description,
        group: 'Navigate',
        run: () => setScreen(item.id),
      })),
      ...(['system', 'abyss', 'surface'] as const).map((theme) => ({
        id: `theme-${theme}`,
        label: `Use ${theme === 'system' ? 'System' : theme === 'abyss' ? 'Abyss' : 'Surface'} theme`,
        detail: 'Appearance',
        group: 'Theme',
        run: () => {
          setTheme(theme)
          setOpen(false)
        },
      })),
    ],
    [setOpen, setScreen, setTheme],
  )

  const results = useMemo(
    () =>
      commands.filter((command) =>
        fuzzyMatch(`${command.label} ${command.detail}`, query),
      ),
    [commands, query],
  )

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement | null
      requestAnimationFrame(() => inputRef.current?.focus())
      return
    }

    previousFocus.current?.focus()
  }, [open])

  function execute(command: PaletteCommand | undefined) {
    if (!command) return
    command.run()
    setQuery('')
    setSelected(0)
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.16 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <motion.div
            ref={paletteRef}
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{
              opacity: 0,
              y: reduceMotion ? 0 : -10,
              scale: reduceMotion ? 1 : 0.98,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : -8,
              scale: reduceMotion ? 1 : 0.98,
            }}
            transition={{
              type: 'spring',
              bounce: 0,
              duration: reduceMotion ? 0 : 0.25,
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                setOpen(false)
              } else if (event.key === 'Tab') {
                const focusable =
                  paletteRef.current?.querySelectorAll<HTMLElement>(
                    'input, button',
                  )
                if (!focusable?.length) return
                const first = focusable[0]
                const last = focusable[focusable.length - 1]
                if (!first || !last) return
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault()
                  last.focus()
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault()
                  first.focus()
                }
              } else if (event.key === 'ArrowDown') {
                event.preventDefault()
                setSelected((index) =>
                  Math.max(0, Math.min(index + 1, results.length - 1)),
                )
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setSelected((index) => Math.max(0, index - 1))
              } else if (event.key === 'Enter') {
                event.preventDefault()
                execute(results[selected])
              }
            }}
          >
            <div className="palette-search">
              <Search size={19} aria-hidden="true" />
              <input
                ref={inputRef}
                aria-label="Search commands"
                aria-controls="command-results"
                aria-activedescendant={
                  results[selected]
                    ? `command-${results[selected].id}`
                    : undefined
                }
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setSelected(0)
                }}
                placeholder="Search screens and actions…"
              />
              <kbd>ESC</kbd>
            </div>
            <div
              className="palette-results"
              id="command-results"
              role="listbox"
            >
              {results.length ? (
                results.map((command, index) => (
                  <button
                    className={`palette-result ${index === selected ? 'is-selected' : ''}`}
                    id={`command-${command.id}`}
                    key={command.id}
                    role="option"
                    aria-selected={index === selected}
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => execute(command)}
                  >
                    <span className="palette-result-icon">
                      <Command size={16} aria-hidden="true" />
                    </span>
                    <span className="palette-result-copy">
                      <span>{command.label}</span>
                      <small>{command.detail}</small>
                    </span>
                    <span className="palette-group">{command.group}</span>
                  </button>
                ))
              ) : (
                <div className="palette-empty">No matching command.</div>
              )}
            </div>
            <div className="palette-footer">
              <span>↑ ↓ navigate</span>
              <span>↵ select</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
