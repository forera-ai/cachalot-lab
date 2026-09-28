import { invoke, isTauri } from '@tauri-apps/api/core'

export type PlatformInfo = {
  architecture: string
  macos_version: string
  memory_gib: number
}

export async function loadPlatformInfo(): Promise<PlatformInfo | null> {
  if (!isTauri()) {
    return null
  }

  return invoke<PlatformInfo>('platform_info')
}
