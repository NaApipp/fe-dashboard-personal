import { z } from 'zod'

export const checklistItemSchema = z.object({
  title_checklist: z.string().min(1, 'Title checklist is required'),
  isCompleted: z.boolean().default(false),
})

export const referenceSchema = z.object({
  title_references: z.string().min(1, 'Title references is required'),
  url: z.string().url('URL is required'),
})

// Skema form frontend yang disesuaikan persis dengan addAsignmentSchema dari Backend
export const assignmentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long'),
  status: z.enum(['pending', 'in_progress', 'completed'], {
    message: 'Status is required',
  }),
  priority: z.enum(['high', 'medium', 'low'], {
    message: 'Priority is required',
  }),
  deadlineDate: z.string().min(1, 'Date is required'),
  deadlineTime: z.string().min(1, 'Time is required'),
  location: z.string().min(5, 'Location must be at least 5 characters long'),
  subject: z.string().optional(),
})

export type AssignmentFormData = z.infer<typeof assignmentSchema>
