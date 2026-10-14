import axios, { AxiosError } from 'axios'

export interface ApiError {
  message: string
  status: number
  fieldErrors?: Record<string, string>
}

function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string> }>
    const status = axiosError.response?.status ?? 0
    const data = axiosError.response?.data
    return {
      message: data?.message ?? axiosError.message ?? 'Terjadi kesalahan',
      status,
      fieldErrors: data?.errors,
    }
  }
  if (error instanceof Error) {
    return { message: error.message, status: 0 }
  }
  return { message: 'Terjadi kesalahan tidak diketahui', status: 0 }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : 'https://api.appsporto.my.id',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 401 interceptor — broadcast event so AuthContext can handle redirect
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(normalizeError(error))
  },
)

export { client, normalizeError }
