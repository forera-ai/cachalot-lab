import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { Screen } from './navigation'

export type ThemePreference = 'system' | 'abyss' | 'surface'

type LabState = {
  screen: Screen
  themePreference: ThemePreference
  silentRunning: boolean
  paletteOpen: boolean
  setScreen: (screen: Screen) => void
  setThemePreference: (theme: ThemePreference) => void
  setSilentRunning: (silentRunning: boolean) => void
  setPaletteOpen: (open: boolean) => void
}

export const useLabStore = create<LabState>()(
  persist(
    (set) => ({
      screen: 'cockpit',
      themePreference: 'system',
      silentRunning: false,
      paletteOpen: false,
      setScreen: (screen) => set({ screen, paletteOpen: false }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setSilentRunning: (silentRunning) => set({ silentRunning }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
    }),
    {
      // Stable on-disk key: the Lab rename preserves existing preferences.
      name: 'cachalot-studio-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ screen, themePreference, silentRunning }) => ({
        screen,
        themePreference,
        silentRunning,
      }),
    },
  ),
)
