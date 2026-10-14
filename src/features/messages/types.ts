export interface Message {
  _id: string
  name: string
  email: string
  message: string
  date: string // ISO string
  // Client-side state (not from API — managed locally)
  isRead?: boolean
  isArchived?: boolean
}

export interface MessagesListResponse {
  success: boolean
  message: string
  data: Message[]
}

export interface MessageDetailResponse {
  success: boolean
  message: string
  data: Message
}

export interface DeleteMessageResponse {
  success: boolean
  message: string
}
