export interface User {
  id_user: number
  name: string
}

export interface LoginResponse {
  success: boolean
  message: string
  user: User
  token: string
}

export interface MeResponse {
  user: User
}

export interface LogoutResponse {
  success: boolean
  message: string
}
