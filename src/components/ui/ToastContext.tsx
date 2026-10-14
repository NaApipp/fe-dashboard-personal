import React, { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[]
  onRemove: (id: string) => void
}) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      role="region"
      aria-label="Notifikasi"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: <CheckCircle size={16} className="shrink-0" />,
    error: <XCircle size={16} className="shrink-0" />,
    info: <Info size={16} className="shrink-0" />,
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg animate-slide-in-up',
        'bg-surface border-base',
        'min-w-[260px] max-w-[360px]',
      )}
    >
      <span className="text-fg-muted">{icons[toast.type]}</span>
      <span className="text-fg flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Tutup notifikasi"
        className="text-fg-subtle hover:text-fg transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
