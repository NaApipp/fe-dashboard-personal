export type AssignmentStatus = 'belum' | 'proses' | 'selesai'
export type AssignmentPriority = 'rendah' | 'sedang' | 'tinggi'

export interface ChecklistItem {
  text: string
  done: boolean
}

export interface Reference {
  title: string
  url: string
}

export interface Assignment {
  _id: string
  title: string
  subject: string // mata kuliah
  deadline: [string, string] // ["YYYY-MM-DD", "HH:MM"]
  priority: AssignmentPriority
  status: AssignmentStatus
  notes?: string
  checklist?: ChecklistItem[]
  references?: Reference[]
  created_at?: string
}

export interface AssignmentsListResponse {
  success: boolean
  message: string
  data: Assignment[]
}

export interface AssignmentDetailResponse {
  success: boolean
  message: string
  data: Assignment
}

export interface AssignmentMutationResponse {
  success: boolean
  message: string
  data: Assignment
}

export interface DeleteAssignmentResponse {
  success: boolean
  message: string
}

export type CreateAssignmentPayload = Omit<Assignment, '_id' | 'created_at'>
export type UpdateAssignmentPayload = Partial<CreateAssignmentPayload>
