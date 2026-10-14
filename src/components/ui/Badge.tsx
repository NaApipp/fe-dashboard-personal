import type React from 'react'
import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'outline' | 'solid' | 'dot'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'outline', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        variant === 'outline' && 'border border-border-strong text-fg',
        variant === 'solid' && 'bg-invert text-invert',
        variant === 'dot' &&
          'border border-base text-fg-muted before:content-[""] before:block before:w-1.5 before:h-1.5 before:rounded-full before:bg-fg-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

interface StatusBadgeProps {
  label: string
  shape: 'filled' | 'outlined' | 'dashed'
  icon?: React.ReactNode
}

export function StatusBadge({ label, shape, icon }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        shape === 'filled' && 'bg-invert text-invert',
        shape === 'outlined' && 'border border-border-strong text-fg bg-surface',
        shape === 'dashed' && 'border border-dashed border-border-strong text-fg-muted bg-surface',
      )}
    >
      {icon}
      {label}
    </span>
  )
}
