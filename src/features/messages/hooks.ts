import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMessagesApi, getMessageDetailApi, deleteMessageApi } from './api'
import { markRead, removeFromStorage } from './messageState'
import { useToast } from '@/components/ui/ToastContext'

export const messageKeys = {
  all: ['messages'] as const,
  list: () => [...messageKeys.all, 'list'] as const,
  detail: (id: string) => [...messageKeys.all, 'detail', id] as const,
}

export function useMessages() {
  return useQuery({
    queryKey: messageKeys.list(),
    queryFn: getMessagesApi,
    select: (data) => data.data,
    staleTime: 1000 * 60 * 2,
  })
}

export function useMessage(id: string | null) {
  return useQuery({
    queryKey: messageKeys.detail(id ?? ''),
    queryFn: () => getMessageDetailApi(id!),
    enabled: !!id,
    select: (data) => data.data,
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: deleteMessageApi,
    onSuccess: (_, id) => {
      removeFromStorage(id)
      queryClient.invalidateQueries({ queryKey: messageKeys.list() })
      addToast({ message: 'Pesan berhasil dihapus', type: 'success' })
    },
    onError: (err: { message?: string }) => {
      addToast({ message: err.message ?? 'Gagal menghapus pesan', type: 'error' })
    },
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      markRead(id)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list() })
    },
  })
}
