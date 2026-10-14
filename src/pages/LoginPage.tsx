import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginSchema, type LoginFormData } from '@/features/auth/schemas'
import { loginApi } from '@/features/auth/api'
import { useAuth } from '@/features/auth/AuthContext'
import { Input } from '@/components/ui/FormFields'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null)
    try {
      const res = await loginApi(data)
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        sessionStorage.setItem('mock_logged_in', 'true')
      }
      setUser(res.user)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const e = err as { message?: string }
      setApiError(e.message ?? 'Login gagal. Coba lagi.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-surface border border-base rounded-xl shadow-md p-8 space-y-6 animate-fade-in">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-fg">Masuk</h1>
            <p className="text-sm text-fg-muted">Dashboard Pribadi</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Nama"
              type="text"
              placeholder="Masukkan nama"
              autoComplete="username"
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-fg">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? 'true' : undefined}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className="w-full rounded-lg border border-base bg-surface px-3 py-2 pr-10 text-sm text-fg placeholder:text-fg-placeholder focus:outline-none focus:ring-2 focus:ring-fg focus:border-transparent transition-colors"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-fg-muted hover:text-fg transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-fg font-medium">
                  ⚠ {errors.password.message}
                </p>
              )}
            </div>

            {/* API Error */}
            {apiError && (
              <div
                role="alert"
                className="rounded-lg border border-base bg-surface-muted px-3 py-2 text-sm text-fg"
              >
                ⚠ {apiError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
              className="w-full mt-2"
            >
              {isSubmitting ? 'Memverifikasi...' : 'Masuk'}
            </Button>
          </form>

          {/* Mock hint */}
          {import.meta.env.VITE_USE_MOCK === 'true' && (
            <div className="rounded-lg border border-dashed border-border-strong bg-surface-subtle p-3 text-xs text-fg-muted space-y-1">
              <p className="font-medium text-fg">Mode Demo</p>
              <p>Nama: <code className="font-mono">admin</code></p>
              <p>Password: <code className="font-mono">admin123</code></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
