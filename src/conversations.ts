import { invoke, isTauri } from '@tauri-apps/api/core'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  usage?: Record<string, unknown>
}

export type Conversation = {
  id: string
  title: string
  endpoint: string
  model_id: string
  updated_at: number
  messages: ChatMessage[]
}

export async function listConversations(): Promise<Conversation[]> {
  return isTauri() ? invoke<Conversation[]>('list_conversations') : []
}

export async function saveConversation(
  conversation: Conversation,
): Promise<void> {
  if (isTauri()) await invoke('save_conversation', { conversation })
}

export async function deleteConversation(id: string): Promise<void> {
  if (isTauri()) await invoke('delete_conversation', { id })
}

export function titleFromMessage(content: string): string {
  return (
    Array.from(content.replace(/\s+/g, ' ').trim()).slice(0, 80).join('') ||
    'New conversation'
  )
}
