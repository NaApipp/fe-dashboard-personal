import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Trash2,
  Archive,
  RotateCcw,
  Mail,
  MailOpen,
  ChevronRight,
  X,
} from 'lucide-react'
import { useMessages, useDeleteMessage, useMarkRead } from '@/features/messages/hooks'
import {
  getReadIds,
  getArchivedIds,
  toggleArchive,
  markRead,
  markUnread,
} from '@/features/messages/messageState'
import { formatRelative, formatDateTime } from '@/lib/utils/date'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import type { Message } from '@/features/messages/types'

type FilterStatus = 'semua' | 'belum-dibaca' | 'sudah-dibaca' | 'diarsipkan'

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('semua')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'))
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [, forceUpdate] = useState(0)

  const { data: messages, isLoading, error, refetch } = useMessages()
  const deleteMutation = useDeleteMessage()
  const markReadMutation = useMarkRead()

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Auto-open from URL param
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) setSelectedId(id)
  }, [searchParams])

  // Mark as read when opening
  const prevSelectedId = useRef<string | null>(null)
  useEffect(() => {
    if (selectedId && selectedId !== prevSelectedId.current) {
      prevSelectedId.current = selectedId
      const readIds = getReadIds()
      if (!readIds.has(selectedId)) {
        markRead(selectedId)
        markReadMutation.mutate(selectedId)
        forceUpdate((n) => n + 1)
      }
    }
  }, [selectedId, markReadMutation])

  const readIds = getReadIds()
  const archivedIds = getArchivedIds()

  const filteredMessages = useMemo(() => {
    if (!messages) return []
    return messages.filter((m) => {
      // Search
      if (
        debouncedSearch &&
        !m.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
        !m.message.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) {
        return false
      }

      // Date range
      if (filterFrom) {
        const msgDate = m.date.split('T')[0]
        if (msgDate && msgDate < filterFrom) return false
      }
      if (filterTo) {
        const msgDate = m.date.split('T')[0]
        if (msgDate && msgDate > filterTo) return false
      }

      // Status
      const isRead = readIds.has(m._id)
      const isArchived = archivedIds.has(m._id)

      if (filterStatus === 'diarsipkan') return isArchived
      if (filterStatus === 'belum-dibaca') return !isRead && !isArchived
      if (filterStatus === 'sudah-dibaca') return isRead && !isArchived
      return !isArchived // 'semua' hides archived
    })
  }, [messages, debouncedSearch, filterFrom, filterTo, filterStatus, readIds, archivedIds])

  const selectedMessage = messages?.find((m) => m._id === selectedId) ?? null

  const handleToggleArchive = (id: string) => {
    toggleArchive(id)
    if (selectedId === id) setSelectedId(null)
    forceUpdate((n) => n + 1)
    markReadMutation.mutate(id) // refresh list
  }

  const handleToggleRead = (id: string) => {
    const readIds2 = getReadIds()
    if (readIds2.has(id)) {
      markUnread(id)
    } else {
      markRead(id)
    }
    forceUpdate((n) => n + 1)
    markReadMutation.mutate(id)
  }

  const handleDelete = (id: string) => {
    setDeleteTargetId(id)
  }

  const confirmDelete = () => {
    if (!deleteTargetId) return
    deleteMutation.mutate(deleteTargetId, {
      onSuccess: () => {
        if (selectedId === deleteTargetId) setSelectedId(null)
        setDeleteTargetId(null)
      },
    })
  }

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: 'semua', label: 'Semua' },
    { value: 'belum-dibaca', label: 'Belum dibaca' },
    { value: 'sudah-dibaca', label: 'Sudah dibaca' },
    { value: 'diarsipkan', label: 'Diarsipkan' },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-fg">Pesan</h1>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            placeholder="Cari nama atau isi pesan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-base bg-surface pl-9 pr-4 py-2 text-sm text-fg placeholder:text-fg-placeholder focus:outline-none focus:ring-2 focus:ring-fg"
          />
        </div>

        {/* Status filter + Date range */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 flex-wrap">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  filterStatus === opt.value
                    ? 'bg-invert text-invert border-transparent'
                    : 'border-base text-fg-muted hover:text-fg hover:bg-surface-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              aria-label="Filter dari tanggal"
              className="rounded-lg border border-base bg-surface px-2 py-1 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-fg"
            />
            <span className="text-xs text-fg-subtle">–</span>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              aria-label="Filter sampai tanggal"
              className="rounded-lg border border-base bg-surface px-2 py-1 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-fg"
            />
            {(filterFrom || filterTo) && (
              <button
                onClick={() => { setFilterFrom(''); setFilterTo('') }}
                aria-label="Hapus filter tanggal"
                className="p-1 text-fg-subtle hover:text-fg"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-4" style={{ minHeight: '500px' }}>
        {/* Message List */}
        <div className={cn('flex-1 min-w-0', selectedMessage ? 'hidden lg:block lg:w-80 lg:flex-none' : '')}>
          {isLoading ? (
            <ListSkeleton count={5} />
          ) : error ? (
            <ErrorState message="Gagal memuat pesan" onRetry={() => void refetch()} />
          ) : filteredMessages.length === 0 ? (
            <EmptyState
              title="Tidak ada pesan"
              description={search ? 'Tidak ada pesan yang cocok dengan pencarian' : 'Kotak masuk kosong'}
            />
          ) : (
            <div className="space-y-1.5">
              {filteredMessages.map((msg) => (
                <MessageListItem
                  key={msg._id}
                  message={msg}
                  isRead={readIds.has(msg._id)}
                  isArchived={archivedIds.has(msg._id)}
                  isSelected={selectedId === msg._id}
                  onSelect={() => {
                    setSelectedId(msg._id)
                    setSearchParams({ id: msg._id })
                  }}
                  onDelete={() => handleDelete(msg._id)}
                  onToggleArchive={() => handleToggleArchive(msg._id)}
                  onToggleRead={() => handleToggleRead(msg._id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Message Detail */}
        {selectedMessage && (
          <div className={cn('lg:flex-1', 'block w-full lg:w-auto')}>
            <MessageDetail
              message={selectedMessage}
              isRead={readIds.has(selectedMessage._id)}
              isArchived={archivedIds.has(selectedMessage._id)}
              onClose={() => {
                setSelectedId(null)
                setSearchParams({})
              }}
              onDelete={() => handleDelete(selectedMessage._id)}
              onToggleArchive={() => handleToggleArchive(selectedMessage._id)}
              onToggleRead={() => handleToggleRead(selectedMessage._id)}
            />
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Hapus Pesan"
        description="Pesan yang dihapus tidak bisa dikembalikan. Lanjutkan?"
        confirmLabel="Hapus"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function MessageListItem({
  message,
  isRead,
  isArchived,
  isSelected,
  onSelect,
  onDelete,
  onToggleArchive,
  onToggleRead,
}: {
  message: Message
  isRead: boolean
  isArchived: boolean
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onToggleArchive: () => void
  onToggleRead: () => void
}) {
  return (
    <div
      className={cn(
        'group relative rounded-lg border transition-all cursor-pointer',
        isSelected
          ? 'border-fg bg-surface-muted'
          : 'border-base bg-surface hover:bg-surface-subtle hover:border-border-strong',
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Read indicator */}
        <div
          className={cn(
            'mt-1.5 h-2 w-2 rounded-full shrink-0 transition-all',
            isRead ? 'border border-border-strong bg-transparent' : 'bg-fg',
          )}
          aria-label={isRead ? 'Sudah dibaca' : 'Belum dibaca'}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className={cn('text-sm truncate', isRead ? 'text-fg-muted' : 'text-fg font-semibold')}>
              {message.name}
            </p>
            <span className="text-xs text-fg-subtle shrink-0">{formatRelative(message.date)}</span>
          </div>
          <p className="text-xs text-fg-subtle truncate mt-0.5">{message.message}</p>
          {isArchived && (
            <span className="inline-flex items-center gap-1 text-xs text-fg-subtle mt-1">
              <Archive size={10} /> Diarsipkan
            </span>
          )}
        </div>

        <ChevronRight size={14} className="text-fg-subtle shrink-0 mt-1" />
      </div>

      {/* Hover actions */}
      <div
        className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onToggleRead}
          aria-label={isRead ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
          title={isRead ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
          className="p-1 rounded text-fg-subtle hover:text-fg hover:bg-surface-emphasis transition-colors"
        >
          {isRead ? <Mail size={13} /> : <MailOpen size={13} />}
        </button>
        <button
          onClick={onToggleArchive}
          aria-label={isArchived ? 'Batal arsip' : 'Arsipkan'}
          title={isArchived ? 'Batal arsip' : 'Arsipkan'}
          className="p-1 rounded text-fg-subtle hover:text-fg hover:bg-surface-emphasis transition-colors"
        >
          {isArchived ? <RotateCcw size={13} /> : <Archive size={13} />}
        </button>
        <button
          onClick={onDelete}
          aria-label="Hapus pesan"
          title="Hapus pesan"
          className="p-1 rounded text-fg-subtle hover:text-fg hover:bg-surface-emphasis transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function MessageDetail({
  message,
  isRead,
  isArchived,
  onClose,
  onDelete,
  onToggleArchive,
  onToggleRead,
}: {
  message: Message
  isRead: boolean
  isArchived: boolean
  onClose: () => void
  onDelete: () => void
  onToggleArchive: () => void
  onToggleRead: () => void
}) {
  return (
    <div className="rounded-xl border border-base bg-surface h-full animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-base">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            aria-label="Tutup detail pesan"
            className="lg:hidden p-1 rounded text-fg-muted hover:text-fg hover:bg-surface-muted"
          >
            <X size={16} />
          </button>
          <span className="text-sm font-semibold text-fg">Detail Pesan</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleRead}
            aria-label={isRead ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
          >
            {isRead ? <Mail size={14} /> : <MailOpen size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleArchive}
            aria-label={isArchived ? 'Batal arsip' : 'Arsipkan'}
          >
            {isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            aria-label="Hapus pesan"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-fg">{message.name}</h2>
          <a
            href={`mailto:${message.email}`}
            className="text-sm text-fg-muted hover:text-fg underline-offset-2 hover:underline"
          >
            {message.email}
          </a>
        </div>

        <div className="text-xs text-fg-subtle">
          {formatDateTime(message.date)}
        </div>

        <div className="border-t border-base pt-4">
          <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{message.message}</p>
        </div>
      </div>
    </div>
  )
}
