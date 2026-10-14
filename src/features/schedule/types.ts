export interface ScheduleItem {
  _id: string
  title: string
  date: string // YYYY-MM-DD
  start_time: string // HH:MM
  end_time?: string // HH:MM — assumed field, not in spec
  location?: string
  notes?: string
  created_at?: string
}

export interface ScheduleListResponse {
  success: boolean
  message: string
  data: ScheduleItem[]
}

export interface ScheduleDetailResponse {
  success: boolean
  message: string
  data: ScheduleItem
}

export interface ScheduleMutationResponse {
  success: boolean
  message: string
  data: ScheduleItem
}

export interface DeleteScheduleResponse {
  success: boolean
  message: string
}

export type CreateSchedulePayload = Omit<ScheduleItem, '_id' | 'created_at'>
