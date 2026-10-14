import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { getMeApi, logoutApi } from './api'
import type { User } from './types'
import { useToast } from '@/components/ui/ToastContext'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { addToast } = useToast()
  const handledRef = useRef(false)

  // Check session on mount
  useEffect(() => {
    getMeApi()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  // Listen for 401 events from Axios interceptor
  const handleUnauthorized = useCallback(() => {
    if (handledRef.current) return
    handledRef.current = true
    setUser(null)
    navigate('/login', { replace: true })
    addToast({ message: 'Sesi berakhir. Silakan login kembali.', type: 'error' })
    setTimeout(() => {
      handledRef.current = false
    }, 2000)
  }, [navigate, addToast])

  useEffect(() => {
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [handleUnauthorized])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } finally {
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        sessionStorage.removeItem('mock_logged_in')
      }
      setUser(null)
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
