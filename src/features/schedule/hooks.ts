import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getScheduleApi, createScheduleApi, deleteScheduleApi } from './api'
import type { CreateSchedulePayload } from './types'
import { useToast } from '@/components/ui/ToastContext'

export const scheduleKeys = {
  all: ['schedule'] as const,
  list: () => [...scheduleKeys.all, 'list'] as const,
}

export function useSchedule() {
  return useQuery({
    queryKey: scheduleKeys.list(),
    queryFn: getScheduleApi,
    select: (data) => data.data,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) => createScheduleApi(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list() })
      addToast({ message: data.message, type: 'success' })
    },
    onError: (err: { message?: string }) => {
      addToast({ message: err.message ?? 'Gagal menambahkan agenda', type: 'error' })
    },
  })
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: deleteScheduleApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list() })
      addToast({ message: 'Agenda berhasil dihapus', type: 'success' })
    },
    onError: (err: { message?: string }) => {
      addToast({ message: err.message ?? 'Gagal menghapus agenda', type: 'error' })
    },
  })
}
