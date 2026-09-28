import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { Screen } from './navigation'

export type ThemePreference = 'system' | 'abyss' | 'surface'

type StudioState = {
  screen: Screen
  themePreference: ThemePreference
  paletteOpen: boolean
  setScreen: (screen: Screen) => void
  setThemePreference: (theme: ThemePreference) => void
  setPaletteOpen: (open: boolean) => void
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      screen: 'cockpit',
      themePreference: 'system',
      paletteOpen: false,
      setScreen: (screen) => set({ screen, paletteOpen: false }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
    }),
    {
      name: 'cachalot-studio-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ screen, themePreference }) => ({
        screen,
        themePreference,
      }),
    },
  ),
)
