import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react'
import { useSchedule, useCreateSchedule, useDeleteSchedule } from '@/features/schedule/hooks'
import { scheduleSchema, type ScheduleFormData } from '@/features/schedule/schemas'
import type { ScheduleItem } from '@/features/schedule/types'
import {
  formatDate,
  getWeekDays,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isToday,
  isSameDay,
  parseISO,
  idLocale,
  format,
} from '@/lib/utils/date'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/EmptyState'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/FormFields'
import { cn } from '@/lib/utils/cn'

type ViewMode = 'hari' | 'minggu'

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('hari')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [defaultDate, setDefaultDate] = useState<string>('')

  const { data: scheduleItems, isLoading, error, refetch } = useSchedule()
  const createMutation = useCreateSchedule()
  const deleteMutation = useDeleteSchedule()

  const navigate = (dir: 'prev' | 'next') => {
    if (viewMode === 'hari') {
      setCurrentDate((d) => dir === 'prev' ? subDays(d, 1) : addDays(d, 1))
    } else {
      setCurrentDate((d) => dir === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1))
    }
  }

  const goToday = () => setCurrentDate(new Date())

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])

  const getItemsForDate = (date: Date) => {
    if (!scheduleItems) return []
    const dateStr = format(date, 'yyyy-MM-dd')
    return scheduleItems
      .filter((s) => s.date === dateStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const todayItems = getItemsForDate(currentDate)

  const handleDelete = (id: string) => setDeleteTargetId(id)
  const confirmDelete = () => {
    if (!deleteTargetId) return
    deleteMutation.mutate(deleteTargetId, { onSuccess: () => setDeleteTargetId(null) })
  }

  const openAddForm = (date?: string) => {
    setDefaultDate(date ?? format(currentDate, 'yyyy-MM-dd'))
    setFormOpen(true)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-fg">Jadwal Pribadi</h1>
        <Button variant="primary" size="sm" onClick={() => openAddForm()}>
          <Plus size={15} /> Tambah Agenda
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* View Toggle */}
        <div className="flex rounded-lg border border-base overflow-hidden">
          {(['hari', 'minggu'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors capitalize',
                viewMode === mode
                  ? 'bg-invert text-invert'
                  : 'bg-surface text-fg-muted hover:text-fg hover:bg-surface-muted',
              )}
            >
              {mode === 'hari' ? 'Harian' : 'Mingguan'}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('prev')}
            aria-label="Sebelumnya"
            className="p-1.5 rounded-lg border border-base hover:bg-surface-muted transition-colors text-fg-muted hover:text-fg"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-base hover:bg-surface-muted transition-colors text-fg-muted hover:text-fg"
          >
            Hari Ini
          </button>

          <button
            onClick={() => navigate('next')}
            aria-label="Berikutnya"
            className="p-1.5 rounded-lg border border-base hover:bg-surface-muted transition-colors text-fg-muted hover:text-fg"
          >
            <ChevronRight size={16} />
          </button>

          {/* Date picker */}
          <input
            type="date"
            value={format(currentDate, 'yyyy-MM-dd')}
            onChange={(e) => {
              if (e.target.value) setCurrentDate(parseISO(e.target.value))
            }}
            aria-label="Pilih tanggal"
            className="rounded-lg border border-base bg-surface px-2 py-1.5 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-fg"
          />
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : error ? (
        <ErrorState message="Gagal memuat jadwal" onRetry={() => void refetch()} />
      ) : viewMode === 'hari' ? (
        <DayView
          date={currentDate}
          items={todayItems}
          onDelete={handleDelete}
          onAdd={() => openAddForm()}
        />
      ) : (
        <WeekView
          weekDays={weekDays}
          getItemsForDate={getItemsForDate}
          currentDate={currentDate}
          onDelete={handleDelete}
          onDayClick={(date) => {
            setCurrentDate(date)
            setViewMode('hari')
          }}
          onAdd={(date) => openAddForm(format(date, 'yyyy-MM-dd'))}
        />
      )}

      {/* Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Tambah Agenda" size="md">
        <ScheduleForm
          defaultDate={defaultDate}
          onSubmit={async (data) => {
            await createMutation.mutateAsync({
              title: data.title,
              date: data.date,
              start_time: data.start_time,
              end_time: data.end_time || undefined,
              location: data.location || undefined,
              notes: data.notes || undefined,
            })
            setFormOpen(false)
          }}
          isSubmitting={createMutation.isPending}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Hapus Agenda"
        description="Agenda yang dihapus tidak bisa dikembalikan. Lanjutkan?"
        confirmLabel="Hapus"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function DayView({
  date,
  items,
  onDelete,
  onAdd,
}: {
  date: Date
  items: ScheduleItem[]
  onDelete: (id: string) => void
  onAdd: () => void
}) {
  return (
    <div className="space-y-3">
      {/* Day header */}
      <div
        className={cn(
          'rounded-xl border p-4 flex items-center gap-3',
          isToday(date)
            ? 'border-fg bg-invert text-invert'
            : 'border-base bg-surface-subtle',
        )}
      >
        <Calendar size={18} />
        <div>
          <p className={cn('font-bold text-base', isToday(date) ? 'text-invert' : 'text-fg')}>
            {formatDate(date, 'EEEE, dd MMMM yyyy')}
          </p>
          {isToday(date) && <p className="text-xs opacity-70">Hari ini</p>}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Tidak ada agenda"
          description="Belum ada agenda untuk hari ini"
          action={{ label: 'Tambah Agenda', onClick: onAdd }}
          icon={<Calendar size={40} strokeWidth={1} />}
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ScheduleItemCard key={item._id} item={item} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function WeekView({
  weekDays,
  getItemsForDate,
  currentDate,
  onDelete,
  onDayClick,
  onAdd,
}: {
  weekDays: Date[]
  getItemsForDate: (date: Date) => ScheduleItem[]
  currentDate: Date
  onDelete: (id: string) => void
  onDayClick: (date: Date) => void
  onAdd: (date: Date) => void
}) {
  return (
    <div>
      {/* Week header label */}
      <p className="text-sm text-fg-muted mb-3">
        {formatDate(weekDays[0] as Date, 'dd MMM')} – {formatDate(weekDays[6] as Date, 'dd MMM yyyy')}
      </p>

      {/* Week grid - scrollable on mobile */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[600px]">
          {weekDays.map((day) => {
            const dayItems = getItemsForDate(day)
            const isTodayDay = isToday(day)
            const isCurrentDay = isSameDay(day, currentDate)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'rounded-xl border transition-all min-h-[120px]',
                  isTodayDay ? 'border-fg' : 'border-base',
                )}
              >
                {/* Day header */}
                <button
                  onClick={() => onDayClick(day)}
                  className={cn(
                    'w-full p-2 text-center rounded-t-xl transition-colors',
                    isTodayDay ? 'bg-invert' : isCurrentDay ? 'bg-surface-muted' : 'hover:bg-surface-subtle',
                  )}
                >
                  <p className={cn('text-xs font-medium', isTodayDay ? 'text-invert' : 'text-fg-muted')}>
                    {format(day, 'EEE', { locale: idLocale })}
                  </p>
                  <p className={cn('text-base font-bold', isTodayDay ? 'text-invert' : 'text-fg')}>
                    {format(day, 'd')}
                  </p>
                </button>

                {/* Items */}
                <div className="p-1.5 space-y-1">
                  {dayItems.map((item) => (
                    <div
                      key={item._id}
                      className="group relative rounded-md bg-surface-muted border border-base p-1.5 cursor-default"
                    >
                      <p className="text-xs font-medium text-fg truncate leading-tight">{item.title}</p>
                      <p className="text-xs text-fg-subtle">{item.start_time}</p>
                      <button
                        onClick={() => onDelete(item._id)}
                        aria-label={`Hapus agenda ${item.title}`}
                        className="absolute top-0.5 right-0.5 hidden group-hover:flex p-0.5 rounded text-fg-subtle hover:text-fg"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => onAdd(day)}
                    aria-label={`Tambah agenda ${formatDate(day)}`}
                    className="w-full text-center py-1 rounded text-xs text-fg-subtle hover:text-fg hover:bg-surface-muted transition-colors"
                  >
                    <Plus size={12} className="inline" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ScheduleItemCard({
  item,
  onDelete,
}: {
  item: ScheduleItem
  onDelete: (id: string) => void
}) {
  return (
    <div className="group flex gap-3 rounded-xl border border-base bg-surface p-4 hover:bg-surface-subtle hover:border-border-strong transition-all">
      {/* Time column */}
      <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
        <span className="text-xs font-mono font-medium text-fg">{item.start_time}</span>
        {item.end_time && (
          <>
            <div className="flex-1 w-px bg-border min-h-[12px]" style={{ minHeight: '12px' }} />
            <span className="text-xs font-mono text-fg-subtle">{item.end_time}</span>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-fg">{item.title}</p>
        {item.location && (
          <p className="text-xs text-fg-muted flex items-center gap-1 mt-1">
            <MapPin size={11} /> {item.location}
          </p>
        )}
        {item.end_time && (
          <p className="text-xs text-fg-subtle flex items-center gap-1 mt-1">
            <Clock size={11} /> {item.start_time} – {item.end_time}
          </p>
        )}
        {item.notes && (
          <p className="text-xs text-fg-subtle mt-1.5">{item.notes}</p>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(item._id)}
        aria-label={`Hapus agenda ${item.title}`}
        className="shrink-0 p-1.5 rounded text-fg-subtle hover:text-fg hover:bg-surface-emphasis transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function ScheduleForm({
  defaultDate,
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  defaultDate: string
  onSubmit: (data: ScheduleFormData) => Promise<void>
  isSubmitting: boolean
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      date: defaultDate,
      start_time: '08:00',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Input
        label="Judul Agenda"
        placeholder="cth. Kuliah Basis Data"
        error={errors.title?.message}
        {...register('title')}
      />

      <Input
        label="Tanggal"
        type="date"
        error={errors.date?.message}
        {...register('date')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Jam Mulai"
          type="time"
          error={errors.start_time?.message}
          {...register('start_time')}
        />
        <Input
          label="Jam Selesai (opsional)"
          type="time"
          error={errors.end_time?.message}
          {...register('end_time')}
        />
      </div>

      <Input
        label="Lokasi (opsional)"
        placeholder="cth. Gedung A - Lab 301"
        {...register('location')}
      />

      <Textarea
        label="Catatan (opsional)"
        placeholder="Tambahkan catatan..."
        {...register('notes')}
      />

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
          Batal
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
          Simpan Agenda
        </Button>
      </div>
    </form>
  )
}
