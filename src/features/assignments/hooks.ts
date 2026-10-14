import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAssignmentsApi,
  createAssignmentApi,
  updateAssignmentApi,
  deleteAssignmentApi,
} from './api'
import type { CreateAssignmentPayload, UpdateAssignmentPayload } from './types'
import { useToast } from '@/components/ui/ToastContext'

export const assignmentKeys = {
  all: ['assignments'] as const,
  list: () => [...assignmentKeys.all, 'list'] as const,
}

export function useAssignments() {
  return useQuery({
    queryKey: assignmentKeys.list(),
    queryFn: getAssignmentsApi,
    select: (data) => data.data,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: createAssignmentApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list() })
      addToast({ message: data.message, type: 'success' })
    },
    onError: (err: { message?: string }) => {
      addToast({ message: err.message ?? 'Gagal menambahkan tugas', type: 'error' })
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAssignmentPayload }) =>
      updateAssignmentApi(id, payload),
    // Optimistic update
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: assignmentKeys.list() })
      const previous = queryClient.getQueryData(assignmentKeys.list())
      queryClient.setQueryData(
        assignmentKeys.list(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((a: { _id: string }) =>
              a._id === id ? { ...a, ...payload } : a,
            ),
          }
        },
      )
      return { previous }
    },
    onError: (err: { message?: string }, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(assignmentKeys.list(), context.previous)
      }
      addToast({ message: err.message ?? 'Gagal memperbarui tugas', type: 'error' })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list() })
      addToast({ message: data.message, type: 'success' })
    },
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: deleteAssignmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list() })
      addToast({ message: 'Tugas berhasil dihapus', type: 'success' })
    },
    onError: (err: { message?: string }) => {
      addToast({ message: err.message ?? 'Gagal menghapus tugas', type: 'error' })
    },
  })
}

export function useToggleAssignmentDone() {
  const updateAssignment = useUpdateAssignment()
  return {
    ...updateAssignment,
    mutate: (
      args: Parameters<typeof updateAssignment.mutate>[0],
      options?: Parameters<typeof updateAssignment.mutate>[1],
    ) => updateAssignment.mutate(args, options),
  }
}

// Type export for form submission
export type { CreateAssignmentPayload, UpdateAssignmentPayload }
