import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const assignmentSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  subject: z.string().min(1, 'Mata kuliah wajib diisi'),
  deadlineDate: z.string().min(1, 'Tanggal deadline wajib diisi'),
  deadlineTime: z.string().regex(timeRegex, 'Format waktu tidak valid (HH:MM)'),
  priority: z.enum(['rendah', 'sedang', 'tinggi']),
  status: z.enum(['belum', 'proses', 'selesai']),
  notes: z.string().optional(),
})

export type AssignmentFormData = z.infer<typeof assignmentSchema>
