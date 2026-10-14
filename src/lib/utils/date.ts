import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isPast,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameDay,
} from 'date-fns'
import { id } from 'date-fns/locale'

function toDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (isNaN(d.getTime())) return null
    return d
  } catch {
    return null
  }
}

export function formatDate(date: string | Date | null | undefined, fmt = 'dd MMM yyyy'): string {
  const d = toDate(date)
  if (!d) return '—'
  try {
    return format(d, fmt, { locale: id })
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return '—'
  try {
    return format(d, 'dd MMM yyyy, HH:mm', { locale: id })
  } catch {
    return '—'
  }
}

export function formatRelative(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return '—'
  try {
    return formatDistanceToNow(d, { addSuffix: true, locale: id })
  } catch {
    return '—'
  }
}

export function formatTime(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return '—'
  try {
    return format(d, 'HH:mm', { locale: id })
  } catch {
    return '—'
  }
}

export function getDeadlineLabel(dateStr: string | null | undefined): 'terlambat' | 'hari-ini' | 'besok' | null {
  const d = toDate(dateStr)
  if (!d) return null
  try {
    if (isPast(d) && !isToday(d)) return 'terlambat'
    if (isToday(d)) return 'hari-ini'
    if (isTomorrow(d)) return 'besok'
    return null
  } catch {
    return null
  }
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export {
  isToday,
  isTomorrow,
  isPast,
  parseISO,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameDay,
  format,
  id as idLocale,
}
