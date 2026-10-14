import { client } from '@/lib/api/client'
import { ASSIGNMENTS } from '@/lib/api/endpoints'
import type {
  AssignmentsListResponse,
  AssignmentDetailResponse,
  AssignmentMutationResponse,
  DeleteAssignmentResponse,
  Assignment,
  CreateAssignmentPayload,
  UpdateAssignmentPayload,
} from './types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const nextWeek = new Date()
nextWeek.setDate(nextWeek.getDate() + 7)
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)

const mockAssignments: Assignment[] = [
  {
    _id: 'a1',
    title: 'Laporan Praktikum Basis Data',
    subject: 'Basis Data',
    deadline: [
      yesterday.toISOString().split('T')[0] ?? '2024-01-01',
      '23:59',
    ],
    priority: 'tinggi',
    status: 'belum',
    notes: 'Sertakan ER diagram dan normalisasi 3NF',
    checklist: [
      { text: 'Buat ER diagram', done: true },
      { text: 'Normalisasi 3NF', done: false },
      { text: 'Tulis laporan', done: false },
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    _id: 'a2',
    title: 'UTS Algoritma & Pemrograman',
    subject: 'Algoritma & Pemrograman',
    deadline: [
      new Date().toISOString().split('T')[0] ?? '2024-01-01',
      '08:00',
    ],
    priority: 'tinggi',
    status: 'proses',
    notes: 'Fokus pada sorting & searching algorithms',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    _id: 'a3',
    title: 'Presentasi Proyek Kalkulus',
    subject: 'Kalkulus',
    deadline: [
      tomorrow.toISOString().split('T')[0] ?? '2024-01-01',
      '13:00',
    ],
    priority: 'sedang',
    status: 'proses',
    notes: 'Slide max 15 halaman',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    _id: 'a4',
    title: 'Essay Pancasila - Nilai Gotong Royong',
    subject: 'Pancasila',
    deadline: [
      nextWeek.toISOString().split('T')[0] ?? '2024-01-01',
      '17:00',
    ],
    priority: 'rendah',
    status: 'belum',
    notes: 'Minimal 1500 kata',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    _id: 'a5',
    title: 'Quiz Jaringan Komputer',
    subject: 'Jaringan Komputer',
    deadline: [
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0] ?? '2024-01-01',
      '10:00',
    ],
    priority: 'sedang',
    status: 'selesai',
    notes: 'Sudah selesai dikerjakan',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
]

// Normalize assignment from real API — handles different shapes
function normalizeAssignment(a: Record<string, unknown>): Assignment {
  const id = String(a._id ?? a.id ?? a.id_asignment ?? '')

  // Deadline can be ["YYYY-MM-DD", "HH:MM"] or a full ISO string or just a date string
  let deadline: [string, string] = ['', '']
  if (Array.isArray(a.deadline) && a.deadline.length >= 2) {
    deadline = [String(a.deadline[0] ?? ''), String(a.deadline[1] ?? '')]
  } else if (typeof a.deadline === 'string' && a.deadline) {
    // ISO string like "2024-12-31T23:59:00.000Z"
    const [datePart = '', timePart = ''] = a.deadline.split('T')
    deadline = [datePart, timePart.substring(0, 5)]
  } else if (typeof a.deadline_date === 'string') {
    deadline = [a.deadline_date as string, String(a.deadline_time ?? '23:59')]
  }

  return {
    _id: id,
    title: String(a.title ?? ''),
    subject: String(a.subject ?? a.mata_kuliah ?? a.course ?? ''),
    deadline,
    priority: (a.priority as Assignment['priority']) ?? 'sedang',
    status: (a.status as Assignment['status']) ?? 'belum',
    notes: a.notes ? String(a.notes) : undefined,
    created_at: a.created_at ? String(a.created_at) : undefined,
  }
}

export async function getAssignmentsApi(): Promise<AssignmentsListResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    return { success: true, message: 'Berhasil', data: [...mockAssignments] }
  }
  const res = await client.get<{ success: boolean; message: string; data: Record<string, unknown>[] }>(ASSIGNMENTS.LIST)
  const data = Array.isArray(res.data.data) ? res.data.data.map(normalizeAssignment) : []
  return { ...res.data, data }
}

export async function getAssignmentDetailApi(id: string): Promise<AssignmentDetailResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    const a = mockAssignments.find((x) => x._id === id)
    if (!a) throw { message: 'Tugas tidak ditemukan', status: 404 }
    return { success: true, message: 'Berhasil', data: a }
  }
  const res = await client.get<AssignmentDetailResponse>(ASSIGNMENTS.DETAIL(id))
  return res.data
}

export async function createAssignmentApi(
  payload: CreateAssignmentPayload,
): Promise<AssignmentMutationResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    const newItem: Assignment = {
      ...payload,
      _id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }
    mockAssignments.unshift(newItem)
    return { success: true, message: 'Tugas berhasil ditambahkan', data: newItem }
  }
  const res = await client.post<AssignmentMutationResponse>(ASSIGNMENTS.CREATE, payload)
  return res.data
}

export async function updateAssignmentApi(
  id: string,
  payload: UpdateAssignmentPayload,
): Promise<AssignmentMutationResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    const idx = mockAssignments.findIndex((x) => x._id === id)
    if (idx === -1) throw { message: 'Tugas tidak ditemukan', status: 404 }
    const updated = { ...mockAssignments[idx], ...payload } as Assignment
    mockAssignments[idx] = updated
    return { success: true, message: 'Tugas berhasil diperbarui', data: updated }
  }
  const res = await client.put<AssignmentMutationResponse>(ASSIGNMENTS.UPDATE(id), payload)
  return res.data
}

export async function deleteAssignmentApi(id: string): Promise<DeleteAssignmentResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    const idx = mockAssignments.findIndex((x) => x._id === id)
    if (idx !== -1) mockAssignments.splice(idx, 1)
    return { success: true, message: 'Tugas berhasil dihapus' }
  }
  const res = await client.delete<DeleteAssignmentResponse>(ASSIGNMENTS.DELETE(id))
  return res.data
}
