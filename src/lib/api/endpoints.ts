// API Endpoint constants — single source of truth

export const AUTH = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
} as const

export const MESSAGES = {
  LIST: '/api/message',
  DETAIL: (id: string) => `/api/message/${id}`,
} as const

export const ASSIGNMENTS = {
  LIST: '/api/asignment',
  DETAIL: (id: string) => `/api/asignment/${id}`,
  CREATE: '/api/asignment',
  UPDATE: (id: string) => `/api/asignment/${id}`,
  DELETE: (id: string) => `/api/asignment/${id}`,
} as const

export const SCHEDULE = {
  LIST: '/api/schedule',
  CREATE: '/api/schedule',
  DELETE: (id: string) => `/api/schedule/${id}`,
} as const
