import axios, { AxiosError } from 'axios'

export interface ApiError {
  message: string
  status: number
  fieldErrors?: Record<string, string>
}

function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string
      error?: string
      msg?: string
      errors?: Record<string, string> | Array<{ message?: string; field?: string; path?: (string | number)[] }>
    }>
    const status = axiosError.response?.status ?? 0
    const data = axiosError.response?.data

    let msg = data?.message ?? data?.error ?? data?.msg
    if (!msg && Array.isArray(data?.errors) && data.errors.length > 0) {
      msg = data.errors[0]?.message
    }
    if (!msg) {
      msg = axiosError.message || 'Terjadi kesalahan'
    }

    // Normalize Zod field errors from API: [{field: "body.title", message: "..."}]
    let fieldErrors: Record<string, string> | undefined
    if (Array.isArray(data?.errors)) {
      const arr = data.errors as Array<{ field?: string; message?: string }>
      if (arr.length > 0 && arr[0].field) {
        fieldErrors = {}
        for (const e of arr) {
          if (e.field && e.message) {
            // Strip "body." prefix from field name
            const key = e.field.replace(/^body\./, '')
            fieldErrors[key] = e.message
          }
        }
      }
    } else if (typeof data?.errors === 'object' && !Array.isArray(data?.errors)) {
      fieldErrors = data.errors as Record<string, string>
    }

    return { message: msg, status, fieldErrors }
  }
  if (error instanceof Error) {
    return { message: error.message, status: 0 }
  }
  return { message: 'Terjadi kesalahan tidak diketahui', status: 0 }
}

// Token storage helpers — single source of truth
export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token')
  },
  set(token: string, persistent = true): void {
    if (persistent) {
      localStorage.setItem('auth_token', token)
      sessionStorage.removeItem('auth_token')
    } else {
      sessionStorage.setItem('auth_token', token)
      localStorage.removeItem('auth_token')
    }
  },
  clear(): void {
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
  },
  isPersistent(): boolean {
    return !!localStorage.getItem('auth_token')
  },
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.appsporto.my.id',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Bearer token on every request
client.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 interceptor — clear token & broadcast event so AuthContext can redirect
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStorage.clear()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(normalizeError(error))
  },
)

export { client, normalizeError }
