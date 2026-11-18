export type AssignmentStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'belum'
  | 'proses'
  | 'selesai'

export type AssignmentPriority =
  | 'high'
  | 'medium'
  | 'low'
  | 'tinggi'
  | 'sedang'
  | 'rendah'

export interface ChecklistItem {
  title_checklist: string
  isCompleted: boolean
}

export interface Reference {
  title_references: string
  url: string
}

export interface Assignment {
  _id: string
  title: string
  description: string
  status: AssignmentStatus
  priority: AssignmentPriority
  deadline: [string, string] | string
  location: string
  checklist: ChecklistItem[]
  references: Reference[]
  createdAt?: string
  updatedAt?: string
  created_at?: string
  subject?: string
  notes?: string
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

export interface CreateAssignmentPayload {
  title: string
  description: string
  status: AssignmentStatus
  priority: AssignmentPriority
  deadline: [string, string]
  location: string
  checklist: ChecklistItem[]
  references: Reference[]
  subject?: string
}

export interface UpdateAssignmentPayload {
  title?: string
  description?: string
  status?: AssignmentStatus
  priority?: AssignmentPriority
  deadline?: string | [string, string]
  location?: string
  checklist?: ChecklistItem[]
  references?: Reference[]
  subject?: string
}
