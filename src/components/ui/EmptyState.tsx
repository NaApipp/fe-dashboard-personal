import type React from 'react'
import { PackageOpen } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      <div className="text-fg-subtle">
        {icon ?? <PackageOpen size={40} strokeWidth={1} />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Terjadi kesalahan', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      <div className="text-fg-subtle">
        <span className="text-3xl">⚠</span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-fg">Gagal memuat data</p>
        <p className="text-sm text-fg-muted">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  )
}
