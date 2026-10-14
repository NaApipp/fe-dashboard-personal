import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Mail, BookOpen, Calendar, ArrowRight, Clock, AlertTriangle } from 'lucide-react'
import { useMessages } from '@/features/messages/hooks'
import { useAssignments } from '@/features/assignments/hooks'
import { useSchedule } from '@/features/schedule/hooks'
import { getReadIds } from '@/features/messages/messageState'
import { formatRelative, formatDate, isToday, parseISO } from '@/lib/utils/date'
import { getDeadlineLabel } from '@/lib/utils/date'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils/cn'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: messages, isLoading: msgLoading, error: msgError, refetch: msgRefetch } = useMessages()
  const { data: assignments, isLoading: asgLoading, error: asgError, refetch: asgRefetch } = useAssignments()
  const { data: schedule, isLoading: schLoading, error: schError, refetch: schRefetch } = useSchedule()

  const readIds = getReadIds()
  const unreadCount = messages ? messages.filter((m) => !readIds.has(m._id)).length : 0
  const pendingAssignments = assignments
    ? assignments.filter((a) => a.status !== 'selesai').length
    : 0
  const todaySchedule = schedule
    ? schedule.filter((s) => isToday(parseISO(s.date)))
    : []

  const nearestDeadline = assignments
    ? assignments
        .filter((a) => a.status !== 'selesai')
        .sort((a, b) => {
          const da = `${a.deadline[0]}T${a.deadline[1]}`
          const db = `${b.deadline[0]}T${b.deadline[1]}`
          return da.localeCompare(db)
        })[0]
    : null

  const recentMessages = messages?.slice(0, 5) ?? []
  const nearestAssignments = assignments
    ? [...assignments]
        .filter((a) => a.status !== 'selesai')
        .sort((a, b) => {
          const da = `${a.deadline[0]}T${a.deadline[1]}`
          const db = `${b.deadline[0]}T${b.deadline[1]}`
          return da.localeCompare(db)
        })
        .slice(0, 5)
    : []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-fg">
          Selamat datang, {user?.name ?? '—'} 👋
        </h1>
        <p className="text-sm text-fg-muted mt-1">{formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          to="/messages"
          icon={<Mail size={18} strokeWidth={1.75} />}
          label="Pesan Belum Dibaca"
          value={msgLoading ? '...' : unreadCount.toString()}
          loading={msgLoading}
        />
        <SummaryCard
          to="/assignments"
          icon={<BookOpen size={18} strokeWidth={1.75} />}
          label="Tugas Belum Selesai"
          value={asgLoading ? '...' : pendingAssignments.toString()}
          loading={asgLoading}
        />
        <SummaryCard
          to="/assignments"
          icon={<AlertTriangle size={18} strokeWidth={1.75} />}
          label="Deadline Terdekat"
          value={
            asgLoading
              ? '...'
              : nearestDeadline
              ? formatDate(parseISO(nearestDeadline.deadline[0]))
              : 'Tidak ada'
          }
          small
          loading={asgLoading}
        />
        <SummaryCard
          to="/schedule"
          icon={<Calendar size={18} strokeWidth={1.75} />}
          label="Agenda Hari Ini"
          value={schLoading ? '...' : todaySchedule.length.toString()}
          loading={schLoading}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Messages */}
        <div className="lg:col-span-1 space-y-3">
          <SectionHeader title="Pesan Terbaru" to="/messages" />
          {msgLoading ? (
            <ListSkeleton count={3} />
          ) : msgError ? (
            <ErrorState message="Gagal memuat pesan" onRetry={() => void msgRefetch()} />
          ) : recentMessages.length === 0 ? (
            <EmptyNotice text="Belum ada pesan" />
          ) : (
            <div className="space-y-2">
              {recentMessages.map((msg) => {
                const isRead = readIds.has(msg._id)
                return (
                  <Link
                    key={msg._id}
                    to={`/messages?id=${msg._id}`}
                    className="flex items-start gap-3 rounded-lg border border-base bg-surface p-3 hover:bg-surface-subtle transition-colors group"
                  >
                    <div
                      className={cn(
                        'mt-1.5 h-1.5 w-1.5 rounded-full shrink-0',
                        isRead ? 'bg-transparent border border-border-strong' : 'bg-fg',
                      )}
                      aria-label={isRead ? 'Sudah dibaca' : 'Belum dibaca'}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm truncate', isRead ? 'text-fg-muted' : 'text-fg font-medium')}>
                        {msg.name}
                      </p>
                      <p className="text-xs text-fg-subtle truncate">{msg.message}</p>
                      <p className="text-xs text-fg-subtle mt-1">{formatRelative(msg.date)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Nearest Assignments */}
        <div className="lg:col-span-1 space-y-3">
          <SectionHeader title="Tugas Terdekat" to="/assignments" />
          {asgLoading ? (
            <ListSkeleton count={3} />
          ) : asgError ? (
            <ErrorState message="Gagal memuat tugas" onRetry={() => void asgRefetch()} />
          ) : nearestAssignments.length === 0 ? (
            <EmptyNotice text="Tidak ada tugas tertunda" />
          ) : (
            <div className="space-y-2">
              {nearestAssignments.map((a) => {
                const deadlineLabel = getDeadlineLabel(`${a.deadline[0]}T${a.deadline[1]}`)
                return (
                  <Link
                    key={a._id}
                    to="/assignments"
                    className="block rounded-lg border border-base bg-surface p-3 hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-fg truncate">{a.title}</p>
                      {deadlineLabel && (
                        <span className="text-xs text-fg-muted shrink-0 font-mono">
                          {deadlineLabel === 'terlambat' ? '⚠ Terlambat' :
                           deadlineLabel === 'hari-ini' ? '⏰ Hari ini' : '📅 Besok'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-fg-subtle mt-1">{a.subject}</p>
                    <p className="text-xs text-fg-subtle">
                      {formatDate(parseISO(a.deadline[0]))} pukul {a.deadline[1]}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="lg:col-span-1 space-y-3">
          <SectionHeader title="Agenda Hari Ini" to="/schedule" />
          {schLoading ? (
            <ListSkeleton count={3} />
          ) : schError ? (
            <ErrorState message="Gagal memuat jadwal" onRetry={() => void schRefetch()} />
          ) : todaySchedule.length === 0 ? (
            <EmptyNotice text="Tidak ada agenda hari ini" />
          ) : (
            <div className="space-y-2">
              {todaySchedule
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((s) => (
                  <Link
                    key={s._id}
                    to="/schedule"
                    className="block rounded-lg border border-base bg-surface p-3 hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-fg-subtle shrink-0" />
                      <span className="text-xs font-mono text-fg-muted">
                        {s.start_time}{s.end_time ? ` – ${s.end_time}` : ''}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-fg mt-1">{s.title}</p>
                    {s.location && (
                      <p className="text-xs text-fg-subtle">{s.location}</p>
                    )}
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  to,
  icon,
  label,
  value,
  small = false,
  loading = false,
}: {
  to: string
  icon: ReactNode
  label: string
  value: string
  small?: boolean
  loading?: boolean
}) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-base bg-surface p-4 hover:bg-surface-subtle hover:border-border-strong transition-all group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-fg-muted group-hover:text-fg transition-colors">{icon}</span>
        <ArrowRight size={14} className="text-fg-subtle group-hover:text-fg-muted transition-colors" />
      </div>
      <p className={cn('font-bold text-fg', small ? 'text-base' : 'text-2xl')}>
        {loading ? <span className="inline-block h-4 w-12 bg-surface-emphasis rounded animate-skeleton" /> : value}
      </p>
      <p className="text-xs text-fg-muted mt-1">{label}</p>
    </Link>
  )
}

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      <Link to={to} className="text-xs text-fg-muted hover:text-fg transition-colors flex items-center gap-1">
        Lihat semua <ArrowRight size={12} />
      </Link>
    </div>
  )
}

function EmptyNotice({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-base py-6 text-center">
      <p className="text-xs text-fg-subtle">{text}</p>
    </div>
  )
}
