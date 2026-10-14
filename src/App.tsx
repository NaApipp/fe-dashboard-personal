import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ThemeProvider } from '@/components/ui/ThemeContext'
import { ToastProvider } from '@/components/ui/ToastContext'
import { AuthProvider } from '@/features/auth/AuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import MessagesPage from '@/pages/MessagesPage'
import AssignmentsPage from '@/pages/AssignmentsPage'
import SchedulePage from '@/pages/SchedulePage'
import NotFoundPage from '@/pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
})

// Global Error Boundary — prevents black screen on uncaught render errors
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console for debugging — can swap to Sentry/etc in production
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg text-fg px-4">
          <div className="max-w-md w-full text-center space-y-4">
            <p className="text-4xl">⚠️</p>
            <h1 className="text-lg font-semibold">Terjadi Kesalahan</h1>
            <p className="text-sm text-fg-muted font-mono bg-surface border border-base rounded-lg p-3 text-left break-all">
              {this.state.error.message}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 rounded-lg border border-base text-sm hover:bg-surface-subtle transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <ErrorBoundary>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
                    <Route path="messages" element={<ErrorBoundary><MessagesPage /></ErrorBoundary>} />
                    <Route path="assignments" element={<ErrorBoundary><AssignmentsPage /></ErrorBoundary>} />
                    <Route path="schedule" element={<ErrorBoundary><SchedulePage /></ErrorBoundary>} />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </ErrorBoundary>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
