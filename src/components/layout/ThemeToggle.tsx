import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/components/ui/ThemeContext'
import { cn } from '@/lib/utils/cn'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const options: { value: typeof theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Mode terang' },
    { value: 'dark', icon: Moon, label: 'Mode gelap' },
    { value: 'system', icon: Monitor, label: 'Ikut sistem' },
  ]

  return (
    <div
      className="flex items-center rounded-lg border border-base bg-surface-muted p-0.5 gap-0.5"
      role="group"
      aria-label="Pilih tema"
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          aria-pressed={theme === value}
          title={label}
          className={cn(
            'flex-1 flex items-center justify-center rounded-md p-2 transition-colors duration-150',
            theme === value
              ? 'bg-surface text-fg shadow-sm'
              : 'text-fg-subtle hover:text-fg-muted',
          )}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}
