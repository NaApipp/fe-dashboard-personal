import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Mail, BookOpen, Calendar, LogOut, X } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils/cn'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Ringkasan' },
  { to: '/messages', icon: Mail, label: 'Pesan' },
  { to: '/assignments', icon: BookOpen, label: 'Tugas' },
  { to: '/schedule', icon: Calendar, label: 'Jadwal' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-fg opacity-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-60 flex flex-col border-r border-base bg-surface',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navigasi utama"
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-base">
          <div>
            <p className="text-sm font-bold text-fg tracking-tight">Dashboard</p>
            <p className="text-xs text-fg-muted mt-0.5">{user?.name ?? '—'}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="lg:hidden rounded-md p-1 text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive =
              to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-invert text-invert'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-muted',
                )}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 1.75} />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-base space-y-1">
          <ThemeToggle />
          <button
            onClick={() => {
              onClose()
              void logout()
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors"
            aria-label="Keluar dari akun"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  )
}
