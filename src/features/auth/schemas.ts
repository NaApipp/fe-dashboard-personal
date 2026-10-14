import { z } from 'zod'

export const loginSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export type LoginFormData = z.infer<typeof loginSchema>
