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
  MapPin,
  ListTodo,
  ExternalLink,
} from 'lucide-react'
import { useAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment } from '@/features/assignments/hooks'
import { assignmentSchema, type AssignmentFormData } from '@/features/assignments/schemas'
import type { Assignment, AssignmentStatus, AssignmentPriority, CreateAssignmentPayload } from '@/features/assignments/types'
import { getDeadlineLabel, formatDate, parseISO } from '@/lib/utils/date'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/EmptyState'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/FormFields'
import { cn } from '@/lib/utils/cn'

type SortField = 'deadline' | 'priority' | 'createdAt'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER: Record<string, number> = {
  low: 0,
  rendah: 0,
  medium: 1,
  sedang: 1,
  high: 2,
  tinggi: 2,
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  belum: 'Pending',
  in_progress: 'In Progress',
  proses: 'In Progress',
  completed: 'Completed',
  selesai: 'Completed',
}

const normalizeStatusKey = (s: string) => {
  if (s === 'selesai' || s === 'completed' || s === 'done') return 'completed'
  if (s === 'proses' || s === 'in_progress') return 'in_progress'
  return 'pending'
}

const normalizePriorityKey = (p: string) => {
  if (p === 'tinggi' || p === 'high') return 'high'
  if (p === 'rendah' || p === 'low') return 'low'
  return 'medium'
}

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
    return [...new Set(assignments.map((a) => a.subject).filter(Boolean) as string[])].sort()
  }, [assignments])

  // Filter + sort
  const filtered = useMemo(() => {
    if (!assignments) return []
    return assignments
      .filter((a) => {
        const titleMatch = a.title.toLowerCase().includes(search.toLowerCase())
        const subjectMatch = (a.subject ?? '').toLowerCase().includes(search.toLowerCase())
        const locMatch = (a.location ?? '').toLowerCase().includes(search.toLowerCase())
        const descMatch = (a.description ?? a.notes ?? '').toLowerCase().includes(search.toLowerCase())
        if (search && !titleMatch && !subjectMatch && !locMatch && !descMatch) return false

        if (filterStatus !== 'semua') {
          if (normalizeStatusKey(a.status) !== normalizeStatusKey(filterStatus)) return false
        }
        if (filterSubject && a.subject !== filterSubject) return false
        if (filterPriority !== 'semua') {
          if (normalizePriorityKey(a.priority) !== normalizePriorityKey(filterPriority)) return false
        }
        if (filterDeadlineFrom) {
          const d = Array.isArray(a.deadline) ? a.deadline[0] : a.deadline
          if (d < filterDeadlineFrom) return false
        }
        if (filterDeadlineTo) {
          const d = Array.isArray(a.deadline) ? a.deadline[0] : a.deadline
          if (d > filterDeadlineTo) return false
        }
        return true
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortField === 'deadline') {
          const da = Array.isArray(a.deadline) ? `${a.deadline[0]}T${a.deadline[1]}` : a.deadline
          const db = Array.isArray(b.deadline) ? `${b.deadline[0]}T${b.deadline[1]}` : b.deadline
          cmp = da.localeCompare(db)
        } else if (sortField === 'priority') {
          cmp = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
        } else {
          const dateA = a.createdAt ?? a.created_at ?? ''
          const dateB = b.createdAt ?? b.created_at ?? ''
          cmp = dateA.localeCompare(dateB)
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [assignments, search, filterStatus, filterSubject, filterPriority, filterDeadlineFrom, filterDeadlineTo, sortField, sortDir])

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleToggleDone = (assignment: Assignment) => {
    const isDone = normalizeStatusKey(assignment.status) === 'completed'
    const newStatus: AssignmentStatus = isDone ? 'pending' : 'completed'
    const dStr = Array.isArray(assignment.deadline)
      ? `${assignment.deadline[0]}T${assignment.deadline[1] || '00:00'}`
      : String(assignment.deadline)

    // BE updateAsignmentSchema requires all fields validated
    updateMutation.mutate({
      id: assignment._id,
      payload: {
        title: assignment.title,
        description: assignment.description || 'Deskripsi tugas dashboard personal',
        status: newStatus,
        priority: assignment.priority,
        deadline: dStr.length >= 10 ? dStr : dStr.padEnd(10, '0'),
        location: assignment.location || 'Jakarta Selatan',
        checklist: assignment.checklist || [],
        references: assignment.references || [],
      },
    })
  }

  const handleEdit = (a: Assignment) => {
    setEditTarget(a)
    setFormOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteTargetId(id)
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    await deleteMutation.mutateAsync(deleteTargetId)
    setDeleteTargetId(null)
  }

  const openCreate = () => {
    setEditTarget(null)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-fg">Tugas</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            {assignments ? `${assignments.length} total tugas` : 'Memuat data...'}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate} className="self-start sm:self-auto">
          <Plus size={15} />
          Tambah Tugas
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
            <input
              type="text"
              placeholder="Cari judul, matkul, lokasi, atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-base bg-surface pl-8 pr-3 py-1.5 text-xs text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-fg transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors',
              showFilters || filterStatus !== 'semua' || filterSubject || filterPriority !== 'semua' || filterDeadlineFrom || filterDeadlineTo
                ? 'bg-invert text-invert border-transparent'
                : 'border-base text-fg hover:bg-surface-muted',
            )}
          >
            Filter
            <ChevronDown size={13} className={cn('transition-transform', showFilters && 'rotate-180')} />
          </button>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg border border-base bg-surface-subtle animate-fade-in text-xs">
            <Select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AssignmentStatus | 'semua')}
              options={[
                { value: 'semua', label: 'Semua status' },
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
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
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg">Deadline</label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={filterDeadlineFrom}
                  onChange={(e) => setFilterDeadlineFrom(e.target.value)}
                  aria-label="Deadline dari"
                  className="flex-1 rounded border border-base bg-surface px-1.5 py-1 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-fg"
                />
                <span className="text-xs text-fg-subtle">–</span>
                <input
                  type="date"
                  value={filterDeadlineTo}
                  onChange={(e) => setFilterDeadlineTo(e.target.value)}
                  aria-label="Deadline sampai"
                  className="flex-1 rounded border border-base bg-surface px-1.5 py-1 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-fg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sort bar */}
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          <span>Urutkan:</span>
          {(['deadline', 'priority', 'createdAt'] as SortField[]).map((f) => (
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
            const payload: CreateAssignmentPayload = {
              title: data.title,
              description: data.description,
              status: data.status,
              priority: data.priority,
              deadline: [data.deadlineDate, data.deadlineTime],
              location: data.location,
              checklist: editTarget?.checklist ?? [],
              references: editTarget?.references ?? [],
              ...(data.subject ? { subject: data.subject } : {}),
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
  const deadlineStr = Array.isArray(a.deadline) ? `${a.deadline[0]}T${a.deadline[1]}` : a.deadline
  const deadlineLabel = getDeadlineLabel(deadlineStr)
  const isDone = normalizeStatusKey(a.status) === 'completed'
  const isProgress = normalizeStatusKey(a.status) === 'in_progress'

  const priorityShape: Record<string, string> = {
    high: '◆',
    tinggi: '◆',
    medium: '◇',
    sedang: '◇',
    low: '△',
    rendah: '△',
  }

  const completedChecklist = a.checklist?.filter((c) => c.isCompleted).length ?? 0
  const totalChecklist = a.checklist?.length ?? 0
  const deadlineDatePart = Array.isArray(a.deadline) ? a.deadline[0] : a.deadline.split('T')[0]
  const deadlineTimePart = Array.isArray(a.deadline) ? a.deadline[1] : a.deadline.split('T')[1]?.substring(0, 5) || '00:00'

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
            <span
              className="text-xs text-fg-subtle font-mono"
              title={`Prioritas: ${a.priority}`}
            >
              {priorityShape[a.priority] ?? '◇'} {a.priority}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {a.subject && <span className="text-xs text-fg-subtle">{a.subject}</span>}
            {a.location && (
              <span className="text-xs text-fg-subtle flex items-center gap-1">
                <MapPin size={11} />
                {a.location}
              </span>
            )}
            <span className="text-xs text-fg-subtle flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(parseISO(deadlineDatePart))} pukul {deadlineTimePart}
            </span>
            {deadlineLabel && !isDone && (
              <span className="text-xs font-medium flex items-center gap-1 text-fg">
                {deadlineLabel === 'terlambat' ? (
                  <>
                    <AlertTriangle size={11} /> Terlambat
                  </>
                ) : deadlineLabel === 'hari-ini' ? (
                  <>
                    <Clock size={11} /> Hari ini
                  </>
                ) : (
                  <>
                    <Calendar size={11} /> Besok
                  </>
                )}
              </span>
            )}
          </div>

          {/* Status badge + checklist info */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full border',
                isDone
                  ? 'bg-invert text-invert border-transparent'
                  : isProgress
                  ? 'border-border-strong text-fg'
                  : 'border-dashed border-border-strong text-fg-muted',
              )}
            >
              {STATUS_LABELS[a.status] ?? a.status}
            </span>

            {totalChecklist > 0 && (
              <span className="text-xs text-fg-subtle flex items-center gap-1">
                <ListTodo size={12} />
                {completedChecklist}/{totalChecklist} checklist
              </span>
            )}

            {a.references && a.references.length > 0 && (
              <span className="text-xs text-fg-subtle flex items-center gap-1">
                <ExternalLink size={12} />
                {a.references.length} referensi
              </span>
            )}
          </div>

          {a.description && (
            <p className="text-xs text-fg-subtle mt-1.5 line-clamp-2">
              {a.description}
            </p>
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
  const getInitialDate = () => {
    if (!defaultValues) return ''
    if (Array.isArray(defaultValues.deadline)) return defaultValues.deadline[0] || ''
    return defaultValues.deadline.split('T')[0] || defaultValues.deadline
  }

  const getInitialTime = () => {
    if (!defaultValues) return '23:59'
    if (Array.isArray(defaultValues.deadline)) return defaultValues.deadline[1] || '23:59'
    return defaultValues.deadline.split('T')[1]?.substring(0, 5) || '23:59'
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: defaultValues
      ? {
          title: defaultValues.title,
          subject: defaultValues.subject ?? '',
          deadlineDate: getInitialDate(),
          deadlineTime: getInitialTime(),
          priority: (normalizePriorityKey(defaultValues.priority) as 'high' | 'medium' | 'low') ?? 'medium',
          status: (normalizeStatusKey(defaultValues.status) as 'pending' | 'in_progress' | 'completed') ?? 'pending',
          location: defaultValues.location ?? '',
          description: defaultValues.description ?? defaultValues.notes ?? '',
        }
      : {
          title: '',
          subject: '',
          priority: 'medium',
          status: 'pending',
          deadlineDate: '',
          deadlineTime: '23:59',
          location: '',
          description: '',
        },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Input
        label="Judul Tugas (min. 5 karakter)"
        placeholder="cth. Mengerjakan Backend API Porto"
        error={errors.title?.message}
        {...register('title')}
      />

      <Textarea
        label="Deskripsi (min. 10 karakter)"
        placeholder="cth. Membuat dokumentasi dan fitur assignment dashboard personal"
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Lokasi (min. 5 karakter)"
          placeholder="cth. Jakarta Selatan"
          error={errors.location?.message}
          {...register('location')}
        />
        <Input
          label="Mata Kuliah / Kategori (opsional)"
          placeholder="cth. Basis Data"
          error={errors.subject?.message}
          {...register('subject')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Tanggal Deadline"
          type="text"
          placeholder="cth. 2026-10-05"
          error={errors.deadlineDate?.message}
          {...register('deadlineDate')}
        />
        <Input
          label="Jam Deadline"
          type="text"
          placeholder="cth. 23:59"
          error={errors.deadlineTime?.message}
          {...register('deadlineTime')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Prioritas"
          error={errors.priority?.message}
          options={[
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
          {...register('priority')}
        />
        <Select
          label="Status"
          error={errors.status?.message}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ]}
          {...register('status')}
        />
      </div>

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
