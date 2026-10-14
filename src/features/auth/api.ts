import { client } from '@/lib/api/client'
import { AUTH } from '@/lib/api/endpoints'
import type { LoginResponse, MeResponse, LogoutResponse } from './types'
import type { LoginFormData } from './schemas'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const mockUser = { id_user: 1, name: 'n_apipppp' }

export async function loginApi(data: LoginFormData): Promise<LoginResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800))
    if (data.name === 'admin' && data.password === 'admin123') {
      return { success: true, message: 'Login berhasil', user: mockUser, token: 'mock-token' }
    }
    throw { message: 'name atau password salah', status: 401 }
  }
  const res = await client.post<LoginResponse>(AUTH.LOGIN, data)
  return res.data
}

export async function logoutApi(): Promise<LogoutResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    return { success: true, message: 'Logout berhasil' }
  }
  const res = await client.post<LogoutResponse>(AUTH.LOGOUT)
  return res.data
}

export async function getMeApi(): Promise<MeResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    // Simulate checking session from localStorage flag
    const isLoggedIn = sessionStorage.getItem('mock_logged_in') === 'true'
    if (!isLoggedIn) throw { message: 'Token tidak ditemukan', status: 401 }
    return { user: mockUser }
  }
  const res = await client.get<MeResponse>(AUTH.ME)
  return res.data
}
