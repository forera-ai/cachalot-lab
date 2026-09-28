# ADR 0001: Desktop foundation

Status: accepted for the 0.1.0 foundation.

## Decision

Use Tauri 2 for the macOS shell, React 19 and Vite for the interface, Tailwind CSS 4 backed by generated CSS variables, Zustand for small persistent UI preferences, and Motion for short interruptible transitions. Keep native machine reads in Rust commands. The app does not contact the real Cachalot runtime in this milestone.

## Reasons

- Tauri provides a small native macOS bundle and a Rust boundary for privileged work.
- React and Vite support the planned screen and streaming UI; TypeScript strict mode keeps the command boundary explicit.
- Design tokens are generated from one JSON source and shared with CSS and TypeScript.
- Zustand holds navigation and theme preference without adding a broader data layer before HTTP integration exists.
- Motion is used only for command palette entrance and exit; reduced motion is honored.

## Consequences

The current Cockpit shows offline values until process supervision and telemetry are implemented. Future runtime data must enter through typed Rust commands or bounded HTTP clients and must never be invented for presentation. The mock runtime exercises integration scenarios without a model checkpoint.
