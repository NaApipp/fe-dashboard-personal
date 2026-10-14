import { client } from '@/lib/api/client'
import { SCHEDULE } from '@/lib/api/endpoints'
import type {
  ScheduleListResponse,
  ScheduleMutationResponse,
  DeleteScheduleResponse,
  ScheduleItem,
  CreateSchedulePayload,
} from './types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const today = new Date().toISOString().split('T')[0] ?? ''
const tomorrowDate = new Date()
tomorrowDate.setDate(tomorrowDate.getDate() + 1)
const tomorrow = tomorrowDate.toISOString().split('T')[0] ?? ''
const dayAfter = new Date()
dayAfter.setDate(dayAfter.getDate() + 2)
const dayAfterDate = dayAfter.toISOString().split('T')[0] ?? ''

const mockSchedule: ScheduleItem[] = [
  {
    _id: 's1',
    title: 'Kuliah Basis Data',
    date: today,
    start_time: '08:00',
    end_time: '10:00',
    location: 'Gedung A - Lab 301',
    notes: 'Bawa laptop dan charger',
    created_at: new Date().toISOString(),
  },
  {
    _id: 's2',
    title: 'Makan Siang & Istirahat',
    date: today,
    start_time: '12:00',
    end_time: '13:00',
    location: 'Kantin Kampus',
    created_at: new Date().toISOString(),
  },
  {
    _id: 's3',
    title: 'Bimbingan Skripsi',
    date: today,
    start_time: '14:00',
    end_time: '15:30',
    location: 'Ruang Dosen Lt. 2',
    notes: 'Siapkan progress laporan bab 3',
    created_at: new Date().toISOString(),
  },
  {
    _id: 's4',
    title: 'Kuliah Algoritma',
    date: tomorrow,
    start_time: '09:00',
    end_time: '11:00',
    location: 'Gedung B - Ruang 205',
    created_at: new Date().toISOString(),
  },
  {
    _id: 's5',
    title: 'Rapat Kelompok Proyek',
    date: tomorrow,
    start_time: '15:00',
    end_time: '17:00',
    location: 'Perpustakaan - Ruang Diskusi',
    notes: 'Bahas pembagian tugas frontend/backend',
    created_at: new Date().toISOString(),
  },
  {
    _id: 's6',
    title: 'Olahraga Futsal',
    date: dayAfterDate,
    start_time: '16:00',
    end_time: '18:00',
    location: 'Lapangan Futsal Kampus',
    created_at: new Date().toISOString(),
  },
]

// Normalize schedule from real API
function normalizeSchedule(s: Record<string, unknown>): ScheduleItem {
  // Date might come as ISO string "2024-10-14T00:00:00.000Z" or just "2024-10-14"
  let date = String(s.date ?? s.schedule_date ?? '')
  if (date.includes('T')) date = date.split('T')[0] ?? date

  return {
    _id: String(s._id ?? s.id ?? s.id_schedule ?? ''),
    title: String(s.title ?? s.name ?? s.agenda ?? ''),
    date,
    start_time: String(s.start_time ?? s.startTime ?? s.time ?? '00:00'),
    end_time: s.end_time ? String(s.end_time) : s.endTime ? String(s.endTime) : undefined,
    location: s.location ? String(s.location) : undefined,
    notes: s.notes ? String(s.notes) : undefined,
    created_at: s.created_at ? String(s.created_at) : undefined,
  }
}

export async function getScheduleApi(): Promise<ScheduleListResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    return { success: true, message: 'Berhasil', data: [...mockSchedule] }
  }
  const res = await client.get<{ success: boolean; message: string; data: Record<string, unknown>[] }>(SCHEDULE.LIST)
  const data = Array.isArray(res.data.data) ? res.data.data.map(normalizeSchedule) : []
  return { ...res.data, data }
}

export async function createScheduleApi(
  payload: CreateSchedulePayload,
): Promise<ScheduleMutationResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    const newItem: ScheduleItem = {
      ...payload,
      _id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }
    mockSchedule.push(newItem)
    return { success: true, message: 'Agenda berhasil ditambahkan', data: newItem }
  }
  const res = await client.post<ScheduleMutationResponse>(SCHEDULE.CREATE, payload)
  return res.data
}

export async function deleteScheduleApi(id: string): Promise<DeleteScheduleResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    const idx = mockSchedule.findIndex((x) => x._id === id)
    if (idx !== -1) mockSchedule.splice(idx, 1)
    return { success: true, message: 'Agenda berhasil dihapus' }
  }
  const res = await client.delete<DeleteScheduleResponse>(SCHEDULE.DELETE(id))
  return res.data
}
