import { client } from '@/lib/api/client'
import { MESSAGES } from '@/lib/api/endpoints'
import type { MessagesListResponse, MessageDetailResponse, DeleteMessageResponse, Message } from './types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const mockMessages: Message[] = [
  {
    _id: '1',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    message:
      'Halo, saya tertarik untuk berkolaborasi pada proyek web development. Apakah Anda tersedia untuk diskusi lebih lanjut?',
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    _id: '2',
    name: 'Siti Rahayu',
    email: 'siti@example.com',
    message:
      'Portofolio Anda sangat mengesankan! Saya ingin menghubungi Anda terkait posisi frontend developer di perusahaan kami.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    _id: '3',
    name: 'Ahmad Fauzi',
    email: 'ahmad@example.com',
    message: 'Bisakah kita berdiskusi mengenai freelance project untuk landing page startup kami?',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    _id: '4',
    name: 'Dewi Lestari',
    email: 'dewi@example.com',
    message: 'Saya ingin menanyakan tentang rate dan ketersediaan Anda untuk proyek selama 3 bulan.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    _id: '5',
    name: 'Eko Prasetyo',
    email: 'eko@example.com',
    message: 'Kerja bagus! Design UI Anda sangat clean dan modern. Semoga sukses terus!',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
]

// Normalize messages from real API — handles different field names & date formats
function normalizeMessage(m: Record<string, unknown>): Message {
  return {
    _id: String(m._id ?? m.id ?? m.id_message ?? ''),
    name: String(m.name ?? m.sender_name ?? ''),
    email: String(m.email ?? m.sender_email ?? ''),
    message: String(m.message ?? m.body ?? m.content ?? ''),
    // Try multiple possible date field names; fallback to empty string (formatRelative handles it safely)
    date: String(m.date ?? m.created_at ?? m.createdAt ?? m.timestamp ?? ''),
  }
}

export async function getMessagesApi(): Promise<MessagesListResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600))
    return { success: true, message: 'Berhasil', data: mockMessages }
  }
  const res = await client.get<{ success: boolean; message: string; data: Record<string, unknown>[] }>(MESSAGES.LIST)
  const data = Array.isArray(res.data.data) ? res.data.data.map(normalizeMessage) : []
  return { ...res.data, data }
}

export async function getMessageDetailApi(id: string): Promise<MessageDetailResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    const msg = mockMessages.find((m) => m._id === id)
    if (!msg) throw { message: 'Pesan tidak ditemukan', status: 404 }
    return { success: true, message: 'Berhasil', data: msg }
  }
  const res = await client.get<MessageDetailResponse>(MESSAGES.DETAIL(id))
  return res.data
}

export async function deleteMessageApi(id: string): Promise<DeleteMessageResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    const idx = mockMessages.findIndex((m) => m._id === id)
    if (idx !== -1) mockMessages.splice(idx, 1)
    return { success: true, message: 'Pesan berhasil dihapus' }
  }
  const res = await client.delete<DeleteMessageResponse>(MESSAGES.DETAIL(id))
  return res.data
}
