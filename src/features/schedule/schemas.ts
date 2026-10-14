import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const scheduleSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  start_time: z.string().regex(timeRegex, 'Format waktu tidak valid (HH:MM)'),
  end_time: z.string().regex(timeRegex, 'Format waktu tidak valid').optional().or(z.literal('')),
  location: z.string().optional(),
  notes: z.string().optional(),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>
