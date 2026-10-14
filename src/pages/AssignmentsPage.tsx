import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  AlertTriangle,
  Clock,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import { useAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment } from '@/features/assignments/hooks'
import { assignmentSchema, type AssignmentFormData } from '@/features/assignments/schemas'
import type { Assignment, AssignmentStatus, AssignmentPriority } from '@/features/assignments/types'
import { getDeadlineLabel, formatDate, parseISO } from '@/lib/utils/date'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/EmptyState'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/FormFields'
import { cn } from '@/lib/utils/cn'

type SortField = 'deadline' | 'priority' | 'created_at'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER: Record<AssignmentPriority, number> = { rendah: 0, sedang: 1, tinggi: 2 }
const STATUS_LABELS: Record<AssignmentStatus, string> = { belum: 'Belum', proses: 'Proses', selesai: 'Selesai' }

export default function AssignmentsPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | 'semua'>('semua')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterPriority, setFilterPriority] = useState<AssignmentPriority | 'semua'>('semua')
  const [filterDeadlineFrom, setFilterDeadlineFrom] = useState('')
  const [filterDeadlineTo, setFilterDeadlineTo] = useState('')
  const [sortField, setSortField] = useState<SortField>('deadline')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Assignment | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { data: assignments, isLoading, error, refetch } = useAssignments()
  const createMutation = useCreateAssignment()
  const updateMutation = useUpdateAssignment()
  const deleteMutation = useDeleteAssignment()

  // Unique subjects for filter
  const subjects = useMemo(() => {
    if (!assignments) return []
    return [...new Set(assignments.map((a) => a.subject))].sort()
  }, [assignments])

  // Filter + sort
  const filtered = useMemo(() => {
    if (!assignments) return []
    return assignments
      .filter((a) => {
        if (search && !a.title.toLowerCase().includes(search.toLowerCase()) &&
            !a.subject.toLowerCase().includes(search.toLowerCase())) return false
        if (filterStatus !== 'semua' && a.status !== filterStatus) return false
        if (filterSubject && a.subject !== filterSubject) return false
        if (filterPriority !== 'semua' && a.priority !== filterPriority) return false
        if (filterDeadlineFrom && a.deadline[0] < filterDeadlineFrom) return false
        if (filterDeadlineTo && a.deadline[0] > filterDeadlineTo) return false
        return true
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortField === 'deadline') {
          const da = `${a.deadline[0]}T${a.deadline[1]}`
          const db = `${b.deadline[0]}T${b.deadline[1]}`
          cmp = da.localeCompare(db)
        } else if (sortField === 'priority') {
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        } else {
          cmp = (a.created_at ?? '').localeCompare(b.created_at ?? '')
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [assignments, search, filterStatus, filterSubject, filterPriority, filterDeadlineFrom, filterDeadlineTo, sortField, sortDir])

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const handleToggleDone = (assignment: Assignment) => {
    const newStatus: AssignmentStatus = assignment.status === 'selesai' ? 'belum' : 'selesai'
    updateMutation.mutate({ id: assignment._id, payload: { status: newStatus } })
  }

  const handleEdit = (a: Assignment) => {
    setEditTarget(a)
    setFormOpen(true)
  }

  const handleDelete = (id: string) => setDeleteTargetId(id)

  const confirmDelete = () => {
    if (!deleteTargetId) return
    deleteMutation.mutate(deleteTargetId, { onSuccess: () => setDeleteTargetId(null) })
  }

  const openCreate = () => { setEditTarget(null); setFormOpen(true) }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-fg">Tugas Kuliah</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus size={15} /> Tambah Tugas
        </Button>
      </div>

      {/* Toolbar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
            <input
              type="search"
              placeholder="Cari judul atau mata kuliah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-base bg-surface pl-9 pr-4 py-2 text-sm text-fg placeholder:text-fg-placeholder focus:outline-none focus:ring-2 focus:ring-fg"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
          >
            Filter <ChevronDown size={13} className={cn('transition-transform', showFilters && 'rotate-180')} />
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-lg border border-base bg-surface-subtle animate-fade-in">
            <Select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AssignmentStatus | 'semua')}
              options={[
                { value: 'semua', label: 'Semua status' },
                { value: 'belum', label: 'Belum' },
                { value: 'proses', label: 'Proses' },
                { value: 'selesai', label: 'Selesai' },
              ]}
            />
            <Select
              label="Mata Kuliah"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              options={[
                { value: '', label: 'Semua matkul' },
                ...subjects.map((s) => ({ value: s, label: s })),
              ]}
            />
            <Select
              label="Prioritas"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as AssignmentPriority | 'semua')}
              options={[
                { value: 'semua', label: 'Semua prioritas' },
                { value: 'tinggi', label: 'Tinggi' },
                { value: 'sedang', label: 'Sedang' },
                { value: 'rendah', label: 'Rendah' },
              ]}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg">Deadline</label>
              <div className="flex items-center gap-1">
                <input type="date" value={filterDeadlineFrom} onChange={(e) => setFilterDeadlineFrom(e.target.value)}
                  aria-label="Deadline dari"
                  className="flex-1 rounded border border-base bg-surface px-1.5 py-1 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-fg" />
                <span className="text-xs text-fg-subtle">–</span>
                <input type="date" value={filterDeadlineTo} onChange={(e) => setFilterDeadlineTo(e.target.value)}
                  aria-label="Deadline sampai"
                  className="flex-1 rounded border border-base bg-surface px-1.5 py-1 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-fg" />
              </div>
            </div>
          </div>
        )}

        {/* Sort bar */}
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          <span>Urutkan:</span>
          {(['deadline', 'priority', 'created_at'] as SortField[]).map((f) => (
            <button
              key={f}
              onClick={() => handleToggleSort(f)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded border transition-colors',
                sortField === f ? 'bg-invert text-invert border-transparent' : 'border-base hover:bg-surface-muted',
              )}
            >
              {f === 'deadline' ? 'Deadline' : f === 'priority' ? 'Prioritas' : 'Dibuat'}
              {sortField === f && (sortDir === 'asc' ? <SortAsc size={11} /> : <SortDesc size={11} />)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <ListSkeleton count={5} />
      ) : error ? (
        <ErrorState message="Gagal memuat tugas" onRetry={() => void refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada tugas"
          description="Belum ada tugas yang sesuai filter"
          action={{ label: 'Tambah Tugas', onClick: openCreate }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <AssignmentItem
              key={a._id}
              assignment={a}
              onToggleDone={() => handleToggleDone(a)}
              onEdit={() => handleEdit(a)}
              onDelete={() => handleDelete(a._id)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? 'Edit Tugas' : 'Tambah Tugas'}
        size="md"
      >
        <AssignmentForm
          defaultValues={editTarget}
          onSubmit={async (data) => {
            const payload = {
              title: data.title,
              subject: data.subject,
              deadline: [data.deadlineDate, data.deadlineTime] as [string, string],
              priority: data.priority,
              status: data.status,
              notes: data.notes,
            }
            if (editTarget) {
              await updateMutation.mutateAsync({ id: editTarget._id, payload })
            } else {
              await createMutation.mutateAsync(payload)
            }
            setFormOpen(false)
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Hapus Tugas"
        description="Tugas yang dihapus tidak bisa dikembalikan. Lanjutkan?"
        confirmLabel="Hapus"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function AssignmentItem({
  assignment: a,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  assignment: Assignment
  onToggleDone: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const deadlineLabel = getDeadlineLabel(`${a.deadline[0]}T${a.deadline[1]}`)
  const isDone = a.status === 'selesai'

  const priorityShape = {
    tinggi: '◆',
    sedang: '◇',
    rendah: '△',
  }

  return (
    <div
      className={cn(
        'group rounded-lg border bg-surface transition-all',
        isDone ? 'border-base opacity-60' : 'border-base hover:border-border-strong hover:bg-surface-subtle',
      )}
    >
      <div className="flex items-start gap-3 p-3.5">
        {/* Checkbox */}
        <button
          onClick={onToggleDone}
          aria-label={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
          className="mt-0.5 shrink-0 text-fg-muted hover:text-fg transition-colors"
        >
          {isDone ? <CheckSquare size={18} strokeWidth={1.75} /> : <Square size={18} strokeWidth={1.75} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className={cn('text-sm font-medium text-fg', isDone && 'line-through text-fg-muted')}>
              {a.title}
            </p>
            {/* Priority indicator */}
            <span className="text-xs text-fg-subtle" title={`Prioritas ${a.priority}`}>
              {priorityShape[a.priority]}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-fg-subtle">{a.subject}</span>
            <span className="text-xs text-fg-subtle flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(parseISO(a.deadline[0]))} pukul {a.deadline[1]}
            </span>
            {deadlineLabel && !isDone && (
              <span className="text-xs font-medium flex items-center gap-1 text-fg">
                {deadlineLabel === 'terlambat' ? (
                  <><AlertTriangle size={11} /> Terlambat</>
                ) : deadlineLabel === 'hari-ini' ? (
                  <><Clock size={11} /> Hari ini</>
                ) : (
                  <><Calendar size={11} /> Besok</>
                )}
              </span>
            )}
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full border',
                a.status === 'selesai' ? 'bg-invert text-invert border-transparent' :
                a.status === 'proses' ? 'border-border-strong text-fg' :
                'border-dashed border-border-strong text-fg-muted',
              )}
            >
              {STATUS_LABELS[a.status]}
            </span>
          </div>

          {a.notes && (
            <p className="text-xs text-fg-subtle mt-1.5 line-clamp-2">{a.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            aria-label="Edit tugas"
            className="p-1.5 rounded text-fg-subtle hover:text-fg hover:bg-surface-emphasis transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onDelete}
            aria-label="Hapus tugas"
            className="p-1.5 rounded text-fg-subtle hover:text-fg hover:bg-surface-emphasis transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignmentForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  defaultValues: Assignment | null
  onSubmit: (data: AssignmentFormData) => Promise<void>
  isSubmitting: boolean
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: defaultValues
      ? {
          title: defaultValues.title,
          subject: defaultValues.subject,
          deadlineDate: defaultValues.deadline[0],
          deadlineTime: defaultValues.deadline[1],
          priority: defaultValues.priority,
          status: defaultValues.status,
          notes: defaultValues.notes ?? '',
        }
      : {
          priority: 'sedang',
          status: 'belum',
          deadlineTime: '23:59',
        },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Input
        label="Judul Tugas"
        placeholder="cth. Laporan Praktikum Basis Data"
        error={errors.title?.message}
        {...register('title')}
      />
      <Input
        label="Mata Kuliah"
        placeholder="cth. Basis Data"
        error={errors.subject?.message}
        {...register('subject')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Tanggal Deadline"
          type="date"
          error={errors.deadlineDate?.message}
          {...register('deadlineDate')}
        />
        <Input
          label="Jam Deadline"
          type="time"
          error={errors.deadlineTime?.message}
          {...register('deadlineTime')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Prioritas"
          error={errors.priority?.message}
          options={[
            { value: 'rendah', label: 'Rendah' },
            { value: 'sedang', label: 'Sedang' },
            { value: 'tinggi', label: 'Tinggi' },
          ]}
          {...register('priority')}
        />
        <Select
          label="Status"
          error={errors.status?.message}
          options={[
            { value: 'belum', label: 'Belum' },
            { value: 'proses', label: 'Proses' },
            { value: 'selesai', label: 'Selesai' },
          ]}
          {...register('status')}
        />
      </div>

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
          {defaultValues ? 'Simpan Perubahan' : 'Tambah Tugas'}
        </Button>
      </div>
    </form>
  )
}
