import { client } from '@/lib/api/client'
import { ASSIGNMENTS } from '@/lib/api/endpoints'
import type {
  AssignmentsListResponse,
  AssignmentDetailResponse,
  AssignmentMutationResponse,
  DeleteAssignmentResponse,
  Assignment,
  AssignmentStatus,
  AssignmentPriority,
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

export function normalizeStatus(s: unknown): AssignmentStatus {
  const str = String(s ?? '').toLowerCase()
  if (str === 'in_progress' || str === 'proses') return 'in_progress'
  if (str === 'completed' || str === 'selesai' || str === 'done') return 'completed'
  return 'pending'
}

export function normalizePriority(p: unknown): AssignmentPriority {
  const str = String(p ?? '').toLowerCase()
  if (str === 'high' || str === 'tinggi') return 'high'
  if (str === 'low' || str === 'rendah') return 'low'
  return 'medium'
}

const mockAssignments: Assignment[] = [
  {
    _id: 'a1',
    title: 'Laporan Praktikum Basis Data',
    subject: 'Basis Data',
    deadline: [
      yesterday.toISOString().split('T')[0] ?? '2024-01-01',
      '23:59',
    ],
    priority: 'high',
    status: 'pending',
    location: 'Lab Komputer 1',
    description: 'Sertakan ER diagram dan normalisasi 3NF lengkap',
    checklist: [
      { title_checklist: 'Buat ER diagram', isCompleted: true },
      { title_checklist: 'Normalisasi 3NF', isCompleted: false },
      { title_checklist: 'Tulis laporan', isCompleted: false },
    ],
    references: [
      { title_references: 'Dokumentasi MySQL', url: 'https://dev.mysql.com/doc/' },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    _id: 'a2',
    title: 'UTS Algoritma & Pemrograman',
    subject: 'Algoritma & Pemrograman',
    deadline: [
      new Date().toISOString().split('T')[0] ?? '2024-01-01',
      '08:00',
    ],
    priority: 'high',
    status: 'in_progress',
    location: 'Ruang Ujian 201',
    description: 'Fokus pada sorting & searching algorithms secara mendalam',
    checklist: [],
    references: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    _id: 'a3',
    title: 'Presentasi Proyek Kalkulus',
    subject: 'Kalkulus',
    deadline: [
      tomorrow.toISOString().split('T')[0] ?? '2024-01-01',
      '13:00',
    ],
    priority: 'medium',
    status: 'in_progress',
    location: 'Gedung C - Ruang 302',
    description: 'Slide presentasi maksimal 15 halaman beserta demo',
    checklist: [],
    references: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    _id: 'a4',
    title: 'Essay Pancasila - Nilai Gotong Royong',
    subject: 'Pancasila',
    deadline: [
      nextWeek.toISOString().split('T')[0] ?? '2024-01-01',
      '17:00',
    ],
    priority: 'low',
    status: 'pending',
    location: 'Perpustakaan Pusat',
    description: 'Minimal 1500 kata dilengkapi dengan analisis kasus sosial',
    checklist: [],
    references: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    _id: 'a5',
    title: 'Quiz Jaringan Komputer',
    subject: 'Jaringan Komputer',
    deadline: [
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0] ?? '2024-01-01',
      '10:00',
    ],
    priority: 'medium',
    status: 'completed',
    location: 'Lab Jaringan Komputer',
    description: 'Materi subnetting IPv4 dan routing OSPF sudah tuntas',
    checklist: [],
    references: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
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
    const [datePart = '', timePart = ''] = a.deadline.split('T')
    deadline = [datePart, timePart.substring(0, 5) || '00:00']
  } else if (typeof a.deadline_date === 'string') {
    deadline = [a.deadline_date as string, String(a.deadline_time ?? '23:59')]
  }

  const desc = String(a.description ?? a.notes ?? '')
  const loc = String(a.location ?? '')
  const createdAtStr = String(a.createdAt ?? a.created_at ?? new Date().toISOString())
  const updatedAtStr = String(a.updatedAt ?? a.updated_at ?? createdAtStr)

  return {
    _id: id,
    title: String(a.title ?? ''),
    subject: String(a.subject ?? a.mata_kuliah ?? a.course ?? ''),
    deadline,
    priority: normalizePriority(a.priority),
    status: normalizeStatus(a.status),
    location: loc,
    description: desc,
    notes: desc,
    createdAt: createdAtStr,
    updatedAt: updatedAtStr,
    created_at: createdAtStr,
    checklist: Array.isArray(a.checklist)
      ? a.checklist.map((item) => {
          const it = (item ?? {}) as Record<string, unknown>
          return {
            title_checklist: String(it.title_checklist ?? it.title ?? it.text ?? ''),
            isCompleted: Boolean(it.isCompleted ?? it.completed ?? it.done ?? false),
          }
        })
      : [],
    references: Array.isArray(a.references)
      ? a.references.map((item) => {
          const it = (item ?? {}) as Record<string, unknown>
          return {
            title_references: String(it.title_references ?? it.title ?? ''),
            url: String(it.url ?? ''),
          }
        })
      : [],
  }
}

export async function getAssignmentsApi(): Promise<AssignmentsListResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    return { success: true, message: 'Berhasil', data: [...mockAssignments] }
  }
  const res = await client.get<Record<string, unknown>>(ASSIGNMENTS.LIST)
  const raw = res.data
  const rawList = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.asignment)
    ? raw.asignment
    : Array.isArray(raw?.assignments)
    ? raw.assignments
    : Array.isArray(raw)
    ? raw
    : []
  const data = rawList.map((item) => normalizeAssignment(item as Record<string, unknown>))
  return {
    success: typeof raw?.success === 'boolean' ? raw.success : true,
    message: typeof raw?.message === 'string' ? raw.message : 'Berhasil',
    data,
  }
}

export async function getAssignmentDetailApi(id: string): Promise<AssignmentDetailResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    const a = mockAssignments.find((x) => x._id === id)
    if (!a) throw { message: 'Tugas tidak ditemukan', status: 404 }
    return { success: true, message: 'Berhasil', data: a }
  }
  const res = await client.get<Record<string, unknown>>(ASSIGNMENTS.DETAIL(id))
  const raw = res.data
  const rawItem = (raw?.data ?? raw?.asignment ?? raw?.assignment ?? raw) as Record<string, unknown>
  return {
    success: typeof raw?.success === 'boolean' ? raw.success : true,
    message: typeof raw?.message === 'string' ? raw.message : 'Berhasil',
    data: normalizeAssignment(rawItem),
  }
}

export async function createAssignmentApi(
  payload: CreateAssignmentPayload,
): Promise<AssignmentMutationResponse> {
  const requestBody = {
    title: payload.title,
    description: payload.description,
    status: normalizeStatus(payload.status),
    priority: normalizePriority(payload.priority),
    deadline: (Array.isArray(payload.deadline)
      ? [String(payload.deadline[0]), String(payload.deadline[1])]
      : [String(payload.deadline), '23:59']) as [string, string],
    location: payload.location,
    checklist: Array.isArray(payload.checklist) ? payload.checklist : [],
    references: Array.isArray(payload.references) ? payload.references : [],
  }

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    const newItem: Assignment = {
      ...requestBody,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    mockAssignments.unshift(newItem)
    return { success: true, message: 'Tugas berhasil ditambahkan', data: newItem }
  }

  const res = await client.post<Record<string, unknown>>(ASSIGNMENTS.CREATE, requestBody)
  const raw = res.data
  const rawItem = (raw?.data ?? raw?.asignment ?? raw?.assignment ?? raw) as Record<string, unknown>
  return {
    success: typeof raw?.success === 'boolean' ? raw.success : true,
    message: typeof raw?.message === 'string' ? raw.message : 'Tugas berhasil ditambahkan',
    data: normalizeAssignment(rawItem),
  }
}

export async function updateAssignmentApi(
  id: string,
  payload: UpdateAssignmentPayload,
): Promise<AssignmentMutationResponse> {
  let deadlineStr: string | undefined = undefined
  if (payload.deadline) {
    if (Array.isArray(payload.deadline)) {
      const d0 = String(payload.deadline[0] ?? '')
      const d1 = String(payload.deadline[1] ?? '00:00')
      deadlineStr = d0.length >= 10 ? `${d0}T${d1}` : `${d0} ${d1}`
      if (deadlineStr.length < 10) deadlineStr = deadlineStr.padEnd(10, '0')
    } else {
      deadlineStr = String(payload.deadline)
    }
  }

  const requestBody: Record<string, unknown> = {
    ...payload,
    ...(payload.status ? { status: normalizeStatus(payload.status) } : {}),
    ...(payload.priority ? { priority: normalizePriority(payload.priority) } : {}),
    ...(deadlineStr ? { deadline: deadlineStr } : {}),
    checklist: Array.isArray(payload.checklist) ? payload.checklist : [],
    references: Array.isArray(payload.references) ? payload.references : [],
  }

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    const idx = mockAssignments.findIndex((x) => x._id === id)
    if (idx === -1) throw { message: 'Tugas tidak ditemukan', status: 404 }
    const updated = {
      ...mockAssignments[idx],
      ...requestBody,
      updatedAt: new Date().toISOString(),
    } as Assignment
    mockAssignments[idx] = updated
    return { success: true, message: 'Tugas berhasil diperbarui', data: updated }
  }

  const res = await client.put<Record<string, unknown>>(ASSIGNMENTS.UPDATE(id), requestBody)
  const raw = res.data
  const rawItem = (raw?.data ?? raw?.asignment ?? raw?.assignment ?? raw) as Record<string, unknown>
  return {
    success: typeof raw?.success === 'boolean' ? raw.success : true,
    message: typeof raw?.message === 'string' ? raw.message : 'Tugas berhasil diperbarui',
    data: normalizeAssignment(rawItem),
  }
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
