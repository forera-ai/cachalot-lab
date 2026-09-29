import {
  Activity,
  Cable,
  CircleHelp,
  HeartPulse,
  Layers3,
  ScrollText,
  MessagesSquare,
  Settings2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Screen =
  'cockpit' | 'chat' | 'dive' | 'api' | 'doctor' | 'logs' | 'settings'

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
  { id: 'dive', label: 'Dive', description: 'Managed runtime', icon: Layers3 },
  { id: 'api', label: 'API', description: 'Server connection', icon: Cable },
  {
    id: 'doctor',
    label: 'Doctor',
    description: 'Machine readiness',
    icon: HeartPulse,
  },
  {
    id: 'logs',
    label: 'Logs',
    description: 'Managed runtime output',
    icon: ScrollText,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Appearance and behavior',
    icon: Settings2,
  },
]

export const helpIcon = CircleHelp
