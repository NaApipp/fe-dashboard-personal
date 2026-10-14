import React from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-fg"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-placeholder',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-fg focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-fg ring-1 ring-fg',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-fg font-medium">
            ⚠ {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-fg-subtle">
            {hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-fg">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm text-fg',
            'transition-colors duration-150 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-fg focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-fg ring-1 ring-fg',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p role="alert" className="text-xs text-fg font-medium">
            ⚠ {error}
          </p>
        )}
      </div>
    )
  },
)
Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-fg">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            'w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-placeholder resize-y',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-fg focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-fg ring-1 ring-fg',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {error && (
          <p role="alert" className="text-xs text-fg font-medium">
            ⚠ {error}
          </p>
        )}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
