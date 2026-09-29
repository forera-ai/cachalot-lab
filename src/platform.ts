import { invoke, isTauri } from '@tauri-apps/api/core'

export type PlatformInfo = {
  architecture: string
  macos_version: string
  memory_gib: number
  machine_name: string | null
  model_identifier: string | null
  machine_icon_data_url: string | null
  chip_name: string | null
  cpu_cores: number | null
  gpu_cores: number | null
  storage_total_gib: number | null
  storage_available_gib: number | null
}

export async function loadPlatformInfo(): Promise<PlatformInfo | null> {
  if (!isTauri()) {
    return null
  }

  return invoke<PlatformInfo>('platform_info')
}
