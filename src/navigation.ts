import {
  Activity,
  Cable,
  CircleHelp,
  HeartPulse,
  MessagesSquare,
  Settings2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Screen = 'cockpit' | 'chat' | 'api' | 'doctor' | 'settings'

export type NavigationItem = {
  id: Screen
  label: string
  description: string
  icon: LucideIcon
}

export const navigation: NavigationItem[] = [
  {
    id: 'cockpit',
    label: 'Cockpit',
    description: 'Runtime overview',
    icon: Activity,
  },
  {
    id: 'chat',
    label: 'Chat',
    description: 'Conversations',
    icon: MessagesSquare,
  },
  { id: 'api', label: 'API', description: 'Server connection', icon: Cable },
  {
    id: 'doctor',
    label: 'Doctor',
    description: 'Machine readiness',
    icon: HeartPulse,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Appearance and behavior',
    icon: Settings2,
  },
]

export const helpIcon = CircleHelp
